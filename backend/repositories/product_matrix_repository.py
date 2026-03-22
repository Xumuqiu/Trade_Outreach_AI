from sqlalchemy.orm import Session

from app.models import ProductMatrix


class ProductMatrixRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[ProductMatrix]:
        return self.db.query(ProductMatrix).all()

    def create(self, data: dict) -> ProductMatrix:
        instance = ProductMatrix(**data)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete_by_id(self, item_id: int) -> bool:
        instance = self.db.query(ProductMatrix).filter(ProductMatrix.id == item_id).first()
        if instance is None:
            return False
        self.db.delete(instance)
        self.db.commit()
        return True
