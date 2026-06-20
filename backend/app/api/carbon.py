import datetime
import calendar
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models import models
from app.schemas import schemas
from app.services import auth_service
from app.ai.ai_service import AIService

router = APIRouter(prefix="/carbon", tags=["Carbon Engine"])

# Carbon Conversion Factors (kg CO2e per unit)
FACTORS = {
    "Transport": {
        "car_petrol": 0.18,
        "car_diesel": 0.19,
        "car_ev": 0.05,
        "motorcycle": 0.12,
        "bus": 0.08,
        "metro": 0.03,
        "bicycle": 0.0,
        "walking": 0.0
    },
    "Electricity": {
        "grid": 0.85,
        "solar": 0.05,
        "wind": 0.02
    },
    "Food": {
        "heavy_meat": 3.3,
        "average_meat": 2.2,
        "vegetarian": 1.2,
        "vegan": 0.6
    },
    "Shopping": {
        "clothing": 15.0,
        "electronics": 80.0,
        "general": 2.5
    },
    "Waste": {
        "unsorted": 1.5,
        "recyclable": 0.2,
        "compost": 0.1
    },
    "Water": {
        "standard": 0.001  # kg per Liter
    }
}

def calculate_footprint(category: str, details: dict) -> float:
    """Helper to calculate footprint based on input values."""
    if category == "Transport":
        mode = details.get("mode", "car_petrol")
        distance = float(details.get("distance", 0))
        factor = FACTORS["Transport"].get(mode, 0.18)
        return distance * factor
    elif category == "Electricity":
        source = details.get("source", "grid")
        kwh = float(details.get("kwh", 0))
        factor = FACTORS["Electricity"].get(source, 0.85)
        return kwh * factor
    elif category == "Food":
        diet = details.get("diet", "average_meat")
        days = float(details.get("days", 1))
        factor = FACTORS["Food"].get(diet, 2.2)
        return days * factor
    elif category == "Shopping":
        shop_type = details.get("type", "general")
        items = float(details.get("items", 1))
        factor = FACTORS["Shopping"].get(shop_type, 2.5)
        return items * factor
    elif category == "Waste":
        waste_type = details.get("type", "unsorted")
        weight = float(details.get("weight", 0))
        factor = FACTORS["Waste"].get(waste_type, 1.5)
        return weight * factor
    elif category == "Water":
        liters = float(details.get("liters", 0))
        factor = FACTORS["Water"].get("standard", 0.001)
        return liters * factor
    return 0.0

