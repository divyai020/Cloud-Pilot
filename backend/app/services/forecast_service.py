import logging
from uuid import UUID
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.cost_record import CostRecord
from app.services.dashboard_service import get_user_cloud_account

logger = logging.getLogger("cloudpilot.services.forecast_service")

def _add_months(sourcedate: date, months: int) -> date:
    """Helper to cleanly increment a date by a given number of months."""
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    return date(year, month, 1)

def generate_cost_forecast(db: Session, user: User, account_id: Optional[UUID] = None) -> Dict[str, Any]:
    """
    Cost Forecasting Machine Learning Engine:
    Uses Scikit-learn LinearRegression on historical CostRecord data to estimate future monthly spend.
    
    Workflow:
    1. Verifies cloud account ownership.
    2. Queries historical monthly cost records grouped chronologically.
    3. Validates historical data sufficiency (minimum 3 observations required).
    4. Trains Scikit-learn LinearRegression baseline model (X=month index, y=total cost).
    5. Computes baseline training R^2 metric.
    6. Predicts future 3 monthly cost points with non-negative clamping max(0.0, prediction).
    """
    account = get_user_cloud_account(db, user, account_id)

    # 1. Retrieve Historical Monthly Cost Data
    trend_rows = db.query(
        CostRecord.period_date, func.sum(CostRecord.amount)
    ).filter(
        CostRecord.cloud_account_id == account.id
    ).group_by(CostRecord.period_date).order_by(CostRecord.period_date.asc()).all()

    historical_points = [
        {
            "period": p_date.strftime("%Y-%m"),
            "cost": round(float(total_amt), 2),
            "raw_date": p_date
        }
        for p_date, total_amt in trend_rows
    ]

    historical_count = len(historical_points)

    # 2. Check Data Sufficiency (Minimum 3 monthly observations required)
    if historical_count < 3:
        return {
            "accountId": account.id,
            "model": "LinearRegression",
            "sufficientData": False,
            "historicalMonthsCount": historical_count,
            "forecastMonthsCount": 0,
            "r2Score": None,
            "historical": [{"period": p["period"], "cost": p["cost"]} for p in historical_points],
            "forecast": [],
            "message": "Insufficient historical data for forecasting (minimum 3 historical monthly observations required)."
        }

    # 3. Prepare Training Dataset
    X = np.array([[i] for i in range(historical_count)])
    y = np.array([p["cost"] for p in historical_points])

    # 4. Train Scikit-learn LinearRegression Model
    model = LinearRegression()
    model.fit(X, y)

    # Calculate baseline R^2 score
    y_pred_train = model.predict(X)
    r2_val = float(r2_score(y, y_pred_train))
    r2_clamped = round(max(-1.0, min(1.0, r2_val)), 4)

    # 5. Generate Future Predictions (Forecast Horizon: Next 3 Months)
    forecast_horizon = 3
    future_X = np.array([[historical_count + i] for i in range(forecast_horizon)])
    future_predictions = model.predict(future_X)

    last_date = historical_points[-1]["raw_date"]
    forecast_points = []

    for i, pred_val in enumerate(future_predictions):
        future_date = _add_months(last_date, i + 1)
        clamped_pred = max(0.0, round(float(pred_val), 2))
        forecast_points.append({
            "period": future_date.strftime("%Y-%m"),
            "predictedCost": clamped_pred
        })

    return {
        "accountId": account.id,
        "model": "LinearRegression",
        "sufficientData": True,
        "historicalMonthsCount": historical_count,
        "forecastMonthsCount": forecast_horizon,
        "r2Score": r2_clamped,
        "historical": [{"period": p["period"], "cost": p["cost"]} for p in historical_points],
        "forecast": forecast_points,
        "message": f"Successfully generated 3-month spending forecast using baseline LinearRegression model (R^2 = {r2_clamped})."
    }
