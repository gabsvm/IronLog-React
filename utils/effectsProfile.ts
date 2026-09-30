export type EffectsMode = 'system' | 'full' | 'balanced' | 'reduced';
export type ResolvedEffects = 'full' | 'balanced' | 'reduced';

export interface ResolveEffectsOptions {
  effectsMode: EffectsMode;
  prefersReducedMotion?: boolean;
  isMobileOrTouch?: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  saveData?: boolean;
}

/**
 * Resolves the visual effects profile according to the GainsLab PWA performance spec.
 *
 * Rules:
 * 1. `prefers-reduced-motion` always wins for accessibility and motion safety.
 * 2. Explicit 'full', 'balanced', or 'reduced' always takes precedence over hardware heuristics.
 * 3. In 'system' mode:
 *    - Defaults to 'balanced' on mobile/touch screens (retains transitions, haptics, contextual blur/glass;
 *      disables looping decorative animations and heavy continuous scroll filters).
 *    - Defaults to 'full' on desktop.
 *    - CRITICAL: Neither `deviceMemory <= 4` nor `hardwareConcurrency <= 4` nor `saveData` nor Capacitor
 *      alone is permitted to force 'reduced'.
 */
export function resolveEffectsMode(options: ResolveEffectsOptions): ResolvedEffects {
  if (options.prefersReducedMotion) {
    return 'reduced';
  }

  if (options.effectsMode === 'full') {
    return 'full';
  }

  if (options.effectsMode === 'balanced') {
    return 'balanced';
  }

  if (options.effectsMode === 'reduced') {
    return 'reduced';
  }

  // System (Auto) mode
  if (options.isMobileOrTouch) {
    return 'balanced';
  }

  return 'full';
}
