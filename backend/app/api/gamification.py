import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models import models
from app.schemas import schemas
from app.services import auth_service

router = APIRouter(prefix="/gamification", tags=["Gamification"])

@router.get("/leaderboard", response_model=list[schemas.UserResponse])
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    # Retrieve users sorted by eco_score descending
    return db.query(models.User).order_by(models.User.eco_score.desc()).limit(10).all()

@router.get("/challenge/all", response_model=list[schemas.ChallengeResponse])
def get_challenges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    return db.query(models.Challenge).all()

@router.get("/challenge/active", response_model=list[schemas.UserChallengeResponse])
def get_active_user_challenges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    return db.query(models.UserChallenge).filter(
        models.UserChallenge.user_id == current_user.id
    ).all()

@router.post("/challenge/join/{challenge_id}", response_model=schemas.UserChallengeResponse)
def join_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    # Check if challenge exists
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found."
        )

    # Check if user already joined
    existing = db.query(models.UserChallenge).filter(
        models.UserChallenge.user_id == current_user.id,
        models.UserChallenge.challenge_id == challenge_id
    ).first()
    
    if existing:
        return existing

    new_user_challenge = models.UserChallenge(
        user_id=current_user.id,
        challenge_id=challenge_id,
        progress=0,
        status="Active",
        joined_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_user_challenge)
    db.commit()
    db.refresh(new_user_challenge)
    return new_user_challenge

@router.post("/challenge/update/{challenge_id}")
def update_challenge_progress(
    challenge_id: int,
    progress_delta: int,  # Amount to increase progress (e.g. +20%)
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_user)
):
    user_challenge = db.query(models.UserChallenge).filter(
        models.UserChallenge.user_id == current_user.id,
        models.UserChallenge.challenge_id == challenge_id
    ).first()

    if not user_challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not joined this challenge yet."
        )

    if user_challenge.status == "Completed":
        return {"message": "Challenge already completed!", "progress": 100}

    new_progress = min(100, user_challenge.progress + progress_delta)
    user_challenge.progress = new_progress

    if new_progress >= 100:
        user_challenge.status = "Completed"
        user_challenge.completed_at = datetime.datetime.now(datetime.timezone.utc)
        # Reward user with Eco points and XP
        challenge_points = user_challenge.challenge.points
        current_user.eco_score = min(1000, current_user.eco_score + challenge_points)
        current_user.xp += challenge_points * 2  # XP reward is double the points
        
        # Level up logic
        while current_user.xp >= current_user.level * 100:
            current_user.xp -= current_user.level * 100
            current_user.level += 1

        db.commit()
        return {
            "message": f"Congratulations! You completed the challenge: '{user_challenge.challenge.title}'!",
            "points_awarded": challenge_points,
            "progress": 100,
            "status": "Completed"
        }

    db.commit()
    return {"message": "Progress updated successfully", "progress": new_progress, "status": "Active"}
