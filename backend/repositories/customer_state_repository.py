from sqlalchemy.orm import Session

from app.models import CustomerState


class CustomerStateRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[CustomerState]:
        return self.db.query(CustomerState).all()

    def get_by_customer_id(self, customer_id: int) -> CustomerState | None:
        return (
            self.db.query(CustomerState)
            .filter(CustomerState.customer_id == customer_id)
            .first()
        )

    def get_or_create(self, customer_id: int) -> CustomerState:
        state = self.get_by_customer_id(customer_id)
        if state is None:
            state = CustomerState(customer_id=customer_id)
            self.db.add(state)
            self.db.commit()
            self.db.refresh(state)
        return state

    def save(self, state: CustomerState) -> CustomerState:
        self.db.add(state)
        self.db.commit()
        self.db.refresh(state)
        return state
