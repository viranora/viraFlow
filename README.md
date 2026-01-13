# 🧠 ViraFlow: AI-Powered Intelligent Task Manager

**ViraFlow**, dağınık düşünceleri ve karmaşık proje hedeflerini yönetilebilir, net görevlere dönüştüren yeni nesil bir üretkenlik asistanıdır. **Google Gemini 2.5** teknolojisi ile güçlendirilmiş olup, sadece görevleri listelemez; onları analiz eder, önceliklendirir ve sizi motive eder.

---

## 🚀 Features

* **Natural Language Analysis:** Converts messy brain dumps (e.g., "Meeting tomorrow and need to buy milk") into structured JSON tasks with categories and dates using **Gemini 2.5 Flash**.
* **AI Coaching (Vira Flow Persona):** Analyzes your current workload and provides "tough love" style motivational advice to keep you moving.
* **Smart Decomposition:** Breaks down complex, intimidating goals into small, actionable sub-tasks automatically.
* **Modern Tech Stack:** High-performance Python backend (FastAPI) and Native Mobile experience.

## 🛠 Tech Stack

* **Backend:** Python 3.13+, FastAPI, Uvicorn
* **AI Engine:** Google Gemini 2.5 Flash (`google-genai` SDK v1.0)
* **Mobile:** React Native (iOS & Android)
* **Deployment:** Render (Backend)

---

## ⚙️ Installation & Setup

### 1. Backend (API) Setup

 Clone the repository
 
git clone [https://github.com/YOUR_USERNAME/viraFlow.git](https://github.com/YOUR_USERNAME/viraFlow.git)
cd viraFlow/virai-api

 Create a virtual environment
 
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

 Install dependencies
 
pip install -r requirements.txt

 Create .env file and add your Google API Key
 
echo "GOOGLE_API_KEY=AIzaSy..." > .env

 Run the server
 
uvicorn main:app --reload

### 2. Mobile App Setup

Bash
cd ../virai-mobile

 Install dependencies
 
npm install

 For iOS (Mac only)
 
cd ios && pod install && cd ..

 Run the app
 
npm start
 Press 'i' for iOS simulator or 'a' for Android emulator

### API Endpoints

Method,Endpoint,Description
POST,/analyze-mixed,Converts unstructured text into a JSON task list.
POST,/coach-me,Provides AI-driven motivational feedback based on tasks.
POST,/decompose-task,Breaks a main task into 3-5 sub-steps.

Sema - Computer Engineer & AI Developer
