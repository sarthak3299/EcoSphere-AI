import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    eco_score = Column(Integer, default=748)  # Set seed score matching the mockup
    level = Column(Integer, default=1)
    xp = Column(Integer, default=150)
    profile_image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    carbon_records = relationship("CarbonRecord", back_populates="user", cascade="all, delete-orphan")
    incidents = relationship("IncidentReport", back_populates="user", cascade="all, delete-orphan")
    challenges = relationship("UserChallenge", back_populates="user", cascade="all, delete-orphan")
    events = relationship("UserEvent", back_populates="user", cascade="all, delete-orphan")


class CarbonRecord(Base):
    __tablename__ = "carbon_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False)  # Transport, Electricity, Food, Shopping, Waste, Water
    details = Column(JSON, nullable=True)  # Details like distance, fuel type, kwh, etc.
    footprint = Column(Float, nullable=False)  # CO2e in kg
    date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    user = relationship("User", back_populates="carbon_records")


class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(Text, nullable=True)  # Base64 encoded or path
    location_text = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    category = Column(String(50), nullable=False)  # Garbage Dumping, Air Pollution, Water Pollution, Plastic Waste, Other
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="Medium")  # Low, Medium, High
    status = Column(String(50), default="Submitted")  # Submitted, Under Review, Assigned, Action Initiated, Resolved
    authority = Column(String(100), default="Municipal Corporation")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    user = relationship("User", back_populates="incidents")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    points = Column(Integer, default=100)
    duration_days = Column(Integer, default=7)
    difficulty = Column(String(20), default="Medium")  # Easy, Medium, Hard

    users = relationship("UserChallenge", back_populates="challenge", cascade="all, delete-orphan")


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    progress = Column(Integer, default=0)  # 0 to 100 %
    status = Column(String(50), default="Active")  # Active, Completed
    joined_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="challenges")
    challenge = relationship("Challenge", back_populates="users")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    organizer = Column(String(100), nullable=False)
    date = Column(DateTime, nullable=False)
    location_text = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    users = relationship("UserEvent", back_populates="event", cascade="all, delete-orphan")


class UserEvent(Base):
    __tablename__ = "user_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    user = relationship("User", back_populates="events")
    event = relationship("Event", back_populates="users")
