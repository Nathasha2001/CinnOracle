from typing import List
from schemas.prediction_schema import TemperatureReading

def calculate_moisture(weight_before: float, weight_after: float) -> float:
    if weight_before <= 0:
        return 0.0
    moisture = ((weight_before - weight_after) / weight_before) * 100
    return round(moisture, 2)

def calculate_temperature_averages(readings: List[TemperatureReading]):
    if not readings:
        return 0.0, 0.0, 0.0, 0.0
    
    avg_8am = sum(r.temp_8am for r in readings) / len(readings)
    avg_12pm = sum(r.temp_12pm for r in readings) / len(readings)
    avg_6pm = sum(r.temp_6pm for r in readings) / len(readings)
    
    overall_avg = (avg_8am + avg_12pm + avg_6pm) / 3
    
    return (
        round(avg_8am, 1),
        round(avg_12pm, 1),
        round(avg_6pm, 1),
        round(overall_avg, 1)
    )

def classify_farmer_scale(harvest_quantity_kg: float):
    if harvest_quantity_kg >= 500:
        farmer_scale = "Large Scale"
        category = "large_scale"
    else:
        farmer_scale = "Farmer Level"
        category = "farmer_level"
        
    return farmer_scale, category
