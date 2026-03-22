from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    stage = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
