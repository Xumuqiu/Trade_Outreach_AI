from sqlalchemy.orm import Session

from app.models import Strategy


class StrategyRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Strategy]:
        return self.db.query(Strategy).all()
