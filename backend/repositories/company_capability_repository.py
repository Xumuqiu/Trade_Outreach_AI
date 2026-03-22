from sqlalchemy.orm import Session

from app.models import CompanyCapability


class CompanyCapabilityRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[CompanyCapability]:
        return self.db.query(CompanyCapability).all()

    def create(self, data: dict) -> CompanyCapability:
        instance = CompanyCapability(**data)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete_by_id(self, item_id: int) -> bool:
        instance = self.db.query(CompanyCapability).filter(CompanyCapability.id == item_id).first()
        if instance is None:
            return False
        self.db.delete(instance)
        self.db.commit()
        return True
