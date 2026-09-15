import { createGroqResponse } from '../server/groqHandler';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const result = await createGroqResponse(req.body || {});
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Groq] request failed:', error);
    res.status(502).json({ error: 'Groq request failed.' });
  }
}