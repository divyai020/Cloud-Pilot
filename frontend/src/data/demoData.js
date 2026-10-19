const defaultDemoData = {
    summary: {
        cloudHealthScore: 72,
        monthlyCost: 48500,
        potentialSavings: 12800,
        securityIssues: 5,
        activeResources: 5,
    },

    resources: [
        {
            id: "i-001",
            name: "web-server-prod",
            type: "EC2",
            instanceType: "t3.large",
            region: "ap-south-1",
            status: "Running",
            cpuUtilization: 8,
            memoryUtilization: 18,
            monthlyCost: 4200,
            risk: "Medium",
        },
        {
            id: "i-002",
            name: "api-server-prod",
            type: "EC2",
            instanceType: "t3.medium",
            region: "ap-south-1",
            status: "Running",
            cpuUtilization: 62,
            memoryUtilization: 55,
            monthlyCost: 2800,
            risk: "Low",
        },
        {
            id: "s3-001",
            name: "customer-data-backup",
            type: "S3",
            region: "eu-west-1",
            status: "Active",
            storageGB: 4200,
            monthlyCost: 3200,
            publicAccess: true,
            risk: "Critical",
        },
        {
            id: "rds-001",
            name: "analytics-db",
            type: "RDS",
            instanceType: "db.t3.large",
            region: "ap-south-1",
            status: "Available",
            cpuUtilization: 45,
            storageGB: 500,
            monthlyCost: 18900,
            risk: "Medium",
        },
        {
            id: "lambda-001",
            name: "payment-webhook",
            type: "Lambda",
            region: "us-east-1",
            status: "Active",
            invocations: 18200,
            monthlyCost: 145,
            risk: "Low",
        },
    ],

    costBreakdown: {
        EC2: 22000,
        RDS: 14500,
        S3: 6000,
        Lambda: 3000,
        Other: 3000,
    },

    costTrend: [
        { month: "Jan", cost: 31000 },
        { month: "Feb", cost: 34000 },
        { month: "Mar", cost: 33000 },
        { month: "Apr", cost: 37000 },
        { month: "May", cost: 41000 },
        { month: "Jun", cost: 48500 },
        { month: "Jul", cost: 49200 },
    ],

    securityFindings: [
        {
            id: "SEC-001",
            title: "Publicly exposed S3 bucket",
            resource: "customer-data-backup",
            severity: "Critical",
            category: "Public Resources",
            description: "Bucket allows public access.",
            recommendation: "Block public access and review bucket policy.",
        },
        {
            id: "SEC-002",
            title: "Inactive IAM access keys",
            resource: "3 IAM users",
            severity: "High",
            category: "IAM",
            description: "Access keys have not been used for more than 90 days.",
            recommendation: "Disable or rotate unused access keys.",
        },
        {
            id: "SEC-003",
            title: "Open security group rule",
            resource: "sg-web-tier",
            severity: "High",
            category: "Network",
            description: "Port 22 is open to a broad IP range.",
            recommendation: "Restrict SSH access to trusted IP ranges.",
        },
        {
            id: "SEC-004",
            title: "Unencrypted storage",
            resource: "analytics-db",
            severity: "Medium",
            category: "Data Protection",
            description: "Encryption at rest is not enabled.",
            recommendation: "Enable encryption for database storage.",
        },
        {
            id: "SEC-005",
            title: "Old IAM credentials",
            resource: "developer-user",
            severity: "Medium",
            category: "IAM",
            description: "Credentials have not been rotated recently.",
            recommendation: "Rotate credentials according to policy.",
        },
    ],

    recommendations: [
        {
            id: "REC-001",
            title: "Downsize idle EC2 instances",
            resource: "web-server-prod",
            priority: "High",
            description: "CPU utilization is consistently below 10%.",
            estimatedSavings: 1600,
        },
        {
            id: "REC-002",
            title: "Remove unused EBS volumes",
            resource: "5 unattached volumes",
            priority: "High",
            description: "Unused storage is generating unnecessary charges.",
            estimatedSavings: 2100,
        },
        {
            id: "REC-003",
            title: "Optimize RDS instance",
            resource: "analytics-db",
            priority: "Medium",
            description: "Current capacity may be higher than required.",
            estimatedSavings: 1800,
        },
        {
            id: "REC-004",
            title: "Optimize S3 storage",
            resource: "customer-data-backup",
            priority: "Medium",
            description: "Move infrequently accessed data to a lower-cost storage class.",
            estimatedSavings: 1200,
        },
    ],

    resourceUtilization: [
        {
            resource: "EC2 Compute",
            utilization: 68,
        },
        {
            resource: "RDS Instances",
            utilization: 55,
        },
        {
            resource: "Lambda Functions",
            utilization: 90,
        },
        {
            resource: "S3 Storage",
            utilization: 78,
        },
    ],

    forecast: [
        { date: "Jul 1", actual: 31000, predicted: null },
        { date: "Jul 8", actual: 35000, predicted: null },
        { date: "Jul 15", actual: 39000, predicted: null },
        { date: "Jul 22", actual: 42000, predicted: null },
        { date: "Today", actual: 48500, predicted: 48500 },
        { date: "Jul 29", actual: null, predicted: 50500 },
        { date: "Aug 5", actual: null, predicted: 52500 },
        { date: "Aug 12", actual: null, predicted: 54800 },
    ],

    simulator: {
        current: {
            resource: "EC2",
            instanceType: "t3.large",
            instances: 2,
            monthlyCost: 4200,
        },

        scenarios: [
            {
                name: "Downsize instance",
                from: "t3.large",
                to: "t3.medium",
                newCost: 2600,
                savings: 1600,
                risk: "Low",
            },
            {
                name: "Reduce instance count",
                from: "2 instances",
                to: "1 instance",
                newCost: 2100,
                savings: 2100,
                risk: "Medium",
            },
            {
                name: "Optimize storage",
                from: "gp2",
                to: "gp3",
                newCost: 3800,
                savings: 400,
                risk: "Low",
            },
            {
                name: "Switch pricing model",
                from: "On-Demand",
                to: "Reserved",
                newCost: 3100,
                savings: 1100,
                risk: "Low",
            },
        ],
    },

    roadmap: [
        {
            step: 1,
            title: "Fix Critical Issues",
            priority: "Critical",
            issue: "Public S3 bucket",
            action: "Block public access",
            impact: "High",
        },
        {
            step: 2,
            title: "Reduce Cloud Waste",
            priority: "High",
            issue: "2 underutilized EC2 instances",
            action: "Downsize instances",
            estimatedSavings: 4200,
        },
        {
            step: 3,
            title: "Optimize Storage",
            priority: "Medium",
            issue: "Unused EBS volumes",
            action: "Remove or archive",
            estimatedSavings: 2100,
        },
    ],
};

