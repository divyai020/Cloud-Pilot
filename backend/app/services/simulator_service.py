import logging
from uuid import UUID
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resource import Resource
from app.services.dashboard_service import get_user_cloud_account

logger = logging.getLogger("cloudpilot.services.simulator_service")

# Relative tier scale for instance size ratio calculations
INSTANCE_TIER_WEIGHTS = {
    "nano": 0.125,
    "micro": 0.25,
    "small": 0.5,
    "medium": 1.0,
    "large": 2.0,
    "xlarge": 4.0,
    "2xlarge": 8.0,
    "4xlarge": 16.0,
    "8xlarge": 32.0,
    "16xlarge": 64.0,
    "24xlarge": 96.0,
    "32xlarge": 128.0
}


def _extract_tier_weight(instance_type: Optional[str]) -> Optional[float]:
    """
    Extracts the relative weight of an instance size (e.g. 't3.large' -> 'large' -> 2.0).
    """
    if not instance_type:
        return None
    parts = instance_type.lower().split(".")
    size = parts[-1] if len(parts) > 1 else parts[0]
    return INSTANCE_TIER_WEIGHTS.get(size, None)


def simulate_resource_cost(
    db: Session,
    user: User,
    resource_id: str,
    account_id: Optional[UUID] = None,
    target_monthly_cost: Optional[float] = None,
    target_instance_type: Optional[str] = None,
    reduction_percentage: Optional[float] = None
) -> Dict[str, Any]:
    """
    Cost Simulator Service (Phase 12):
    1. Validates cloud account ownership for the authenticated user.
    2. Validates that the resource exists and belongs to the specified cloud account.
    3. Validates supported resource types (EC2, RDS).
    4. Deterministically calculates simulated cost, estimated savings, and savings percentage.
    5. Returns structured simulation summary without calling AWS write APIs or altering DB state.
    """
    # 1. Validate Account Ownership
    account = get_user_cloud_account(db, user, account_id)

    # 2. Retrieve Resource & Validate Ownership Relationship
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.cloud_account_id == account.id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource '{resource_id}' not found or does not belong to cloud account '{account.account_name}'."
        )

    # 3. Validate Supported Resource Types
    supported_types = ["EC2", "RDS"]
    if resource.type not in supported_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource type '{resource.type}' is currently unsupported for instance cost simulation. Supported resource types: {', '.join(supported_types)}."
        )

    # 4. Validate Simulation Parameters
    if target_monthly_cost is None and target_instance_type is None and reduction_percentage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify at least one simulation target: 'target_monthly_cost', 'target_instance_type', or 'reduction_percentage'."
        )

    current_cost = round(float(resource.monthly_cost), 2)
    simulated_cost = current_cost

    # 5. Compute Simulated Monthly Cost
    if target_monthly_cost is not None:
        simulated_cost = round(float(target_monthly_cost), 2)
    elif reduction_percentage is not None:
        simulated_cost = round(current_cost * (1.0 - (float(reduction_percentage) / 100.0)), 2)
    elif target_instance_type is not None:
        curr_weight = _extract_tier_weight(resource.instance_type)
        target_weight = _extract_tier_weight(target_instance_type)

        if curr_weight and target_weight and curr_weight > 0:
            ratio = target_weight / curr_weight
            simulated_cost = round(current_cost * ratio, 2)
        else:
            # Default fallback for unknown tier comparison
            simulated_cost = round(current_cost * 0.5, 2)

    # 6. Calculate Savings & Percentages
    estimated_savings = round(current_cost - simulated_cost, 2)

    if current_cost > 0.0:
        savings_pct = round((estimated_savings / current_cost) * 100.0, 2)
    else:
        savings_pct = 0.0

    is_cost_increase = estimated_savings < 0.0

    # 7. Construct Human-Readable Simulation Message
    if estimated_savings > 0.0:
        msg = f"Simulated optimization for '{resource.name}' ({resource.type}): Estimated monthly savings of ${estimated_savings:,.2f} ({savings_pct:.2f}% reduction)."
    elif estimated_savings < 0.0:
        msg = f"Simulated configuration upgrade for '{resource.name}' ({resource.type}): Estimated monthly cost increase of ${abs(estimated_savings):,.2f} ({abs(savings_pct):.2f}% increase)."
    else:
        msg = f"Simulated configuration for '{resource.name}' ({resource.type}) results in no net monthly cost change."

    return {
        "resource_id": resource.id,
        "resource_name": resource.name,
        "resource_type": resource.type,
        "current_instance_type": resource.instance_type,
        "target_instance_type": target_instance_type or resource.instance_type,
        "current_monthly_cost": current_cost,
        "simulated_monthly_cost": simulated_cost,
        "estimated_monthly_savings": estimated_savings,
        "savings_percentage": savings_pct,
        "is_cost_increase": is_cost_increase,
        "is_simulation": True,
        "message": msg
    }
