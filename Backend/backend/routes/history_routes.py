from fastapi import APIRouter, HTTPException
from typing import List
from services import database_service

router = APIRouter(prefix="/history", tags=["history"])

@router.get("", response_model=dict)
async def get_history():
    try:
        predictions = database_service.get_history()
        return {
            "predictions": predictions,
            "count": len(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{prediction_id}", response_model=dict)
async def get_prediction(prediction_id: str):
    item = database_service.get_prediction_by_id(prediction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return item

@router.delete("/{prediction_id}")
async def delete_prediction(prediction_id: str):
    success = database_service.delete_prediction(prediction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"status": "deleted"}
