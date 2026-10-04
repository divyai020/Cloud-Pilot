import logging
from uuid import UUID
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.cost_record import CostRecord
from app.models.security_finding import SecurityFinding
from app.models.recommendation import Recommendation
from app.services.dashboard_service import (
    get_user_cloud_account,
    get_cost_summary,
    get_cost_by_service,
    get_security_summary,
)
from app.services.health_service import calculate_cloud_health_score
from app.services.ai_service import generate_ai_recommendations
from app.services.retrieval_service import retrieve_relevant_context
from app.services.llm_service import generate_answer as generate_llm_answer

logger = logging.getLogger("cloudpilot.services.assistant_service")

def classify_question_intent(question: str) -> str:
    """
    Rule-based intent classification for Phase 11A.
    Categorizes questions into: COST, SECURITY, HEALTH, RESOURCES, RECOMMENDATIONS, or GENERAL.
    """
    q_lower = question.lower()

    if any(k in q_lower for k in ["recommend", "optimize", "optimization", "saving", "reduce", "suggestion"]):
        return "RECOMMENDATIONS"
    if any(k in q_lower for k in ["cost", "spend", "spending", "price", "expensive", "bill", "budget", "charge", "fee", "how much"]):
        return "COST"
    if any(k in q_lower for k in ["security", "vulnerab", "risk", "public", "expose", "finding", "audit", "encrypt", "iam"]):
        return "SECURITY"
    if any(k in q_lower for k in ["health", "score", "waste", "underutil", "performance", "healthy"]):
        return "HEALTH"
    if any(k in q_lower for k in ["resource", "ec2", "s3", "rds", "lambda", "instance", "bucket", "database", "server", "inventory"]):
        return "RESOURCES"

    return "GENERAL"

