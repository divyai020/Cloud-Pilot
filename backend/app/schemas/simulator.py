from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

class CostSimulationRequest(BaseModel):
    """
    Request payload schema for simulating resource cost modifications.
    Allows specifying target monthly cost ($), target instance type, or cost reduction percentage (%).
    """
    accountId: Optional[UUID] = Field(None, alias="account_id", serialization_alias="accountId", description="Target cloud account UUID")
    resourceId: str = Field(..., alias="resource_id", serialization_alias="resourceId", description="Target resource primary key identifier e.g. 'i-001'")
    targetMonthlyCost: Optional[float] = Field(None, alias="target_monthly_cost", serialization_alias="targetMonthlyCost", description="Optional target simulated monthly cost in USD ($)")
    targetInstanceType: Optional[str] = Field(None, alias="target_instance_type", serialization_alias="targetInstanceType", description="Optional target EC2 or RDS instance type e.g. 't3.medium'")
    reductionPercentage: Optional[float] = Field(None, alias="reduction_percentage", serialization_alias="reductionPercentage", description="Optional cost reduction percentage e.g. 20.0 for 20% discount")

    model_config = ConfigDict(
        populate_by_name=True
    )

    @field_validator("targetMonthlyCost")
    @classmethod
    def validate_target_monthly_cost(cls, v):
        if v is not None and v < 0.0:
            raise ValueError("Target monthly cost cannot be negative.")
        return v

    @field_validator("reductionPercentage")
    @classmethod
    def validate_reduction_percentage(cls, v):
        if v is not None and (v < 0.0 or v > 100.0):
            raise ValueError("Reduction percentage must be between 0.0 and 100.0.")
        return v


class CostSimulationResponse(BaseModel):
    """
    Response schema representing computational cost simulation results.
    """
    resourceId: str = Field(..., alias="resource_id", serialization_alias="resourceId", description="Resource identifier")
    resourceName: str = Field(..., alias="resource_name", serialization_alias="resourceName", description="Resource display name")
    resourceType: str = Field(..., alias="resource_type", serialization_alias="resourceType", description="Cloud resource type (EC2, RDS, etc.)")
    currentInstanceType: Optional[str] = Field(None, alias="current_instance_type", serialization_alias="currentInstanceType", description="Current resource instance type")
    targetInstanceType: Optional[str] = Field(None, alias="target_instance_type", serialization_alias="targetInstanceType", description="Simulated target instance type")
    currentMonthlyCost: float = Field(..., alias="current_monthly_cost", serialization_alias="currentMonthlyCost", description="Current stored monthly spend ($)")
    simulatedMonthlyCost: float = Field(..., alias="simulated_monthly_cost", serialization_alias="simulatedMonthlyCost", description="Simulated target monthly spend ($)")
    estimatedMonthlySavings: float = Field(..., alias="estimated_monthly_savings", serialization_alias="estimatedMonthlySavings", description="Estimated monthly savings ($; negative indicates cost increase)")
    savingsPercentage: float = Field(..., alias="savings_percentage", serialization_alias="savingsPercentage", description="Estimated monthly savings percentage (%; negative indicates cost increase)")
    isCostIncrease: bool = Field(..., alias="is_cost_increase", serialization_alias="isCostIncrease", description="True if simulation results in a net cost increase")
    isSimulation: bool = Field(True, alias="is_simulation", serialization_alias="isSimulation", description="Always True indicating a read-only computational simulation")
    message: str = Field(..., description="Human-readable simulation summary message")

    model_config = ConfigDict(
        populate_by_name=True
    )
