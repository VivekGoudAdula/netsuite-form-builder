from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


DatasourceType = Literal["netsuite_restlet"]
AuthType = Literal["oauth1"]
HttpMethod = Literal["GET", "POST"]


class NetSuiteDatasourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    key: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_-]*$")
    type: DatasourceType = "netsuite_restlet"
    scriptId: str = Field(..., min_length=1, max_length=200)
    deployId: str = Field(..., min_length=1, max_length=20)
    method: HttpMethod = "GET"
    labelKey: str = Field(..., min_length=1, max_length=120)
    valueKey: str = Field(..., min_length=1, max_length=120)
    responseDataPath: str = Field(default="data", min_length=1, max_length=200)
    searchFields: List[str] = Field(default_factory=list)
    authType: AuthType = "oauth1"
    isActive: bool = True

    @field_validator("key")
    @classmethod
    def normalize_key(cls, v: str) -> str:
        return v.strip().lower()


class NetSuiteDatasourceCreate(NetSuiteDatasourceBase):
    pass


class NetSuiteDatasourceRegister(BaseModel):
    """Paste script ID only — deploy defaults to 1; OAuth from server .env."""

    scriptId: str = Field(..., min_length=1, max_length=200)
    key: Optional[str] = Field(None, max_length=64)
    fieldId: Optional[str] = Field(None, max_length=64)
    name: Optional[str] = Field(None, max_length=120)
    labelKey: Optional[str] = Field(None, max_length=120)
    valueKey: Optional[str] = Field(None, max_length=120)
    responseDataPath: Optional[str] = Field(None, max_length=200)
    searchFields: Optional[List[str]] = None


class NetSuiteDatasourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    scriptId: Optional[str] = Field(None, min_length=1, max_length=200)
    deployId: Optional[str] = Field(None, min_length=1, max_length=20)
    method: Optional[HttpMethod] = None
    labelKey: Optional[str] = Field(None, min_length=1, max_length=120)
    valueKey: Optional[str] = Field(None, min_length=1, max_length=120)
    responseDataPath: Optional[str] = Field(None, min_length=1, max_length=200)
    searchFields: Optional[List[str]] = None
    authType: Optional[AuthType] = None
    isActive: Optional[bool] = None


class NetSuiteDatasourceResponse(NetSuiteDatasourceBase):
    id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class DatasourceSyncStatus(BaseModel):
    datasourceKey: str
    lastFetchedAt: Optional[datetime] = None
    responseCount: int = 0
    latencyMs: Optional[float] = None
    status: Literal["ok", "error", "never"] = "never"
    message: Optional[str] = None
