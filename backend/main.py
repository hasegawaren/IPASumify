from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ตั้งค่า CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ระบุโดเมนของ Frontend
    allow_credentials=True,
    allow_methods=["*"],  # อนุญาตทุก Method เช่น GET, POST
    allow_headers=["*"],  # อนุญาตทุก Header
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/ping")
def ping():
    return {"message": "Pong!"}
