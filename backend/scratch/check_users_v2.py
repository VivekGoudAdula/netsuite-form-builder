import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_users():
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "netsuite_form_builder")
    
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    users = await db.users.find().to_list(10)
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"Email: {user.get('email')}, Role: {user.get('role')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
