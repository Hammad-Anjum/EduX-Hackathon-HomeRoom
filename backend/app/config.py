import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # HuggingFace
    huggingfacehub_api_token: str = os.getenv("HUGGINGFACEHUB_API_TOKEN", "")
    hf_model_name: str = os.getenv("HF_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.3")
    hf_embedding_model: str = os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    # Paths
    data_dir: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    curriculum_dir: str = os.path.join(data_dir, "curriculum")
    chroma_dir: str = os.path.join(data_dir, "chroma_db")

    # ChromaDB
    chroma_collection_name: str = "curriculum"

    # CurricuLLM API
    curricullm_api_key: str = os.getenv("CURRICULLM_API_KEY", "")
    curricullm_base_url: str = os.getenv("CURRICULLM_BASE_URL", "https://api.curricullm.com/v1")
    curricullm_model: str = os.getenv("CURRICULLM_MODEL", "CurricuLLM-AU")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
