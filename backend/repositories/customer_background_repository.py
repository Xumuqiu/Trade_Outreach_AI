from sqlalchemy.orm import Session

from app.models import CustomerBackground


class CustomerBackgroundRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_customer_id(self, customer_id: int) -> CustomerBackground | None:
        return (
            self.db.query(CustomerBackground)
            .filter(CustomerBackground.customer_id == customer_id)
            .first()
        )

    def create_or_update(self, customer_id: int, data: dict) -> CustomerBackground:
        instance = self.get_by_customer_id(customer_id)
        if instance is None:
            instance = CustomerBackground(customer_id=customer_id, **data)
            self.db.add(instance)
        else:
            for key, value in data.items():
                setattr(instance, key, value)
        self.db.commit()
        self.db.refresh(instance)
        return instance
