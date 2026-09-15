type GroqMessageContent =
  | string
  | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: GroqMessageContent;
}

interface GroqRequest {
  messages?: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface GroqResult {
  status: number;
  body: Record<string, unknown>;
}

export async function createGroqResponse(input: GroqRequest): Promise<GroqResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: 'GROQ_API_KEY is not configured.',
        code: 'GROQ_NOT_CONFIGURED'
      }
    };
  }

  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    return {
      status: 400,
      body: { error: 'At least one message is required.' }
    };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.model || 'llama-3.3-70b-versatile',
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.max_tokens ?? 700
    })
  });

  const body = await response.json().catch(() => ({
    error: 'Groq returned an invalid response.'
  })) as Record<string, unknown>;

  return { status: response.status, body };
}