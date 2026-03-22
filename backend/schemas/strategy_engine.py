from pydantic import BaseModel

from app.schemas.value_content import ValueContentType


class StrategyEngineRequest(BaseModel):
    customer_id: int
    product_id: int | None = None
    value_content_type: ValueContentType = ValueContentType.industry_insights
    language: str | None = None


class CustomerProfile(BaseModel):
    summary: str
    risks: str
    opportunities: str
    positioning: str


class OutreachStrategy(BaseModel):
    goal: str
    core_value_message: str
    sequence_overview: str


class EmailDraft(BaseModel):
    subject: str
    body: str


class StrategyEngineResponse(BaseModel):
    customer_id: int
    product_id: int | None
    profile: CustomerProfile
    strategy: OutreachStrategy
    emails: list[EmailDraft]
