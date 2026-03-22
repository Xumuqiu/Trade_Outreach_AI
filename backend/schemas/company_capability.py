from pydantic import BaseModel


class CompanyCapabilityBase(BaseModel):
    moq: str | None = None
    lead_time: str | None = None
    customization_capability: str | None = None
    certifications: str | None = None


class CompanyCapabilityCreate(CompanyCapabilityBase):
    pass


class CompanyCapabilityUpdate(CompanyCapabilityBase):
    pass


class CompanyCapabilityOut(CompanyCapabilityBase):
    id: int

    class Config:
        from_attributes = True
