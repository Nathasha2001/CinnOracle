from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
from contextlib import asynccontextmanager

from quality.model import load_model as load_quality_model, predict_quality, HarvestFeatures, QualityResult
from price.model import load_model as load_price_model, load_district_encoder, load_grade_encoder, predict_price
from database import Database, PredictionDocument

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await Database.connect_to_mongo()

    # Load grade information
    try:
        grades_path = os.path.join(os.path.dirname(__file__), "data", "grades.json")
        with open(grades_path, 'r') as f:
            app.state.grades_info = json.load(f)
    except Exception as e:
        app.state.grades_info = None
        app.state.grades_load_error = str(e)

    yield

    # Shutdown
    await Database.close_mongo_connection()

app = FastAPI(lifespan=lifespan)

# Allow cross-origin requests (use more restrictive origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class PredictionInput(BaseModel):
    weight_before: float
    weight_after: float
    temperature: float
    drying_days: int | None = None
    color: str | None = None
    breakage_level: str | None = None
    roll_tightness: str | None = None
    aroma_strength: str | None = None
    district: str | None = None
    harvest_date: str | None = None


class PriceInput(BaseModel):
    quality_grade: str
    district: str = "Galle"
    weight_loss_percent: float = None
    harvest_date: str = None
    quality_level: str = None
    standard_grade: str = None
    weight_before: float = None
    weight_after: float = None
    temperature: float = None
    batch_id: str | None = None


