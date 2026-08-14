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

export function calculateProgramMetrics(
  logs: Log[],
  mesoId: number,
  expectedSessions: number,
  initialBodyWeight?: number,
  daysPerWeek = 4,
): ProgramMetrics {
  const relevant = logs.filter((log) => log.mesoId === mesoId && !log.skipped);
  const setsCompleted = relevant.reduce((sum, log) => sum + log.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.filter((set) => set.completed).length, 0), 0);
  const totalVolume = relevant.reduce((sum, log) => sum + log.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.reduce((setSum, set) => {
    if (!set.completed) return setSum;
    return setSum + (Number(set.weight) || 0) * (Number(set.reps) || 0);
  }, 0), 0), 0);
  const totalSeconds = relevant.reduce((sum, log) => sum + (Number(log.duration) || 0), 0);

  // A week is complete only when every scheduled day has a completed session.
  // The previous implementation counted a week after its first session, which
  // made the KONG Hub show "1 week" after Day 1.
  const daysByWeek = new Map<number, Set<number>>();
  relevant.forEach((log) => {
    if (log.week < 1 || log.dayIdx < 0 || log.dayIdx >= daysPerWeek) return;
    const set = daysByWeek.get(log.week) || new Set<number>();
    set.add(log.dayIdx);
    daysByWeek.set(log.week, set);
  });
  const weeksCompleted = Array.from(daysByWeek.values()).filter((days) => days.size >= daysPerWeek).length;

  // Repeating the same scheduled day is a real session and remains included in
  // sessionsCompleted, volume, time and density, but it must not inflate plan
  // adherence. Adherence measures unique scheduled slots completed.
  const completedScheduledSlots = new Set(
    relevant
      .filter((log) => log.week >= 1 && log.dayIdx >= 0 && log.dayIdx < daysPerWeek)
      .map((log) => `${log.week}:${log.dayIdx}`),
  ).size;

  const latestBodyWeightLog = relevant.reduce<Log | null>((latest, log) => {
    if (!Number.isFinite(log.bodyWeightSnapshot)) return latest;
    if (!latest || (Number(log.endTime) || 0) > (Number(latest.endTime) || 0)) return log;
    return latest;
  }, null);
  const currentBodyWeight = latestBodyWeightLog?.bodyWeightSnapshot;

  return {
    sessionsCompleted: relevant.length,
    weeksCompleted,
    setsCompleted,
    totalSeconds,
    totalVolume,
    averageDensity: totalSeconds > 0 ? setsCompleted / (totalSeconds / 60) : 0,
    adherence: expectedSessions > 0 ? Math.min(1, completedScheduledSlots / expectedSessions) : 0,
    initialBodyWeight,
    currentBodyWeight,
  };
}
