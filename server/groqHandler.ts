import { verifySessionToken } from './sessionService';

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

export interface GroqRequest {
  messages?: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  token?: string;
  sessionToken?: string;
}

export interface GroqResult {
  status: number;
  body: Record<string, unknown>;
}

export interface RequestOptions {
  token?: string;
  ip?: string;
}

// Approved models whitelist
export const ALLOWED_MODELS = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct'
] as const;

export const DEFAULT_TEXT_MODEL = 'llama-3.3-70b-versatile';
export const DEFAULT_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
export const MAX_TOKENS_CAP = 1000;

// Rate limiting parameters (Max 10 requests per minute per user/IP)
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const MAX_REQUESTS_PER_WINDOW = 10;

const requestTimestamps = new Map<string, number[]>();

/**
 * Resets the rate limit tracker (primarily for testing and administration).
 */
export function resetGroqRateLimits(): void {
  requestTimestamps.clear();
}

/**
 * Checks if a given identifier (studentId or IP) exceeds the rate limit.
 */
function isRateLimited(identifier: string, now: number = Date.now()): boolean {
  if (!identifier) return false;

  const timestamps = requestTimestamps.get(identifier) || [];
  const validTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    requestTimestamps.set(identifier, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  requestTimestamps.set(identifier, validTimestamps);
  return false;
}

/**
 * Helper to check whether any message in the request contains vision (image_url) content.
 */
function hasVisionContent(messages: GroqMessage[]): boolean {
  return messages.some((msg) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((item) => item.type === 'image_url' || Boolean(item.image_url));
    }
    return false;
  });
}

/**
 * Validates authentication, enforces rate limits, restricts models, caps max_tokens,
 * and proxies the request to the Groq API.
 */
export async function createGroqResponse(
  input: GroqRequest,
  options: RequestOptions = {}
): Promise<GroqResult> {
  // 1. Resolve session token from options or request body
  const rawToken = options.token || input.token || input.sessionToken;
  const user = verifySessionToken(rawToken);

  if (!user) {
    return {
      status: 401,
      body: {
        error: '로그인이 필요하거나 인증 세션이 만료되었습니다.',
        code: 'UNAUTHORIZED'
      }
    };
  }

  // 2. Enforce Rate Limiting by user studentId and client IP
  const now = Date.now();
  const userId = user.studentId || user.uid;
  const clientIp = options.ip || '127.0.0.1';

  if (isRateLimited(`user:${userId}`, now) || isRateLimited(`ip:${clientIp}`, now)) {
    return {
      status: 429,
      body: {
        error: 'AI 요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요. (분당 최대 10회)',
        code: 'TOO_MANY_REQUESTS'
      }
    };
  }

  // 3. Check for configured Groq API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: 'GROQ_API_KEY가 서버에 설정되어 있지 않습니다.',
        code: 'GROQ_NOT_CONFIGURED'
      }
    };
  }

  // 4. Validate messages input
  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    return {
      status: 400,
      body: { error: '최소 하나 이상의 대화 메시지가 필요합니다.' }
    };
  }

  // 5. Enforce model selection (server-authoritative model locking)
  const isVision = hasVisionContent(input.messages);
  let targetModel: string;

  if (isVision) {
    targetModel = DEFAULT_VISION_MODEL;
  } else if (input.model && (ALLOWED_MODELS as readonly string[]).includes(input.model)) {
    targetModel = input.model;
  } else {
    targetModel = DEFAULT_TEXT_MODEL;
  }

  // 6. Enforce strict max_tokens upper bound (capped at 1000)
  const requestedMaxTokens = typeof input.max_tokens === 'number' && input.max_tokens > 0 ? input.max_tokens : 700;
  const max_tokens = Math.min(requestedMaxTokens, MAX_TOKENS_CAP);

  const temperature = typeof input.temperature === 'number' ? Math.max(0, Math.min(input.temperature, 2)) : 0.2;

  // 7. Dispatch request to Groq OpenAI-compatible completions endpoint
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: targetModel,
        messages: input.messages,
        temperature,
        max_tokens
      })
    });

    const body = (await response.json().catch(() => ({
      error: 'Groq API에서 올바르지 않은 응답이 반환되었습니다.'
    }))) as Record<string, unknown>;

    return { status: response.status, body };
  } catch (err: any) {
    return {
      status: 502,
      body: {
        error: 'Groq API 연동 중 네트워크 오류가 발생했습니다.',
        details: err?.message || String(err)
      }
    };
  }
}
