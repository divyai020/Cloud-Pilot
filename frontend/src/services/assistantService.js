import api from './api';

/**
 * Assistant Service
 * Sends queries to FastAPI backend: POST /api/v1/assistant/ask
 * Falls back to null so caller can present intelligent fallback if offline.
 */
export const askAssistant = async (question, accountId = null) => {
  try {
    const payload = { question };
    if (accountId) {
      payload.accountId = accountId;
    }
    const response = await api.post('/assistant/ask', payload);
    return response.data;
  } catch (err) {
    console.warn('AI Assistant backend request failed, falling back to local model:', err);
    return null;
  }
};
