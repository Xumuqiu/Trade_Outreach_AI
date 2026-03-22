from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class CustomerState(Base):
    __tablename__ = "customer_states"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="NEW_LEAD")
    sequence_step = Column(Integer, nullable=False, default=0)
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)
    next_action = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
