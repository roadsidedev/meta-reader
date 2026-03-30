import { describe, it, expect } from 'vitest';
import { BrowserTTSEngine } from './ttsEngine';

const defaultVoice = { id: 'test', name: 'Test', language: 'en', gender: 'neutral' as const, provider: 'browser' as const };
const engine = new BrowserTTSEngine(defaultVoice);

describe('BrowserTTSEngine.prepareChunks', () => {
  it('produces one chunk for a single sentence', () => {
    const chunks = engine.prepareChunks('Hello world.');
    expect(chunks.length).toBe(1);
  });

  it('produces multiple chunks for multiple sentences', () => {
    const chunks = engine.prepareChunks('First sentence. Second sentence. Third sentence.');
    expect(chunks.length).toBe(3);
  });

  it('first chunk startChar is 0', () => {
    const chunks = engine.prepareChunks('Hello world. How are you?');
    expect(chunks[0].startChar).toBe(0);
  });

  it('chunk endChar does not exceed text length', () => {
    const text = 'Hello world. How are you?';
    const chunks = engine.prepareChunks(text);
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.endChar).toBeLessThanOrEqual(text.length);
  });

  it('chunk startTimes are monotonically non-decreasing', () => {
    const chunks = engine.prepareChunks('First sentence. Second sentence. Third one.');
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].startTime).toBeGreaterThanOrEqual(chunks[i - 1].startTime);
    }
  });

  it('each chunk has a unique id', () => {
    const chunks = engine.prepareChunks('One. Two. Three.');
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to full text when no sentence boundaries found', () => {
    const chunks = engine.prepareChunks('No punctuation here at all');
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe('No punctuation here at all');
  });
});
