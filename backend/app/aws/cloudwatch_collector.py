import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("cloudpilot.aws.cloudwatch_collector")

def get_ec2_cpu_utilization(
    credentials: Dict[str, Any],
    region: str,
    instance_id: str,
    days: int = 14
) -> Optional[float]:
    """
    Read-only CloudWatch CPUUtilization Metric Retrieval:
    1. Uses temporary STS AssumeRole credentials to instantiate Boto3 CloudWatch client.
    2. Requests historical 'CPUUtilization' statistics for the specified EC2 InstanceId.
    3. Aggregates daily average datapoints over the specified window (default: 14 days, period: 86400s).
    4. Calculates the multi-day mean average CPU percentage.
    5. Returns None if datapoints are missing, empty, or if CloudWatch permissions are denied.
    
    IMPORTANT: This is scan-time CloudWatch metric retrieval, NOT continuous real-time stream monitoring.
    """
    if not credentials or not instance_id:
        return None

    try:
        from app.aws.resource_scanner import get_boto3_client
        cw_client = get_boto3_client("cloudwatch", credentials, region)

        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=days)

        response = cw_client.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[
                {
                    "Name": "InstanceId",
                    "Value": instance_id
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,  # 1-day aggregation window
            Statistics=["Average"]
        )

        datapoints = response.get("Datapoints", [])
        if not datapoints:
            logger.info(f"No CloudWatch CPU datapoints found for instance {instance_id}")
            return None

        averages = [dp["Average"] for dp in datapoints if "Average" in dp]
        if not averages:
            return None

        mean_cpu = sum(averages) / float(len(averages))
        return round(float(mean_cpu), 2)

    except Exception as e:
        logger.warning(f"Failed to retrieve CloudWatch CPU metric for instance {instance_id}: {str(e)}")
        # Safe fallback: Return None (NULL) so metric failure does not break resource discovery
        return None
