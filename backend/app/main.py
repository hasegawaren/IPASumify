from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
import io
import re
import httpx
import os
import logging
import tiktoken
from PyPDF2 import PdfReader
from app.services.wiki_scraper import get_wikipedia_summary_from_url
from dotenv import load_dotenv
import uuid

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

# เก็บบริบทของผู้ใช้ในหน่วยความจำ (ในตัวอย่างนี้ใช้ dict)
sessions: Dict[str, Dict] = {}

# ขีดจำกัด token สำหรับ DeepSeek API (กำหนดตามเอกสาร API หรือทดสอบ)
MAX_TOKENS = 4000  # ปรับตามขีดจำกัดของ DeepSeek API

def clean_pdf_text(raw_text: str) -> str:
    """ฟังก์ชันทำความสะอาดข้อความจาก PDF เบื้องต้น"""
    text = raw_text.replace("\u0000", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def count_tokens(text: str) -> int:
    """นับจำนวน token ในข้อความ"""
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)
    return len(tokens)

def truncate_text(text: str, max_tokens: int) -> str:
    """ตัดข้อความให้เหลือจำนวน token ที่กำหนด"""
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)
    if len(tokens) <= max_tokens:
        return text
    truncated_tokens = tokens[:max_tokens]
    return encoding.decode(truncated_tokens)

def split_text_into_chunks(text: str, max_tokens: int = 2500) -> List[str]:
    """แบ่งข้อความเป็นชิ้น ๆ โดยอิงจากจำนวน token"""
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
    return chunks

