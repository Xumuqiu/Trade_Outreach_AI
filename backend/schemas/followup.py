from enum import Enum
from datetime import datetime

from pydantic import BaseModel


class FollowUpStatus(str, Enum):
    NEW_LEAD = "NEW_LEAD"
    CONTACTED = "CONTACTED"
    EMAIL_OPENED = "EMAIL_OPENED"
    REPLIED = "REPLIED"
    FOLLOWUP_1 = "FOLLOWUP_1"
    FOLLOWUP_2 = "FOLLOWUP_2"
    FOLLOWUP_3 = "FOLLOWUP_3"
    STOPPED = "STOPPED"


class CustomerFollowUpState(BaseModel):
    customer_id: int
    status: FollowUpStatus
    sequence_step: int
    last_contacted_at: datetime | None = None
    next_action: str | None = None


class FollowUpEventType(str, Enum):
    EMAIL_SENT = "EMAIL_SENT"
    EMAIL_OPENED = "EMAIL_OPENED"
    EMAIL_REPLIED = "EMAIL_REPLIED"
    EMAIL_AUTO_REPLIED = "EMAIL_AUTO_REPLIED"


class FollowUpEvent(BaseModel):
    customer_id: int
    email_id: int
    event_type: FollowUpEventType


class FollowUpDraftRequest(BaseModel):
    customer_id: int
    account_id: int | None = None
    product_id: int | None = None
    language: str | None = None


class FollowUpDraftResponse(BaseModel):
    customer_id: int
    email_id: int
    stage: FollowUpStatus
