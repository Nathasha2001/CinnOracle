from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime

def generate_pdf_report(prediction_data: dict):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFont("Helvetica-Bold", 20)
    p.drawString(100, height - 50, "CinnOracle Prediction Report")
    
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 70, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    p.line(100, height - 75, 500, height - 75)

    # Details
    y = height - 100
    p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Prediction Results")
    y -= 20
    
    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Predicted Grade: {prediction_data.get('predicted_grade')}")
    y -= 20
    p.drawString(100, y, f"Predicted Price per kg: LKR {prediction_data.get('predicted_price_per_kg')}")
    y -= 20
    p.drawString(100, y, f"Harvest Quantity: {prediction_data.get('harvest_quantity_kg')} kg")
    y -= 20
    p.drawString(100, y, f"Estimated Total Income: LKR {prediction_data.get('estimated_total_income')}")
    y -= 20
    p.drawString(100, y, f"Farmer Scale: {prediction_data.get('farmer_scale')}")
    y -= 40

    p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Calculated Values")
    y -= 20
    
    calc = prediction_data.get('calculated_values', {})
    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Moisture Percentage: {calc.get('moisture_percentage')}%")
    y -= 20
    p.drawString(100, y, f"Overall Avg Temp: {calc.get('overall_average_temperature_c')} C")
    y -= 40

    p.setFont("Helvetica-Bold", 14)
    p.drawString(100, y, "Recommended Marketplaces")
    y -= 20
    
    p.setFont("Helvetica", 12)
    marketplaces = prediction_data.get('recommended_marketplaces', [])
    for market in marketplaces:
        p.drawString(120, y, f"- {market}")
        y -= 20

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer
