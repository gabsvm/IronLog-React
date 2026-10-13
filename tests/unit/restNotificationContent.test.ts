import { describe, expect, it } from 'vitest';
import type { SessionExercise, WorkoutSet } from '../../types';
import { resolveRestNotificationContent } from '../../components/ui/restTimer/restTimerLogic';

const exercise = (
    instanceId: number,
    name: SessionExercise['name'],
    completed: boolean[],
    supersetId?: string,
): SessionExercise => ({
    id: `ex-${instanceId}`, instanceId, name, muscle: 'CHEST',
    ...(supersetId ? { supersetId } : {}),
    sets: completed.map((done, index): WorkoutSet => ({
        id: index + 11, type: 'regular', completed: done,
        weight: 80, reps: 8, rpe: '',
    })),
});

describe('native rest notification derives only real workout context', () => {
    it('uses the next incomplete set ordinal, not the completed set ID', () => {
        const ex = exercise(10, { es: 'Press banca', en: 'Bench press' }, [true, true, false, false]);
        expect(resolveRestNotificationContent([ex], { exerciseInstanceId: 10, setId: 12 }, 'es'))
            .toEqual({ liveTitle: 'Descansando · Press banca', liveBody: 'Próxima serie: 3 de 4' });
        expect(resolveRestNotificationContent([ex], { exerciseInstanceId: 10, setId: 12 }, 'en'))
            .toEqual({ liveTitle: 'Resting · Bench press', liveBody: 'Next set: 3 of 4' });
    });
    it('finds the next exercise and its set count, rather than reusing the previous one', () => {
        const done = exercise(1, 'Squat', [true, true]);
        const next = exercise(2, 'Lunge', [false, false, false]);
        expect(resolveRestNotificationContent([done, next], { exerciseInstanceId: 1, setId: 12 }, 'es'))
            .toEqual({ liveTitle: 'Descansando · Lunge', liveBody: 'Próximo ejercicio: 1 de 3' });
    });
    it('marks the next superset step and handles identical names by instance ID', () => {
        const first = exercise(1, 'Curl', [true, true], 'ss1');
        const second = exercise(2, 'Curl', [true, false, false], 'ss1');
        expect(resolveRestNotificationContent([first, second], { exerciseInstanceId: 1, setId: 12 }, 'es'))
            .toEqual({ liveTitle: 'Descansando · Curl', liveBody: 'Superserie: 2 de 3' });
    });
    it('falls back to the earliest real incomplete set for a manually started rest', () => {
        const ex = exercise(2, 'Pull-up', [true, false, false]);
        expect(resolveRestNotificationContent([ex], undefined, 'en'))
            .toEqual({ liveTitle: 'Resting · Pull-up', liveBody: 'Next exercise: 2 of 3' });
    });
    it('does not invent another set after the final one or without a workout', () => {
        expect(resolveRestNotificationContent(undefined, undefined, 'es')).toBeNull();
        expect(resolveRestNotificationContent([exercise(1, 'Row', [true, true])], { exerciseInstanceId: 1, setId: 12 }, 'en'))
            .toBeNull();
    });
    it('truncates extremely long custom exercise names for Android notifications', () => {
        const ex = exercise(1, 'X'.repeat(300), [false]);
        const value = resolveRestNotificationContent([ex], undefined, 'es');
        expect(value?.liveTitle.length).toBeLessThanOrEqual(110);
        expect(value?.liveBody).toBe('Próximo ejercicio: 1 de 1');
    });
});