def process_assistant_question(
    db: Session,
    user: User,
    question: str,
    account_id: Optional[UUID] = None
) -> Dict[str, Any]:
    """
    AI Assistant Backend Foundation Service (Phase 11A):
    1. Validates cloud account ownership for current user.
    2. Classifies question intent (COST, SECURITY, HEALTH, RESOURCES, RECOMMENDATIONS, GENERAL).
    3. Gathers structured context from PostgreSQL (Resources, Costs, Security Findings, Recommendations, Health).
    4. Generates a deterministic, data-grounded response based on actual database records.
    5. Returns structured schema payload without exposing credentials or secrets.
    """
    account = get_user_cloud_account(db, user, account_id)
    category = classify_question_intent(question)

    # 1. Gather Resource Context
    total_resources = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).scalar() or 0

    res_type_rows = db.query(
        Resource.type, func.count(Resource.id)
    ).filter(
        Resource.cloud_account_id == account.id
    ).group_by(Resource.type).all()
    resources_by_type = {r_type: count for r_type, count in res_type_rows}

    highest_cost_resource = db.query(Resource).filter(
        Resource.cloud_account_id == account.id
    ).order_by(Resource.monthly_cost.desc()).first()

    underutilized_ec2 = db.query(Resource).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "EC2",
        Resource.cpu_utilization.isnot(None),
        Resource.cpu_utilization < 20.0
    ).all()

    null_cpu_ec2_count = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "EC2",
        Resource.cpu_utilization.is_(None)
    ).scalar() or 0

    public_s3_count = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "S3",
        Resource.public_access == True
    ).scalar() or 0

    # 2. Gather Cost Context
    cost_summary = get_cost_summary(db, user, account.id)
    cost_services = get_cost_by_service(db, user, account.id)

    # 3. Gather Security Context
    sec_summary = get_security_summary(db, user, account.id)
    active_findings = db.query(SecurityFinding).filter(
        SecurityFinding.cloud_account_id == account.id
    ).all()

    # 4. Gather Recommendations Context
    ai_recs = generate_ai_recommendations(db, user, account.id)
    total_savings = sum(r["estimated_savings"] for r in ai_recs)

    # 5. Gather Health Context
    health_data = calculate_cloud_health_score(db, user, account.id)
    health_score = health_data["healthScore"]

    # Build Structured Context Payload
    context_payload = {
        "account_id": account.id,
        "account_name": account.account_name,
        "account_type": account.account_type,
        "region": account.region,
        "health_score": health_score,
        "total_resources": total_resources,
        "resources_by_type": resources_by_type,
        "total_cost": cost_summary["totalCost"],
        "latest_month_cost": cost_summary["latestMonthCost"],
        "cost_by_service": cost_services["services"],
        "highest_cost_resource": {
            "id": highest_cost_resource.id,
            "name": highest_cost_resource.name,
            "type": highest_cost_resource.type,
            "monthly_cost": highest_cost_resource.monthly_cost
        } if highest_cost_resource else None,
        "underutilized_ec2_count": len(underutilized_ec2),
        "null_cpu_ec2_count": null_cpu_ec2_count,
        "public_s3_count": public_s3_count,
        "security_findings_summary": sec_summary,
        "recommendations_count": len(ai_recs),
        "total_potential_savings": round(total_savings, 2)
    }

    # Generate Data-Grounded Answer
    if category == "COST":
        if cost_summary["latestMonthCost"] > 0 or cost_summary["totalCost"] > 0:
            top_svc = cost_services["services"][0] if cost_services["services"] else {"service": "N/A", "cost": 0.0}
            hi_res_str = f" Highest single cost item is '{highest_cost_resource.name}' ({highest_cost_resource.type}) at ${highest_cost_resource.monthly_cost:,.2f}/month." if highest_cost_resource else ""
            answer = (
                f"Your account '{account.account_name}' has a latest monthly spend of ${cost_summary['latestMonthCost']:,.2f} "
                f"(Total cumulative spend: ${cost_summary['totalCost']:,.2f}). "
                f"The highest spending service category is {top_svc['service']} at ${top_svc['cost']:,.2f}."
                f"{hi_res_str}"
            )
        else:
            answer = f"No historical cost records are currently available for cloud account '{account.account_name}'."

    elif category == "SECURITY":
        if sec_summary["totalFindings"] > 0:
            crit = sec_summary["bySeverity"].get("Critical", 0)
            high = sec_summary["bySeverity"].get("High", 0)
            med = sec_summary["bySeverity"].get("Medium", 0)
            s3_str = f" Including {public_s3_count} publicly accessible S3 bucket(s)." if public_s3_count > 0 else ""
            answer = (
                f"Account '{account.account_name}' currently has {sec_summary['totalFindings']} security audit findings: "
                f"{crit} Critical, {high} High, and {med} Medium severity issues.{s3_str} "
                f"Please review security recommendations to remediate potential vulnerabilities."
            )
        else:
            answer = f"No security audit findings have been detected for cloud account '{account.account_name}'."

    elif category == "HEALTH":
        factors = health_data["factors"]
        waste_str = f" Cloud waste ratio is {factors['cloudWasteRatio']*100:.1f}% ({factors['underutilizedResources']} underutilized/public item(s))." if factors["wasteRatioAvailable"] else ""
        null_cpu_str = f" Note: {null_cpu_ec2_count} EC2 instance(s) have NULL CPU utilization (missing CloudWatch metrics) and were excluded from waste penalties." if null_cpu_ec2_count > 0 else ""
        answer = (
            f"The Cloud Health Score for '{account.account_name}' is {health_score}/100. "
            f"The score is affected by {factors['criticalFindings']} Critical, {factors['highFindings']} High, and {factors['mediumFindings']} Medium security findings.{waste_str}{null_cpu_str}"
        )

    elif category == "RESOURCES":
        if total_resources > 0:
            types_str = ", ".join([f"{k}: {v}" for k, v in resources_by_type.items()])
            under_str = f" {len(underutilized_ec2)} EC2 instance(s) have CPU utilization below 20%." if len(underutilized_ec2) > 0 else ""
            null_str = f" {null_cpu_ec2_count} EC2 instance(s) currently lack CloudWatch CPU metrics (NULL)." if null_cpu_ec2_count > 0 else ""
            answer = (
                f"Account '{account.account_name}' has {total_resources} discovered cloud resources across types ({types_str})."
                f"{under_str}{null_str}"
            )
        else:
            answer = f"No cloud infrastructure resources have been discovered yet for account '{account.account_name}'."

    elif category == "RECOMMENDATIONS":
        if len(ai_recs) > 0:
            top_rec = ai_recs[0]["title"]
            answer = (
                f"Found {len(ai_recs)} optimization recommendations for account '{account.account_name}' "
                f"with a total potential savings of ${total_savings:,.2f}/month. "
                f"Top suggestion: '{top_rec}'."
            )
        else:
            answer = f"No cost or security recommendations are currently pending for account '{account.account_name}'."

    else:  # GENERAL
        answer = (
            f"Overview for '{account.account_name}' ({account.account_type.upper()}): "
            f"Health Score is {health_score}/100 across {total_resources} resources. "
            f"Latest monthly cost is ${cost_summary['latestMonthCost']:,.2f} with {sec_summary['totalFindings']} security findings "
            f"and {len(ai_recs)} optimization recommendations (potential monthly savings: ${total_savings:,.2f})."
        )

    # Phase 11B: Execute local RAG retrieval for this query
    retrieved_rag = retrieve_relevant_context(
        db=db,
        account_id=account.id,
        question=question,
        top_k=5
    )
    retrieved_chunks = retrieved_rag.get("results", [])

    # Phase 11C: LLM Generation Layer (with automatic rule-based fallback)
    llm_res = generate_llm_answer(
        question=question,
        retrieved_context=retrieved_chunks,
        intent=category
    )

    if llm_res.get("answer") and llm_res.get("generation_mode") == "llm":
        final_answer = llm_res["answer"]
        generation_mode = "llm"
    else:
        final_answer = answer  # Phase 11A deterministic rule-based answer
        generation_mode = "rule_based_fallback"

    return {
        "question": question,
        "category": category,
        "answer": final_answer,
        "context": context_payload,
        "sources": [
            "cloud_accounts",
            "resources",
            "cost_records",
            "security_findings",
            "recommendations",
            "scan_jobs"
        ],
        "retrieved_context": retrieved_chunks,
        "generation_mode": generation_mode
    }
