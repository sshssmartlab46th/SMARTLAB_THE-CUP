import { createGroqResponse } from '../server/groqHandler';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : (req.headers?.['x-session-token'] as string) || req.body?.token || req.body?.sessionToken;
    const ip =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const result = await createGroqResponse(req.body || {}, { token, ip });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Groq] request failed:', error);
    res.status(502).json({ error: 'Groq request failed.' });
  }
}
