from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.company_capability import (
    CompanyCapabilityCreate,
    CompanyCapabilityOut,
)
from app.schemas.product_matrix import ProductMatrixCreate, ProductMatrixOut
from app.schemas.success_case import SuccessCaseCreate, SuccessCaseOut
from app.services.company_knowledge_service import CompanyKnowledgeService


router = APIRouter(prefix="/company", tags=["company"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/product-matrix", response_model=list[ProductMatrixOut])
def list_product_matrix(db: Session = Depends(get_db)):
    service = CompanyKnowledgeService(db)
    return service.list_product_matrix()


@router.post("/product-matrix", response_model=ProductMatrixOut)
def create_product_matrix(payload: ProductMatrixCreate, db: Session = Depends(get_db)):
    service = CompanyKnowledgeService(db)
    return service.add_product_matrix(payload)


@router.get("/capabilities", response_model=list[CompanyCapabilityOut])
def list_company_capabilities(db: Session = Depends(get_db)):
    service = CompanyKnowledgeService(db)
    return service.list_company_capabilities()


@router.post("/capabilities", response_model=CompanyCapabilityOut)
def create_company_capability(
    payload: CompanyCapabilityCreate,
    db: Session = Depends(get_db),
):
    service = CompanyKnowledgeService(db)
    return service.add_company_capability(payload)


@router.get("/success-cases", response_model=list[SuccessCaseOut])
def list_success_cases(db: Session = Depends(get_db)):
    service = CompanyKnowledgeService(db)
    return service.list_success_cases()


@router.post("/success-cases", response_model=SuccessCaseOut)
def create_success_case(payload: SuccessCaseCreate, db: Session = Depends(get_db)):
    service = CompanyKnowledgeService(db)
    return service.add_success_case(payload)
