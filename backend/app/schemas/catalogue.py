from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from .form import DataSourceSchema

class CatalogueFieldBase(BaseModel):
    internalId: str
    type: str
    nlapiSubmitField: bool = False
    label: str
    required: bool = False
    transactionType: str  # purchase_order, sales_order, ap, ar
    isSystemField: bool = True
    dataSource: Optional[DataSourceSchema] = None

class CatalogueFieldCreate(CatalogueFieldBase):
    pass

class CatalogueFieldUpdate(BaseModel):
    internalId: Optional[str] = None
    type: Optional[str] = None
    nlapiSubmitField: Optional[bool] = None
    label: Optional[str] = None
    required: Optional[bool] = None
    transactionType: Optional[str] = None
    isSystemField: Optional[bool] = None
    dataSource: Optional[DataSourceSchema] = None

class CatalogueFieldResponse(CatalogueFieldBase):
    id: str = Field(alias="_id")
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
