/**
 * Local development API server.
 * In production, Vercel serverless functions in api/ handle these routes.
 * Vite dev server proxies /api/* to this server (port 3001).
 */
import express from 'express';
import { fetchWithRetry } from './lib/fetchWithRetry';

const app = express();
app.use(express.json({ limit: '10kb' }));

app.post('/api/tts/synthesize', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'TTS service not configured' });
    return;
  }

  const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body as {
    text?: string;
    voiceId?: string;
  };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  try {
    const upstream = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `TTS provider error: ${upstream.statusText}` });
      return;
    }

    const audioBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS proxy error:', err);
    res.status(502).json({ error: 'TTS service unavailable' });
  }
});

app.post('/api/scene/analyze', async (req, res) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Scene analysis service not configured' });
    return;
  }

  const { text, storyContext } = req.body as { text?: string; storyContext?: string };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const prompt = `Analyze the following narration and provide a scene description.

Narration: "${text.substring(0, 2000)}"
${storyContext ? `Story Context: ${storyContext}` : ''}

Respond in JSON format with these fields:
{
  "mood": "fantasy" | "noir" | "intimate" | "mysterious" | "action" | "peaceful",
  "visualPrompt": "detailed visual description for the scene",
  "particleType": "embers" | "rain" | "fog" | "leaves" | "dust" | "none",
  "intensity": 0.0 to 1.0,
  "colorPalette": ["color1", "color2", "color3"]
}

Keep the response concise and ensure valid JSON.`;

  try {
    const upstream = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Analysis provider error: ${upstream.statusText}` });
      return;
    }

    const data = (await upstream.json()) as { content: Array<{ text: string }> };
    const content = data.content[0]?.text || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({ error: 'Invalid response from analysis provider' });
      return;
    }

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('Scene analysis proxy error:', err);
    res.status(502).json({ error: 'Scene analysis service unavailable' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Dev API server on http://localhost:${port}`));
