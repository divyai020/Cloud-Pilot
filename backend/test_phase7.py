"""
Cloud Pilot Phase 7 Integration & Verification Test Script
Tests all Dashboard & Cost Analysis APIs against real PostgreSQL data.
"""
import sys
import os
from sqlalchemy import func
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))

from app.database import check_db_connection, SessionLocal
from app.models import User, CloudAccount, Resource, CostRecord, SecurityFinding, Recommendation, ScanJob
from app.schemas.user import UserCreate
from app.services import auth_service, demo_service, dashboard_service
from app.main import app

def run_phase7_tests():
    print("=" * 70)
    print("STARTING CLOUD PILOT PHASE 7 DASHBOARD & COST ANALYSIS VERIFICATION")
    print("=" * 70)

    # 1. Check Routes in FastAPI Application
    routes = [r.path for r in app.routes]
    print("\n[1. Router Registration Check]")
    expected_endpoints = [
        "/api/v1/dashboard/summary",
        "/api/v1/dashboard/resources",
        "/api/v1/dashboard/cost-summary",
        "/api/v1/dashboard/cost-trend",
        "/api/v1/dashboard/cost-by-service",
        "/api/v1/dashboard/security-summary",
        "/api/v1/dashboard/recommendations",
        "/api/v1/dashboard/latest-scan",
    ]
    for ep in expected_endpoints:
        assert ep in routes, f"Missing router endpoint: {ep}"
    print("All Phase 8 Dashboard & Cost endpoints are registered in FastAPI!")

    # 2. Database Connection Test
    is_conn, conn_msg = check_db_connection()
    assert is_conn == True, f"Database connection failed: {conn_msg}"
    print("\n[2. Database Connection Check]")
    print("PostgreSQL connection: PASSED")

    db = SessionLocal()
    try:
        # Cleanup prior test users
        old_users = db.query(User).filter(User.email.in_(["phase7_user1@example.com", "phase7_user2@example.com", "phase7_empty@example.com"])).all()
        for u in old_users:
            db.delete(u)
        db.commit()

        # 3. Create User 1 & Seed Demo Environment
        print("\n[3. User Setup & Demo Account Creation]")
        u1_data = UserCreate(fullName="Dashboard Test User One", email="phase7_user1@example.com", password="Password123!")
        user1 = auth_service.register_user(db, u1_data)
        demo_info = demo_service.seed_demo_data(db, user=user1)
        account_id = demo_info["accountId"]
        print(f"User 1 created ({user1.id}) with Demo Account ({account_id})")

        # 4. Test API 1 — Dashboard Summary & Numerical Verification
        print("\n[4. API 1 — GET /api/v1/dashboard/summary]")
        summary = dashboard_service.get_dashboard_summary(db, user=user1, account_id=account_id)
        
        # PostgreSQL Numerical Cross-Checks
        db_res_count = db.query(func.count(Resource.id)).filter(Resource.cloud_account_id == account_id).scalar()
        db_total_cost = db.query(func.sum(CostRecord.amount)).filter(CostRecord.cloud_account_id == account_id).scalar()
        db_rec_count = db.query(func.count(Recommendation.id)).filter(Recommendation.cloud_account_id == account_id).scalar()
        db_rec_savings = db.query(func.sum(Recommendation.estimated_savings)).filter(Recommendation.cloud_account_id == account_id).scalar()

        assert summary["totalResources"] == db_res_count, f"Mismatch resources: {summary['totalResources']} vs {db_res_count}"
        assert abs(summary["totalCost"] - db_total_cost) < 0.01, f"Mismatch cost: {summary['totalCost']} vs {db_total_cost}"
        assert summary["recommendationsCount"] == db_rec_count, f"Mismatch recommendations count: {summary['recommendationsCount']} vs {db_rec_count}"
        assert abs(summary["totalEstimatedSavings"] - db_rec_savings) < 0.01, f"Mismatch savings: {summary['totalEstimatedSavings']} vs {db_rec_savings}"
        
        print(f"Summary Total Resources: {summary['totalResources']}")
        print(f"Summary Total Cost: ${summary['totalCost']:,.2f}")
        print(f"Summary Monthly Cost: ${summary['monthlyCost']:,.2f}")
        print(f"Summary Security Findings: {summary['securityFindings']}")
        print(f"Summary Recommendations Count: {summary['recommendationsCount']}")
        print(f"Summary Total Savings: ${summary['totalEstimatedSavings']:,.2f}")
        print("Dashboard Summary API & Numerical Verification PASSED!")

        # 5. Test API 2 — Resource Summary
        print("\n[5. API 2 — GET /api/v1/dashboard/resources]")
        res_summary = dashboard_service.get_resource_summary(db, user=user1, account_id=account_id)
        assert res_summary["totalResources"] == 5
        assert res_summary["byType"]["EC2"] == 2
        assert res_summary["byType"]["S3"] == 1
        assert res_summary["byType"]["RDS"] == 1
        assert res_summary["byType"]["Lambda"] == 1
        print(f"Resource Summary by Type: {res_summary['byType']}")
        print("Resource Summary API PASSED!")

        # 6. Test API 3 — Cost Summary & Month-over-Month Analytics
        print("\n[6. API 3 — GET /api/v1/dashboard/cost-summary]")
        cost_summary = dashboard_service.get_cost_summary(db, user=user1, account_id=account_id)
        print(f"Latest Month Cost: ${cost_summary['latestMonthCost']:,.2f}")
        print(f"Previous Month Cost: ${cost_summary['previousMonthCost']:,.2f}")
        print(f"MoM Difference: ${cost_summary['difference']:,.2f}")
        print(f"MoM Change: {cost_summary['percentageChange']}%")

        expected_diff = round(cost_summary['latestMonthCost'] - cost_summary['previousMonthCost'], 2)
        assert cost_summary['difference'] == expected_diff
        print("Cost Summary API & Month-over-Month Analytics PASSED!")

        # 7. Test API 4 — Cost Trend (Chronological Lines)
        print("\n[7. API 4 — GET /api/v1/dashboard/cost-trend]")
        cost_trend = dashboard_service.get_cost_trend(db, user=user1, account_id=account_id)
        periods = [t["period"] for t in cost_trend["trend"]]
        print(f"Cost Trend Periods (Sorted): {periods}")
        assert len(periods) == 6
        assert periods == sorted(periods), "Trend periods must be chronological"
        print("Cost Trend API PASSED!")

        # 8. Test API 5 — Cost By Service
        print("\n[8. API 5 — GET /api/v1/dashboard/cost-by-service]")
        cost_by_svc = dashboard_service.get_cost_by_service(db, user=user1, account_id=account_id)
        svc_names = [s["service"] for s in cost_by_svc["services"]]
        print(f"Services Breakdown: {cost_by_svc['services']}")
        assert "EC2" in svc_names and "RDS" in svc_names and "S3" in svc_names
        print("Cost By Service API PASSED!")

        # 9. Test API 6 — Security Summary
        print("\n[9. API 6 — GET /api/v1/dashboard/security-summary]")
        sec_summary = dashboard_service.get_security_summary(db, user=user1, account_id=account_id)
        assert sec_summary["totalFindings"] == 5
        assert sec_summary["bySeverity"]["Critical"] == 1
        assert sec_summary["bySeverity"]["High"] == 2
        print(f"Security Findings Summary: {sec_summary}")
        print("Security Summary API PASSED!")

        # 10. Test API 7 — Recommendation Summary
        print("\n[10. API 7 — GET /api/v1/dashboard/recommendations]")
        rec_summary = dashboard_service.get_recommendation_summary(db, user=user1, account_id=account_id)
        assert rec_summary["totalRecommendations"] == 4
        assert rec_summary["totalEstimatedSavings"] == 6700.0  # 1600 + 2100 + 1800 + 1200
        print(f"Recommendations Count: {rec_summary['totalRecommendations']}, Savings: ${rec_summary['totalEstimatedSavings']:,.2f}")
        print("Recommendations Summary API PASSED!")

        # 11. Test API 8 — Latest Scan
        print("\n[11. API 8 — GET /api/v1/dashboard/latest-scan]")
        latest_scan = dashboard_service.get_latest_scan_summary(db, user=user1, account_id=account_id)
        assert latest_scan is not None
        assert latest_scan["status"] == "completed"
        assert latest_scan["progress"] == 100
        print(f"Latest Scan Status: {latest_scan['status']}, Progress: {latest_scan['progress']}%")
        print("Latest Scan API PASSED!")

        # 12. Test Multi-User Ownership Security & Cross-User Isolation
        print("\n[12. Multi-User Ownership & Isolation Security Test]")
        u2_data = UserCreate(fullName="Dashboard Test User Two", email="phase7_user2@example.com", password="Password123!")
        user2 = auth_service.register_user(db, u2_data)

        try:
            dashboard_service.get_dashboard_summary(db, user=user2, account_id=account_id)
            assert False, "Should have thrown HTTP 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("User 2 blocked from accessing User 1's Dashboard Summary (HTTP 404) PASSED!")

        # 13. Test Empty Account Analytics (Zero-Data Handling)
        print("\n[13. Empty Account Zero-Data Analytics Test]")
        u_empty = UserCreate(fullName="Empty Account User", email="phase7_empty@example.com", password="Password123!")
        user_empty = auth_service.register_user(db, u_empty)

        empty_account = CloudAccount(
            user_id=user_empty.id,
            account_name="Empty Cloud Environment",
            account_type="aws",
            aws_account_id="999999999999",
            status="active"
        )
        db.add(empty_account)
        db.commit()

        empty_summary = dashboard_service.get_dashboard_summary(db, user=user_empty, account_id=empty_account.id)
        assert empty_summary["totalResources"] == 0
        assert empty_summary["totalCost"] == 0.0
        assert empty_summary["recommendationsCount"] == 0
        assert empty_summary["latestScan"] is None
        print("Empty Account Analytics (Zero Data Handling) PASSED!")

        print("\n" + "=" * 70)
        print("ALL PHASE 7 DASHBOARD & COST ANALYSIS TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase7_tests()
