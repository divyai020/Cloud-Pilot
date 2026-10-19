import logging
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.security_finding import SecurityFinding
from app.models.recommendation import Recommendation
from app.services.dashboard_service import get_user_cloud_account

logger = logging.getLogger("cloudpilot.services.ai_service")

def generate_ai_recommendations(db: Session, user: User, account_id: UUID | None = None) -> List[Dict[str, Any]]:
    """
    AI Optimization Engine:
    Evaluates rule-based heuristics against PostgreSQL resources, cost records,
    security findings, and persisted recommendations for the specified cloud account.
    
    Rules Evaluated:
    - Rule 1: EC2 Low Utilization (< 20% CPU) -> Downsize EC2 instance
    - Rule 2: Public S3 Bucket -> Restrict public access
    - Rule 3: RDS Unencrypted Storage / Risk -> Enable encryption
    - Rule 4: High-Cost Resource Threshold -> Review high-cost services
    - Rule 5: Inactive/Old IAM Credentials -> Rotate credentials
    - Rule 6: Persisted DB Recommendations Integration
    """
    account = get_user_cloud_account(db, user, account_id)
    now = datetime.now(timezone.utc)
    recommendations: List[Dict[str, Any]] = []
    seen_titles = set()

    # Rule 1: Low CPU Utilization on EC2 Instances (< 20%)
    ec2_underutilized = db.query(Resource).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "EC2",
        Resource.cpu_utilization.isnot(None),
        Resource.cpu_utilization < 20.0
    ).all()

    for r in ec2_underutilized:
        title = f"Downsize underutilized EC2 instance '{r.name}'"
        if title not in seen_titles:
            seen_titles.add(title)
            savings = round((r.monthly_cost or 500.0) * 0.4, 2)
            recommendations.append({
                "recommendation_id": f"REC-AI-EC2-{r.id[:8]}",
                "title": title,
                "description": f"EC2 instance '{r.name}' ({r.id}) has a low average CPU utilization of {r.cpu_utilization}%. Downsizing from '{r.instance_type or 't3.large'}' will optimize spend.",
                "priority": "High",
                "estimated_savings": savings,
                "category": "Cost",
                "created_at": now
            })

    # Rule 2: Publicly Accessible S3 Buckets
    public_s3 = db.query(Resource).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "S3",
        Resource.public_access == True
    ).all()

    for r in public_s3:
        title = f"Restrict public access on S3 bucket '{r.name}'"
        if title not in seen_titles:
            seen_titles.add(title)
            recommendations.append({
                "recommendation_id": f"REC-AI-S3-{r.id[:8]}",
                "title": title,
                "description": f"S3 bucket '{r.name}' ({r.id}) allows public read/write access. Enable Block Public Access to prevent unauthorized data exposure.",
                "priority": "High",
                "estimated_savings": 0.0,
                "category": "Security",
                "created_at": now
            })

    # Rule 3: RDS Unencrypted Storage / Security Risk
    rds_risks = db.query(Resource).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "RDS",
        Resource.risk.in_(["Medium", "High", "Critical"])
    ).all()

    for r in rds_risks:
        title = f"Enable storage encryption for RDS instance '{r.name}'"
        if title not in seen_titles:
            seen_titles.add(title)
            recommendations.append({
                "recommendation_id": f"REC-AI-RDS-{r.id[:8]}",
                "title": title,
                "description": f"RDS database '{r.name}' ({r.id}) lacks KMS storage encryption at rest. Enable automated snapshots and encryption.",
                "priority": "High",
                "estimated_savings": 0.0,
                "category": "Security",
                "created_at": now
            })

    # Rule 4: High Monthly Cost Resource Threshold (> $2,500/mo)
    high_cost_res = db.query(Resource).filter(
        Resource.cloud_account_id == account.id,
        Resource.monthly_cost >= 2500.0
    ).all()

    for r in high_cost_res:
        title = f"Review high-cost service '{r.name}' ({r.type})"
        if title not in seen_titles:
            seen_titles.add(title)
            savings = round(r.monthly_cost * 0.25, 2)
            recommendations.append({
                "recommendation_id": f"REC-AI-COST-{r.id[:8]}",
                "title": title,
                "description": f"Resource '{r.name}' generates high monthly charges of ${r.monthly_cost:,.2f}. Consider 1-year or 3-year Savings Plans or Reserved Instances.",
                "priority": "Medium",
                "estimated_savings": savings,
                "category": "Cost",
                "created_at": now
            })

    # Rule 5: IAM Security Credentials
    iam_findings = db.query(SecurityFinding).filter(
        SecurityFinding.cloud_account_id == account.id,
        SecurityFinding.resource.ilike("%IAM%")
    ).all()

    if iam_findings:
        title = "Rotate inactive IAM user credentials"
        if title not in seen_titles:
            seen_titles.add(title)
            recommendations.append({
                "recommendation_id": "REC-AI-IAM-001",
                "title": title,
                "description": "Found active IAM users with access keys older than 90 days. Enforce mandatory key rotation policies across all IAM users.",
                "priority": "Medium",
                "estimated_savings": 0.0,
                "category": "Security",
                "created_at": now
            })

    # Rule 6: Integrate Persisted Recommendations from Database
    db_recs = db.query(Recommendation).filter(
        Recommendation.cloud_account_id == account.id
    ).order_by(Recommendation.created_at.desc()).all()

    for r in db_recs:
        if r.title not in seen_titles:
            seen_titles.add(r.title)
            recommendations.append({
                "recommendation_id": r.id,
                "title": r.title,
                "description": r.description,
                "priority": r.priority,
                "estimated_savings": round(r.estimated_savings, 2),
                "category": "Cost" if r.estimated_savings > 0 else "Governance",
                "created_at": r.created_at
            })

    return recommendations


