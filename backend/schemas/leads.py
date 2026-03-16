from pydantic import BaseModel


class AssignCustomerRequest(BaseModel):
    account_id: int


class CustomerAssignmentOut(BaseModel):
    id: int
    customer_id: int
    account_id: int
    status: str

    class Config:
        from_attributes = True
