from enum import Enum

from pydantic import BaseModel


class ValueContentType(str, Enum):
    industry_insights = "industry_insights"
    product_trend_report = "product_trend_report"
    design_inspiration = "design_inspiration"
    market_analysis = "market_analysis"


class ValueContentRequest(BaseModel):
    customer_id: int
    product_id: int | None = None
    content_type: ValueContentType
    language: str | None = None


class ValueContentItem(BaseModel):
    title: str
    summary: str
    body: str


class ValueContentResponse(BaseModel):
    content_type: ValueContentType
    customer_id: int
    product_id: int | None
    items: list[ValueContentItem]
