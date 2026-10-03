from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.cost_record import CostRecord
from app.models.security_finding import SecurityFinding
from app.models.recommendation import Recommendation
from app.models.scan_job import ScanJob

def get_demo_resources_data():
    """
    Returns structured sample AWS resources matching Cloud Pilot demo data.
    """
    return [
        {
            "id": "i-001",
            "name": "web-server-prod",
            "type": "EC2",
            "instance_type": "t3.large",
            "region": "ap-south-1",
            "status": "Running",
            "cpu_utilization": 8.0,
            "memory_utilization": 18.0,
            "monthly_cost": 4200.0,
            "risk": "Medium",
            "public_access": False,
        },
        {
            "id": "i-002",
            "name": "api-server-prod",
            "type": "EC2",
            "instance_type": "t3.medium",
            "region": "ap-south-1",
            "status": "Running",
            "cpu_utilization": 62.0,
            "memory_utilization": 55.0,
            "monthly_cost": 2800.0,
            "risk": "Low",
            "public_access": False,
        },
        {
            "id": "s3-001",
            "name": "customer-data-backup",
            "type": "S3",
            "region": "eu-west-1",
            "status": "Active",
            "storage_gb": 4200.0,
            "monthly_cost": 3200.0,
            "public_access": True,
            "risk": "Critical",
        },
        {
            "id": "rds-001",
            "name": "analytics-db",
            "type": "RDS",
            "instance_type": "db.t3.large",
            "region": "ap-south-1",
            "status": "Available",
            "cpu_utilization": 45.0,
            "storage_gb": 500.0,
            "monthly_cost": 18900.0,
            "risk": "Medium",
            "public_access": False,
        },
        {
            "id": "lambda-001",
            "name": "payment-webhook",
            "type": "Lambda",
            "region": "us-east-1",
            "status": "Active",
            "invocations": 18200,
            "monthly_cost": 145.0,
            "risk": "Low",
            "public_access": False,
        },
    ]

def get_demo_cost_records_data():
    """
    Returns structured sample historical monthly spending records.
    """
    return [
        {"service_name": "EC2", "period_date": date(2026, 1, 1), "amount": 14000.0},
        {"service_name": "RDS", "period_date": date(2026, 1, 1), "amount": 10000.0},
        {"service_name": "S3", "period_date": date(2026, 1, 1), "amount": 4000.0},
        {"service_name": "Lambda", "period_date": date(2026, 1, 1), "amount": 1500.0},
        {"service_name": "Other", "period_date": date(2026, 1, 1), "amount": 1500.0},

        {"service_name": "EC2", "period_date": date(2026, 2, 1), "amount": 15500.0},
        {"service_name": "RDS", "period_date": date(2026, 2, 1), "amount": 11000.0},
        {"service_name": "S3", "period_date": date(2026, 2, 1), "amount": 4500.0},
        {"service_name": "Lambda", "period_date": date(2026, 2, 1), "amount": 1500.0},
        {"service_name": "Other", "period_date": date(2026, 2, 1), "amount": 1500.0},

        {"service_name": "EC2", "period_date": date(2026, 3, 1), "amount": 15000.0},
        {"service_name": "RDS", "period_date": date(2026, 3, 1), "amount": 10500.0},
        {"service_name": "S3", "period_date": date(2026, 3, 1), "amount": 4500.0},
        {"service_name": "Lambda", "period_date": date(2026, 3, 1), "amount": 1500.0},
        {"service_name": "Other", "period_date": date(2026, 3, 1), "amount": 1500.0},

        {"service_name": "EC2", "period_date": date(2026, 4, 1), "amount": 17000.0},
        {"service_name": "RDS", "period_date": date(2026, 4, 1), "amount": 11500.0},
        {"service_name": "S3", "period_date": date(2026, 4, 1), "amount": 5000.0},
        {"service_name": "Lambda", "period_date": date(2026, 4, 1), "amount": 1750.0},
        {"service_name": "Other", "period_date": date(2026, 4, 1), "amount": 1750.0},

        {"service_name": "EC2", "period_date": date(2026, 5, 1), "amount": 18500.0},
        {"service_name": "RDS", "period_date": date(2026, 5, 1), "amount": 12500.0},
        {"service_name": "S3", "period_date": date(2026, 5, 1), "amount": 5200.0},
        {"service_name": "Lambda", "period_date": date(2026, 5, 1), "amount": 2400.0},
        {"service_name": "Other", "period_date": date(2026, 5, 1), "amount": 2400.0},

        {"service_name": "EC2", "period_date": date(2026, 6, 1), "amount": 22000.0},
        {"service_name": "RDS", "period_date": date(2026, 6, 1), "amount": 14500.0},
        {"service_name": "S3", "period_date": date(2026, 6, 1), "amount": 6000.0},
        {"service_name": "Lambda", "period_date": date(2026, 6, 1), "amount": 3000.0},
        {"service_name": "Other", "period_date": date(2026, 6, 1), "amount": 3000.0},
    ]