/**
 * Normalizes uploaded JSON data ensuring all dashboards and visualizers render cleanly.
 */
export const normalizeCloudData = (raw, fileName = 'custom_cloud_data.json') => {
    if (!raw || typeof raw !== 'object') return defaultDemoData;

    const resources = Array.isArray(raw.resources) ? raw.resources : defaultDemoData.resources;
    const recommendations = Array.isArray(raw.recommendations) ? raw.recommendations : defaultDemoData.recommendations;
    const securityFindings = Array.isArray(raw.securityFindings) ? raw.securityFindings : defaultDemoData.securityFindings;

    // Calculate total cost from resources if not explicitly given
    const calculatedMonthlyCost = resources.reduce((acc, r) => acc + (Number(r.monthlyCost) || 0), 0);
    const monthlyCost = Number(raw.summary?.monthlyCost) || (calculatedMonthlyCost > 0 ? calculatedMonthlyCost : defaultDemoData.summary.monthlyCost);

    // Calculate potential savings
    const calculatedSavings = recommendations.reduce((acc, r) => acc + (Number(r.estimatedSavings) || 0), 0);
    const potentialSavings = Number(raw.summary?.potentialSavings) || (calculatedSavings > 0 ? calculatedSavings : defaultDemoData.summary.potentialSavings);

    // Calculate health score if missing
    let cloudHealthScore = Number(raw.summary?.cloudHealthScore);
    if (!cloudHealthScore) {
        const crit = securityFindings.filter(f => f.severity === 'Critical').length;
        const high = securityFindings.filter(f => f.severity === 'High').length;
        cloudHealthScore = Math.max(35, Math.min(95, 100 - (crit * 9 + high * 4)));
    }

    const summary = {
        cloudHealthScore,
        monthlyCost,
        potentialSavings,
        securityIssues: securityFindings.length,
        activeResources: resources.length,
        ...(raw.summary || {})
    };

    // Calculate or preserve cost breakdown
    let costBreakdown = raw.costBreakdown;
    if (!costBreakdown) {
        const breakdown = { EC2: 0, RDS: 0, S3: 0, Lambda: 0, Other: 0 };
        resources.forEach(r => {
            const t = (r.type || 'Other').toUpperCase();
            const cost = Number(r.monthlyCost) || 0;
            if (t.includes('EC2')) breakdown.EC2 += cost;
            else if (t.includes('RDS')) breakdown.RDS += cost;
            else if (t.includes('S3')) breakdown.S3 += cost;
            else if (t.includes('LAMBDA')) breakdown.Lambda += cost;
            else breakdown.Other += cost;
        });
        costBreakdown = breakdown;
    }

    // Cost trend fallback
    let costTrend = Array.isArray(raw.costTrend) ? raw.costTrend : null;
    if (!costTrend || costTrend.length === 0) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
        costTrend = months.map((m, idx) => {
            const factor = 0.65 + (idx * 0.058);
            return {
                month: m,
                cost: Math.round(monthlyCost * factor)
            };
        });
        costTrend[costTrend.length - 1].cost = monthlyCost;
    }

    // Resource utilization fallback
    const resourceUtilization = Array.isArray(raw.resourceUtilization) 
        ? raw.resourceUtilization 
        : defaultDemoData.resourceUtilization;

    // Forecast fallback
    let forecast = Array.isArray(raw.forecast) ? raw.forecast : null;
    if (!forecast) {
        forecast = [
            { date: "Jul 1", actual: Math.round(monthlyCost * 0.76), predicted: null },
            { date: "Jul 8", actual: Math.round(monthlyCost * 0.82), predicted: null },
            { date: "Jul 15", actual: Math.round(monthlyCost * 0.88), predicted: null },
            { date: "Jul 22", actual: Math.round(monthlyCost * 0.94), predicted: null },
            { date: "Today", actual: monthlyCost, predicted: monthlyCost },
            { date: "Jul 29", actual: null, predicted: Math.round(monthlyCost * 1.05) },
            { date: "Aug 5", actual: null, predicted: Math.round(monthlyCost * 1.11) },
            { date: "Aug 12", actual: null, predicted: Math.round(monthlyCost * 1.16) },
        ];
    }

    const simulator = raw.simulator || defaultDemoData.simulator;
    const roadmap = Array.isArray(raw.roadmap) ? raw.roadmap : defaultDemoData.roadmap;

    return {
        accountName: raw.accountName || "Uploaded Cloud Environment",
        cloudProvider: raw.cloudProvider || "AWS",
        environment: raw.environment || "Production",
        fileName,
        summary,
        resources,
        costBreakdown,
        costTrend,
        securityFindings,
        recommendations,
        resourceUtilization,
        forecast,
        simulator,
        roadmap,
    };
};

