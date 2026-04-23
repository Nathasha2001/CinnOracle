def calculate_estimated_moisture(weight_before: float, weight_after: float) -> float:
    if weight_before <= 0:
        return 0.0
    return round(((weight_before - weight_after) / weight_before) * 100, 2)


def calculate_temperature_averages(
    temperature_readings: list,
) -> dict:
    count = len(temperature_readings)
    if count == 0:
        return {
            "avg_temp_8am_c": 0.0,
            "avg_temp_12pm_c": 0.0,
            "avg_temp_6pm_c": 0.0,
            "overall_average_temperature_c": 0.0,
        }

    avg_8am = sum(d.temp_8am for d in temperature_readings) / count
    avg_12pm = sum(d.temp_12pm for d in temperature_readings) / count
    avg_6pm = sum(d.temp_6pm for d in temperature_readings) / count
    overall_avg = (avg_8am + avg_12pm + avg_6pm) / 3

    return {
        "avg_temp_8am_c": round(avg_8am, 2),
        "avg_temp_12pm_c": round(avg_12pm, 2),
        "avg_temp_6pm_c": round(avg_6pm, 2),
        "overall_average_temperature_c": round(overall_avg, 2),
    }


def calculate_total_income(price_per_kg: float, harvest_quantity: float) -> float:
    return round(price_per_kg * harvest_quantity, 2)
