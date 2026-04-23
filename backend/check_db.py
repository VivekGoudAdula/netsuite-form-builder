import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.netsuite_form_builder
    
    subs = await db.submissions.find({}).to_list(10)
    print("Total submissions:", len(subs))
    for s in subs:
        print(s.get("_id"), s.get("status"), s.get("currentLevel"), "approvals:", bool(s.get("approvals")))

asyncio.run(main())
