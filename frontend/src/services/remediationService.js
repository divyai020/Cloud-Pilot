/**
 * Remediation Script Generator Service
 * Generates tailored, production-ready AWS CLI, Terraform (HCL), and Python (Boto3)
 * auto-remediation scripts for security findings and cost recommendations.
 */

export const generateSecurityRemediation = (finding) => {
  const resource = finding?.resource || 'resource-id';
  const title = finding?.title || '';
  const category = (finding?.category || '').toLowerCase();

  // 1. Open SSH / Ingress Security Group
  if (title.toLowerCase().includes('ssh') || title.toLowerCase().includes('port 22') || category.includes('network')) {
    return {
      title: 'Restrict SSH (Port 22) to Authorized Bastion CIDR',
      affectedResource: resource,
      riskLevel: 'Critical',
      blastRadius: 'Low (Active sessions remain alive; future incoming connections restricted to authorized CIDR)',
      rollbackPlan: 'aws ec2 authorize-security-group-ingress --group-id ' + resource + ' --protocol tcp --port 22 --cidr 0.0.0.0/0',
      cli: `# 1. Revoke 0.0.0.0/0 full-internet ingress on port 22
aws ec2 revoke-security-group-ingress \\
    --group-id ${resource} \\
    --protocol tcp \\
    --port 22 \\
    --cidr 0.0.0.0/0

# 2. Authorize restricted corporate VPN or Bastion host subnet only
aws ec2 authorize-security-group-ingress \\
    --group-id ${resource} \\
    --protocol tcp \\
    --port 22 \\
    --cidr 10.0.0.0/16 \\
    --description "Internal VPN SSH access only"`,
      terraform: `resource "aws_security_group_rule" "restricted_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/16"] # Corporate VPN / Bastion
  security_group_id = "${resource}"
  description       = "Restrict SSH to internal private network"
}`,
      boto3: `import boto3

ec2 = boto3.client('ec2')

# Revoke open public SSH rule
ec2.revoke_security_group_ingress(
    GroupId='${resource}',
    IpPermissions=[{
        'IpProtocol': 'tcp',
        'FromPort': 22,
        'ToPort': 22,
        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
    }]
)
print("Successfully revoked open 0.0.0.0/0 SSH rule on ${resource}")`
    };
  }

  // 2. S3 Public Access / Unencrypted Bucket
  if (category.includes('public') || category.includes('data protection') || title.toLowerCase().includes('s3') || title.toLowerCase().includes('bucket')) {
    const bucket = resource.replace(/^(arn:aws:s3:::|s3:\/\/)/, '');
    return {
      title: 'Enforce S3 Public Access Block & KMS Server-Side Encryption',
      affectedResource: bucket,
      riskLevel: 'High',
      blastRadius: 'Zero (Does not impact private IAM or CloudFront Origin Access Identity reads)',
      rollbackPlan: 'aws s3api delete-public-access-block --bucket ' + bucket,
      cli: `# 1. Enable Account & Bucket Level Block Public Access
aws s3api put-public-access-block \\
    --bucket ${bucket} \\
    --public-access-block-configuration \\
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 2. Enforce Default AES-256 Server-Side Encryption
aws s3api put-bucket-encryption \\
    --bucket ${bucket} \\
    --server-side-encryption-configuration '{
        "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
    }'`,
      terraform: `resource "aws_s3_bucket_public_access_block" "block_public_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}" {
  bucket = "${bucket}"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encrypt_${bucket.replace(/[^a-zA-Z0-9]/g, '_')}" {
  bucket = "${bucket}"

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}`,
      boto3: `import boto3

s3 = boto3.client('s3')

# Block public access
s3.put_public_access_block(
    Bucket='${bucket}',
    PublicAccessBlockConfiguration={
        'BlockPublicAcls': True,
        'IgnorePublicAcls': True,
        'BlockPublicPolicy': True,
        'RestrictPublicBuckets': True
    }
)
print("Enforced Block Public Access on ${bucket}")`
    };
  }

  // 3. IAM Stale Keys or Missing MFA
  if (category.includes('iam') || title.toLowerCase().includes('iam') || title.toLowerCase().includes('key')) {
    return {
      title: 'Rotate Inactive Access Key & Enforce MFA Policy',
      affectedResource: resource,
      riskLevel: 'High',
      blastRadius: 'Requires deploying new rotated credentials to CI/CD pipelines',
      rollbackPlan: 'aws iam update-access-key --user-name ' + resource + ' --access-key-id <KEY_ID> --status Active',
      cli: `# 1. Deactivate old/stale access key
aws iam update-access-key \\
    --user-name ${resource} \\
    --access-key-id AKIAIOSFODNN7EXAMPLE \\
    --status Inactive

# 2. Generate a new secret access key for deployment
aws iam create-access-key --user-name ${resource}`,
      terraform: `resource "aws_iam_access_key" "rotated_key" {
  user   = "${resource}"
  status = "Active"
}

# Attach IAM policy requiring Virtual MFA
resource "aws_iam_user_policy_attachment" "enforce_mfa" {
  user       = "${resource}"
  policy_arn = "arn:aws:iam::aws:policy/IAMUserChangePassword"
}`,
      boto3: `import boto3

iam = boto3.client('iam')

# Deactivate stale credentials
iam.update_access_key(
    UserName='${resource}',
    AccessKeyId='AKIAIOSFODNN7EXAMPLE',
    Status='Inactive'
)
print("Deactivated stale access key for ${resource}")`
    };
  }

  // Default / Catch-All Security Remediation
  return {
    title: 'Automated Security Hardening for ' + resource,
    affectedResource: resource,
    riskLevel: 'Medium',
    blastRadius: 'Low (Configuration hardening only)',
    rollbackPlan: 'Review CloudTrail audit logs before reversion',
    cli: `# Query current resource metadata
aws resourcegroupstaggingapi get-resources --resource-arn-list ${resource}

# Tag resource for continuous compliance audit
aws resourcegroupstaggingapi tag-resources \\
    --resource-arn-list ${resource} \\
    --tags Environment=Production,Compliance=SOC2`,
    terraform: `resource "aws_resourcegroups_group" "compliance_group" {
  name = "audit-${resource.replace(/[^a-zA-Z0-9]/g, '-')}"
  resource_query {
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [{ Key = "Compliance", Values = ["Enforced"] }]
    })
  }
}`,
    boto3: `import boto3
print("Auditing security parameters for ${resource}...")`
  };
};

