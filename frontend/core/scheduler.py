"""
Background scheduler.

This scheduler is started by FastAPI's lifespan hook in `main.py`.
Its job is to periodically run operational tasks that should happen even when
no user is actively calling APIs.

Current scheduled task:
- Daily follow-up scan (09:00 UTC):
  - Finds customers whose next follow-up is due (1-3-7 rule)
  - Generates a pending-approval draft email for sales to review
"""

from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.email_automation_service import EmailAutomationService
from app.services.followup_orchestrator_service import FollowUpOrchestratorService
from app.services.imap_polling_service import IMAPPollingService


def scan_and_generate_drafts():
    """
    Daily task to scan for customers who need follow-up drafts.
    """
    print("[Scheduler] Starting daily follow-up scan...")
    # Use context manager to ensure session is closed even if errors occur
    with SessionLocal() as db:
        try:
            service = FollowUpOrchestratorService(db)
            # Use UTC explicitly
            now = datetime.now(timezone.utc)
            drafts = service.generate_due_drafts(now=now)
            if drafts:
                print(f"[Scheduler] Generated {len(drafts)} new follow-up drafts.")
            else:
                print("[Scheduler] No new drafts needed today.")
        except Exception as e:
            print(f"[Scheduler] Error during scan: {e}")


def process_scheduled_sends():
    with SessionLocal() as db:
        try:
            EmailAutomationService(db).process_due_schedules()
        except Exception as e:
            print(f"[Scheduler] Error during scheduled sends: {e}")


def poll_inbox_replies():
    with SessionLocal() as db:
        try:
            processed = IMAPPollingService(db).poll()
            if processed:
                print(f"[Scheduler] IMAP polling processed {processed} messages.")
        except Exception as e:
            print(f"[Scheduler] Error during IMAP polling: {e}")


def start_scheduler():
    """
    Starts and returns the background scheduler.

    Notes:
    - Uses UTC for predictability in a demo environment.
    - In a production system, scheduling should likely consider per-account timezones.
    """
    # Explicitly configure timezone to UTC to avoid confusion
    scheduler = BackgroundScheduler(timezone="UTC")
    
    # Run every day at 9:00 AM UTC
    # Note: In production, you might want to configure this per user timezone or project setting
    trigger = CronTrigger(hour=9, minute=0, timezone="UTC")
    
    scheduler.add_job(
        scan_and_generate_drafts,
        trigger=trigger,
        id="daily_followup_scan",
        name="Daily Follow-up Scan",
        replace_existing=True,
    )

    scheduler.add_job(
        process_scheduled_sends,
        trigger=IntervalTrigger(minutes=1),
        id="scheduled_email_sends",
        name="Scheduled Email Sends",
        replace_existing=True,
    )

    scheduler.add_job(
        poll_inbox_replies,
        trigger=IntervalTrigger(minutes=5),
        id="imap_polling",
        name="IMAP Inbox Polling",
        replace_existing=True,
    )
    
    scheduler.start()
    print("[Scheduler] Background scheduler started. Daily scan scheduled for 09:00 UTC.")
    return scheduler
