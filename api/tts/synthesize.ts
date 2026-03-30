import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchWithRetry } from '../../server/lib/fetchWithRetry';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'TTS service not configured' });
  }

  const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body as {
    text?: string;
    voiceId?: string;
  };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const upstream = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `TTS provider error: ${upstream.statusText}` });
    }

    const audioBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS proxy error:', err);
    return res.status(502).json({ error: 'TTS service unavailable' });
  }
}
