import joblib
import pandas as pd
import os
from typing import Dict, List

MODELS_PATH = os.path.join(os.path.dirname(__file__), "..", "models")

class ModelLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance

    def _load_models(self):
        # Load core models
        self.with_tool_model = joblib.load(os.path.join(MODELS_PATH, "with_moisture_tool_model.pkl"))
        self.without_tool_model = joblib.load(os.path.join(MODELS_PATH, "without_moisture_tool_model.pkl"))
        self.price_model = joblib.load(os.path.join(MODELS_PATH, "price_model.pkl"))
        
        # Load encoders
        self.grade_encoder = joblib.load(os.path.join(MODELS_PATH, "grade_encoder.pkl"))
        self.district_encoder = joblib.load(os.path.join(MODELS_PATH, "district_encoder.pkl"))
        
        # Load columns
        with_tool_cols_path = os.path.join(MODELS_PATH, "with_moisture_tool_columns.pkl")
        if os.path.exists(with_tool_cols_path):
            self.with_tool_columns = joblib.load(with_tool_cols_path)
        else:
            self.with_tool_columns = self.with_tool_model.feature_names_in_.tolist()

        self.without_tool_columns = self.without_tool_model.feature_names_in_.tolist()
        self.price_columns = self.price_model.feature_names_in_.tolist()

def preprocess_input(data: Dict, columns: List[str], use_encoders: bool = False):
    loader = ModelLoader()
    processed_data = data.copy()

    # Fixed maps for Quality models (they might still use these)
    color_map = {"Light Brown": 2, "Golden Brown": 1, "Dark Brown": 0}
    mould_map = {"No": 1, "Yes": 0}
    
    if "Color" in processed_data:
        processed_data["Color"] = color_map.get(processed_data["Color"], 0)
    if "Visual_Mould" in processed_data:
        processed_data["Visual_Mould"] = mould_map.get(processed_data["Visual_Mould"], 0)

    # Handle Grade and District encoding
    if use_encoders:
        # Use provided LabelEncoders for Price model
        if "Grade" in processed_data:
            grade = str(processed_data["Grade"]).strip()
            try:
                processed_data["Grade"] = loader.grade_encoder.transform([grade])[0]
            except:
                # Fallback if grade is not in encoder classes
                processed_data["Grade"] = 0
        
        if "District" in processed_data:
            district = str(processed_data["District"]).strip()
            try:
                processed_data["District"] = loader.district_encoder.transform([district])[0]
            except:
                processed_data["District"] = 0
    else:
        # Legacy mapping for Quality models if they expect numbers
        # (Modify this if quality models also need encoders)
        district_map = {
            "Badulla": 0, "Colombo": 1, "Galle": 2, "Gampaha": 3,
            "Hambantota": 4, "Kurunegala": 5, "Matara": 6,
            "Monaragala": 7, "Ratnapura": 8
        }
        if "District" in processed_data:
            processed_data["District"] = district_map.get(processed_data["District"], 0)

    # Create DataFrame and reindex
    df = pd.DataFrame([processed_data])
    df = df.reindex(columns=columns, fill_value=0)
    
    # Final check: make sure all columns are numeric
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
    return df

def predict_grade(data: Dict, has_moisture_tool: bool):
    loader = ModelLoader()
    if has_moisture_tool:
        model = loader.with_tool_model
        columns = loader.with_tool_columns
    else:
        model = loader.without_tool_model
        columns = loader.without_tool_columns
        
    df = preprocess_input(data, columns, use_encoders=False)
    prediction = model.predict(df)[0]
    return prediction

def predict_price(grade: str, district: str, month: int, year: int):
    loader = ModelLoader()
    price_data = {
        "Grade": grade,
        "District": district,
        "Month": month,
        "Year": year
    }
    
    df = preprocess_input(price_data, loader.price_columns, use_encoders=True)
    price = loader.price_model.predict(df)[0]
    return round(float(price), 2)
