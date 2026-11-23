import { ActiveSession, Log, MesoCycle, ProgramDay, UserProfile } from '../types';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { getProgramBlockForWeek } from '../programs/engine/ProgramResolver';

export interface CompleteWorkoutInput {
  activeSession: ActiveSession;
  activeMeso: MesoCycle | null;
  program: ProgramDay[];
  logs: Log[];
  userProfile?: UserProfile | null;
  endTime?: number;
}

export interface CompleteWorkoutResult {
  log: Log;
  updatedLogs: Log[];
  updatedMeso: MesoCycle | null;
  isMesoComplete: boolean;
  isWeekComplete: boolean;
  isDetached: boolean;
}

/**
 * Checks whether an active workout is a detached session
 * (freestyle, WOD, calisthenics, two-block, or ad-hoc).
 */
export const isDetachedSession = (activeSession: ActiveSession, activeMeso: MesoCycle | null): boolean => {
  if (!activeMeso) return true;
  if (activeSession.mesoId < 0 || activeSession.dayIdx < 0 || activeSession.week < 0) return true;
  if (activeSession.mesoId !== activeMeso.id) return true;
  return false;
};

/**
 * Builds an immutable, complete Log snapshot from the active session.
 */
export const buildWorkoutLog = (
  activeSession: ActiveSession,
  activeMeso: MesoCycle | null,
  userProfile?: UserProfile | null,
  endTime: number = Date.now()
): Log => {
  const duration = activeSession.startTime ? Math.max(0, (endTime - activeSession.startTime) / 1000) : 0;
  const isDetached = isDetachedSession(activeSession, activeMeso);

  const kongResolution = !isDetached && activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id
    ? getProgramBlockForWeek(KONG_4DAY_V1, activeMeso.week)
    : null;

  return {
    id: activeSession.id || endTime,
    dayIdx: activeSession.dayIdx ?? -1,
    name: activeSession.name || 'Workout',
    startTime: activeSession.startTime || endTime,
    endTime,
    duration,
    bodyWeightSnapshot: userProfile?.bodyWeight,
    mesoId: activeSession.mesoId ?? -1,
    week: activeSession.week ?? -1,
    exercises: (activeSession.exercises || []).map((ex) => ({
      ...ex,
      sets: (ex.sets || []).map((s) => ({ ...s })),
    })),
    note: activeSession.note,
    discipline: (activeSession as any).discipline,
    ...(kongResolution && activeMeso?.programSystem
      ? {
          programSystem: {
            systemId: activeMeso.programSystem.systemId,
            systemVersion: activeMeso.programSystem.systemVersion,
            blockNumber: kongResolution.block.number,
            blockWeek: kongResolution.blockWeek,
          },
        }
      : {}),
  };
};

/**
 * Calculates program and mesocycle progression for scheduled sessions.
 * Never advances program for detached or freestyle sessions.
 */
export const calculateWorkoutProgression = (
  log: Log,
  activeMeso: MesoCycle | null,
  program: ProgramDay[],
  existingLogs: Log[]
): {
  updatedMeso: MesoCycle | null;
  isWeekComplete: boolean;
  isMesoComplete: boolean;
} => {
  if (!activeMeso) {
    return { updatedMeso: null, isWeekComplete: false, isMesoComplete: false };
  }

  // Detached sessions do not progress the mesocycle
  if (log.mesoId < 0 || log.dayIdx < 0 || log.week < 0 || log.mesoId !== activeMeso.id) {
    return { updatedMeso: activeMeso, isWeekComplete: false, isMesoComplete: false };
  }

  const allLogs = [log, ...(Array.isArray(existingLogs) ? existingLogs : [])];

  const isKong = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id;
  const scheduledDayIndices = isKong
    ? null
    : new Set(
        (program || [])
          .map((d, idx) => ((d.slots || []).length > 0 ? idx : -1))
          .filter((idx) => idx >= 0)
      );
  const totalProgramDays = isKong ? KONG_4DAY_V1.daysPerWeek : (scheduledDayIndices?.size ?? 0);
  const isScheduledDay = (dayIdx: number) =>
    isKong ? dayIdx >= 0 && dayIdx < KONG_4DAY_V1.daysPerWeek : Boolean(scheduledDayIndices?.has(dayIdx));

  const resolvedDaysThisWeek = new Set(
    allLogs
      .filter((l) => l.mesoId === activeMeso.id && l.week === activeMeso.week && isScheduledDay(l.dayIdx))
      .map((l) => l.dayIdx)
  );

  const isWeekComplete = totalProgramDays > 0 && resolvedDaysThisWeek.size >= totalProgramDays;

  if (!isWeekComplete) {
    return { updatedMeso: activeMeso, isWeekComplete: false, isMesoComplete: false };
  }

  // Week is complete: check if entire mesocycle is done
  const totalWeeks = activeMeso.targetWeeks || activeMeso.duration;
  if (activeMeso.week >= totalWeeks) {
    return { updatedMeso: activeMeso, isWeekComplete: true, isMesoComplete: true };
  }

  // Advance to next week (final week of a >=4w non-KONG RP meso automatically enters Deload)
  const nextWeek = activeMeso.week + 1;
  const updatedMeso: MesoCycle = {
    ...activeMeso,
    week: nextWeek,
    isDeload: !isKong && totalWeeks >= 4 && nextWeek === totalWeeks,
  };

  return { updatedMeso, isWeekComplete: true, isMesoComplete: false };
};

/**
 * Single, unified pipeline for completing ANY workout session:
 * planned, freestyle, WOD, calisthenics, or custom.
 */
export const completeWorkoutPipeline = (input: CompleteWorkoutInput): CompleteWorkoutResult => {
  const { activeSession, activeMeso, program, logs, userProfile, endTime = Date.now() } = input;

  const isDetached = isDetachedSession(activeSession, activeMeso);
  const log = buildWorkoutLog(activeSession, activeMeso, userProfile, endTime);
  const updatedLogs = [log, ...(Array.isArray(logs) ? logs : [])];

  const { updatedMeso, isWeekComplete, isMesoComplete } = calculateWorkoutProgression(
    log,
    activeMeso,
    program,
    logs
  );

  return {
    log,
    updatedLogs,
    updatedMeso,
    isMesoComplete,
    isWeekComplete,
    isDetached,
  };
};
