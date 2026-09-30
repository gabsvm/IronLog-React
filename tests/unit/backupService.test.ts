import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createBackupEnvelope,
    validateAndMigrateBackup,
    summarizeBackup,
    restoreBackupToStorage,
    BACKUP_SCHEMA,
    CURRENT_BACKUP_VERSION,
} from '../../services/backupService';
import { db } from '../../utils/db';
import { useStore } from '../../lib/store';

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

    it('executes a complete 15-domain round trip: state A -> export -> clear -> restore -> read storage -> match A', async () => {
        const memoryStorage = new Map<string, any>();
        vi.spyOn(db, 'set').mockImplementation(async (key, val) => {
            memoryStorage.set(key, val);
        });
        vi.spyOn(db, 'get').mockImplementation(async (key, defaultVal) => {
            return memoryStorage.has(key) ? memoryStorage.get(key) : defaultVal;
        });

        const stateA = {
            program: [{ id: 'p1', dayName: { en: 'Push', es: 'Empuje' }, slots: [] }],
            exercises: [{ id: 'bench', name: 'Bench Press', muscle: 'CHEST' as const }],
            logs: [{ id: 101, dayIdx: 0, name: 'Push A', startTime: 1000, endTime: 2000, duration: 60, mesoId: 1, week: 1, exercises: [] }],
            activeMeso: { id: 77, name: 'Meso Hypertrophy', week: 2, duration: 6, mesoType: 'hyp_1', plan: [] },
            activeSession: { id: 88, name: 'Chest Day', startTime: 12345, mesoId: 77, week: 2, exercises: [], dayIdx: 0 },
            userProfile: { experience: 'intermediate' as const, daysPerWeek: 4, goal: 'hypertrophy' as const, sessionDuration: 'medium' as const },
            nutritionLogs: [{ date: '2026-09-30', entries: [], waterMl: 1500 }],
            cardioSessions: [{ id: 'c1', date: '2026-09-30', activityType: 'running' as const, durationMin: 30, timestamp: 1000 }],
            bodyLogs: [{ id: 1, date: 1700000000, weight: 75.5 }],
            macroGoals: { calories: 2500, protein: 180, carbs: 250, fats: 70 },
            nutritionGoal: { calories: 2500, protein: 180, carbs: 250, fat: 70 },
            personalTemplates: [{ id: 'pt1', name: 'My Split', title: { en: 'My Split', es: 'Mi Rutina' }, description: { en: '', es: '' }, isPro: false, order: 0, program: [] }],
            customFoods: [{ id: 'f1', name: 'Protein Bar', calories: 200, protein: 20, carbs: 15, fat: 5, createdAt: 1000 }],
            rpFeedback: { 'bench': { pump: 2, soreness: 1, workload: 0 } },
            config: {
                showRIR: true,
                rpEnabled: true,
                rpTargetRIR: 3,
                keepScreenOn: true,
            },
        };

        // 1. Export state A into backup envelope
        const envelope = createBackupEnvelope(stateA);
        expect(envelope.schema).toBe(BACKUP_SCHEMA);

        // 2. Validate envelope before restore
        const validation = validateAndMigrateBackup(envelope);
        expect(validation.valid).toBe(true);
        if (!validation.valid) return;

        // 3. Clear/reset storage completely
        localStorage.clear();
        memoryStorage.clear();
        useStore.setState({ activeSession: null, activeMeso: null });

        // 4. Restore backup to storage
        await restoreBackupToStorage(validation.backup);

        // 5. Read every domain back from storage and compare with state A
        expect(await db.get('il_prog_v16', null)).toEqual(stateA.program);
        expect(await db.get('il_ex_v16', null)).toEqual(stateA.exercises);
        expect(await db.get('il_logs_v16', null)).toEqual(stateA.logs);
        expect(await db.get('il_meso_v16', null)).toEqual(stateA.activeMeso);
        expect(await db.get('il_session_v16', null)).toEqual(stateA.activeSession);
        expect(await db.get('il_profile_v1', null)).toEqual(stateA.userProfile);
        expect(await db.get('il_nutrition_v1', null)).toEqual(stateA.nutritionLogs);
        expect(await db.get('il_cardio_v1', null)).toEqual(stateA.cardioSessions);
        expect(await db.get('il_body_v1', null)).toEqual(stateA.bodyLogs);
        expect(await db.get('il_macros_v1', null)).toEqual(stateA.macroGoals);
        expect(await db.get('il_nut_goal_v1', null)).toEqual(stateA.nutritionGoal);
        expect(await db.get('il_personal_templates_v1', null)).toEqual(stateA.personalTemplates);
        expect(await db.get('il_custom_foods_v1', null)).toEqual(stateA.customFoods);
        expect(await db.get('il_rp_fb_v1', null)).toEqual(stateA.rpFeedback);

        // Config domains from production localStorage keys
        expect(JSON.parse(localStorage.getItem('il_cfg_rir')!)).toBe(stateA.config.showRIR);
        expect(JSON.parse(localStorage.getItem('il_cfg_rp')!)).toBe(stateA.config.rpEnabled);
        expect(JSON.parse(localStorage.getItem('il_cfg_rp_rir')!)).toBe(stateA.config.rpTargetRIR);
        expect(JSON.parse(localStorage.getItem('il_cfg_screen')!)).toBe(stateA.config.keepScreenOn);

        // In-memory active session & meso state
        expect(useStore.getState().activeSession).toEqual(stateA.activeSession);
        expect(useStore.getState().activeMeso).toEqual(stateA.activeMeso);
    });
});
