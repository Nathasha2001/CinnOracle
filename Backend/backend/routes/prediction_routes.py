from fastapi import APIRouter, HTTPException
from schemas.prediction_schema import PredictionRequest, PredictionResponse
from services import prediction_service

router = APIRouter(prefix="/predict", tags=["prediction"])

@router.post("", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        # Basic validation
        if not request.has_moisture_tool:
            if request.weight_before_drying_kg is None or request.weight_after_drying_kg is None:
                raise HTTPException(status_code=400, detail="Weights are required when moisture tool is not used")
            if request.weight_after_drying_kg >= request.weight_before_drying_kg:
                raise HTTPException(status_code=400, detail="Weight after drying must be less than weight before drying")
        elif request.moisture_percentage is None:
            raise HTTPException(status_code=400, detail="Moisture percentage is required when moisture tool is used")
            
        if len(request.temperature_readings) != request.drying_days:
            raise HTTPException(status_code=400, detail="Number of temperature readings must equal drying days")
            
        result = prediction_service.process_prediction(request)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
