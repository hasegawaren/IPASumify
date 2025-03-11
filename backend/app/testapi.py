import httpx
import asyncio
import os
from dotenv import load_dotenv

# โหลด environment variables จากไฟล์ .env
load_dotenv()

# ตรวจสอบว่า API key มีหรือไม่
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("❌ DeepSeek API Key is missing! กรุณาใส่ API Key ในไฟล์ .env")

async def test_deepseek_api():
    """
    ฟังก์ชันทดสอบการเรียก API ของ DeepSeek
    """
    deepseek_api_url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "deepseek-chat",  # เปลี่ยนโมเดลตามที่ API รองรับ
        "messages": [{"role": "user", "content": "ทดสอบการเรียก API ว่าทำงานไหม?"}],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:  # ตั้ง timeout 30 วินาที
            response = await client.post(deepseek_api_url, json=payload, headers=headers)
            response.raise_for_status()  # ตรวจสอบว่า status code เป็น 200
            response_data = response.json()
            print("✅ การเรียก API สำเร็จ!")
            print("Response:", response_data)
            return response_data
    except httpx.HTTPStatusError as e:
        print(f"❌ Error: ได้รับ status code {e.response.status_code}")
        print("Response:", e.response.json() if e.response else "No response")
    except httpx.RequestError as e:
        print(f"❌ Error: การเชื่อมต่อล้มเหลว - {str(e)}")
    except Exception as e:
        print(f"❌ Error: เกิดข้อผิดพลาดที่ไม่คาดคิด - {str(e)}")

# รันการทดสอบ
if __name__ == "__main__":
    asyncio.run(test_deepseek_api())