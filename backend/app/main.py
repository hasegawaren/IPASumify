from bs4 import BeautifulSoup
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
import io
import re
import httpx
import os
import logging
import tiktoken
import pdfplumber
import fitz  
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import uuid
import asyncio

# ✅ ตั้งค่า Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

if not DEEPSEEK_API_KEY:
    logging.error("❌ DeepSeek API Key is missing! Please set it in the .env file.")
    raise ValueError("DeepSeek API Key is missing! Please set it in the .env file.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: Dict[str, Dict] = {}
MAX_TOKENS = 4000
MAX_PDF_SIZE_MB = 10

# ✅ ดึงหัวข้อย่อยจาก PDF (Table of Contents)
def extract_pdf_toc(content: bytes) -> List[Dict[str, str]]:
    pdf_document = fitz.open(stream=content, filetype="pdf")
    toc = pdf_document.get_toc()
    pdf_document.close()
    
    return [{"title": entry[1], "page": entry[2]} for entry in toc] if toc else []

# ✅ ใช้ pdfplumber เพื่อดึงข้อความจาก PDF ที่ซับซ้อน
async def extract_text_from_pdf(content: bytes) -> str:
    pdf_reader = PdfReader(io.BytesIO(content))
    extracted_texts = []

    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if not page_text:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                try:
                    page_text = pdf.pages[page.page_number].extract_text()
                except IndexError:
                    page_text = ""
        extracted_texts.append(page_text or "")

    extracted_text = re.sub(r"\s+", " ", " ".join(extracted_texts).strip())
    return extracted_text

# ✅ ใช้ batch processing เพื่อให้ API ทำงานเร็วขึ้น
async def get_deepseek_response_batch(chunks: List[str]) -> List[str]:
    tasks = [
        get_deepseek_response([{"role": "user", "content": f"โปรดสรุปข้อมูลนี้:\n\n{chunk}"}]) 
        for chunk in chunks
    ]
    return await asyncio.gather(*tasks)

async def get_deepseek_response(messages: List[Dict[str, str]]) -> str:
    """เรียก API ของ DeepSeek แบบ async พร้อมเพิ่ม timeout และ retry"""
    deepseek_api_url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "deepseek-chat", "messages": messages}

    retries = 3
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:  # เพิ่ม Timeout เป็น 60 วินาที
                response = await client.post(deepseek_api_url, json=payload, headers=headers)
                response.raise_for_status()
                response_data = response.json()
                return response_data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            if attempt < retries - 1:
                await asyncio.sleep(3)
            else:
                raise HTTPException(status_code=500, detail=f"DeepSeek API error: {e.response.text}")
