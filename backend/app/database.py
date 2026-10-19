from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Create SQLAlchemy Database Engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Automatically tests connection health before executing queries
)

# Session factory for Database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy ORM models
Base = declarative_base()

def check_db_connection() -> tuple[bool, str]:
    """
    Tests the PostgreSQL database connection by executing a simple 'SELECT 1' query.
    Returns a tuple: (is_connected: bool, status_message: str).
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "connected"
    except Exception as e:
        return False, f"disconnected: {str(e)}"
