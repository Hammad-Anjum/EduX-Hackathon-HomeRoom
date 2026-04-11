# HomeRoom

![Alt text](history/hackathon.png?raw=true "EduX Hackathon Oceania 2026")


**From classroom to home, in any language.**

AI-powered teacher-parent communication platform for Australian K-12 schools. Translates curriculum expectations into actionable guidance for diverse families, while keeping teachers efficient and students' wellbeing visible.

---

## The Problem

67% of Australian parents want to support their child's learning but face real barriers:
- **Language** -- 1 in 4 Australian households speak a language other than English
- **Curriculum complexity** -- Parents don't understand NAPLAN, achievement standards, or what's expected
- **One-way communication** -- Schools broadcast, parents can't easily respond or ask
- **Time** -- Busy families miss meetings; information isn't actionable

Teachers face barriers too: writing parent-friendly updates takes 30+ minutes/week, managing multilingual communication is impractical, and no single platform connects learning progress with parent engagement.

## The Solution

![Alt text](history/HomeRoom.jpeg?raw=true "HomeRoom")

HomeRoom bridges the gap with 8 integrated modules:

### Module 1: AI-Powered Communication Hub
- Teacher writes 2 sentences, AI generates a full parent-friendly update with home activities and guided questions
- Powered by CurricuLLM (Australian Curriculum-aligned) with Zephyr-7B fallback
- Parents respond to structured prompts; teacher gets aggregated insights with sentiment analysis

### Module 2: Curriculum Q&A (RAG)
- 10,051 ACARA curriculum documents in ChromaDB vector store
- Parents ask anything: "What should my Year 3 child know in maths?"
- Combined engine: CurricuLLM API priority, RAG fallback
- Available as a floating sidebar on every page

### Module 3: Translation & Messaging
- Full UI in 3 languages (English, Chinese, Arabic) -- 190+ i18n keys
- Real-time WebSocket chat with auto-translation (deep-translator + Google Translate)
- Voice messages: type a message, send as voice -- backend generates TTS audio in both languages via gTTS
- On-demand TranslateButton on every piece of dynamic content

### Module 4: Student Progress Tracking
- 5 subjects: Mathematics, English, Science, HASS, The Arts
- Achievement tracking: Below/At/Above (ACARA standards)
- NAPLAN results: 5 domains with band + score (separated from achievements)
- Skill mastery: Beginning/Developing/Proficient/Mastered
- Assignments with scores + teacher feedback
- Growth timeline (SVG line chart)
- Non-comparative: parents see ONLY their child's data (server-side enforced)
- Full teacher CRUD on all data types

### Module 5: Student Wellbeing Check-In
- 5-zone weather-metaphor scale (non-clinical, age-appropriate for primary school)
- Teacher logs daily check-ins per student (1-tap form)
- Teacher sees: daily strip (last 20 days) + trend + private notes
- Parent sees: weekly summary blocks (aggregated, not daily -- prevents micro-monitoring)
- Class at-a-glance: colored dots on student list
- Privacy: teacher notes never reach parents, no peer comparison

### Module 6: AI Recommendations
- Generates personalised per-subject recommendations from ALL student data
- Analyses: progress, skills, NAPLAN, assignments, wellbeing across 6 data sources
- Wellbeing safety: declining trend triggers warning banner -- teacher must assess first
- Per-item approval: teacher can approve, hide, or edit each recommendation
- Parents see only approved items with TranslateButton
- Enriched with CurricuLLM curriculum expectations for weak subjects
- Fallback: rule-based templates when LLM unavailable

### Module 7: Integrations
- Google Classroom import: mock data matching real API schemas, swap-ready for production
- CSV export: downloadable file with all student progress data
- Google Sheets + School Portal: coming soon placeholders

### Module 8: Parent Forum
- Parents post questions in any language
- Teacher and other parents reply
- TranslateButton on all posts and replies
- Teacher replies badged for visibility; teachers can only reply, not post

---

## What Makes HomeRoom Different

No existing tool combines all 5 of these:

| Differentiator | HomeRoom | ClassDojo | Compass | Seesaw |
|---|---|---|---|---|
| AU Curriculum-mapped progress | 10,051 ACARA docs + NAPLAN | No | Partial | No |
| AI that serves parents | Updates, Q&A, recommendations | Teacher admin only | No | Teacher admin only |
| Full multilingual experience | 3-lang UI + translate everything + voice TTS | Message translation only | No | Message translation only |
| Wellbeing + academics in one view | Non-comparative, privacy-preserving | Behavior points (comparative) | Incident logs | No |
| Two-way structured engagement | Guided prompts + insights + forum | Broadcast | Portal | Moderate |

---

## Tech Stack

- **Backend:** FastAPI (Python) + JSON file storage + ChromaDB vector store
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **AI/LLM:** CurricuLLM API (AU Curriculum-aligned) + HuggingFace Zephyr-7B (free tier)
- **Curriculum:** 10,051 ACARA documents in RAG (Retrieval-Augmented Generation)
- **Translation:** Google Translate (free via deep-translator) + gTTS for voice
- **Speech:** gTTS (text-to-speech for voice messages)
- **Real-time:** WebSocket (FastAPI + native browser WebSocket)

