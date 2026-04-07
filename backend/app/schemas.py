from pydantic import BaseModel
from typing import Optional


# --- Module 1: Communication Hub ---

class DraftUpdateRequest(BaseModel):
    teacher_notes: str
    classroom_id: str


class DraftUpdateResponse(BaseModel):
    id: str
    teacher_notes: str
    generated_content: str
    home_activities: list[str]
    guided_prompts: list[str]
    status: str = "draft"


class RespondRequest(BaseModel):
    parent_id: str
    student_id: str
    prompt_index: int
    response_text: str


class InsightsResponse(BaseModel):
    update_id: str
    total_responses: int
    response_rate: float
    summary: str
    sentiment: dict
    themes: list[str]


# --- Module 2: Curriculum RAG ---

class CurriculumAskRequest(BaseModel):
    question: str
    year_level: Optional[str] = None
    subject: Optional[str] = None
    language: Optional[str] = "en"
    model: Optional[str] = "combined"  # "rag", "curricullm", or "combined"


class CurriculumAskResponse(BaseModel):
    answer: str
    translated_answer: Optional[str] = None
    sources: list[dict]
    model_used: Optional[str] = None


class IngestResponse(BaseModel):
    status: str
    documents_ingested: int
    collection: str


# --- Module 3: Messaging ---

class SendMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    text: str
    student_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    original_text: str
    original_language: str
    translated_text: str
    translated_language: str
    created_at: str


# --- On-demand Translation ---

# --- Module 4: Student Progress ---

class AchievementUpdate(BaseModel):
    subject: str
    term: str
    achievement_level: str
    naplan_band: Optional[str] = None
    score: Optional[float] = None
    teacher_comment: Optional[str] = None


class SkillUpdate(BaseModel):
    subject: str
    skill_name: str
    level: str


class CreateAssignment(BaseModel):
    classroom_id: str
    subject: str
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None


class AssignmentResult(BaseModel):
    student_id: str
    score: Optional[float] = None
    submitted: bool = False
    feedback: Optional[str] = ""


class BulkResultsUpdate(BaseModel):
    results: list[AssignmentResult]


class ImportRequest(BaseModel):
    source_url: Optional[str] = None
    classroom_id: str
    mapping: Optional[dict] = None


# --- On-demand Translation ---

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"


class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
