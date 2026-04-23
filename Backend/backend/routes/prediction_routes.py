import logging

from fastapi import APIRouter, Response, status
from schemas.request_response_schema import PredictionRequest, PredictionResponse
from services.history_service import (
    delete_prediction_record,
    list_prediction_records,
    save_prediction_record,
)
from services.prediction_service import run_prediction

router = APIRouter(tags=["predictions"])
logger = logging.getLogger(__name__)


# Grades reference data
GRADES_DATA = {
    "grades": [
        {
            "code": "ALBA",
            "name": "Alba",
            "description": "Premium Grade - Highest quality cinnamon",
            "characteristics": [
                "Thin quills (3-6mm diameter)",
                "Dark brown color",
                "Strong aroma",
                "Minimal breakage",
                "High oil content"
            ]
        },
        {
            "code": "C5_SPECIAL",
            "name": "C5 Special",
            "description": "Premium Grade - High quality cinnamon",
            "characteristics": [
                "Thin to medium quills (5-8mm diameter)",
                "Dark brown color",
                "Strong aroma",
                "Low breakage",
                "High oil content"
            ]
        },
        {
            "code": "C5",
            "name": "C5",
            "description": "High Quality - Premium cinnamon",
            "characteristics": [
                "Medium quills (6-10mm diameter)",
                "Medium brown color",
                "Good aroma",
                "Some breakage acceptable",
                "Moderate oil content"
            ]
        },
        {
            "code": "C4",
            "name": "C4",
            "description": "Medium Quality - Good cinnamon",
            "characteristics": [
                "Medium to thick quills (8-14mm diameter)",
                "Medium brown color",
                "Fair aroma",
                "Moderate breakage",
                "Moderate oil content"
            ]
        },
        {
            "code": "H1",
            "name": "H1",
            "description": "Medium Quality - Chips and pieces",
            "characteristics": [
                "Broken pieces and chips",
                "Medium brown color",
                "Fair aroma",
                "Higher breakage",
                "Moderate oil content"
            ]
        },
        {
            "code": "STANDARD",
            "name": "Standard",
            "description": "Lower Quality - Commercial grade",
            "characteristics": [
                "Thick pieces and powder",
                "Light to medium brown",
                "Light aroma",
                "High breakage and dust",
                "Lower oil content"
            ]
        }
    ],
    "quality_levels": {
        "High Quality": {
            "price_range": "Rs. 2000 - Rs. 4000 per kg",
            "market": "Export, Premium local markets",
            "temperature_range": "15-25°C",
            "weight_loss_range": "55-65%"
        },
        "Medium Quality": {
            "price_range": "Rs. 1200 - Rs. 2500 per kg",
            "market": "Local markets, Regional traders",
            "temperature_range": "18-28°C",
            "weight_loss_range": "60-70%"
        },
        "Low Quality": {
            "price_range": "Rs. 400 - Rs. 1500 per kg",
            "market": "Domestic use, Bulk processors",
            "temperature_range": "20-30°C",
            "weight_loss_range": "65-75%"
        }
    }
}


@router.get("/grades")
def get_grades():
    """Return cinnamon grades information and quality level details."""
    return GRADES_DATA


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    result = run_prediction(payload)
    # Prediction should still succeed even if DB is temporarily unavailable.
    try:
        save_prediction_record(payload, result)
    except Exception as exc:
        logger.warning("Prediction saved failed, returning result without persistence: %s", exc)
    return result


@router.get("/predictions")
def get_predictions(limit: int = 50, skip: int = 0):
    return list_prediction_records(limit=limit, skip=skip)


@router.delete("/predictions/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction(prediction_id: str):
    delete_prediction_record(prediction_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
