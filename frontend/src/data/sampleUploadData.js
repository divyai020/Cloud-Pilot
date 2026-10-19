export const sampleUploadData = {
  accountName: "FinTech Enterprise Production Cloud",
  cloudProvider: "AWS",
  environment: "Production",
  scanTimestamp: "2026-10-09T10:30:00Z",
  summary: {
    cloudHealthScore: 61,
    monthlyCost: 115400,
    potentialSavings: 32800,
    securityIssues: 7,
    activeResources: 10
  },
  resources: [
    {
      id: "i-098a12bc",
      name: "ecommerce-api-gateway",
      type: "EC2",
      instanceType: "c5.2xlarge",
      region: "ap-south-1",
      status: "Running",
      cpuUtilization: 78,
      memoryUtilization: 82,
      monthlyCost: 18400,
      risk: "Medium"
    },
    {
      id: "i-011c34de",
      name: "payment-processing-worker",
      type: "EC2",
      instanceType: "t3.xlarge",
      region: "ap-south-1",
      status: "Running",
      cpuUtilization: 11,
      memoryUtilization: 24,
      monthlyCost: 7200,
      risk: "High"
    },
    {
      id: "i-044f56gh",
      name: "auth-session-manager",
      type: "EC2",
      instanceType: "t3.medium",
      region: "ap-south-1",
      status: "Running",
      cpuUtilization: 48,
      memoryUtilization: 52,
      monthlyCost: 3800,
      risk: "Low"
    },
    {
      id: "i-077e89jk",
      name: "legacy-etl-job-runner",
      type: "EC2",
      instanceType: "m5.xlarge",
      region: "us-east-1",
      status: "Stopped",
      cpuUtilization: 0,
      memoryUtilization: 0,
      monthlyCost: 2600,
      risk: "Medium"
    },
    {
      id: "s3-kyc-vault",
      name: "fintech-kyc-documents",
      type: "S3",
      region: "ap-south-1",
      status: "Active",
      storageGB: 8500,
      monthlyCost: 9800,
      publicAccess: true,
      risk: "Critical"
    },
    {
      id: "s3-audit-logs",
      name: "application-audit-logs",
      type: "S3",
      region: "ap-south-1",
      status: "Active",
      storageGB: 14200,
      monthlyCost: 12400,
      publicAccess: false,
      risk: "Low"
    },
    {
      id: "rds-prod-01",
      name: "postgres-customer-orders-db",
      type: "RDS",
      instanceType: "db.r5.2xlarge",
      region: "ap-south-1",
      status: "Available",
      cpuUtilization: 32,
      storageGB: 1500,
      monthlyCost: 36500,
      risk: "Critical"
    },
    {
      id: "rds-replica-01",
      name: "postgres-analytics-replica",
      type: "RDS",
      instanceType: "db.r5.xlarge",
      region: "ap-south-1",
      status: "Available",
      cpuUtilization: 22,
      storageGB: 1500,
      monthlyCost: 18200,
      risk: "Medium"
    },
    {
      id: "lambda-pdf-gen",
      name: "invoice-pdf-generator",
      type: "Lambda",
      region: "ap-south-1",
      status: "Active",
      invocations: 94000,
      monthlyCost: 2800,
      risk: "Low"
    },
    {
      id: "lambda-fraud-eng",
      name: "realtime-fraud-evaluator",
      type: "Lambda",
      region: "ap-south-1",
      status: "Active",
      invocations: 185000,
      monthlyCost: 3700,
      risk: "Medium"
    }
  ],
  costBreakdown: {
    EC2: 32000,
    RDS: 54700,
    S3: 22200,
    Lambda: 6500,
    Other: 0
  },
  costTrend: [
    { month: "Jan", cost: 78000 },
    { month: "Feb", cost: 84500 },
    { month: "Mar", cost: 89000 },
    { month: "Apr", cost: 96200 },
    { month: "May", cost: 104000 },
    { month: "Jun", cost: 111500 },
    { month: "Jul", cost: 115400 }
  ],
  securityFindings: [
    {
      id: "SEC-101",
      title: "Public read/write access detected on KYC bucket",
      resource: "fintech-kyc-documents",
      severity: "Critical",
      category: "Public Resources",
      description: "Bucket policy and ACL permit world-readable access to sensitive customer identification records.",
      recommendation: "Enable AWS S3 Block Public Access immediately and restrict IAM principal access policies."
    },
    {
      id: "SEC-102",
      title: "Unencrypted customer database volume at rest",
      resource: "postgres-customer-orders-db",
      severity: "Critical",
      category: "Data Protection",
      description: "Database storage volume does not have AWS KMS AES-256 server-side encryption enabled.",
      recommendation: "Take a snapshot, copy snapshot with KMS customer-managed key encryption, and restore cluster."
    },
    {
      id: "SEC-103",
      title: "SSH Port 22 open to 0.0.0.0/0 on API cluster",
      resource: "ecommerce-api-gateway",
      severity: "Critical",
      category: "Network",
      description: "Security Group sg-api-public allows inbound TCP port 22 from entire Internet CIDR block.",
      recommendation: "Restrict SSH to corporate bastion or switch to AWS Systems Manager Session Manager (SSM)."
    },
    {
      id: "SEC-104",
      title: "Overprivileged IAM execution role with AdministratorAccess",
      resource: "lambda-fraud-eng",
      severity: "High",
      category: "IAM",
      description: "Lambda service role grants '*' action permissions on all AWS resource ARNs.",
      recommendation: "Apply least-privilege scoping to CloudWatch Logs and DynamoDB read actions."
    },
    {
      id: "SEC-105",
      title: "Stopped EC2 instance incurring persistent EBS cost",
      resource: "legacy-etl-job-runner",
      severity: "High",
      category: "Data Protection",
      description: "Instance has remained stopped for 47 days while attached gp3 root and data volumes accrue unmonitored charges.",
      recommendation: "Create AMI backup snapshot and terminate the idle instance."
    },
    {
      id: "SEC-106",
      title: "Underutilized RDS Multi-AZ standby replica",
      resource: "postgres-analytics-replica",
      severity: "Medium",
      category: "Network",
      description: "Analytics read replica operates below 25% utilization across business peak periods.",
      recommendation: "Enable Aurora Serverless v2 auto-scaling or schedule off-peak stop."
    },
    {
      id: "SEC-107",
      title: "Missing lifecycle policy for cold S3 audit logs",
      resource: "application-audit-logs",
      severity: "Medium",
      category: "Data Protection",
      description: "Logs older than 90 days are retained in standard S3 tier rather than Glacier Instant Retrieval.",
      recommendation: "Deploy S3 Lifecycle configuration rule transition to S3 Glacier Flexible Retrieval after 90 days."
    }
  ],
  recommendations: [
    {
      id: "REC-101",
      title: "Downsize idle payment-processing worker",
      resource: "payment-processing-worker",
      priority: "High",
      description: "Average CPU is 11%. Downsizing from t3.xlarge to t3.medium will cut hourly cost by 65%.",
      estimatedSavings: 4800
    },
    {
      id: "REC-102",
      title: "Transition cold audit logs to S3 Glacier",
      resource: "application-audit-logs",
      priority: "High",
      description: "Archiving 14.2 TB to Glacier Instant Retrieval reduces gigabyte storage rates by 68%.",
      estimatedSavings: 8400
    },
    {
      id: "REC-103",
      title: "Downsize over-provisioned primary database",
      resource: "postgres-customer-orders-db",
      priority: "High",
      description: "CPU is 32% during peak sales. Right-size from db.r5.2xlarge to db.r5.xlarge or Graviton3 db.r6g.xlarge.",
      estimatedSavings: 12600
    },
    {
      id: "REC-104",
      title: "Purchase 1-Year Compute Savings Plan",
      resource: "All EC2 Workloads",
      priority: "Medium",
      description: "Commit to baseline compute consumption for 34% discount on steady-state web instances.",
      estimatedSavings: 5200
    },
    {
      id: "REC-105",
      title: "Terminate stopped legacy-etl runner",
      resource: "legacy-etl-job-runner",
      priority: "Medium",
      description: "Snapshot EBS volumes and terminate stopped instance to eliminate unattached disk lease costs.",
      estimatedSavings: 1800
    }
  ],
  resourceUtilization: [
    { resource: "EC2 Compute", utilization: 76 },
    { resource: "RDS Instances", utilization: 68 },
    { resource: "Lambda Functions", utilization: 88 },
    { resource: "S3 Storage", utilization: 82 }
  ],
  forecast: [
    { date: "Jul 1", actual: 88000, predicted: null },
    { date: "Jul 8", actual: 94000, predicted: null },
    { date: "Jul 15", actual: 102000, predicted: null },
    { date: "Jul 22", actual: 109000, predicted: null },
    { date: "Today", actual: 115400, predicted: 115400 },
    { date: "Jul 29", actual: null, predicted: 121000 },
    { date: "Aug 5", actual: null, predicted: 127500 },
    { date: "Aug 12", actual: null, predicted: 133000 }
  ]
};

export default sampleUploadData;