async def get_deepseek_response(messages: List[Dict[str, str]]) -> str:
    """เรียก API ของ DeepSeek เพื่อรับคำตอบ"""
    deepseek_api_url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
    }

    logging.info("🔄 Calling DeepSeek API...")
    logging.debug(f"📡 Request Payload: {payload}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(deepseek_api_url, json=payload, headers=headers)
            response.raise_for_status()
            response_data = response.json()

            logging.info("✅ DeepSeek API Response Received")
            logging.debug(f"📡 DeepSeek Response Data: {response_data}")

            if not isinstance(response_data, dict):
                raise ValueError("Invalid response format: response is not a dictionary")
            
            choices = response_data.get("choices")
            if not choices or not isinstance(choices, list):
                raise ValueError("Invalid response format: 'choices' not found or not a list")

            first_choice = choices[0]
            if not isinstance(first_choice, dict):
                raise ValueError("Invalid response format: first choice is not a dictionary")

            message = first_choice.get("message")
            if not isinstance(message, dict):
                raise ValueError("Invalid response format: 'message' not found or not a dictionary")

            content = message.get("content")
            if content is None:
                raise ValueError("Invalid response format: 'content' not found in message")

            logging.info("✅ DeepSeek API Response Processed Successfully")
            return content
    except httpx.HTTPStatusError as e:
        logging.error(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
        error_detail = e.response.json().get("error", str(e))
        raise HTTPException(status_code=400, detail=f"DeepSeek API error: {error_detail}")
    except httpx.RequestError as e:
        logging.error(f"❌ Network Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logging.error(f"❌ Unexpected Error in get_deepseek_response: {type(e).__name__}: {str(e)}")
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

    # สร้าง session_id ถ้ายังไม่มี
    if not session_id:
        session_id = str(uuid.uuid4())
        logging.info(f"🆕 Created new session_id: {session_id}")
    
    if session_id not in sessions:
        sessions[session_id] = {"context": None, "summary": None}

    article_text = ""
    try:
        if input_type == "text":
            logging.info("📝 Processing Text Input")
            article_text = user_text or ""
            logging.debug(f"📜 User Text: {article_text[:200]}...")  # แสดงเฉพาะ 200 ตัวอักษรแรก

        elif input_type == "pdf":
            logging.info("📄 Processing PDF File")
            if not pdf_file:
                logging.error("❌ No PDF file uploaded.")
                raise HTTPException(status_code=400, detail="No PDF file uploaded.")
            try:
                content = await pdf_file.read()
                pdf_reader = PdfReader(io.BytesIO(content))
                raw_text = ""
                for page in pdf_reader.pages:
                    page_text = page.extract_text() or ""
                    raw_text += page_text + "\n"
                article_text = clean_pdf_text(raw_text)
                logging.debug(f"📜 Extracted PDF Text: {article_text[:200]}...")  # แสดงเฉพาะ 200 ตัวอักษรแรก
            except Exception as e:
                logging.error(f"❌ PDF Processing Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

        elif input_type == "wiki":
            logging.info("🌍 Fetching Wikipedia Summary")
            if not wiki_url:
                logging.error("❌ No wiki_url provided.")
                raise HTTPException(status_code=400, detail="No wiki_url provided.")

            try:
                result = get_wikipedia_summary_from_url(wiki_url)
                logging.debug(f"📜 Wikipedia API Response: {result}")

                if "error" in result:
                    logging.error(f"❌ Wikipedia API Error: {result['error']}")
                    raise HTTPException(status_code=404, detail=result["error"])

                article_text = result["content"]
            except Exception as e:
                logging.error(f"❌ Wikipedia Fetch Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error fetching Wikipedia content: {str(e)}")

        else:
            logging.error(f"❌ Invalid input_type: {input_type}")
            raise HTTPException(status_code=400, detail="Invalid input_type. Use text/pdf/wiki")

        # เก็บบริบทใน session
        sessions[session_id]["context"] = article_text

        # แบ่งข้อความเป็นชิ้น ๆ ถ้ายาวเกิน
        chunks = split_text_into_chunks(article_text, max_tokens=2500)
        summaries = []

        for i, chunk in enumerate(chunks):
            logging.info(f"📋 Processing Chunk {i + 1}/{len(chunks)}")
            final_text = f"คุณคือผู้เชี่ยวชาญในการสรุปข้อมูลและเรียบเรียงข้อความให้อ่านง่าย จากเนื้อหาด้านล่างนี้:\n\n{chunk}\n\nโปรดสรุปข้อมูลดังกล่าวให้กระชับและอ่านง่าย"
            messages = [{"role": "user", "content": final_text}]
            summary_result = await get_deepseek_response(messages)
            summaries.append(summary_result)
            logging.info(f"✅ Chunk {i + 1} Summarized: {summary_result[:200]}...")

        # รวมสรุปทั้งหมด
        final_summary = " ".join(summaries)
        sessions[session_id]["summary"] = final_summary
        logging.info("✅ All Chunks Processed and Combined")

        return {
            "session_id": session_id,
            "input_type": input_type,
            "article_text_len": len(article_text),
            "num_chunks": len(chunks),
            "summary": final_summary,
        }
    except Exception as e:
        logging.error(f"❌ Error in summarize: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ปรับปรุง endpoint /api/chat ให้รับ JSON และจัดการข้อความยาว
@app.post("/api/chat")
async def chat(
    payload: Dict = Body(...)
):
    session_id = payload.get("session_id")
    question = payload.get("question")

    if not session_id:
        logging.error("❌ Missing session_id in request.")
        raise HTTPException(status_code=422, detail="Missing session_id in request body.")
    if not question:
        logging.error("❌ Missing question in request.")
        raise HTTPException(status_code=422, detail="Missing question in request body.")

    logging.info(f"📩 Received Chat Request - session_id: {session_id}")

    if session_id not in sessions or not sessions[session_id]["context"]:
        logging.error("❌ No context found for this session.")
        raise HTTPException(status_code=400, detail="No context found. Please summarize a document first.")

    context = sessions[session_id]["context"]
    summary = sessions[session_id]["summary"]

    try:
        # สร้าง prompt ที่รวมบริบทและคำถาม
        prompt_template = (
            "คุณคือผู้ช่วยที่เชี่ยวชาญในการตอบคำถามจากข้อมูล ด้านล่างนี้คือบริบทของข้อมูลที่เกี่ยวข้อง:\n\n"
            "{context}\n\n"
            "และนี่คือบทสรุปของข้อมูล:\n\n"
            "{summary}\n\n"
            "คำถามของผู้ใช้: {question}\n\n"
            "โปรดตอบคำถามโดยอิงจากบริบทและบทสรุปข้างต้นให้ชัดเจนและแม่นยำ"
        )

        # คำนวณจำนวน token ของ prompt เต็ม
        full_prompt = prompt_template.format(context=context, summary=summary, question=question)
        total_tokens = count_tokens(full_prompt)

        if total_tokens > MAX_TOKENS:
            logging.warning(f"⚠️ Prompt exceeds token limit ({total_tokens} > {MAX_TOKENS}). Truncating context and summary.")
            # คำนวณจำนวน token ที่เหลือสำหรับ context และ summary
            fixed_prompt = (
                "คุณคือผู้ช่วยที่เชี่ยวชาญในการตอบคำถามจากข้อมูล ด้านล่างนี้คือบริบทของข้อมูลที่เกี่ยวข้อง:\n\n"
                "\n\n"
                "และนี่คือบทสรุปของข้อมูล:\n\n"
                "\n\n"
                "คำถามของผู้ใช้: " + question + "\n\n"
                "โปรดตอบคำถามโดยอิงจากบริบทและบทสรุปข้างต้นให้ชัดเจนและแม่นยำ"
            )
            fixed_tokens = count_tokens(fixed_prompt)
            available_tokens = MAX_TOKENS - fixed_tokens

            # แบ่ง token ที่เหลือให้ context และ summary (ให้ความสำคัญกับ summary มากกว่า)
            context_tokens = int(available_tokens * 0.3)  # 30% สำหรับ context
            summary_tokens = int(available_tokens * 0.7)  # 70% สำหรับ summary

            truncated_context = truncate_text(context, context_tokens)
            truncated_summary = truncate_text(summary, summary_tokens)

            # สร้าง prompt ใหม่ด้วยข้อมูลที่ตัดแล้ว
            final_text = prompt_template.format(
                context=truncated_context,
                summary=truncated_summary,
                question=question
            )
            logging.info(f"✅ Truncated prompt to {count_tokens(final_text)} tokens.")
        else:
            final_text = full_prompt

        messages = [{"role": "user", "content": final_text}]
        answer = await get_deepseek_response(messages)
        logging.info(f"✅ Chat Answer Generated: {answer[:200]}...")

        return {
            "session_id": session_id,
            "answer": answer,
        }
    except Exception as e:
        logging.error(f"❌ Error in chat: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))