import logging
from typing import Optional, Dict, Any, List, Callable
from app.config import settings
from app.services.retrieval_service import sanitize_text

logger = logging.getLogger("cloudpilot.services.llm_service")

# Global mock LLM handler hook for testing
_mock_llm_handler: Optional[Callable[..., str]] = None


def set_mock_llm_handler(handler_func: Optional[Callable[..., str]]):
    """
    Sets a mock LLM handler function for automated offline testing.
    Pass None to reset to default behavior.
    """
    global _mock_llm_handler
    _mock_llm_handler = handler_func


def build_llm_prompt(
    question: str,
    retrieved_context: List[Dict[str, Any]],
    intent: Optional[str] = None
) -> tuple[str, str]:
    """
    Constructs system and user prompts for the LLM with prompt injection safeguards.
    """
    system_prompt = (
        "You are the Cloud Pilot AI Assistant, an expert cloud governance, cost optimization, and security advisor.\n"
        "Your task is to provide accurate, clear, and helpful answers.\n\n"
        "GUIDELINES:\n"
        "1. For questions specifically about the user's connected account, spending, or resources, ground your answer in the provided cloud context.\n"
        "2. For general questions about AWS, cloud architecture, security best practices, or definitions (e.g. 'what is AWS', 'how does S3 work'), use your comprehensive cloud computing expertise to provide clear, thorough, and helpful explanations.\n"
        "3. Keep answers professional, well-structured, formatted in clear markdown, and concise."
    )

    # Format context chunks cleanly
    context_chunks = []
    for idx, item in enumerate(retrieved_context, 1):
        content = sanitize_text(item.get("content", "")).strip()
        score = item.get("score", 0.0)
        source_type = item.get("source_type", "data")
        context_chunks.append(f"[Chunk #{idx} | Type: {source_type} | Relevance Score: {score:.2f}]\n{content}")

    context_str = "\n\n".join(context_chunks) if context_chunks else "No relevant context chunks were retrieved for this account."

    user_prompt = (
        f"USER QUESTION:\n{question}\n\n"
        f"--- BEGIN RETRIEVED CLOUD PILOT CONTEXT ---\n"
        f"{context_str}\n"
        f"--- END RETRIEVED CLOUD PILOT CONTEXT ---\n\n"
        f"Please provide a helpful, expert answer. If cloud context is provided above, ground your answer in it. For general cloud topics, best practices, or if no account context is available, answer thoroughly using your expert cloud knowledge."
    )

    return system_prompt, user_prompt


def generate_answer(
    question: str,
    retrieved_context: List[Dict[str, Any]],
    intent: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates an LLM response using retrieved context.
    If the LLM provider fails, times out, is unconfigured, or returns an error,
    gracefully returns fallback signal so the rule-based assistant handles the response.
    """
    # Sanitize all context items first
    sanitized_context = []
    for item in retrieved_context:
        clean_item = dict(item)
        clean_item["content"] = sanitize_text(item.get("content", ""))
        sanitized_context.append(clean_item)

    system_prompt, user_prompt = build_llm_prompt(question, sanitized_context, intent)

    api_key = (settings.LLM_API_KEY or "").strip()
    provider = (settings.LLM_PROVIDER or "openai").lower().strip()
    model = (settings.LLM_MODEL or "gpt-3.5-turbo").strip()
    timeout = getattr(settings, "LLM_TIMEOUT", 10)

    # 1. Check for registered mock LLM handler (used in test suite)
    if _mock_llm_handler is not None:
        try:
            mock_answer = _mock_llm_handler(system_prompt, user_prompt, question, sanitized_context)
            if mock_answer is not None:
                return {
                    "answer": mock_answer,
                    "generation_mode": "llm",
                    "model": f"mock-{model}"
                }
        except Exception as e:
            logger.warning(f"Mock LLM handler raised exception: {e}. Falling back.")

    # 2. Check for missing API key or mock provider configuration
    if not api_key or api_key == "your_llm_api_key_here" or provider == "mock":
        logger.info("LLM_API_KEY unconfigured or provider is 'mock'. Using rule-based fallback engine.")
        return {
            "answer": None,
            "generation_mode": "rule_based_fallback",
            "model": "none"
        }

    # 3. Provider Call: Google Gemini or OpenAI
    try:
        import httpx

        if provider == "gemini":
            # Native Google Gemini REST Endpoint with fallback across model aliases
            candidate_models = [model, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro"]
            # Deduplicate while preserving order
            tested_models = []
            for m in candidate_models:
                if m and m not in tested_models:
                    tested_models.append(m)

            last_err = ""
            with httpx.Client(timeout=timeout) as client:
                for target_model in tested_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"
                    gemini_payload = {
                        "contents": [
                            {
                                "parts": [
                                    {"text": f"{system_prompt}\n\n{user_prompt}"}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 800,
                            "thinkingConfig": {
                                "thinkingBudget": 0
                            }
                        }
                    }

                    try:
                        response = client.post(url, json=gemini_payload)
                        if response.status_code == 200:
                            data = response.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                parts = candidates[0]["content"].get("parts", [])
                                if parts and "text" in parts[0]:
                                    return {
                                        "answer": parts[0]["text"].strip(),
                                        "generation_mode": "llm",
                                        "model": target_model
                                    }
                        elif response.status_code == 404:
                            last_err = f"Model {target_model} not found (404), trying fallback."
                            continue
                        else:
                            last_err = f"HTTP {response.status_code}: {response.text[:200]}"
                            break
                    except Exception as exc:
                        last_err = str(exc)
                        break

            logger.warning(f"Gemini API call failed: {last_err}")
            return {
                "answer": None,
                "generation_mode": "rule_based_fallback",
                "model": model,
                "error": last_err
            }

        else:
            # OpenAI / Compatible Provider
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 600
            }

            url = "https://api.openai.com/v1/chat/completions"
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    answer = data["choices"][0]["message"]["content"].strip()
                    return {
                        "answer": answer,
                        "generation_mode": "llm",
                        "model": model
                    }
                else:
                    logger.warning(f"LLM API call failed with status {response.status_code}. Using fallback.")
                    return {
                        "answer": None,
                        "generation_mode": "rule_based_fallback",
                        "model": model,
                        "error": f"HTTP status {response.status_code}"
                    }

    except Exception as e:
        logger.warning(f"LLM generation failed ({type(e).__name__}): {e}. Using rule-based fallback.")
        return {
            "answer": None,
            "generation_mode": "rule_based_fallback",
            "model": model,
            "error": str(e)
        }

