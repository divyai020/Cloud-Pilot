from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class CloudConnectRequest(BaseModel):
    """
    Request payload schema for connecting a live AWS account.
    """
    accountName: str = Field(..., description="Display name for this cloud account (e.g. 'Production AWS')")
    roleArn: str = Field(..., description="AWS IAM Role ARN (e.g. 'arn:aws:iam::123456789012:role/CloudPilotRole')")
    region: str = Field(default="ap-south-1", description="Target AWS region")

    model_config = ConfigDict(populate_by_name=True)

class CloudAccountResponse(BaseModel):
    """
    Response schema representing connected cloud accounts.
    Never exposes temporary AWS secrets or database credentials.
    """
    accountId: UUID = Field(..., alias="id", serialization_alias="accountId")
    accountName: str = Field(..., alias="account_name", serialization_alias="accountName")
    accountType: str = Field(..., alias="account_type", serialization_alias="accountType")
    awsAccountId: str | None = Field(None, alias="aws_account_id", serialization_alias="awsAccountId")
    roleArn: str | None = Field(None, alias="role_arn", serialization_alias="roleArn")
    region: str = Field(default="ap-south-1")
    status: str = Field(default="active")
    healthScore: int | None = Field(None, alias="health_score", serialization_alias="healthScore")
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")
    updatedAt: datetime = Field(..., alias="updated_at", serialization_alias="updatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

class CloudDemoResponse(BaseModel):
    """
    Response schema returned after initializing a demo cloud environment.
    """
    accountId: UUID = Field(..., serialization_alias="accountId")
    accountName: str = Field(..., serialization_alias="accountName")
    accountType: str = Field(..., serialization_alias="accountType")
    mode: str = "demo"
    resourcesCreated: int = Field(..., serialization_alias="resourcesCreated")
    costRecordsCreated: int = Field(..., serialization_alias="costRecordsCreated")
    securityFindingsCreated: int = Field(..., serialization_alias="securityFindingsCreated")
    recommendationsCreated: int = Field(..., serialization_alias="recommendationsCreated")
    scanStatus: str = Field(..., serialization_alias="scanStatus")
    healthScore: int = Field(..., serialization_alias="healthScore")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
