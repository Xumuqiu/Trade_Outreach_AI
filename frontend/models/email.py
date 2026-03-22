from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True, index=True)
    account_id = Column(Integer, ForeignKey("email_accounts.id"), nullable=True, index=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="draft")
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    country = Column(String, nullable=True)
    time_zone = Column(String, nullable=True)
