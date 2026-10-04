# Cloud Pilot Backend — Phase 1 Setup Guide

FastAPI Backend for **Cloud Pilot – AI-Powered Cloud Governance Platform**.

---

## Phase 1 Overview

Phase 1 provides a minimal working FastAPI application that verifies real connectivity to a PostgreSQL database.

---

## Setup Instructions

### 1. Create PostgreSQL Database
Ensure PostgreSQL is installed and running on your system.
Open your terminal or PostgreSQL prompt (`psql` / pgAdmin) and execute:

```sql
CREATE DATABASE cloudpilot_db;
```

### 2. Create Python Virtual Environment
Navigate to the `backend/` folder in your terminal:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Linux/macOS**:
  ```bash
  source venv/bin/activate
  ```

### 3. Install Requirements
```bash
pip install -r requirements.txt
```

### 4. Create `.env` Configuration File
Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and replace `YOUR_PASSWORD` with your actual PostgreSQL password:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cloudpilot_db
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 5. Run FastAPI Server
```bash
uvicorn app.main:app --reload
```


---

## Phase 10 — AWS CloudWatch CPU Utilization Integration

Phase 10 replaces hardcoded EC2 CPU utilization placeholders with scan-time AWS CloudWatch metric retrieval.

### CloudWatch Architecture:
- **Metric Requested**: `AWS/EC2` $\rightarrow$ `CPUUtilization` (Dimension: `InstanceId`).
- **Aggregation Window**: 14-day historical daily average (`Period=86400`, `Statistics=['Average']`).
- **Scan-Time Retrieval**: Metrics are requested dynamically during AWS resource discovery via Boto3 and stored in PostgreSQL (`Resource.cpu_utilization`). This is **scan-time retrieval**, NOT continuous real-time streaming.
- **Missing Metric Behavior**: If CloudWatch returns empty datapoints or access is denied, `cpu_utilization` is safely set to `None` (SQL `NULL`).
- **Required AWS IAM Permissions**:
  - `ec2:DescribeInstances`
  - `s3:ListAllMyBuckets`, `s3:GetBucketPublicAccessBlock`
  - `rds:DescribeDBInstances`
  - `lambda:ListFunctions`
  - `iam:ListUsers`
  - `cloudwatch:GetMetricStatistics`


---

## Phase 11B — Local RAG Retrieval Layer (No LLM Yet)

Phase 11B adds a controlled local RAG retrieval layer to retrieve account-scoped cloud governance context for user queries.

### Phase 11B Overview:
- **Retrieval Engine**: Ephemeral per-account FAISS vector similarity search (`faiss-cpu`).
- **Embedding Model**: Local `sentence-transformers` (`all-MiniLM-L6-v2`, 384 dimensions) with deterministic fallback vector generation for offline environments.
- **Indexed Data Sources**:
  1. Cloud Accounts (Name, type, region, status, health score)
  2. Cloud Resources (ID, name, type, region, status, monthly cost, CPU utilization, public access, risk level)
  3. Cost Records (Service, period date, amount)
  4. Security Findings (Title, severity, description, recommendation, status, resource)
  5. Optimization Recommendations (Title, category, priority, estimated savings, description)
- **Account Isolation & Multi-Tenancy**: 100% strict account scoping using JWT auth and PostgreSQL ownership validation (`get_user_cloud_account`). Vector indexes are constructed dynamically per account to prevent cross-account data leakage.
- **Endpoints**:
  - `POST /api/v1/assistant/ask` (Enhanced with `retrieved_context` chunks while preserving Phase 11A compatibility)
  - `POST /api/v1/assistant/retrieve` (Internal / testing RAG retrieval endpoint)

> **Important Note**: Phase 11B provides retrieval only. It does not generate LLM responses. Phase 11C will integrate the retrieved context with an LLM.


---

## Phase 11C — LLM Integration Layer

Phase 11C adds an LLM generation layer on top of Phase 11B retrieval context with automatic rule-based fallback.

### Phase 11C Overview:
- **LLM Abstraction**: [`app/services/llm_service.py`](file:///c:/Users/SHRAVYA%20HEGDE/Downloads/Cloud-Pilot-main/Cloud-Pilot-main/backend/app/services/llm_service.py) provides a provider-agnostic interface (`generate_answer`).
- **Data Flow**: `User Question` $\rightarrow$ `JWT Authentication` $\rightarrow$ `Ownership Validation` $\rightarrow$ `Phase 11B RAG Retrieval` $\rightarrow$ `Sanitize & Delimit Context` $\rightarrow$ `LLM Prompt` $\rightarrow$ `LLM Answer` $\rightarrow$ `Response Payload`.
- **LLM Isolation & Read-Only Rule**: The LLM does NOT query PostgreSQL directly, does NOT access AWS APIs directly, and cannot perform AWS write or modification actions.
- **Prompt Injection Safeguards**: System prompt explicitly instructs the LLM to treat the retrieved context section (`--- BEGIN RETRIEVED CLOUD PILOT CONTEXT ---`) as untrusted database records (DATA ONLY) and ignore any command overrides embedded inside retrieved data.
- **Rule-Based Fallback**: If `LLM_API_KEY` is missing, invalid, times out, rate-limited, or network fails, the assistant automatically falls back to Phase 11A deterministic rule-based answer generation (`generation_mode: "rule_based_fallback"`).
- **Environment Settings**:
  - `LLM_PROVIDER`: `openai`, `gemini`, `mock`
  - `LLM_MODEL`: `gpt-3.5-turbo`
  - `LLM_API_KEY`: `your_llm_api_key_here`
  - `LLM_TIMEOUT`: `10`
- **Testing**: Automated tests mock the LLM provider interface (`set_mock_llm_handler`) so test suites run offline without requiring paid API keys.


---

## Phase 12 — Cost Simulator & Phased Optimization Roadmap

Phase 12 adds read-only computational cost simulation and a phased optimization roadmap.

### Phase 12 Overview:
- **Cost Simulator Endpoint**: `POST /api/v1/simulator/cost`
  - Read-only, deterministic simulation for EC2 and RDS resources.
  - Supports target monthly cost ($), target instance type (e.g. `t3.medium`), or percentage reduction (e.g. 20%).
  - Does NOT mutate database state and does NOT call AWS write APIs.
  - Enforces 100% multi-tenant account isolation (`get_user_cloud_account`).
- **Phased Optimization Roadmap Endpoint**: `GET /api/v1/reports/roadmap`
  - Reuses existing recommendations to structure actionable items into 3 execution stages:
    1. Phase 1: Immediate Action (Days 1-30) — High & Critical priority items
    2. Phase 2: Medium-Term Optimization (Days 31-90) — Medium priority items
    3. Phase 3: Long-Term Governance (Days 90+) — Maintenance items
- **Remaining Backend Audit Results**:
  - *Implemented*: Cost Simulator API (`/simulator/cost`), Phased Optimization Roadmap API (`/reports/roadmap`), User Profile API (`/users/profile`).
  - *Intentionally Deferred*: Resource Topology Map (no relationship schema in database), Activity Audit Log (no activity history table).

