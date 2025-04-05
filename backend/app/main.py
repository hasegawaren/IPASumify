from bs4 import BeautifulSoup
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
import io
import re
import httpx
import os
import logging
import pdfplumber
import fitz  
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import uuid
import asyncio
from fastapi import Request

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

if not DEEPSEEK_API_KEY:
    logging.error("DeepSeek API Key is missing! Please set it in the .env file.")
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

def extract_pdf_toc(content: bytes) -> List[Dict[str, str]]:
    pdf_document = fitz.open(stream=content, filetype="pdf")
    toc = pdf_document.get_toc()
    pdf_document.close()
    
    return [{"title": entry[1], "page": entry[2]} for entry in toc] if toc else []

def split_text(text: str, max_tokens: int = 3000) -> List[str]:
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        current_chunk.append(word)
        if len(" ".join(current_chunk)) > max_tokens:
            chunks.append(" ".join(current_chunk))
            current_chunk = []

    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks


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

def get_prompt_prefix(language: str) -> str:
    return (
        "Please summarize this part in English:"
        if language == "en"
        else "โปรดสรุปเนื้อหาส่วนนี้:"
    )

async def get_deepseek_response_batch(chunks: List[str], language: str = "th") -> List[str]:
    prompt_prefix = get_prompt_prefix(language)
    tasks = [
        get_deepseek_response(
            [{"role": "user", "content": f"{prompt_prefix}\n\n{chunk}"}],
            language=language
        ) 
        for chunk in chunks
    ]
    return await asyncio.gather(*tasks)



async def get_deepseek_response(messages: List[Dict[str, str]], language: str = "th") -> str:
    deepseek_api_url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}

    # 🔸 เพิ่ม system message เพื่อบังคับภาษา
    system_message = {
        "role": "system",
        "content": "Please respond only in English." if language == "en" else "โปรดตอบเป็นภาษาไทยเท่านั้น"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [system_message] + messages
    }

    retries = 3
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(deepseek_api_url, json=payload, headers=headers)
                response.raise_for_status()
                response_data = response.json()
                return response_data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            if attempt < retries - 1:
                await asyncio.sleep(3)
            else:
                raise HTTPException(status_code=500, detail=f"DeepSeek API error: {e.response.text}")

