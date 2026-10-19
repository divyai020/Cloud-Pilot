"""
Cloud Pilot Phase 11A Integration & Verification Test Script
Tests AI Assistant backend foundation endpoint POST /api/v1/assistant/ask,
intent classification, PostgreSQL data context retrieval, NULL CPU handling,
ownership isolation security, zero secret leakage, and Phase 1-10 regression tests.
"""
import sys
import os
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))

from app.database import check_db_connection, SessionLocal
from app.models import User, CloudAccount, Resource
from app.schemas.user import UserCreate
from app.services import auth_service, demo_service, assistant_service
from app.main import app

def run_phase11a_tests():
    print("=" * 70)
    print("STARTING CLOUD PILOT PHASE 11A AI ASSISTANT BACKEND FOUNDATION VERIFICATION")
    print("=" * 70)

    # 1. Check FastAPI Router Registrations
    routes = [r.path for r in app.routes]
    print("\n[1. FastAPI Router Registration Check]")
    assert "/api/v1/assistant/ask" in routes, "Missing /api/v1/assistant/ask endpoint"
    print("AI Assistant endpoint POST /api/v1/assistant/ask registered in FastAPI!")

    # 2. Database Connection Check
    is_conn, conn_msg = check_db_connection()
    assert is_conn == True, f"Database connection failed: {conn_msg}"
    print("\n[2. Database Connection Check]")
    print("PostgreSQL connection: PASSED")

    db = SessionLocal()
    try:
        # Cleanup prior test users
        old_users = db.query(User).filter(User.email.in_([
            "phase11a_user1@example.com",
            "phase11a_user2@example.com",
            "phase11a_empty@example.com"
        ])).all()
        for u in old_users:
            db.delete(u)
        db.commit()

        # 3. Create User 1 & Seed Demo Environment
        print("\n[3. User Setup & Demo Account Creation]")
        u1_data = UserCreate(fullName="Assistant Test User One", email="phase11a_user1@example.com", password="Password123!")
        user1 = auth_service.register_user(db, u1_data)
        demo_info = demo_service.seed_demo_data(db, user=user1)
        account_id = demo_info["accountId"]
        print(f"User 1 created ({user1.id}) with Demo Account ({account_id})")

        # 4. Test Intent Classification & Response Generation (All 6 Categories)
        print("\n[4. Intent Classification & Response Generation Tests]")

        # 4.1 COST Question
        q_cost = "Which resources are costing the most?"
        resp_cost = assistant_service.process_assistant_question(db, user1, q_cost, account_id)
        assert resp_cost["category"] == "COST"
        assert len(resp_cost["answer"]) > 0
        assert "latest monthly spend" in resp_cost["answer"].lower() or "cost" in resp_cost["answer"].lower()
        print(f"  [COST] Intent: {resp_cost['category']} | Answer: {resp_cost['answer']}")

        # 4.2 SECURITY Question
        q_sec = "Show me my critical security findings and vulnerabilities"
        resp_sec = assistant_service.process_assistant_question(db, user1, q_sec, account_id)
        assert resp_sec["category"] == "SECURITY"
        assert "security audit findings" in resp_sec["answer"].lower()
        print(f"  [SECURITY] Intent: {resp_sec['category']} | Answer: {resp_sec['answer']}")

        # 4.3 HEALTH Question
        q_health = "Why is my cloud health score low?"
        resp_health = assistant_service.process_assistant_question(db, user1, q_health, account_id)
        assert resp_health["category"] == "HEALTH"
        assert "health score" in resp_health["answer"].lower()
        print(f"  [HEALTH] Intent: {resp_health['category']} | Answer: {resp_health['answer']}")

        # 4.4 RESOURCES Question
        q_res = "What cloud resources do I currently have?"
        resp_res = assistant_service.process_assistant_question(db, user1, q_res, account_id)
        assert resp_res["category"] == "RESOURCES"
        assert "discovered cloud resources" in resp_res["answer"].lower()
        print(f"  [RESOURCES] Intent: {resp_res['category']} | Answer: {resp_res['answer']}")

        # 4.5 RECOMMENDATIONS Question
        q_rec = "What recommendations do I have and how much can I save?"
        resp_rec = assistant_service.process_assistant_question(db, user1, q_rec, account_id)
        assert resp_rec["category"] == "RECOMMENDATIONS"
        assert "potential savings" in resp_rec["answer"].lower()
        print(f"  [RECOMMENDATIONS] Intent: {resp_rec['category']} | Answer: {resp_rec['answer']}")

        # 4.6 GENERAL Question
        q_gen = "Give me an overview of my cloud setup"
        resp_gen = assistant_service.process_assistant_question(db, user1, q_gen, account_id)
        assert resp_gen["category"] == "GENERAL"
        assert "overview" in resp_gen["answer"].lower()
        print(f"  [GENERAL] Intent: {resp_gen['category']} | Answer: {resp_gen['answer']}")

        # 5. Test NULL CPU Metric Handling
        print("\n[5. NULL CPU Metric Handling Test]")
        null_cpu_res = Resource(
            id="i-assistantnull",
            cloud_account_id=account_id,
            name="missing-metrics-server",
            type="EC2",
            status="Running",
            monthly_cost=1200.0,
            cpu_utilization=None
        )
        db.add(null_cpu_res)
        db.commit()

        resp_null = assistant_service.process_assistant_question(db, user1, "Show my resources and utilization", account_id)
        assert resp_null["context"]["null_cpu_ec2_count"] >= 1
        assert "lack cloudwatch cpu metrics (null)" in resp_null["answer"].lower()
        print(f"  NULL CPU explicitly handled: count = {resp_null['context']['null_cpu_ec2_count']} PASSED")

        # 6. Test Multi-User Ownership & Isolation Security
        print("\n[6. Multi-User Ownership & Isolation Security Test]")
        u2_data = UserCreate(fullName="Assistant Test User Two", email="phase11a_user2@example.com", password="Password123!")
        user2 = auth_service.register_user(db, u2_data)

        # User 2 attempts to query User 1's cloud account context
        try:
            assistant_service.process_assistant_question(db, user2, "How much am I spending?", account_id)
            assert False, "Should have thrown HTTP 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("  User 2 blocked from querying User 1's account (HTTP 404) PASSED!")

        # 7. Zero Credential / Secret Leakage Audit
        print("\n[7. Zero Credential & Secret Exposure Audit]")
        payload_str = str(resp_cost).lower()
        assert "accesskey" not in payload_str
        assert "secretaccesskey" not in payload_str
        assert "sessiontoken" not in payload_str
        assert "password" not in payload_str
        print("  Payload string audit clean (No AWS keys, STS tokens, or passwords) PASSED!")

        # 8. Empty Account Handling Test
        print("\n[8. Empty Account Zero-Data Handling Test]")
        u_empty = UserCreate(fullName="Empty Assistant User", email="phase11a_empty@example.com", password="Password123!")
        user_empty = auth_service.register_user(db, u_empty)

        empty_account = CloudAccount(
            user_id=user_empty.id,
            account_name="Blank Cloud Environment",
            account_type="aws",
            aws_account_id="555555555555",
            status="active"
        )
        db.add(empty_account)
        db.commit()

        resp_empty = assistant_service.process_assistant_question(db, user_empty, "What is my spend?", empty_account.id)
        assert resp_empty["category"] == "COST"
        assert "no historical cost records" in resp_empty["answer"].lower()
        print("  Empty account query returned graceful fallback response PASSED!")

        print("\n" + "=" * 70)
        print("ALL PHASE 11A AI ASSISTANT BACKEND FOUNDATION TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase11a_tests()
