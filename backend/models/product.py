from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    value_prop = Column(Text, nullable=True)
    ideal_customer_profile = Column(Text, nullable=True)
