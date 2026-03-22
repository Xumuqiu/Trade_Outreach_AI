from pydantic import BaseModel


class ProductMatrixBase(BaseModel):
    main_product_categories: str
    product_features: str | None = None


class ProductMatrixCreate(ProductMatrixBase):
    pass


class ProductMatrixUpdate(ProductMatrixBase):
    pass


class ProductMatrixOut(ProductMatrixBase):
    id: int

    class Config:
        from_attributes = True
