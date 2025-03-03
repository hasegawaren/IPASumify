from fastapi import APIRouter

extraction_router = APIRouter()

@extraction_router.get("/fetch-wikipedia")
def fetch_wikipedia(topic: str):
    # ส่งค่าจำลองกลับไป
    return {
        "content": f"นี่คือเนื้อหาจำลองจาก Wikipedia ในหัวข้อ: {topic}"
    }

@extraction_router.post("/upload-pdf")
def upload_pdf(file_path: str):
    # ส่งค่าจำลองกลับไป
    return {
        "content": f"เนื้อหาจาก PDF จำลองในไฟล์: {file_path}"
    }
