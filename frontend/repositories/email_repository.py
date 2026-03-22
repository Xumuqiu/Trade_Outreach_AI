from sqlalchemy.orm import Session

from app.models import Email


class EmailRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Email]:
        return self.db.query(Email).all()
