from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class LatestScanResponse(BaseModel):
    """
    Response schema for latest scan job summary.
    """
    jobId: UUID = Field(..., alias="id", serialization_alias="jobId")
    accountId: UUID = Field(..., alias="cloud_account_id", serialization_alias="accountId")
    status: str = Field(...)
    progress: int = Field(...)
    currentStep: str = Field(..., alias="current_step", serialization_alias="currentStep")
    resourcesDiscovered: int = Field(default=0, serialization_alias="resourcesDiscovered")
    errorMessage: str | None = Field(None, alias="error_message", serialization_alias="errorMessage")
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")
    completedAt: datetime | None = Field(None, alias="completed_at", serialization_alias="completedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

class DashboardSummaryResponse(BaseModel):
    """
    Response schema for aggregated main dashboard view.
    """
    accountId: UUID = Field(..., serialization_alias="accountId")
    accountName: str = Field(..., serialization_alias="accountName")
    accountType: str = Field(..., serialization_alias="accountType")
    healthScore: int | None = Field(None, serialization_alias="healthScore")
    totalResources: int = Field(..., serialization_alias="totalResources")
    resourcesByType: dict[str, int] = Field(..., serialization_alias="resourcesByType")
    totalCost: float = Field(..., serialization_alias="totalCost")
    monthlyCost: float = Field(..., serialization_alias="monthlyCost")
    securityFindings: dict[str, int] = Field(..., serialization_alias="securityFindings")
    recommendationsCount: int = Field(..., serialization_alias="recommendationsCount")
    totalEstimatedSavings: float = Field(..., serialization_alias="totalEstimatedSavings")
    latestScan: LatestScanResponse | None = Field(None, serialization_alias="latestScan")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class ResourceSummaryResponse(BaseModel):
    """
    Response schema for cloud resources aggregation breakdown.
    """
    totalResources: int = Field(..., serialization_alias="totalResources")
    byType: dict[str, int] = Field(..., serialization_alias="byType")
    byRegion: dict[str, int] = Field(..., serialization_alias="byRegion")
    byStatus: dict[str, int] = Field(..., serialization_alias="byStatus")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class CostByServiceItem(BaseModel):
    """
    Cost breakdown item by cloud service.
    """
    service: str
    cost: float

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class CostSummaryResponse(BaseModel):
    """
    Response schema for cost analytics summary.
    """
    totalCost: float = Field(..., serialization_alias="totalCost")
    latestMonthCost: float = Field(..., serialization_alias="latestMonthCost")
    previousMonthCost: float | None = Field(None, serialization_alias="previousMonthCost")
    difference: float | None = Field(None, serialization_alias="difference")
    percentageChange: float | None = Field(None, serialization_alias="percentageChange")
    costByService: list[CostByServiceItem] = Field(..., serialization_alias="costByService")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class CostTrendItem(BaseModel):
    """
    Single monthly cost trend item.
    """
    period: str
    cost: float

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class CostTrendResponse(BaseModel):
    """
    Response schema for chronological cost trend line/bar charts.
    """
    trend: list[CostTrendItem] = Field(..., serialization_alias="trend")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class CostByServiceResponse(BaseModel):
    """
    Response schema for cost aggregation by service.
    """
    services: list[CostByServiceItem] = Field(..., serialization_alias="services")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class SecuritySummaryResponse(BaseModel):
    """
    Response schema for security audit findings summary.
    """
    totalFindings: int = Field(..., serialization_alias="totalFindings")
    bySeverity: dict[str, int] = Field(..., serialization_alias="bySeverity")
    byStatus: dict[str, int] = Field(..., serialization_alias="byStatus")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class RecommendationItem(BaseModel):
    """
    Recommendation item schema.
    """
    id: str
    title: str
    resource: str
    priority: str
    description: str
    estimatedSavings: float = Field(..., serialization_alias="estimatedSavings")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class RecommendationSummaryResponse(BaseModel):
    """
    Response schema for cost optimization recommendations summary.
    """
    totalRecommendations: int = Field(..., serialization_alias="totalRecommendations")
    totalEstimatedSavings: float = Field(..., serialization_alias="totalEstimatedSavings")
    byPriority: dict[str, int] = Field(..., serialization_alias="byPriority")
    recommendations: list[RecommendationItem] = Field(..., serialization_alias="recommendations")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
