import json
import logging
from langchain_huggingface import HuggingFaceEndpoint, HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        logger.info("Initializing LLMService with model: meta-llama/Llama-2-7b-chat-hf")
        self.llm = HuggingFaceEndpoint(
            model="meta-llama/Llama-2-7b-chat-hf",
            huggingfacehub_api_token=settings.huggingfacehub_api_token,
            temperature=0.3,
            max_new_tokens=1024,
        )
        self.embeddings = HuggingFaceEmbeddings(
            model_name="meta-llama/Llama-2-7b-chat-hf",
        )

    def get_embeddings(self) -> HuggingFaceEmbeddings:
        return self.embeddings

    def answer_question(self, question: str, context: str) -> str:
        """Answer a parent's curriculum question using RAG context."""
        prompt = PromptTemplate(
            template="""You are a helpful education assistant for parents in Australia.
Answer the parent's question using ONLY the curriculum information provided below.
Use plain, simple language — avoid education jargon. If you must use a technical term, explain it.
Give specific, practical examples of what the child should be able to do.
Keep your answer concise (3-5 sentences) and actionable.

Curriculum Information:
{context}

Parent's Question: {question}

Answer:""",
            input_variables=["context", "question"],
        )
        chain = prompt | self.llm
        response = chain.invoke({"context": context, "question": question})
        return response.strip() if isinstance(response, str) else str(response).strip()

    def generate_update(self, teacher_notes: str) -> dict:
        """Convert brief teacher notes into a parent-friendly weekly update."""
        prompt = PromptTemplate(
            template="""You are a school communication assistant helping teachers write parent updates.

Convert the teacher's brief notes into a warm, parent-friendly weekly update.
You MUST respond with ONLY valid JSON — no extra text, no markdown.

Teacher's notes: {notes}

Respond with this exact JSON structure:
{{"content": "A warm 2-3 paragraph summary of what children learned this week, written for parents", "home_activities": ["Activity 1 parents can do at home", "Activity 2 parents can do at home"], "guided_prompts": ["Question 1 for parents to respond to?", "Question 2 for parents to respond to?", "Question 3 for parents to respond to?"]}}

JSON:""",
            input_variables=["notes"],
        )
        chain = prompt | self.llm
        response = chain.invoke({"notes": teacher_notes})
        response_text = response.strip() if isinstance(response, str) else str(response).strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(response_text[start:end])
            return {
                "content": response_text,
                "home_activities": [],
                "guided_prompts": [],
            }

    def summarize_responses(self, responses: list[dict]) -> dict:
        """Summarize parent responses into insights for the teacher."""
        responses_text = "\n".join(
            f"- Parent {r.get('parent_id', '?')}: {r.get('translated_text', r.get('response_text', ''))}"
            for r in responses
        )

        prompt = PromptTemplate(
            template="""You are an education communication analyst.
Summarize these parent responses to a teacher's weekly update.
You MUST respond with ONLY valid JSON — no extra text, no markdown.

Parent responses:
{responses}

Respond with this exact JSON structure:
{{"summary": "2-3 sentence overall summary", "sentiment": {{"positive": 0.0, "neutral": 0.0, "concerned": 0.0}}, "themes": ["theme1", "theme2"], "follow_ups": ["Any specific concerns to follow up on"]}}

JSON:""",
            input_variables=["responses"],
        )
        chain = prompt | self.llm
        response = chain.invoke({"responses": responses_text})
        response_text = response.strip() if isinstance(response, str) else str(response).strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(response_text[start:end])
            return {
                "summary": response_text,
                "sentiment": {"positive": 0.5, "neutral": 0.3, "concerned": 0.2},
                "themes": [],
                "follow_ups": [],
            }


    def generate_recommendations(self, student_data: dict) -> dict:
        """Generate personalised recommendations from aggregated student data."""
        logger.info("generate_recommendations called with %d progress, %d skills, %d naplan, %d assignments",
                     len(student_data.get("progress", [])), len(student_data.get("skills", [])),
                     len(student_data.get("naplan", [])), len(student_data.get("assignments", [])))
        achievements_text = ""
        progress_by_subj: dict[str, list] = {}
        for p in student_data.get("progress", []):
            progress_by_subj.setdefault(p["subject"], []).append(p)
        for subj, records in progress_by_subj.items():
            records.sort(key=lambda x: x.get("term", ""))
            parts = [f"{r['term']}={r.get('achievement_level','?')}({r.get('score','?')})" for r in records]
            achievements_text += f"{subj}: {' -> '.join(parts)}\n"

        skills_text = ""
        skills_by_subj: dict[str, list] = {}
        for s in student_data.get("skills", []):
            skills_by_subj.setdefault(s["subject"], []).append(s)
        for subj, skills in skills_by_subj.items():
            parts = [f"{s['skill_name']}({s['level']})" for s in skills]
            skills_text += f"{subj}: {', '.join(parts)}\n"

        naplan_text = "\n".join(
            f"{n['domain']}={n.get('band','?')}({n.get('score','?')})"
            for n in student_data.get("naplan", [])
        )

        assignments_text = "\n".join(
            f"{a['title']} ({a['subject']}): {a.get('result',{}).get('score','?')}/100 — \"{a.get('result',{}).get('feedback','')}\""
            for a in student_data.get("assignments", [])
        )

        wb = student_data.get("wellbeing", {})
        wellbeing_text = f"{wb.get('trend', 'unknown')} (avg zone: {wb.get('avg_zone', '?')}/5)"

        prompt = PromptTemplate(
            template="""You are an expert Australian K-12 education advisor. Analyse this student and generate personalised learning recommendations.

=== STUDENT DATA ===

ACHIEVEMENT LEVELS (term-over-term):
{achievements}

SKILL MASTERY:
{skills}

NAPLAN RESULTS (2025):
{naplan}

RECENT ASSIGNMENTS:
{assignments}

WELLBEING TREND: {wellbeing}

=== INSTRUCTIONS ===
1. Write a 2-3 sentence holistic summary covering strengths, growth areas, and wellbeing.
2. For EACH subject with data, write 2-3 specific actionable recommendations that reference the student's actual scores and skill levels. Suggest concrete activities appropriate for Australian primary school.
3. If wellbeing trend is declining, note this prominently in the summary.

Respond with ONLY valid JSON:
{{"summary": "2-3 sentence summary", "subjects": [{{"subject": "Mathematics", "recommendations": ["specific rec 1", "specific rec 2"]}}, ...]}}

JSON:""",
            input_variables=["achievements", "skills", "naplan", "assignments", "wellbeing"],
        )
        chain = prompt | self.llm
        response = chain.invoke({
            "achievements": achievements_text or "No data",
            "skills": skills_text or "No data",
            "naplan": naplan_text or "No data",
            "assignments": assignments_text or "No data",
            "wellbeing": wellbeing_text,
        })
        response_text = response.strip() if isinstance(response, str) else str(response).strip()
        logger.info("LLM raw response (first 500 chars): %s", response_text[:500])

        try:
            parsed = json.loads(response_text)
            logger.info("LLM response parsed as JSON successfully")
            return parsed
        except json.JSONDecodeError:
            logger.warning("Direct JSON parse failed, trying to extract JSON from response")
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    parsed = json.loads(response_text[start:end])
                    logger.info("Extracted JSON successfully from position %d-%d", start, end)
                    return parsed
                except json.JSONDecodeError as e2:
                    logger.error("Extracted JSON also failed to parse: %s", e2)
            logger.warning("Falling back to template-based recommendations")
            return self._fallback_recommendations(student_data)

    def _fallback_recommendations(self, student_data: dict) -> dict:
        """Rule-based recommendations when LLM is unavailable."""
        subjects: dict[str, list[str]] = {}

        for s in student_data.get("skills", []):
            if s["level"] in ("Beginning", "Developing"):
                subjects.setdefault(s["subject"], []).append(
                    f"Focus on \"{s['skill_name']}\" — currently at {s['level']} level. Practise this skill regularly at home."
                )

        for n in student_data.get("naplan", []):
            if n.get("band") in ("Developing", "Needs Additional Support"):
                subj = "English" if n["domain"] in ("Reading", "Writing", "Spelling", "Grammar and Punctuation") else "Mathematics"
                subjects.setdefault(subj, []).append(
                    f"NAPLAN {n['domain']} is at {n['band']} ({n.get('score', '?')}). Dedicate extra practice time to {n['domain'].lower()}."
                )

        progress_by_subj: dict[str, list] = {}
        for p in student_data.get("progress", []):
            progress_by_subj.setdefault(p["subject"], []).append(p)
        for subj, records in progress_by_subj.items():
            records.sort(key=lambda x: x.get("term", ""))
            if len(records) >= 2 and records[-1].get("score", 0) < records[-2].get("score", 0):
                subjects.setdefault(subj, []).append(
                    f"Score dropped from {records[-2]['score']} to {records[-1]['score']}. Review recent topics and practise fundamentals."
                )

        wb = student_data.get("wellbeing", {})
        trend_note = " Wellbeing is declining — please assess." if wb.get("trend") == "declining" else ""
        summary = f"Template-based analysis.{trend_note} Review skill gaps and NAPLAN results below."

        return {
            "summary": summary,
            "subjects": [{"subject": s, "recommendations": recs[:3]} for s, recs in subjects.items()],
        }


# Singleton
llm_service = LLMService()
