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
    # Check if any admin exists
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        print("No admin found. Creating default admin...")
        default_admin = {
            "name": "System Administrator",
            "email": "admin@netsuiteform.com",
            "password": get_password_hash("Admin@123"),
            "role": "admin",
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "lastLogin": None
        }
        await db.users.insert_one(default_admin)
        print("Default admin created: admin@netsuiteform.com / Admin@123")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("Disconnected from MongoDB")

def get_database():
    return db_instance.db
