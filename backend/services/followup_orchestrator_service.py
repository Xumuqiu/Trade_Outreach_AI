"""
Follow-up orchestrator.

Responsibility:
- Read current CustomerState (outreach state machine)
- Decide the next follow-up stage (CONTACTED -> FOLLOWUP_1 -> FOLLOWUP_2 -> FOLLOWUP_3)
- Build a stage-specific prompt using structured CustomerBackground and internal knowledge
- Call the LLM to generate a follow-up email draft and store it as pending_approval

Important:
- This is used both by the UI (generate-next) and by the scheduler (generate-due).
- Fails fast if OPENAI_API_KEY is missing to avoid mock output.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.ai_client import AIClient, OpenAIClient
from app.core.config import settings
from app.models import CustomerBackground, CustomerState, Email, EmailEvent
from app.prompts.followup_prompts import build_followup_email_prompt
from app.schemas.followup import FollowUpDraftRequest, FollowUpDraftResponse, FollowUpStatus
from app.schemas.strategy_engine import StrategyEngineRequest
from app.schemas.value_content import ValueContentRequest, ValueContentType
from app.services.company_knowledge_service import CompanyKnowledgeService
from app.services.followup_state_service import FollowUpStateService
from app.services.value_content_service import ValueContentService


class FollowUpOrchestratorService:
    def __init__(self, db: Session, ai_client: AIClient | None = None):
        self.db = db
        self.ai_client = ai_client or OpenAIClient()
        self.knowledge_service = CompanyKnowledgeService(db)
        self.value_content_service = ValueContentService(db, ai_client=self.ai_client)
        self.state_service = FollowUpStateService(db)

    def generate_next_draft(self, request: FollowUpDraftRequest) -> FollowUpDraftResponse:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured")

        state = self.state_service.get_state(request.customer_id)
        if state.status in {FollowUpStatus.REPLIED, FollowUpStatus.STOPPED}:
            raise ValueError("Customer is not eligible for follow-up")

        stage = self._next_stage_from_state(state.status, state.sequence_step)
        if stage == FollowUpStatus.STOPPED:
            raise ValueError("Customer is stopped")

        existing = (
            self.db.query(Email)
            .filter(
                Email.customer_id == request.customer_id,
                Email.status == "pending_approval",
            )
            .first()
        )
        if existing is not None:
            return FollowUpDraftResponse(
                customer_id=request.customer_id,
                email_id=existing.id,
                stage=stage,
            )

        customer_background = (
            self.db.query(CustomerBackground)
            .filter(CustomerBackground.customer_id == request.customer_id)
            .first()
        )

        account_id = request.account_id or self._infer_account_id(request.customer_id)

        strategy_request = StrategyEngineRequest(
            customer_id=request.customer_id,
            product_id=request.product_id,
            language=request.language,
        )

        value_content = self.value_content_service.generate(
            ValueContentRequest(
                customer_id=request.customer_id,
                product_id=request.product_id,
                content_type=ValueContentType.industry_insights,
                language=request.language,
            )
        )

        prompt = build_followup_email_prompt(
            status=stage,
            request=strategy_request,
            customer_background=customer_background,
            knowledge_service=self.knowledge_service,
            value_content=value_content,
        )

        output = self.ai_client.generate(prompt)
        subject, body = self._parse_subject_body(output)

        email = Email(
            customer_id=request.customer_id,
            product_id=request.product_id,
            strategy_id=None,
            account_id=account_id,
            subject=subject,
            body=body,
            status="pending_approval",
            country=None,
            time_zone=None,
        )
        self.db.add(email)
        self.db.commit()
        self.db.refresh(email)

        return FollowUpDraftResponse(customer_id=request.customer_id, email_id=email.id, stage=stage)

    def generate_due_drafts(self, now: datetime | None = None) -> list[FollowUpDraftResponse]:
        if now is None:
            now = datetime.utcnow()

        # Find customers who are in an active follow-up state (CONTACTED, FOLLOWUP_1, FOLLOWUP_2)
        # We also include EMAIL_OPENED, but typically we want to follow up even if they didn't open
        target_statuses = [
            FollowUpStatus.CONTACTED.value,
            FollowUpStatus.FOLLOWUP_1.value,
            FollowUpStatus.FOLLOWUP_2.value,
            FollowUpStatus.EMAIL_OPENED.value,
        ]
        
        states = self.db.query(CustomerState).filter(CustomerState.status.in_(target_statuses)).all()
        results: list[FollowUpDraftResponse] = []

        for st in states:
            state = self.state_service.get_state(st.customer_id)
            
            # Skip if already replied or stopped
            if state.status in (FollowUpStatus.REPLIED, FollowUpStatus.STOPPED):
                continue

            delay = self.state_service.next_followup_delay(state)
            if delay is None:
                continue

            # Base the delay on the last contact time
            last_contact = state.last_contacted_at
            if last_contact is None:
                continue

            due_at = last_contact + delay
            if due_at > now:
                continue

            existing = (
                self.db.query(Email)
                .filter(
                    Email.customer_id == st.customer_id,
                    Email.status == "pending_approval",
                )
                .first()
            )
            if existing is not None:
                continue

            results.append(
                self.generate_next_draft(
                    FollowUpDraftRequest(customer_id=st.customer_id)
                )
            )

        return results

    def _latest_opened_at(self, customer_id: int) -> datetime | None:
        row = (
            self.db.query(EmailEvent.occurred_at)
            .join(Email, Email.id == EmailEvent.email_id)
            .filter(Email.customer_id == customer_id, EmailEvent.event_type == "opened")
            .order_by(EmailEvent.occurred_at.desc())
            .first()
        )
        if row is None:
            return None
        return row[0]

    def _infer_account_id(self, customer_id: int) -> int | None:
        row = (
            self.db.query(Email.account_id)
            .filter(Email.customer_id == customer_id, Email.account_id.isnot(None))
            .order_by(Email.id.desc())
            .first()
        )
        if row is None:
            return None
        return row[0]

    def _next_stage_from_state(self, status: FollowUpStatus, sequence_step: int) -> FollowUpStatus:
        if sequence_step <= 0:
            return FollowUpStatus.CONTACTED
        if sequence_step == 1:
            return FollowUpStatus.FOLLOWUP_1
        if sequence_step == 2:
            return FollowUpStatus.FOLLOWUP_2
        if sequence_step == 3:
            return FollowUpStatus.FOLLOWUP_3
        return FollowUpStatus.STOPPED

    def _parse_subject_body(self, output: str) -> tuple[str, str]:
        subject = "Follow-up"
        body = output
        lines = [line.strip() for line in output.splitlines() if line.strip()]
        for idx, line in enumerate(lines):
            lower = line.lower()
            if lower.startswith("subject:"):
                subject = line.split(":", 1)[1].strip()
                body = "\n".join(lines[idx + 1 :]).strip()
                break
        return subject, body

    def _fallback_email(
        self,
        stage: FollowUpStatus,
        customer_background: CustomerBackground | None,
        value_summary: str,
    ) -> tuple[str, str]:
        company = customer_background.company_name if customer_background else "your company"
        if stage == FollowUpStatus.FOLLOWUP_1:
            subject = f"Quick follow-up on a value idea for {company}"
        elif stage == FollowUpStatus.FOLLOWUP_2:
            subject = f"One more idea that may help {company}"
        elif stage == FollowUpStatus.FOLLOWUP_3:
            subject = f"Checking in — is this relevant for {company}?"
        else:
            subject = f"Following up"

        body_lines: list[str] = []
        body_lines.append("Hi there,")
        body_lines.append("")
        body_lines.append(value_summary)
        body_lines.append("")
        if stage == FollowUpStatus.FOLLOWUP_3:
            body_lines.append("If now isn’t the right time, no worries—just let me know and I’ll stop reaching out.")
        else:
            body_lines.append("If this is interesting, happy to share a few ideas—would a quick chat be helpful?")
        body_lines.append("")
        body_lines.append("Best regards,")
        body_lines.append("Sales Team")

        return subject, "\n".join(body_lines)
