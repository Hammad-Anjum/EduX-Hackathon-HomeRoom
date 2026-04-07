# BridgeEd — Hackathon MVP Plan

---

## The Problem (4 issues, 1 solution)

| # | Problem | Key Stat |
|---|---------|----------|
| **P1+P4** | Teachers overworked → communication one-directional → parents feel unheard | 72.4% of teachers plan to leave; parents report being talked *at* |
| **P3** | Parents can't interpret curriculum, NAPLAN, or assessment jargon | 1 in 3 students miss benchmarks; parents get results with zero context |
| **P2** | 30% of students from non-English backgrounds — language is a wall | 5-7 years for EAL/D learners to reach academic English |

---

## Solution: 3 Modules

### Module 1: Smart Communication Hub (P1 + P4)
Teacher types brief notes → AI generates parent-friendly update with home activities + guided prompts → parents respond → teacher sees aggregated insights.

### Module 2: Curriculum Knowledge Base — RAG (P3)
JSON/PDF knowledge base of Australian schooling system. Parents ask plain-language questions, RAG answers with actionable suggestions.

### Module 3: Multilingual Layer (P2)
Real-time translated chat + live meeting subtitles. All outputs auto-translated.

---

## Tech Stack (MVP — minimal)

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python) |
| **Data Storage** | JSON files (no database) |
| **Vector Store** | ChromaDB (local, embedded) |
| **LLM** | HuggingFace models via LangChain (`langchain-huggingface`) |
| **Embeddings** | HuggingFace `sentence-transformers/all-MiniLM-L6-v2` |
| **Translation** | `deep-translator` (free Google Translate wrapper) |
| **Real-time** | FastAPI WebSocket |
| **Speech-to-Text** | Browser Web Speech API (client-side, free) |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Auth** | None — role selected at app launch (teacher/parent toggle) |

---

## Data Storage (JSON Files)

All data stored in `backend/data/` as JSON files. Simple read/write with Python's `json` module.

```
backend/data/
├── users.json              # Pre-seeded teacher + parent profiles
├── classrooms.json         # Classroom definitions with teacher + student + parent links
├── updates.json            # Weekly updates (teacher notes + AI content + prompts)
├── responses.json          # Parent responses to guided prompts
├── insights.json           # Cached AI-generated insight summaries
├── messages.json           # Direct messages (translated chat history)
├── meetings.json           # Meeting sessions + transcripts
├── curriculum_docs.json    # Metadata for ingested curriculum PDFs
├── chroma_db/              # ChromaDB vector storage (auto-managed)
└── curriculum_pdfs/        # Uploaded PDF files
```

### Data Shapes

```jsonc
// users.json
[
  { "id": "t1", "name": "Ms. Smith", "role": "teacher", "language": "en" },
  { "id": "p1", "name": "Wei Chen", "role": "parent", "language": "zh", "children": ["s1"] },
  { "id": "p2", "name": "Sarah Jones", "role": "parent", "language": "en", "children": ["s2"] }
]

// classrooms.json
[
  {
    "id": "c1",
    "name": "Year 3 Blue",
    "year_level": 3,
    "teacher_id": "t1",
    "students": [
      { "id": "s1", "name": "Lily Chen", "parent_ids": ["p1"] },
      { "id": "s2", "name": "Tom Jones", "parent_ids": ["p2"] }
    ]
  }
]

// updates.json
[
  {
    "id": "u1",
    "classroom_id": "c1",
    "teacher_id": "t1",
    "teacher_notes": "Maths: fractions. Reading: Charlotte's Web.",
    "generated_content": "This week your child explored...",
    "home_activities": ["Try fractions with pizza slices", "Read for 15 min together"],
    "guided_prompts": ["How did your child go with fractions at home?", "Did they talk about the book?"],
    "status": "sent",
    "created_at": "2026-04-07T10:00:00Z"
  }
]

// responses.json
[
  {
    "id": "r1",
    "update_id": "u1",
    "parent_id": "p1",
    "student_id": "s1",
    "prompt_index": 0,
    "response_text": "她在家用披萨练习了分数",
    "original_language": "zh",
    "translated_text": "She practiced fractions at home with pizza",
    "created_at": "2026-04-07T18:00:00Z"
  }
]

// messages.json
[
  {
    "id": "m1",
    "sender_id": "p1",
    "receiver_id": "t1",
    "original_text": "我的孩子这周阅读进步了吗？",
    "original_language": "zh",
    "translated_text": "Has my child made reading progress this week?",
    "translated_language": "en",
    "created_at": "2026-04-07T19:00:00Z"
  }
]
```

