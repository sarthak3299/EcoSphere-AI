import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models import models
from app.schemas import schemas
from app.services import auth_service

router = APIRouter(prefix="/events", tags=["Community Events"])

@router.get("/all", response_model=list[schemas.EventResponse])
def get_all_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    events = db.query(models.Event).all()
    results = []
    
    for event in events:
        # Check if current user joined
        joined = db.query(models.UserEvent).filter(
            models.UserEvent.user_id == current_user.id,
            models.UserEvent.event_id == event.id
        ).first() is not None
        
        # Count total participants
        participant_count = db.query(models.UserEvent).filter(
            models.UserEvent.event_id == event.id
        ).count()

        results.append(
            schemas.EventResponse(
                id=event.id,
                title=event.title,
                description=event.description,
                organizer=event.organizer,
                date=event.date,
                location_text=event.location_text,
                latitude=event.latitude,
                longitude=event.longitude,
                image_url=event.image_url,
                created_at=event.created_at,
                joined=joined,
                participant_count=participant_count
            )
        )
    return results

@router.post("/create", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: schemas.EventBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    new_event = models.Event(
        title=event_in.title,
        description=event_in.description,
        organizer=event_in.organizer,
        date=event_in.date,
        location_text=event_in.location_text,
        latitude=event_in.latitude,
        longitude=event_in.longitude,
        image_url=event_in.image_url,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return schemas.EventResponse(
        id=new_event.id,
        title=new_event.title,
        description=new_event.description,
        organizer=new_event.organizer,
        date=new_event.date,
        location_text=new_event.location_text,
        latitude=new_event.latitude,
        longitude=new_event.longitude,
        image_url=new_event.image_url,
        created_at=new_event.created_at,
        joined=False,
        participant_count=0
    )

@router.post("/join/{event_id}")
def join_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found."
        )

    # Check if already joined
    existing = db.query(models.UserEvent).filter(
        models.UserEvent.user_id == current_user.id,
        models.UserEvent.event_id == event_id
    ).first()
    
    if existing:
        return {"message": "You are already registered for this event.", "joined": True}

    new_registration = models.UserEvent(
        user_id=current_user.id,
        event_id=event_id,
        joined_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_registration)
    
    # Award participation XP (+30 XP)
    current_user.xp += 30
    if current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
        
    db.commit()
    return {"message": "Successfully registered for the event!", "joined": True}
