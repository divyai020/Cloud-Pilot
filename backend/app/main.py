from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import check_db_connection
from app.routers import (
    auth_router,
    users_router,
    cloud_router,
    scan_router,
    dashboard_router,
    reports_router,
    analytics_router,
    assistant_router,
    simulator_router
)

from app.database import check_db_connection, engine, Base
import app.models  # Load all models for metadata creation

# Initialize FastAPI Application
app = FastAPI(
    title="Cloud Pilot API",
    description="Backend API for Cloud Pilot - AI-Powered Cloud Governance Platform",
    version="0.1.0",
    debug=settings.DEBUG,
)

# Configure CORS Middleware for React Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(cloud_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(assistant_router, prefix="/api/v1")
app.include_router(simulator_router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    """Ensure database tables exist on application startup."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass

@app.get("/")
def read_root():
    """
    Root Endpoint / Health Check
    Verifies that the FastAPI application is running and tests real connectivity to PostgreSQL.
    """
    is_connected, db_status = check_db_connection()
    return {
        "message": "Cloud Pilot API is running",
        "database": db_status
    }
