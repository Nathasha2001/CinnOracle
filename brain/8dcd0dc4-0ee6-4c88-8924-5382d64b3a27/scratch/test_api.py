import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing /health...")
    response = requests.get(f"{BASE_URL}/health")
    print(response.json())

def test_predict_with_tool():
    print("\nTesting /predict (with tool)...")
    payload = {
        "has_moisture_tool": True,
        "diameter_mm": 8.7,
        "drying_days": 2,
        "moisture_percentage": 13.5,
        "temperature_readings": [
            { "day": 1, "temp_8am": 29.5, "temp_12pm": 33.2, "temp_6pm": 28.7 },
            { "day": 2, "temp_8am": 30.1, "temp_12pm": 34.0, "temp_6pm": 29.0 }
        ],
        "color": "Light Brown",
        "visual_mould": "No",
        "harvest_quantity_kg": 600,
        "district": "Galle"
    }
    response = requests.post(f"{BASE_URL}/predict", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
        return response.json().get("prediction_id")
    else:
        print(response.text)
    return None

def test_predict_without_tool():
    print("\nTesting /predict (without tool)...")
    payload = {
        "has_moisture_tool": False,
        "diameter_mm": 10.2,
        "drying_days": 1,
        "weight_before_drying_kg": 10.0,
        "weight_after_drying_kg": 8.5,
        "temperature_readings": [
            { "day": 1, "temp_8am": 30.0, "temp_12pm": 35.0, "temp_6pm": 29.0 }
        ],
        "color": "Golden Brown",
        "visual_mould": "No",
        "harvest_quantity_kg": 50,
        "district": "Matara"
    }
    response = requests.post(f"{BASE_URL}/predict", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(response.text)

def test_history():
    print("\nTesting /history...")
    response = requests.get(f"{BASE_URL}/history")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Items found: {len(response.json())}")

if __name__ == "__main__":
    test_health()
    pid = test_predict_with_tool()
    test_predict_without_tool()
    test_history()
