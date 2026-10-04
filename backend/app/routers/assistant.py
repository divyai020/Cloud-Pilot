from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.schemas.assistant import (
    AssistantAskRequest,
    AssistantAskResponse,
    AssistantRetrieveRequest,
    AssistantRetrieveResponse
)
from app.services import assistant_service, retrieval_service
from app.services.dashboard_service import get_user_cloud_account
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/assistant", tags=["AI Assistant & RAG Retrieval"])

@router.post("/ask", response_model=AssistantAskResponse, status_code=status.HTTP_200_OK)
def ask_ai_assistant(
    request: AssistantAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Assistant Endpoint:
    1. Authenticates current user via JWT.
    2. Enforces cloud account ownership (returns 404 if unowned / invalid).
    3. Categorizes user question (COST, SECURITY, HEALTH, RESOURCES, RECOMMENDATIONS, GENERAL).
    4. Gathers structured PostgreSQL cloud context.
    5. Retrieves account-scoped RAG context chunks via FAISS local similarity search.
    6. Returns a data-grounded response, structured context, and retrieved chunks without exposing credentials.
    """
    response_data = assistant_service.process_assistant_question(
        db=db,
        user=current_user,
        question=request.question,
        account_id=request.accountId
    )
    return response_data


@router.post("/retrieve", response_model=AssistantRetrieveResponse, status_code=status.HTTP_200_OK)
def retrieve_ai_context(
    request: AssistantRetrieveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Internal / Testing RAG Retrieval Endpoint (Phase 11B):
    1. Authenticates current user via JWT.
    2. Enforces cloud account ownership validation.
    3. Retrieves top-K account-scoped context chunks via FAISS similarity search.
    4. Returns ranked context chunks and metadata.
    """
    account = get_user_cloud_account(db, current_user, request.accountId)
    retrieved_data = retrieval_service.retrieve_relevant_context(
        db=db,
        account_id=account.id,
        question=request.question,
        top_k=request.topK
    )
    return retrieved_data