/**
 * Returns the currently active cloud dataset (either uploaded JSON or preloaded demo).
 */
export const getActiveCloudData = () => {
    try {
        const source = localStorage.getItem('cloudpilot_data_source');
        if (source === 'uploaded') {
            const stored = localStorage.getItem('cloudpilot_active_data');
            if (stored) {
                return JSON.parse(stored);
            }
        }
    } catch (e) {
        console.warn("Could not read active cloud data from storage:", e);
    }
    return defaultDemoData;
};

/**
 * Sets uploaded JSON as active cloud dataset and persists to localStorage.
 */
export const setUploadedCloudData = (customData, fileName = 'custom_cloud_data.json') => {
    const normalized = normalizeCloudData(customData, fileName);
    try {
        localStorage.setItem('cloudpilot_active_data', JSON.stringify(normalized));
        localStorage.setItem('cloudpilot_data_source', 'uploaded');
        localStorage.setItem('cloudpilot_source_filename', fileName);
        if (normalized.accountName) {
            localStorage.setItem('cloudpilot_source_account_name', normalized.accountName);
        }
    } catch (e) {
        console.error("Failed to persist uploaded cloud data:", e);
    }
    return normalized;
};

/**
 * Resets active dataset back to preloaded Demo data.
 */
export const resetToDemoData = () => {
    try {
        localStorage.removeItem('cloudpilot_active_data');
        localStorage.setItem('cloudpilot_data_source', 'demo');
        localStorage.removeItem('cloudpilot_source_filename');
        localStorage.removeItem('cloudpilot_source_account_name');
    } catch (e) {
        console.error("Failed to reset demo data:", e);
    }
    return defaultDemoData;
};

/**
 * Returns metadata about the current cloud data source.
 */
export const getCloudDataSourceInfo = () => {
    const source = localStorage.getItem('cloudpilot_data_source') || 'demo';
    const isUploaded = source === 'uploaded';
    const fileName = localStorage.getItem('cloudpilot_source_filename') || (isUploaded ? 'custom_cloud_data.json' : 'Preloaded AWS Demo');
    const accountName = localStorage.getItem('cloudpilot_source_account_name') || (isUploaded ? 'Uploaded Custom Cloud' : 'Production AWS Account');
    return {
        source,
        isUploaded,
        fileName,
        accountName
    };
};

export const getDefaultDemoData = () => JSON.parse(JSON.stringify(defaultDemoData));

// Dynamic Proxy for backward compatibility with existing imports
const demoData = new Proxy(defaultDemoData, {
    get(target, prop) {
        const active = getActiveCloudData();
        if (prop in active) {
            return active[prop];
        }
        return target[prop];
    }
});

export default demoData;