from sqlalchemy.orm import Session

from app.models import SuccessCase


class SuccessCaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[SuccessCase]:
        return self.db.query(SuccessCase).all()

    def create(self, data: dict) -> SuccessCase:
        instance = SuccessCase(**data)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete_by_id(self, item_id: int) -> bool:
        instance = self.db.query(SuccessCase).filter(SuccessCase.id == item_id).first()
        if instance is None:
            return False
        self.db.delete(instance)
        self.db.commit()
        return True
