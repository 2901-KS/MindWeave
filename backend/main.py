from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import PyPDF2
from groq import Groq
import json
from datetime import datetime, timedelta
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="MINDWEAVE API",
    description="AI-Powered Study Companion Backend",
    version="2.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Groq
GROQ_API_KEY = "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"
if not GROQ_API_KEY:
    print("⚠ WARNING: GROQ_API_KEY not found!")
else:
    print("✅ Groq API configured!")

client = Groq(api_key=GROQ_API_KEY)

# ---------------- MODELS ----------------
class ExplainRequest(BaseModel):
    topic: str

class Subject(BaseModel):
    name: str
    min_hours_required: float
    deadline: str  # subject-specific deadline (YYYY-MM-DD)

class StudyPlanRequest(BaseModel):
    subjects: List[Subject]
    weekday_hours: float
    weekend_hours: float
    start_date: Optional[str] = None  # Format: YYYY-MM-DD

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    ai_provider: str

# ---------------- HELPERS ----------------
def extract_text_from_pdf(file_path: str) -> str:
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF error: {str(e)}")

async def call_groq(prompt: str, system_instruction: str = None) -> str:
    try:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=3000
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")

async def save_upload_file(upload_file: UploadFile) -> str:
    try:
        file_path = os.path.join(UPLOAD_FOLDER, f"{datetime.now().timestamp()}_{upload_file.filename}")
        with open(file_path, "wb") as buffer:
            content = await upload_file.read()
            buffer.write(content)
        return file_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

def cleanup_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Cleanup error: {str(e)}")

def extract_json_from_response(response_text: str):
    try:
        import re
        json_match = re.search(r'[\[\{].*[\]\}]', response_text, re.DOTALL)
        json_str = json_match.group(0) if json_match else response_text
        return json.loads(json_str)
    except Exception as e:
        raise ValueError(f"JSON parse error: {str(e)}")

def calculate_hours_between(start_date: datetime, end_date: datetime, weekday_hours: float, weekend_hours: float) -> int:
    """Calculate available study hours between two dates."""
    total_hours = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:
            total_hours += weekday_hours
        else:
            total_hours += weekend_hours
        current += timedelta(days=1)
    return total_hours

# ---------------- A* ALLOCATION ----------------
def a_star_allocate(subjects, weekday_hours, weekend_hours, start_date):
    """
    Intelligent allocation with subject-specific deadlines.
    Ensures each day has a mix of at least 2 subjects (if possible).
    """
    schedule = {}
    subj_hours_left = {s.name: s.min_hours_required for s in subjects}
    subj_deadlines = {s.name: datetime.strptime(s.deadline, "%Y-%m-%d") for s in subjects}

    current_date = start_date
    final_deadline = max(subj_deadlines.values())

    while current_date <= final_deadline:
        is_weekend = current_date.weekday() >= 5
        daily_limit = weekend_hours if is_weekend else weekday_hours
        available_time = daily_limit
        day_plan = []

        # Calculate urgency for each subject still pending
        urgency_scores = {}
        for s in subjects:
            if subj_hours_left[s.name] > 0 and current_date <= subj_deadlines[s.name]:
                days_left = max(1, (subj_deadlines[s.name] - current_date).days)
                urgency_scores[s.name] = subj_hours_left[s.name] / days_left

        if not urgency_scores:
            current_date += timedelta(days=1)
            continue

        # Sort by urgency
        sorted_subjects = sorted(urgency_scores.items(), key=lambda x: x[1], reverse=True)

        # Take at least 2 subjects per day (if available)
        if len(sorted_subjects) > 1:
            top_subjects = sorted_subjects[:2]
        else:
            top_subjects = sorted_subjects

        total_urgency = sum(score for _, score in top_subjects)

        for subj_name, score in top_subjects:
            share = (score / total_urgency) * daily_limit if total_urgency > 0 else daily_limit / len(top_subjects)
            allocate = min(subj_hours_left[subj_name], round(share, 2))
            if allocate > 0:
                day_plan.append({subj_name: float(allocate)})
                subj_hours_left[subj_name] -= allocate
                available_time -= allocate

        if day_plan:
            schedule[current_date.strftime("%Y-%m-%d")] = day_plan

        current_date += timedelta(days=1)

    return schedule

# ---------------- API ----------------
@app.get("/")
async def root():
    return {
        "message": "Welcome to MINDWEAVE API",
        "ai_provider": "Groq AI (FREE)",
        "docs": "/docs"
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "Server is running",
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0",
        "ai_provider": "Groq AI (FREE)"
    }

# EXPLAINIT
@app.post("/api/explain")
async def explain_topic(request: ExplainRequest):
    system_instruction = "You are a helpful educational assistant. Provide clear explanations."
    prompt = f"Explain this topic clearly: {request.topic}"
    explanation = await call_groq(prompt, system_instruction)
    return {"explanation": explanation}

