import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ScanJob(Base):
    """
    ScanJob entity representing an asynchronous background scan tracking progress (0-100%).
    """
    __tablename__ = "scan_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cloud_account_id = Column(UUID(as_uuid=True), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    progress = Column(Integer, nullable=False, default=0)  # 0, 25, 50, 75, 100
    current_step = Column(String(255), nullable=False, default="Initializing cloud scan")
    status = Column(String(50), nullable=False, default="pending")  # 'pending', 'running', 'completed', 'failed'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    cloud_account = relationship("CloudAccount", back_populates="scan_jobs")

    def __repr__(self):
        return f"<ScanJob(id={self.id}, progress={self.progress}%, status='{self.status}')>"
