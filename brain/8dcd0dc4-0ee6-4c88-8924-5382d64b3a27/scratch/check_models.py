import joblib
import os

files = [
    r"c:\Users\it c\Desktop\CinnOracle\price_model (1).pkl",
    r"c:\Users\it c\Desktop\CinnOracle\without_tool_model.pkl",
    r"c:\Users\it c\Desktop\CinnOracle\with_moisture_tool_model.pkl",
    r"c:\Users\it c\Desktop\CinnOracle\with_moisture_tool_columns.pkl"
]

for f in files:
    print(f"Loading {f}...")
    try:
        obj = joblib.load(f)
        print(f"Type: {type(obj)}")
        if hasattr(obj, 'feature_names_in_'):
            print(f"Features: {obj.feature_names_in_}")
        elif isinstance(obj, list):
            print(f"List length: {len(obj)}")
            print(f"First element: {obj[0]}")
    except Exception as e:
        print(f"Error loading {f}: {e}")
