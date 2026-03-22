from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class SuccessCase(Base):
    __tablename__ = "success_cases"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    project_description = Column(Text, nullable=True)
    result_summary = Column(Text, nullable=True)
