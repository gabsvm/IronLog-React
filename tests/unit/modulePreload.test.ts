import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('L3: Preload workout modules and modals in idle', () => {
    it('schedules idle preloading of WorkoutSortableList and SortableExerciseCardImpl in HomeViewImpl', () => {
        const homeCode = fs.readFileSync(path.resolve(__dirname, '../../views/HomeViewImpl.tsx'), 'utf-8');
        expect(homeCode).toContain("scheduleWhenIdle");
        expect(homeCode).toContain("WorkoutSortableList");
        expect(homeCode).toContain("SortableExerciseCardImpl");
    });

    it('schedules idle preloading of ExerciseSelector, WarmupModal, ExerciseDetailModal in WorkoutViewImpl', () => {
        const workoutCode = fs.readFileSync(path.resolve(__dirname, '../../views/WorkoutViewImpl.tsx'), 'utf-8');
        expect(workoutCode).toContain("scheduleWhenIdle");
        expect(workoutCode).toContain("ExerciseSelector");
        expect(workoutCode).toContain("WarmupModal");
        expect(workoutCode).toContain("ExerciseDetailModal");
    });
});
