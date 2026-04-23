from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class TemperatureReading(BaseModel):
    day: int
    temp_8am: float
    temp_12pm: float
    temp_6pm: float


class PredictionRequest(BaseModel):
    user_type: str
    weight_before_drying_kg: Optional[float] = None
    weight_after_drying_kg: Optional[float] = None
    moisture_percentage: Optional[float] = None
    farmer_moisture_mode: Optional[Literal["weights", "moisture_tool"]] = None
    diameter_mm: float
    drying_days: int
    temperature_readings: List[TemperatureReading]
    color: str
    visual_mould: str
    district: str
    harvest_quantity_kg: float


class CalculatedValues(BaseModel):
    estimated_moisture_percentage: Optional[float] = None
    avg_temp_8am_c: float
    avg_temp_12pm_c: float
    avg_temp_6pm_c: float
    overall_average_temperature_c: float


class PredictionResponse(BaseModel):
    predicted_grade: str
    predicted_price_per_kg: float
    harvest_quantity_kg: float
    estimated_total_income: float
    district: str
    calculated_values: CalculatedValues
    recommended_marketplaces: List[str]
