import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/cinnoracle")
DATABASE_NAME = os.getenv("DATABASE_NAME", "CinnOracle")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "predictions")

_client = None

def get_db():
    global _client
    if _client is None:
        print(f"Attempting to connect to MongoDB with URI: {MONGODB_URI}")
        # Use a short timeout so it doesn't hang the app
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
    return _client[DATABASE_NAME]

def get_collection():
    return get_db()[COLLECTION_NAME]

def save_prediction(prediction_data: dict):
    collection = get_collection()
    result = collection.insert_one(prediction_data)
    return str(result.inserted_id)

def get_history():
    collection = get_collection()
    history = list(collection.find().sort("timestamp", -1))
    for item in history:
        item["_id"] = str(item["_id"])
    return history

def get_prediction_by_id(prediction_id: str):
    try:
        collection = get_collection()
        item = collection.find_one({"_id": ObjectId(prediction_id)})
        if item:
            item["_id"] = str(item["_id"])
        return item
    except:
        return None

def delete_prediction(prediction_id: str):
    try:
        collection = get_collection()
        result = collection.delete_one({"_id": ObjectId(prediction_id)})
        return result.deleted_count > 0
    except:
        return False

def is_db_connected():
    try:
        client = get_db().client
        client.admin.command('ping')
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
