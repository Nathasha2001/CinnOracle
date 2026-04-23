from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from bson import ObjectId
from fastapi import HTTPException

from schemas.request_response_schema import PredictionRequest, PredictionResponse
from services.database_service import get_database

logger = logging.getLogger(__name__)


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _market_strings_to_objects(markets: list[str]) -> list[dict[str, str]]:
    return [{"name": m, "description": "Recommended by CinnOracle"} for m in markets]


def _doc_to_api(item: dict[str, Any]) -> dict[str, Any]:
    out = dict(item)
    out["_id"] = str(item["_id"])
    return out


def save_prediction_record(payload: PredictionRequest, prediction: PredictionResponse) -> str:
    db = get_database()
    if db is None:
        logger.error("Database is not connected")
        raise HTTPException(status_code=503, detail="Database is not connected")

    try:
        now = _utc_iso()
        user_type = (payload.user_type or "").strip().lower()
        is_large_scale = user_type == "large_scale"

        # Keep compatibility with current frontend history contract.
        weight_before = float(payload.weight_before_drying_kg or 0)
        weight_after = float(payload.weight_after_drying_kg or payload.harvest_quantity_kg)
        if weight_before > 0:
            weight_loss_percent = round(((weight_before - weight_after) / weight_before) * 100, 2)
        else:
            est_m = prediction.calculated_values.estimated_moisture_percentage
            weight_loss_percent = round(float(est_m or 0), 2)

        doc = {
            "batch_id": f"#{uuid4().hex[:6].upper()}",
            "weight_before": weight_before,
            "weight_after": weight_after,
            "user_type": user_type,
            "farmer_moisture_mode": payload.farmer_moisture_mode,
            "moisture_percentage": float(payload.moisture_percentage or 0),
            "diameter_mm": float(payload.diameter_mm or 0),
            "temperature": float(prediction.calculated_values.overall_average_temperature_c),
            "avg_temp_8am_c": float(prediction.calculated_values.avg_temp_8am_c or 0),
            "avg_temp_12pm_c": float(prediction.calculated_values.avg_temp_12pm_c or 0),
            "avg_temp_6pm_c": float(prediction.calculated_values.avg_temp_6pm_c or 0),
            "estimated_moisture_percentage": float(prediction.calculated_values.estimated_moisture_percentage or 0),
            "temperature_readings": [reading.model_dump() for reading in payload.temperature_readings],
            "district": prediction.district,
            "harvest_date": now,
            "drying_days": payload.drying_days,
            "color": payload.color,
            "visual_mould": payload.visual_mould,
            "quality_level": "High Quality"
            if prediction.predicted_grade.strip().upper() in {"ALBA", "C5 SPECIAL", "C5"}
            else ("Medium Quality" if prediction.predicted_grade.strip().upper() in {"C4", "H1"} else "Low Quality"),
            "standard_grade": prediction.predicted_grade,
            "predicted_quality": prediction.predicted_grade,
            "predicted_standard_grade": prediction.predicted_grade,
            "weight_loss_percent": weight_loss_percent,
            "estimated_price": float(prediction.predicted_price_per_kg),
            "currency": "LKR",
            "market_suggestions": _market_strings_to_objects(prediction.recommended_marketplaces),
            "reason": "Generated from /predict pipeline",
            "harvest_quantity_kg": float(prediction.harvest_quantity_kg),
            "estimated_total_income": float(prediction.estimated_total_income),
            "created_at": now,
            "updated_at": now,
        }

        result = db["predictions"].insert_one(doc)
        logger.info("Prediction saved successfully: %s", result.inserted_id)
        return str(result.inserted_id)
    except Exception as e:
        logger.error("Error saving prediction: %s", e)
        raise


def list_prediction_records(limit: int = 50, skip: int = 0) -> dict[str, Any]:
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not connected")

    limit = max(1, min(limit, 500))
    skip = max(0, skip)

    cursor = (
        db["predictions"]
        .find({})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    rows = [_doc_to_api(row) for row in cursor]
    count = db["predictions"].count_documents({})
    return {"predictions": rows, "count": count}


def delete_prediction_record(prediction_id: str) -> None:
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not connected")

    try:
        oid = ObjectId(prediction_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid prediction id") from exc

    deleted = db["predictions"].delete_one({"_id": oid})
    if deleted.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prediction not found")
