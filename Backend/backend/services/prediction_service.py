from __future__ import annotations

from datetime import datetime

import pandas as pd
from fastapi import HTTPException

from schemas.request_response_schema import (
    CalculatedValues,
    PredictionRequest,
    PredictionResponse,
)
from services.calculation_service import (
    calculate_estimated_moisture,
    calculate_temperature_averages,
    calculate_total_income,
)
from services.marketplace_service import recommend_marketplaces
from services.model_service import load_dataframes, load_models
from utils.constants import COLORS, DISTRICTS, GRADE_TO_QUALITY, VISUAL_MOULD


def _grade_to_quality(grade: str) -> str:
    return GRADE_TO_QUALITY.get((grade or "").strip().upper(), "Low Quality")


def _closest_grade_from_df(df: pd.DataFrame, payload: PredictionRequest, moisture_pct: float, temps: dict) -> str:
    if df.empty or "Grade_Label" not in df.columns:
        return "C5"

    # Keep only rows from selected district first, fallback to all rows
    district_rows = (
        df[df["District"].astype(str).str.lower() == payload.district.lower()]
        if "District" in df.columns
        else pd.DataFrame()
    )
    work_df = district_rows if not district_rows.empty else df

    candidates = []
    for _, row in work_df.iterrows():
        score = 0.0

        row_moisture = float(row.get("Estimated_Moisture_Percentage", row.get("Moisture_Percentage", 0)) or 0)
        row_diameter = float(row.get("Diameter_mm", 0) or 0)
        row_days = float(row.get("Drying_Days", 0) or 0)
        row_temp = float(row.get("Overall_Average_Temperature_C", 0) or 0)
        row_color = str(row.get("Color", ""))
        row_mould = str(row.get("Visual_Mould", ""))

        score += abs(row_moisture - moisture_pct) * 2.0
        score += abs(row_diameter - (payload.diameter_mm or 0)) * 0.8
        score += abs(row_days - payload.drying_days) * 1.2
        score += abs(row_temp - temps["overall_average_temperature_c"]) * 1.0
        if row_color.lower() != (payload.color or "").lower():
            score += 2.0
        if row_mould.lower() != (payload.visual_mould or "").lower():
            score += 2.0

        candidates.append((score, str(row.get("Grade_Label", "C5"))))

    if not candidates:
        return "C5"
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def _estimate_price_from_df(price_df: pd.DataFrame, district: str, grade: str, quality: str) -> float:
    # Try using dataset if it has a recognizable price column.
    if not price_df.empty:
        cols = {c.lower(): c for c in price_df.columns}
        price_col = None
        for key in cols:
            if "price" in key:
                price_col = cols[key]
                break

        district_col = next((cols[k] for k in cols if "district" in k), None)
        grade_col = next((cols[k] for k in cols if "grade" in k), None)

        if price_col:
            filtered = price_df
            if district_col:
                filtered = filtered[
                    filtered[district_col].astype(str).str.lower() == district.lower()
                ]
            if grade_col and not filtered.empty:
                exact = filtered[
                    filtered[grade_col].astype(str).str.upper() == grade.upper()
                ]
                if not exact.empty:
                    return round(float(exact[price_col].mean()), 2)
            if not filtered.empty:
                return round(float(filtered[price_col].mean()), 2)
            return round(float(price_df[price_col].mean()), 2)

    # Fallback heuristic
    base = {"High Quality": 4800, "Medium Quality": 3800, "Low Quality": 3000}.get(quality, 3200)
    district_adjust = {
        "galle": 200,
        "colombo": 150,
        "matara": 100,
        "gampaha": 50,
        "ratnapura": -50,
        "kurunegala": -80,
        "monaragala": -120,
        "hambantota": -70,
        "badulla": -90,
    }.get(district.lower(), 0)
    return round(base + district_adjust, 2)


def _normalize_choice(value: str, allowed: list[str], label: str) -> str:
    for item in allowed:
        if item.lower() == (value or "").strip().lower():
            return item
    raise HTTPException(status_code=400, detail=f"Invalid {label}")


