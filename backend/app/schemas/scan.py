from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class ScanStartRequest(BaseModel):
    """
    Request payload schema for starting a cloud resource discovery scan.
    """
    accountId: UUID = Field(..., alias="account_id", serialization_alias="accountId", description="UUID of cloud account to scan")

    model_config = ConfigDict(
        populate_by_name=True
    )

class ScanStartResponse(BaseModel):
    """
    Response payload returned immediately after queuing a scan job.
    """
    jobId: UUID = Field(..., alias="id", serialization_alias="jobId")
    accountId: UUID = Field(..., alias="cloud_account_id", serialization_alias="accountId")
    status: str = Field(default="pending")
    progress: int = Field(default=0)
    currentStep: str = Field(default="Scan queued", alias="current_step", serialization_alias="currentStep")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

class ScanStatusResponse(BaseModel):
    """
    Response payload returned when polling scan status.
    """
    jobId: UUID = Field(..., alias="id", serialization_alias="jobId")
    accountId: UUID = Field(..., alias="cloud_account_id", serialization_alias="accountId")
    status: str = Field(...)  # 'pending', 'running', 'completed', 'failed'
    progress: int = Field(...)  # 0 to 100
    currentStep: str = Field(..., alias="current_step", serialization_alias="currentStep")
    resourcesDiscovered: int = Field(default=0, serialization_alias="resourcesDiscovered")
    errorMessage: str | None = Field(None, alias="error_message", serialization_alias="errorMessage")
    completedAt: datetime | None = Field(None, alias="completed_at", serialization_alias="completedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
