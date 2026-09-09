import assert from 'node:assert/strict';
import type { ActiveSession } from '../types.ts';
import { denormalizeActiveSession, normalizeActiveSession, updateNormalizedWorkoutSet } from '../lib/workout/workoutPersistenceAdapter.ts';

const source: ActiveSession = {
    id: 42,
    dayIdx: 1,
    name: 'KONG Push',
    startTime: 123,
    mesoId: 9,
    week: 3,
    note: 'keep order',
    exercises: [
        {
            id: 'bench',
            name: { en: 'Bench', es: 'Press' },
            muscle: 'CHEST',
            instanceId: 10,
            programSlotId: 'slot-a',
            supersetId: 'ss-1',
            targetReps: '8-10',
            sets: [
                { id: 101, weight: '80', reps: '8', rpe: '8', completed: true, type: 'regular', prescribedReps: 8, targetRpe: 8 },
                { id: 102, weight: '', reps: '', rpe: '', completed: false, type: 'backoff', skipped: false },
            ],
        },
        {
            id: 'plank',
            name: 'Plank',
            muscle: 'ABS',
            instanceId: 11,
            isBodyweight: true,
            isIsometric: true,
            cardioType: 'steady',
            sets: [{ id: 201, weight: '', reps: '', rpe: '', completed: false, type: 'time_volume', duration: 30, workSeconds: 30, restSeconds: 10 }],
        },
    ],
};

const normalized = normalizeActiveSession(source);
assert.deepEqual(denormalizeActiveSession(normalized), source);
assert.deepEqual(normalized.exerciseOrder, [10, 11]);
assert.deepEqual(normalized.setOrderByExercise[10], [101, 102]);
assert.equal(Object.prototype.hasOwnProperty.call(normalized.exercisesById[10], 'sets'), false);
assert.equal(normalized.setsById[101].prescribedReps, 8);
assert.equal(normalizeActiveSession(null), null);
assert.equal(denormalizeActiveSession(null), null);

const unrelatedSet = normalized.setsById[201];
const unrelatedExercise = normalized.exercisesById[11];
const updated = updateNormalizedWorkoutSet(normalized, 10, 101, 'weight', '82.5');
assert.equal(updated.setsById[201], unrelatedSet);
assert.equal(updated.exercisesById[11], unrelatedExercise);
assert.equal(updated.setsById[101].weight, '82.5');

console.log('workout persistence adapter: PASS');
