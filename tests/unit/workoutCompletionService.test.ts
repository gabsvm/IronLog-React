import { describe, it, expect } from 'vitest';
import {
  isDetachedSession,
  buildWorkoutLog,
  calculateWorkoutProgression,
  completeWorkoutPipeline,
} from '../../services/workoutCompletionService';
import { ActiveSession, MesoCycle, ProgramDay, Log } from '../../types';

describe('workoutCompletionService', () => {
  const dummyMeso: MesoCycle = {
    id: 10,
    name: 'Hypertrophy Meso',
    mesoType: 'hypertrophy',
    week: 1,
    duration: 4,
    plan: [['ex1'], ['ex2']],
  };

  const dummyProgram: ProgramDay[] = [
    {
      id: 'd1',
      dayName: { en: 'Push', es: 'Empuje' },
      slots: [{ exerciseId: 'ex1', muscle: 'CHEST', setTarget: 3 }],
    },
    {
      id: 'd2',
      dayName: { en: 'Pull', es: 'Tracción' },
      slots: [{ exerciseId: 'ex2', muscle: 'BACK', setTarget: 3 }],
    },
  ];

  it('correctly identifies detached sessions vs planned sessions', () => {
    const plannedSession: ActiveSession = {
      id: 100,
      mesoId: 10,
      week: 1,
      dayIdx: 0,
      name: 'Push Day',
      startTime: 1000,
      exercises: [],
    };
    expect(isDetachedSession(plannedSession, dummyMeso)).toBe(false);

    const freestyleSession: ActiveSession = {
      id: 101,
      mesoId: -1,
      week: -1,
      dayIdx: -1,
      name: 'Freestyle',
      startTime: 1000,
      exercises: [],
    };
    expect(isDetachedSession(freestyleSession, dummyMeso)).toBe(true);
    expect(isDetachedSession(plannedSession, null)).toBe(true);

    const mismatchedSession: ActiveSession = {
      ...plannedSession,
      mesoId: 999,
    };
    expect(isDetachedSession(mismatchedSession, dummyMeso)).toBe(true);
  });

  it('builds an immutable log snapshot with duration and bodyweight', () => {
    const session: ActiveSession = {
      id: 200,
      mesoId: 10,
      week: 1,
      dayIdx: 0,
      name: 'Session Snapshot Test',
      startTime: 10000,
      exercises: [
        {
          id: 'ex1',
          instanceId: 1,
          name: 'Bench Press',
          muscle: 'CHEST',
          sets: [{ id: 1, weight: 100, reps: 10, completed: true, type: 'regular', rpe: 8 }],
        },
      ],
    };

    const endTime = 40000; // 30s duration
    const log = buildWorkoutLog(session, dummyMeso, { bodyWeight: 80 } as any, endTime);

    expect(log.id).toBe(200);
    expect(log.name).toBe('Session Snapshot Test');
    expect(log.duration).toBe(30);
    expect(log.endTime).toBe(40000);
    expect(log.bodyWeightSnapshot).toBe(80);
    expect(log.exercises).toHaveLength(1);
    expect(log.exercises[0].sets[0].weight).toBe(100);

    // Verify snapshot immutability
    session.exercises[0].sets[0].weight = 120;
    expect(log.exercises[0].sets[0].weight).toBe(100);
  });

  it('never progresses mesocycle for detached sessions', () => {
    const detachedLog: Log = {
      id: 300,
      name: 'Freestyle Session',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: -1,
      week: -1,
      dayIdx: -1,
      exercises: [],
    };

    const result = calculateWorkoutProgression(detachedLog, dummyMeso, dummyProgram, []);
    expect(result.updatedMeso).toEqual(dummyMeso);
    expect(result.isWeekComplete).toBe(false);
    expect(result.isMesoComplete).toBe(false);
  });

  it('does not progress week until all planned days are completed', () => {
    const day1Log: Log = {
      id: 401,
      name: 'Day 1',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: 10,
      week: 1,
      dayIdx: 0,
      exercises: [],
    };

    // Program has 2 days (d1, d2). Only day 0 is done.
    const result = calculateWorkoutProgression(day1Log, dummyMeso, dummyProgram, []);
    expect(result.isWeekComplete).toBe(false);
    expect(result.updatedMeso?.week).toBe(1);
  });

  it('advances week when all days are completed', () => {
    const existingDay0Log: Log = {
      id: 401,
      name: 'Day 1',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: 10,
      week: 1,
      dayIdx: 0,
      exercises: [],
    };

    const day1Log: Log = {
      id: 402,
      name: 'Day 2',
      startTime: 3000,
      endTime: 4000,
      duration: 1000,
      mesoId: 10,
      week: 1,
      dayIdx: 1,
      exercises: [],
    };

    const result = calculateWorkoutProgression(day1Log, dummyMeso, dummyProgram, [existingDay0Log]);
    expect(result.isWeekComplete).toBe(true);
    expect(result.isMesoComplete).toBe(false);
    expect(result.updatedMeso?.week).toBe(2);
  });

  it('signals mesocycle complete on final week completion', () => {
    const finalWeekMeso: MesoCycle = {
      ...dummyMeso,
      week: 4, // final week (duration: 4)
    };

    const existingDay0Log: Log = {
      id: 501,
      name: 'Day 1',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: 10,
      week: 4,
      dayIdx: 0,
      exercises: [],
    };

    const day1Log: Log = {
      id: 502,
      name: 'Day 2',
      startTime: 3000,
      endTime: 4000,
      duration: 1000,
      mesoId: 10,
      week: 4,
      dayIdx: 1,
      exercises: [],
    };

    const result = calculateWorkoutProgression(day1Log, finalWeekMeso, dummyProgram, [existingDay0Log]);
    expect(result.isWeekComplete).toBe(true);
    expect(result.isMesoComplete).toBe(true);
  });

  it('runs completeWorkoutPipeline for a detached session', () => {
    const detachedSession: ActiveSession = {
      id: 601,
      mesoId: -1,
      week: -1,
      dayIdx: -1,
      name: 'WOD Hero',
      startTime: 1000,
      exercises: [],
    };

    const result = completeWorkoutPipeline({
      activeSession: detachedSession,
      activeMeso: dummyMeso,
      program: dummyProgram,
      logs: [],
      endTime: 5000,
    });

    expect(result.isDetached).toBe(true);
    expect(result.log.name).toBe('WOD Hero');
    expect(result.updatedLogs).toHaveLength(1);
    expect(result.isWeekComplete).toBe(false);
    expect(result.isMesoComplete).toBe(false);
  });

  it('prefers targetWeeks over stale duration when checking mesocycle completion', () => {
    const extendedMeso: MesoCycle = {
      ...dummyMeso,
      week: 4,
      duration: 4,
      targetWeeks: 6,
    };

    const day0Log: Log = {
      id: 701,
      name: 'Day 1',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: 10,
      week: 4,
      dayIdx: 0,
      exercises: [],
    };
    const day1Log: Log = {
      id: 702,
      name: 'Day 2',
      startTime: 3000,
      endTime: 4000,
      duration: 1000,
      mesoId: 10,
      week: 4,
      dayIdx: 1,
      exercises: [],
    };

    const extendedResult = calculateWorkoutProgression(day1Log, extendedMeso, dummyProgram, [day0Log]);
    expect(extendedResult.isWeekComplete).toBe(true);
    expect(extendedResult.isMesoComplete).toBe(false);
    expect(extendedResult.updatedMeso?.week).toBe(5);

    const shortenedMeso: MesoCycle = {
      ...dummyMeso,
      week: 3,
      duration: 6,
      targetWeeks: 3,
    };
    const shortenedDay0: Log = { ...day0Log, id: 703, week: 3 };
    const shortenedDay1: Log = { ...day1Log, id: 704, week: 3 };

    const shortenedResult = calculateWorkoutProgression(shortenedDay1, shortenedMeso, dummyProgram, [shortenedDay0]);
    expect(shortenedResult.isWeekComplete).toBe(true);
    expect(shortenedResult.isMesoComplete).toBe(true);
  });

  it('advances week when a scheduled day was skipped and remaining days are completed', () => {
    const skippedDay0: Log = {
      id: 801,
      name: 'Day 1',
      startTime: 1000,
      endTime: 1000,
      duration: 0,
      mesoId: 10,
      week: 1,
      dayIdx: 0,
      exercises: [],
      skipped: true,
    };
    const completedDay1: Log = {
      id: 802,
      name: 'Day 2',
      startTime: 2000,
      endTime: 3000,
      duration: 1000,
      mesoId: 10,
      week: 1,
      dayIdx: 1,
      exercises: [],
    };

    const result = calculateWorkoutProgression(completedDay1, dummyMeso, dummyProgram, [skippedDay0]);
    expect(result.isWeekComplete).toBe(true);
    expect(result.isMesoComplete).toBe(false);
    expect(result.updatedMeso?.week).toBe(2);
  });

  it('signals mesocycle complete when skipping the final remaining day of the final week', () => {
    const finalWeekMeso: MesoCycle = {
      ...dummyMeso,
      week: 4,
      targetWeeks: 4,
    };
    const completedDay0: Log = {
      id: 901,
      name: 'Day 1',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: 10,
      week: 4,
      dayIdx: 0,
      exercises: [],
    };
    const skippedDay1: Log = {
      id: 902,
      name: 'Day 2',
      startTime: 3000,
      endTime: 3000,
      duration: 0,
      mesoId: 10,
      week: 4,
      dayIdx: 1,
      exercises: [],
      skipped: true,
    };

    const result = calculateWorkoutProgression(skippedDay1, finalWeekMeso, dummyProgram, [completedDay0]);
    expect(result.isWeekComplete).toBe(true);
    expect(result.isMesoComplete).toBe(true);
  });

  it('never marks week complete when program has zero scheduled slots', () => {
    const emptyProgram: ProgramDay[] = [
      { id: 'rest_1', dayName: { en: 'Rest', es: 'Descanso' }, slots: [] },
    ];
    const log: Log = {
      id: 950,
      name: 'Ad-hoc',
      startTime: 1000,
      endTime: 2000,
      duration: 1000,
      mesoId: 10,
      week: 1,
      dayIdx: 0,
      exercises: [],
    };

    const result = calculateWorkoutProgression(log, dummyMeso, emptyProgram, []);
    expect(result.isWeekComplete).toBe(false);
    expect(result.isMesoComplete).toBe(false);
    expect(result.updatedMeso?.week).toBe(1);
  });
});