---

## API Routes

### Module 1: Communication Hub
```
POST /api/updates/draft              — Teacher notes → AI-generated update
POST /api/updates/{id}/send          — Mark as sent (auto-translate per parent)
GET  /api/updates/feed?role=parent&user_id=p1  — Parent's feed (translated)
GET  /api/updates/feed?role=teacher&user_id=t1 — Teacher's sent updates
POST /api/updates/{id}/respond       — Parent submits response to a prompt
GET  /api/updates/{id}/insights      — Aggregated response summary for teacher
```

### Module 2: Curriculum RAG
```
POST /api/curriculum/ingest          — Upload curriculum PDF → chunk → embed → ChromaDB
POST /api/curriculum/ask             — Parent asks question → RAG answer
GET  /api/curriculum/documents       — List ingested docs
```

### Module 3: Translation & Chat
```
POST /api/messages/send              — Send translated message
GET  /api/messages/{user_id}         — Get message thread with a user
WS   /ws/chat/{sender_id}/{receiver_id}  — Real-time translated chat
WS   /ws/meeting/{meeting_id}        — Live meeting translation
```

---

## Key Services

### `services/llm_service.py` — HuggingFace via LangChain
```python
from langchain_huggingface import HuggingFaceEndpoint, HuggingFaceEmbeddings

# LLM: HuggingFace Inference API (free tier)
# Model: mistralai/Mistral-7B-Instruct-v0.3 or google/flan-t5-large
# Embeddings: sentence-transformers/all-MiniLM-L6-v2

class LLMService:
    generate_update(teacher_notes) → { content, activities, prompts }
    summarize_responses(responses[]) → { sentiment, themes, summary }
    answer_curriculum_question(question, context) → answer
```

### `services/rag_service.py` — ChromaDB + Ingestion + Query
```python
class RAGService:
    ingest_pdf(pdf_path, metadata) → { chunks_count }
    query(question, year_level?, subject?) → { answer, sources[] }
```

### `services/translator.py` — deep-translator wrapper
```python
from deep_translator import GoogleTranslator

class TranslatorService:
    translate(text, target_lang, source_lang='auto') → translated_text
    detect_language(text) → language_code
```

### `services/data_store.py` — JSON file read/write
```python
class DataStore:
    read(filename) → list[dict]
    write(filename, data) → None
    append(filename, item) → None
    find_by_id(filename, id) → dict | None
    filter(filename, **kwargs) → list[dict]
```

---

## Project Structure

```
hackathon/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + CORS + router registration
│   │   ├── config.py                  # HuggingFace token, model names
│   │   │
│   │   ├── api/
│   │   │   ├── communication.py       # Module 1: updates, responses, insights
│   │   │   ├── curriculum.py          # Module 2: ingest, ask
│   │   │   └── messaging.py           # Module 3: messages, meetings
│   │   │
│   │   ├── services/
│   │   │   ├── llm_service.py         # HuggingFace LLM via LangChain
│   │   │   ├── rag_service.py         # ChromaDB vector store + RAG pipeline
│   │   │   ├── translator.py          # deep-translator wrapper
│   │   │   └── data_store.py          # JSON file CRUD
│   │   │
│   │   ├── websocket/
│   │   │   ├── chat.py                # Translated real-time chat
│   │   │   └── meeting.py             # Live meeting translation
│   │   │
│   │   └── schemas.py                 # Pydantic models for request/response
│   │
│   ├── data/
│   │   ├── users.json
│   │   ├── classrooms.json
│   │   ├── updates.json
│   │   ├── responses.json
│   │   ├── insights.json
│   │   ├── messages.json
│   │   ├── meetings.json
│   │   ├── curriculum_docs.json
│   │   ├── chroma_db/
│   │   └── curriculum_pdfs/
│   │
│   ├── requirements.txt
│   └── .env                           # HUGGINGFACEHUB_API_TOKEN
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Router + role toggle (teacher/parent)
│   │   ├── pages/
│   │   │   ├── teacher/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ComposeUpdate.tsx
│   │   │   │   ├── Insights.tsx
│   │   │   │   ├── Messages.tsx
│   │   │   │   └── MeetingRoom.tsx
│   │   │   └── parent/
│   │   │       ├── Feed.tsx
│   │   │       ├── Respond.tsx
│   │   │       ├── CurriculumAsk.tsx
│   │   │       ├── Messages.tsx
│   │   │       └── MeetingRoom.tsx
│   │   ├── components/
│   │   │   ├── RoleToggle.tsx         # Switch between teacher/parent view
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── SubtitleOverlay.tsx
│   │   │   └── InsightCard.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   └── useSpeechRecognition.ts
│   │   └── lib/
│   │       └── api.ts                 # Axios instance
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── PLAN.md
└── README.md
```

