"""
Cloud Pilot Phase 11B Integration & Verification Test Script
Tests Phase 11B local RAG retrieval layer:
- Local embeddings (sentence-transformers / fallback)
- FAISS vector index creation and top-K similarity retrieval
- Resource, Cost, Security Finding, Recommendation, and Health/Account chunking
- Account isolation & multi-tenant security
- Null CPU metric handling
- Zero secret/credential leakage
- Endpoints: POST /api/v1/assistant/ask and POST /api/v1/assistant/retrieve
- Regression test suite for Phase 1-11A
"""
import sys
import os
import uuid
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))

from app.database import check_db_connection, SessionLocal
from app.models import User, CloudAccount, Resource, CostRecord, SecurityFinding, Recommendation
from app.schemas.user import UserCreate
from app.services import auth_service, demo_service, assistant_service, retrieval_service
from app.main import app


def run_phase11b_tests():
    print("=" * 75)
    print("STARTING CLOUD PILOT PHASE 11B RAG RETRIEVAL LAYER VERIFICATION")
    print("=" * 75)

    # 1. Backend Startup & Router Verification
    print("\n[1. Backend Startup & FastAPI Router Check]")
    routes = [r.path for r in app.routes]
    assert "/api/v1/assistant/ask" in routes, "Missing /api/v1/assistant/ask endpoint"
    assert "/api/v1/assistant/retrieve" in routes, "Missing /api/v1/assistant/retrieve endpoint"
    print("FastAPI endpoints POST /api/v1/assistant/ask and POST /api/v1/assistant/retrieve registered!")

    # 2. Database Connection Check
    print("\n[2. Database Connection Check]")
    is_conn, conn_msg = check_db_connection()
    assert is_conn == True, f"Database connection failed: {conn_msg}"
    print("PostgreSQL database connection: PASSED")

    # 3. Retrieval Service Import Check
    print("\n[3. Retrieval Service Import Check]")
    assert hasattr(retrieval_service, "retrieve_relevant_context"), "Missing retrieve_relevant_context"
    assert hasattr(retrieval_service, "create_account_chunks"), "Missing create_account_chunks"
    assert hasattr(retrieval_service, "encode_texts"), "Missing encode_texts"
    assert hasattr(retrieval_service, "build_faiss_index_and_search"), "Missing build_faiss_index_and_search"
    print("Retrieval service imports and functions verified!")

    db = SessionLocal()
    try:
        # Cleanup prior test users
        old_users = db.query(User).filter(User.email.in_([
            "phase11b_user1@example.com",
            "phase11b_user2@example.com",
            "phase11b_empty@example.com"
        ])).all()
        for u in old_users:
            db.delete(u)
        db.commit()

        # 4. Embedding Generation Check
        print("\n[4. Embedding Generation Test]")
        sample_texts = ["EC2 instance i-001 monthly cost $1200", "S3 bucket public access risk"]
        embeddings = retrieval_service.encode_texts(sample_texts)
        assert embeddings.shape[0] == 2, f"Expected 2 embeddings, got {embeddings.shape[0]}"
        assert embeddings.shape[1] == 384, f"Expected 384 dimensions, got {embeddings.shape[1]}"
        print(f"Embedding generator output shape: {embeddings.shape} PASSED")

        # Setup User 1 and Demo Account
        print("\n[Setup User 1 with Demo Account]")
        u1_data = UserCreate(fullName="Phase 11B Test User One", email="phase11b_user1@example.com", password="Password123!")
        user1 = auth_service.register_user(db, u1_data)
        demo_info = demo_service.seed_demo_data(db, user=user1)
        account_id_1 = demo_info["accountId"]
        acct1 = db.query(CloudAccount).filter(CloudAccount.id == account_id_1).first()
        print(f"User 1 created ({user1.id}) with CloudAccount ({account_id_1})")

        # 5. FAISS Index Creation Test
        print("\n[5. FAISS Index Creation Test]")
        chunks_1 = retrieval_service.create_account_chunks(db, acct1)
        assert len(chunks_1) > 0, "Failed to create chunks from demo account"
        print(f"Created {len(chunks_1)} knowledge chunks for Account 1")

        # 6. Top-K Retrieval Test
        print("\n[6. Top-K Retrieval Test]")
        top_k_res = retrieval_service.retrieve_relevant_context(db, account_id_1, "high cost EC2 resources", top_k=3)
        assert len(top_k_res["results"]) <= 3, f"Expected <= 3 results, got {len(top_k_res['results'])}"
        assert top_k_res["total_chunks_indexed"] == len(chunks_1)
        assert top_k_res["fallback_used"] == False
        print(f"Top-3 retrieval returned {len(top_k_res['results'])} chunks! PASSED")

        # 7-13. Specific Domain Chunking & Retrieval Tests
        print("\n[7-13. Domain Retrieval & Ranking Tests]")

        # 7. Relevant Question Retrieval
        res_ec2 = retrieval_service.retrieve_relevant_context(db, account_id_1, "Which EC2 instance is expensive?", top_k=3)
        assert len(res_ec2["results"]) > 0
        top_type = res_ec2["results"][0]["source_type"]
        print(f"  Question: 'Which EC2 instance is expensive?' -> Top retrieved chunk type: '{top_type}' (Score: {res_ec2['results'][0]['score']:.4f})")

        # 9. Resource Retrieval
        res_res = retrieval_service.retrieve_relevant_context(db, account_id_1, "Show me server and database infrastructure", top_k=5)
        has_resource_chunk = any(r["source_type"] == "resource" for r in res_res["results"])
        assert has_resource_chunk, "Expected at least one resource chunk in top results"
        print("  Resource retrieval test: PASSED")

        # 10. Cost Retrieval
        res_cost = retrieval_service.retrieve_relevant_context(db, account_id_1, "What is my spend on EC2 service monthly?", top_k=5)
        has_cost_chunk = any(r["source_type"] in ["cost_record", "resource"] for r in res_cost["results"])
        assert has_cost_chunk, "Expected cost chunk in top results"
        print("  Cost retrieval test: PASSED")

        # 11. Security Finding Retrieval
        res_sec = retrieval_service.retrieve_relevant_context(db, account_id_1, "What critical security vulnerabilities exist?", top_k=5)
        has_sec_chunk = any(r["source_type"] == "security_finding" for r in res_sec["results"])
        assert has_sec_chunk, "Expected security finding chunk in top results"
        print("  Security finding retrieval test: PASSED")

        # 12. Recommendation Retrieval
        res_rec = retrieval_service.retrieve_relevant_context(db, account_id_1, "Give me suggestions to optimize cost and save money", top_k=5)
        has_rec_chunk = any(r["source_type"] == "recommendation" for r in res_rec["results"])
        assert has_rec_chunk, "Expected recommendation chunk in top results"
        print("  Recommendation retrieval test: PASSED")

        # 13. Health / Account Overview Retrieval
        res_health = retrieval_service.retrieve_relevant_context(db, account_id_1, "What is the health score of my cloud environment?", top_k=5)
        has_acct_chunk = any(r["source_type"] == "cloud_account" for r in res_health["results"])
        assert has_acct_chunk, "Expected cloud account chunk in top results"
        print("  Health & Account overview retrieval test: PASSED")

        # 14. Empty Account Graceful Fallback Test
        print("\n[14. Empty Account Handling Test]")
        u_empty = UserCreate(fullName="Phase 11B Empty User", email="phase11b_empty@example.com", password="Password123!")
        user_empty = auth_service.register_user(db, u_empty)
        empty_acct = CloudAccount(
            user_id=user_empty.id,
            account_name="Empty Cloud Environment",
            account_type="aws",
            aws_account_id="999999999999",
            status="active"
        )
        db.add(empty_acct)
        db.commit()

        res_empty = retrieval_service.retrieve_relevant_context(db, empty_acct.id, "What resources do I have?", top_k=5)
        assert res_empty["total_chunks_indexed"] >= 1  # At least cloud account chunk
        assert len(res_empty["results"]) > 0
        print("  Empty account handling PASSED!")

        # 15. NULL CPU Values Test
        print("\n[15. NULL CPU Value Handling Test]")
        null_cpu_res = Resource(
            id="i-nullcpu11b",
            cloud_account_id=account_id_1,
            name="null-metrics-server",
            type="EC2",
            status="Running",
            monthly_cost=800.0,
            cpu_utilization=None
        )
        db.add(null_cpu_res)
        db.commit()

        chunks_with_null = retrieval_service.create_account_chunks(db, acct1)
        null_chunk = [c for c in chunks_with_null if c.get("source_id") == "i-nullcpu11b"]
        assert len(null_chunk) == 1
        assert "NULL (No metrics)" in null_chunk[0]["content"]
        print("  NULL CPU metric formatted gracefully in chunk content PASSED!")

        # 16-18. Multi-User Ownership & Isolation Security Test
        print("\n[16-18. Multi-User Account Isolation Security Test]")
        u2_data = UserCreate(fullName="Phase 11B Test User Two", email="phase11b_user2@example.com", password="Password123!")
        user2 = auth_service.register_user(db, u2_data)
        demo_info_2 = demo_service.seed_demo_data(db, user=user2)
        account_id_2 = demo_info_2["accountId"]

        # Attempt to retrieve User 1 data using User 2 credentials/context via assistant router dependency logic
        try:
            # assistant_service.process_assistant_question validates user ownership
            assistant_service.process_assistant_question(db, user2, "Show resources", account_id_1)
            assert False, "Should have thrown 404 for unowned account_id"
        except HTTPException as e:
            assert e.status_code == 404
            print("  User 2 blocked from accessing User 1's account (HTTP 404) PASSED!")

        # Ensure retrieval for User 2 ONLY contains User 2's account_id
        res_u2 = retrieval_service.retrieve_relevant_context(db, account_id_2, "Show my resources", top_k=10)
        for chunk in res_u2["results"]:
            assert chunk["account_id"] == str(account_id_2), f"Account leak! Found {chunk['account_id']} in User 2 results"
            assert chunk["account_id"] != str(account_id_1)
        print("  Strict account isolation verified (Zero cross-account data leakage) PASSED!")

        # 19-20. Zero Secret Exposure Audit
        print("\n[19-20. Zero Secret Exposure Audit]")
        for chunk in chunks_1:
            content_lower = chunk["content"].lower()
            assert "accesskey" not in content_lower
            assert "secretaccesskey" not in content_lower
            assert "sessiontoken" not in content_lower
            assert "password" not in content_lower
            assert "jwt" not in content_lower
        print("  Text chunk privacy audit clean (No AWS keys, passwords, or JWTs) PASSED!")

        # 21. Existing Phase 11A Assistant Functionality
        print("\n[21. Phase 11A Backward Compatibility Test]")
        resp_ask = assistant_service.process_assistant_question(db, user1, "What are my total costs?", account_id_1)
        assert "category" in resp_ask
        assert "answer" in resp_ask
        assert "context" in resp_ask
        assert "sources" in resp_ask
        assert "retrieved_context" in resp_ask
        print("  Phase 11A assistant ask response structure intact with added retrieved_context! PASSED!")

        # 22. Phase 1-10 Regression Tests Check
        print("\n[22. Phase 1-10 Regression Verification]")
        assert acct1.user_id == user1.id
        assert len(acct1.resources) > 0
        assert len(acct1.cost_records) > 0
        assert len(acct1.security_findings) > 0
        print("  Database models, relationships, and seeding intact! PASSED!")

        print("\n" + "=" * 75)
        print("ALL PHASE 11B RAG RETRIEVAL LAYER VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 75)

    finally:
        db.close()


if __name__ == "__main__":
    run_phase11b_tests()
