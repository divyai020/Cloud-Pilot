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

## Verification & Testing

1. Open Interactive API Documentation:
   `http://localhost:8000/docs`

2. Test Root Endpoint (`GET /`):
   - Browser URL: `http://localhost:8000/`
   - Expected Response when PostgreSQL is connected:
     ```json
     {
       "message": "Cloud Pilot API is running",
       "database": "connected"
     }
     ```
