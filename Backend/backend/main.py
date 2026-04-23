import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.prediction_routes import router as prediction_router
from services.database_service import close_mongodb_connection, connect_to_mongodb, get_database
from services.model_service import load_dataframes, load_models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm caches: datasets (fallback analytics) + joblib models (in-memory)
    logger.info("Loading dataframes and models...")
    load_dataframes()
    load_models()
    logger.info("Dataframes and models loaded successfully")
    
    # Optional: connect when MONGODB_URI is provided
    logger.info("Attempting MongoDB connection...")
    connect_to_mongodb()
    db = get_database()
    if db is not None:
        logger.info("✓ Successfully connected to MongoDB")
    else:
        logger.warning("✗ MongoDB connection failed - database operations will be unavailable")
    
    yield
    
    logger.info("Closing MongoDB connection...")
    close_mongodb_connection()
    logger.info("Server shutdown complete")


app = FastAPI(title="CinnOracle Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction_router)


@app.get("/health")
def health():
    db = get_database()
    is_connected = db is not None
    return {
        "status": "ok",
        "db_connected": is_connected,
        "db_status": "Connected" if is_connected else "Not Connected"
    }
