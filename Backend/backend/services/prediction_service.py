from datetime import datetime
from schemas.prediction_schema import PredictionRequest, PredictionResponse, CalculatedValues
from services import calculation_service, model_service, marketplace_service, database_service

def process_prediction(request: PredictionRequest):
    # 1. Calculate temperature averages
    avg_8am, avg_12pm, avg_6pm, overall_avg = calculation_service.calculate_temperature_averages(
        request.temperature_readings
    )
    
    # 2. Calculate moisture percentage if not provided
    moisture_percentage = request.moisture_percentage
    if not request.has_moisture_tool:
        moisture_percentage = calculation_service.calculate_moisture(
            request.weight_before_drying_kg,
            request.weight_after_drying_kg
        )
    
    # 3. Classify farmer scale
    farmer_scale, quantity_category = calculation_service.classify_farmer_scale(request.harvest_quantity_kg)
    
    # 4. Prepare data for model
    # Note: Model features are slightly different between with/without tool
    if request.has_moisture_tool:
        model_input = {
            "Moisture_Percentage": moisture_percentage,
            "Diameter_mm": request.diameter_mm,
            "Drying_Days": request.drying_days,
            "Avg_Temp_8AM_C": avg_8am,
            "Avg_Temp_12PM_C": avg_12pm,
            "Avg_Temp_6PM_C": avg_6pm,
            "Overall_Average_Temperature_C": overall_avg,
            "Color": request.color,
            "Visual_Mould": request.visual_mould,
            "Harvest_Quantity_kg": request.harvest_quantity_kg,
            "District": request.district
        }
    else:
        model_input = {
            "Diameter_mm": request.diameter_mm,
            "Avg_Temp_8AM": avg_8am,
            "Avg_Temp_12PM": avg_12pm,
            "Avg_Temp_6PM": avg_6pm,
            "Overall_Avg_Temp": overall_avg,
            "Color": request.color,
            "Visual_Mould": request.visual_mould,
            "Drying_Days": request.drying_days,
            "District": request.district,
            "Harvest_Quantity_kg": request.harvest_quantity_kg,
            "Calculated_Moisture": moisture_percentage
        }
    
    # 5. Predict Grade
    predicted_grade = model_service.predict_grade(model_input, request.has_moisture_tool)
    
    # 6. Predict Price
    current_date = datetime.now()
    predicted_price = model_service.predict_price(
        grade=predicted_grade,
        district=request.district,
        month=current_date.month,
        year=current_date.year
    )
    
    # 7. Calculate Total Income
    total_income = round(predicted_price * request.harvest_quantity_kg, 2)
    
    # 8. Get Marketplace Recommendations
    marketplaces = marketplace_service.get_recommended_marketplaces(request.district, request.harvest_quantity_kg)
    
    # 9. Create Response Object
    calculated_values = CalculatedValues(
        moisture_percentage=moisture_percentage,
        avg_temp_8am_c=avg_8am,
        avg_temp_12pm_c=avg_12pm,
        avg_temp_6pm_c=avg_6pm,
        overall_average_temperature_c=overall_avg
    )
    
    response_data = PredictionResponse(
        predicted_grade=predicted_grade,
        predicted_price_per_kg=predicted_price,
        harvest_quantity_kg=request.harvest_quantity_kg,
        estimated_total_income=total_income,
        farmer_scale=farmer_scale,
        quantity_category=quantity_category,
        district=request.district,
        calculated_values=calculated_values,
        recommended_marketplaces=marketplaces,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        inputs=request
    )
    
    # 10. Save to Database
    try:
        prediction_id = database_service.save_prediction(response_data.model_dump())
        response_data.prediction_id = prediction_id
    except Exception as e:
        print(f"Error saving to database: {e}")
        response_data.prediction_id = "error_not_saved"
    
    return response_data
