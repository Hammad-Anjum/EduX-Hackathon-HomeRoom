import json
from langchain_huggingface import HuggingFaceEndpoint, HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate

from app.config import settings


class LLMService:
    def __init__(self):
        self.llm = HuggingFaceEndpoint(
            repo_id=settings.hf_model_name,
            huggingfacehub_api_token=settings.huggingfacehub_api_token,
            temperature=0.3,
            max_new_tokens=1024,
        )
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.hf_embedding_model,
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


# Singleton
llm_service = LLMService()
