"""
Cloud Pilot Phase 6 Integration & Verification Test Script
"""
import sys
import os
import time
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, check_db_connection, SessionLocal
from app.models import Base, User, CloudAccount, Resource, ScanJob
from app.schemas.user import UserCreate
from app.schemas.scan import ScanStartRequest, ScanStartResponse, ScanStatusResponse
from app.services import auth_service, demo_service, cloud_service, scan_service
from app.aws.resource_scanner import discover_ec2, discover_s3, discover_rds, discover_lambda, discover_iam
from app.main import app
from fastapi import HTTPException

def run_phase6_tests():
    print("=" * 70)
    print("STARTING CLOUD PILOT PHASE 6 SCANNING ENGINE VERIFICATION")
    print("=" * 70)

    # 1. Check Routes in FastAPI Application
    routes = [r.path for r in app.routes]
    print("\n[1. Router Registration Check]")
    assert "/api/v1/scan/start" in routes, "Missing /api/v1/scan/start"
    assert "/api/v1/scan/status/{job_id}" in routes, "Missing /api/v1/scan/status/{job_id}"
    print("All Phase 6 Scan endpoints (/scan/start, /scan/status/{job_id}) are registered!")

    # 2. Database Connection Test
    is_conn, conn_msg = check_db_connection()
    assert is_conn == True, f"Database connection failed: {conn_msg}"
    print("\n[2. Database Connection Check]")
    print("PostgreSQL connection: PASSED")

    db = SessionLocal()
    try:
        # Cleanup test users if re-running
        old_users = db.query(User).filter(User.email.in_(["phase6_user1@example.com", "phase6_user2@example.com"])).all()
        for u in old_users:
            db.delete(u)
        db.commit()

        # 3. Create User 1 & Seed Demo Environment
        print("\n[3. User Setup & Demo Account Creation]")
        u1_data = UserCreate(fullName="Scan Test User One", email="phase6_user1@example.com", password="Password123!")
        user1 = auth_service.register_user(db, u1_data)
        demo_info = demo_service.seed_demo_data(db, user=user1)
        account_id = demo_info["accountId"]
        print(f"User 1 created ({user1.id}) with Demo Account ({account_id})")

        # 4. Test Scan Start API (POST /api/v1/scan/start)
        print("\n[4. Start Scan API Test - POST /api/v1/scan/start]")
        scan_job = scan_service.create_scan_job(db, user=user1, account_id=account_id)
        print(f"ScanJob created in PostgreSQL - ID: {scan_job.id}, status: {scan_job.status}, progress: {scan_job.progress}%")
        
        assert scan_job.status == "pending"
        assert scan_job.progress == 0
        assert scan_job.cloud_account_id == account_id
        print("ScanJob persistence in PostgreSQL PASSED!")

        # 5. Test Background Task Execution
        print("\n[5. Background Scan Execution Test]")
        scan_service.execute_background_scan(job_id=scan_job.id, cloud_account_id=account_id)
        
        # Verify ScanJob updated in DB
        db.refresh(scan_job)
        print(f"Background Scan Job Finished -> status: {scan_job.status}, progress: {scan_job.progress}%, step: '{scan_job.current_step}'")
        assert scan_job.status == "completed"
        assert scan_job.progress == 100
        assert scan_job.completed_at is not None
        print("Background scan execution & progress update PASSED!")

        # 6. Test Poll Scan Status API (GET /api/v1/scan/status/{job_id})
        print("\n[6. Poll Scan Status API Test - GET /api/v1/scan/status/{job_id}]")
        status_resp = scan_service.get_scan_job_status(db, user=user1, job_id=scan_job.id)
        print(f"Status API Response: {status_resp}")
        assert status_resp["status"] == "completed"
        assert status_resp["progress"] == 100
        assert status_resp["resources_discovered"] == 5
        print("Poll scan status API PASSED!")

        # 7. Test Scan Idempotency & Resource Non-Duplication
        print("\n[7. Demo Scan Idempotency & Non-Duplication Test]")
        scan_job2 = scan_service.create_scan_job(db, user=user1, account_id=account_id)
        scan_service.execute_background_scan(job_id=scan_job2.id, cloud_account_id=account_id)
        
        resource_count = db.query(Resource).filter(Resource.cloud_account_id == account_id).count()
        print(f"Discovered resource count after re-scan: {resource_count}")
        assert resource_count == 5, f"Expected 5 resources, got {resource_count}"
        print("Resource non-duplication idempotency PASSED!")

        # 8. Test Multi-User Ownership & Isolation Security
        print("\n[8. Multi-User Ownership & Isolation Security Test]")
        u2_data = UserCreate(fullName="Scan Test User Two", email="phase6_user2@example.com", password="Password123!")
        user2 = auth_service.register_user(db, u2_data)

        # User 2 attempts to start scan on User 1's cloud account (Must throw HTTP 404)
        try:
            scan_service.create_scan_job(db, user=user2, account_id=account_id)
            assert False, "Should have thrown 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("User 2 blocked from starting scan on User 1's account (HTTP 404) PASSED!")

        # User 2 attempts to poll status of User 1's ScanJob (Must throw HTTP 404)
        try:
            scan_service.get_scan_job_status(db, user=user2, job_id=scan_job.id)
            assert False, "Should have thrown 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("User 2 blocked from polling status of User 1's ScanJob (HTTP 404) PASSED!")

        # 9. Test Mocked AWS Resource Scanner Functions
        print("\n[9. Mocked Boto3 AWS Resource Discovery Test]")
        with patch("app.aws.resource_scanner.get_boto3_client") as mock_client_factory:
            mock_ec2 = MagicMock()
            mock_s3 = MagicMock()
            mock_rds = MagicMock()
            mock_lambda = MagicMock()
            mock_iam = MagicMock()

            # Mock EC2 describe_instances paginator
            mock_ec2.get_paginator.return_value.paginate.return_value = [{
                "Reservations": [{
                    "Instances": [{
                        "InstanceId": "i-mocked123",
                        "InstanceType": "t3.micro",
                        "State": {"Name": "running"},
                        "PublicIpAddress": "54.210.10.1",
                        "Tags": [{"Key": "Name", "Value": "test-ec2"}]
                    }]
                }]
            }]

            # Mock S3 list_buckets
            mock_s3.list_buckets.return_value = {
                "Buckets": [{"Name": "test-bucket-aws"}]
            }
            mock_s3.get_public_access_block.return_value = {
                "PublicAccessBlockConfiguration": {"BlockPublicAcls": True, "BlockPublicPolicy": True}
            }

            # Mock RDS describe_db_instances paginator
            mock_rds.get_paginator.return_value.paginate.return_value = [{
                "DBInstances": [{
                    "DBInstanceIdentifier": "test-db",
                    "DBInstanceClass": "db.t3.small",
                    "DBInstanceStatus": "available",
                    "AllocatedStorage": 50,
                    "StorageEncrypted": True
                }]
            }]

            # Mock Lambda list_functions paginator
            mock_lambda.get_paginator.return_value.paginate.return_value = [{
                "Functions": [{"FunctionName": "test-function"}]
            }]

            # Mock IAM list_users paginator
            mock_iam.get_paginator.return_value.paginate.return_value = [{
                "Users": [{"UserName": "test-iam-user"}]
            }]

            mock_client_factory.side_effect = lambda svc, creds, reg: {
                "ec2": mock_ec2,
                "s3": mock_s3,
                "rds": mock_rds,
                "lambda": mock_lambda,
                "iam": mock_iam
            }[svc]

            creds = {"AccessKeyId": "fake", "SecretAccessKey": "fake", "SessionToken": "fake"}
            
            ec2_res = discover_ec2(creds, "us-east-1")
            s3_res = discover_s3(creds, "us-east-1")
            rds_res = discover_rds(creds, "us-east-1")
            lambda_res = discover_lambda(creds, "us-east-1")
            iam_res = discover_iam(creds, "us-east-1")

            assert len(ec2_res) == 1 and ec2_res[0]["id"] == "i-mocked123"
            assert len(s3_res) == 1 and s3_res[0]["id"] == "s3-test-bucket-aws"
            assert len(rds_res) == 1 and rds_res[0]["id"] == "rds-test-db"
            assert len(lambda_res) == 1 and lambda_res[0]["id"] == "lambda-test-function"
            assert len(iam_res) == 1 and iam_res[0]["id"] == "iam-test-iam-user"

            print("Mocked Boto3 EC2, S3, RDS, Lambda, and IAM discovery PASSED!")

        print("\n" + "=" * 70)
        print("ALL PHASE 6 CLOUD DISCOVERY & SCANNING TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase6_tests()
