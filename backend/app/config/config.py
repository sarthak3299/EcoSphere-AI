import os
import secrets
import logging
from pydantic_settings import BaseSettings

logger = logging.getLogger("config")

# Production env flag
ENV = os.getenv("ENV", "development").lower()
is_production = ENV == "production"

# Generate secure key if not supplied in environment
secret_key_env = os.getenv("SECRET_KEY")
if not secret_key_env:
    secret_key_env = secrets.token_hex(32)
    logger.warning("SECRET_KEY not set in environment. Generated a secure random key dynamically.")

class Settings(BaseSettings):
    PROJECT_NAME: str = "EcoSphere AI API"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = secret_key_env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Databases
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ecosphere")
    SQLITE_FALLBACK_URL: str = "sqlite:///./ecosphere.db"
    
    # AI Config
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
