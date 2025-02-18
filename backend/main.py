from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from fastapi.middleware.cors import CORSMiddleware
import re

# โหลดโมเดลที่เลือกใช้
model_name = "drive087/wikinews_mt5-thai-sentence-sum"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# สร้าง API ด้วย FastAPI
app = FastAPI()

# อนุญาตให้ Frontend (Next.js) เรียก API ได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

@app.post("/api/summarize")
def summarize_text_api(input_data: TextInput):
    """ ฟังก์ชันสำหรับสรุปข้อความ """

    word_count = len(input_data.text.split())

    # ปรับขนาดความยาวของผลลัพธ์ให้ยืดหยุ่นตามเนื้อหาต้นฉบับ
    max_new_tokens = min(350, max(120, int(word_count * 0.8)))  # ไม่ให้สั้นเกินไป
    min_length = min(250, max(100, int(word_count * 0.5)))  

    # เข้ารหัสข้อความ
    inputs = tokenizer.encode(
        "summarize: " + input_data.text, 
        return_tensors="pt", 
        max_length=1024,  # ป้องกันปัญหาข้อมูลเกินขนาด
        truncation=True
    )

    # Generate สรุปข้อความที่มีคุณภาพมากขึ้น
    summary_ids = model.generate(
        inputs, 
        max_new_tokens=max_new_tokens,  
        min_length=min_length,  
        num_beams=7,  
        length_penalty=1.5,  # กระตุ้นให้สร้างข้อความที่เหมาะสม
        repetition_penalty=1.2,  # ลดการซ้ำของคำ
        temperature=0.85,  
        top_p=0.92,  
        do_sample=True,  
        early_stopping=True,
        no_repeat_ngram_size=3  
    )

    # แปลงผลลัพธ์กลับเป็นข้อความ
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # ลบ `<extra_id_x>` ออกไป
    summary_clean = re.sub(r"<extra_id_\d+>", "", summary).strip()

    return {"summary": summary_clean}
