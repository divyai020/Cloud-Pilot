from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Normalize Database URL for SQLAlchemy 2.0 and Render compatibility
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Create SQLAlchemy Database Engine with connect timeout to prevent hangs
engine = create_engine(
    db_url,
    pool_pre_ping=True,  # Automatically tests connection health before executing queries
    connect_args={"connect_timeout": 5},
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
