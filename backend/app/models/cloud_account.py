import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CloudAccount(Base):
    """
    CloudAccount entity representing a connected AWS environment, uploaded report session, or demo mode session.
    """
    __tablename__ = "cloud_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # 'aws', 'upload', 'demo'
    aws_account_id = Column(String(50), nullable=True)
    role_arn = Column(String(255), nullable=True)
    region = Column(String(50), nullable=True, default="ap-south-1")
    status = Column(String(50), nullable=False, default="active")  # 'active', 'scanning', 'error'
    health_score = Column(Integer, nullable=True, default=100)  # Stores persisted scan health score (0-100)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="cloud_accounts")
    resources = relationship("Resource", back_populates="cloud_account", cascade="all, delete-orphan")
    cost_records = relationship("CostRecord", back_populates="cloud_account", cascade="all, delete-orphan")
    security_findings = relationship("SecurityFinding", back_populates="cloud_account", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="cloud_account", cascade="all, delete-orphan")
    scan_jobs = relationship("ScanJob", back_populates="cloud_account", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CloudAccount(id={self.id}, name='{self.account_name}', type='{self.account_type}')>"