def run_prediction(payload: PredictionRequest) -> PredictionResponse:
    # --- Validation ---
    if payload.drying_days <= 0:
        raise HTTPException(status_code=400, detail="drying_days must be greater than 0")
    if payload.harvest_quantity_kg <= 0:
        raise HTTPException(status_code=400, detail="harvest_quantity_kg must be greater than 0")
    if payload.diameter_mm <= 0:
        raise HTTPException(status_code=400, detail="diameter_mm must be greater than 0")
    if payload.drying_days != len(payload.temperature_readings):
        raise HTTPException(status_code=400, detail="Temperature readings count must match drying days")
    for reading in payload.temperature_readings:
        if reading.day < 1 or reading.day > payload.drying_days:
            raise HTTPException(status_code=400, detail="Each temperature reading day must be within drying days")
        if reading.temp_8am <= 0 or reading.temp_12pm <= 0 or reading.temp_6pm <= 0:
            raise HTTPException(status_code=400, detail="Temperature values must be positive")

    user_type = payload.user_type.strip().lower()
    if user_type not in {"farmer", "large_scale"}:
        raise HTTPException(status_code=400, detail="Invalid user_type. Use farmer or large_scale")

    district = _normalize_choice(payload.district, DISTRICTS, "district")
    color = _normalize_choice(payload.color, COLORS, "color")
    visual_mould = _normalize_choice(payload.visual_mould, VISUAL_MOULD, "visual_mould")

    mode = payload.farmer_moisture_mode
    if user_type == "farmer" and mode is None:
        if payload.weight_before_drying_kg is not None and payload.weight_after_drying_kg is not None:
            mode = "weights"
        elif payload.moisture_percentage is not None:
            mode = "moisture_tool"
        else:
            mode = "weights"

    if user_type == "large_scale" and mode not in (None, "weights"):
        # Large-scale flow should not send farmer-only moisture mode metadata.
        mode = None

    if user_type == "farmer":
        if mode not in {"weights", "moisture_tool"}:
            raise HTTPException(status_code=400, detail="Invalid farmer_moisture_mode")

        if mode == "weights":
            if payload.weight_before_drying_kg is None or payload.weight_after_drying_kg is None:
                raise HTTPException(
                    status_code=400,
                    detail="Farmer (without moisture tool) requires weight_before_drying_kg and weight_after_drying_kg",
                )
            if payload.weight_before_drying_kg <= 0 or payload.weight_after_drying_kg <= 0:
                raise HTTPException(status_code=400, detail="Weights must be positive values")
            if payload.weight_after_drying_kg >= payload.weight_before_drying_kg:
                raise HTTPException(
                    status_code=400,
                    detail="Weight after drying must be less than weight before drying",
                )
        else:
            if payload.moisture_percentage is None:
                raise HTTPException(status_code=400, detail="Farmer (with moisture tool) requires moisture_percentage")
            if payload.moisture_percentage <= 0 or payload.moisture_percentage > 100:
                raise HTTPException(status_code=400, detail="moisture_percentage must be between 0 and 100")
    else:
        if payload.moisture_percentage is None:
            raise HTTPException(status_code=400, detail="Large scale input requires moisture_percentage")
        if payload.moisture_percentage <= 0 or payload.moisture_percentage > 100:
            raise HTTPException(status_code=400, detail="moisture_percentage must be between 0 and 100")

    # --- Derived values ---
    temps = calculate_temperature_averages(payload.temperature_readings)
    if user_type == "farmer" and mode == "weights":
        estimated_moisture = calculate_estimated_moisture(
            float(payload.weight_before_drying_kg or 0),
            float(payload.weight_after_drying_kg or 0),
        )
        model_weight_before = float(payload.weight_before_drying_kg or 0)
        model_weight_after = float(payload.weight_after_drying_kg or 0)
    elif user_type == "farmer" and mode == "moisture_tool":
        m = float(payload.moisture_percentage or 0)
        estimated_moisture = round(m, 2)
        # Convert moisture tool reading into a consistent weight pair for the farmer model schema.
        model_weight_before = 100.0
        model_weight_after = round(100.0 - m, 2)
    else:
        estimated_moisture = None
        model_weight_before = 0.0
        model_weight_after = 0.0

    moisture_for_model = (
        float(estimated_moisture)
        if estimated_moisture is not None
        else float(payload.moisture_percentage or 0)
    )

    dfs = load_dataframes()
    models = load_models()
    farmer_df = dfs.get("farmer_df", pd.DataFrame())
    large_scale_df = dfs.get("large_scale_df", pd.DataFrame())
    price_df = dfs.get("price_df", pd.DataFrame())
    farmer_model = models.get("farmer_grade_model")
    large_scale_model = models.get("large_scale_grade_model")
    price_model = models.get("price_model")

    # --- Grade prediction ---
    if user_type == "farmer":
        model_input = pd.DataFrame([{
            "Weight_Before_Drying_kg": model_weight_before,
            "Weight_After_Drying_kg": model_weight_after,
            "Estimated_Moisture_Percentage": moisture_for_model,
            "Diameter_mm": payload.diameter_mm,
            "Drying_Days": payload.drying_days,
            "Avg_Temp_8AM_C": temps["avg_temp_8am_c"],
            "Avg_Temp_12PM_C": temps["avg_temp_12pm_c"],
            "Avg_Temp_6PM_C": temps["avg_temp_6pm_c"],
            "Overall_Average_Temperature_C": temps["overall_average_temperature_c"],
            "Color": color,
            "Visual_Mould": visual_mould,
            "District": district,
        }])
        if farmer_model is not None:
            predicted_grade = str(farmer_model.predict(model_input)[0])
        else:
            predicted_grade = _closest_grade_from_df(farmer_df, payload, moisture_for_model, temps)
    else:
        model_input = pd.DataFrame([{
            "Moisture_Percentage": moisture_for_model,
            "Diameter_mm": payload.diameter_mm,
            "Drying_Days": payload.drying_days,
            "Avg_Temp_8AM_C": temps["avg_temp_8am_c"],
            "Avg_Temp_12PM_C": temps["avg_temp_12pm_c"],
            "Avg_Temp_6PM_C": temps["avg_temp_6pm_c"],
            "Overall_Average_Temperature_C": temps["overall_average_temperature_c"],
            "Color": color,
            "Visual_Mould": visual_mould,
            "District": district,
        }])
        if large_scale_model is not None:
            predicted_grade = str(large_scale_model.predict(model_input)[0])
        else:
            predicted_grade = _closest_grade_from_df(large_scale_df, payload, moisture_for_model, temps)

    quality_level = _grade_to_quality(predicted_grade)
    now = datetime.now()
    if price_model is not None:
        price_input = pd.DataFrame([{
            "Month": now.month,
            "Year": now.year,
            "District": district,
            "Grade": predicted_grade,
        }])
        estimated_price = round(float(price_model.predict(price_input)[0]), 2)
    else:
        estimated_price = _estimate_price_from_df(price_df, district, predicted_grade, quality_level)

    estimated_total_income = calculate_total_income(estimated_price, payload.harvest_quantity_kg)
    marketplaces = recommend_marketplaces(
        predicted_grade,
        district,
        payload.harvest_quantity_kg,
        estimated_price,
    )

    return PredictionResponse(
        predicted_grade=predicted_grade,
        predicted_price_per_kg=estimated_price,
        harvest_quantity_kg=payload.harvest_quantity_kg,
        estimated_total_income=estimated_total_income,
        district=district,
        calculated_values=CalculatedValues(
            estimated_moisture_percentage=estimated_moisture,
            avg_temp_8am_c=temps["avg_temp_8am_c"],
            avg_temp_12pm_c=temps["avg_temp_12pm_c"],
            avg_temp_6pm_c=temps["avg_temp_6pm_c"],
            overall_average_temperature_c=temps["overall_average_temperature_c"],
        ),
        recommended_marketplaces=marketplaces,
    )
