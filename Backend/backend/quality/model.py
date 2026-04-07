import joblib
import os
import numpy as np
from pydantic import BaseModel
from typing import Optional

# Load quality model
_model = None
_model_path = os.path.join(os.path.dirname(__file__), "cinnamon_quality_model (1).pkl")

class HarvestFeatures(BaseModel):
    weight_before: float
    weight_after: float
    drying_temperature: float
    drying_days: int = 7
    color: str = "Golden Brown"
    breakage_level: str = "Low"
    roll_tightness: str = "Medium"
    aroma_strength: str = "Strong"

class QualityResult(BaseModel):
    quality_level: str
    standard_grade: str
    weight_loss_percent: float

def load_model():
    """Load the quality model from disk."""
    global _model
    if _model is None:
        try:
            _model = joblib.load(_model_path)
        except FileNotFoundError:
            raise Exception(f"Quality model not found at {_model_path}")
    return _model

def predict_quality(model, features: HarvestFeatures) -> QualityResult:
    """
    Predict cinnamon quality based on harvest features.

    Args:
        model: Loaded ML model
        features: HarvestFeatures object with drying parameters

    Returns:
        QualityResult with predicted quality information
    """
    # Calculate weight loss percentage
    weight_loss_percent = ((features.weight_before - features.weight_after) / features.weight_before) * 100

    # Simple prediction logic based on weight loss (fallback if model fails)
    if weight_loss_percent < 10:
        quality_level = "High"
        standard_grade = "Alba"
    elif weight_loss_percent < 20:
        quality_level = "Medium"
        standard_grade = "C5"
    else:
        quality_level = "Low"
        standard_grade = "C4"

    # Try to use the model for prediction
    try:
        # Prepare features for model (simplified - using weight loss and temperature)
        model_features = np.array([[features.weight_before, features.weight_after, features.drying_temperature]])
        prediction = model.predict(model_features)[0]

        # Map prediction to quality levels (assuming model outputs numeric values)
        if isinstance(prediction, (int, float)):
            if prediction > 0.7:
                quality_level = "High"
                standard_grade = "Alba"
            elif prediction > 0.4:
                quality_level = "Medium"
                standard_grade = "C5"
            else:
                quality_level = "Low"
                standard_grade = "C4"
        else:
            # If model returns string, use it directly
            quality_level = str(prediction)
            standard_grade = str(prediction)

    except Exception as e:
        # Fallback to rule-based prediction
        print(f"Model prediction failed, using fallback: {e}")

    return QualityResult(
        quality_level=quality_level,
        standard_grade=standard_grade,
        weight_loss_percent=round(weight_loss_percent, 2)
    )
