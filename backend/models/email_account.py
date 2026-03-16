from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class EmailAccount(Base):
    __tablename__ = "email_accounts"

    id = Column(Integer, primary_key=True, index=True)
    salesperson_name = Column(String, nullable=False)
    email_address = Column(String, nullable=False, unique=True, index=True)
    provider = Column(String, nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    time_zone = Column(String, nullable=True)
    country = Column(String, nullable=True)
