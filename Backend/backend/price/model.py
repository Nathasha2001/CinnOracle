import joblib
import os
import numpy as np

# Load price model and encoders
_model = None
_district_encoder = None
_grade_encoder = None

# Use absolute paths to avoid issues
_base_dir = os.path.dirname(os.path.abspath(__file__))
_model_path = os.path.join(_base_dir, "cinnamon_price_model.pkl")  # Using the correct filename
_district_encoder_path = os.path.join(_base_dir, "district_encoder.pkl")
_grade_encoder_path = os.path.join(_base_dir, "grade_encoder.pkl")

def load_model():
    """Load the price model from disk."""
    global _model
    if _model is None:
        try:
            with open(_model_path, 'rb') as f:
                _model = joblib.load(f)
        except FileNotFoundError:
            raise Exception(f"Price model not found at {_model_path}")
        except Exception as e:
            raise Exception(f"Error loading price model: {e}")
    return _model

def load_district_encoder():
    """Load the district encoder from disk."""
    global _district_encoder
    if _district_encoder is None:
        try:
            with open(_district_encoder_path, 'rb') as f:
                _district_encoder = joblib.load(f)
        except FileNotFoundError:
            raise Exception(f"District encoder not found at {_district_encoder_path}")
        except Exception as e:
            raise Exception(f"Error loading district encoder: {e}")
    return _district_encoder

def load_grade_encoder():
    """Load the grade encoder from disk."""
    global _grade_encoder
    if _grade_encoder is None:
        try:
            with open(_grade_encoder_path, 'rb') as f:
                _grade_encoder = joblib.load(f)
        except FileNotFoundError:
            raise Exception(f"Grade encoder not found at {_grade_encoder_path}")
        except Exception as e:
            raise Exception(f"Error loading grade encoder: {e}")
    return _grade_encoder

def predict_price(quality_grade: str, district: str = "Galle", weight_loss_percent: float = None):
    """
    Predict cinnamon price based on quality grade, district, and other factors.
    
    Args:
        quality_grade: Quality grade (e.g., 'Premium', 'Grade A', 'Grade B')
        district: Production district (default: 'Galle')
        weight_loss_percent: Optional weight loss percentage (not used in current model)
    
    Returns:
        Predicted price in LKR per kg
    """
    import datetime
    
    model = load_model()
    district_encoder = load_district_encoder()
    grade_encoder = load_grade_encoder()
    
    # Encode categorical features
    try:
        grade_encoded = grade_encoder.transform([quality_grade])[0]
        district_encoded = district_encoder.transform([district])[0]
    except ValueError as e:
        raise Exception(f"Invalid grade or district: {e}")
    
    # Get current month and year
    current_date = datetime.datetime.now()
    current_month = current_date.month
    current_year = current_date.year
    
    # Prepare features for prediction (4 features: District_Encoded, Grade_Encoded, Month, Year)
    features = np.array([[district_encoded, grade_encoded, current_month, current_year]])
    prediction = model.predict(features)[0]
    
    return prediction
