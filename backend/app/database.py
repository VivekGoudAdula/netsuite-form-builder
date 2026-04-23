from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
from .utils.security import get_password_hash
from datetime import datetime

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_instance.db = db_instance.client[settings.DB_NAME]
    print(f"Connected to MongoDB: {settings.DB_NAME}")
    await init_db()

async def init_db():
    db = get_database()
    # Migration: Promote all legacy 'admin' to 'super_admin'
    await db.users.update_many({"role": "admin"}, {"$set": {"role": "super_admin"}})
    
    # Migration: Convert all legacy 'customer' to 'user'
    await db.users.update_many({"role": "customer"}, {"$set": {"role": "user"}})
    
    # Migration: Ensure all users have a createdAt field
    await db.users.update_many(
        {"createdAt": {"$exists": False}}, 
        {"$set": {"createdAt": datetime.utcnow()}}
    )

    # Check if any super_admin exists
    admin = await db.users.find_one({"role": "super_admin"})
    if not admin:
        print("No super_admin found. Creating default admin...")
        default_admin = {
            "name": "System Administrator",
            "email": "admin@netsuiteform.com",
            "password": get_password_hash("Admin@123"),
            "role": "super_admin",
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "lastLogin": None
        }
        await db.users.insert_one(default_admin)
        print("Default super_admin created: admin@netsuiteform.com / Admin@123")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("Disconnected from MongoDB")

def get_database():
    return db_instance.db
