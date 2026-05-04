from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import prediction_routes, history_routes, report_routes
from services import database_service

app = FastAPI(title="CinnOracle API", version="1.0.0")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(prediction_routes.router)
app.include_router(history_routes.router)
app.include_router(report_routes.router)

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*40)
    print("CinnOracle Backend Starting...")
    print("Checking database connection...")
    if database_service.is_db_connected():
        print("✅ Database connected successfully!")
    else:
        print("❌ Database connection failed!")
    print("="*40 + "\n")

@app.get("/health")
async def health_check():
    return {
        "status": "ok"
    }

@app.get("/db-status")
async def db_status():
    return {
        "db_connected": database_service.is_db_connected()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
