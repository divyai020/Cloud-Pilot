from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Recommendation(Base):
    """
    Recommendation entity representing AI-generated and rule-based cost optimization suggestions.
    """
    __tablename__ = "recommendations"

    id = Column(String(50), primary_key=True)  # e.g. 'REC-001'
    cloud_account_id = Column(UUID(as_uuid=True), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    resource = Column(String(255), nullable=False)  # Resource identifier e.g. 'web-server-prod'
    priority = Column(String(20), nullable=False, index=True)  # 'High', 'Medium', 'Low'
    description = Column(Text, nullable=False)
    estimated_savings = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    cloud_account = relationship("CloudAccount", back_populates="recommendations")

    def __repr__(self):
        return f"<Recommendation(id='{self.id}', title='{self.title}', savings={self.estimated_savings})>"
