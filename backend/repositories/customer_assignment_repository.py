from sqlalchemy.orm import Session

from app.models import CustomerAssignment


class CustomerAssignmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_customer_id(self, customer_id: int) -> CustomerAssignment | None:
        return (
            self.db.query(CustomerAssignment)
            .filter(CustomerAssignment.customer_id == customer_id)
            .first()
        )

    def upsert(self, customer_id: int, account_id: int) -> CustomerAssignment:
        assignment = self.get_by_customer_id(customer_id)
        if assignment is None:
            assignment = CustomerAssignment(customer_id=customer_id, account_id=account_id)
            self.db.add(assignment)
        else:
            assignment.account_id = account_id
            assignment.status = "assigned"
        self.db.commit()
        self.db.refresh(assignment)
        return assignment
