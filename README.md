ตั้งค่า Backend (FastAPI):
   ```bash
   cd backend
   python -m venv .venv            # สร้าง Virtual Environment
   source .venv/bin/activate       # สำหรับ macOS/Linux
   .\.venv\Scripts\activate        # สำหรับ Windows
   .\.venv\Scripts\Activate.ps1    # สำหรับ PowerShell
   pip install -r requirements.txt # ติดตั้ง Dependencies
   uvicorn app.main:app --reload   # รันเซิร์ฟเวอร์
   ```

ตั้งค่า Frontend (Next.js):
   ```bash
   cd frontend
   npm install                     # ติดตั้ง Dependencies
   npm run dev                     # รันเซิร์ฟเวอร์
   ```

เข้าถึงระบบ:
Frontend: http://localhost:3000
(สำหรับการใช้งานหน้าเว็บของระบบ)
Backend (Swagger API): http://localhost:8000/docs
(สำหรับตรวจสอบและทดสอบ API ผ่าน Swagger UI)

