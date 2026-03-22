from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class EmailSchedule(Base):
    __tablename__ = "email_schedules"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("email_accounts.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    scheduled_time_utc = Column(DateTime(timezone=True), nullable=False)
    preferred_local_hour = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="pending")
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    next_attempt_at = Column(DateTime(timezone=True), nullable=True)
    max_attempts = Column(Integer, nullable=False, default=3)
    attempt_count = Column(Integer, nullable=False, default=0)
