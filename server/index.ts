import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLLMConfig, callLLM } from './lib/llmProvider.js';
import { fetchWithRetry } from './lib/fetchWithRetry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: '10kb' }));

  // ---------------------------------------------------------------------------
  // API Proxy Routes (dev only — Vercel functions handle these in production)
  // ---------------------------------------------------------------------------

  /**
   * POST /api/tts/synthesize
   * Proxies TTS requests to ElevenLabs using the server-side API key.
   */
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

  /**
   * POST /api/scene/analyze
   * Proxies scene analysis requests to the configured LLM provider.
   */
  app.post('/api/scene/analyze', async (req, res) => {
    const config = getLLMConfig();
    if (!config) {
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
      const content = await callLLM(config, prompt);
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

  // ---------------------------------------------------------------------------
  // Static files + SPA fallback (dev only)
  // ---------------------------------------------------------------------------

  const staticPath = path.resolve(__dirname, '..', 'dist', 'public');

  app.use(express.static(staticPath, { etag: true }));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const port = process.env.PORT || 3001;

  server.listen(port, () => {
    console.log(`Dev API server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
