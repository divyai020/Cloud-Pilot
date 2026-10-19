"""
Cloud Pilot Phase 9 Integration & Verification Test Script
Tests Cloud Health Score Engine, Scikit-learn Machine Learning Cost Forecasting,
Multi-User Ownership Security, Insufficient Data Handling, and Empty Data Handling against real PostgreSQL.
"""
import sys
import os
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))

from app.database import check_db_connection, SessionLocal
from app.models import User, CloudAccount, CostRecord
from app.schemas.user import UserCreate
from app.services import auth_service, demo_service, health_service, forecast_service
from app.main import app

def run_phase9_tests():
    print("=" * 70)
    print("STARTING CLOUD PILOT PHASE 9 HEALTH SCORE & COST FORECASTING VERIFICATION")
    print("=" * 70)

    # 1. Check Routes in FastAPI Application
    routes = [r.path for r in app.routes]
    print("\n[1. Router Registration Check]")
    expected_endpoints = [
        "/api/v1/analytics/health",
        "/api/v1/analytics/forecast",
        "/api/v1/dashboard/health",
        "/api/v1/dashboard/cost-forecast",
    ]
    for ep in expected_endpoints:
        assert ep in routes, f"Missing router endpoint: {ep}"
    print("All Phase 9 Health & Forecasting endpoints are registered in FastAPI!")

    # 2. Database Connection Check
    is_conn, conn_msg = check_db_connection()
    assert is_conn == True, f"Database connection failed: {conn_msg}"
    print("\n[2. Database Connection Check]")
    print("PostgreSQL connection: PASSED")

    db = SessionLocal()
    try:
        # Cleanup prior test users
        old_users = db.query(User).filter(User.email.in_([
            "phase9_user1@example.com",
            "phase9_user2@example.com",
            "phase9_sparse@example.com",
            "phase9_empty@example.com"
        ])).all()
        for u in old_users:
            db.delete(u)
        db.commit()

        # 3. Create User 1 & Seed Demo Environment
        print("\n[3. User Setup & Demo Account Creation]")
        u1_data = UserCreate(fullName="Phase 9 Test User One", email="phase9_user1@example.com", password="Password123!")
        user1 = auth_service.register_user(db, u1_data)
        demo_info = demo_service.seed_demo_data(db, user=user1)
        account_id = demo_info["accountId"]
        print(f"User 1 created ({user1.id}) with Demo Account ({account_id})")

        # 4. Test Cloud Health Score Engine
        print("\n[4. Cloud Health Score Engine Test]")
        health = health_service.calculate_cloud_health_score(db, user=user1, account_id=account_id)
        
        # Verify schema and clamping
        score = health["healthScore"]
        factors = health["factors"]
        assert 0 <= score <= 100, f"Score out of range: {score}"
        assert factors["criticalFindings"] == 1
        assert factors["highFindings"] == 2
        assert factors["mediumFindings"] == 2

        # Verify score formula: 100 - (1*10) - (2*5) - (2*2) - (waste_ratio*20)
        expected_deduction = (1 * 10) + (2 * 5) + (2 * 2) + (factors["cloudWasteRatio"] * 20.0)
        expected_score = max(0, min(100, int(round(100.0 - expected_deduction))))
        assert score == expected_score, f"Health score formula mismatch: got {score}, expected {expected_score}"

        # Verify PostgreSQL CloudAccount.health_score updated
        acc_db = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
        assert acc_db.health_score == score, f"DB health_score not updated: got {acc_db.health_score}, expected {score}"

        print(f"Calculated Health Score: {score}/100")
        print(f"Contributing Factors -> Critical: {factors['criticalFindings']}, High: {factors['highFindings']}, Medium: {factors['mediumFindings']}, Waste Ratio: {factors['cloudWasteRatio']}")
        print("PostgreSQL CloudAccount.health_score update PASSED!")
        print("Cloud Health Score Engine PASSED!")

        # 5. Test Scikit-learn Cost Forecasting Engine
        print("\n[5. Scikit-learn Machine Learning Cost Forecasting Test]")
        forecast = forecast_service.generate_cost_forecast(db, user=user1, account_id=account_id)
        
        assert forecast["sufficientData"] == True
        assert forecast["model"] == "LinearRegression"
        assert forecast["historicalMonthsCount"] == 6
        assert forecast["forecastMonthsCount"] == 3
        assert len(forecast["forecast"]) == 3
        assert forecast["r2Score"] is not None

        # Verify predictions are non-negative and periods are chronological
        forecast_periods = [f["period"] for f in forecast["forecast"]]
        print(f"Historical Months Count: {forecast['historicalMonthsCount']}")
        print(f"Baseline Training R^2 Metric: {forecast['r2Score']}")
        print(f"Forecast Horizon Periods: {forecast_periods}")
        for fp in forecast["forecast"]:
            assert fp["predictedCost"] >= 0.0, f"Negative forecast predicted: {fp}"
            print(f"  Forecast Period {fp['period']} -> Predicted Spend: ${fp['predictedCost']:,.2f}")

        print("Scikit-learn Cost Forecasting Engine PASSED!")

        # 6. Test Insufficient Data Handling (< 3 historical months)
        print("\n[6. Insufficient Historical Data Handling Test]")
        u_sparse = UserCreate(fullName="Sparse Data User", email="phase9_sparse@example.com", password="Password123!")
        user_sparse = auth_service.register_user(db, u_sparse)

        sparse_account = CloudAccount(
            user_id=user_sparse.id,
            account_name="Sparse Cloud Account",
            account_type="aws",
            aws_account_id="777777777777",
            status="active"
        )
        db.add(sparse_account)
        db.commit()

        # Seed only 1 month of cost records
        rec = CostRecord(cloud_account_id=sparse_account.id, service_name="EC2", period_date=demo_service.date(2026, 1, 1), amount=500.0)
        db.add(rec)
        db.commit()

        sparse_forecast = forecast_service.generate_cost_forecast(db, user=user_sparse, account_id=sparse_account.id)
        assert sparse_forecast["sufficientData"] == False
        assert sparse_forecast["forecastMonthsCount"] == 0
        assert len(sparse_forecast["forecast"]) == 0
        assert "Insufficient historical data" in sparse_forecast["message"]
        print(f"Sparse Data Response -> sufficientData: {sparse_forecast['sufficientData']}, Message: '{sparse_forecast['message']}'")
        print("Insufficient Data Handling PASSED!")

        # 7. Test Multi-User Ownership Security
        print("\n[7. Multi-User Ownership & Isolation Security Test]")
        u2_data = UserCreate(fullName="Phase 9 Test User Two", email="phase9_user2@example.com", password="Password123!")
        user2 = auth_service.register_user(db, u2_data)

        # User 2 attempts to calculate User 1's health score
        try:
            health_service.calculate_cloud_health_score(db, user=user2, account_id=account_id)
            assert False, "Should have thrown HTTP 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("User 2 blocked from reading User 1's Health Score (HTTP 404) PASSED!")

        # User 2 attempts to generate User 1's cost forecast
        try:
            forecast_service.generate_cost_forecast(db, user=user2, account_id=account_id)
            assert False, "Should have thrown HTTP 404"
        except HTTPException as e:
            assert e.status_code == 404
            print("User 2 blocked from reading User 1's Cost Forecast (HTTP 404) PASSED!")

        # 8. Test Empty Account Analytics Handling
        print("\n[8. Empty Account Zero-Data Handling Test]")
        u_empty = UserCreate(fullName="Empty Analytics User", email="phase9_empty@example.com", password="Password123!")
        user_empty = auth_service.register_user(db, u_empty)

        empty_account = CloudAccount(
            user_id=user_empty.id,
            account_name="Empty Environment",
            account_type="aws",
            aws_account_id="666666666666",
            status="active"
        )
        db.add(empty_account)
        db.commit()

        empty_health = health_service.calculate_cloud_health_score(db, user=user_empty, account_id=empty_account.id)
        empty_forecast = forecast_service.generate_cost_forecast(db, user=user_empty, account_id=empty_account.id)

        assert empty_health["healthScore"] == 100
        assert empty_forecast["sufficientData"] == False
        print("Empty Account Health Score (100/100) & Forecast Zero-Data handling PASSED!")

        print("\n" + "=" * 70)
        print("ALL PHASE 9 CLOUD HEALTH SCORE & COST FORECASTING TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase9_tests()
