from __future__ import annotations

import logging
import os
from typing import Optional

from pymongo import MongoClient
from pymongo.server_api import ServerApi

_client: Optional[MongoClient] = None
_db_name = "CinnOracle"
logger = logging.getLogger(__name__)


def get_mongodb_uri() -> str:
    return os.getenv("MONGODB_URI", "mongodb+srv://savinditharu611_db_user:wslaZtglj66H3HWl@cluster0.cxhs9bs.mongodb.net/?appName=Cluster0").strip()


def connect_to_mongodb() -> Optional[MongoClient]:
    global _client
    if _client is not None:
        return _client

    uri = get_mongodb_uri()
    if not uri:
        logger.warning("MONGODB_URI environment variable not set")
        return None

    try:
        logger.info("Connecting to MongoDB...")
        _client = MongoClient(uri, server_api=ServerApi("1"), serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")
        logger.info("Successfully connected to MongoDB")
        return _client
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        _client = None
        return None


def get_database():
    client = connect_to_mongodb()
    if client is None:
        return None
    return client[_db_name]


def close_mongodb_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
