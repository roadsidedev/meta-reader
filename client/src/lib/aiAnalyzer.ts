import { Mood, ParticleType } from '@/stores/sceneStore';

export interface SceneAnalysis {
  mood: Mood;
  visualPrompt: string;
  particleType: ParticleType;
  intensity: number;
  colorPalette: string[];
}

/**
 * Local mood analysis using keyword-based classification.
 * Fast, offline-first approach for immediate visual feedback.
 */
export class LocalSceneAnalyzer {
  private moodKeywords: Record<Mood, string[]> = {
    fantasy: ['dragon', 'magic', 'wizard', 'enchant', 'spell', 'quest', 'realm', 'mystical', 'ancient', 'arcane'],
    noir: ['detective', 'murder', 'crime', 'dark', 'shadow', 'mystery', 'noir', 'detective', 'gritty', 'cynical'],
    intimate: ['love', 'heart', 'romance', 'passion', 'beloved', 'sweetheart', 'tender', 'gentle', 'whisper', 'soft'],
    mysterious: ['mystery', 'secret', 'clue', 'investigate', 'puzzle', 'unknown', 'hidden', 'enigma', 'cryptic'],
    action: ['fight', 'battle', 'chase', 'explosion', 'danger', 'combat', 'attack', 'rush', 'intense', 'adrenaline'],
    peaceful: ['peace', 'calm', 'serene', 'quiet', 'tranquil', 'gentle', 'soft', 'rest', 'sleep', 'dream'],
  };

  private particleMap: Record<Mood, ParticleType> = {
    fantasy: 'embers',
    noir: 'rain',
    intimate: 'fog',
    mysterious: 'fog',
    action: 'dust',
    peaceful: 'none',
  };

  private colorPalettes: Record<Mood, string[]> = {
    fantasy: ['#1a1a2e', '#16213e', '#0f3460', '#ffd700', '#ff6b9d'],
    noir: ['#0a0a0a', '#1a1a1a', '#2a2a2a', '#555555', '#888888'],
    intimate: ['#8b6f47', '#a0826d', '#c9a961', '#d4a574', '#e8c9a0'],
    mysterious: ['#2d3142', '#3d4a5c', '#4a5f7f', '#6b7c99', '#8b9db3'],
    action: ['#ff0000', '#ff6b35', '#f7931e', '#fdb833', '#c41e3a'],
    peaceful: ['#87ceeb', '#e0f6ff', '#90ee90', '#fffacd', '#f0e68c'],
  };

  /**
   * Analyze text and return scene configuration.
   */
  analyze(text: string): SceneAnalysis {
    const mood = this.classifyMood(text);
    const intensity = this.calculateIntensity(text);

    return {
      mood,
      visualPrompt: this.generateVisualPrompt(text, mood),
      particleType: this.particleMap[mood],
      intensity,
      colorPalette: this.colorPalettes[mood],
    };
  }

  /**
   * Classify mood based on keyword matching.
   */
  private classifyMood(text: string): Mood {
    const lowerText = text.toLowerCase();
    const scores: Record<Mood, number> = {
      fantasy: 0,
      noir: 0,
      intimate: 0,
      mysterious: 0,
      action: 0,
      peaceful: 0,
    };

    // Score each mood based on keyword matches
    for (const [mood, keywords] of Object.entries(this.moodKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          scores[mood as Mood]++;
        }
      }
    }

    // Return mood with highest score
    let bestMood: Mood = 'peaceful';
    let bestScore = 0;

    for (const [mood, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestMood = mood as Mood;
      }
    }

