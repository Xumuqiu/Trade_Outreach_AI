from pydantic import BaseModel


class SuccessCaseBase(BaseModel):
    client_name: str
    project_description: str | None = None
    result_summary: str | None = None


class SuccessCaseCreate(SuccessCaseBase):
    pass


class SuccessCaseUpdate(SuccessCaseBase):
    pass


class SuccessCaseOut(SuccessCaseBase):
    id: int

    class Config:
        from_attributes = True
