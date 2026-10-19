from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.schemas.analytics import HealthScoreResponse, CostForecastResponse
from app.services import health_service, forecast_service
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Cloud Health & Cost Forecasting"])

@router.get("/health", response_model=HealthScoreResponse)
def get_cloud_health_score(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cloud Health Score Endpoint:
    Calculates analytical health score (0-100) based on security findings and resource utilization waste ratio.
    Persists updated score to PostgreSQL.
    """
    health = health_service.calculate_cloud_health_score(db, user=current_user, account_id=account_id)
    return health

@router.get("/forecast", response_model=CostForecastResponse)
def get_cost_forecast(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cost Forecasting Endpoint:
    Uses Scikit-learn Machine Learning (LinearRegression) on historical monthly cost records
    to predict future 3-month spending trends.
    """
    forecast = forecast_service.generate_cost_forecast(db, user=current_user, account_id=account_id)
    return forecast
