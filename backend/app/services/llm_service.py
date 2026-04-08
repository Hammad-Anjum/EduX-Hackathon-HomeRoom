import json
import logging
from huggingface_hub import InferenceClient
from langchain_huggingface import HuggingFaceEmbeddings

from app.config import settings

logger = logging.getLogger(__name__)

MODEL = "HuggingFaceH4/zephyr-7b-beta"


class LLMService:
    def __init__(self):
        logger.info("Initializing LLMService with model: %s, embeddings: %s", MODEL, settings.hf_embedding_model)
        self.client = InferenceClient(
            model=MODEL,
            token=settings.huggingfacehub_api_token,
        )
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.hf_embedding_model,
        )

    def _chat(self, prompt: str, max_tokens: int = 1024) -> str:
        """Send a prompt via chat completion and return the response text."""
        response = self.client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return (response.choices[0].message.content or "").strip()

    def get_embeddings(self) -> HuggingFaceEmbeddings:
        return self.embeddings

    def answer_question(self, question: str, context: str) -> str:
        """Answer a parent's curriculum question using RAG context."""
        prompt = f"""You are a helpful education assistant for parents in Australia.
Answer the parent's question using ONLY the curriculum information provided below.
Use plain, simple language — avoid education jargon. If you must use a technical term, explain it.
Give specific, practical examples of what the child should be able to do.
Keep your answer concise (3-5 sentences) and actionable.

Curriculum Information:
{context}

Parent's Question: {question}

Answer:"""
        return self._chat(prompt, max_tokens=512)

    def generate_update(self, teacher_notes: str) -> dict:
        """Convert brief teacher notes into a parent-friendly weekly update using 3 separate LLM calls."""
        # Call 1: Content
        content = self._chat(
            f"You are a school communication assistant. Write a warm, concise 2-paragraph summary for parents about what their children learned this week. No bullet points, no headers, just paragraphs.\n\nTeacher's notes: {teacher_notes}\n\nParent-friendly summary:",
            max_tokens=300,
        )
        logger.info("Content generated: %s", content[:200])

        # Call 2: Home activities
        activities_text = self._chat(
            f"Based on this classroom learning, suggest 3 simple activities parents can do at home with their child. One per line, starting with a dash. Keep each under 20 words.\n\nWhat was learned: {teacher_notes}\n\nHome activities:",
            max_tokens=200,
        )
        activities = [line.strip().lstrip("- ").lstrip("* ").strip() for line in activities_text.split("\n") if line.strip().lstrip("- ").lstrip("* ").strip()][:3]
        logger.info("Activities generated: %s", activities)

        # Call 3: Guided prompts
        prompts_text = self._chat(
            f"Write 3 short questions a teacher can ask parents about their child's learning this week. One per line, starting with a dash. Keep each under 15 words.\n\nTopic: {teacher_notes}\n\nQuestions for parents:",
            max_tokens=150,
        )
        prompts = [line.strip().lstrip("- ").lstrip("* ").strip() for line in prompts_text.split("\n") if line.strip().lstrip("- ").lstrip("* ").strip() and "?" in line][:3]
        logger.info("Prompts generated: %s", prompts)

        return {
            "content": content.strip(),
            "home_activities": activities,
            "guided_prompts": prompts,
        }

    def summarize_responses(self, responses: list[dict]) -> dict:
        """Summarize parent responses into insights for the teacher."""
        responses_text = "\n".join(
            f"- Parent {r.get('parent_id', '?')}: {r.get('translated_text', r.get('response_text', ''))}"
            for r in responses
        )
        prompt = f"""You are an education communication analyst.
Summarize these parent responses to a teacher's weekly update.
You MUST respond with ONLY valid JSON — no extra text, no markdown, no code blocks.

Parent responses:
{responses_text}

Respond with this exact JSON structure:
{{"summary": "2-3 sentence overall summary", "sentiment": {{"positive": 0.0, "neutral": 0.0, "concerned": 0.0}}, "themes": ["theme1", "theme2"], "follow_ups": ["Any specific concerns to follow up on"]}}

JSON:"""
        response_text = self._chat(prompt)
        return self._parse_json(response_text, {
            "summary": response_text,
            "sentiment": {"positive": 0.5, "neutral": 0.3, "concerned": 0.2},
            "themes": [],
            "follow_ups": [],
        })

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

        prompt = f"""You are an expert Australian K-12 education advisor. Analyse this student and generate personalised learning recommendations.

=== STUDENT DATA ===

ACHIEVEMENT LEVELS (term-over-term):
{achievements_text or 'No data'}

SKILL MASTERY:
{skills_text or 'No data'}

NAPLAN RESULTS (2025):
{naplan_text or 'No data'}

RECENT ASSIGNMENTS:
{assignments_text or 'No data'}

WELLBEING TREND: {wellbeing_text}

=== INSTRUCTIONS ===
1. Write a 2-3 sentence holistic summary covering strengths, growth areas, and wellbeing.
2. For EACH subject with data, write 2-3 specific actionable recommendations that reference the student's actual scores and skill levels. Suggest concrete activities appropriate for Australian primary school.
3. If wellbeing trend is declining, note this prominently in the summary.

Respond with ONLY valid JSON — no extra text, no markdown, no code blocks:
{{"summary": "2-3 sentence summary", "subjects": [{{"subject": "Mathematics", "recommendations": ["specific rec 1", "specific rec 2"]}}, ...]}}

JSON:"""
        response_text = self._chat(prompt)
        logger.info("LLM raw response (first 500 chars): %s", response_text[:500])

        result = self._parse_json(response_text, None)
        if result is None:
            logger.warning("Falling back to template-based recommendations")
            return self._fallback_recommendations(student_data)
        return result

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

    def _parse_json(self, text: str, fallback):
        """Try to parse JSON from LLM response, with extraction fallback."""
        # Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to find a valid JSON object by scanning from each { to matching }
        for i, ch in enumerate(text):
            if ch == '{':
                depth = 0
                for j in range(i, len(text)):
                    if text[j] == '{':
                        depth += 1
                    elif text[j] == '}':
                        depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[i:j + 1])
                        except json.JSONDecodeError:
                            break

        logger.warning("Could not parse JSON from LLM response")
        return fallback


# Singleton
llm_service = LLMService()
