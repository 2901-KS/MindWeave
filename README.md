# MINDWEAVE – AI-Powered Study Companion

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square)
![LLaMA](https://img.shields.io/badge/LLaMA_3.1-Groq_API-purple?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

> AI-driven personalized study planner used by **100+ students** — generates intelligent schedules, quizzes, flashcards, and summaries using LLaMA 3.1 via Groq API.

---

## What it does

MINDWEAVE eliminates the manual overhead of study planning. A student inputs their subjects, deadlines, and available hours — and gets back a complete, day-by-day study schedule with AI-generated explanations, flashcards, and quizzes for each topic.

**Key outcomes:**
- 40% reduction in manual study planning time
- Sub-2s response times across all 5 API endpoints under concurrent load
- Processes 50+ PDFs for content extraction and transformation
- A\*-inspired scheduling algorithm balances subject load intelligently across deadlines

---

## Features

| Feature | Description |
|---|---|
| **AI Study Planner** | Personalized schedules using A\*-inspired algorithm with deadline awareness |
| **ExplainIt** | Clear or detailed explanations of any topic, powered by LLaMA 3.1 |
| **NoteSynth** | Summarizes uploaded PDFs into concise notes |
| **FlashForge+** | Generates 10 Q&A flashcards directly from any PDF |
| **MindMapGenie** | Converts PDFs into 10-question multiple-choice quizzes |

---

## Tech Stack

- **Backend:** FastAPI, Python, Uvicorn
- **Frontend:** HTML, CSS, JavaScript, TypeScript
- **AI Provider:** Groq API (LLaMA 3.1)
- **Architecture:** Modular REST API design with OOP patterns (Factory, Strategy)

---

## API Endpoints

| Endpoint | Method | Description | Latency |
|---|---|---|---|
| `/api/health` | GET | Server status and version | — |
| `/api/explain` | POST | Topic explanation (clear/detailed) | < 2s |
| `/api/summarize` | POST | PDF → concise notes | < 2s |
| `/api/flashcards` | POST | PDF → 10 flashcards | < 2s |
| `/api/quiz` | POST | PDF → 10 MCQs | < 2s |
| `/api/planner` | POST | Subjects + deadlines → full study plan | < 2s |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/2901-KS/MindWeave.git
cd MindWeave

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add your Groq API key in main.py or as env variable
export GROQ_API_KEY="your_key_here"

# Run the server
uvicorn main:app --reload
```

Backend docs: `http://localhost:8000/docs`  
Frontend: `http://localhost:5500/index.html`

---

## Sample Planner Request

```json
{
  "subjects": [
    { "name": "Math", "min_hours_required": 20, "deadline": "2025-10-20" },
    { "name": "Physics", "min_hours_required": 15, "deadline": "2025-10-18" }
  ],
  "weekday_hours": 4,
  "weekend_hours": 6,
  "start_date": "2025-10-05"
}
```

Returns a structured, day-by-day study plan with AI-expanded timetable.

---

## Project Structure

```
MindWeave/
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── scheduler.py     # A*-inspired scheduling algorithm
│   ├── pdf_pipeline.py  # PDF extraction and transformation
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.ts
└── README.md
```

---

## License

MIT License
