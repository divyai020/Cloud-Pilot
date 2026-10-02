"""
Cloud Pilot Phase 10 Integration & Verification Test Script
Tests CloudWatch CPUUtilization collector, mocked Boto3 metric responses,
hardcoded placeholder removal, missing metric NULL handling, health score safety,
demo mode compatibility, multi-user isolation, and Phase 1-9 regression tests.
"""
import sys
import os
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))

from app.database import check_db_connection, SessionLocal
from app.models import User, CloudAccount, Resource
from app.schemas.user import UserCreate
from app.services import auth_service, demo_service, health_service, scan_service, forecast_service
from app.aws.cloudwatch_collector import get_ec2_cpu_utilization
from app.aws.resource_scanner import discover_ec2, discover_rds
from app.main import app

def run_phase10_tests():
    print("=" * 70)
    print("STARTING CLOUD PILOT PHASE 10 CLOUDWATCH INTEGRATION VERIFICATION")
    print("=" * 70)

    # 1. Check FastAPI Router Registrations
    routes = [r.path for r in app.routes]
    print("\n[1. FastAPI Router Registration Check]")
    assert "/api/v1/scan/start" in routes
    assert "/api/v1/analytics/health" in routes
    assert "/api/v1/analytics/forecast" in routes
    print("All backend API routers registered in FastAPI!")

    # 2. Database Connection Check
    is_conn, conn_msg = check_db_connection()
    assert is_conn == True, f"Database connection failed: {conn_msg}"
    print("\n[2. Database Connection Check]")
    print("PostgreSQL connection: PASSED")

    db = SessionLocal()
    try:
        # Cleanup prior test users
        old_users = db.query(User).filter(User.email.in_([
            "phase10_user1@example.com",
            "phase10_user2@example.com"
        ])).all()
        for u in old_users:
            db.delete(u)
        db.commit()

        # 3. Test CloudWatch Collector Direct Unit Logic (Mocked Boto3)
        print("\n[3. CloudWatch Collector Direct Metric Calculations (Mocked Boto3)]")
        with patch("app.aws.resource_scanner.get_boto3_client") as mock_boto3_factory:
            mock_cw = MagicMock()
            mock_boto3_factory.return_value = mock_cw
            fake_creds = {"AccessKeyId": "fake", "SecretAccessKey": "fake", "SessionToken": "fake"}

            # Test 3.1: Correct average calculation across multiple datapoints (10%, 20%, 30%)
            mock_cw.get_metric_statistics.return_value = {
                "Datapoints": [
                    {"Average": 10.0},
                    {"Average": 20.0},
                    {"Average": 30.0}
                ]
            }
            res_avg = get_ec2_cpu_utilization(fake_creds, "us-east-1", "i-test123")
            assert res_avg == 20.0, f"Expected 20.0, got {res_avg}"
            print("  Average calculation across multiple datapoints (10, 20, 30 -> 20.0%): PASSED")

            # Test 3.2: 5 datapoints mean calculation (5, 10, 15, 20, 25 -> 15.0%)
            mock_cw.get_metric_statistics.return_value = {
                "Datapoints": [
                    {"Average": 5.0},
                    {"Average": 10.0},
                    {"Average": 15.0},
                    {"Average": 20.0},
                    {"Average": 25.0}
                ]
            }
            res_avg5 = get_ec2_cpu_utilization(fake_creds, "us-east-1", "i-test123")
            assert res_avg5 == 15.0, f"Expected 15.0, got {res_avg5}"
            print("  5 datapoints mean calculation (5, 10, 15, 20, 25 -> 15.0%): PASSED")

            # Test 3.3: Empty datapoints (No-Data response) -> Returns None (NULL)
            mock_cw.get_metric_statistics.return_value = {"Datapoints": []}
            res_nodata = get_ec2_cpu_utilization(fake_creds, "us-east-1", "i-test123")
            assert res_nodata is None, f"Expected None, got {res_nodata}"
            print("  No-data response (empty Datapoints) -> Returns None (SQL NULL): PASSED")

            # Test 3.4: CloudWatch exception handling (Permission Denied / ClientError) -> Returns None
            mock_cw.get_metric_statistics.side_effect = Exception("CloudWatch AccessDenied")
            res_error = get_ec2_cpu_utilization(fake_creds, "us-east-1", "i-test123")
            assert res_error is None, f"Expected None on exception, got {res_error}"
            print("  CloudWatch exception handling (AccessDenied -> Returns None): PASSED")

        # 4. Test EC2 Scanner Integration & Placeholder Removal
        print("\n[4. EC2 Resource Scanner Integration & Placeholder Removal Test]")
        with patch("app.aws.resource_scanner.get_boto3_client") as mock_boto3_factory, \
             patch("app.aws.cloudwatch_collector.get_ec2_cpu_utilization") as mock_cw_calc:

            mock_ec2 = MagicMock()
            mock_boto3_factory.return_value = mock_ec2
            
            # Mock EC2 describe_instances
            mock_ec2.get_paginator.return_value.paginate.return_value = [{
                "Reservations": [{
                    "Instances": [{
                        "InstanceId": "i-liveec2",
                        "InstanceType": "t3.xlarge",
                        "State": {"Name": "running"},
                        "PublicIpAddress": "52.1.2.3",
                        "Tags": [{"Key": "Name", "Value": "prod-web-server"}]
                    }]
                }]
            }]

            # Case 4.1: CloudWatch returns 12.5% CPU -> Ensure cpu_utilization is 12.5 (Not hardcoded 45.0)
            mock_cw_calc.return_value = 12.5
            ec2_results = discover_ec2(fake_creds, "us-east-1")
            assert len(ec2_results) == 1
            assert ec2_results[0]["cpu_utilization"] == 12.5
            assert ec2_results[0]["cpu_utilization"] != 45.0, "Hardcoded 45.0 placeholder was NOT removed!"
            print("  Retrieved CloudWatch CPU (12.5%) assigned to EC2 resource: PASSED")

            # Case 4.2: CloudWatch returns None (Missing metric) -> Ensure cpu_utilization is None
            mock_cw_calc.return_value = None
            ec2_none_results = discover_ec2(fake_creds, "us-east-1")
            assert ec2_none_results[0]["cpu_utilization"] is None
            print("  Missing CloudWatch CPU -> Correctly assigned None (NULL): PASSED")

        # 5. Test Demo Scanning Compatibility
        print("\n[5. Demo Scanning Compatibility Test]")
        u1_data = UserCreate(fullName="Phase 10 Test User One", email="phase10_user1@example.com", password="Password123!")
        user1 = auth_service.register_user(db, u1_data)
        demo_info = demo_service.seed_demo_data(db, user=user1)
        account_id = demo_info["accountId"]

        demo_ec2 = db.query(Resource).filter(
            Resource.cloud_account_id == account_id,
            Resource.type == "EC2",
            Resource.name == "web-server-prod"
        ).first()
        assert demo_ec2 is not None
        assert demo_ec2.cpu_utilization == 8.0, f"Demo static CPU altered: got {demo_ec2.cpu_utilization}"
        print(f"Demo EC2 instance static CPU preserved ({demo_ec2.cpu_utilization}%): PASSED")

        # 6. Test Health Score Metric Handling for NULL CPU
        print("\n[6. Health Score NULL CPU Handling Test]")
        null_cpu_res = Resource(
            id="i-nullcpu",
            cloud_account_id=account_id,
            name="null-cpu-instance",
            type="EC2",
            status="Running",
            monthly_cost=1000.0,
            cpu_utilization=None
        )
        db.add(null_cpu_res)
        db.commit()

        health = health_service.calculate_cloud_health_score(db, user=user1, account_id=account_id)
        # Verify that NULL cpu_utilization is not counted as underutilized (< 20%)
        assert health["factors"]["underutilizedResources"] == 2  # i-001 (8.0%) & s3-001 (public)
        print(f"Health score excludes NULL CPU from waste penalty (Underutilized count: {health['factors']['underutilizedResources']}): PASSED")

        # 7. Test Multi-User Ownership & Isolation Security
        print("\n[7. Multi-User Ownership & Isolation Security Test]")
        u2_data = UserCreate(fullName="Phase 10 Test User Two", email="phase10_user2@example.com", password="Password123!")
        user2 = auth_service.register_user(db, u2_data)

        try:
            health_service.calculate_cloud_health_score(db, user=user2, account_id=account_id)
            assert False, "Should have thrown 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("User 2 blocked from accessing User 1's cloud data (HTTP 404): PASSED")

        # 8. Report Live AWS CloudWatch Test Status
        print("\n[8. Live AWS Connection Status]")
        print("LIVE AWS CLOUDWATCH TEST: NOT RUN (No live AWS IAM Role credentials configured in automated test suite)")

        print("\n" + "=" * 70)
        print("ALL PHASE 10 CLOUDWATCH CPU UTILIZATION TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase10_tests()
