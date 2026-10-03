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

