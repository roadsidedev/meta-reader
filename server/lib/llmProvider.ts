import { fetchWithRetry } from './fetchWithRetry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LLMProvider = 'anthropic' | 'openai' | 'gemini' | 'openrouter' | 'nvidia';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Provider defaults
// ---------------------------------------------------------------------------

const PROVIDER_DEFAULTS: Record<LLMProvider, { model: string; baseUrl: string }> = {
  anthropic: {
    model: 'claude-3-haiku-20240307',
    baseUrl: 'https://api.anthropic.com',
  },
  openai: {
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  gemini: {
    model: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com',
  },
  openrouter: {
    model: 'openai/gpt-4o-mini',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  nvidia: {
    model: 'meta/llama-3.1-8b-instruct',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
  },
};

// ---------------------------------------------------------------------------
// Config reader
// ---------------------------------------------------------------------------

/**
 * Reads LLM configuration from environment variables.
 *
 * Required:
 *   LLM_API_KEY   — API key for the chosen provider
 *
 * Optional:
 *   LLM_PROVIDER  — anthropic | openai | gemini | openrouter | nvidia  (default: anthropic)
 *   LLM_MODEL     — model name, uses provider default when omitted
 *
 * Legacy fallback:
 *   CLAUDE_API_KEY is accepted when LLM_PROVIDER=anthropic and LLM_API_KEY is unset.
 */
export function getLLMConfig(): LLMConfig | null {
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic') as LLMProvider;

  if (!PROVIDER_DEFAULTS[provider]) {
    console.error(`Unknown LLM_PROVIDER: "${provider}". Valid values: ${Object.keys(PROVIDER_DEFAULTS).join(', ')}`);
    return null;
  }

  const apiKey =
    process.env.LLM_API_KEY ??
    (provider === 'anthropic' ? process.env.CLAUDE_API_KEY : undefined) ??
    '';

  if (!apiKey) return null;

  const model = process.env.LLM_MODEL ?? PROVIDER_DEFAULTS[provider].model;

  return { provider, apiKey, model };
}

// ---------------------------------------------------------------------------
// Unified call
// ---------------------------------------------------------------------------

/**
 * Send a single user prompt to the configured LLM and return the text response.
 */
export async function callLLM(config: LLMConfig, prompt: string): Promise<string> {
  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config.apiKey, config.model, prompt);
    case 'openai':
    case 'openrouter':
    case 'nvidia':
      return callOpenAICompat(PROVIDER_DEFAULTS[config.provider].baseUrl, config.apiKey, config.model, prompt);
    case 'gemini':
      return callGemini(config.apiKey, config.model, prompt);
  }
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { content: Array<{ text: string }> };
  const text = data.content[0]?.text;
  if (!text) throw new Error('Empty response from Anthropic');
  return text;
}

/** Handles OpenAI, OpenRouter, and Nvidia NIM — all use the same chat completions format. */
async function callOpenAICompat(baseUrl: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`${baseUrl} error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const text = data.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from provider');
  return text;
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500 },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const text = data.candidates[0]?.content?.parts[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}
