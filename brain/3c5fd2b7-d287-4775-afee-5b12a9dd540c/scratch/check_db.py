import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.netsuite_form_builder
    
    id1 = "69e3308dc132afd7ad3fa381"
    id2 = "69e32b466ec2be67ba4a3e2e"
    
    print("Checking IDs...")
    for uid in [id1, id2]:
        user = await db.users.find_one({"_id": ObjectId(uid)})
        if user:
            print(f"ID {uid}: {user.get('name')} | Company: {user.get('companyId')} | Role: {user.get('role')}")
        else:
            print(f"ID {uid}: NOT FOUND")
            
    # Also check the form to see its companyId and structure
    form_id = "69e32c9dc132afd7ad3fa377"
    form = await db.forms.find_one({"_id": ObjectId(form_id)})
    if form:
        print(f"Form {form_id}: {form.get('name')} | Company: {form.get('companyId')}")
        print(f"Structure: {form.get('structure')}")
    else:
        print(f"Form {form_id}: NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_users())
