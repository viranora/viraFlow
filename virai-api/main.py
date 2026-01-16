import os
import json
import re
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("CRITICAL ERROR: GOOGLE_API_KEY not found in .env file!")

client = genai.Client(api_key=API_KEY)

app = FastAPI()

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
    clean_text = mask_sensitive_info(request.text)
    
    prompt_instruction = """
    You are a professional project manager.
    Analyze the incoming text and convert it into clear, actionable tasks.
    
    Output ONLY in the following JSON format, do not write anything else:
    {
      "extracted_tasks": [
        {
          "task": "Task title (Short and clear)",
          "category": "Category (Work, School, Personal, Project etc.)",
          "date": "Date (If present in text, otherwise leave empty)"
        }
      ]
    }
    """
    
    full_prompt = f"{prompt_instruction}\n\nUSER INPUT:\n{clean_text}"

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash", 
            contents=full_prompt
        )
        
        cleaned_json = clean_json_string(response.text)
        return json.loads(cleaned_json)
    
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"status": "Vira Flow Secure Brain Active", "version": "1.2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)