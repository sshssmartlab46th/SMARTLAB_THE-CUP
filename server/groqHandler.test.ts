import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGroqResponse, resetGroqRateLimits, ALLOWED_MODELS } from './groqHandler';
import { createSignedSessionToken } from './sessionService';
import { UserProfile } from '../src/types';

describe('Groq AI Proxy Handler Security & Logic', () => {
  const originalEnvApiKey = process.env.GROQ_API_KEY;

  const sampleUser: UserProfile = {
    uid: 'user_30101',
    studentId: '30101',
    name: '홍길동',
    role: 'student',
    grade: '3',
    classNum: '01',
    studentNum: '01',
    gender: 'male',
    isTeacher: false,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  const validToken = createSignedSessionToken(sampleUser);

  beforeEach(() => {
    resetGroqRateLimits();
    process.env.GROQ_API_KEY = 'mock_groq_api_key_for_testing';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnvApiKey !== undefined) {
      process.env.GROQ_API_KEY = originalEnvApiKey;
    } else {
      delete process.env.GROQ_API_KEY;
    }
  });

  it('rejects requests without a valid session token with 401', async () => {
    const res = await createGroqResponse({
      messages: [{ role: 'user', content: '안녕' }]
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects requests with invalid/tampered session token with 401', async () => {
    const res = await createGroqResponse(
      { messages: [{ role: 'user', content: '안녕' }] },
      { token: 'invalid.token.here' }
    );

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 503 if GROQ_API_KEY is not configured on the server', async () => {
    delete process.env.GROQ_API_KEY;

    const res = await createGroqResponse(
      { messages: [{ role: 'user', content: '안녕' }] },
      { token: validToken }
    );

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('GROQ_NOT_CONFIGURED');
  });

  it('returns 400 when messages array is missing or empty', async () => {
    const res = await createGroqResponse({ messages: [] }, { token: validToken });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('enforces rate limits (max 10 requests per minute) returning 429', async () => {
    // Perform 10 valid requests
    for (let i = 0; i < 10; i++) {
      const globalFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ choices: [{ message: { content: '응답' } }] })
      });
      vi.stubGlobal('fetch', globalFetch);

      const res = await createGroqResponse(
        { messages: [{ role: 'user', content: `요청 ${i}` }] },
        { token: validToken, ip: '127.0.0.1' }
      );
      expect(res.status).toBe(200);
    }

    // 11th request in same window should be rate limited
    const limitedRes = await createGroqResponse(
      { messages: [{ role: 'user', content: '11번째 요청' }] },
      { token: validToken, ip: '127.0.0.1' }
    );

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.code).toBe('TOO_MANY_REQUESTS');
  });

  it('enforces rate limits by IP address even across different user accounts', async () => {
    const user2: UserProfile = {
      ...sampleUser,
      uid: 'user_30102',
      studentId: '30102'
    };
    const token2 = createSignedSessionToken(user2);

    const sharedIp = '203.0.113.5';

    // 10 requests from user1 on sharedIp
    for (let i = 0; i < 10; i++) {
      const globalFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ choices: [{ message: { content: '응답' } }] })
      });
      vi.stubGlobal('fetch', globalFetch);

      const res = await createGroqResponse(
        { messages: [{ role: 'user', content: `요청 ${i}` }] },
        { token: validToken, ip: sharedIp }
      );
      expect(res.status).toBe(200);
    }

    // Next request from user2 on same sharedIp should be blocked by IP rate limit
    const limitedRes = await createGroqResponse(
      { messages: [{ role: 'user', content: '다른 학번 요청' }] },
      { token: token2, ip: sharedIp }
    );

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.code).toBe('TOO_MANY_REQUESTS');
  });

  it('locks unauthorized models to default text model (llama-3.3-70b-versatile)', async () => {
    let capturedBody: any = null;

    const globalFetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        status: 200,
        json: async () => ({ choices: [{ message: { content: '응답' } }] })
      };
    });
    vi.stubGlobal('fetch', globalFetch);

    const res = await createGroqResponse(
      {
        messages: [{ role: 'user', content: '테스트' }],
        model: 'unauthorized-custom-model-99'
      },
      { token: validToken }
    );

    expect(res.status).toBe(200);
    expect(capturedBody).toBeDefined();
    expect(capturedBody.model).toBe('llama-3.3-70b-versatile');
  });

  it('allows pre-approved text models from whitelist', async () => {
    let capturedBody: any = null;

    const globalFetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        status: 200,
        json: async () => ({ choices: [{ message: { content: '응답' } }] })
      };
    });
    vi.stubGlobal('fetch', globalFetch);

    const res = await createGroqResponse(
      {
        messages: [{ role: 'user', content: '테스트' }],
        model: ALLOWED_MODELS[0]
      },
      { token: validToken }
    );

    expect(res.status).toBe(200);
    expect(capturedBody.model).toBe(ALLOWED_MODELS[0]);
  });

  it('automatically selects vision model when image_url content is present', async () => {
    let capturedBody: any = null;

    const globalFetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        status: 200,
        json: async () => ({ choices: [{ message: { content: '응답' } }] })
      };
    });
    vi.stubGlobal('fetch', globalFetch);

    const res = await createGroqResponse(
      {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '이 사진 분석해줘' },
              { type: 'image_url', image_url: { url: 'data:image/png;base64,1234' } }
            ]
          }
        ],
        model: 'llama-3.3-70b-versatile'
      },
      { token: validToken }
    );

    expect(res.status).toBe(200);
    expect(capturedBody.model).toBe('meta-llama/llama-4-scout-17b-16e-instruct');
  });

  it('caps max_tokens to 1000 upper bound', async () => {
    let capturedBody: any = null;

    const globalFetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        status: 200,
        json: async () => ({ choices: [{ message: { content: '응답' } }] })
      };
    });
    vi.stubGlobal('fetch', globalFetch);

    const res = await createGroqResponse(
      {
        messages: [{ role: 'user', content: '긴 응답 요청' }],
        max_tokens: 50000
      },
      { token: validToken }
    );

    expect(res.status).toBe(200);
    expect(capturedBody.max_tokens).toBe(1000);
  });
});
