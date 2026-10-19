from uuid import UUID
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict

class AssistantAskRequest(BaseModel):
    """
    Request payload schema for asking questions to the AI Assistant.
    """
    question: str = Field(..., description="User question e.g. 'Which resources are costing the most?'")
    accountId: Optional[UUID] = Field(None, alias="account_id", serialization_alias="accountId", description="Optional target cloud account UUID")

    model_config = ConfigDict(
        populate_by_name=True
    )

class RetrievalResultItem(BaseModel):
    """
    Schema representing a single retrieved context chunk from FAISS similarity search.
    """
    content: str = Field(..., description="Human-readable text chunk derived from PostgreSQL")
    score: float = Field(..., description="Vector similarity score (Cosine Similarity / Inner Product)")
    sourceType: str = Field(..., alias="source_type", serialization_alias="sourceType", description="Entity category e.g. resource, cost_record, security_finding, recommendation, cloud_account")
    sourceId: str = Field(..., alias="source_id", serialization_alias="sourceId", description="Source record primary key identifier")
    accountId: str = Field(..., alias="account_id", serialization_alias="accountId", description="Cloud account UUID owning this record")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Structured attributes for Phase 11C LLM prompt context")

    model_config = ConfigDict(
        populate_by_name=True
    )

class AssistantAskResponse(BaseModel):
    """
    Structured response schema from the AI Assistant backend.
    Phase 11B adds optional retrievedContext while keeping Phase 11A fully backward compatible.
    """
    question: str = Field(..., description="The original user query")
    category: str = Field(..., description="Rule-based intent category: COST, SECURITY, HEALTH, RESOURCES, RECOMMENDATIONS, GENERAL")
    answer: str = Field(..., description="Deterministic, data-grounded answer based on PostgreSQL records")
    context: Dict[str, Any] = Field(..., description="Structured cloud context gathered for this query")
    sources: List[str] = Field(..., description="Database tables/entities queried for building context")
    retrievedContext: Optional[List[RetrievalResultItem]] = Field(None, alias="retrieved_context", serialization_alias="retrievedContext", description="Top-K vector search context chunks retrieved via Phase 11B FAISS RAG layer")
    generationMode: Optional[str] = Field("rule_based_fallback", alias="generation_mode", serialization_alias="generationMode", description="Answer generation mode: 'llm' or 'rule_based_fallback'")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class AssistantRetrieveRequest(BaseModel):
    """
    Request payload schema for internal/testing RAG retrieval endpoint.
    """
    question: str = Field(..., description="User question to retrieve relevant context chunks for")
    accountId: Optional[UUID] = Field(None, alias="account_id", serialization_alias="accountId", description="Target cloud account UUID")
    topK: int = Field(5, alias="top_k", serialization_alias="topK", description="Number of top relevant chunks to retrieve (default: 5)")

    model_config = ConfigDict(
        populate_by_name=True
    )

class AssistantRetrieveResponse(BaseModel):
    """
    Response payload schema for RAG retrieval endpoint.
    """
    query: str = Field(..., description="Original question string")
    accountId: str = Field(..., alias="account_id", serialization_alias="accountId", description="Target cloud account UUID")
    results: List[RetrievalResultItem] = Field(..., description="Retrieved relevant context chunks ranked by similarity score")
    totalChunksIndexed: int = Field(..., alias="total_chunks_indexed", serialization_alias="totalChunksIndexed", description="Total number of chunks created and indexed for this account")
    fallbackUsed: bool = Field(..., alias="fallback_used", serialization_alias="fallbackUsed", description="Flag indicating if fallback/empty handling was used")
    message: str = Field(..., description="Status message")

    model_config = ConfigDict(
        populate_by_name=True
    )