**~50 API routes. 190+ i18n keys. 30+ React components. Zero paid APIs.**

---

## Project Structure

```
hackathon/
  backend/
    app/
      api/              # REST endpoints (communication, curriculum, messaging, progress, recommendations, forum, translate, users)
      services/         # Business logic (llm_service, curriculum_engine, curricullm_service, rag_service, translator, tts_service, data_store, google_classroom)
      websocket/        # WebSocket handlers (chat, meeting)
      config.py         # Settings + environment variables
      main.py           # FastAPI app + router registration + static mounts
      schemas.py        # Pydantic request/response models
    data/               # JSON file storage (users, classrooms, messages, updates, progress, skills, naplan, wellbeing, recommendations, forum, assignments)
      audio/            # Generated TTS audio files (MP3)
      curriculum/       # ACARA curriculum documents (10,051 files)
      chroma_db/        # ChromaDB vector store
    scripts/            # Data extraction scripts (ACARA, NAPLAN, explainers)
  frontend/
    src/
      components/       # Reusable UI (MessageBubble, TranslateButton, AchievementBadge, SkillMatrix, GrowthTimeline, WellbeingStrip, WithLegend, VoiceRecordButton, CurriculumSidebar)
      hooks/            # Custom hooks (useWebSocket, useSpeechRecognition, useTranslation)
      lib/              # API client (api.ts) + i18n dictionary (i18n.ts)
      pages/
        teacher/        # Dashboard, ComposeUpdate, StudentList, StudentDetail, Integrations, Messages, MeetingRoom, Insights
        parent/         # Feed, ChildProgress, CurriculumAsk, Messages, MeetingRoom, Respond
        shared/         # Forum
  history/              # Project history documents (Phase 1-4, Strategy, Pitch Deck)
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- pip + npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys:
#   HUGGINGFACEHUB_API_TOKEN=your_hf_token
#   CURRICULLM_API_KEY=your_curricullm_key

# Ingest curriculum documents into ChromaDB (first time only)
# python scripts/run_all.py  # Extract curriculum data
# Then start server which auto-ingests on first curriculum query

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173` with the backend proxied at `http://localhost:8000`.

### Demo Users

Switch between users via the dropdown in the top-right corner:

| User | Role | Language |
|------|------|----------|
| Ms. Smith | Teacher | English |
| Wei Chen | Parent | Chinese (zh) |
| Sarah Jones | Parent | English |
| Fatima Al-Hassan | Parent | Arabic |

---

## API Overview

| Category | Routes | Key Endpoints |
|----------|--------|---------------|
| Communication | 7 | `POST /api/updates/draft`, `GET /api/updates/feed`, `GET /api/updates/:id/insights` |
| Curriculum | 4 | `POST /api/curriculum/ask`, `POST /api/curriculum/ingest` |
| Messaging | 3 + WS | `POST /api/messages/send`, `WS /ws/chat/:sender/:receiver` |
| Translation | 1 | `POST /api/translate/` |
| Progress | 12 | `GET /api/progress/student/:id`, `POST /api/progress/student/:id/checkin` |
| Recommendations | 4 | `POST /api/recommendations/generate/:id`, `PATCH /api/recommendations/:id/items/:id` |
| Integrations | 4 + static | `POST /api/progress/import/google-classroom`, `GET /api/progress/export/csv/:id` |
| Forum | 4 | `GET /api/forum/`, `POST /api/forum/:id/reply` |
| **Total** | **~50** | |

---

## Environment Variables

```env
# HuggingFace (for Zephyr-7B LLM + embeddings)
HUGGINGFACEHUB_API_TOKEN=hf_...
HF_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.3
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# CurricuLLM (Australian Curriculum-aligned AI)
CURRICULLM_API_KEY=sk_...
CURRICULLM_BASE_URL=https://api.curricullm.com/v1
CURRICULLM_MODEL=CurricuLLM-AU
```

---

## Languages Supported

| Language | UI | Translation | Voice TTS | Curriculum Q&A |
|----------|-----|------------|-----------|---------------|
| English (en) | Full | -- | Australian accent | Full |
| Chinese (zh-CN) | Full | Google Translate | Google TTS | Translated |
| Arabic (ar) | Full | Google Translate | Google TTS | Translated |

---

## Privacy & Safety

- **Non-comparative progress**: Parents see only their child's data. Server-side filtering ensures no peer data leaks.
- **Wellbeing privacy**: Teacher notes are never sent to parent endpoints. Parents see weekly aggregated zones, not daily entries.
- **Recommendation safety**: Declining wellbeing triggers a warning banner. Teacher must approve each recommendation before parents see it.
- **No student accounts**: Teacher logs all data on behalf of students (age-appropriate for primary school).

---

## License

Hackathon project -- 2026.
