/**
 * CloudPilot Alert Service
 * Integrates with Discord / Slack incoming webhooks for real-time DevOps incident dispatching.
 */

export const DEFAULT_DISCORD_WEBHOOK = 
  'https://discord.com/api/webhooks/1562142006648508488/67ncxFvBRY_EhxnB8z0nhAxsc1hLoijbDzCjamN4PL4BL-4PUi60GYxJhgWKGbogFUBF';

export const getDiscordWebhook = () => {
  return localStorage.getItem('cloudpilot_discord_webhook') || DEFAULT_DISCORD_WEBHOOK;
};

export const setDiscordWebhook = (url) => {
  if (url && url.trim()) {
    localStorage.setItem('cloudpilot_discord_webhook', url.trim());
  } else {
    localStorage.removeItem('cloudpilot_discord_webhook');
  }
};

/**
 * Sends a rich, structured incident embed to Discord
 */
export const sendDiscordAlert = async ({
  accountName = 'FinTech Enterprise Production Cloud',
  cloudProvider = 'AWS (ap-south-1)',
  healthScore = 61,
  monthlyCost = 115400,
  potentialSavings = 32800,
  securityIssues = 7,
  criticalResource = 'customer-data-backup (S3 Bucket)',
  criticalIssue = 'Public Read Access open to 0.0.0.0/0 (CIS 2.1.1 Violation)',
  actionRequired = 'Block Public Access & Rotate Expired IAM Credentials',
} = {}) => {
  const webhookUrl = getDiscordWebhook();
  if (!webhookUrl) {
    throw new Error('Discord Webhook URL is not configured.');
  }

  const payload = {
    username: 'CloudPilot Governance Bot',
    avatar_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-alert.svg',
    embeds: [
      {
        title: '🚨 CloudPilot — Critical Security Incident Alert',
        description: `Automated cloud telemetry scan identified **${securityIssues} active security exposures** requiring immediate DevOps remediation.`,
        color: 15548997, // Red (0xED4245)
        fields: [
          {
            name: '🌐 Cloud Environment',
            value: `**${accountName}**\nProvider: \`${cloudProvider}\``,
            inline: true,
          },
          {
            name: '🛡️ Health Score',
            value: `**${healthScore} / 100**\nStatus: 🔴 **At Risk**`,
            inline: true,
          },
          {
            name: '💰 Potential Savings',
            value: `**₹${potentialSavings.toLocaleString('en-IN')}/mo**\n(from unused/over-provisioned assets)`,
            inline: true,
          },
          {
            name: '⚠️ High-Priority Vulnerability',
            value: `**Resource:** \`${criticalResource}\`\n**Issue:** ${criticalIssue}`,
            inline: false,
          },
          {
            name: '⚡ Recommended Remediation',
            value: `\`\`\`bash\naws s3api put-public-access-block --bucket customer-data-backup --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"\n\`\`\`\n*Or use CloudPilot 1-Click Auto-Remediation in Dashboard.*`,
            inline: false,
          },
        ],
        footer: {
          text: 'CloudPilot AI Governance Platform • Real-time Telemetry Dispatch',
          icon_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cloud-lightning.svg',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Discord API returned status ${response.status}: ${errorText}`);
  }

  return { success: true, timestamp: new Date() };
};
