import { describe, it, expect } from 'vitest';
import { LocalSceneAnalyzer } from './aiAnalyzer';

const analyzer = new LocalSceneAnalyzer();

describe('LocalSceneAnalyzer.analyze', () => {
  it('returns a valid SceneAnalysis shape', () => {
    const result = analyzer.analyze('The dragon flew over the ancient realm.');
    expect(result).toHaveProperty('mood');
    expect(result).toHaveProperty('visualPrompt');
    expect(result).toHaveProperty('particleType');
    expect(result).toHaveProperty('intensity');
    expect(result).toHaveProperty('colorPalette');
    expect(Array.isArray(result.colorPalette)).toBe(true);
  });

  it('classifies fantasy mood from keyword-rich text', () => {
    const result = analyzer.analyze('The wizard cast a spell with his arcane magic in the enchanted realm.');
    expect(result.mood).toBe('fantasy');
  });

  it('classifies action mood from keyword-rich text', () => {
    const result = analyzer.analyze('The intense battle and fight caused an explosion of adrenaline.');
    expect(result.mood).toBe('action');
  });

  it('classifies peaceful mood when no keywords match', () => {
    const result = analyzer.analyze('She walked quietly along the path.');
    expect(result.mood).toBe('peaceful');
  });

  it('classifies noir mood from keywords', () => {
    const result = analyzer.analyze('The detective investigated the murder in the dark shadow of the crime.');
    expect(result.mood).toBe('noir');
  });

  it('classifies intimate mood from keywords', () => {
    const result = analyzer.analyze('He whispered tender words of love and romance to his beloved.');
    expect(result.mood).toBe('intimate');
  });
});

describe('LocalSceneAnalyzer intensity', () => {
  it('returns intensity in [0, 1] range', () => {
    const result = analyzer.analyze('Normal text without emphasis.');
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });

  it('returns higher intensity for exclamation-heavy text', () => {
    const calm = analyzer.analyze('She walked along the path.');
    const excited = analyzer.analyze('RUN! FIGHT! ATTACK! DANGER!!!');
    expect(excited.intensity).toBeGreaterThan(calm.intensity);
  });

  it('clamps intensity to maximum of 1', () => {
    const result = analyzer.analyze('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    expect(result.intensity).toBeLessThanOrEqual(1);
  });
});

describe('LocalSceneAnalyzer particle mapping', () => {
  it('maps fantasy mood to embers particles', () => {
    const result = analyzer.analyze('The dragon and wizard cast magic spells in the enchanted realm.');
    expect(result.particleType).toBe('embers');
  });

  it('maps peaceful mood to none particles', () => {
    const result = analyzer.analyze('She rested quietly by the calm serene lake at dusk.');
    expect(result.particleType).toBe('none');
  });
});
