import re
import logging
from typing import Dict, Any
from fastapi import HTTPException, status

logger = logging.getLogger("cloudpilot.aws.sts")

# Role ARN regular expression pattern: arn:aws:iam::123456789012:role/RoleName
ROLE_ARN_PATTERN = re.compile(r"^arn:aws:iam::\d{12}:role/[\w+=,.@-]{1,64}$")

def validate_role_arn_format(role_arn: str) -> bool:
    """
    Validates that a string conforms to standard AWS IAM Role ARN syntax.
    Example: arn:aws:iam::123456789012:role/CloudPilotRole
    """
    if not role_arn or not isinstance(role_arn, str):
        return False
    return bool(ROLE_ARN_PATTERN.match(role_arn.strip()))

def get_aws_account_identity(role_arn: str, region: str = "ap-south-1") -> Dict[str, Any]:
    """
    Validates AWS IAM Role connection using Boto3 STS AssumeRole:
    1. Validates ARN syntax format.
    2. Calls AWS STS AssumeRole to obtain temporary session credentials.
    3. Calls GetCallerIdentity using temporary credentials to extract AWS Account ID.
    4. NEVER logs or returns temporary secret keys.
    """
    role_arn_clean = role_arn.strip()
    
    if not validate_role_arn_format(role_arn_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid AWS IAM Role ARN format. Expected format: 'arn:aws:iam::123456789012:role/RoleName'"
        )

    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError

        # Create base STS client
        sts_client = boto3.client("sts", region_name=region)
        
        # Assume cross-account IAM Role
        assumed_role = sts_client.assume_role(
            RoleArn=role_arn_clean,
            RoleSessionName="CloudPilotGovernanceSession",
            DurationSeconds=900  # 15 minutes temporary token
        )
        
        temp_credentials = assumed_role.get("Credentials", {})
        
        # Create scoped client using temporary STS credentials
        temp_sts_client = boto3.client(
            "sts",
            region_name=region,
            aws_access_key_id=temp_credentials.get("AccessKeyId"),
            aws_secret_access_key=temp_credentials.get("SecretAccessKey"),
            aws_session_token=temp_credentials.get("SessionToken")
        )
        
        # Verify identity and extract 12-digit AWS Account ID
        identity = temp_sts_client.get_caller_identity()
        aws_account_id = identity.get("Account")
        assumed_arn = identity.get("Arn")

        return {
            "aws_account_id": aws_account_id,
            "assumed_arn": assumed_arn,
            "status": "connected"
        }

    except ImportError:
        # Boto3 not installed or import failure
        logger.error("Boto3 package is missing or not installed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AWS SDK connector is not properly configured on server."
        )

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "UnknownError")
        logger.warning(f"AWS STS AssumeRole ClientError: {error_code}")
        
        if error_code in ("AccessDenied", "UnauthorizedOperation"):
            detail_msg = "AWS STS AssumeRole access denied. Please verify your IAM Role trust policy accepts Cloud Pilot."
        elif error_code == "NoSuchEntity":
            detail_msg = "The specified AWS IAM Role does not exist."
        else:
            detail_msg = f"AWS Connection failed: {error_code}."
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail_msg
        )

    except BotoCoreError as e:
        logger.error(f"AWS BotoCore Error: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to establish connection to AWS STS service."
        )

    except Exception as e:
        logger.error("Unexpected error during AWS STS AssumeRole verification.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not verify AWS connection with the provided Role ARN."
        )
