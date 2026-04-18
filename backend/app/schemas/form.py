from pydantic import BaseModel, Field, validator
from typing import List, Optional, Any, Dict
from datetime import datetime

class FieldLayoutSchema(BaseModel):
    columnBreak: bool = False
    spaceBefore: bool = False
    order: int = 0

class FieldSchema(BaseModel):
    fieldId: str
    label: str
    visible: bool = True
    mandatory: bool = False
    displayType: str = "normal"
    checkBoxDefault: str = "default"
    layout: FieldLayoutSchema = FieldLayoutSchema()

class FieldGroupSchema(BaseModel):
    id: str
    name: str
    order: int = 0
    fields: List[FieldSchema] = []

class TabSchema(BaseModel):
    name: str
    visible: bool = True
    fieldGroups: List[FieldGroupSchema] = []

class FormStructure(BaseModel):
    tabs: List[TabSchema] = []

class FormBase(BaseModel):
    name: str
    companyId: str
    transactionType: str
    assignedTo: List[str] = []
    structure: FormStructure

class FormCreate(FormBase):
    pass

class FormUpdate(BaseModel):
    name: Optional[str] = None
    structure: Optional[FormStructure] = None

class CloneFormRequest(BaseModel):
    targetCompanyId: Optional[str] = None
    newName: str

class AssignUsersRequest(BaseModel):
    userIds: List[str]

class MyFormResponse(BaseModel):
    id: str
    name: str
    transactionType: str
    status: str = "Not Started"
    updatedAt: Optional[str] = None

class FormSubmissionRequest(BaseModel):
    values: Dict[str, Any]

class FormResponse(FormBase):
    id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
