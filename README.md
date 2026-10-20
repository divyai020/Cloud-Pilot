# ☁️ CloudPilot — AI-Powered Cloud Governance & FinOps Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**CloudPilot** is an intelligent, full-stack cloud governance and FinOps platform designed to help organizations detect cloud security misconfigurations, rightsize over-provisioned infrastructure, and automate cost-saving remediations.

---

## 🌟 Key Features

### 1. 🛡️ Automated Cloud Security & Compliance
- **CIS AWS Foundations Benchmark Auditing**: Scans S3 buckets, Security Groups, IAM keys, and RDS instances.
- **Vulnerability Classification**: Flags Critical, High, Medium, and Low security findings.
- **Blast Radius & Remediation**: Generates instant 1-Click fix scripts in **AWS CLI**, **Terraform (HCL)**, and **Python (Boto3)** with safe rollback commands.

### 2. 💰 FinOps & Cost Optimization
- **Idle Resource Detection**: Flags unattached EBS volumes, idle EC2 instances, and unutilized Elastic IPs.
- **Rightsizing Engine**: Compares historical CPU utilization against provisioned EC2 instance types to recommend cheaper alternatives.
- **Interactive Roadmap**: Step-by-step remediation plan with live progress tracking and monthly projected savings calculations.

### 3. 🗺️ Interactive Cloud Architecture Map
- Visualizes multi-region cloud topology including **VPC subnets**, **Compute clusters**, **Databases**, **API Gateways**, and **DNS (Route 53)**.
- Deep Inspector Drawer displaying live configuration metrics, tags, and security attributes.

### 4. 🔔 DevOps Incident Webhook Dispatcher
- Real-time webhook integration with **Discord** and **Slack**.
- Instantly dispatches critical incident cards containing vulnerability details, health score drops, and one-click remediation commands to incident channels.

### 5. 📄 1-Click Executive PDF Report Export
- Automatically generates and downloads an executive-ready compliance and financial audit summary report.

---

## 🏗️ Architecture & Tech Stack

```text
├── frontend/             # React 18 + Vite SPA
│   ├── src/pages/        # Dashboard, Security, Cost, Resource Map, Roadmap, Simulator
│   ├── src/services/     # API connectors, PDF export, Discord alert dispatch
│   └── src/data/         # Cloud infrastructure schema & sample environments
│
├── backend/              # FastAPI Python Backend
│   ├── app/aws/          # Boto3 AWS STS AssumeRole & CloudWatch telemetry collectors
│   ├── app/models/       # PostgreSQL SQLAlchemy relational models
│   ├── app/routers/      # REST API endpoints (Auth, Cloud, Scan, Assistant)
│   └── app/services/     # FinOps heuristics & RAG vector retrieval engine
│
└── cloud_pilot_infrastructure.json # Enterprise cloud snapshot benchmark
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (Local or Cloud instance)

### 1. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Accessible at: `http://localhost:5173`

### 2. Run the Backend
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API & Swagger Docs at: `http://localhost:8000/docs`

---

## 🔒 Security Best Practices
- **Zero Raw Key Storage**: All AWS connectivity uses cross-account **IAM Role ARNs** and temporary **AWS STS AssumeRole** tokens.
- **Air-Gapped / Offline Support**: Full support for scanning offline infrastructure snapshot JSON exports without exposing live cloud credentials.
