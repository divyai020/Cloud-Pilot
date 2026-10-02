from datetime import datetime
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
