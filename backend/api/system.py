from fastapi import APIRouter

from app.core.config import settings
from app.services.country_catalog_service import list_countries


router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status")
def get_status():
    api_key = settings.LLM_API_KEY or settings.OPENAI_API_KEY
    model = settings.LLM_MODEL or settings.OPENAI_MODEL
    return {
        "llm_configured": bool(api_key),
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": model,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "openai_model": settings.OPENAI_MODEL,
    }


@router.get("/countries")
def get_countries():
    return list_countries()
