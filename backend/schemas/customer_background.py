from datetime import datetime

from pydantic import BaseModel


class CustomerBackgroundBase(BaseModel):
    company_name: str
    founded_year: int | None = None
    company_size_employees: str | None = None
    company_size_revenue: str | None = None
    company_size_purchasing_volume: str | None = None
    company_type: str | None = None
    main_market: str | None = None
    has_own_brand: bool | None = None
    product_matrix_description: str | None = None
    customization_requirement: str | None = None
    ecommerce_seller: bool | None = None
    independent_store: bool | None = None
    offline_retail: bool | None = None
    corporate_gifts: bool | None = None
    average_price_level: str | None = None
    design_style: str | None = None
    target_customer_profile: str | None = None
    sustainability_focus: str | None = None
    public_supplier_information: str | None = None
    long_term_factory_relationship: str | None = None
    product_line_change_frequency: str | None = None
    buyer_role: str | None = None
    linkedin_activity: str | None = None
    has_product_manager: bool | None = None
    decision_maker_role: str | None = None
    previous_contact: bool | None = None
    contact_notes: str | None = None
    last_contact_time: datetime | None = None
    additional_notes: str | None = None


class CustomerBackgroundCreate(CustomerBackgroundBase):
    pass


class CustomerBackgroundUpdate(CustomerBackgroundBase):
    pass


class CustomerBackgroundOut(CustomerBackgroundBase):
    id: int
    customer_id: int

    class Config:
        from_attributes = True
