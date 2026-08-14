import type { Log } from '../../types';

export interface ProgramMetrics {
  sessionsCompleted: number;
  weeksCompleted: number;
  setsCompleted: number;
  totalSeconds: number;
  totalVolume: number;
  averageDensity: number;
  adherence: number;
  initialBodyWeight?: number;
  currentBodyWeight?: number;
}

export function calculateProgramMetrics(logs: Log[], mesoId: number, expectedSessions: number, initialBodyWeight?: number): ProgramMetrics {
  const relevant = logs.filter((log) => log.mesoId === mesoId && !log.skipped);
  const setsCompleted = relevant.reduce((sum, log) => sum + log.exercises.reduce((exerciseSum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0), 0);
  const totalVolume = relevant.reduce((sum, log) => sum + log.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.reduce((setSum, set) => setSum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0), 0);
  const totalSeconds = relevant.reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
  const weeks = new Set(relevant.map((log) => log.week)).size;
  const currentBodyWeight = relevant.find((log) => Number.isFinite(log.bodyWeightSnapshot))?.bodyWeightSnapshot;
  return {
    sessionsCompleted: relevant.length,
    weeksCompleted: weeks,
    setsCompleted,
    totalSeconds,
    totalVolume,
    averageDensity: totalSeconds > 0 ? setsCompleted / (totalSeconds / 60) : 0,
    adherence: expectedSessions > 0 ? Math.min(1, relevant.length / expectedSessions) : 0,
    initialBodyWeight,
    currentBodyWeight,
  };
}
