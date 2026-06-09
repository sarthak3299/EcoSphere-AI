import datetime
import base64
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models import models
from app.schemas import schemas
from app.services import auth_service
from app.ai.ai_service import AIService

router = APIRouter(prefix="/incident", tags=["Incident Reports"])

# Mapper for categories to authorities
AUTHORITY_MAP = {
    "Garbage Dumping": "Municipal Corporation",
    "Air Pollution": "Pollution Control Board",
    "Water Pollution": "Water Supply & Sewerage Board",
    "Plastic Waste": "Municipal Corporation",
    "Other": "Environmental Emergency Helpline"
}

@router.post("/report", response_model=schemas.IncidentReportResponse)
def report_incident(
    report_in: schemas.IncidentReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    image_url = None
    severity = report_in.severity
    category = report_in.category
    description = report_in.description
    authority = AUTHORITY_MAP.get(category, "Municipal Corporation")

    # If base64 image data is provided, run computer vision classification
    if report_in.image_data:
        try:
            # Check format and extract raw bytes
            data_parts = report_in.image_data.split(",")
            image_b64 = data_parts[-1]
            image_bytes = base64.b64decode(image_b64)
            
            # Call Gemini to classify image
            classification = AIService.classify_pollution_image(image_bytes)
            
            # Override inputs with AI classification values
            category = classification.get("category", category)
            severity = classification.get("severity", severity)
            description = f"[AI Analyzed] {classification.get('description', '')}\n\nUser Description: {description or ''}"
            authority = classification.get("assigned_authority", AUTHORITY_MAP.get(category, "Municipal Corporation"))
            
            # Store the data uri as the image_url for easy rendering in frontend
            image_url = report_in.image_data
        except Exception as e:
            # Log error and proceed with defaults
            print(f"Error classifying image: {e}")
            image_url = report_in.image_data

    new_report = models.IncidentReport(
        user_id=current_user.id,
        image_url=image_url,
        location_text=report_in.location_text,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        category=category,
        description=description,
        severity=severity,
        status="Submitted",
        authority=authority,
        created_at=datetime.datetime.utcnow()
    )

    # Award points for reporting environmental hazards (+20 XP, +5 Eco Score)
    current_user.xp += 50
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
        
    current_user.eco_score = min(1000, current_user.eco_score + 15)

    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("/all", response_model=list[schemas.IncidentReportResponse])
def get_all_incidents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    return db.query(models.IncidentReport).order_by(models.IncidentReport.created_at.desc()).all()

@router.get("/{report_id}", response_model=schemas.IncidentReportResponse)
def get_incident_details(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    report = db.query(models.IncidentReport).filter(models.IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found."
        )
    return report