---

## Data Flow Diagrams

### Module 1: Teacher → AI Update → Parent → Insights
```
Teacher types brief notes
    │
    ▼
POST /api/updates/draft → llm_service.generate_update(notes)
    │
    ▼
HuggingFace LLM generates:
  { content: "This week...", activities: [...], prompts: [...] }
    │
    ▼
Teacher reviews on ComposeUpdate.tsx → POST /api/updates/{id}/send
    │
    ▼
For each parent: translator.translate(content, parent.language)
Save to updates.json with status: "sent"
    │
    ▼
Parent sees Feed.tsx (in their language) → taps Respond
    │
    ▼
POST /api/updates/{id}/respond → translate response to English → save to responses.json
    │
    ▼
Teacher clicks Insights → GET /api/updates/{id}/insights
    │
    ▼
llm_service.summarize_responses() → save to insights.json → return to teacher
```

### Module 2: Curriculum RAG
```
Admin uploads PDF → POST /api/curriculum/ingest
    │
    ▼
rag_service: load PDF → chunk (1000 chars, 200 overlap) → embed → ChromaDB
    │
    ▼
Parent asks: "What should Year 3 know in maths?"
    │
    ▼
POST /api/curriculum/ask
    │
    ▼
rag_service: embed question → ChromaDB similarity search → top 5 chunks
    │
    ▼
llm_service: "Answer in plain language. No jargon. Give examples." + context
    │
    ▼
translator.translate(answer, parent.language) → return
```

### Module 3: Translated Chat
```
Parent (zh) types message → WebSocket /ws/chat/p1/t1
    │
    ▼
translator: detect zh → translate to en → save both to messages.json
    │
    ▼
Broadcast to teacher: { original: "...", translated: "...", lang: "zh" }
    │
    ▼
Teacher replies in en → translate to zh → broadcast to parent
```

---

## Build Order

### Sprint 1: Skeleton (~1 hour)
- [ ] Init FastAPI with CORS
- [ ] Create `data_store.py` (JSON CRUD utility)
- [ ] Seed JSON files with sample data (1 teacher, 2 parents, 1 classroom, 3 students)
- [ ] Init React + Vite + Tailwind + React Router
- [ ] `RoleToggle.tsx` — dropdown to switch teacher/parent view (no auth)
- [ ] Basic routing: `/teacher/dashboard`, `/parent/feed`

### Sprint 2: Module 2 — Curriculum RAG (~2 hours)
- [ ] `llm_service.py` — HuggingFace LLM + embeddings via LangChain
- [ ] `rag_service.py` — ChromaDB init, PDF ingestion (PyPDF), chunking, query
- [ ] `/api/curriculum/ingest` + `/api/curriculum/ask` routes
- [ ] Ingest 1-2 sample curriculum PDFs
- [ ] `CurriculumAsk.tsx` — search bar + answer + sources display

### Sprint 3: Module 1 — Communication Hub (~3 hours)
- [ ] `llm_service.generate_update()` — prompt template for teacher notes → parent content
- [ ] `/api/updates/draft`, `/send`, `/feed`, `/respond`, `/insights` routes
- [ ] `ComposeUpdate.tsx` — textarea → generate → preview → send
- [ ] `Feed.tsx` — update cards with respond buttons
- [ ] `Respond.tsx` — guided prompt + response input
- [ ] `llm_service.summarize_responses()` — aggregate + sentiment
- [ ] `Insights.tsx` — response rate, themes, summary cards

### Sprint 4: Module 3 — Translation (~2 hours)
- [ ] `translator.py` — `deep-translator` wrapper
- [ ] Integrate into Module 1 (translate updates + responses)
- [ ] WebSocket `/ws/chat/` with translation middleware
- [ ] `ChatInterface.tsx` + `MessageBubble.tsx` (original/translated toggle)
- [ ] WebSocket `/ws/meeting/` handler
- [ ] `MeetingRoom.tsx` + `useSpeechRecognition` hook + `SubtitleOverlay.tsx`

### Sprint 5: Polish (~1 hour)
- [ ] Teacher `Dashboard.tsx` — overview cards
- [ ] Mobile-responsive tweaks
- [ ] Demo flow end-to-end

**Total estimated: ~9 hours**
