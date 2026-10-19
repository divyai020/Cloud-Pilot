from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class RecommendationResponse(BaseModel):
    """
    Response schema for AI/Rule-based optimization recommendations.
    """
    recommendationId: str = Field(..., alias="recommendation_id", serialization_alias="recommendationId")
    title: str = Field(...)
    description: str = Field(...)
    priority: str = Field(...)  # 'High', 'Medium', 'Low', 'Critical'
    estimatedSavings: float = Field(..., alias="estimated_savings", serialization_alias="estimatedSavings")
    category: str = Field(default="Cost")  # 'Cost', 'Security', 'Performance', 'Governance'
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

class PDFReportResponse(BaseModel):
    """
    Metadata schema for PDF Report generation response.
    """
    filename: str
    contentType: str = "application/pdf"
    sizeBytes: int

    model_config = ConfigDict(
        populate_by_name=True
    )

class CSVReportResponse(BaseModel):
    """
    Metadata schema for CSV Export response.
    """
    filename: str
    contentType: str = "text/csv"
    rowCount: int

    model_config = ConfigDict(
        populate_by_name=True
    )

class RoadmapPhaseResponse(BaseModel):
    """
    Schema representing a single implementation phase in the optimization roadmap.
    """
    phaseName: str = Field(..., alias="phase_name", serialization_alias="phaseName")
    timeframe: str = Field(...)
    actionCount: int = Field(..., alias="action_count", serialization_alias="actionCount")
    potentialSavings: float = Field(..., alias="potential_savings", serialization_alias="potentialSavings")
    recommendations: List[RecommendationResponse] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True
    )

class OptimizationRoadmapResponse(BaseModel):
    """
    Schema for the phased Cloud Optimization Roadmap endpoint.
    """
    totalPotentialSavings: float = Field(..., alias="total_potential_savings", serialization_alias="totalPotentialSavings")
    totalActions: int = Field(..., alias="total_actions", serialization_alias="totalActions")
    phases: List[RoadmapPhaseResponse] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True
    )
