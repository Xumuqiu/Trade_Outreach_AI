from sqlalchemy.orm import Session

from app.models import Customer


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Customer]:
        return self.db.query(Customer).all()

    def get(self, customer_id: int) -> Customer | None:
        return self.db.query(Customer).filter(Customer.id == customer_id).first()
