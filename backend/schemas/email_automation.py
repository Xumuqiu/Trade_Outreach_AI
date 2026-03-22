from datetime import datetime

from pydantic import BaseModel, EmailStr


class EmailAccountCreate(BaseModel):
    salesperson_name: str
    sender_name: str | None = None
    email_address: EmailStr
    provider: str | None = None
    time_zone: str | None = None
    country: str | None = None


class EmailAccountOut(BaseModel):
    id: int
    salesperson_name: str
    sender_name: str | None = None
    email_address: EmailStr
    provider: str | None
    is_active: bool
    time_zone: str | None
    country: str | None

    class Config:
        from_attributes = True


class EmailComposeRequest(BaseModel):
    customer_id: int
    product_id: int | None = None
    strategy_id: int | None = None
    account_id: int
    subject: str
    body: str
    country: str | None = None
    time_zone: str | None = None


class EmailScheduleRequest(BaseModel):
    email_id: int
    desired_local_hour: int | None = None
    earliest_utc: datetime | None = None


class EmailSendNowRequest(BaseModel):
    email_id: int


class EmailEventIn(BaseModel):
    email_id: int
    event_type: str
    meta: str | None = None
