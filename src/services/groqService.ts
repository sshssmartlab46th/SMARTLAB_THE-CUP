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

export async function askGroq(
  messages: GroqChatMessage[],
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    throw new Error(payload.error?.message || payload.error || 'Groq AI 요청에 실패했습니다.');
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq에서 응답 내용을 받지 못했습니다.');
  }
  return content.trim();
}