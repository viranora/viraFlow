import os
import json
import re
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("CRITICAL ERROR: GOOGLE_API_KEY not found in .env file!")

client = genai.Client(api_key=API_KEY)

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskRequest(BaseModel):
    text: str
    image_base64: Optional[str] = None

class TaskItem(BaseModel):
    task: str
    category: str
    date: str

class TaskResponse(BaseModel):
    extracted_tasks: List[TaskItem]

def mask_sensitive_info(text: str) -> str:
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    text = re.sub(email_pattern, "[EMAIL]", text)
    
    phone_pattern = r'(\+90|0)?\s*(\(\d{3}\)|\d{3})\s*\d{3}\s*\d{2}\s*\d{2}'
    text = re.sub(phone_pattern, "[PHONE]", text)

    number_pattern = r'\b\d{16,}\b'
    text = re.sub(number_pattern, "[SENSITIVE_DATA]", text)
    
    return text

def detect_language(text: str) -> str:
    """Detect if text is English or Turkish"""
    turkish_chars = set('çğıöşüÇĞİÖŞÜ')
    turkish_words = {'ve', 'bir', 'bu', 'için', 'ile', 'olan', 'çok', 'var', 'yok', 'mı', 'mi', 'da', 'de', 'ne', 'şu', 'ama', 'ise'}
    
    # Türkçe karakter kontrolü
    if any(char in turkish_chars for char in text):
        return "Turkish"
    
    # Kelime kontrolü
    words = text.lower().split()
    turkish_word_count = sum(1 for word in words if word in turkish_words)
    
    if turkish_word_count > len(words) * 0.15:
        return "Turkish"
    
    return "English"

@app.post("/analyze-mixed")
@limiter.limit("20/minute")
async def analyze_mixed(request: TaskRequest, req: Request):
    clean_text = mask_sensitive_info(request.text)
    detected_lang = detect_language(clean_text)
    
    # Dile göre prompt ve kategori listesi
    if detected_lang == "English":
        system_instruction = "You are a task extraction assistant. You MUST respond ONLY in ENGLISH. Never use Turkish words."
        categories = "Work, Personal, School, Health, Shopping, Project, Finance, Home, Other"
        user_prompt = f"""Extract tasks from this text in ENGLISH:

{clean_text}

Rules:
- Task titles in ENGLISH only
- Categories in ENGLISH only: {categories}
- Output JSON format"""
    else:
        system_instruction = "Sen bir görev çıkarma asistanısın. SADECE TÜRKÇE cevap vermelisin. Asla İngilizce kelime kullanma."
        categories = "İş, Kişisel, Okul, Sağlık, Alışveriş, Proje, Finans, Ev, Diğer"
        user_prompt = f"""Bu metinden görevleri TÜRKÇE olarak çıkar:

{clean_text}

Kurallar:
- Görev başlıkları sadece TÜRKÇE
- Kategoriler sadece TÜRKÇE: {categories}
- JSON formatında çıktı ver"""

    # JSON Schema tanımla
    response_schema = {
        "type": "object",
        "properties": {
            "extracted_tasks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {"type": "string"},
                        "category": {"type": "string"},
                        "date": {"type": "string"}
                    },
                    "required": ["task", "category", "date"]
                }
            }
        },
        "required": ["extracted_tasks"]
    }

    try:
        # Gemini 2.0 Flash modelini kullan (daha iyi dil kontrolü)
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        
        # JSON parse et
        result = json.loads(response.text)
        return result
    
    except Exception as e:
        print(f"AI Error: {str(e)}")
        # Fallback: Basit görev oluştur
        return {
            "extracted_tasks": [{
                "task": clean_text[:100],
                "category": "Other" if detected_lang == "English" else "Diğer",
                "date": ""
            }]
        }

@app.get("/")
def home():
    return {"status": "Vira Flow Secure Brain Active", "version": "1.2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)