from pathlib import Path

DISTRICTS = [
    "Badulla",
    "Colombo",
    "Galle",
    "Gampaha",
    "Hambantota",
    "Kurunegala",
    "Matara",
    "Monaragala",
    "Ratnapura",
]

COLORS = [
    "Light Brown",
    "Golden Brown",
    "Dark Brown",
]

VISUAL_MOULD = ["Yes", "No"]

GRADE_TO_QUALITY = {
    "ALBA": "High Quality",
    "C5 SPECIAL": "High Quality",
    "C5": "High Quality",
    "C4": "Medium Quality",
    "H1": "Medium Quality",
    "H2": "Low Quality",
    "HEEN": "Low Quality",
    "GOROSU": "Low Quality",
}

ROOT_DIR = Path(__file__).resolve().parents[2]
DOWNLOADS_DIR = Path.home() / "Downloads"

FARMER_DATASET_PATH = DOWNLOADS_DIR / "CinnOracle_farmer_without_tool_dataset.csv"
LARGE_SCALE_DATASET_PATH = DOWNLOADS_DIR / "CinnOracle_large_scale_final_ui_dataset.csv"
PRICE_DATASET_PATH = DOWNLOADS_DIR / "cleaned_price_dataset.xlsx"
