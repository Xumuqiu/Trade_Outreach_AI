from sqlalchemy import Column, Integer, Text

from app.database import Base


class ProductMatrix(Base):
    __tablename__ = "product_matrix"

    id = Column(Integer, primary_key=True, index=True)
    main_product_categories = Column(Text, nullable=False)
    product_features = Column(Text, nullable=True)
