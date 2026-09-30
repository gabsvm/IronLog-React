import { describe, it, expect } from 'vitest';
import { resolveEffectsMode } from '../../utils/effectsProfile';

describe('resolveEffectsMode', () => {
  it('honors prefers-reduced-motion as highest priority regardless of mode', () => {
    expect(resolveEffectsMode({ effectsMode: 'full', prefersReducedMotion: true })).toBe('reduced');
    expect(resolveEffectsMode({ effectsMode: 'balanced', prefersReducedMotion: true })).toBe('reduced');
    expect(resolveEffectsMode({ effectsMode: 'system', prefersReducedMotion: true })).toBe('reduced');
  });

  it('honors explicit full effects profile even on low hardware specs', () => {
    expect(resolveEffectsMode({
      effectsMode: 'full',
      prefersReducedMotion: false,
      hardwareConcurrency: 4,
      deviceMemory: 4,
      saveData: true,
      isMobileOrTouch: true,
    })).toBe('full');
  });

  it('honors explicit balanced effects profile', () => {
    expect(resolveEffectsMode({
      effectsMode: 'balanced',
      prefersReducedMotion: false,
    })).toBe('balanced');
  });

  it('honors explicit reduced effects profile', () => {
    expect(resolveEffectsMode({
      effectsMode: 'reduced',
      prefersReducedMotion: false,
    })).toBe('reduced');
  });

  describe('system mode', () => {
    it('does NOT force reduced mode solely because of 4GB RAM or 4 CPU cores on mobile (Redmi Note 10)', () => {
      const result = resolveEffectsMode({
        effectsMode: 'system',
        prefersReducedMotion: false,
        hardwareConcurrency: 4,
        deviceMemory: 4,
        isMobileOrTouch: true,
      });
      expect(result).toBe('balanced');
    });

    it('does NOT force reduced mode when saveData is true', () => {
      const result = resolveEffectsMode({
        effectsMode: 'system',
        prefersReducedMotion: false,
        saveData: true,
        isMobileOrTouch: true,
      });
      expect(result).toBe('balanced');
    });

    it('defaults to full on desktop when reduced motion is off', () => {
      const result = resolveEffectsMode({
        effectsMode: 'system',
        prefersReducedMotion: false,
        isMobileOrTouch: false,
      });
      expect(result).toBe('full');
    });
  });

  describe('Capacitor / native-shell profile', () => {
    const capacitorMobileSpecs = {
      isMobileOrTouch: true,
      hardwareConcurrency: 8,
      deviceMemory: 8,
    };

    it('resolves system mode on Capacitor to balanced, NOT reduced', () => {
      expect(resolveEffectsMode({
        effectsMode: 'system',
        prefersReducedMotion: false,
        ...capacitorMobileSpecs,
      })).toBe('balanced');
    });

    it('allows explicit full effects mode inside Capacitor', () => {
      expect(resolveEffectsMode({
        effectsMode: 'full',
        prefersReducedMotion: false,
        ...capacitorMobileSpecs,
      })).toBe('full');
    });

    it('allows explicit reduced effects mode inside Capacitor', () => {
      expect(resolveEffectsMode({
        effectsMode: 'reduced',
        prefersReducedMotion: false,
        ...capacitorMobileSpecs,
      })).toBe('reduced');
    });

    it('forces reduced mode if prefers-reduced-motion is true regardless of platform', () => {
      expect(resolveEffectsMode({
        effectsMode: 'full',
        prefersReducedMotion: true,
        ...capacitorMobileSpecs,
      })).toBe('reduced');

      expect(resolveEffectsMode({
        effectsMode: 'system',
        prefersReducedMotion: true,
        ...capacitorMobileSpecs,
      })).toBe('reduced');
    });
  });
});
