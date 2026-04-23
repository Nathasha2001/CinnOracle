from __future__ import annotations

from typing import Any, Dict
import pandas as pd
from pathlib import Path
import joblib

from utils.constants import (
    FARMER_DATASET_PATH,
    LARGE_SCALE_DATASET_PATH,
    PRICE_DATASET_PATH,
)

_DATA_CACHE: Dict[str, Any] = {}
_MODEL_CACHE: Dict[str, Any] = {}
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"


def _read_csv_safe(path):
    try:
        return pd.read_csv(path)
    except Exception:
        return pd.DataFrame()


def _read_excel_safe(path):
    try:
        return pd.read_excel(path)
    except Exception:
        return pd.DataFrame()


def load_dataframes() -> Dict[str, pd.DataFrame]:
    if _DATA_CACHE:
        return _DATA_CACHE

    farmer_df = _read_csv_safe(FARMER_DATASET_PATH)
    large_scale_df = _read_csv_safe(LARGE_SCALE_DATASET_PATH)
    price_df = _read_excel_safe(PRICE_DATASET_PATH)

    _DATA_CACHE["farmer_df"] = farmer_df
    _DATA_CACHE["large_scale_df"] = large_scale_df
    _DATA_CACHE["price_df"] = price_df
    return _DATA_CACHE


def _load_model_safe(path: Path):
    try:
        if path.exists() and path.stat().st_size > 0:
            return joblib.load(path)
    except Exception:
        return None
    return None


def load_models() -> Dict[str, Any]:
    if _MODEL_CACHE:
        return _MODEL_CACHE

    _MODEL_CACHE["farmer_grade_model"] = _load_model_safe(MODEL_DIR / "farmer_grade_model.pkl")
    _MODEL_CACHE["large_scale_grade_model"] = _load_model_safe(MODEL_DIR / "large_scale_grade_model.pkl")
    _MODEL_CACHE["price_model"] = _load_model_safe(MODEL_DIR / "price_model.pkl")
    return _MODEL_CACHE