async def fetch_wikipedia_content(wiki_url: str, language: str = "th") -> Dict[str, str]:
    try:
        logging.info(f"Fetching Wikipedia URL: {wiki_url}")

        async with httpx.AsyncClient() as client:
            response = await client.get(wiki_url)
            response.raise_for_status()
            html_content = response.text

        soup = BeautifulSoup(html_content, "html.parser")
        paragraphs = [p.get_text().strip() for p in soup.select("div.mw-parser-output > p") if p.get_text().strip()]
        raw_text = " ".join(paragraphs[:15])
        prompt = "Please summarize this into easy-to-read English." if language == "en" else "โปรดสรุปข้อมูลนี้ให้อ่านง่าย"

        summary = await get_deepseek_response([
        {"role": "user", "content": f"{prompt}\n\n{raw_text}"}
        ], language=language)

        formatted_summary = summary.replace("**-", "\n\n**- ").replace("- ", "\n- ")

        return {
            "summary": formatted_summary if formatted_summary else "ไม่สามารถดึงข้อมูลจาก Wikipedia ได้",
            "html": html_content
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Wikipedia content: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.post("/api/summarize")
async def summarize(
    input_type: str = Form(...),
    user_text: Optional[str] = Form(None),
    pdf_file: Optional[UploadFile] = File(None),
    wiki_url: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    language: Optional[str] = Form("th"),
):
    logging.info(f"📩 Received Request - input_type: {input_type}, session_id: {session_id}")

    if not session_id:
        session_id = str(uuid.uuid4())

    if session_id not in sessions:
        sessions[session_id] = {"type": input_type, "data": None, "toc": []}

    summary_text = ""

    if input_type == "text":
        logging.info("Processing Text Input")
        if not user_text:
            raise HTTPException(status_code=400, detail="No text provided.")
        text_chunks = split_text(user_text)
        summaries = await get_deepseek_response_batch(text_chunks, language=language)
        summary_text = "\n\n".join(summaries)
        sessions[session_id]["data"] = user_text
        sessions[session_id]["language"] = language

    elif input_type == "pdf":
        logging.info("Processing PDF File")
        if not pdf_file:
            raise HTTPException(status_code=400, detail="No PDF file uploaded.")
        content = await pdf_file.read()
        extracted_text = await extract_text_from_pdf(content)
        text_chunks = split_text(extracted_text)
        summaries = await get_deepseek_response_batch(text_chunks, language=language)
        summary_text = "\n\n".join(summaries)
        sessions[session_id]["data"] = extracted_text
        sessions[session_id]["language"] = language

    elif input_type == "wiki":
        logging.info(f"Fetching Wikipedia Summary from: {wiki_url}")
        if not wiki_url:
            raise HTTPException(status_code=400, detail="No wiki_url provided.")
        wiki_data = await fetch_wikipedia_content(wiki_url, language=language)
        summary_text = wiki_data["summary"]
        sessions[session_id]["data"] = wiki_data["html"]
        sessions[session_id]["language"] = language

    return {
        "session_id": session_id,
        "summary": summary_text,
        "toc": sessions[session_id].get("toc", [])
    }


@app.post("/api/chat")
async def chat(request: Request):
    req_data = await request.json()

    session_id = req_data.get("session_id")
    question = req_data.get("question")

    if not session_id or not question:
        logging.error("Missing session_id or question!")
        raise HTTPException(status_code=400, detail="session_id and question are required")

    if session_id not in sessions:
        logging.error(f"Session {session_id} not found!")
        raise HTTPException(status_code=400, detail="Session not found.")

    session = sessions[session_id]
    input_type = session.get("type")
    data = session.get("data")
    language = session.get("language", "th")

    if not input_type or not data:
        logging.error(f"No content found for session {session_id}!")
        raise HTTPException(status_code=400, detail="No previous content to reference.")

    logging.info(f"Received /api/chat request - session_id: {session_id}, question: {question}")

    prompt = ""

    if input_type == "text":
        prompt = (
            f"Based on the previously summarized text:\n\n{data}\n\nQuestion: {question}"
            if language == "en"
            else f"เกี่ยวกับข้อความที่สรุปไปก่อนหน้านี้:\n\n{data}\n\nคำถาม: {question}"
        )

    elif input_type == "pdf":
        prompt = (
            f"Based on the PDF content below:\n\n{data[:4000]}\n\nQuestion: {question}"
            if language == "en"
            else f"เกี่ยวกับ PDF นี้:\n\n{data[:4000]}\n\nคำถาม: {question}"
        )

    elif input_type == "wiki":
        html_content = data
        if not html_content:
            raise HTTPException(status_code=400, detail="No Wikipedia content found for this session.")
        
        soup = BeautifulSoup(html_content, "html.parser")
        paragraphs = [p.get_text().strip() for p in soup.select("div.mw-parser-output > p") if p.get_text().strip()]
        full_text = " ".join(paragraphs[:15]) if paragraphs else ""

        prompt = (
            f"Please answer the following question using this Wikipedia content:\n\nQuestion: {question}\n\nWikipedia Content:\n{full_text}"
            if language == "en"
            else f"ช่วยตอบคำถามต่อไปนี้ โดยหาจากใน Wikipedia ที่ให้ไป:\n\nคำถาม: {question}\n\nข้อมูล Wikipedia:\n{full_text}"
        )

    # ส่ง prompt ไปยัง DeepSeek
    response_text = await get_deepseek_response([
        {"role": "user", "content": prompt}
    ], language=language)

    return {"answer": response_text}


@app.get("/api/get_session/{session_id}")
async def get_session(session_id: str):
    """ ดึงข้อมูล session และ wiki_url """
    logging.info(f"📌 Checking session_id: {session_id}")
    logging.info(f"📌 All sessions: {sessions}")

    session = sessions.get(session_id)
    if not session:
        logging.warning(f"⚠️ Session {session_id} not found!")
        raise HTTPException(status_code=404, detail="Session not found")

    wiki_url = session.get("wiki_url", None)
    logging.info(f"📌 Found session - wiki_url: {wiki_url}")

    return {
        "session_id": session_id,
        "wiki_url": wiki_url,
        "summary": session.get("summary", None),
        "toc": session.get("toc", [])
    }
