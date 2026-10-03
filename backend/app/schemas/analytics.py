from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class HealthScoreFactors(BaseModel):
    """
    Contributing factors breakdown for Cloud Health Score.
    """
    criticalFindings: int = Field(..., serialization_alias="criticalFindings")
    highFindings: int = Field(..., serialization_alias="highFindings")
    mediumFindings: int = Field(..., serialization_alias="mediumFindings")
    cloudWasteRatio: float = Field(..., serialization_alias="cloudWasteRatio")
    wasteRatioAvailable: bool = Field(..., serialization_alias="wasteRatioAvailable")
    underutilizedResources: int = Field(..., serialization_alias="underutilizedResources")
    totalResources: int = Field(..., serialization_alias="totalResources")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class HealthScoreResponse(BaseModel):
    """
    Response schema for Cloud Health Score analysis.
    """
    accountId: UUID = Field(..., serialization_alias="accountId")
    healthScore: int = Field(..., serialization_alias="healthScore", description="Calculated health score (0-100)")
    factors: HealthScoreFactors = Field(..., serialization_alias="factors")
    updatedAt: datetime = Field(..., serialization_alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class HistoricalCostPoint(BaseModel):
    """
    Historical monthly cost observation point.
    """
    period: str
    cost: float

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class ForecastPoint(BaseModel):
    """
    ML predicted future monthly cost point.
    """
    period: str
    predictedCost: float = Field(..., serialization_alias="predictedCost")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class CostForecastResponse(BaseModel):
    """
    Response schema for Scikit-learn Machine Learning Cost Forecast.
    """
    accountId: UUID = Field(..., serialization_alias="accountId")
    model: str = Field(default="LinearRegression")
    sufficientData: bool = Field(..., serialization_alias="sufficientData")
    historicalMonthsCount: int = Field(..., serialization_alias="historicalMonthsCount")
    forecastMonthsCount: int = Field(..., serialization_alias="forecastMonthsCount")
    r2Score: float | None = Field(None, serialization_alias="r2Score", description="Baseline training R^2 metric")
    historical: list[HistoricalCostPoint] = Field(default_factory=list)
    forecast: list[ForecastPoint] = Field(default_factory=list)
    message: str | None = Field(None)

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