def get_demo_security_findings_data():
    """
    Returns structured sample security compliance audit findings.
    """
    return [
        {
            "id": "SEC-001",
            "title": "Publicly exposed S3 bucket",
            "resource": "customer-data-backup",
            "severity": "Critical",
            "description": "Bucket allows public access.",
            "recommendation": "Block public access and review bucket policy.",
            "status": "Active",
        },
        {
            "id": "SEC-002",
            "title": "Inactive IAM access keys",
            "resource": "3 IAM users",
            "severity": "High",
            "description": "Access keys have not been used for more than 90 days.",
            "recommendation": "Disable or rotate unused access keys.",
            "status": "Active",
        },
        {
            "id": "SEC-003",
            "title": "Open security group rule",
            "resource": "sg-web-tier",
            "severity": "High",
            "description": "Port 22 is open to a broad IP range.",
            "recommendation": "Restrict SSH access to trusted IP ranges.",
            "status": "Active",
        },
        {
            "id": "SEC-004",
            "title": "Unencrypted storage",
            "resource": "analytics-db",
            "severity": "Medium",
            "description": "Encryption at rest is not enabled.",
            "recommendation": "Enable encryption for database storage.",
            "status": "Active",
        },
        {
            "id": "SEC-005",
            "title": "Old IAM credentials",
            "resource": "developer-user",
            "severity": "Medium",
            "description": "Credentials have not been rotated recently.",
            "recommendation": "Rotate credentials according to policy.",
            "status": "Active",
        },
    ]

def get_demo_recommendations_data():
    """
    Returns structured sample cost optimization recommendations.
    """
    return [
        {
            "id": "REC-001",
            "title": "Downsize idle EC2 instances",
            "resource": "web-server-prod",
            "priority": "High",
            "description": "CPU utilization is consistently below 10%.",
            "estimated_savings": 1600.0,
        },
        {
            "id": "REC-002",
            "title": "Remove unused EBS volumes",
            "resource": "5 unattached volumes",
            "priority": "High",
            "description": "Unused storage is generating unnecessary charges.",
            "estimated_savings": 2100.0,
        },
        {
            "id": "REC-003",
            "title": "Optimize RDS instance",
            "resource": "analytics-db",
            "priority": "Medium",
            "description": "Current capacity may be higher than required.",
            "estimated_savings": 1800.0,
        },
        {
            "id": "REC-004",
            "title": "Optimize S3 storage",
            "resource": "customer-data-backup",
            "priority": "Medium",
            "description": "Move infrequently accessed data to a lower-cost storage class.",
            "estimated_savings": 1200.0,
        },
    ]

def seed_demo_data(db: Session, user: User) -> dict:
    """
    Idempotent Demo Ingestion Engine:
    1. Finds or creates a 'demo' CloudAccount belonging to current user.
    2. Clears previous demo child records if account exists.
    3. Seeds resources, cost records, security findings, recommendations, and a completed scan job.
    4. Executes inside a database transaction (db.commit / db.rollback).
    """
    try:
        # Check for existing demo account for this user (Idempotency)
        cloud_account = db.query(CloudAccount).filter(
            CloudAccount.user_id == user.id,
            CloudAccount.account_type == "demo"
        ).first()

        if cloud_account:
            # Delete previous child entities for re-seeding
            db.query(Resource).filter(Resource.cloud_account_id == cloud_account.id).delete()
            db.query(CostRecord).filter(CostRecord.cloud_account_id == cloud_account.id).delete()
            db.query(SecurityFinding).filter(SecurityFinding.cloud_account_id == cloud_account.id).delete()
            db.query(Recommendation).filter(Recommendation.cloud_account_id == cloud_account.id).delete()
            db.query(ScanJob).filter(ScanJob.cloud_account_id == cloud_account.id).delete()
            
            # Update health score and timestamp
            cloud_account.health_score = 72
            cloud_account.status = "active"
        else:
            # Create new demo cloud account bound to current user
            cloud_account = CloudAccount(
                user_id=user.id,
                account_name="Demo Environment",
                account_type="demo",
                aws_account_id="demo-123456789012",
                region="ap-south-1",
                status="active",
                health_score=72
            )
            db.add(cloud_account)
            db.flush()  # Flush to populate cloud_account.id

        # 1. Seed Resources
        resources_list = [
            Resource(
                cloud_account_id=cloud_account.id,
                **{**r, "id": f"{r['id']}-{str(cloud_account.id)[:8]}"}
            )
            for r in get_demo_resources_data()
        ]
        db.add_all(resources_list)

        # 2. Seed Cost Records
        cost_records_list = [
            CostRecord(cloud_account_id=cloud_account.id, **c)
            for c in get_demo_cost_records_data()
        ]
        db.add_all(cost_records_list)

        # 3. Seed Security Findings
        findings_list = [
            SecurityFinding(
                cloud_account_id=cloud_account.id,
                **{**f, "id": f"{f['id']}-{str(cloud_account.id)[:8]}"}
            )
            for f in get_demo_security_findings_data()
        ]
        db.add_all(findings_list)

        # 4. Seed Recommendations
        recommendations_list = [
            Recommendation(
                cloud_account_id=cloud_account.id,
                **{**rec, "id": f"{rec['id']}-{str(cloud_account.id)[:8]}"}
            )
            for rec in get_demo_recommendations_data()
        ]
        db.add_all(recommendations_list)

        # 5. Seed Completed Scan Job
        scan_job = ScanJob(
            cloud_account_id=cloud_account.id,
            progress=100,
            current_step="Analysis Complete",
            status="completed",
            completed_at=datetime.now(timezone.utc)
        )
        db.add(scan_job)

        # Commit all entities in one safe database transaction
        db.commit()

        return {
            "accountId": cloud_account.id,
            "accountName": cloud_account.account_name,
            "accountType": cloud_account.account_type,
            "mode": "demo",
            "resourcesCreated": len(resources_list),
            "costRecordsCreated": len(cost_records_list),
            "securityFindingsCreated": len(findings_list),
            "recommendationsCreated": len(recommendations_list),
            "scanStatus": scan_job.status,
            "healthScore": cloud_account.health_score,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed demo dataset: {str(e)}"
        )
