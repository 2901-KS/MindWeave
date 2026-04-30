# MINDWEAVE – AI-Powered Study Companion

MINDWEAVE is an AI-driven personalized study planner that helps students manage their time efficiently by creating intelligent study schedules, generating quizzes, flashcards, summaries, and providing topic explanations. It ensures subject-specific deadlines are respected and avoids monotony by mixing multiple subjects per day.

---

## Features

* **AI Study Planner** – Creates personalized study plans using subject deadlines and required hours
* **ExplainIt** – Provides clear or detailed explanations of any topic
* **NoteSynth** – Summarizes uploaded PDFs into concise notes
* **FlashForge+** – Generates flashcards directly from PDFs
* **MindMapGenie (Quiz Mode)** – Converts PDFs into multiple-choice quizzes
* **Smart Scheduling** – Uses an A* inspired algorithm for balanced subject allocation
* **Groq AI Integration** – Powers explanations, summaries, and study plan expansion

---

## Tech Stack

* **Backend:** FastAPI, Python, Uvicorn
* **Frontend:** HTML, CSS, JavaScript, TypeScript
* **Database/Storage:** File-based uploads (extensible to databases)
* **AI Provider:** Groq API (LLaMA 3.1)

---

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/mindweave.git
   cd mindweave
   ```

2. Create and activate a virtual environment

   ```bash
   python -m venv venv
   source venv/bin/activate  # for Linux/Mac
   venv\Scripts\activate     # for Windows
   ```

3. Install dependencies

   ```bash
   pip install -r requirements.txt
   ```

4. Set up your environment variables

   * Add your **Groq API key** in `main.py` or via environment variable.

5. Run the server

   ```bash
   uvicorn main:app --reload
   ```

6. Open the backend API documentation at:

   ```
   http://localhost:8000/docs
   ```

7. Open the frontend in your browser at:

   ```
   http://localhost:5500/index.html
   ```

---

## API Endpoints

### Health Check

* `GET /api/health`
  Returns server status, timestamp, and version.

### ExplainIt

* `POST /api/explain`
  Input: `{ "topic": "your topic" }`
  Output: Clear explanation.

* `POST /api/explain/detailed`
  Input: `{ "topic": "your topic" }`
  Output: Detailed explanation with examples.

### NoteSynth (Summarization)

* `POST /api/summarize`
  Upload a PDF file. Returns summary.

### FlashForge+ (Flashcards)

* `POST /api/flashcards`
  Upload a PDF file. Returns 10 flashcards in Q&A format.

### MindMapGenie (Quiz Generator)

* `POST /api/quiz`
  Upload a PDF file. Returns 10 multiple-choice questions.

### Study Planner

* `POST /api/planner`
  Input:

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

  Output: Structured study plan with base allocation and AI-expanded timetable.

---

## Frontend

The frontend is built using **HTML/CSS/JavaScript/TypeScript** and connects with the backend through REST API calls.
You can run the frontend locally at:

```
http://localhost:5500/index.html
```

---

## License

This project is released under the MIT License.
