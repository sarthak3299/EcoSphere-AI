import datetime
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.config.config import settings
from app.database import db
from app.models import models
from app.services import auth_service
from app.api import auth, carbon, incident, gamification, events, ai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Create database tables
try:
    logger.info("Initializing database schemas...")
    models.Base.metadata.create_all(bind=db.engine)
    logger.info("Database schemas initialized.")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

# Seeding script
def seed_database():
    session = db.SessionLocal()
    try:
        # Check if seed user exists
        seed_email = "ananya@ecosphere.ai"
        user = session.query(models.User).filter(models.User.email == seed_email).first()
        
        if not user:
            logger.info("Seeding default database data...")
            # Create user Ananya Sharma
            seed_user = models.User(
                name="Ananya Sharma",
                email=seed_email,
                hashed_password=auth_service.get_password_hash("password"),
                eco_score=748,
                level=2,
                xp=240,
                profile_image=None
            )
            session.add(seed_user)
            session.commit()
            session.refresh(seed_user)
            
            # Create default challenges
            challenges = [
                models.Challenge(
                    title="No Vehicle Day",
                    description="Go car-free for a day. Walk, cycle, or use public transport to commute.",
                    category="Transport",
                    points=200,
                    duration_days=1,
                    difficulty="Easy"
                ),
                models.Challenge(
                    title="Plastic Free Week",
                    description="Avoid using single-use plastics like bags, water bottles, and wrappers for an entire week.",
                    category="Waste",
                    points=250,
                    duration_days=7,
                    difficulty="Medium"
                ),
                models.Challenge(
                    title="Save Electricity Challenge",
                    description="Reduce your electricity consumption by turning off appliances at the wall and using natural light.",
                    category="Electricity",
                    points=300,
                    duration_days=5,
                    difficulty="Medium"
                ),
                models.Challenge(
                    title="Cycling Challenge",
                    description="Cycle for at least 10km to complete this challenge.",
                    category="Transport",
                    points=150,
                    duration_days=3,
                    difficulty="Easy"
                )
            ]
            session.add_all(challenges)
            session.commit()
            
            # Create default events
            events = [
                models.Event(
                    title="Beach Cleanup Drive",
                    description="Join us for a volunteer cleanup campaign at Juhu Beach to clear plastic waste and marine debris.",
                    organizer="Clean Seas NGO",
                    date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
                    location_text="Juhu Beach, Mumbai",
                    latitude=19.0988,
                    longitude=72.8264,
                    image_url=""
                ),
                models.Event(
                    title="Tree Plantation Drive",
                    description="Help us expand Bengaluru's green canopy! Bring your friends and plant saplings.",
                    organizer="Green Canopy NGO",
                    date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=14),
                    location_text="Cubbon Park, Bengaluru",
                    latitude=12.9784,
                    longitude=77.5971,
                    image_url=""
                ),
                models.Event(
                    title="E-Waste Collection",
                    description="Bring your old phones, chargers, laptops, and batteries for safe recycling and disposal.",
                    organizer="EcoCycle Inc.",
                    date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=21),
                    location_text="Electronic City, Bengaluru",
                    latitude=12.8398,
                    longitude=77.6770,
                    image_url=""
                ),
                models.Event(
                    title="River Cleanup Campaign",
                    description="Help clear floating garbage and restore the banks of Ulsoor Lake.",
                    organizer="Blue Planet",
                    date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=28),
                    location_text="Ulsoor Lake, Bengaluru",
                    latitude=12.9813,
                    longitude=77.6245,
                    image_url=""
                )
            ]
            session.add_all(events)
            session.commit()

            # Automatically join the seed user to a challenge and event to match mockup
            c1 = session.query(models.Challenge).filter(models.Challenge.title == "No Vehicle Day").first()
            if c1:
                session.add(models.UserChallenge(
                    user_id=seed_user.id,
                    challenge_id=c1.id,
                    progress=70,  # 70% progress as shown in the challenges list mockup
                    status="Active"
                ))
            c2 = session.query(models.Challenge).filter(models.Challenge.title == "Plastic Free Week").first()
            if c2:
                session.add(models.UserChallenge(
                    user_id=seed_user.id,
                    challenge_id=c2.id,
                    progress=40,
                    status="Active"
                ))
            c3 = session.query(models.Challenge).filter(models.Challenge.title == "Save Electricity Challenge").first()
            if c3:
                session.add(models.UserChallenge(
                    user_id=seed_user.id,
                    challenge_id=c3.id,
                    progress=95,
                    status="Active"
                ))
            c4 = session.query(models.Challenge).filter(models.Challenge.title == "Cycling Challenge").first()
            if c4:
                session.add(models.UserChallenge(
                    user_id=seed_user.id,
                    challenge_id=c4.id,
                    progress=20,
                    status="Active"
                ))

            ev1 = session.query(models.Event).filter(models.Event.title == "Beach Cleanup Drive").first()
            if ev1:
                session.add(models.UserEvent(
                    user_id=seed_user.id,
                    event_id=ev1.id
                ))
                
            session.commit()
            logger.info("Default seed database completed successfully.")
            
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        session.rollback()
    finally:
        session.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seeding database on startup
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

import time
from collections import defaultdict
from fastapi import Response

# Custom in-memory sliding window Rate Limiting Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Allow requests to API documentation and root
        if path.startswith("/docs") or path.startswith("/redoc") or path == "/openapi.json" or path == "/":
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Test helper: check for test-friendly rate limit configuration
        is_test_limiter = request.headers.get("X-Test-Rate-Limit") == "True"
        current_limit = self.limit
        
        if is_test_limiter:
            current_limit = 5  # Low limit for testing 429 response
        elif client_ip == "testclient":
            # Bypass rate limit for standard test runs to avoid test pollution
            return await call_next(request)
            
        # Clean older requests from sliding window
        self.requests[client_ip] = [t for t in self.requests[client_ip] if current_time - t < self.window]
        
        if len(self.requests[client_ip]) >= current_limit:
            return Response(
                content='{"detail": "Rate limit exceeded. Please try again later."}',
                status_code=429,
                media_type="application/json"
            )
            
        self.requests[client_ip].append(current_time)
        return await call_next(request)

app.add_middleware(RateLimitMiddleware)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(carbon.router, prefix=settings.API_V1_STR)
app.include_router(incident.router, prefix=settings.API_V1_STR)
app.include_router(gamification.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to EcoSphere AI - Intelligent Carbon Awareness Platform API"}
