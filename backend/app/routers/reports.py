from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.schemas.report import RecommendationResponse, OptimizationRoadmapResponse
from app.services import ai_service, report_service
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports & AI Recommendations"])

@router.get("/pdf")
def export_pdf_report(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export PDF Report Endpoint:
    Generates and downloads a multi-section executive PDF report summarizing
    account info, resources, costs, trends, security audit, AI recommendations, and scan status.
    """
    pdf_bytes = report_service.generate_pdf_report(db, user=current_user, account_id=account_id)
    filename = f"cloudpilot_report_{account_id or 'default'}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/csv")
def export_csv_report(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export CSV Report Endpoint:
    Generates and downloads structured tabular CSV export of cloud resources, costs, and recommendations.
    """
    csv_str = report_service.generate_csv_report(db, user=current_user, account_id=account_id)
    filename = f"cloudpilot_report_{account_id or 'default'}.csv"

    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_ai_recommendations(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Optimization Recommendations Endpoint:
    Evaluates rule-based optimization heuristics against PostgreSQL resources and cost records.
    """
    recommendations = ai_service.generate_ai_recommendations(db, user=current_user, account_id=account_id)
    return recommendations

@router.get("/roadmap", response_model=OptimizationRoadmapResponse)
def get_optimization_roadmap(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phased Optimization Roadmap Endpoint (Phase 12):
    Groups optimization recommendations into 3 phased execution stages:
    - Phase 1: Immediate Action (Days 1-30)
    - Phase 2: Medium-Term Optimization (Days 31-90)
    - Phase 3: Long-Term Governance (Days 90+)
    """
    roadmap = ai_service.generate_optimization_roadmap(db, user=current_user, account_id=account_id)
    return roadmap
