from fastapi import APIRouter

from app.core.config import settings


router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status")
def get_status():
    return {
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "openai_model": settings.OPENAI_MODEL,
    }

