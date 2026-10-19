import demoData from '../data/demoData';

/**
 * Pure Simulation Engine for Cloud Pilot
 * Calculates hypothetical financial, capacity, carbon, and risk impacts
 * based on user modifications WITHOUT mutating original demoData.
 */

// Baseline unit pricing dictionary (INR per month)
const EC2_RATES = {
  't3.nano': 380,
  't3.micro': 750,
  't3.small': 1480,
  't3.medium': 2800,
  't3.large': 4200,
  't3.xlarge': 8400,
  'c5.large': 5200,
  'c5.xlarge': 10400,
  'r5.large': 6800,
  'r5.xlarge': 13600,
};

const RDS_RATES = {
  'db.t3.micro': 1200,
  'db.t3.small': 2400,
  'db.t3.medium': 4800,
  'db.t3.large': 18900,
  'db.r5.large': 28000,
  'db.r5.xlarge': 56000,
};

const S3_RATES = {
  'Standard': 0.76,           // ₹0.76 per GB/mo
  'Infrequent Access': 0.42,  // ₹0.42 per GB/mo (-45%)
  'Glacier Deep Archive': 0.12 // ₹0.12 per GB/mo (-85%)
};

/**
 * Calculate simulation results from an active scenario configuration
 */
export const calculateSimulation = (resources, scenarioMods = {}, globalOpts = {}) => {
  const { pricingModel = 'On-Demand', globalWorkload = 100 } = globalOpts;

  // Discount multiplier based on pricing model
  let pricingDiscount = 1.0;
  if (pricingModel === '1-Yr Reserved') pricingDiscount = 0.70; // 30% savings
  if (pricingModel === '3-Yr Reserved') pricingDiscount = 0.50; // 50% savings

  let simulatedEC2Cost = 0;
  let simulatedRDSCost = 0;
  let simulatedS3Cost = 0;
  let simulatedLambdaCost = 0;
  let simulatedOtherCost = demoData.costBreakdown?.Other || 3000;

  const resourceLogs = [];

  // Iterate over baseline resources and apply modifications
  resources.forEach(res => {
    const mod = scenarioMods[res.id] || {};
    if (mod.isDeleted) {
      resourceLogs.push({ id: res.id, name: res.name, action: 'Removed', diff: -res.monthlyCost });
      return; // Skipped / Removed
    }

    if (res.type === 'EC2') {
      const type = mod.instanceType || res.instanceType || 't3.large';
      const count = mod.quantity !== undefined ? mod.quantity : 1;
      const baseRate = EC2_RATES[type] || 4200;
      const utilizationFactor = (mod.utilization !== undefined ? mod.utilization : (res.cpuUtilization || 50)) / 50;
      const cost = Math.round(baseRate * count * pricingDiscount * (0.85 + 0.15 * utilizationFactor));
      
      simulatedEC2Cost += cost;
      resourceLogs.push({
        id: res.id,
        name: res.name,
        type: 'EC2',
        from: `${res.instanceType} (x1)`,
        to: `${type} (x${count})`,
        originalCost: res.monthlyCost,
        newCost: cost,
        diff: cost - res.monthlyCost
      });
    } else if (res.type === 'RDS') {
      const type = mod.instanceType || res.instanceType || 'db.t3.large';
      const baseRate = RDS_RATES[type] || 18900;
      const storageGB = mod.storageGB !== undefined ? mod.storageGB : (res.storageGB || 500);
      const storageType = mod.storageType || 'gp2';
      const storageRate = storageType === 'gp3' ? 0.68 : 0.80; // gp3 is 15% cheaper
      const cost = Math.round((baseRate + storageGB * storageRate) * pricingDiscount);

      simulatedRDSCost += cost;
      resourceLogs.push({
        id: res.id,
        name: res.name,
        type: 'RDS',
        from: `${res.instanceType}`,
        to: `${type} (${storageGB}GB ${storageType})`,
        originalCost: res.monthlyCost,
        newCost: cost,
        diff: cost - res.monthlyCost
      });
    } else if (res.type === 'S3') {
      const storageGB = mod.storageGB !== undefined ? mod.storageGB : (res.storageGB || 4200);
      const storageClass = mod.storageClass || 'Standard';
      const rate = S3_RATES[storageClass] || 0.76;
      const cost = Math.round(storageGB * rate);

      simulatedS3Cost += cost;
      resourceLogs.push({
        id: res.id,
        name: res.name,
        type: 'S3',
        from: 'Standard (4.2TB)',
        to: `${storageClass} (${(storageGB / 1000).toFixed(1)}TB)`,
        originalCost: res.monthlyCost,
        newCost: cost,
        diff: cost - res.monthlyCost
      });
    } else if (res.type === 'Lambda') {
      const invocations = mod.invocations !== undefined ? mod.invocations : (res.invocations || 18200);
      const cost = Math.round(15 + (invocations / 1000) * 7.14);

      simulatedLambdaCost += cost;
      resourceLogs.push({
        id: res.id,
        name: res.name,
        type: 'Lambda',
        from: `${res.invocations} inv/mo`,
        to: `${invocations} inv/mo`,
        originalCost: res.monthlyCost,
        newCost: cost,
        diff: cost - res.monthlyCost
      });
    }
  });

  // Include any new virtual added resources
  const addedResources = globalOpts.addedResources || [];
  addedResources.forEach(newRes => {
    let cost = 0;
    if (newRes.type === 'EC2') {
      cost = Math.round((EC2_RATES[newRes.instanceType] || 2800) * (newRes.quantity || 1) * pricingDiscount);
      simulatedEC2Cost += cost;
    } else if (newRes.type === 'RDS') {
      cost = Math.round((RDS_RATES[newRes.instanceType] || 4800) * pricingDiscount);
      simulatedRDSCost += cost;
    } else if (newRes.type === 'S3') {
      cost = Math.round((newRes.storageGB || 1000) * 0.76);
      simulatedS3Cost += cost;
    }
    resourceLogs.push({
      id: newRes.id,
      name: newRes.name,
      type: newRes.type,
      action: 'Added',
      from: 'None',
      to: `${newRes.type} (${newRes.instanceType || newRes.storageGB + 'GB'})`,
      originalCost: 0,
      newCost: cost,
      diff: cost
    });
  });

  // Calculate totals
  const currentMonthlyCost = demoData.summary.monthlyCost || 48500;
  const simulatedMonthlyCost = simulatedEC2Cost + simulatedRDSCost + simulatedS3Cost + simulatedLambdaCost + simulatedOtherCost;
  const monthlyDifference = simulatedMonthlyCost - currentMonthlyCost;
  const isSavings = monthlyDifference <= 0;
  const monthlySavings = isSavings ? Math.abs(monthlyDifference) : 0;
  const monthlyAdditional = !isSavings ? monthlyDifference : 0;
  const annualSavings = monthlySavings * 12;
  const annualAdditional = monthlyAdditional * 12;
  const percentageChange = Number(((monthlyDifference / currentMonthlyCost) * 100).toFixed(1));

  // Environmental impact estimate (approx 0.035 kg CO2 per ₹ spent on cloud compute/storage)
  const carbonDiffKg = Math.round(monthlyDifference * 0.035);

  // Risk & Performance Assessment
  let riskLevel = 'Low';
  let riskRationale = 'Configuration adjustments remain within safe operational headroom parameters.';
  
  if (percentageChange < -25) {
    riskLevel = 'High';
    riskRationale = 'Aggressive downsizing (-25%+) may restrict compute throughput during unforeseen traffic spikes.';
  } else if (percentageChange < -10 || addedResources.length > 2) {
    riskLevel = 'Medium';
    riskRationale = 'Moderate capacity changes require monitoring during initial deployment.';
  }

  // AI Explanation text
  let aiInsight = '';
  if (isSavings) {
    aiInsight = `This scenario achieves an estimated savings of ₹${monthlySavings.toLocaleString('en-IN')}/month (${Math.abs(percentageChange)}% reduction) by optimizing instance sizing and storage pricing tiers.`;
  } else {
    aiInsight = `This expansion scenario increases monthly expenditure by ₹${monthlyAdditional.toLocaleString('en-IN')}/month (+${percentageChange}%) to support higher traffic throughput and database reliability.`;
  }

  return {
    currentMonthlyCost,
    simulatedMonthlyCost,
    monthlyDifference,
    isSavings,
    monthlySavings,
    monthlyAdditional,
    annualSavings,
    annualAdditional,
    percentageChange,
    carbonDiffKg,
    riskLevel,
    riskRationale,
    aiInsight,
    resourceLogs,
    serviceBreakdown: {
      EC2: { current: demoData.costBreakdown?.EC2 || 22000, simulated: simulatedEC2Cost },
      RDS: { current: demoData.costBreakdown?.RDS || 14500, simulated: simulatedRDSCost },
      S3: { current: demoData.costBreakdown?.S3 || 6000, simulated: simulatedS3Cost },
      Lambda: { current: demoData.costBreakdown?.Lambda || 3000, simulated: simulatedLambdaCost },
      Other: { current: demoData.costBreakdown?.Other || 3000, simulated: simulatedOtherCost }
    }
  };
};
