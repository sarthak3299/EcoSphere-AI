import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    eco_score: Optional[int] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    profile_image: Optional[str] = None

class UserResponse(UserBase):
    id: int
    eco_score: int
    level: int
    xp: int
    profile_image: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Carbon Record Schemas
class CarbonRecordBase(BaseModel):
    category: str  # Transport, Electricity, Food, Shopping, Waste, Water
    details: Optional[Dict[str, Any]] = None
    footprint: float  # CO2e in kg

class CarbonRecordCreate(BaseModel):
    category: str
    details: Dict[str, Any]

class CarbonRecordResponse(CarbonRecordBase):
    id: int
    user_id: int
    date: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class CarbonDashboardResponse(BaseModel):
    total_footprint: float
    daily_average: float
    category_breakdowns: Dict[str, float]
    category_percentages: Dict[str, float]
    monthly_trend: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

# Incident Report Schemas
class IncidentReportBase(BaseModel):
    location_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: str  # Garbage Dumping, Air Pollution, Water Pollution, Plastic Waste, Other
    description: Optional[str] = None
    severity: str = "Medium"

class IncidentReportCreate(IncidentReportBase):
    image_data: Optional[str] = Field(None, max_length=10485760) # 10MB max length

class IncidentReportResponse(IncidentReportBase):
    id: int
    user_id: int
    image_url: Optional[str] = None
    status: str
    authority: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Challenge Schemas
class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: str
    points: int
    duration_days: int
    difficulty: str

    model_config = ConfigDict(from_attributes=True)

class UserChallengeResponse(BaseModel):
    id: int
    challenge: ChallengeResponse
    progress: int
    status: str
    joined_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    organizer: str
    date: datetime.datetime
    location_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None

class EventResponse(EventBase):
    id: int
    created_at: datetime.datetime
    joined: Optional[bool] = False
    participant_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# Chatbot & Recommendation Schemas
class ChatMessage(BaseModel):
    sender: str  # "user" or "bot"
    text: str

class ChatHistoryInput(BaseModel):
    history: List[ChatMessage]
    message: str

class ChatResponse(BaseModel):
    response: str

class RecommendationResponse(BaseModel):
    id: str
    title: str
    description: str
    savings: float  # Estimated CO2e savings in kg
    difficulty: str  # Easy, Medium, Hard
    category: str

# Incident Verification & Resolution Schemas
class IncidentResolve(BaseModel):
    image_data: Optional[str] = Field(None, max_length=10485760) # 10MB max length

