from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Resource(Base):
    """
    Resource entity representing discovered cloud infrastructure (EC2, S3, RDS, Lambda, IAM).
    """
    __tablename__ = "resources"

    id = Column(String(100), primary_key=True)  # Resource identifier e.g. 'i-001', 's3-001'
    cloud_account_id = Column(UUID(as_uuid=True), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, index=True)  # 'EC2', 'S3', 'RDS', 'Lambda', 'IAM'
    instance_type = Column(String(50), nullable=True)  # e.g. 't3.large'
    region = Column(String(50), nullable=False, default="ap-south-1")
    status = Column(String(50), nullable=False, default="Running")  # 'Running', 'Active', 'Available'
    monthly_cost = Column(Float, nullable=False, default=0.0)
    risk = Column(String(20), nullable=False, default="Low")  # 'Low', 'Medium', 'High', 'Critical'
    public_access = Column(Boolean, default=False, nullable=False)
    storage_gb = Column(Float, nullable=True)
    cpu_utilization = Column(Float, nullable=True)
    memory_utilization = Column(Float, nullable=True)
    invocations = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    cloud_account = relationship("CloudAccount", back_populates="resources")

    def __repr__(self):
        return f"<Resource(id='{self.id}', type='{self.type}', name='{self.name}')>"
