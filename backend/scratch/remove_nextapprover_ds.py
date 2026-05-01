import asyncio
import sys
import os
sys.path.append(os.getcwd())
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def remove_ds():
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
                                if field and "dataSource" in field:
                                    ds = field["dataSource"]
                                    if ds and ds.get("type") == "api" and "apiConfig" in ds:
                                        field_id = field.get("id") or field.get("internalId")
                                        if field_id == "nextapprover":
                                            ds["type"] = "static"
                                            ds["options"] = []
                                            del ds["apiConfig"]
                                            updated = True
        
        if updated:
            await db.forms.replace_one({"_id": form["_id"]}, form)
            print(f"Form '{form.get('name')}' updated successfully.")

    # 2. Update catalogue
    async for field in db.field_catalogue.find():
        updated = False
        if "dataSource" in field:
            ds = field["dataSource"]
            if ds and ds.get("type") == "api" and "apiConfig" in ds:
                field_id = field.get("internalId")
                if field_id == "nextapprover":
                    ds["type"] = "static"
                    ds["options"] = []
                    del ds["apiConfig"]
                    updated = True
        if updated:
            await db.field_catalogue.replace_one({"_id": field["_id"]}, field)
            print(f"Catalogue field '{field.get('internalId')}' updated successfully.")

    print("Done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_ds())
