import os
import json
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai 

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("KRİTİK HATA: .env dosyasında GOOGLE_API_KEY bulunamadı!")


client = genai.Client(api_key=API_KEY)

app = FastAPI()

class TaskRequest(BaseModel):
    text: str
    image_base64: Optional[str] = None

class TaskItem(BaseModel):
    task: str
    category: str
    date: str

class TaskResponse(BaseModel):
    extracted_tasks: List[TaskItem]

class CoachRequest(BaseModel):
    tasks: List[dict]

class SplitRequest(BaseModel):
    main_task: str
    category: str

def clean_json_string(json_str):
    try:

        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        return json_str.strip()
    except Exception:
        return json_str

@app.post("/analyze-mixed")
async def analyze_mixed(request: TaskRequest):
    prompt_instruction = """
    Sen profesyonel bir proje yöneticisisin.
    Kullanıcının girdiği metni analiz et ve net, uygulanabilir görevlere dönüştür.
    
    Çıktıyı SADECE şu JSON formatında ver, başka hiçbir şey yazma:
    {
      "extracted_tasks": [
        {
          "task": "Görev başlığı (Kısa ve net)",
          "category": "Kategori (İş, Okul, Kişisel, Proje vb.)",
          "date": "Tarih (Yarın, Haftaya, 24 Kasım gibi formatlarda)"
        }
      ]
    }
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt_instruction, request.text]
        )
        
        cleaned_json = clean_json_string(response.text)
        return json.loads(cleaned_json)
    
    except Exception as e:
        print(f"Hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/coach-me")
async def coach_me(request: CoachRequest):
    tasks_str = json.dumps(request.tasks, ensure_ascii=False)
    
    prompt = f"""
    Aşağıda kullanıcının görev listesi var. Acımasız, sert ama motive edici bir koç gibi davran.
    Kullanıcıya tek bir paragrafta, durumu özetleyen ve harekete geçiren bir tokat gibi tavsiye ver.
    Sen "Vira Flow"sun.
    
    Görevler: {tasks_str}
    
    Yanıt (Sadece tavsiye metni):
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return {"advice": response.text.strip()}
    except Exception as e:
        return {"advice": "Şu an bağlantımda sorun var, ama sen çalışmaya devam et!", "error": str(e)}

@app.post("/decompose-task")
async def decompose_task(request: SplitRequest):
    prompt = f"""
    Görevi: "{request.main_task}" (Kategori: {request.category})
    
    Bu görevi tamamlamak için gereken alt adımları (3-5 adım) çıkar.
    Çıktı JSON formatı:
    {{
      "extracted_tasks": [
         {{ "task": "Alt görev 1", "category": "{request.category}", "date": "" }},
         {{ "task": "Alt görev 2", "category": "{request.category}", "date": "" }}
      ]
    }}
    Sadece JSON ver.
    """
    
    try:
        # YENİ SDK KULLANIMI
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        cleaned = clean_json_string(response.text)
        return json.loads(cleaned)
    except Exception as e:
        return {"extracted_tasks": [], "error": str(e)}

@app.get("/")
def home():
    return {"status": "Vira Flow Brain is Active", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)