@router.post("/calculate", response_model=schemas.CarbonRecordResponse)
def calculate_and_log(
    record_in: schemas.CarbonRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    footprint = calculate_footprint(record_in.category, record_in.details)
    
    new_record = models.CarbonRecord(
        user_id=current_user.id,
        category=record_in.category,
        details=record_in.details,
        footprint=footprint,
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    
    # Reward user with XP and modify Eco Score (lower footprint -> better score)
    # Add 10 XP for logging
    current_user.xp += 10
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
        
    # Standard baseline: average person produces ~500kg/month. 
    # If they log low-carbon actions, let's bump their score
    if footprint < 10:  # low carbon
        current_user.eco_score = min(1000, current_user.eco_score + 5)
    else:
        current_user.eco_score = max(100, current_user.eco_score - 2)

    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/history", response_model=list[schemas.CarbonRecordResponse])
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    return db.query(models.CarbonRecord).filter(
        models.CarbonRecord.user_id == current_user.id
    ).order_by(models.CarbonRecord.date.desc()).all()

@router.get("/dashboard", response_model=schemas.CarbonDashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    records = db.query(models.CarbonRecord).filter(
        models.CarbonRecord.user_id == current_user.id
    ).all()
    
    # Group by categories
    total_footprint = 0.0
    category_breakdowns = {
        "Transport": 0.0,
        "Electricity": 0.0,
        "Food": 0.0,
        "Shopping": 0.0,
        "Waste": 0.0,
        "Water": 0.0
    }
    
    # Calculate totals
    now = datetime.datetime.now(datetime.timezone.utc)
    current_month_records = [r for r in records if r.date.year == now.year and r.date.month == now.month]
    
    for r in current_month_records:
        category_breakdowns[r.category] = category_breakdowns.get(r.category, 0.0) + r.footprint
        total_footprint += r.footprint

    # If no data this month, supply mock dashboard seed matching dashboard_page mockup
    if not current_month_records:
        total_footprint = 520.0
        category_breakdowns = {
            "Transport": 218.0,
            "Electricity": 146.0,
            "Food": 104.0,
            "Shopping": 52.0,
            "Waste": 0.0,
            "Water": 0.0
        }

    # Percentages
    category_percentages = {}
    for cat, val in category_breakdowns.items():
        category_percentages[cat] = round((val / total_footprint * 100), 1) if total_footprint > 0 else 0.0

    # Trend calculation (6 months trend)
    monthly_trend = []
    for i in range(5, -1, -1):
        target_date = now - datetime.timedelta(days=i*30)
        month_name = calendar.month_abbr[target_date.month]
        # Sum records for this month
        month_sum = sum(
            r.footprint for r in records 
            if r.date.year == target_date.year and r.date.month == target_date.month
        )
        # Mock trend fallback if empty
        if month_sum == 0:
            mock_vals = [320, 420, 380, 485, 395, 520]
            month_sum = mock_vals[5 - i]
            
        monthly_trend.append({"name": month_name, "value": month_sum})

    # Daily average
    days_in_month = now.day
    daily_avg = total_footprint / days_in_month if days_in_month > 0 else 0.0

    # Recent activity log
    recent_activity = []
    # Fetch recent logged records
    logged_records = db.query(models.CarbonRecord).filter(
        models.CarbonRecord.user_id == current_user.id
    ).order_by(models.CarbonRecord.date.desc()).limit(3).all()

    for r in logged_records:
        recent_activity.append({
            "type": "log",
            "message": f"You logged a new {r.category} entry",
            "time": r.date.strftime("%Y-%m-%dT%H:%M:%SZ")
        })

    # Default activities seed if empty
    if not recent_activity:
        recent_activity = [
            {"type": "log", "message": "You logged a new entry", "time": (now - datetime.timedelta(hours=2)).isoformat() + "Z"},
            {"type": "challenge", "message": "You earned 50 points in 'No Vehicle Day' challenge", "time": (now - datetime.timedelta(days=1)).isoformat() + "Z"},
            {"type": "report", "message": "Your report has been submitted successfully", "time": (now - datetime.timedelta(days=2)).isoformat() + "Z"},
            {"type": "event", "message": "You joined 'Beach Cleanup Drive' event", "time": (now - datetime.timedelta(days=3)).isoformat() + "Z"}
        ]

    return {
        "total_footprint": round(total_footprint, 1),
        "daily_average": round(daily_avg, 1),
        "category_breakdowns": category_breakdowns,
        "category_percentages": category_percentages,
        "monthly_trend": monthly_trend,
        "recent_activity": recent_activity
    }

@router.post("/upload-bill")
async def upload_bill(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    contents = await file.read()
    filename = file.filename
    
    # Analyze bill via Gemini
    try:
        analysis = AIService.analyze_utility_bill(contents, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze receipt: {str(e)}"
        )

    # Save to CarbonRecords
    category = analysis.get("utility_type", "Shopping")
    footprint = analysis.get("estimated_carbon_footprint", 0.0)
    details = {
        "extracted_value": analysis.get("consumption_value"),
        "units": analysis.get("units"),
        "cost": analysis.get("cost"),
        "source": "receipt_ocr",
        "insights": analysis.get("insights")
    }

    new_record = models.CarbonRecord(
        user_id=current_user.id,
        category=category,
        details=details,
        footprint=footprint,
        date=datetime.datetime.now(datetime.timezone.utc)
    )

    current_user.xp += 25  # OCR rewards extra XP!
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1

    current_user.eco_score = min(1000, current_user.eco_score + 10)

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {
        "analysis": analysis,
        "record_id": new_record.id,
        "footprint": footprint
    }
