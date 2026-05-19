"""
Seed default NetSuite datasource configs from env (one-time migration).
Credentials stay in .env; only script/deploy/mapping metadata is stored in MongoDB.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION = "netsuite_datasources"


def _default_seeds() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    base = {"type": "netsuite_restlet", "method": "GET", "authType": "oauth1", "isActive": True, "createdAt": now, "updatedAt": now, "createdBy": "system"}

    seeds = [
        {
            "name": "NetSuite Vendors",
            "key": "vendors",
            "scriptId": settings.NETSUITE_VENDOR_SCRIPT,
            "deployId": settings.NETSUITE_VENDOR_DEPLOY,
            "labelKey": "displayName",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["displayName", "email", "subsidiary", "vendorCode", "companyName"],
        },
        {
            "name": "NetSuite Customers",
            "key": "customers",
            "scriptId": settings.NETSUITE_CUSTOMER_SCRIPT,
            "deployId": settings.NETSUITE_CUSTOMER_DEPLOY,
            "labelKey": "displayName",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["displayName", "email", "subsidiary", "companyName"],
        },
        {
            "name": "NetSuite Currencies",
            "key": "currencies",
            "scriptId": settings.NETSUITE_CURRENCY_SCRIPT,
            "deployId": settings.NETSUITE_CURRENCY_DEPLOY,
            "labelKey": "name",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["name", "symbol", "internalId"],
        },
        {
            "name": "NetSuite Items",
            "key": "items",
            "scriptId": settings.NETSUITE_ITEM_SCRIPT,
            "deployId": settings.NETSUITE_ITEM_DEPLOY,
            "labelKey": "displayName",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["displayName", "itemId", "internalId"],
        },
        {
            "name": "NetSuite Departments",
            "key": "departments",
            "scriptId": settings.NETSUITE_DEPARTMENT_SCRIPT,
            "deployId": settings.NETSUITE_DEPARTMENT_DEPLOY,
            "labelKey": "name",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["name", "subsidiary", "internalId"],
        },
        {
            "name": "NetSuite Classes",
            "key": "classes",
            "scriptId": settings.NETSUITE_CLASS_SCRIPT,
            "deployId": settings.NETSUITE_CLASS_DEPLOY,
            "labelKey": "name",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["name", "subsidiary", "internalId"],
        },
        {
            "name": "NetSuite Accounts",
            "key": "accounts",
            "scriptId": settings.NETSUITE_ACCOUNT_SCRIPT,
            "deployId": settings.NETSUITE_ACCOUNT_DEPLOY,
            "labelKey": "name",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["name", "acctnumber", "internalId"],
        },
        {
            "name": "NetSuite HSN Codes",
            "key": "hsn",
            "scriptId": settings.NETSUITE_HSN_SCRIPT,
            "deployId": settings.NETSUITE_HSN_DEPLOY,
            "labelKey": "name",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["hsncode", "name", "hsndescription"],
        },
        {
            "name": "NetSuite Locations",
            "key": "locations",
            "scriptId": settings.NETSUITE_LOCATION_SCRIPT,
            "deployId": settings.NETSUITE_LOCATION_DEPLOY,
            "labelKey": "name",
            "valueKey": "internalId",
            "responseDataPath": "data",
            "searchFields": ["name", "subsidiary", "internalId"],
        },
        {
            "name": "NetSuite Tax Nature",
            "key": "tax-nature",
            "scriptId": settings.NETSUITE_TAX_NATURE_SCRIPT,
            "deployId": settings.NETSUITE_TAX_NATURE_DEPLOY,
            "labelKey": "name",
            "valueKey": "name",
            "responseDataPath": "data",
            "searchFields": ["name"],
        },
    ]
    return [{**base, **s} for s in seeds]


async def seed_netsuite_datasources(db: AsyncIOMotorDatabase) -> None:
    """Upsert default datasources by key; never overwrites admin-edited script IDs."""
    for seed in _default_seeds():
        key = seed["key"]
        existing = await db[COLLECTION].find_one({"key": key})
        if existing:
            continue
        await db[COLLECTION].insert_one(seed)
        logger.info("Seeded NetSuite datasource key=%s", key)
