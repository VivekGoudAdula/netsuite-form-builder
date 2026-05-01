import asyncio
import sys
import os
sys.path.append(os.getcwd())
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def fix_status_ref():
    print(f"Connecting to {settings.DB_NAME}...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
    
    async for form in db.forms.find():
        updated = False
        if "structure" in form and "tabs" in form["structure"]:
            for tab in form["structure"]["tabs"]:
                if "fieldGroups" in tab:
                    for group in tab["fieldGroups"]:
                        if "fields" in group:
                            for field in group["fields"]:
                                if field:
                                    field_id = field.get("id") or field.get("internalId")
                                    print(f"Found field: {field_id}")
                                    if field_id in ["status", "statusRef", "approvalstatus"]:
                                        print(f"Updating '{field_id}' in '{form.get('name')}'")
                                        field["type"] = "select"
                                        field["defaultValue"] = "1"
                                        field["dataSource"] = {
                                            "type": "api",
                                            "apiConfig": {
                                                "url": "/mock/approval-status",
                                                "method": "GET",
                                                "labelKey": "name",
                                                "valueKey": "id"
                                            }
                                        }
                                        updated = True
        
        if updated:
            await db.forms.replace_one({"_id": form["_id"]}, form)
            print(f"Form '{form.get('name')}' updated successfully.")

    print("Done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_status_ref())
