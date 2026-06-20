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
    if report_in.category not in AUTHORITY_MAP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(AUTHORITY_MAP.keys())}"
        )
    if report_in.severity not in ["Low", "Medium", "High"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid severity. Must be one of: Low, Medium, High"
        )

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
        created_at=datetime.datetime.now(datetime.timezone.utc)
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

@router.post("/{report_id}/verify")
def verify_incident(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    report = db.query(models.IncidentReport).filter(models.IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, 'HTTP_444_NOT_FOUND') else 404,
            detail="Incident report not found."
        )
    
    # Transition status
    if report.status == "Submitted":
        report.status = "Under Review"
    elif report.status == "Under Review":
        report.status = "Assigned"
    elif report.status == "Assigned":
        report.status = "Action Initiated"
        
    # Award small verification points (+15 XP, +5 Eco Score)
    current_user.xp += 15
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
    current_user.eco_score = min(1000, current_user.eco_score + 5)
    
    db.commit()
    db.refresh(report)
    return {"message": f"Report verified successfully. Status is now '{report.status}'.", "status": report.status}

@router.post("/{report_id}/resolve")
def resolve_incident(
    report_id: int,
    resolve_in: schemas.IncidentResolve,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    report = db.query(models.IncidentReport).filter(models.IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=404,
            detail="Incident report not found."
        )
        
    report.status = "Resolved"
    if resolve_in.image_data:
        # Save proof image_url if provided
        report.image_url = resolve_in.image_data
        
    # Award resolved points (+100 XP, +40 Eco Score)
    current_user.xp += 100
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
    current_user.eco_score = min(1000, current_user.eco_score + 40)
    
    db.commit()
    db.refresh(report)
    return {"message": "Incident report successfully resolved! Rewarded +100 XP and +40 Eco Points.", "status": report.status}

@router.post("/{report_id}/escalate")
def escalate_incident(
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
        
    if report.status == "Resolved":
        return {"message": "Incident already resolved.", "status": report.status}
        
    if report.status == "Submitted":
        report.status = "Assigned"
        
    authority_email = next((auth["contact"] for auth in [
        {"name": "Pollution Control Board", "contact": "info@pcb.gov.in"},
        {"name": "Municipal Corporation", "contact": "complaints@municipal.org"},
        {"name": "Water Supply & Sewerage Board", "contact": "helpdesk@forest.gov.in"},
        {"name": "Environmental Emergency Helpline", "contact": "1800-456-9000"}
    ] if auth["name"] == report.authority), "complaints@municipal.org")
    
    current_user.xp += 10
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
    current_user.eco_score = min(1000, current_user.eco_score + 5)
    
    db.commit()
    db.refresh(report)
    return {
        "message": f"Report officially escalated to {report.authority} ({authority_email}). Rewarded +10 XP and +5 Eco Points.",
        "status": report.status
    }

