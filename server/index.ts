import cors from 'cors';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch with exponential backoff retry on 429 and 5xx responses.
 */
async function fetchWithRetry(url: string, opts: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, opts);
      // Don't retry on client errors (except 429 rate limit)
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 8000)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers
  app.use(helmet());

  // Gzip compression
  app.use(compression());

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : '*';
  app.use(cors({ origin: allowedOrigins }));

  // JSON body parser for API routes (limit to 10kb to prevent abuse)
  app.use(express.json({ limit: '10kb' }));

  // Rate limiter for API proxy routes
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  // ---------------------------------------------------------------------------
  // API Proxy Routes
  // ---------------------------------------------------------------------------

  /**
   * POST /api/tts/synthesize
   * Proxies TTS requests to ElevenLabs using the server-side API key.
   */
  app.post('/api/tts/synthesize', apiLimiter, async (req, res) => {
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
   * Proxies scene analysis requests to Claude using the server-side API key.
   */
  app.post('/api/scene/analyze', apiLimiter, async (req, res) => {
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

  // ---------------------------------------------------------------------------
  // Static files + SPA fallback
  // ---------------------------------------------------------------------------

  const staticPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, 'public')
      : path.resolve(__dirname, '..', 'dist', 'public');

  app.use(
    express.static(staticPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
      etag: true,
    }),
  );

  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
