import type { MuscleGroup } from '../../types';

export interface PerformanceFeedbackInput {
  cycle: number;
  recovery: number;
  performance: number;
  stimulus: number;
  jointPain: boolean;
}

/**
 * One low-systemic-cost slot per muscle is allowed to absorb a +1/-1 set
 * adjustment. This prevents a muscle-level signal from adding a set to every
 * exercise that happens to train the same muscle.
 */
export const PERFORMANCE_VOLUME_ADAPTIVE_SLOT_BY_MUSCLE: Partial<Record<MuscleGroup, string>> = {
  CHEST: 'pub_machine_incline',
  BACK: 'pub_row',
  SHOULDERS: 'pub_lateral',
  BICEPS: 'pub_hammer',
  TRICEPS: 'pub_pushdown',
  QUADS: 'plb_leg_ext',
  HAMSTRINGS: 'plb_leg_curl',
  CALVES: 'plb_calf',
  ABS: 'plb_abs',
};

/**
 * PERFORMANCE does not reward already-good progress with more volume.
 *
 * +1: only when performance is flat, the muscle arrived clearly fresh and the
 *      local stimulus was not excessive. This is the "stalled + recovered"
 *      case described by the program philosophy.
 *  0: progress is happening, recovery is adequate, calibration is still in
 *      progress, or the pivot is active.
 * -1: clear under-recovery/joint warning, or worse performance together with
 *      less-than-fresh recovery.
 *
 * The return value is deliberately clamped to one set in either direction.
 */
export function calculatePerformanceVolumeAdjustment(input: PerformanceFeedbackInput): -1 | 0 | 1 {
  const { cycle, recovery, performance, stimulus, jointPain } = input;

  // Cycles 1-2 establish honest loads/response. Cycle 8 is the low-fatigue pivot.
  if (cycle <= 2 || cycle >= 8) return 0;

  if (jointPain) return -1;
  if (recovery === 3) return -1;
  if (performance === 1 && recovery >= 2) return -1;

  // Better performance means the current dose is already working: do not add.
  if (performance === 3) return 0;

  // Add only for a genuine "same performance + clearly fresh" signal, and
  // never when the user already describes the local stimulus as excessive.
  if (performance === 2 && recovery === 1 && stimulus !== 3) return 1;

  return 0;
}

export function getPerformanceAdaptiveSlot(muscle: MuscleGroup): string | undefined {
  return PERFORMANCE_VOLUME_ADAPTIVE_SLOT_BY_MUSCLE[muscle];
}
