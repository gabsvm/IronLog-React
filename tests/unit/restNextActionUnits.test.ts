import { describe, it, expect } from 'vitest';
import type { SessionExercise, WorkoutSet } from '../../types';
import { resolveRestNextAction } from '../../components/ui/RestTimerOverlay';

const ex = (instanceId: number, sets: Partial<WorkoutSet>[]): SessionExercise => ({
    id: `ex${instanceId}`,
    instanceId,
    name: `Exercise ${instanceId}`,
    muscle: 'CHEST',
    sets: sets.map((s, i) => ({
        id: i + 1,
        weight: '',
        reps: '',
        rpe: '',
        completed: false,
        type: 'regular',
        ...s,
    })) as WorkoutSet[],
});

describe('Q11: rest next-action targets honor the display unit', () => {
    it('shows lb targets in lb mode (100 kg → 220.5 lbs)', () => {
        const exercises = [
            ex(1, [
                { id: 1, weight: 100, reps: 5, completed: true },
                { id: 2, weight: 100, reps: 5, completed: false },
            ]),
        ];
        const action = resolveRestNextAction(exercises, { exerciseInstanceId: 1, setId: 1 }, 'es', 'lb');
        expect(action?.target).toBe('220,5 lbs × 5');
        const actionEn = resolveRestNextAction(exercises, { exerciseInstanceId: 1, setId: 1 }, 'en', 'lb');
        expect(actionEn?.target).toBe('220.5 lbs × 5');
    });

    it('defaults to kg when the unit is omitted (golden)', () => {
        const exercises = [
            ex(1, [
                { id: 1, weight: 100, reps: 5, completed: true },
                { id: 2, weight: 100, reps: 5, completed: false },
            ]),
        ];
        const action = resolveRestNextAction(exercises, { exerciseInstanceId: 1, setId: 1 }, 'es');
        expect(action?.target).toBe('100 kg × 5');
    });
});
