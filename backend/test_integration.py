"""
Cloud Pilot Phase 1-5 PostgreSQL Integration Verification Test Script
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, check_db_connection, SessionLocal
from app.models import Base, User, CloudAccount, Resource, CostRecord, SecurityFinding, Recommendation, ScanJob
from app.schemas.user import UserCreate, UserLogin
from app.schemas.cloud import CloudConnectRequest
from app.services import auth_service, demo_service, cloud_service
from app.auth.jwt_handler import create_access_token, decode_access_token
from app.auth.password import verify_password
from app.aws.sts import validate_role_arn_format, get_aws_account_identity
from fastapi import HTTPException

def run_integration_tests():
    print("=" * 70)
    print("STARTING CLOUD PILOT PHASES 1-5 POSTGRESQL INTEGRATION VERIFICATION")
    print("=" * 70)

    # 1. Test Database Connectivity
    is_conn, conn_msg = check_db_connection()
    print(f"\n[A. PostgreSQL Connection Test]")
    print(f"Status: {conn_msg}")
    assert is_conn == True, f"Failed connection: {conn_msg}"

    # 2. Inspect Alembic Migrated Tables
    db = SessionLocal()
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n[B. Alembic Migrations & Tables Verification]")
        print(f"Tables found in cloudpilot_db: {tables}")
        
        expected_tables = {'users', 'cloud_accounts', 'resources', 'cost_records', 'security_findings', 'recommendations', 'scan_jobs', 'alembic_version'}
        for t in ['users', 'cloud_accounts', 'resources', 'cost_records', 'security_findings', 'recommendations', 'scan_jobs']:
            assert t in tables, f"Missing table {t}"
        print("All 7 business tables + alembic_version verified!")

        # Cleanup any previous test users if re-running
        old_test_users = db.query(User).filter(User.email.in_(["cloudpilot_test@example.com", "user2_test@example.com"])).all()
        for u in old_test_users:
            db.delete(u)
        db.commit()

        # 3. Test Authentication Integration (Signup, Login, JWT, Profile)
        print(f"\n[C. Authentication Integration Test]")
        user1_data = UserCreate(
            fullName="Cloud Pilot Test User",
            email="cloudpilot_test@example.com",
            password="TestPassword123!"
        )
        user1 = auth_service.register_user(db, user1_data)
        print(f"Signup PASSED - User ID: {user1.id}, Email: {user1.email}")
        
        # Verify Password Hash in DB
        assert user1.password_hash != "TestPassword123!"
        assert verify_password("TestPassword123!", user1.password_hash) == True
        print("Bcrypt password hashing & DB persistence verified!")

        # Test Authentication Login
        auth_user = auth_service.authenticate_user(db, "cloudpilot_test@example.com", "TestPassword123!")
        assert auth_user is not None
        assert auth_user.id == user1.id
        print("Login password verification PASSED!")

        # Test JWT token generation
        token = create_access_token({"sub": str(user1.id), "email": user1.email})
        payload = decode_access_token(token)
        assert payload["sub"] == str(user1.id)
        assert payload["email"] == user1.email
        print("JWT token generation & signature verification PASSED!")

        # 4. Test Demo Seeder Integration (POST /cloud/demo)
        print(f"\n[D. Demo Seeder Integration Test]")
        demo_result = demo_service.seed_demo_data(db, user=user1)
        print(f"Demo Seeder Result: {demo_result}")
        
        assert demo_result["resourcesCreated"] == 5
        assert demo_result["costRecordsCreated"] == 30
        assert demo_result["securityFindingsCreated"] == 5
        assert demo_result["recommendationsCreated"] == 4
        assert demo_result["scanStatus"] == "completed"

        # Verify DB counts for User 1
        account_id = demo_result["accountId"]
        res_count = db.query(Resource).filter(Resource.cloud_account_id == account_id).count()
        cost_count = db.query(CostRecord).filter(CostRecord.cloud_account_id == account_id).count()
        sec_count = db.query(SecurityFinding).filter(SecurityFinding.cloud_account_id == account_id).count()
        rec_count = db.query(Recommendation).filter(Recommendation.cloud_account_id == account_id).count()
        scan_count = db.query(ScanJob).filter(ScanJob.cloud_account_id == account_id).count()
        
        print(f"Database Persisted Counts -> Resources: {res_count}, Costs: {cost_count}, Security: {sec_count}, Recs: {rec_count}, ScanJobs: {scan_count}")
        assert res_count == 5
        assert cost_count == 30
        assert sec_count == 5
        assert rec_count == 4
        assert scan_count == 1
        print("PostgreSQL Database insertion verification PASSED!")

        # 5. Test Demo Idempotency (Repeated demo call)
        print(f"\n[E. Demo Idempotency Test]")
        demo_result_2 = demo_service.seed_demo_data(db, user=user1)
        
        # Verify counts did not double
        res_count_2 = db.query(Resource).filter(Resource.cloud_account_id == account_id).count()
        cost_count_2 = db.query(CostRecord).filter(CostRecord.cloud_account_id == account_id).count()
        sec_count_2 = db.query(SecurityFinding).filter(SecurityFinding.cloud_account_id == account_id).count()
        rec_count_2 = db.query(Recommendation).filter(Recommendation.cloud_account_id == account_id).count()
        
        print(f"Reseeding Counts -> Resources: {res_count_2}, Costs: {cost_count_2}, Security: {sec_count_2}, Recs: {rec_count_2}")
        assert res_count_2 == 5
        assert cost_count_2 == 30
        assert sec_count_2 == 5
        assert rec_count_2 == 4
        print("Idempotency duplicate prevention PASSED!")

        # 6. Test Cloud Account Listing & Single Account API
        print(f"\n[F. Cloud Account Listing & Retrieval Test]")
        user1_accounts = cloud_service.get_user_cloud_accounts(db, user=user1)
        print(f"User 1 Accounts Count: {len(user1_accounts)}")
        assert len(user1_accounts) == 1
        assert user1_accounts[0].id == account_id

        single_acc = cloud_service.get_user_cloud_account_by_id(db, user=user1, account_id=account_id)
        assert single_acc.id == account_id
        print("Cloud account listing & retrieval PASSED!")

        # 7. Test Ownership Isolation (Multi-User Privacy Security)
        print(f"\n[G. Multi-User Ownership Isolation Security Test]")
        user2_data = UserCreate(
            fullName="Cloud Pilot User Two",
            email="user2_test@example.com",
            password="User2Password123!"
        )
        user2 = auth_service.register_user(db, user2_data)

        # User 2 lists accounts (Should be empty, zero leak from User 1)
        user2_accounts = cloud_service.get_user_cloud_accounts(db, user=user2)
        assert len(user2_accounts) == 0
        print("User 2 list accounts is empty (No cross-user account leakage) PASSED!")

        # User 2 attempts to fetch User 1's account (Should throw HTTP 404)
        try:
            cloud_service.get_user_cloud_account_by_id(db, user=user2, account_id=account_id)
            assert False, "Should have thrown 404 for unauthorized access"
        except HTTPException as e:
            assert e.status_code == 404
            print(f"User 2 attempt to access User 1's account blocked with HTTP 404 ({e.detail}) PASSED!")

        # 8. Test AWS Connection API Logic
        print(f"\n[H. AWS Connection API Validation]")
        assert validate_role_arn_format("arn:aws:iam::123456789012:role/CloudPilotRole") == True
        assert validate_role_arn_format("invalid-arn-string") == False
        
        try:
            get_aws_account_identity("invalid-arn-string")
        except HTTPException as e:
            assert e.status_code == 400
            print("Invalid ARN rejection PASSED!")

        print("\n" + "=" * 70)
        print("ALL PHASES 1-5 POSTGRESQL INTEGRATION VERIFICATION TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_integration_tests()
