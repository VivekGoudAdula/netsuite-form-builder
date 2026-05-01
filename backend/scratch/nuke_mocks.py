import asyncio
import sys
import os
from bson import ObjectId
sys.path.append(os.getcwd())
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def nuke_mocks():
    print(f"Connecting to {settings.DB_NAME}...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
    
    # 1. Update all existing forms
    async for form in db.forms.find():
        updated = False
        
        if "structure" in form and "tabs" in form["structure"]:
            for tab in form["structure"]["tabs"]:
                if "fieldGroups" in tab:
                    for group in tab["fieldGroups"]:
                        if "fields" in group:
                            for field in group["fields"]:
                                if not field: continue
                                
                                field_id = field.get("fieldId") or field.get("id") or field.get("internalId")
                                
                                # A. Force correct employee/approver data source
                                if field_id in ["employee", "nextapprover"]:
                                    print(f"Ensuring correct API config for '{field_id}' in form '{form.get('name')}'")
                                    field["type"] = "select"
                                    field["dataSource"] = {
                                        "type": "api",
                                        "apiConfig": {
                                            "url": "/api/netsuite/employees",
                                            "method": "GET",
                                            "labelKey": "label",
                                            "valueKey": "value"
                                        }
                                    }
                                    updated = True
                                
                                # B. Force correct status/approval dataSource
                                elif field_id in ["status", "statusRef", "approvalstatus"]:
                                    print(f"Ensuring correct static options for '{field_id}' in form '{form.get('name')}'")
                                    field["type"] = "select"
                                    field["dataSource"] = {
                                        "type": "static",
                                        "options": [
                                            {"label": "Pending Approval", "value": "1"},
                                            {"label": "Approved", "value": "2"},
                                            {"label": "Rejected", "value": "3"}
                                        ]
                                    }
                                    field["defaultValue"] = "1"
                                    updated = True
                                
                                # C. Clean up remaining mocks
                                elif field and "dataSource" in field:
                                    ds = field["dataSource"]
                                    if ds and ds.get("type") == "api" and "apiConfig" in ds:
                                        url = ds["apiConfig"].get("url", "")
                                        if "mock" in url:
                                            print(f"Removing mock from generic field '{field_id}' in form '{form.get('name')}'")
                                            ds["type"] = "static"
                                            ds["options"] = []
                                            if "apiConfig" in ds: del ds["apiConfig"]
                                            updated = True

        # D. Ensure 'statusRef' (Status Reference) exists in PO forms
        if form.get("transactionType") == "purchase_order" and "structure" in form and "tabs" in form["structure"]:
            status_ref_field = {
                "fieldId": "statusRef",
                "label": "Status Reference",
                "type": "select",
                "group": "System Information",
                "tab": "Main",
                "section": "body",
                "visible": True,
                "mandatory": False,
                "displayType": "normal",
                "layout": {"columnBreak": False, "spaceBefore": False},
                "dataSource": {
                    "type": "static",
                    "options": [
                        {"label": "Pending Approval", "value": "1"},
                        {"label": "Approved", "value": "2"},
                        {"label": "Rejected", "value": "3"}
                    ]
                }
            }
            
            main_tab = next((t for t in form["structure"]["tabs"] if t["name"] == "Main"), None)
            if main_tab:
                if "fieldGroups" not in main_tab:
                    main_tab["fieldGroups"] = []
                    
                system_info_group = next((g for g in main_tab["fieldGroups"] if g["name"] == "System Information"), None)
                if not system_info_group:
                    system_info_group = {
                        "id": "group_system_info_" + str(ObjectId()),
                        "name": "System Information",
                        "fields": []
                    }
                    main_tab["fieldGroups"].append(system_info_group)
                
                if not any(f.get("fieldId") == "statusRef" for f in system_info_group["fields"]):
                    print(f"Injecting missing Status Reference into form '{form.get('name')}'")
                    system_info_group["fields"].append(status_ref_field)
                    updated = True
        
        if updated:
            await db.forms.replace_one({"_id": form["_id"]}, form)
            print(f"Form '{form.get('name')}' updated successfully.")

    # 2. Update catalogue
    async for field in db.field_catalogue.find():
        updated = False
        field_id = field.get("internalId")
        
        if field_id in ["employee", "nextapprover"]:
            field["type"] = "select"
            field["dataSource"] = {
                "type": "api",
                "apiConfig": {
                    "url": "/api/netsuite/employees",
                    "method": "GET",
                    "labelKey": "label",
                    "valueKey": "value"
                }
            }
            updated = True
        elif field_id in ["status", "statusRef", "approvalstatus"]:
            field["type"] = "select"
            field["dataSource"] = {
                "type": "static",
                "options": [
                    {"label": "Pending Approval", "value": "1"},
                    {"label": "Approved", "value": "2"},
                    {"label": "Rejected", "value": "3"}
                ]
            }
            field["defaultValue"] = "1"
            updated = True
        elif "dataSource" in field:
            ds = field["dataSource"]
            if ds and ds.get("type") == "api" and "apiConfig" in ds:
                url = ds["apiConfig"].get("url", "")
                if "mock" in url:
                    ds["type"] = "static"
                    ds["options"] = []
                    if "apiConfig" in ds: del ds["apiConfig"]
                    updated = True
                    
        if updated:
            await db.field_catalogue.replace_one({"_id": field["_id"]}, field)
            print(f"Catalogue field '{field_id}' updated successfully.")

    print("Done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(nuke_mocks())
