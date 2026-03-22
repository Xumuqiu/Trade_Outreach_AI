import base64
import json
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse, Response

from app.database import SessionLocal
from app.schemas.email_automation import EmailEventIn
from app.services.email_automation_service import EmailAutomationService


router = APIRouter(prefix="/track", tags=["track"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


PIXEL_GIF = base64.b64decode("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==")


@router.get("/open")
def track_open(email_id: int, request: Request, db: Session = Depends(get_db)):
    service = EmailAutomationService(db)
    meta = json.dumps(
        {
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "referer": request.headers.get("referer"),
        }
    )
    service.record_event(EmailEventIn(email_id=email_id, event_type="opened", meta=meta))
    return Response(content=PIXEL_GIF, media_type="image/gif")


@router.get("/click")
def track_click(email_id: int, url: str, request: Request, db: Session = Depends(get_db)):
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid url")

    service = EmailAutomationService(db)
    meta = json.dumps(
        {
            "url": url,
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "referer": request.headers.get("referer"),
        }
    )
    service.record_event(EmailEventIn(email_id=email_id, event_type="clicked", meta=meta))
    return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
