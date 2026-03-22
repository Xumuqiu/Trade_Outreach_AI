from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class CustomerAssignment(Base):
    __tablename__ = "customer_assignments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True, unique=True)
    account_id = Column(Integer, ForeignKey("email_accounts.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="assigned")
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
