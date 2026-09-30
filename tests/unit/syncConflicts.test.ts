import { describe, it, expect } from 'vitest';
import {
    buildSectionSyncMeta,
    detectConflictSections,
    mergeSectionSyncMeta,
    serializeMeso,
    deserializeMeso,
    isMeaningfullyEmptyLocalState,
} from '../../services/syncHelpers';
import { SectionSyncMeta } from '../../types';

describe('syncHelpers & conflict resolution', () => {
    it('builds section sync metadata with timestamp for each section', () => {
        const meta = buildSectionSyncMeta(['program', 'logs'], 1700000000);
        expect(meta).toEqual({
            program: 1700000000,
            logs: 1700000000,
        });
    });

    it('returns empty object when no sections provided', () => {
        expect(buildSectionSyncMeta([], 1700000000)).toEqual({});
        expect(buildSectionSyncMeta(undefined, 1700000000)).toEqual({});
    });

    it('detects conflicting sections where cloud timestamp is newer than local', () => {
        const localMeta: SectionSyncMeta = {
            program: 1000,
            logs: 2000,
            exercises: 1500,
        };

        const cloudMeta: SectionSyncMeta = {
            program: 1200, // newer in cloud -> conflict/pending
            logs: 1800,    // older in cloud -> not conflict
            exercises: 1500, // equal -> not conflict
            userProfile: 3000, // brand new section in cloud -> conflict/pending
        };

        const conflicts = detectConflictSections(localMeta, cloudMeta);
        expect(conflicts).toContain('program');
        expect(conflicts).toContain('userProfile');
        expect(conflicts).not.toContain('logs');
        expect(conflicts).not.toContain('exercises');
    });

    it('merges section sync metadata taking the maximum timestamp for each section', () => {
        const localMeta: SectionSyncMeta = {
            program: 1000,
            logs: 2500,
        };
        const cloudMeta: SectionSyncMeta = {
            program: 1200,
            logs: 2000,
            exercises: 3000,
        };

        const merged = mergeSectionSyncMeta(localMeta, cloudMeta);
        expect(merged).toEqual({
            program: 1200,
            logs: 2500,
            exercises: 3000,
        });
    });

    it('correctly serializes and deserializes meso plan between 2D array and Firestore map format', () => {
        const originalMeso = {
            id: 'meso_1',
            name: 'Test Meso',
            plan: [
                ['ex_1', 'ex_2'],
                ['ex_3'],
            ],
        };

        const serialized = serializeMeso(originalMeso);
        expect(serialized.plan).toEqual({
            '0': ['ex_1', 'ex_2'],
            '1': ['ex_3'],
        });

        const deserialized = deserializeMeso(serialized);
        expect(deserialized.plan).toEqual(originalMeso.plan);
    });

    describe('isMeaningfullyEmptyLocalState', () => {
        it('returns true for completely empty or unpopulated local state', () => {
            expect(isMeaningfullyEmptyLocalState(null)).toBe(true);
            expect(isMeaningfullyEmptyLocalState({})).toBe(true);
            expect(isMeaningfullyEmptyLocalState({
                activeSession: null,
                activeMeso: null,
                logs: [],
                nutritionLogs: [],
                cardioSessions: [],
                bodyLogs: [],
                customFoods: [],
                personalTemplates: [],
                exercises: [{ id: 'bp_bar', name: { es: 'Press banca', en: 'Bench press' } }], // default catalog only
                userProfile: null,
            })).toBe(true);
        });

        it('returns false if user has active session with exercises', () => {
            expect(isMeaningfullyEmptyLocalState({
                activeSession: {
                    id: 123,
                    exercises: [{ id: 'bp_bar', sets: [] }],
                },
            })).toBe(false);
        });

        it('returns false if user has an active mesocycle', () => {
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: { id: 1, name: 'Hypertrophy Block 1', plan: [['bp_bar']] },
            })).toBe(false);
        });

        it('returns false if user has historical workout logs', () => {
            expect(isMeaningfullyEmptyLocalState({
                logs: [{ id: 1, date: '2026-09-30', workoutName: 'Leg Day' } as any],
            })).toBe(false);
        });

        it('prevents unsafe empty classification when only non-workout user data exists (nutrition, body, cardio, custom food, templates)', () => {
            // User only tracks nutrition
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                nutritionLogs: [{ date: '2026-09-30', totalCalories: 2400 } as any],
            })).toBe(false);

            // User only logged body weight
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                bodyLogs: [{ id: 'b1', date: '2026-09-30', weight: 80 } as any],
            })).toBe(false);

            // User only logged cardio
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                cardioSessions: [{ id: 'c1', type: 'running', durationMinutes: 30 } as any],
            })).toBe(false);

            // User has custom foods
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                customFoods: [{ id: 'cf1', name: 'Proteina Casera' } as any],
            })).toBe(false);

            // User created personal templates
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                personalTemplates: [{ id: 'pt1', name: 'Mi rutina de brazos' } as any],
            })).toBe(false);

            // User created a custom exercise
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                exercises: [
                    { id: 'bp_bar', name: { es: 'Press banca', en: 'Bench press' } },
                    { id: 'custom_curls', name: { es: 'Curl 21s', en: '21s Curl' }, isCustom: true },
                ],
            })).toBe(false);

            // User configured their profile
            expect(isMeaningfullyEmptyLocalState({
                activeMeso: null,
                logs: [],
                userProfile: { experience: 'intermediate', goal: 'hypertrophy' } as any,
            })).toBe(false);
        });
    });
});

