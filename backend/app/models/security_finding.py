from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class SecurityFinding(Base):
    """
    SecurityFinding entity representing cloud security vulnerabilities and compliance alerts.
    """
    __tablename__ = "security_findings"

    id = Column(String(50), primary_key=True)  # e.g. 'SEC-001'
    cloud_account_id = Column(UUID(as_uuid=True), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    resource = Column(String(255), nullable=False)  # Resource identifier e.g. 'customer-data-backup'
    severity = Column(String(20), nullable=False, index=True)  # 'Critical', 'High', 'Medium', 'Low'
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="Active")  # 'Active', 'Resolved', 'Dismissed'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    cloud_account = relationship("CloudAccount", back_populates="security_findings")

    def __repr__(self):
        return f"<SecurityFinding(id='{self.id}', title='{self.title}', severity='{self.severity}')>"
