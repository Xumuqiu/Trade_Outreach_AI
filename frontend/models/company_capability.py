from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class CompanyCapability(Base):
    __tablename__ = "company_capabilities"

    id = Column(Integer, primary_key=True, index=True)
    moq = Column(String, nullable=True)
    lead_time = Column(String, nullable=True)
    customization_capability = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
