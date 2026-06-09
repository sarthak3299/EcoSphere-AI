from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models import models
from app.schemas import schemas
from app.services import auth_service
from app.ai.ai_service import AIService

router = APIRouter(tags=["AI Services"])

@router.post("/recommendation", response_model=list[schemas.RecommendationResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    # Prepare profile info
    profile = {
        "name": current_user.name,
        "eco_score": current_user.eco_score,
        "level": current_user.level,
        "xp": current_user.xp
    }
    
    # Prepare carbon records summary
    records = db.query(models.CarbonRecord).filter(
        models.CarbonRecord.user_id == current_user.id
    ).order_by(models.CarbonRecord.date.desc()).limit(10).all()
    
    history_summary = []
    for r in records:
        history_summary.append({
            "category": r.category,
            "footprint": r.footprint,
            "details": r.details
        })

    # Call Gemini to generate custom recommendations
    recommendations = AIService.generate_recommendations(profile, history_summary)
    return recommendations

@router.post("/chatbot", response_model=schemas.ChatResponse)
def chat_with_bot(
    chat_input: schemas.ChatHistoryInput,
    current_user: models.User = Depends(auth_service.get_current_user)
):
    # Convert input history to text array or simple objects if needed
    history_list = []
    for msg in chat_input.history:
        history_list.append({
            "role": "user" if msg.sender == "user" else "model",
            "parts": [msg.text]
        })
        
    response_text = AIService.chatbot_response(history_list, chat_input.message)
    return {"response": response_text}
