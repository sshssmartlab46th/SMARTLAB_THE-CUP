import { handleMvpVote } from '../server/mvpHandler';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed.' });
    return;
  }

  try {
    const result = await handleMvpVote(req.body || {});
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[MVPVote] request failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
