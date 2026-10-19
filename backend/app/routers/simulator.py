from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.schemas.simulator import CostSimulationRequest, CostSimulationResponse
from app.services import simulator_service
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/simulator", tags=["Cost Simulator"])


@router.post("/cost", response_model=CostSimulationResponse, status_code=status.HTTP_200_OK)
def simulate_cost(
    request: CostSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cost Simulator Endpoint (Phase 12):
    1. Authenticates current user via JWT.
    2. Validates cloud account ownership (returns 404 if unowned / invalid).
    3. Validates resource existence and relationship.
    4. Performs read-only deterministic cost simulation for target configuration/cost changes.
    5. Returns calculated current cost, simulated cost, estimated savings, and savings percentage.
    """
    result = simulator_service.simulate_resource_cost(
        db=db,
        user=current_user,
        account_id=request.accountId,
        resource_id=request.resourceId,
        target_monthly_cost=request.targetMonthlyCost,
        target_instance_type=request.targetInstanceType,
        reduction_percentage=request.reductionPercentage
    )
    return result
