from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Any, List, Dict
from bson import ObjectId

# MongoDB connection string
# Prefer environment variable in production.
MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb+srv://savinditharu611_db_user:wslaZtglj66H3HWl@cluster0.cxhs9bs.mongodb.net/cinnoracle?retryWrites=true&w=majority&appName=Cluster0",
)

# Database and collection names
DATABASE_NAME = os.getenv("MONGODB_DB", "CinnOracle")
COLLECTION_PREDICTIONS = "predictions"
COLLECTION_USERS = "users"

class PyObjectId(str):
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema: Any, handler: Any) -> Any:
        from pydantic_core import core_schema as cs
        return cs.str_schema()

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: Any) -> Any:
        from pydantic_core import core_schema as cs
        return cs.no_info_plain_validator_function(
            cls.validate,
            serialization=cs.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

class PredictionDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=lambda: str(ObjectId()), alias="_id")

    # Input data
    batch_id: Optional[str] = None
    weight_before: float
    weight_after: float
    temperature: float
    district: str
    harvest_date: Optional[str] = None
    drying_days: Optional[int] = None
    color: Optional[str] = None
    breakage_level: Optional[str] = None
    roll_tightness: Optional[str] = None
    aroma_strength: Optional[str] = None
    quality_level: Optional[str] = None
    standard_grade: Optional[str] = None

    # Results
    predicted_quality: str
    predicted_standard_grade: str
    weight_loss_percent: float
    estimated_price: Optional[float] = None
    currency: str = "LKR"
    market_suggestions: Optional[List[Dict[str, Any]]] = None
    reason: Optional[str] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }

class UserDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    username: str
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }

class Database:
    client: AsyncIOMotorClient = None
    database = None

    @classmethod
    async def connect_to_mongo(cls):
        """Connect to MongoDB"""
        try:
            cls.client = AsyncIOMotorClient(MONGODB_URL)
            cls.database = cls.client[DATABASE_NAME]
            # Test the connection
            await cls.client.admin.command('ping')
            print("Successfully connected to MongoDB!")
        except ConnectionFailure as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    async def close_mongo_connection(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed")

    @classmethod
    def get_database(cls):
        """Get database instance"""
        if cls.database is None:
            raise ConnectionError("Database not connected")
        return cls.database

    @classmethod
    def get_predictions_collection(cls):
        """Get predictions collection"""
        return cls.get_database()[COLLECTION_PREDICTIONS]

    @classmethod
    def get_users_collection(cls):
        """Get users collection"""
        return cls.get_database()[COLLECTION_USERS]