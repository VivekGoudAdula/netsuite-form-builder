import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os

# Configuration
import sys
from pathlib import Path

# Add the current directory to sys.path to allow importing from app
sys.path.append(str(Path(__file__).parent))

from app.config import settings

MONGO_URI = settings.MONGO_URI
DB_NAME = settings.DB_NAME

# Data to seed
CATALOGUES = {
    "purchase_order": [
        {
            "id": "approvalStatus", 
            "label": "Approval Status", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/approval-status", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "entity", 
            "label": "Vendor", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/vendors", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "tranDate", "label": "Date", "type": "dateTime", "mandatory": True},
        {"id": "tranId", "label": "PO #", "type": "string", "mandatory": False},
        {"id": "memo", "label": "Memo", "type": "string", "mandatory": False},
        {
            "id": "subsidiary", 
            "label": "Subsidiary", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/subsidiaries", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "department", 
            "label": "Department", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/departments", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "class", 
            "label": "Class", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/classifications", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "location", 
            "label": "Location", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/locations", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "taxTotal", "label": "Tax Total", "type": "double", "mandatory": False},
        {"id": "placeOfSupply", "label": "Place of Supply", "type": "string", "mandatory": False},
        {"id": "shipDate", "label": "Ship Date", "type": "dateTime", "mandatory": False},
        {
            "id": "shipMethod", 
            "label": "Ship Method", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/shipping-methods", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "billAddressList", 
            "label": "Billing Address", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/addresses", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "currency", 
            "label": "Currency", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/currencies", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "terms", 
            "label": "Terms", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/terms", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "status", "label": "Status", "type": "string", "mandatory": False},
        {"id": "createdDate", "label": "Date Created", "type": "dateTime", "mandatory": False},
    ],
    "sales_order": [
        {
            "id": "entity", 
            "label": "Customer", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/customers", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "tranDate", "label": "Order Date", "type": "dateTime", "mandatory": True},
        {"id": "tranId", "label": "SO #", "type": "string", "mandatory": False},
        {"id": "status", "label": "Order Status", "type": "string", "mandatory": False},
        {"id": "total", "label": "Amount", "type": "double", "mandatory": False},
        {
            "id": "subsidiary", 
            "label": "Subsidiary", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/subsidiaries", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "department", 
            "label": "Department", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/departments", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "shipAddressList", 
            "label": "Shipping Address", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/addresses", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "billAddressList", 
            "label": "Billing Address", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/addresses", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "currency", 
            "label": "Currency", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/currencies", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "createdDate", "label": "Date Created", "type": "dateTime", "mandatory": False},
    ],
    "accounts_payable": [
        {
            "id": "entity", 
            "label": "Vendor", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/vendors", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "tranDate", "label": "Bill Date", "type": "dateTime", "mandatory": True},
        {"id": "dueDate", "label": "Due Date", "type": "dateTime", "mandatory": True},
        {
            "id": "approvalStatus", 
            "label": "Approval Status", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/approval-status", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "amount", "label": "Amount", "type": "double", "mandatory": False},
        {
            "id": "subsidiary", 
            "label": "Subsidiary", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/subsidiaries", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "taxTotal", "label": "Tax Total", "type": "double", "mandatory": False},
        {
            "id": "currency", 
            "label": "Currency", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/currencies", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "createdDate", "label": "Date Created", "type": "dateTime", "mandatory": False},
    ],
    "accounts_receivable": [
        {
            "id": "entity", 
            "label": "Customer", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/customers", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "tranDate", "label": "Invoice Date", "type": "dateTime", "mandatory": True},
        {"id": "status", "label": "Payment Status", "type": "string", "mandatory": False},
        {"id": "amount", "label": "Amount", "type": "double", "mandatory": False},
        {
            "id": "subsidiary", 
            "label": "Subsidiary", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/subsidiaries", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "taxTotal", "label": "Tax Total", "type": "double", "mandatory": False},
        {
            "id": "currency", 
            "label": "Currency", 
            "type": "RecordRef", 
            "mandatory": True,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/currencies", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {
            "id": "terms", 
            "label": "Terms", 
            "type": "RecordRef", 
            "mandatory": False,
            "dataSource": {"type": "api", "apiConfig": {"url": "/mock/terms", "method": "GET", "labelKey": "name", "valueKey": "id"}}
        },
        {"id": "createdDate", "label": "Date Created", "type": "dateTime", "mandatory": False},
    ]
}

async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Clear existing catalogue
    await db.field_catalogue.delete_many({})
    print("Cleared existing field catalogue")
    
    fields_to_insert = []
    
    for trans_type, fields in CATALOGUES.items():
        for f in fields:
            new_field = {
                "internalId": f["id"],
                "label": f["label"],
                "type": f["type"],
                "nlapiSubmitField": False,
                "required": f["mandatory"],
                "transactionType": trans_type,
                "isSystemField": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            if "dataSource" in f:
                new_field["dataSource"] = f["dataSource"]
            
            fields_to_insert.append(new_field)
            
    if fields_to_insert:
        await db.field_catalogue.insert_many(fields_to_insert)
        print(f"Seeded {len(fields_to_insert)} fields into field_catalogue")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
