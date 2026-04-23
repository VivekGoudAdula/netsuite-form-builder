import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URI = "mongodb+srv://vivekgoudadula_db_user:Alpha9900@cluster0.j7vvmv4.mongodb.net/netsuite_form_builder?retryWrites=true&w=majority"
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.netsuite_form_builder
    
    subs = await db.submissions.find({}).to_list(10)
    print("Total submissions:", len(subs))
    for s in subs:
        print(s.get("_id"), s.get("formName"), s.get("status"), s.get("currentLevel"), "approvals:", bool(s.get("approvals")))

asyncio.run(main())