@app.post("/predict")
async def predict(data: PredictionInput):
    """Predict cinnamon quality and estimate price based on drying inputs."""
    try:
        model = load_quality_model()
        features = HarvestFeatures(
            weight_before=data.weight_before,
            weight_after=data.weight_after,
            drying_temperature=data.temperature,
            drying_days=data.drying_days or 7,
            color=data.color or "Golden Brown",
            breakage_level=data.breakage_level or "Low",
            roll_tightness=data.roll_tightness or "Medium",
            aroma_strength=data.aroma_strength or "Strong",
        )
        result = predict_quality(model, features)

        # Save prediction to database
        prediction_doc = PredictionDocument(
            weight_before=data.weight_before,
            weight_after=data.weight_after,
            temperature=data.temperature,
            district=data.district or "Galle",
            harvest_date=data.harvest_date,
            quality_level=result.quality_level,
            standard_grade=result.standard_grade,
            predicted_quality=result.quality_level,
            predicted_standard_grade=result.standard_grade,
            weight_loss_percent=result.weight_loss_percent
        )

        collection = Database.get_predictions_collection()
        await collection.insert_one(prediction_doc.dict(by_alias=True))

        return {
            "quality": result.quality_level,
            "standard_grade": result.standard_grade,
            "weight_loss_percent": result.weight_loss_percent,
            "message": "Quality prediction successful"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Quality prediction failed: {str(e)}")


@app.post("/predict-price")
async def predict_price_endpoint(data: PriceInput):
    """Predict cinnamon price based on quality grade and district."""
    try:
        price = predict_price(data.quality_grade, data.district, data.weight_loss_percent)

        # Build marketplace suggestions and explanation based on BOTH district and quality level
        quality_level = data.quality_level or "Low Quality"
        district = (data.district or "Galle").strip()
        district_lower = district.lower()

        # Use the exact names you provided for Galle
        if district_lower == "galle":
            local_market_name = "Galle Local Cinnamon Market"
            wholesale_market_name = "Southern Regional Wholesale Market"
            traders_name = "Matara Cinnamon Traders"
        else:
            # For other districts, adapt the names dynamically to match the district
            local_market_name = f"{district} Local Cinnamon Market"
            wholesale_market_name = f"{district} Regional Wholesale Market"
            traders_name = f"{district} Cinnamon Traders"

        if quality_level == "High Quality":
            market_suggestions = [
                {
                    "name": local_market_name,
                    "description": f"High demand for premium cinnamon in {district} and nearby areas.",
                },
                {
                    "name": wholesale_market_name,
                    "description": "Suitable for export-grade cinnamon and bulk buyers.",
                },
                {
                    "name": traders_name,
                    "description": "Can offer better prices for premium grades.",
                },
            ]
            reason = (
                "High-quality cinnamon usually gets better prices in export and auction markets."
            )
        elif quality_level == "Medium Quality":
            market_suggestions = [
                {
                    "name": local_market_name,
                    "description": f"Stable demand for medium-grade cinnamon in {district}.",
                },
                {
                    "name": wholesale_market_name,
                    "description": "Good for regional buyers and wholesalers.",
                },
                {
                    "name": traders_name,
                    "description": "Suitable for blended and everyday products.",
                },
            ]
            reason = (
                "Medium-quality cinnamon is suitable for local and regional wholesale markets."
            )
        else:
            market_suggestions = [
                {
                    "name": local_market_name,
                    "description": f"Standard prices for lower-grade cinnamon in {district}.",
                },
                {
                    "name": wholesale_market_name,
                    "description": "Buyers for cinnamon powder and industrial uses.",
                },
                {
                    "name": traders_name,
                    "description": "Often purchase lower grades for processing.",
                },
            ]
            reason = (
                "Lower-quality cinnamon is commonly sold to processing and powder buyers."
            )

        # Save full price prediction to database for history
        try:
            prediction_doc = PredictionDocument(
                batch_id=data.batch_id,
                weight_before=data.weight_before or 0.0,
                weight_after=data.weight_after or 0.0,
                temperature=data.temperature or 0.0,
                district=data.district or "Galle",
                harvest_date=data.harvest_date,
                drying_days=None,
                color=None,
                breakage_level=None,
                roll_tightness=None,
                aroma_strength=None,
                quality_level=quality_level,
                standard_grade=data.standard_grade,
                predicted_quality=quality_level,
                predicted_standard_grade=data.quality_grade,
                weight_loss_percent=data.weight_loss_percent or 0.0,
                estimated_price=round(float(price), 2),
                currency="LKR",
                market_suggestions=market_suggestions,
                reason=reason,
            )
            collection = Database.get_predictions_collection()
            await collection.insert_one(prediction_doc.dict(by_alias=True))
        except Exception as db_err:
            # Do not break the API if history saving fails
            print(f"Failed to save price prediction to DB: {db_err}")

        return {
            "price": round(float(price), 2),
            "currency": "LKR",
            "quality_grade": data.quality_grade,
            "district": data.district,
            "quality_level": quality_level,
            "standard_grade": data.standard_grade,
            "market_suggestions": market_suggestions,
            "reason": reason,
            "message": "Price prediction successful",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Price prediction failed: {str(e)}")


@app.get("/grades")
def get_grades():
    """Get static information about cinnamon grades."""
    if app.state.grades_info:
        return app.state.grades_info
    else:
        raise HTTPException(status_code=503, detail=f"Grades info unavailable: {getattr(app.state, 'grades_load_error', 'unknown error')}")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/predictions")
async def get_predictions(limit: int = 50, skip: int = 0):
    """Get prediction history."""
    try:
        collection = Database.get_predictions_collection()
        predictions = await collection.find().sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)

        # Convert ObjectId to string for JSON serialization
        for prediction in predictions:
            prediction["_id"] = str(prediction["_id"])

        return {"predictions": predictions, "count": len(predictions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve predictions: {str(e)}")


@app.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Get a specific prediction by ID."""
    try:
        # _id is stored as a string in Mongo (see PredictionDocument),
        # so we query directly by the string ID instead of ObjectId.
        collection = Database.get_predictions_collection()
        prediction = await collection.find_one({"_id": prediction_id})

        if prediction:
            prediction["_id"] = str(prediction["_id"])
            return prediction
        else:
            raise HTTPException(status_code=404, detail="Prediction not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve prediction: {str(e)}")


@app.delete("/predictions/{prediction_id}", status_code=204)
async def delete_prediction(prediction_id: str):
    """Delete a specific prediction by ID."""
    try:
        collection = Database.get_predictions_collection()
        # _id is stored as a string, so match directly on that string
        result = await collection.delete_one({"_id": prediction_id})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Prediction not found")

        return Response(status_code=204)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete prediction: {str(e)}")

