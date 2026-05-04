from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services import database_service, report_service

router = APIRouter(prefix="/report", tags=["report"])

@router.get("/{prediction_id}")
async def get_report(prediction_id: str):
    prediction = database_service.get_prediction_by_id(prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    pdf_buffer = report_service.generate_pdf_report(prediction)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{prediction_id}.pdf"}
    )
