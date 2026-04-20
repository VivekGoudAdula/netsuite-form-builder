import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['netsuite_form_builder']
    count = await db.field_catalogue.count_documents({})
    print(f'Total fields: {count}')
    types = await db.field_catalogue.distinct('transactionType')
    print(f'Types: {types}')
    
    # Check a few fields to see transactionType spelling
    cursor = db.field_catalogue.find({}).limit(5)
    fields = await cursor.to_list(length=5)
    for f in fields:
        print(f"ID: {f.get('internalId')}, Type: {f.get('transactionType')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
