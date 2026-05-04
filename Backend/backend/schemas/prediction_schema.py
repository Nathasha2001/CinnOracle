from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class TemperatureReading(BaseModel):
    day: int
    temp_8am: float
    temp_12pm: float
    temp_6pm: float

class PredictionRequest(BaseModel):
    has_moisture_tool: bool
    diameter_mm: float = Field(..., gt=0)
    drying_days: int = Field(..., gt=0)
    moisture_percentage: Optional[float] = None
    weight_before_drying_kg: Optional[float] = None
    weight_after_drying_kg: Optional[float] = None
    temperature_readings: List[TemperatureReading]
    color: str # Light Brown, Golden Brown, Dark Brown
    visual_mould: str # Yes, No
    harvest_quantity_kg: float = Field(..., gt=0)
    district: str

class CalculatedValues(BaseModel):
    moisture_percentage: float
    avg_temp_8am_c: float
    avg_temp_12pm_c: float
    avg_temp_6pm_c: float
    overall_average_temperature_c: float

class PredictionResponse(BaseModel):
    predicted_grade: str
    predicted_price_per_kg: float
    harvest_quantity_kg: float
    estimated_total_income: float
    farmer_scale: str
    quantity_category: str
    district: str
    calculated_values: CalculatedValues
    recommended_marketplaces: List[str]
    prediction_id: Optional[str] = None
    timestamp: Optional[str] = None
    inputs: Optional[PredictionRequest] = None

class HistoryItem(PredictionResponse):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True