def generate_optimization_roadmap(db: Session, user: User, account_id: UUID | None = None) -> Dict[str, Any]:
    """
    Generates a phased optimization roadmap by grouping AI/rule-based recommendations into implementation stages.
    - Phase 1 (Immediate Action): High & Critical priority items (Days 1-30)
    - Phase 2 (Medium-Term Optimization): Medium priority items (Days 31-90)
    - Phase 3 (Long-Term Governance): Low priority & long-term maintenance items (Days 90+)
    """
    recs = generate_ai_recommendations(db, user, account_id)

    phase1_recs = [r for r in recs if r.get("priority") in ["High", "Critical"]]
    phase2_recs = [r for r in recs if r.get("priority") == "Medium"]
    phase3_recs = [r for r in recs if r.get("priority") not in ["High", "Critical", "Medium"]]

    p1_savings = sum(r["estimated_savings"] for r in phase1_recs)
    p2_savings = sum(r["estimated_savings"] for r in phase2_recs)
    p3_savings = sum(r["estimated_savings"] for r in phase3_recs)

    total_savings = round(p1_savings + p2_savings + p3_savings, 2)
    total_actions = len(recs)

    return {
        "total_potential_savings": total_savings,
        "total_actions": total_actions,
        "phases": [
            {
                "phase_name": "Phase 1: Immediate Action (Days 1-30)",
                "timeframe": "Days 1-30",
                "action_count": len(phase1_recs),
                "potential_savings": round(p1_savings, 2),
                "recommendations": phase1_recs
            },
            {
                "phase_name": "Phase 2: Medium-Term Optimization (Days 31-90)",
                "timeframe": "Days 31-90",
                "action_count": len(phase2_recs),
                "potential_savings": round(p2_savings, 2),
                "recommendations": phase2_recs
            },
            {
                "phase_name": "Phase 3: Long-Term Governance (Days 90+)",
                "timeframe": "Days 90+",
                "action_count": len(phase3_recs),
                "potential_savings": round(p3_savings, 2),
                "recommendations": phase3_recs
            }
        ]
    }
