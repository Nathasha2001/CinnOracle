import joblib
import os

model_path = r"c:\Users\it c\Desktop\CinnOracle\Backend\backend\models\price_model.pkl"
try:
    model = joblib.load(model_path)
    print("Model loaded successfully.")
    if hasattr(model, 'feature_names_in_'):
        print("Features:", model.feature_names_in_)
    else:
        print("No feature_names_in_ found.")
except Exception as e:
    print(f"Error: {e}")
