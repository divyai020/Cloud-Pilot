import logging
import hashlib
from uuid import UUID
from typing import Optional, Dict, Any, List
import numpy as np
from sqlalchemy.orm import Session

from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.cost_record import CostRecord
from app.models.security_finding import SecurityFinding
from app.models.recommendation import Recommendation
from app.services.ai_service import generate_ai_recommendations
from app.services.health_service import calculate_cloud_health_score
from app.services.forecast_service import generate_cost_forecast

logger = logging.getLogger("cloudpilot.services.retrieval_service")

# Global cached embedding model instance
_embedding_model = None
_embedding_model_failed = False


def get_embedding_model():
    """
    Lazy-loads and caches the sentence-transformers model ('all-MiniLM-L6-v2').
    If loading fails (e.g. offline environment or missing model files),
    flags failure to switch to deterministic fallback vectors.
    """
    global _embedding_model, _embedding_model_failed
    if _embedding_model_failed:
        return None
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded SentenceTransformer model 'all-MiniLM-L6-v2' successfully.")
        except Exception as e:
            logger.warning(f"Failed to load SentenceTransformer model 'all-MiniLM-L6-v2': {e}. Using deterministic fallback embeddings.")
            _embedding_model_failed = True
            return None
    return _embedding_model


def _fallback_encode_texts(texts: List[str], dim: int = 384) -> np.ndarray:
    """
    Generates deterministic, normalized 384-dimensional float32 embedding vectors
    for offline testing or when HuggingFace downloads are unavailable.
    """
    vectors = []
    for text in texts:
        h = hashlib.sha256(text.encode("utf-8")).hexdigest()
        vec = []
        for i in range(dim):
            sub = hashlib.sha256(f"{h}_{i}".encode("utf-8")).hexdigest()
            # Map sha256 slice to float in range [-1.0, 1.0]
            val = (int(sub[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
            vec.append(val)
        arr = np.array(vec, dtype="float32")
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        vectors.append(arr)
    return np.array(vectors, dtype="float32")


def encode_texts(texts: List[str]) -> np.ndarray:
    """
    Encodes a list of strings into normalized float32 embeddings.
    """
    if not texts:
        return np.empty((0, 384), dtype="float32")

    model = get_embedding_model()
    if model is not None:
        try:
            embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.astype("float32")
        except Exception as e:
            logger.warning(f"Error generating embeddings via SentenceTransformer: {e}")

    return _fallback_encode_texts(texts)


def sanitize_text(text: str) -> str:
    """
    Sanitizes string to prevent any secrets or credentials from leaking into chunks.
    """
    if not text:
        return ""
    # Filter out any potential sensitive patterns
    lines = []
    for line in text.splitlines():
        l_lower = line.lower()
        if any(secret_kw in l_lower for secret_kw in ["secret", "password", "token", "accesskey", "role_arn"]):
            continue
        lines.append(line)
    return "\n".join(lines)


def create_account_chunks(db: Session, account: CloudAccount) -> List[Dict[str, Any]]:
    """
    Converts account-scoped PostgreSQL records into human-readable text chunks with metadata.
    Scoped strictly to the provided cloud account.
    """
    account_id_str = str(account.id)
    chunks: List[Dict[str, Any]] = []

    # A. Cloud Account Overview Chunk
    health_score_str = f"{account.health_score}/100" if account.health_score is not None else "N/A"
    acct_chunk_text = (
        f"Cloud Account: {account.account_name}\n"
        f"Account Type: {account.account_type}\n"
        f"Region: {account.region or 'ap-south-1'}\n"
        f"Status: {account.status}\n"
        f"Health Score: {health_score_str}"
    )
    chunks.append({
        "content": sanitize_text(acct_chunk_text),
        "source_type": "cloud_account",
        "source_id": account_id_str,
        "account_id": account_id_str,
        "metadata": {
            "account_name": account.account_name,
            "account_type": account.account_type,
            "region": account.region,
            "health_score": account.health_score
        }
    })

    # B. Resources Chunks
    resources = db.query(Resource).filter(Resource.cloud_account_id == account.id).all()
    for res in resources:
        cpu_str = f"{res.cpu_utilization:.1f}%" if res.cpu_utilization is not None else "NULL (No metrics)"
        mem_str = f"{res.memory_utilization:.1f}%" if res.memory_utilization is not None else "N/A"
        storage_str = f"{res.storage_gb} GB" if res.storage_gb is not None else "N/A"
        invocations_str = str(res.invocations) if res.invocations is not None else "N/A"
        inst_type_str = res.instance_type or "N/A"

        res_text = (
            f"Resource: {res.name}\n"
            f"Resource ID: {res.id}\n"
            f"Type: {res.type}\n"
            f"Instance Type: {inst_type_str}\n"
            f"Region: {res.region}\n"
            f"State/Status: {res.status}\n"
            f"Monthly Cost: ${res.monthly_cost:.2f}\n"
            f"CPU Utilization: {cpu_str}\n"
            f"Memory Utilization: {mem_str}\n"
            f"Storage: {storage_str}\n"
            f"Invocations: {invocations_str}\n"
            f"Public Access: {res.public_access}\n"
            f"Risk Level: {res.risk}"
        )
        chunks.append({
            "content": sanitize_text(res_text),
            "source_type": "resource",
            "source_id": res.id,
            "account_id": account_id_str,
            "resource_id": res.id,
            "metadata": {
                "resource_name": res.name,
                "type": res.type,
                "region": res.region,
                "monthly_cost": res.monthly_cost,
                "cpu_utilization": res.cpu_utilization,
                "public_access": res.public_access,
                "risk": res.risk
            }
        })

    # C. Cost Record Chunks
    cost_records = db.query(CostRecord).filter(CostRecord.cloud_account_id == account.id).all()
    for cost in cost_records:
        cost_text = (
            f"Cost Record:\n"
            f"Service: {cost.service_name}\n"
            f"Period/Month: {cost.period_date}\n"
            f"Amount: ${cost.amount:.2f}"
        )
        chunks.append({
            "content": sanitize_text(cost_text),
            "source_type": "cost_record",
            "source_id": str(cost.id),
            "account_id": account_id_str,
            "metadata": {
                "service_name": cost.service_name,
                "period_date": str(cost.period_date),
                "amount": cost.amount
            }
        })

    # D. Security Finding Chunks
    sec_findings = db.query(SecurityFinding).filter(SecurityFinding.cloud_account_id == account.id).all()
    for finding in sec_findings:
        sec_text = (
            f"Security Finding:\n"
            f"ID: {finding.id}\n"
            f"Severity: {finding.severity}\n"
            f"Title: {finding.title}\n"
            f"Associated Resource: {finding.resource}\n"
            f"Description: {finding.description}\n"
            f"Recommendation: {finding.recommendation}\n"
            f"Status: {finding.status}"
        )
        chunks.append({
            "content": sanitize_text(sec_text),
            "source_type": "security_finding",
            "source_id": finding.id,
            "account_id": account_id_str,
            "resource_id": finding.resource,
            "severity": finding.severity,
            "metadata": {
                "title": finding.title,
                "severity": finding.severity,
                "resource": finding.resource,
                "status": finding.status
            }
        })

    # E. Recommendation Chunks
    db_recs = db.query(Recommendation).filter(Recommendation.cloud_account_id == account.id).all()
    if db_recs:
        for rec in db_recs:
            rec_text = (
                f"Recommendation:\n"
                f"ID: {rec.id}\n"
                f"Title: {rec.title}\n"
                f"Associated Resource: {rec.resource}\n"
                f"Priority: {rec.priority}\n"
                f"Estimated Monthly Savings: ${rec.estimated_savings:.2f}\n"
                f"Description: {rec.description}"
            )
            chunks.append({
                "content": sanitize_text(rec_text),
                "source_type": "recommendation",
                "source_id": rec.id,
                "account_id": account_id_str,
                "resource_id": rec.resource,
                "metadata": {
                    "title": rec.title,
                    "priority": rec.priority,
                    "estimated_savings": rec.estimated_savings,
                    "resource": rec.resource
                }
            })
    else:
        # Generate dynamic recommendations if DB recommendations table is empty
        try:
            dynamic_recs = generate_ai_recommendations(db, account.user, account.id)
            for idx, drec in enumerate(dynamic_recs, 1):
                rec_text = (
                    f"Recommendation:\n"
                    f"ID: DREC-{idx:03d}\n"
                    f"Title: {drec['title']}\n"
                    f"Associated Resource: {drec['resource']}\n"
                    f"Category: {drec['category']}\n"
                    f"Estimated Monthly Savings: ${drec['estimated_savings']:.2f}\n"
                    f"Description: {drec['description']}"
                )
                chunks.append({
                    "content": sanitize_text(rec_text),
                    "source_type": "recommendation",
                    "source_id": f"DREC-{idx:03d}",
                    "account_id": account_id_str,
                    "resource_id": drec["resource"],
                    "metadata": {
                        "title": drec["title"],
                        "category": drec["category"],
                        "estimated_savings": drec["estimated_savings"],
                        "resource": drec["resource"]
                    }
                })
        except Exception as e:
            logger.warning(f"Could not generate dynamic recommendations for chunking: {e}")

    # F. Cost Forecast & Prediction Chunks
    try:
        forecast_res = generate_cost_forecast(db, account.user, account.id)
        if forecast_res.get("sufficientData") and forecast_res.get("forecast"):
            forecast_lines = []
            for f in forecast_res["forecast"]:
                forecast_lines.append(f"- Month {f['period']}: Projected spend ${f['predictedCost']:,.2f}")
            forecast_str = "\n".join(forecast_lines)
            
            hist_lines = []
            for h in forecast_res.get("historical", [])[-3:]:
                hist_lines.append(f"- Past Month {h['period']}: Actual spend ${h['cost']:,.2f}")
            hist_str = "\n".join(hist_lines)

            forecast_text = (
                f"Cloud Cost Prediction & Spending Forecast:\n"
                f"Account: {account.account_name}\n"
                f"Machine Learning Model: LinearRegression (R^2 accuracy: {forecast_res.get('r2Score')})\n"
                f"Historical Spending Trend:\n{hist_str}\n"
                f"Future Monthly Cost Projections:\n{forecast_str}\n"
                f"Summary: Projected future cloud spending based on historical regression trends."
            )
            chunks.append({
                "content": sanitize_text(forecast_text),
                "source_type": "cost_forecast",
                "source_id": f"FORECAST-{account_id_str}",
                "account_id": account_id_str,
                "metadata": {
                    "model": "LinearRegression",
                    "r2Score": forecast_res.get("r2Score"),
                    "projections": forecast_res.get("forecast")
                }
            })
    except Exception as e:
        logger.warning(f"Could not generate cost forecast chunk: {e}")

    return chunks


def build_vector_index_and_search(
    chunks: List[Dict[str, Any]],
    question: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Performs fast, robust hybrid search (Cosine Similarity + Lexical Token Overlap)
    using pure NumPy and FAISS if available. Works reliably without FAISS dependencies.
    """
    if not chunks:
        return []

    num_chunks = len(chunks)
    texts = [c["content"] for c in chunks]

    # 1. Semantic Embedding Similarity
    chunk_embeddings = encode_texts(texts)  # (N, dim)
    query_embeddings = encode_texts([question])  # (1, dim)

    # Compute cosine similarities via dot product (since vectors are unit-normalized)
    semantic_scores = np.dot(chunk_embeddings, query_embeddings[0])  # (N,)

    # 2. Lexical / Keyword Matching Boost
    q_words = set(w.lower() for w in question.replace(",", " ").replace("?", " ").split() if len(w) > 2)
    lexical_scores = np.zeros(num_chunks, dtype="float32")

    if q_words:
        for idx, text in enumerate(texts):
            t_lower = text.lower()
            matches = sum(1 for w in q_words if w in t_lower)
            lexical_scores[idx] = matches / len(q_words)

    # 3. Hybrid Score: 60% semantic + 40% keyword match
    hybrid_scores = 0.6 * semantic_scores + 0.4 * lexical_scores

    # Rank top_k
    top_indices = np.argsort(-hybrid_scores)[:min(top_k, num_chunks)]

    results = []
    for idx in top_indices:
        item = dict(chunks[idx])
        item["score"] = float(hybrid_scores[idx])
        item["semantic_score"] = float(semantic_scores[idx])
        item["lexical_score"] = float(lexical_scores[idx])
        results.append(item)

    return results

# Keep alias for backward compatibility
build_faiss_index_and_search = build_vector_index_and_search



def retrieve_relevant_context(
    db: Session,
    account_id: UUID,
    question: str,
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Phase 11B Retrieval Service Main Entrypoint:
    1. Fetches account-scoped data from PostgreSQL.
    2. Constructs searchable knowledge chunks with metadata.
    3. Generates embeddings locally using sentence-transformers (or fallback).
    4. Performs FAISS similarity search.
    5. Returns top_k context chunks.
    """
    account = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
    if not account:
        return {
            "query": question,
            "account_id": str(account_id),
            "results": [],
            "total_chunks_indexed": 0,
            "fallback_used": True,
            "message": "Cloud account not found."
        }

    chunks = create_account_chunks(db, account)
    if not chunks:
        return {
            "query": question,
            "account_id": str(account_id),
            "results": [],
            "total_chunks_indexed": 0,
            "fallback_used": True,
            "message": "No data available to index for this cloud account."
        }

    results = build_faiss_index_and_search(chunks, question, top_k=top_k)

    return {
        "query": question,
        "account_id": str(account_id),
        "results": results,
        "total_chunks_indexed": len(chunks),
        "fallback_used": False,
        "message": f"Successfully retrieved top {len(results)} relevant context chunks."
    }
