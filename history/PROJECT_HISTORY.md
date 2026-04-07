# HomeRoom — Complete Project History

> Teacher-Parent Communication Platform | Hackathon 2026

---

## Table of Contents
1. [Problem Research](#1-problem-research)
2. [Solution Design](#2-solution-design)
3. [Sprint 1: Backend Skeleton](#3-sprint-1-backend-skeleton)
4. [Sprint 2: Curriculum RAG](#4-sprint-2-curriculum-rag)
5. [Sprint 3: Communication Hub](#5-sprint-3-communication-hub)
6. [Sprint 4: Translation & Messaging](#6-sprint-4-translation--messaging)
7. [Sprint 5: React Frontend](#7-sprint-5-react-frontend)
8. [Post-Sprint: Translation UX Overhaul](#8-post-sprint-translation-ux-overhaul)
9. [Post-Sprint: i18n (Multilingual UI)](#9-post-sprint-i18n-multilingual-ui)
10. [Post-Sprint: CurricuLLM Integration](#10-post-sprint-curricullm-integration)
11. [Post-Sprint: ChromaDB Ingestion](#11-post-sprint-chromadb-ingestion)
12. [Module 4: Student Progress Tracking](#12-module-4-student-progress-tracking)
13. [Final Architecture](#13-final-architecture)
14. [File Inventory](#14-file-inventory)
15. [API Reference](#15-api-reference)
16. [How to Run](#16-how-to-run)

---

## 1. Problem Research

### What we investigated
Researched the top issues in teacher-parent communication in Australian schools using academic studies, government reports, and education data (2020-2026).

### Top 5 Problems Identified

| # | Problem | Key Evidence |
|---|---------|-------------|
| **P1** | Teacher workload crisis | Avg 53.7 hrs/week; 72.4% intend to leave profession |
| **P2** | Language barriers (EAL/D) | 30% of students from non-English backgrounds; 5-7 years to reach academic English |
| **P3** | Low curriculum literacy | 1 in 3 students miss benchmarks; parents get results with zero context |
| **P4** | One-way communication | Schools default to broadcast; parents report being "talked at, not with" |
| **P5** | Digital exclusion | 20.6% of Australians digitally excluded; only 10% of disadvantaged have stable internet |

### Key Insight
**P1 and P4 are two sides of the same coin** — teachers are too exhausted to communicate well, so parents feel unheard. Fix them together.

---

## 2. Solution Design

### Architecture Decision
Built as a single platform with 4 modules addressing P1-P4 (P5 addressed by translation + lightweight design).

| Module | Problems Solved | What It Does |
|--------|----------------|-------------|
| **Module 1: Communication Hub** | P1 + P4 | AI-drafted weekly updates, two-way guided prompts, insight aggregation |
| **Module 2: Curriculum RAG** | P3 | 10,051-doc knowledge base + CurricuLLM API for curriculum Q&A |
| **Module 3: Translation Layer** | P2 | On-demand translation, real-time chat, live meeting subtitles |
| **Module 4: Student Progress** | P3 + P4 | Non-comparative, standards-based progress tracking |

### Tech Stack Decision
- **Backend**: FastAPI (Python) — chosen for WebSocket support + async
- **Storage**: JSON files (no database — hackathon simplicity)
- **Vector DB**: ChromaDB (local, embedded, free)
- **LLM**: HuggingFace via LangChain + CurricuLLM API
- **Translation**: deep-translator (free Google Translate wrapper)
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Auth**: None — role toggle dropdown (hackathon MVP)

### Data Pipeline (Pre-existing)
Before application development began, 4 extraction scripts had already populated `backend/data/curriculum/` with:
- **10,051 documents** across 22 JSON files + 1 PDF
- 8 subjects × content descriptions + achievement standards from ACARA SPARQL API
- Hand-authored explainers for education system, report cards, home learning
- NAPLAN overview, parent guide, results guide

---

## 3. Sprint 1: Backend Skeleton

### Files Created
```
backend/
├── requirements.txt          # All Python dependencies
├── .env                      # HuggingFace + CurricuLLM tokens
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI app + CORS + all routers
│   ├── config.py             # pydantic-settings (HF, CurricuLLM, paths)
│   ├── schemas.py            # All Pydantic request/response models
│   ├── api/__init__.py
│   ├── services/__init__.py
│   ├── services/data_store.py  # JSON file CRUD utility
│   └── websocket/__init__.py
├── data/
│   ├── users.json            # 4 seed users (1 teacher, 3 parents)
│   ├── classrooms.json       # 1 classroom, 3 students
│   ├── updates.json          # Empty
│   ├── responses.json        # Empty
│   ├── messages.json         # Empty
│   └── meetings.json         # Empty
```

### Seed Data
- **Teacher**: Ms. Smith (en)
- **Parents**: Wei Chen (zh), Sarah Jones (en), Fatima Al-Hassan (ar)
- **Classroom**: Year 3 Blue with 3 students (Lily, Tom, Amir)

### DataStore API
Simple JSON CRUD: `read()`, `write()`, `append()`, `find_by_id()`, `update_by_id()`, `filter()`

---

## 4. Sprint 2: Curriculum RAG

### Files Created
```
backend/app/services/
├── llm_service.py            # HuggingFace LLM + embeddings via LangChain
├── rag_service.py            # ChromaDB vector store + ingestion + query
backend/app/api/
└── curriculum.py             # /ingest, /ask, /stats routes
```

### How It Works
1. `ingest_all()` reads all 22 JSON files from `data/curriculum/`
2. Each document's `content` field is embedded via `sentence-transformers/all-MiniLM-L6-v2`
3. Stored in ChromaDB with full metadata (subject, year_level, strand, etc.)
4. Queries use metadata filtering + cosine similarity search
5. Top 5 chunks fed to HuggingFace LLM with a parent-friendly prompt

### LLM Service Methods
- `answer_question(question, context)` — RAG-powered curriculum Q&A
- `generate_update(teacher_notes)` — AI weekly update generation
- `summarize_responses(responses)` — Aggregate parent responses into insights

---

## 5. Sprint 3: Communication Hub

### Files Created/Updated
```
backend/app/api/communication.py   # 5 routes: draft, send, feed, respond, insights
```

### Data Flow
```
Teacher types brief notes → POST /api/updates/draft
  → LLM generates parent-friendly content + home activities + guided prompts
  → Teacher reviews preview → POST /api/updates/{id}/send
  → Parents see on Feed → respond to guided prompts
  → Teacher views aggregated insights (sentiment, themes, response rate)
```

### Key Design: Two-Way Communication
- Teacher spends 2 minutes instead of 30 (AI drafts the update)
- Parents respond to structured prompts (not open-ended, reducing friction)
- Teacher sees aggregated insights (not a pile of emails)

---

## 6. Sprint 4: Translation & Messaging

### Files Created
```
backend/app/services/translator.py    # deep-translator + langdetect wrapper
backend/app/api/messaging.py          # send, conversations, thread routes
backend/app/websocket/chat.py         # Real-time translated WebSocket chat
backend/app/websocket/meeting.py      # Live meeting translation with subtitles
```

### Translation Architecture
- `deep-translator` wraps Google Translate (free)
- `langdetect` for language detection
- Parent responses auto-translated to English server-side
- Chat messages stored with both original + translated text

### WebSocket Features
- **Chat**: Bidirectional — each user writes in their language, messages stored with both versions
- **Meeting**: Browser Web Speech API (client-side STT) → WebSocket → server translates → live subtitles broadcast

---

## 7. Sprint 5: React Frontend

### Files Created
```
frontend/src/
├── App.tsx                           # Router + NavBar + role toggle
├── lib/api.ts                        # All Axios API calls
├── hooks/
│   ├── useWebSocket.ts               # WebSocket connection hook
│   └── useSpeechRecognition.ts       # Browser Speech API hook
├── pages/teacher/
│   ├── Dashboard.tsx                 # Update list + status badges
│   ├── ComposeUpdate.tsx             # Notes → AI preview → send
│   ├── Insights.tsx                  # Response rate, sentiment, themes
│   ├── Messages.tsx                  # Chat with parents (+ button for new)
│   └── MeetingRoom.tsx               # Live meeting with subtitles
├── pages/parent/
│   ├── Feed.tsx                      # Weekly updates with translate buttons
│   ├── Respond.tsx                   # Guided prompt response form
│   ├── CurriculumAsk.tsx             # RAG Q&A with model picker
│   ├── Messages.tsx                  # Chat with teacher
│   └── MeetingRoom.tsx               # Meeting with subtitles
└── types/speech.d.ts                 # SpeechRecognition type definitions
```

### Setup
- React 19 + Vite + TypeScript + Tailwind CSS
- Vite proxy: `/api` → `localhost:8000`, `/ws` → WebSocket
- Role toggle dropdown in navbar (switch between teacher/parent users)

---

## 8. Post-Sprint: Translation UX Overhaul

### Problem
Messages were auto-translated server-side. User wanted: "Show original language, with a small translate button underneath every message."

### Changes Made

**New backend endpoint:**
- `POST /api/translate/` — on-demand translation (called when user clicks translate)

**New frontend components:**
- `TranslateButton.tsx` — globe icon + "Translate" text, click to translate on-demand, toggles visibility, caches result
- `MessageBubble.tsx` — wraps every chat message with original text + translate button

**Removed:**
- Auto-translation from `/api/updates/feed` endpoint
- Auto-translation from `/api/curriculum/ask` endpoint

**Updated all pages:**
- Feed: translate buttons on content, activities, prompts
- Respond: translate button on prompt question
- CurriculumAsk: translate button on RAG answer
- Chat (both teacher + parent): MessageBubble with translate button
- Every message shows original language with on-demand translate

---

## 9. Post-Sprint: i18n (Multilingual UI)

### Problem
All UI chrome (nav labels, headings, buttons, placeholders) was hardcoded in English. Non-English parents saw English everywhere.

### Solution: Static Dictionary + Translate Button

**New files:**
- `frontend/src/lib/i18n.ts` — ~60 translation keys in 3 languages (en, zh, ar)
- `frontend/src/hooks/useTranslation.ts` — `const { t } = useTranslation(user.language)` hook

**Updated all 12 frontend files** to use `t('key')` instead of hardcoded strings:
- App.tsx (nav labels)
- All 5 teacher pages
- All 5 parent pages
- TranslateButton component

### Result
- Switch to Wei Chen → entire UI renders in Chinese
- Switch to Fatima → entire UI renders in Arabic
- Dynamic content (messages, updates) stays in original language with translate buttons

---

## 10. Post-Sprint: CurricuLLM Integration

### Problem
Our RAG system uses our own extracted curriculum docs. CurricuLLM is a purpose-built education AI API with an OpenAI-compatible interface + `curriculum` parameter.

### Solution: 3-Model Architecture

**New files:**
- `backend/app/services/curricullm_service.py` — CurricuLLM API client
- `backend/app/services/curriculum_engine.py` — Orchestrator for 3 modes

| Model | How It Works |
|-------|-------------|
| `rag` | Our 10,065 docs in ChromaDB → similarity search → HuggingFace answer |
| `curricullm` | CurricuLLM API with `curriculum: { stage, subject }` parameter |
| `combined` | CurricuLLM first → if success, also fetches RAG sources. If unavailable, falls back to RAG. |

**Frontend:** Pill-style model picker on CurriculumAsk page. Shows which model produced the answer.

**CurricuLLM API details:**
- Base URL: `https://api.curricullm.com/v1/chat/completions`
- OpenAI-compatible with added `curriculum` object (`stage`, `subject`)
- Year levels mapped to stages (e.g., Year 3 → Stage 2)

---

## 11. Post-Sprint: ChromaDB Ingestion

### Action
Ran full ingestion of all curriculum data into ChromaDB persistent storage.

### Fix Required
HASS achievement standards had duplicate IDs. Fixed `_ingest_json()` to append a counter suffix for uniqueness.

### Result
```
Documents ingested: 10,065
Collection: curriculum
Status: active
```

---

## 12. Module 4: Student Progress Tracking

### Problem
No way for teachers to track student progress or for parents to see how their child is doing.

### Research: Non-Comparative Progress
Comparing students to each other is discriminatory. Used Australian education models instead:
- **ACARA Achievement Standards** — Below / At / Above expected level
- **NAPLAN Proficiency Levels** — Exceeding / Strong / Developing / Needs Additional Support
- **Mastery-Based Skills** — Beginning / Developing / Proficient / Mastered
- **Ipsative (Growth-Over-Time)** — student's own trajectory, never compared to peers

### New Data Files
```
backend/data/
├── student_progress.json    # 12 records (3 students × 2 subjects × 2 terms)
├── assignments.json         # 3 assignments with per-student results
└── skills.json              # 18 skill records (3 students × 6 skills)
```

### New Backend Routes (11 endpoints)
```
GET  /api/progress/classroom/{id}/students        — Student list with achievement summary
GET  /api/progress/student/{id}                    — Full student detail
POST /api/progress/student/{id}/achievement        — Update achievement record
POST /api/progress/student/{id}/skill              — Update skill mastery
POST /api/progress/assignments                     — Create assignment
PUT  /api/progress/assignments/{id}/results        — Bulk update results
GET  /api/progress/parent/{id}/children            — Parent view (non-comparative)
POST /api/progress/import/google-sheets            — Integration placeholder
POST /api/progress/import/canvas                   — Integration placeholder
POST /api/progress/import/school-portal            — Integration placeholder (Compass/Sentral)
POST /api/progress/export/csv                      — Export placeholder
```

### New Frontend Pages
- **Teacher StudentList** — table with per-subject achievement badges
- **Teacher StudentDetail** — tabbed editor (achievements, skills, assignments)
- **Parent ChildProgress** — non-comparative dashboard

### New Components
- **AchievementBadge** — coloured pill: Below=amber, At=green, Above=blue
- **NaplanBadge** — proficiency level badge
- **GrowthTimeline** — inline SVG line chart (student's own scores over time, per subject)
- **SkillMatrix** — skills grouped by subject, colour-coded mastery levels

### Non-Comparative Design (Server-Side Enforced)
The parent endpoint `/api/progress/parent/{id}/children` filters assignment results to ONLY include the parent's child. No other student's data is ever sent to the client. Growth charts plot only the individual student's trajectory.

---

## 13. Final Architecture

```
┌─────────────────────────────────────────────────────────┐
│            React Frontend (Vite + TypeScript + Tailwind)  │
│  Teacher: Dashboard, Compose, Students, Insights, Chat    │
│  Parent:  Feed, Progress, Curriculum, Respond, Chat       │
│  i18n:    en / zh / ar (60+ keys)                         │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Python)                  │
│                                                           │
│  Module 1: Communication Hub (draft, send, feed, respond) │
│  Module 2: Curriculum RAG + CurricuLLM (3-model engine)   │
│  Module 3: Translation + Chat + Meeting WebSockets        │
│  Module 4: Student Progress (non-comparative)             │
│                                                           │
│  Services: LLM, RAG, CurricuLLM, Translator, DataStore   │
└───────┬──────────┬──────────┬───────────────────────────┘
        │          │          │
   JSON Files   ChromaDB   CurricuLLM API
   (9 files)   (10,065     (external)
               documents)
```

### Stats
- **32 API routes** (REST + WebSocket)
- **10,065 curriculum documents** in ChromaDB
- **60+ i18n keys** in 3 languages
- **17 React pages/components**
- **7 backend services**

---

## 14. File Inventory

### Backend (28 source files)
```
backend/
├── .env
├── requirements.txt
├── app/
│   ├── main.py                         # FastAPI entry + all routers
│   ├── config.py                       # Settings (HF, CurricuLLM, paths)
│   ├── schemas.py                      # All Pydantic models (~15 classes)
│   ├── api/
│   │   ├── communication.py            # Module 1: 5 routes
│   │   ├── curriculum.py               # Module 2: 4 routes
│   │   ├── messaging.py                # Module 3: 3 routes
│   │   ├── progress.py                 # Module 4: 11 routes
│   │   ├── translate.py                # On-demand translation: 1 route
│   │   └── users.py                    # User listing: 1 route
│   ├── services/
│   │   ├── data_store.py               # JSON file CRUD
│   │   ├── llm_service.py              # HuggingFace LLM + embeddings
│   │   ├── rag_service.py              # ChromaDB + ingestion + query
│   │   ├── curricullm_service.py       # CurricuLLM API client
│   │   ├── curriculum_engine.py        # 3-model orchestrator
│   │   └── translator.py              # deep-translator wrapper
│   └── websocket/
│       ├── chat.py                     # Real-time translated chat
│       └── meeting.py                  # Live meeting translation
├── data/
│   ├── users.json                      # 4 users
│   ├── classrooms.json                 # 1 classroom, 3 students
│   ├── updates.json                    # Teacher weekly updates
│   ├── responses.json                  # Parent responses
│   ├── messages.json                   # Direct messages
│   ├── meetings.json                   # Meeting transcripts
│   ├── student_progress.json           # 12 achievement records
│   ├── assignments.json                # 3 assignments
│   ├── skills.json                     # 18 skill records
│   ├── chroma_db/                      # ChromaDB persistent storage
│   └── curriculum/                     # 22 JSON + 1 PDF (10,051 source docs)
└── scripts/                            # Data extraction (pre-existing)
    ├── run_all.py
    ├── extract_acara_curriculum.py
    ├── extract_acara_achievement.py
    ├── fetch_naplan_info.py
    └── fetch_education_explainers.py
```

### Frontend (22 source files)
```
frontend/src/
├── App.tsx                             # Router + NavBar + role toggle
├── main.tsx                            # React entry
├── index.css                           # Tailwind import
├── lib/
│   ├── api.ts                          # All Axios API calls (~20 functions)
│   └── i18n.ts                         # 60+ keys × 3 languages
├── hooks/
│   ├── useTranslation.ts              # i18n hook
│   ├── useWebSocket.ts                # WebSocket connection
│   └── useSpeechRecognition.ts        # Browser Speech API
├── components/
│   ├── TranslateButton.tsx            # On-demand translate
│   ├── MessageBubble.tsx              # Chat message with translate
│   ├── AchievementBadge.tsx           # Below/At/Above + NAPLAN badges
│   ├── GrowthTimeline.tsx             # SVG line chart (ipsative)
│   └── SkillMatrix.tsx                # Skill mastery heatmap
├── pages/teacher/
│   ├── Dashboard.tsx                  # Update overview
│   ├── ComposeUpdate.tsx              # AI-assisted weekly update
│   ├── Insights.tsx                   # Response aggregation
│   ├── StudentList.tsx                # Student table with badges
│   ├── StudentDetail.tsx              # Achievement/skill/assignment editor
│   ├── Messages.tsx                   # Chat with parents
│   └── MeetingRoom.tsx                # Live meeting
├── pages/parent/
│   ├── Feed.tsx                       # Weekly updates
│   ├── Respond.tsx                    # Guided prompt response
│   ├── ChildProgress.tsx              # Non-comparative progress dashboard
│   ├── CurriculumAsk.tsx              # Curriculum Q&A with model picker
│   ├── Messages.tsx                   # Chat with teacher
│   └── MeetingRoom.tsx                # Meeting with subtitles
└── types/speech.d.ts
```

---

## 15. API Reference

### Module 1: Communication Hub
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/updates/draft` | AI-generate update from teacher notes |
| POST | `/api/updates/{id}/send` | Send update to parents |
| GET | `/api/updates/feed` | Get updates (teacher or parent view) |
| POST | `/api/updates/{id}/respond` | Parent responds to guided prompt |
| GET | `/api/updates/{id}/insights` | Aggregated response insights |

### Module 2: Curriculum RAG
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/curriculum/ingest` | Load docs into ChromaDB (one-time) |
| POST | `/api/curriculum/ask` | Ask curriculum question (rag/curricullm/combined) |
| GET | `/api/curriculum/stats` | ChromaDB collection stats |
| GET | `/api/curriculum/models` | List available query models |

### Module 3: Translation & Messaging
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/translate/` | On-demand text translation |
| POST | `/api/messages/send` | Send translated message |
| GET | `/api/messages/conversations` | List conversation threads |
| GET | `/api/messages/{user_id}` | Get message thread |
| WS | `/ws/chat/{sender}/{receiver}` | Real-time translated chat |
| WS | `/ws/meeting/{meeting_id}` | Live meeting translation |

### Module 4: Student Progress
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/progress/classroom/{id}/students` | Student list + badges |
| GET | `/api/progress/student/{id}` | Full student detail |
| POST | `/api/progress/student/{id}/achievement` | Update achievement |
| POST | `/api/progress/student/{id}/skill` | Update skill mastery |
| POST | `/api/progress/assignments` | Create assignment |
| PUT | `/api/progress/assignments/{id}/results` | Bulk update results |
| GET | `/api/progress/parent/{id}/children` | Parent view (non-comparative) |
| POST | `/api/progress/import/google-sheets` | Integration placeholder |
| POST | `/api/progress/import/canvas` | Integration placeholder |
| POST | `/api/progress/import/school-portal` | Integration placeholder |
| POST | `/api/progress/export/csv` | Export placeholder |

### Other
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users/` | List all users |
| GET | `/` | Health check |

---

## 16. How to Run

### Backend
```bash
cd hackathon/backend
pip install -r requirements.txt
# Set your HuggingFace token in .env
# Optionally set CURRICULLM_API_KEY in .env
uvicorn app.main:app --reload
```

### Ingest Curriculum Data (one-time)
```bash
# ChromaDB is already populated with 10,065 documents
# To re-ingest: POST http://localhost:8000/api/curriculum/ingest
```

### Frontend
```bash
cd hackathon/frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Demo Flow
1. **Teacher**: Compose update → AI generates content → send to parents
2. **Parent (Wei Chen)**: See update in Chinese UI → translate content → respond
3. **Teacher**: View insights (sentiment, themes, response rate)
4. **Parent**: Ask curriculum question → get plain-language answer
5. **Teacher**: View student list → update Lily's achievement to "Above"
6. **Parent**: View child progress (achievement cards, growth chart, skills)
7. **Chat**: Teacher and parent exchange messages in different languages
