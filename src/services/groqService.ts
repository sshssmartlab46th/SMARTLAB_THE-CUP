export type GroqContent =
  | string
  | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: GroqContent;
}

/**
 * Retrieves the signed session token from client local storage.
 */
export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = localStorage.getItem('sangsan_current_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.token) {
      return parsed.token;
    }
    if (typeof parsed === 'string') {
      return parsed;
    }
  } catch {
    const raw = localStorage.getItem('sangsan_current_user');
    if (raw && raw.includes('.')) {
      return raw;
    }
  }
  return null;
}

export async function askGroq(
  messages: GroqChatMessage[],
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/groq', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      model: options.model,
      max_tokens: options.maxTokens ?? 700,
      temperature: 0.2
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (payload.code === 'GROQ_NOT_CONFIGURED') {
      throw new Error('Groq API 키가 아직 설정되지 않았습니다.');
    }
    if (payload.code === 'UNAUTHORIZED' || response.status === 401) {
      throw new Error('Groq AI 기능을 이용하려면 로그인이 필요합니다.');
    }
    if (payload.code === 'TOO_MANY_REQUESTS' || response.status === 429) {
      throw new Error(payload.error || 'AI 요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error(payload.error?.message || payload.error || 'Groq AI 요청에 실패했습니다.');
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq에서 응답 내용을 받지 못했습니다.');
  }
  return content.trim();
}
