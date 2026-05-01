import asyncio
import sys
import os
sys.path.append(os.getcwd())
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from bson import ObjectId

async def fix_forms():
    print(f"Connecting to {settings.DB_NAME}...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
    
    # We need to find all forms and manually update the nested fields because
    # MongoDB positional operators can be tricky with deeply nested structures
    
    async for form in db.forms.find():
        updated = False
        if "structure" in form and "tabs" in form["structure"]:
            for tab in form["structure"]["tabs"]:
                if "fieldGroups" in tab:
                    for group in tab["fieldGroups"]:
                        if "fields" in group:
                            for field in group["fields"]:
                                if field:
                                    ds = field.get("dataSource")
                                    if ds and ds.get("type") == "api":
                                        api_config = ds.get("apiConfig", {})
                                        if api_config and api_config.get("url") in ["/api/mock/employees", "/mock/employees"]:
                                            print(f"Updating field '{field.get('label')}' in form '{form.get('name')}'")
                                            api_config["url"] = "/api/netsuite/employees"
                                            api_config["labelKey"] = "label"
                                            api_config["valueKey"] = "value"
                                            updated = True
        
        if updated:
            await db.forms.replace_one({"_id": form["_id"]}, form)
            print(f"Form '{form.get('name')}' updated successfully.")

    print("Done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_forms())
