import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLLMConfig, callLLM } from '../../server/lib/llmProvider';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getLLMConfig();
  if (!config) {
    return res.status(503).json({ error: 'Scene analysis service not configured' });
  }

  const { text, storyContext } = req.body as { text?: string; storyContext?: string };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
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
      return res.status(502).json({ error: 'Invalid response from analysis provider' });
    }
    return res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('Scene analysis proxy error:', err);
    return res.status(502).json({ error: 'Scene analysis service unavailable' });
  }
}