export const generateCostRemediation = (recommendation) => {
  const resource = recommendation?.resource || 'i-001';
  const title = recommendation?.title || '';
  const estSavings = recommendation?.estimated_savings || recommendation?.savings || 120;

  // 1. Right-size EC2 instance
  if (title.toLowerCase().includes('right-size') || title.toLowerCase().includes('ec2') || title.toLowerCase().includes('downsize')) {
    return {
      title: 'Downsize Over-provisioned EC2 Instance',
      affectedResource: resource,
      monthlySavings: `$${estSavings}/mo`,
      blastRadius: 'Requires a 90-second instance stop/start maintenance window',
      rollbackPlan: `aws ec2 modify-instance-attribute --instance-id ${resource} --instance-type "{\"Value\": \"t3.xlarge\"}"`,
      cli: `# 1. Gracefully stop instance during low-traffic window
aws ec2 stop-instances --instance-ids ${resource}
aws ec2 wait instance-stopped --instance-ids ${resource}

# 2. Modify to cost-efficient modern generation type
aws ec2 modify-instance-attribute \\
    --instance-id ${resource} \\
    --instance-type "{\\"Value\\": \\"t3.medium\\"}"

# 3. Start back up
aws ec2 start-instances --instance-ids ${resource}
aws ec2 wait instance-running --instance-ids ${resource}`,
      terraform: `resource "aws_instance" "app_server" {
  instance_type = "t3.medium" # Downsized from t3.xlarge (Saves ~$${estSavings}/mo)
  lifecycle {
    create_before_destroy = true
  }
}`,
      boto3: `import boto3

ec2 = boto3.client('ec2')
print("Stopping ${resource} for resizing...")
ec2.stop_instances(InstanceIds=['${resource}'])
waiter = ec2.get_waiter('instance_stopped')
waiter.wait(InstanceIds=['${resource}'])

ec2.modify_instance_attribute(InstanceId='${resource}', InstanceType={'Value': 't3.medium'})
ec2.start_instances(InstanceIds=['${resource}'])
print("Resized ${resource} to t3.medium successfully.")`
    };
  }

  // 2. Unattached EBS Volume cleanup
  if (title.toLowerCase().includes('ebs') || title.toLowerCase().includes('volume') || title.toLowerCase().includes('unattached')) {
    return {
      title: 'Snapshot & Delete Idle Unattached EBS Volume',
      affectedResource: resource,
      monthlySavings: `$${estSavings}/mo`,
      blastRadius: 'Zero (Volume is confirmed unattached from all running compute instances)',
      rollbackPlan: 'Create new volume from snapshot: aws ec2 create-volume --snapshot-id <SNAPSHOT_ID> --availability-zone ap-south-1a',
      cli: `# 1. Create safety snapshot before deletion
SNAPSHOT_ID=$(aws ec2 create-snapshot \\
    --volume-id ${resource} \\
    --description "Pre-deletion backup for ${resource}" \\
    --query 'SnapshotId' --output text)

echo "Backup snapshot created: $SNAPSHOT_ID"

# 2. Delete unattached volume to stop idle hourly cost
aws ec2 delete-volume --volume-id ${resource}`,
      terraform: `# Remove aws_ebs_volume block or ensure retain_on_delete is set
# Resource ${resource} is safely deprecated`,
      boto3: `import boto3

ec2 = boto3.client('ec2')
snap = ec2.create_snapshot(VolumeId='${resource}', Description='Pre-delete safety backup')
print(f"Safety snapshot created: {snap['SnapshotId']}")

ec2.delete_volume(VolumeId='${resource}')
print("Deleted idle EBS volume ${resource}")`
    };
  }

  // 3. S3 Lifecycle Transition to Glacier / Intelligent-Tiering
  return {
    title: 'Enable S3 Intelligent-Tiering Lifecycle Policy',
    affectedResource: resource,
    monthlySavings: `$${estSavings}/mo`,
    blastRadius: 'Zero (Objects remain accessible with milliseconds latency; tiers transition automatically)',
    rollbackPlan: 'aws s3api delete-bucket-lifecycle --bucket ' + resource,
    cli: `# Apply Intelligent-Tiering transition rule
aws s3api put-bucket-lifecycle-configuration \\
    --bucket ${resource} \\
    --lifecycle-configuration '{
        "Rules": [{
            "ID": "MoveToGlacierAfter90Days",
            "Status": "Enabled",
            "Filter": {"Prefix": ""},
            "Transitions": [{
                "Days": 90,
                "StorageClass": "GLACIER"
            }]
        }]
    }'`,
    terraform: `resource "aws_s3_bucket_lifecycle_configuration" "tiering" {
  bucket = "${resource}"

  rule {
    id     = "intelligent_tiering"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}`,
    boto3: `import boto3

s3 = boto3.client('s3')
s3.put_bucket_lifecycle_configuration(
    Bucket='${resource}',
    LifecycleConfiguration={
        'Rules': [{
            'ID': 'AutoTiering',
            'Status': 'Enabled',
            'Filter': {'Prefix': ''},
            'Transitions': [{'Days': 90, 'StorageClass': 'GLACIER'}]
        }]
    }
)
print("Configured lifecycle tiering on ${resource}")`
  };
};
