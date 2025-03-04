# main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import io
import re

from PyPDF2 import PdfReader
from app.services.wiki_scraper import get_wikipedia_summary_from_url

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_pdf_text(raw_text: str) -> str:
    """ฟังก์ชันทำความสะอาดข้อความจาก PDF เบื้องต้น"""
    text = raw_text.replace("\u0000", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

@app.post("/api/debug-summarize")
async def debug_summarize(
    input_type: str = Form(...),  
    user_text: str = Form(...),   
    pdf_file: Optional[UploadFile] = File(None), 
    wiki_url: Optional[str] = Form(None)  
):
    """
    Endpoint เดียว รองรับ 3 รูปแบบ:
      1) input_type="text" -> ส่ง text ทาง user_text ได้เลย
      2) input_type="pdf"  -> อัปโหลดไฟล์ pdf_file ด้วย + มี user_text
      3) input_type="wiki" -> ส่ง wiki_url มา + มี user_text
    """

    article_text = "" 

    try:
        if input_type == "text":
            article_text = user_text

        elif input_type == "pdf":
            if not pdf_file:
                raise HTTPException(status_code=400, detail="No PDF file uploaded.")

            content = await pdf_file.read()
            pdf_reader = PdfReader(io.BytesIO(content))

            raw_text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text() or ""
                raw_text += page_text + "\n"

            # ทำความสะอาด
            article_text = clean_pdf_text(raw_text)

        elif input_type == "wiki":
            if not wiki_url:
                raise HTTPException(status_code=400, detail="No wiki_url provided.")
            result = get_wikipedia_summary_from_url(wiki_url)
            if "error" in result:
                raise HTTPException(status_code=404, detail=result["error"])
            article_text = result["content"]

        else:
            raise HTTPException(status_code=400, detail="Invalid input_type. Use text/pdf/wiki")

        final_text = f"คุณคือผู้เชี่ยวชาญในการสรุปข้อมูลและเรียบเรียงข้อความให้อ่านง่าย จากเนื้อหาด้านล่างนี้\n {article_text}\n\nสรุป: {user_text}"

        return {
            "input_type": input_type,
            "article_text_len": len(article_text),
            "final_text": final_text[:35000],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