    return bestMood;
  }

  /**
   * Calculate visual intensity based on text characteristics.
   */
  private calculateIntensity(text: string): number {
    let intensity = 0.5; // Default

    // Increase intensity for exclamation marks and caps
    const exclamationCount = (text.match(/!/g) || []).length;
    const capsCount = (text.match(/[A-Z]/g) || []).length;

    intensity += exclamationCount * 0.05;
    intensity += (capsCount / text.length) * 0.2;

    // Decrease intensity for periods and calm language
    const periodCount = (text.match(/\./g) || []).length;
    intensity -= periodCount * 0.02;

    return Math.max(0, Math.min(1, intensity));
  }

  /**
   * Generate a visual prompt description.
   */
  private generateVisualPrompt(text: string, mood: Mood): string {
    const prompts: Record<Mood, string[]> = {
      fantasy: [
        'Mystical forest with glowing runes and ethereal light',
        'Ancient castle with magical auras and floating particles',
        'Enchanted realm with swirling mists and arcane symbols',
          "Dragon's lair with golden treasure and magical flames",
      ],
      noir: [
        'Dark alley with rain and neon lights reflecting off wet pavement',
          "Dimly lit detective office with cigarette smoke and shadows",
        'Foggy street with silhouettes and mysterious figures',
        'Abandoned warehouse with harsh shadows and industrial decay',
      ],
      intimate: [
        'Warm candlelit room with soft shadows and gentle light',
          "Cozy cabin with fireplace glow and peaceful atmosphere",
        'Moonlit garden with delicate flowers and soft mist',
        'Intimate bedroom with warm amber tones and gentle shadows',
      ],
      mysterious: [
        'Hidden chamber with cryptic symbols and dim light',
        'Fog-shrouded landscape with unknown shapes in the distance',
        'Ancient library with dusty tomes and shadowy corners',
        'Labyrinth of shadows with hidden passages and secrets',
      ],
      action: [
        'Explosive scene with dynamic lighting and motion blur',
        'High-speed chase with dramatic lighting and intensity',
        'Battle scene with intense colors and dynamic effects',
        'Storm with lightning and powerful atmospheric effects',
      ],
      peaceful: [
        'Serene meadow with gentle sunlight and calm atmosphere',
        'Quiet beach with soft waves and peaceful colors',
        'Tranquil forest with dappled sunlight and stillness',
        'Calm lake at sunset with warm, soothing tones',
      ],
    };

    const moodPrompts = prompts[mood];
    return moodPrompts[Math.floor(Math.random() * moodPrompts.length)];
  }
}

/**
 * Cloud-based scene analyzer using Claude API.
 * Provides more sophisticated analysis but requires API calls.
 */
export class CloudSceneAnalyzer {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = 'https://api.anthropic.com/v1/messages') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  /**
   * Analyze text using Claude API.
   */
  async analyze(text: string, storyContext?: string): Promise<SceneAnalysis> {
    const prompt = `Analyze the following narration and provide a scene description.

Narration: "${text}"
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
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text || '{}';

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]) as SceneAnalysis;
      return analysis;
    } catch (error) {
      console.error('Cloud scene analysis failed:', error);
      throw error;
    }
  }
}

/**
 * Hybrid analyzer that uses local analysis first, then optionally calls cloud API.
 */
export class HybridSceneAnalyzer {
  private localAnalyzer: LocalSceneAnalyzer;
  private cloudAnalyzer: CloudSceneAnalyzer | null;
  private useCloud: boolean;

  constructor(cloudApiKey?: string) {
    this.localAnalyzer = new LocalSceneAnalyzer();
    this.cloudAnalyzer = cloudApiKey ? new CloudSceneAnalyzer(cloudApiKey) : null;
    this.useCloud = !!cloudApiKey;
  }

  /**
   * Analyze with local-first approach, optionally using cloud for enhancement.
   */
  async analyze(text: string, storyContext?: string, useCloudIfAvailable: boolean = false): Promise<SceneAnalysis> {
    // Always start with local analysis for immediate feedback
    const localAnalysis = this.localAnalyzer.analyze(text);

    // If cloud is available and requested, enhance with cloud analysis
    if (useCloudIfAvailable && this.cloudAnalyzer) {
      try {
        const cloudAnalysis = await this.cloudAnalyzer.analyze(text, storyContext);
        // Merge cloud analysis with local, preferring cloud for detailed fields
        return {
          ...localAnalysis,
          ...cloudAnalysis,
        };
      } catch (error) {
        console.warn('Cloud analysis failed, using local analysis:', error);
        return localAnalysis;
      }
    }

    return localAnalysis;
  }
}
