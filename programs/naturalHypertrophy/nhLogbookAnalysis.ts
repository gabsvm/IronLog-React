import type { Log, SessionExercise, WorkoutSet } from '../../types';
import { evaluateNhPlateauTrend, type NhPlateauStatus } from './nhVerifiedKnowledge.ts';

export interface NhCoachExposure {
  time: number;
  maxWeight: number;
  totalReps: number;
  completedSets: number;
  targetReps: string;
  programSlotId: string;
  contextKey: string;
}

export type NhCoachState = NhPlateauStatus | 'context_changed';

export interface NhCoachTrend {
  exerciseId: string;
  exposures: NhCoachExposure[];
  allRecent: NhCoachExposure[];
  state: NhCoachState;
  label: { en: string; es: string };
  excludedForContext: number;
}

export interface NhExerciseHistory {
  exerciseId: string;
  exposureCount: number;
  firstAt: number;
  lastAt: number;
  spanDays: number;
  experiencedByGainsLabHeuristic: boolean;
}

const workingSets = (exercise: SessionExercise): WorkoutSet[] => (exercise.sets || []).filter(set =>
  set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop'
);

const normalizeTime = (value: unknown) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
};

export function nhExposureFromLog(log: Log, exercise: SessionExercise): NhCoachExposure | null {
  const sets = workingSets(exercise);
  if (sets.length === 0 || exercise.id == null) return null;
  const weights = sets.map(set => Number(set.weight || 0)).filter(Number.isFinite);
  const reps = sets.map(set => Number(set.reps || 0)).filter(Number.isFinite);
  const completedSets = sets.length;
  const targetReps = String(exercise.targetReps || '').trim();
  const programSlotId = String(exercise.programSlotId || '').trim();
  const programSystemId = String(log.programSystem?.systemId || '').trim();
  const trainingContext = programSlotId
    ? `${programSystemId || 'structured'}:slot:${programSlotId}`
    : `meso:${String(log.mesoId ?? 'unknown')}:day:${String(log.dayIdx ?? 'unknown')}`;
  const contextKey = `${trainingContext}|${targetReps || 'no-range'}|sets:${completedSets}`;
  return {
    time: normalizeTime(log.endTime || log.startTime),
    maxWeight: weights.length ? Math.max(...weights) : 0,
    totalReps: reps.reduce((sum, value) => sum + value, 0),
    completedSets,
    targetReps,
    programSlotId,
    contextKey,
  };
}

export function buildNhCoachTrends(logs: Log[]): NhCoachTrend[] {
  const byExercise = new Map<string, NhCoachExposure[]>();
  (Array.isArray(logs) ? logs : [])
    .filter(log => !log.skipped)
    .forEach(log => (log.exercises || []).forEach(exercise => {
      const exposure = nhExposureFromLog(log, exercise);
      if (!exposure || exercise.id == null) return;
      const key = String(exercise.id);
      const list = byExercise.get(key) || [];
      list.push(exposure);
      byExercise.set(key, list);
    }));

  return Array.from(byExercise.entries()).map(([exerciseId, raw]) => {
    const sorted = raw.slice().sort((a, b) => b.time - a.time);
    const allRecent = sorted.slice(0, 4);
    const latest = sorted[0];
    if (!latest) {
      return {
        exerciseId,
        exposures: [],
        allRecent: [],
        state: 'learning' as const,
        label: { en: 'More comparable exposures are needed.', es: 'Todavía faltan exposiciones comparables.' },
        excludedForContext: 0,
      };
    }

    const comparable = sorted.filter(item => item.contextKey === latest.contextKey).slice(0, 4);
    const excludedForContext = allRecent.filter(item => item.contextKey !== latest.contextKey).length;

    if (comparable.length < 2 && sorted.length >= 2 && excludedForContext > 0) {
      return {
        exerciseId,
        exposures: comparable,
        allRecent,
        state: 'context_changed' as const,
        label: {
          en: 'Context changed · recent exposures use a different program/slot, rep target or number of work sets.',
          es: 'Cambió el contexto · las exposiciones recientes usan otro programa/slot, rango objetivo o número de series efectivas.',
        },
        excludedForContext,
      };
    }

    const cue = evaluateNhPlateauTrend(comparable.map(item => ({ maxWeight: item.maxWeight, totalReps: item.totalReps })));
    return {
      exerciseId,
      exposures: comparable,
      allRecent,
      state: cue.status,
      label: cue.label,
      excludedForContext,
    };
  });
}

export function collectNhExerciseHistory(logs: Log[]): NhExerciseHistory[] {
  const times = new Map<string, number[]>();
  (Array.isArray(logs) ? logs : [])
    .filter(log => !log.skipped)
    .forEach(log => (log.exercises || []).forEach(exercise => {
      const exposure = nhExposureFromLog(log, exercise);
      if (!exposure || exercise.id == null || !exposure.time) return;
      const id = String(exercise.id);
      const list = times.get(id) || [];
      list.push(exposure.time);
      times.set(id, list);
    }));

  return Array.from(times.entries()).map(([exerciseId, raw]) => {
    const ordered = Array.from(new Set(raw)).sort((a, b) => a - b);
    const firstAt = ordered[0] || 0;
    const lastAt = ordered[ordered.length - 1] || 0;
    const spanDays = firstAt && lastAt ? Math.floor((lastAt - firstAt) / 86_400_000) : 0;
    const exposureCount = ordered.length;
    return {
      exerciseId,
      exposureCount,
      firstAt,
      lastAt,
      spanDays,
      experiencedByGainsLabHeuristic: exposureCount >= 6 && spanDays >= 90,
    };
  });
}
