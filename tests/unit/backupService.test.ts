import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createBackupEnvelope,
    validateAndMigrateBackup,
    summarizeBackup,
    BACKUP_SCHEMA,
    CURRENT_BACKUP_VERSION,
} from '../../services/backupService';

describe('backupService', () => {
    const sampleState = {
        program: [{ id: 'p1', dayName: { en: 'Push', es: 'Empuje' }, slots: [] }],
        exercises: [{ id: 'bench', name: 'Bench Press', muscle: 'CHEST' as const }],
        logs: [{ id: 101, dayIdx: 0, name: 'Push A', startTime: 1000, endTime: 2000, duration: 60, mesoId: 1, week: 1, exercises: [] }],
        userProfile: { experience: 'intermediate' as const, daysPerWeek: 4, goal: 'hypertrophy' as const, sessionDuration: 'medium' as const },
        nutritionLogs: [{ date: '2026-09-30', entries: [], waterMl: 1500 }],
        cardioSessions: [{ id: 'c1', date: '2026-09-30', activityType: 'running' as const, durationMin: 30, timestamp: 1000 }],
        bodyLogs: [{ id: 1, date: 1700000000, weight: 75.5 }],
        personalTemplates: [],
        customFoods: [{ id: 'f1', name: 'Protein Bar', calories: 200, protein: 20, carbs: 15, fat: 5, createdAt: 1000 }],
    };

    it('creates a standard versioned backup envelope', () => {
        const backup = createBackupEnvelope(sampleState);
        expect(backup.schema).toBe(BACKUP_SCHEMA);
        expect(backup.version).toBe(CURRENT_BACKUP_VERSION);
        expect(backup.exportedAt).toBeGreaterThan(0);
        expect(backup.state.program).toHaveLength(1);
        expect(backup.state.customFoods).toHaveLength(1);
        expect(backup.state.cardioSessions).toHaveLength(1);
    });

    it('summarizes backup domains accurately', () => {
        const summary = summarizeBackup(sampleState);
        expect(summary.programsCount).toBe(1);
        expect(summary.exercisesCount).toBe(1);
        expect(summary.logsCount).toBe(1);
        expect(summary.hasProfile).toBe(true);
        expect(summary.nutritionDaysCount).toBe(1);
        expect(summary.cardioSessionsCount).toBe(1);
        expect(summary.customFoodsCount).toBe(1);
    });

    it('validates a standard versioned backup correctly', () => {
        const envelope = createBackupEnvelope(sampleState);
        const result = validateAndMigrateBackup(envelope);

        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.backup.schema).toBe(BACKUP_SCHEMA);
            expect(result.summary.programsCount).toBe(1);
            expect(result.summary.logsCount).toBe(1);
        }
    });

    it('migrates legacy 4.0.3 un-enveloped backup into standard v1 envelope', () => {
        const legacyExport = {
            program: [{ id: 'leg_p1', dayName: { en: 'Legs', es: 'Piernas' }, slots: [] }],
            exercises: [{ id: 'squat', name: 'Squat', muscle: 'QUADS' }],
            logs: [{ id: 50, dayIdx: 0, name: 'Leg Day', startTime: 1000, endTime: 2000, duration: 60, mesoId: 1, week: 1, exercises: [] }],
            nutritionLogs: [{ date: '2026-09-29', entries: [], waterMl: 2000 }],
            version: '4.0.3',
        };

        const result = validateAndMigrateBackup(legacyExport);
        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.backup.schema).toBe(BACKUP_SCHEMA);
            expect(result.backup.version).toBe(1);
            expect(result.backup.state.program).toHaveLength(1);
            expect(result.backup.state.exercises).toHaveLength(1);
            expect(result.backup.state.nutritionLogs).toHaveLength(1);
            expect(result.summary.programsCount).toBe(1);
        }
    });

    it('rejects invalid JSON or corrupted payload safely with error key', () => {
        expect(validateAndMigrateBackup(null).valid).toBe(false);
        expect(validateAndMigrateBackup('string').valid).toBe(false);
        expect(validateAndMigrateBackup({}).valid).toBe(false);
        expect(validateAndMigrateBackup({ schema: BACKUP_SCHEMA, version: 999, state: {} }).valid).toBe(false);
    });
});
