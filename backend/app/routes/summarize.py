from fastapi import APIRouter

summarize_router = APIRouter()

@summarize_router.post("/summarize")
def summarize_text(text: str):
    # ส่งค่าจำลองกลับไป
    return {
        "summary": "นี่คือตัวอย่างข้อความสรุปจาก API Placeholder",
        "input_length": len(text),
    }
