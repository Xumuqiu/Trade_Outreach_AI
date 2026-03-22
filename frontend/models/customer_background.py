from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class CustomerBackground(Base):
    __tablename__ = "customer_backgrounds"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True, unique=True)
    company_name = Column(String, nullable=False)
    founded_year = Column(Integer, nullable=True)
    company_size_employees = Column(String, nullable=True)
    company_size_revenue = Column(String, nullable=True)
    company_size_purchasing_volume = Column(String, nullable=True)
    company_type = Column(String, nullable=True)
    main_market = Column(String, nullable=True)
    has_own_brand = Column(Boolean, nullable=True)
    product_matrix_description = Column(Text, nullable=True)
    customization_requirement = Column(Text, nullable=True)
    ecommerce_seller = Column(Boolean, nullable=True)
    independent_store = Column(Boolean, nullable=True)
    offline_retail = Column(Boolean, nullable=True)
    corporate_gifts = Column(Boolean, nullable=True)
    average_price_level = Column(String, nullable=True)
    design_style = Column(String, nullable=True)
    target_customer_profile = Column(Text, nullable=True)
    sustainability_focus = Column(Text, nullable=True)
    public_supplier_information = Column(Text, nullable=True)
    long_term_factory_relationship = Column(Text, nullable=True)
    product_line_change_frequency = Column(String, nullable=True)
    buyer_role = Column(String, nullable=True)
    linkedin_activity = Column(Text, nullable=True)
    has_product_manager = Column(Boolean, nullable=True)
    decision_maker_role = Column(String, nullable=True)
    previous_contact = Column(Boolean, nullable=True)
    contact_notes = Column(Text, nullable=True)
    last_contact_time = Column(DateTime(timezone=True), nullable=True)
    additional_notes = Column(Text, nullable=True)
