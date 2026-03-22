from sqlalchemy.orm import Session

from app.models import Product


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Product]:
        return self.db.query(Product).all()
