import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path
import sys

# Current directory is backend/, so .env is in parent
root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / ".env")

# Add the current directory to sys.path to allow importing from app
sys.path.append(str(Path(__file__).parent))

from app.config import settings

MONGO_URI = settings.MONGO_URI
DB_NAME = settings.DB_NAME

def create_field(internal_id, label, type, trans_type="purchase_order", section="body", sub_section=None, group="Primary Information", tab="Main", required=False, nlapi=False, ds=None, help_text=None):
    field = {
        "internalId": internal_id,
        "label": label,
        "type": type,
        "transactionType": trans_type,
        "section": section,
        "subSection": sub_section,
        "group": group,
        "tab": tab,
        "required": required,
        "nlapiSubmitField": nlapi,
        "isSystemField": True,
        "displayOrder": 100,
        "origin": "system",
        "helpText": help_text,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    if ds:
        field["dataSource"] = ds
    return field

# SECURE PO FIELDS (Strictly following the 77-field Body list + Sublists)
PO_FIELDS = [
    # --- PRIMARY INFORMATION (TAB: MAIN) ---
    create_field("customform", "Custom Form", "select", group="Primary Information", tab="Main", required=True, ds={"type": "api", "apiConfig": {"url": "/mock/custom-forms", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("entity", "Vendor", "select", group="Primary Information", tab="Main", required=True, ds={"type": "api", "apiConfig": {"url": "/mock/vendors", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("otherrefnum", "Vendor #", "text", group="Primary Information", tab="Main"),
    create_field("employee", "Employee", "select", group="Primary Information", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/employees", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("trandate", "Date", "date", group="Primary Information", tab="Main", required=True),
    create_field("tranid", "PO #", "text", group="Primary Information", tab="Main"),
    create_field("duedate", "Receive By", "date", group="Primary Information", tab="Main"),
    create_field("memo", "Memo", "text", group="Primary Information", tab="Main", nlapi=True),
    create_field("approvalstatus", "Approval Status", "select", group="Primary Information", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/approval-status", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("nextapprover", "Next Approver", "select", group="Primary Information", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/employees", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("supervisorapproval", "Supervisor Approval", "checkbox", group="Primary Information", tab="Main"),
    create_field("message", "Vendor Message", "textarea", group="Primary Information", tab="Main"),
    create_field("email", "Email", "emails", group="Primary Information", tab="Main", nlapi=True),
    create_field("tobeemailed", "To Be E-mailed", "checkbox", group="Primary Information", tab="Main"),
    create_field("tobefaxed", "To Be Faxed", "checkbox", group="Primary Information", tab="Main"),
    create_field("tobeprinted", "To Be Printed", "checkbox", group="Primary Information", tab="Main", nlapi=True),
    create_field("createdfrom", "Created From", "select", group="Primary Information", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/transactions", "method": "GET", "labelKey": "name", "valueKey": "id"}}),

    # --- CLASSIFICATION (TAB: MAIN) ---
    create_field("subsidiary", "Subsidiary", "select", group="Classification", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/subsidiaries", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("department", "Department", "select", group="Classification", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/departments", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("class", "Class", "select", group="Classification", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/classifications", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("location", "Location", "select", group="Classification", tab="Main", ds={"type": "api", "apiConfig": {"url": "/mock/locations", "method": "GET", "labelKey": "name", "valueKey": "id"}}),

    # --- SHIPPING (TAB: SHIPPING) ---
    create_field("shipdate", "Ship Date", "date", group="Shipping", tab="Shipping"),
    create_field("shipmethod", "Ship Via", "select", group="Shipping", tab="Shipping", ds={"type": "api", "apiConfig": {"url": "/mock/shipping-methods", "method": "GET", "labelKey": "name", "valueKey": "id"}}),
    create_field("shipto", "Ship To", "select", group="Shipping", tab="Shipping", help_text="Select the customer you are shipping this order to."),
    create_field("shipaddress", "Ship To", "address", group="Shipping", tab="Shipping"),
    create_field("shippingaddress", "Shipping Address Summary", "summary", group="Shipping", tab="Shipping"),
    create_field("shipaddressee", "Shipping Addressee", "text", group="Shipping", tab="Shipping"),
    create_field("shipattention", "Shipping Attention", "text", group="Shipping", tab="Shipping"),
    create_field("shipaddr1", "Shipping Address Line 1", "text", group="Shipping", tab="Shipping"),
    create_field("shipaddr2", "Shipping Address Line 2", "text", group="Shipping", tab="Shipping"),
    create_field("shipaddr3", "Shipping Address Line 3", "text", group="Shipping", tab="Shipping"),
    create_field("shipcity", "Shipping Address City", "text", group="Shipping", tab="Shipping"),
    create_field("shipstate", "Shipping Address State", "text", group="Shipping", tab="Shipping"),
    create_field("shipzip", "Shipping Address Zip Code", "text", group="Shipping", tab="Shipping"),
    create_field("shipcountry", "Shipping Address Country", "text", group="Shipping", tab="Shipping"),
    create_field("shipphone", "Shipping Phone", "text", group="Shipping", tab="Shipping"),
    create_field("shipisresidential", "Shipping address is residential", "text", group="Shipping", tab="Shipping"),
    create_field("shipoverride", "Ship Override", "text", group="Shipping", tab="Shipping"),
    create_field("fob", "FOB", "text", group="Shipping", tab="Shipping"),
    create_field("linkedtrackingnumbers", "Tracking #", "text", group="Shipping", tab="Shipping"),
    create_field("trackingnumbers", "Additional Tracking #", "text", group="Shipping", tab="Shipping"),
    create_field("returntrackingnumbers", "Return Tracking #", "text", group="Shipping", tab="Shipping"),

    # --- BILLING (TAB: BILLING) ---
    create_field("terms", "Terms", "select", group="Billing", tab="Billing"),
    create_field("billaddress", "Vendor", "address", group="Billing", tab="Billing"),
    create_field("billingaddress", "Billing Address Summary", "summary", group="Billing", tab="Billing"),
    create_field("billaddressee", "Billing Addressee", "text", group="Billing", tab="Billing"),
    create_field("billattention", "Billing Attention", "text", group="Billing", tab="Billing"),
    create_field("billaddr1", "Billing Address Line 1", "text", group="Billing", tab="Billing"),
    create_field("billaddr2", "Billing Address Line 2", "text", group="Billing", tab="Billing"),
    create_field("billaddr3", "Billing Address Line 3", "text", group="Billing", tab="Billing"),
    create_field("billcity", "Billing Address City", "text", group="Billing", tab="Billing"),
    create_field("billstate", "Billing Address State", "text", group="Billing", tab="Billing"),
    create_field("billzip", "Billing Address Zip Code", "text", group="Billing", tab="Billing"),
    create_field("billcountry", "Billing Address Country", "text", group="Billing", tab="Billing"),
    create_field("billphone", "Billing Phone", "text", group="Billing", tab="Billing"),
    create_field("billisresidential", "Shipping address is residential", "text", group="Billing", tab="Billing"),
    create_field("currency", "Currency", "select", group="Billing", tab="Billing", required=True),
    create_field("currencyname", "Currency", "text", group="Billing", tab="Billing", help_text="This vendor's currency is shown in this field."),
    create_field("currencysymbol", "Currency Symbol", "text", group="Billing", tab="Billing"),
    create_field("exchangerate", "Exchange rate", "currency2", group="Billing", tab="Billing", required=True),
    create_field("availablevendorcredit", "Available Vendor Credit", "currency", group="Billing", tab="Billing"),
    create_field("balance", "Balance", "currency", group="Billing", tab="Billing"),
    create_field("isbasecurrency", "Base Currency", "checkbox", group="Billing", tab="Billing"),
    create_field("purchasecontract", "Purchase Contract", "select", group="Billing", tab="Billing"),
    create_field("total", "Total", "currency", group="Billing", tab="Billing"),
    create_field("unbilledorders", "Unbilled Orders", "currency", group="Billing", tab="Billing"),
    create_field("intercostatus", "Intercompany Status", "select", group="Billing", tab="Billing"),
    create_field("intercotransaction", "Paired Intercompany Transaction", "select", group="Billing", tab="Billing"),

    # --- TAX DETAILS (TAB: TAX DETAILS) ---
    create_field("nexus", "Nexus", "select", group="Tax Details", tab="Tax Details"),
    create_field("entitynexus", "Nexus", "select", group="Tax Details", tab="Tax Details", help_text="Entity Nexus mapping"),

    # --- SYSTEM INFORMATION (TAB: MAIN / HIDDEN) ---
    create_field("status", "Status", "text", group="System Information", tab="Main"),
    create_field("statusRef", "Status Reference", "text", group="System Information", tab="Main"),
    create_field("orderstatus", "Order Status", "text", group="System Information", tab="Main"),
    create_field("source", "Source", "text", group="System Information", tab="Main"),
    create_field("externalid", "ExternalId", "text", group="System Information", tab="Main"),
    create_field("createddate", "Created Date", "datetime", group="System Information", tab="Main"),
    create_field("lastmodifieddate", "Last Modified Date", "datetime", group="System Information", tab="Main"),

    # --- LINE ITEMS (SECTION: SUBLIST, TAB: ITEMS) ---
    create_field("item", "Item", "select", section="sublist", sub_section="item", group="Line Items", tab="Items", required=True),
    create_field("quantity", "Quantity", "float", section="sublist", sub_section="item", group="Line Items", tab="Items", required=True),
    create_field("units", "Units", "select", section="sublist", sub_section="item", group="Line Items", tab="Items"),
    create_field("description", "Description", "text", section="sublist", sub_section="item", group="Line Items", tab="Items"),
    create_field("rate", "Rate", "currency", section="sublist", sub_section="item", group="Line Items", tab="Items", required=True),
    create_field("amount", "Amount", "currency", section="sublist", sub_section="item", group="Line Items", tab="Items", required=True),
    create_field("taxcode", "Tax Code", "select", section="sublist", sub_section="item", group="Line Items", tab="Items"),
    create_field("taxrate1", "Tax Rate", "percent", section="sublist", sub_section="item", group="Line Items", tab="Items"),
    create_field("taxamount1", "Tax Amount", "currency", section="sublist", sub_section="item", group="Line Items", tab="Items"),
    create_field("expectedreceivedate", "Expected Receipt Date", "date", section="sublist", sub_section="item", group="Line Items", tab="Items"),

    # --- EXPENSES (SECTION: SUBLIST, TAB: ITEMS) ---
    create_field("category", "Category", "select", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
    create_field("account", "Account", "select", section="sublist", sub_section="expense", group="Expenses", tab="Items", required=True),
    create_field("amount_expense", "Amount", "currency", section="sublist", sub_section="expense", group="Expenses", tab="Items", required=True),
    create_field("memo_expense", "Memo", "text", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
    create_field("department_expense", "Department", "select", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
    create_field("class_expense", "Class", "select", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
    create_field("location_expense", "Location", "select", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
    create_field("customer_expense", "Customer", "select", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
    create_field("isbillable", "Billable", "checkbox", section="sublist", sub_section="expense", group="Expenses", tab="Items"),
]

async def seed():
    print(f"Connecting to MongoDB: {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else MONGO_URI}")
    print(f"Database: {DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Clear existing catalogue for PO
    await db.field_catalogue.delete_many({"transactionType": "purchase_order"})
    print("Cleared existing field catalogue for Purchase Order")
    
    if PO_FIELDS:
        await db.field_catalogue.insert_many(PO_FIELDS)
        print(f"Seeded {len(PO_FIELDS)} fields into field_catalogue")
    
    # Verify no duplicates
    all_ids = [f["internalId"] for f in PO_FIELDS]
    duplicates = [item for item in set(all_ids) if all_ids.count(item) > 1]
    if duplicates:
        print(f"WARNING: Detected duplicate Internal IDs: {duplicates}")
    else:
        print("Verification Complete: No duplicate Internal IDs detected within PO fields.")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
