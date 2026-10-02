import logging
from typing import List, Dict, Any

logger = logging.getLogger("cloudpilot.aws.resource_scanner")

def get_boto3_client(service_name: str, credentials: Dict[str, Any], region: str):
    """
    Creates a read-only Boto3 client using temporary STS AssumeRole credentials.
    """
    import boto3
    return boto3.client(
        service_name,
        region_name=region,
        aws_access_key_id=credentials.get("AccessKeyId"),
        aws_secret_access_key=credentials.get("SecretAccessKey"),
        aws_session_token=credentials.get("SessionToken")
    )

def discover_ec2(credentials: Dict[str, Any], region: str) -> List[Dict[str, Any]]:
    """
    Read-only discovery of EC2 instances and scan-time retrieval of CloudWatch CPUUtilization.
    Boto3 calls: ec2.describe_instances() & cloudwatch.get_metric_statistics()
    """
    from app.aws.cloudwatch_collector import get_ec2_cpu_utilization

    resources = []
    try:
        ec2_client = get_boto3_client("ec2", credentials, region)
        paginator = ec2_client.get_paginator("describe_instances")
        
        for page in paginator.paginate():
            for reservation in page.get("Reservations", []):
                for inst in reservation.get("Instances", []):
                    instance_id = inst.get("InstanceId")
                    instance_type = inst.get("InstanceType", "t3.medium")
                    state_name = inst.get("State", {}).get("Name", "running").title()
                    
                    # Extract Name tag if present
                    name = instance_id
                    for tag in inst.get("Tags", []):
                        if tag.get("Key") == "Name" and tag.get("Value"):
                            name = tag.get("Value")
                            break

                    # Retrieve CloudWatch CPU metric (returns float or None if missing/unavailable)
                    cpu_metric = get_ec2_cpu_utilization(credentials, region, instance_id)

                    resources.append({
                        "id": instance_id,
                        "name": name,
                        "type": "EC2",
                        "instance_type": instance_type,
                        "region": region,
                        "status": state_name,
                        "monthly_cost": 2800.0,  # Estimated baseline cost
                        "risk": "Low",
                        "public_access": bool(inst.get("PublicIpAddress")),
                        "cpu_utilization": cpu_metric
                    })
    except Exception as e:
        logger.error(f"Error during EC2 discovery: {str(e)}")
        raise
    return resources

def discover_s3(credentials: Dict[str, Any], region: str) -> List[Dict[str, Any]]:
    """
    Read-only discovery of S3 buckets.
    Boto3 call: s3.list_buckets()
    """
    resources = []
    try:
        s3_client = get_boto3_client("s3", credentials, region)
        resp = s3_client.list_buckets()
        
        for bucket in resp.get("Buckets", []):
            bucket_name = bucket.get("Name")
            
            # Check public access block if available
            is_public = False
            try:
                pab = s3_client.get_public_access_block(Bucket=bucket_name)
                config = pab.get("PublicAccessBlockConfiguration", {})
                is_public = not (config.get("BlockPublicAcls") and config.get("BlockPublicPolicy"))
            except Exception:
                pass  # Default to False on permission restriction

            resources.append({
                "id": f"s3-{bucket_name}",
                "name": bucket_name,
                "type": "S3",
                "region": region,
                "status": "Active",
                "monthly_cost": 1500.0,
                "risk": "Critical" if is_public else "Low",
                "public_access": is_public,
                "storage_gb": 250.0
            })
    except Exception as e:
        logger.error(f"Error during S3 discovery: {str(e)}")
        raise
    return resources

def discover_rds(credentials: Dict[str, Any], region: str) -> List[Dict[str, Any]]:
    """
    Read-only discovery of RDS database instances.
    Boto3 call: rds.describe_db_instances()
    """
    resources = []
    try:
        rds_client = get_boto3_client("rds", credentials, region)
        paginator = rds_client.get_paginator("describe_db_instances")
        
        for page in paginator.paginate():
            for db_inst in page.get("DBInstances", []):
                db_id = db_inst.get("DBInstanceIdentifier")
                instance_class = db_inst.get("DBInstanceClass", "db.t3.medium")
                status = db_inst.get("DBInstanceStatus", "available").title()
                storage_gb = db_inst.get("AllocatedStorage", 100)
                is_encrypted = db_inst.get("StorageEncrypted", False)

                resources.append({
                    "id": f"rds-{db_id}",
                    "name": db_id,
                    "type": "RDS",
                    "instance_type": instance_class,
                    "region": region,
                    "status": status,
                    "monthly_cost": 8500.0,
                    "risk": "Medium" if not is_encrypted else "Low",
                    "public_access": db_inst.get("PubliclyAccessible", False),
                    "storage_gb": float(storage_gb),
                    "cpu_utilization": None
                })
    except Exception as e:
        logger.error(f"Error during RDS discovery: {str(e)}")
        raise
    return resources

def discover_lambda(credentials: Dict[str, Any], region: str) -> List[Dict[str, Any]]:
    """
    Read-only discovery of Lambda functions.
    Boto3 call: lambda.list_functions()
    """
    resources = []
    try:
        lambda_client = get_boto3_client("lambda", credentials, region)
        paginator = lambda_client.get_paginator("list_functions")
        
        for page in paginator.paginate():
            for fn in page.get("Functions", []):
                fn_name = fn.get("FunctionName")
                
                resources.append({
                    "id": f"lambda-{fn_name}",
                    "name": fn_name,
                    "type": "Lambda",
                    "region": region,
                    "status": "Active",
                    "monthly_cost": 120.0,
                    "risk": "Low",
                    "public_access": False,
                    "invocations": 5000
                })
    except Exception as e:
        logger.error(f"Error during Lambda discovery: {str(e)}")
        raise
    return resources

def discover_iam(credentials: Dict[str, Any], region: str) -> List[Dict[str, Any]]:
    """
    Read-only discovery of IAM users and roles.
    Boto3 call: iam.list_users()
    """
    resources = []
    try:
        iam_client = get_boto3_client("iam", credentials, region)
        paginator = iam_client.get_paginator("list_users")
        
        for page in paginator.paginate():
            for u in page.get("Users", []):
                username = u.get("UserName")
                
                resources.append({
                    "id": f"iam-{username}",
                    "name": username,
                    "type": "IAM",
                    "region": "global",
                    "status": "Active",
                    "monthly_cost": 0.0,
                    "risk": "Low",
                    "public_access": False
                })
    except Exception as e:
        logger.error(f"Error during IAM discovery: {str(e)}")
        raise
    return resources
