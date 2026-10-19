from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.schemas.assistant import (
    AssistantAskRequest,
    AssistantAskResponse,
    AssistantRetrieveRequest,
    AssistantRetrieveResponse
)
from app.services import assistant_service, retrieval_service, auth_service
from app.services.dashboard_service import get_user_cloud_account
from app.auth.dependencies import get_db, get_current_user
from app.auth.jwt_handler import decode_access_token
from app.models.user import User

router = APIRouter(prefix="/assistant", tags=["AI Assistant & RAG Retrieval"])

security = HTTPBearer(auto_error=False)

@router.post("/ask", response_model=AssistantAskResponse, status_code=status.HTTP_200_OK)
def ask_ai_assistant(
    request: AssistantAskRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
):
    """
    AI Assistant Endpoint:
    Answers questions using the configured LLM (e.g. Gemini) grounded in cloud data,
    or answers general cloud architecture and tech questions in demo mode.
    """
    current_user = None
    if credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and payload.get("sub"):
            current_user = auth_service.get_user_by_id(db, user_id=payload.get("sub"))

    if current_user:
        try:
            response_data = assistant_service.process_assistant_question(
                db=db,
                user=current_user,
                question=request.question,
                account_id=request.accountId
            )
            return response_data
        except HTTPException as he:
            if he.status_code == 404:
                # User has not connected a cloud account yet; fall through to direct Gemini LLM generation
                pass
            else:
                raise

    # Demo / Guest mode: Generate answer directly via configured LLM (Gemini)
    from app.services.llm_service import generate_answer
    llm_res = generate_answer(question=request.question, retrieved_context=[])
    reply = llm_res.get("answer") or "I am your Cloud Pilot AI Assistant. How can I help you optimize your cloud infrastructure today?"
    
    return AssistantAskResponse(
        question=request.question,
        category="GENERAL",
        answer=reply,
        context={
            "summary": {
                "healthScore": 94,
                "monthlyCost": 48500.0,
                "totalResources": 18,
                "securityFindings": {"critical": 1, "high": 2, "medium": 3},
                "potentialSavings": 13100.0
            }
        },
        sources=["gemini_llm"],
        retrievedContext=[],
        generationMode="llm"
    )


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
