from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import mongo_url, DB_NAME

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]