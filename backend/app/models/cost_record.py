from sqlalchemy import Column, BigInteger, String, Date, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CostRecord(Base):
    """
    CostRecord entity representing historical spending per cloud service.
    """
    __tablename__ = "cost_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    cloud_account_id = Column(UUID(as_uuid=True), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    service_name = Column(String(50), nullable=False, index=True)  # 'EC2', 'RDS', 'S3', 'Lambda', 'Other'
    period_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    cloud_account = relationship("CloudAccount", back_populates="cost_records")

    def __repr__(self):
        return f"<CostRecord(service='{self.service_name}', date='{self.period_date}', amount={self.amount})>"
