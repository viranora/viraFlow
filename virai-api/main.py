import os
import json
import base64
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

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
    # PROMPT ARTIK İNGİLİZCE
    prompt_instruction = """
    You are a professional project manager.
    Analyze the incoming text or image and convert it into clear, actionable tasks.
    
    Output ONLY in the following JSON format, do not write anything else:
    {
      "extracted_tasks": [
        {
          "task": "Task title (Short and clear)",
          "category": "Category (Work, School, Personal, Project etc.)",
          "date": "Date (If present in text/image, otherwise leave empty)"
        }
      ]
    }
    """
    
    contents = [prompt_instruction, request.text]

    if request.image_base64:
        try:
            if "base64," in request.image_base64:
                image_data = request.image_base64.split("base64,")[1]
            else:
                image_data = request.image_base64
            
            image_bytes = base64.b64decode(image_data)
            image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
            contents.append(image_part)
            
        except Exception as e:
            print(f"Image processing error: {e}")

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=contents
        )
        
        cleaned_json = clean_json_string(response.text)
        return json.loads(cleaned_json)
    
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"status": "Vira Flow Brain Active", "version": "1.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)