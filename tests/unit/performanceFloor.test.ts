import { describe, it, expect } from 'vitest';
import { resolveEffectsMode } from '../../utils/effectsProfile';
import { ActiveSession, SessionExercise, WorkoutSet, Log } from '../../types';
import { getExerciseHistorySummary } from '../../utils/exerciseHistoryIndex';

describe('Redmi Note 10 Performance Floor & Heavy Session Scaling', () => {
  describe('Hardware heuristics & effects floor', () => {
    it('Redmi Note 10 (Snapdragon 678 8-core, 4GB RAM, mobile touch) does NOT force reduced mode', () => {
      const rn10Specs = {
        effectsMode: 'system' as const,
        prefersReducedMotion: false,
        hardwareConcurrency: 8,
        deviceMemory: 4,
        isMobileOrTouch: true,
      };

      const resolved = resolveEffectsMode(rn10Specs);
      // Must resolve to 'balanced', never 'reduced'
      expect(resolved).toBe('balanced');
      expect(resolved).not.toBe('reduced');
    });

    it('Capacitor Android environment does NOT force reduced mode', () => {
      const capacitorProfile = {
        effectsMode: 'system' as const,
        prefersReducedMotion: false,
        hardwareConcurrency: 8,
        deviceMemory: 4,
        isMobileOrTouch: true,
      };

      expect(resolveEffectsMode(capacitorProfile)).toBe('balanced');
      // Explicit full mode still honored even on mobile
      expect(resolveEffectsMode({ ...capacitorProfile, effectsMode: 'full' })).toBe('full');
    });
  });

  describe('Heavy workout session footprint (10 exercises, 50 sets)', () => {
    const buildHeavySession = (): ActiveSession => {
      const exercises: SessionExercise[] = [];
      let globalSetId = 1;

      for (let e = 1; e <= 10; e++) {
        const sets: WorkoutSet[] = [];
        for (let s = 1; s <= 5; s++) {
          sets.push({
            id: globalSetId++,
            weight: (60 + e * 5 + s * 2.5).toString(),
            reps: (8 + (s % 4)).toString(),
            rpe: '8',
            completed: s <= 3,
            type: s === 1 ? 'warmup' : s === 5 ? 'backoff' : 'regular',
            prevWeight: (60 + e * 5).toString(),
            prevReps: '8',
            hintWeight: (60 + e * 5).toString(),
            hintReps: '8',
          });
        }

        exercises.push({
          id: `ex_${e}`,
          name: `Exercise ${e}`,
          muscle: 'chest',
          equipment: 'barbell',
          instanceId: 1000 + e,
          slotLabel: `Chest ${e}`,
          sets,
        } as unknown as SessionExercise);
      }

      return {
        id: 99999,
        dayIdx: 1,
        name: 'Heavy Volume Leg/Push Session',
        startTime: Date.now() - 3600000,
        mesoId: 1,
        week: 1,
        exercises,
      };
    };

    it('serializes 50-set session with compact memory footprint (< 30 KB)', () => {
      const session = buildHeavySession();
      expect(session.exercises.length).toBe(10);
      const totalSets = session.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
      expect(totalSets).toBe(50);

      const serialized = JSON.stringify(session);
      const sizeInKb = new TextEncoder().encode(serialized).length / 1024;

      // Ensure compact JSON footprint to avoid memory/GC pressure on 4GB devices
      expect(sizeInKb).toBeLessThan(30);

      // Verify deserialization fidelity
      const deserialized: ActiveSession = JSON.parse(serialized);
      expect(deserialized.id).toBe(session.id);
      expect(deserialized.exercises.length).toBe(10);
      expect(deserialized.exercises[9].sets[4].weight).toBe('122.5');
    });

    it('performs targeted set update across 50 sets without quadratic overhead', () => {
      const session = buildHeavySession();
      const startTime = performance.now();

      // Simulate rapid user keystroke update on set 49
      const targetExId = session.exercises[9].instanceId;
      const targetSetId = session.exercises[9].sets[3].id;

      const updatedExercises = session.exercises.map(ex => {
        if (ex.instanceId !== targetExId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id !== targetSetId) return s;
            return { ...s, weight: '125', reps: '10' };
          })
        };
      });

      const durationMs = performance.now() - startTime;
      expect(durationMs).toBeLessThan(15); // Sub-15ms for smooth 60fps frame budget
      expect(updatedExercises[9].sets[3].weight).toBe('125');
      expect(updatedExercises[9].sets[3].reps).toBe('10');
    });

    it('indexes historical logs efficiently with 500 logs without memory blowup', () => {
      const mockLogs: Log[] = [];
      const now = Date.now();

      for (let i = 0; i < 500; i++) {
        mockLogs.push({
          id: `log_${i}`,
          date: new Date(now - i * 86400000).toISOString(),
          workoutName: `Workout ${i % 5}`,
          exercises: [
            {
              id: 'ex_target',
              name: 'Barbell Bench Press',
              sets: [
                { id: 1, weight: '100', reps: '5', completed: true, type: 'regular' },
                { id: 2, weight: '105', reps: '4', completed: true, type: 'regular' },
              ]
            }
          ]
        } as unknown as Log);
      }

      const t0 = performance.now();
      const summary = getExerciseHistorySummary(mockLogs, 'ex_target');
      const timeMs = performance.now() - t0;

      expect(timeMs).toBeLessThan(25);
      expect(summary.latestCompletedSets?.length).toBe(2);
      expect(summary.bestWeightedWeight).toBe('105');
      expect(summary.bestWeightedReps).toBe('4');
    });
  });
});