@app.post("/api/explain/detailed")
async def explain_detailed(request: ExplainRequest):
    system_instruction = "You are an expert educator. Provide detailed explanations with examples."
    prompt = f"Provide detailed explanation of: {request.topic}. Include examples and applications."
    explanation = await call_groq(prompt, system_instruction)
    return {"explanation": explanation}

# NOTESYNTH
@app.post("/api/summarize")
async def summarize_pdf(pdf: UploadFile = File(...)):
    if not pdf.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    file_path = None
    try:
        file_path = await save_upload_file(pdf)
        pdf_text = extract_text_from_pdf(file_path)
        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text in PDF")
        pdf_text = pdf_text[:15000]
        system_instruction = "You are an expert at creating concise summaries. Focus on key points.Make sure they are complete points"
        prompt = f"Summarize this text concisely:\n\n{pdf_text}"
        summary = await call_groq(prompt, system_instruction)
        return {"summary": summary}
    finally:
        if file_path:
            cleanup_file(file_path)

# FLASHFORGE+
@app.post("/api/flashcards")
async def generate_flashcards(pdf: UploadFile = File(...)):
    if not pdf.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    file_path = None
    try:
        file_path = await save_upload_file(pdf)
        pdf_text = extract_text_from_pdf(file_path)
        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text in PDF")
        pdf_text = pdf_text[:15000]
        prompt = f"""Create exactly 10-15 flashcards from this text only taking the important texts.
Return ONLY a JSON array in this format:
[{{"question": "What is X?", "answer": "X is..."}}]

Text:
{pdf_text}

Return ONLY the JSON array, nothing else."""
        response = await call_groq(prompt)
        flashcards = extract_json_from_response(response)
        validated = [card for card in flashcards if isinstance(card, dict) and 'question' in card and 'answer' in card]
        if not validated:
            raise ValueError("No valid flashcards")
        return {"flashcards": validated}
    except:
        return {"flashcards": [{"question": "Error generating flashcards", "answer": "Try again with different PDF"}]}
    finally:
        if file_path:
            cleanup_file(file_path)

# MINDMAPGENIE
@app.post("/api/quiz")
async def generate_quiz(pdf: UploadFile = File(...)):
    if not pdf.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    file_path = None
    try:
        file_path = await save_upload_file(pdf)
        pdf_text = extract_text_from_pdf(file_path)
        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text in PDF")
        pdf_text = pdf_text[:15000]
        prompt = f"""Create exactly 10 multiple choice questions from this text.
Return ONLY a JSON array in this format:
[{{"question": "What is X?", "options": ["A", "B", "C", "D"], "correctAnswer": 0}}]

Text:
{pdf_text}

Return ONLY the JSON array, nothing else."""
        response = await call_groq(prompt)
        quiz = extract_json_from_response(response)
        validated = [
            q for q in quiz
            if isinstance(q, dict) and 'question' in q and 'options' in q and 'correctAnswer' in q and len(q['options']) == 4
        ]
        if not validated:
            raise ValueError("No valid questions")
        return {"quiz": validated}
    except:
        return {"quiz": [{"question": "Error generating quiz", "options": ["A","B","C","D"], "correctAnswer": 0}]}
    finally:
        if file_path:
            cleanup_file(file_path)

# PLANNER (NEW VERSION)
@app.post("/api/planner")
async def generate_study_plan(request: StudyPlanRequest):
    try:
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d") if request.start_date else datetime.now()

        # Feasibility check for each subject individually
        for subj in request.subjects:
            subj_deadline = datetime.strptime(subj.deadline, "%Y-%m-%d")
            available_hours = calculate_hours_between(start_date, subj_deadline, request.weekday_hours, request.weekend_hours)
            if subj.min_hours_required > available_hours:
                return {
                    "success": False,
                    "error": f"Insufficient time for subject {subj.name}",
                    "details": {
                        "subject": subj.name,
                        "required_hours": subj.min_hours_required,
                        "available_hours": available_hours,
                        "shortage": subj.min_hours_required - available_hours
                    }
                }

        # Intelligent allocation
        base_schedule = a_star_allocate(request.subjects, request.weekday_hours, request.weekend_hours, start_date)

        # AI expansion
        system_instruction = "You are an expert study planner. Expand this structured allocation into a detailed timetable."
        prompt = f"""Here is the base allocation of hours per subject per day (from an A* agent with subject-specific deadlines and daily subject mix):
{json.dumps(base_schedule, indent=2)}

Convert this into a human-friendly study plan with:
- Specific time blocks (e.g. 9:00–11:00)
- Breaks
- Activity labels (Core Concepts, Practice Problems, etc.)
- Ensure total hours per subject match exactly the required minimums.
- Do not allocate any subject after its individual deadline.
- Each day must include a mix of at least 2 subjects (if more than one subject is pending)."""
        plan = await call_groq(prompt, system_instruction)

        return {
            "success": True,
            "plan": plan,
            "base_allocation": base_schedule
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- RUN ----------------
if __name__ == "__main__":
    print("🚀 Starting MINDWEAVE Backend with subject-specific deadlines and daily subject mix...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
