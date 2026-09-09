import assert from 'node:assert/strict';
import type { WorkoutSet } from '../types.ts';
import { getNextWorkoutFieldFocus } from '../lib/workout/workoutAutofocusPolicy.ts';

const set = (patch: Partial<WorkoutSet> = {}): WorkoutSet => ({
    id: 1, weight: '', reps: '', rpe: '', completed: false, type: 'regular', ...patch,
});

assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 0, sets: [set(), set()], isBodyweight: false, isIsometric: false }), 'weight');
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 0, sets: [set(), set({ weight: '80' })], isBodyweight: false, isIsometric: false }), 'reps');
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 0, sets: [set(), set({ weight: '80', reps: '8' }), set()], isBodyweight: false, isIsometric: false }), null);
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 0, sets: [set(), set()], isBodyweight: true, isIsometric: false }), 'reps');
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 1, sets: [set(), set()], isBodyweight: false, isIsometric: false }), null);
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: true, isCompleted: false, currentSetIndex: 0, sets: [set(), set()], isBodyweight: false, isIsometric: false }), null);
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 0, sets: [set(), set({ weight: '80', reps: '8' }), set()], isBodyweight: false, isIsometric: false }), null);
assert.equal(getNextWorkoutFieldFocus({ wasCompleted: false, isCompleted: true, currentSetIndex: 0, sets: [set(), set()], isBodyweight: false, isIsometric: true }), null);

console.log('workout autofocus policy: PASS');
