import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

engine = None
SessionLocal = None
Base = declarative_base()

try:
    logger.info(f"Attempting connection to PostgreSQL at {settings.DATABASE_URL.split('@')[-1]}...")
    # Add a short timeout to fail fast if PG is not reachable
    engine = create_engine(
        settings.DATABASE_URL, 
        connect_args={"connect_timeout": 3} if "postgresql" in settings.DATABASE_URL else {}
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database.")
except Exception as e:
    logger.warning(f"PostgreSQL connection failed: {e}. Falling back to SQLite database at {settings.SQLITE_FALLBACK_URL}...")
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False}  # Needed for SQLite
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