async def fetch_wikipedia_content(wiki_url: str) -> Dict[str, str]:
    """ 🔹 ดึงข้อมูลจาก Wikipedia พร้อมหัวข้อย่อย (TOC) """
    try:
        parsed_url = httpx.URL(wiki_url)
        domain_parts = parsed_url.host.split(".")
        if len(domain_parts) < 3 or domain_parts[1] != "wikipedia":
            raise ValueError("Invalid Wikipedia URL")

        lang_code = domain_parts[0] if domain_parts[0] != "www" else "en"
        page_title = wiki_url.split("/wiki/")[-1]

        wikipedia_api_url = f"https://{lang_code}.wikipedia.org/wiki/{page_title}"

        async with httpx.AsyncClient() as client:
            response = await client.get(wikipedia_api_url)
            response.raise_for_status()
            html_content = response.text

        # 🔹 ใช้ BeautifulSoup วิเคราะห์ HTML
        soup = BeautifulSoup(html_content, "html.parser")

        # ✅ ดึงเนื้อหาย่อหน้าแรก ๆ
        paragraphs = [p.get_text().strip() for p in soup.select("div.mw-parser-output > p") if p.get_text().strip()]
        summary = " ".join(paragraphs[:3])  # ดึง 3 ย่อหน้าแรก

        # ✅ ดึงหัวข้อย่อย (TOC)
        toc_list = []
        exclude_list = ["สารบัญ", "หมายเหตุ", "ดูเพิ่ม", "อ้างอิง", "แหล่งข้อมูลอื่น"]
        for heading in soup.select("h2, h3"):
            heading_text = heading.get_text().strip().replace("[แก้ไข]", "").replace("[edit]", "")
            if heading_text and heading_text not in exclude_list:
                toc_list.append(heading_text)
                
        return {
            "summary": summary if summary else "ไม่สามารถดึงข้อมูลจาก Wikipedia ได้",
            "toc": toc_list,
            "html": html_content
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Wikipedia content: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    
@app.post("/api/summarize")
async def summarize(
    input_type: str = Form(...),
    user_text: str = Form(None),
    pdf_file: Optional[UploadFile] = File(None),
    wiki_url: Optional[str] = Form(None),
    session_id: str = Form(None)
):
    logging.info(f"📩 Received Request - input_type: {input_type}")

    if not session_id:
        session_id = str(uuid.uuid4())

    if session_id not in sessions:
        sessions[session_id] = {"context": None, "summary": None}

    article_text = ""
    toc = []  # ✅ เก็บหัวข้อย่อย

    if input_type == "text":
        logging.info("📝 Processing Text Input")
        article_text = user_text or ""

    elif input_type == "pdf":
        logging.info("📄 Processing PDF File")
        if not pdf_file:
            raise HTTPException(status_code=400, detail="No PDF file uploaded.")
        
        content = await pdf_file.read()  # ✅ อ่านไฟล์ PDF แค่ครั้งเดียว
        pdf_toc = extract_pdf_toc(content)  # ✅ ดึง TOC จาก PDF
        article_text = await extract_text_from_pdf(content)  # ✅ ดึงข้อความจาก PDF

        # ✅ ถ้ามี TOC ให้รวมเข้าไปใน response
        if pdf_toc:
            toc = [entry["title"] for entry in pdf_toc]
            toc_text = "\n".join([f"{entry['title']} (page {entry['page']})" for entry in pdf_toc])
            article_text = f"🔹 **หัวข้อย่อยใน PDF:**\n{toc_text}\n\n📄 **เนื้อหาจาก PDF:**\n{article_text[:1000]}..."  # ตัดข้อความให้แสดงบางส่วน

    elif input_type == "wiki":
        logging.info(f"🌍 Fetching Wikipedia Summary from: {wiki_url}")
        if not wiki_url:
            raise HTTPException(status_code=400, detail="No wiki_url provided.")
        
        try:
            wiki_data = await fetch_wikipedia_content(wiki_url)  # ✅ ดึงข้อมูล Wikipedia
            article_text = wiki_data["summary"]
            toc = wiki_data["toc"]
            html_content = wiki_data["html"]
            sessions[session_id] = {
            "wiki_url": wiki_url,
            "html": html_content,
            "summary": article_text
        }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching Wikipedia content: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail="Invalid input_type. Use text/pdf/wiki")

    if not article_text.strip():
        raise HTTPException(status_code=400, detail="Extracted text is empty.")

    # ✅ ส่ง summary + TOC กลับไป
    return {
        "session_id": session_id,
        "summary": article_text,
        "toc": toc
    }
@app.post("/api/chat")
async def chat(
    session_id: str = Body(...),
    topic: Optional[str] = Body(None),
    question: Optional[str] = Body(None)
):
    session = sessions.get(session_id)
    if not session or "html" not in session:
        raise HTTPException(status_code=400, detail="Session or HTML content not found.")

    html_content = session["html"]
    soup = BeautifulSoup(html_content, "html.parser")
    content_div = soup.find("div", {"class": "mw-parser-output"})

    if topic:
        target_heading = None
        for heading in content_div.find_all(["h2", "h3"]):
            heading_text = heading.get_text().strip().replace("[แก้ไข]", "").replace("[edit]", "")
            if heading_text == topic:
                target_heading = heading
                break
        else:
            raise HTTPException(status_code=400, detail="ไม่พบหัวข้อที่เลือกในหน้า Wikipedia")

        content = []
        for sibling in target_heading.find_next_siblings():
            if sibling.name in ["h2", "h3"]:
                break
            if sibling.name == "p":
                content.append(sibling.get_text().strip())

        topic_text = " ".join(content).strip()

        if not topic_text:
            topic_text = "ไม่มีเนื้อหาสำหรับหัวข้อนี้"

        answer = await get_deepseek_response([{
            "role": "user",
            "content": f"โปรดสรุปข้อมูลเกี่ยวกับหัวข้อ '{topic}' ต่อไปนี้:\n\n{topic_text}"
        }])

        return {"answer": answer}
