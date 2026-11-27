import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBackupEnvelope, restoreBackupToStorage } from '../../services/backupService';
import { resetLocalData } from '../../services/localDataReset';
import { dirtySyncState } from '../../services/dirtySyncState';
import { splitNutrition, joinNutrition } from '../../services/cloudSectionsV2';
import { computeRepMaxTable } from '../../utils/repMaxTable';
import { detectExercisePlateaus } from '../../utils/rpExerciseCues';
import { getVolumeComparison } from '../../utils/volumeComparison';
import { buildTrainingCsv } from '../../services/trainingCsv';
import { computeOverview } from '../../utils/statsOverview';
import { detectSplitConflicts, reorderDaysToResolveConflicts } from '../../utils/rpSplitBuilder';
import { recommendProgram } from '../../utils/recommendationEngine';
import { computeRpDietRecommendation } from '../../utils/rpDietEngine';
import { playTimerFinishSound } from '../../utils/audio';
import { db } from '../../utils/db';
import { parseCsv } from '../../utils/csv';
import type { ExerciseDef, Log, NutritionLog, ProgramDay, WorkoutSet } from '../../types';

const makeSet = (overrides: Partial<WorkoutSet>): WorkoutSet => ({
    id: 1,
    weight: '0',
    reps: '10',
    rpe: '8',
    completed: true,
    type: 'regular',
    ...overrides,
});

describe('MEVRA v4.7.0 Comprehensive Audit Regressions (Bloques A + B + C + D)', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    it('Bloque A: backup/restore preserves SFR history & RP config keys and reconciles sync metadata; reset wipes mevra_/repyntra_', async () => {
        const sfr = {
            bench: { avgJointPain: 0.5, avgPump: 2.5, count: 3, lastUpdatedAt: 1000 },
        };
        window.localStorage.setItem('mevra_exercise_sfr_v1', JSON.stringify(sfr));
        window.localStorage.setItem('repyntra_meso_draft', JSON.stringify({ name: 'Draft', program: [] }));

        const envelope = createBackupEnvelope({
            program: [],
            exercises: [],
            logs: [],
            config: {
                showRIR: true,
                rpEnabled: true,
                rpTargetRIR: 2,
                keepScreenOn: false,
                weightUnit: 'kg',
                restTimerDisplay: 'expanded',
                autoMatchWeight: false,
                useExerciseTypeFilters: true,
                preferredEquipment: ['cable', 'machine'],
            },
        });

        expect(envelope.state.exerciseSfrHistory).toEqual(sfr);

        window.localStorage.clear();
        await dirtySyncState.clear();
        await restoreBackupToStorage(envelope);

        expect(JSON.parse(window.localStorage.getItem('mevra_exercise_sfr_v1') || '{}')).toEqual(sfr);
        expect(JSON.parse(window.localStorage.getItem('il_cfg_auto_match') || 'true')).toBe(false);
        expect(JSON.parse(window.localStorage.getItem('il_cfg_equip_filter') || 'false')).toBe(true);
        expect(JSON.parse(window.localStorage.getItem('il_cfg_preferred_equip') || '[]')).toEqual(['cable', 'machine']);

        const dirty = await dirtySyncState.list();
        expect(dirty).toContain('config');
        const ts = await db.get<number>('il_last_sync_ts', 0);
        expect(ts).toBeGreaterThan(0);

        window.localStorage.setItem('repyntra_meso_draft', '{"name":"Draft"}');
        await resetLocalData({ preservePreferences: true });
        expect(window.localStorage.getItem('mevra_exercise_sfr_v1')).toBeNull();
        expect(window.localStorage.getItem('repyntra_meso_draft')).toBeNull();
    });

    it('Bloque A: cloudSectionsV2 splitNutrition/joinNutrition preserves steps and isTrainingDay', () => {
        const logs: NutritionLog[] = [
            {
                date: '2026-11-27',
                entries: [],
                waterMl: 2500,
                steps: 10500,
                isTrainingDay: false,
            },
        ];
        const [entries, days] = splitNutrition(logs);
        expect(days[0]).toMatchObject({ date: '2026-11-27', waterMl: 2500, steps: 10500, isTrainingDay: false });
        const joined = joinNutrition(entries, days);
        expect(joined[0]).toMatchObject({ date: '2026-11-27', waterMl: 2500, steps: 10500, isTrainingDay: false });
    });

    it('Bloque B: machine_assistance ranks lower counterweight as higher load and CSV exports negative assistance + isometric duration', () => {
        const assistedLogs: Log[] = [
            {
                id: 1,
                dayIdx: 0,
                name: 'Pull',
                startTime: 1000,
                endTime: 2000,
                duration: 600,
                mesoId: 1,
                week: 1,
                bodyWeightSnapshot: 80,
                exercises: [
                    {
                        id: 'assisted_pullup',
                        instanceId: 1,
                        name: 'Assisted Pullup',
                        muscle: 'BACK',
                        equipment: 'machine_assistance',
                        sets: [
                            makeSet({ id: 1, weight: '40', reps: '8' }), // 40 kg effective
                            makeSet({ id: 2, weight: '15', reps: '8' }), // 65 kg effective (stronger!)
                            makeSet({ id: 3, weight: '5', reps: '8', skipped: true }),
                        ],
                    },
                    {
                        id: 'plank',
                        instanceId: 2,
                        name: 'Plank',
                        muscle: 'ABS',
                        isBodyweight: true,
                        isIsometric: true,
                        sets: [makeSet({ id: 4, weight: '0', reps: '0', duration: 45 })],
                    },
                    {
                        id: 'neck_ext',
                        instanceId: 3,
                        name: 'Neck Extension',
                        muscle: 'NECK',
                        sets: [makeSet({ id: 5, weight: '10', reps: '15' })],
                    },
                ],
            },
        ];

        const rows = computeRepMaxTable(assistedLogs, new Set(['assisted_pullup']), {
            equipment: 'machine_assistance',
            bodyWeight: 80,
        });
        const row8 = rows.find((r) => r.reps === 8);
        expect(row8?.actualWeight).toBe(-15);

        const csv = buildTrainingCsv(assistedLogs, 'kg');
        const parsed = parseCsv(csv);
        const pullupRows = parsed.filter((r) => r[2] === 'Assisted Pullup');
        expect(pullupRows[0]?.[6]).toBe('-40');
        expect(pullupRows[1]?.[6]).toBe('-15');
        const plankRow = parsed.find((r) => r[2] === 'Plank');
        expect(plankRow?.[7]).toBe('45s');

        const overview = computeOverview(assistedLogs, null);
        const neck = overview.volumeData.find(([m]) => m === 'NECK');
        expect(neck?.[1]).toBe(1);
    });

    it('Bloque B: detectExercisePlateaus uses effective load for machine_assistance and folds mergedInto aliases', () => {
        const exercises: ExerciseDef[] = [
            { id: 'assist_new', name: 'Assisted Dip', muscle: 'TRICEPS', equipment: 'machine_assistance' },
            { id: 'assist_old', name: 'Assisted Dip Legacy', muscle: 'TRICEPS', equipment: 'machine_assistance', mergedInto: 'assist_new' },
        ];
        // Dropping counterweight 40 -> 30 -> 20 -> 10 across sessions is strong progression, NOT a plateau
        const logs: Log[] = [1, 2, 3, 4, 5].map((n, idx) => ({
            id: n,
            dayIdx: 0,
            name: 'Push',
            startTime: n * 10000,
            endTime: n * 10000 + 500,
            duration: 500,
            mesoId: n,
            week: 1,
            bodyWeightSnapshot: 80,
            exercises: [
                {
                    id: idx === 0 ? 'assist_old' : 'assist_new',
                    instanceId: n,
                    name: 'Assisted Dip',
                    muscle: 'TRICEPS',
                    equipment: 'machine_assistance',
                    sets: [makeSet({ weight: String(50 - n * 8), reps: '10' })],
                },
            ],
        }));

        expect(detectExercisePlateaus(logs, exercises, 'en')).toEqual([]);

        // Unilateral volume comparison counts both sides (x2)
        const comp = getVolumeComparison(
            [makeSet({ weight: '20', reps: '10' })],
            [makeSet({ weight: '20', reps: '8' })],
            { volumeCountingMode: 'per_side' },
        );
        expect(comp).toEqual({ kind: 'volume', current: 400, previous: 320, delta: 80 });
    });

    it('Bloque C: Upper/Lower split has zero false conflicts, reorder minimizes clashes, and recommendation respects 2-day & beginner cap', () => {
        const upperLower: ProgramDay[] = [
            { id: 'u1', dayName: { en: 'Upper A', es: 'Torso A' }, slots: [{ muscle: 'CHEST', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }] },
            { id: 'l1', dayName: { en: 'Lower A', es: 'Pierna A' }, slots: [{ muscle: 'QUADS', setTarget: 3 }, { muscle: 'HAMSTRINGS', setTarget: 3 }] },
            { id: 'u2', dayName: { en: 'Upper B', es: 'Torso B' }, slots: [{ muscle: 'CHEST', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }] },
            { id: 'l2', dayName: { en: 'Lower B', es: 'Pierna B' }, slots: [{ muscle: 'QUADS', setTarget: 3 }, { muscle: 'HAMSTRINGS', setTarget: 3 }] },
        ];
        expect(detectSplitConflicts(upperLower)).toEqual([]);

        const clashing: ProgramDay[] = [
            { id: '1', dayName: { en: 'D1', es: 'D1' }, slots: [{ muscle: 'CHEST', setTarget: 4 }] },
            { id: '2', dayName: { en: 'D2', es: 'D2' }, slots: [{ muscle: 'CHEST', setTarget: 4 }] },
            { id: '3', dayName: { en: 'D3', es: 'D3' }, slots: [{ muscle: 'QUADS', setTarget: 4 }] },
            { id: '4', dayName: { en: 'D4', es: 'D4' }, slots: [{ muscle: 'QUADS', setTarget: 4 }] },
        ];
        const beforeCount = detectSplitConflicts(clashing).length;
        const reordered = reorderDaysToResolveConflicts(clashing);
        expect(detectSplitConflicts(reordered).length).toBeLessThan(beforeCount);

        const rec2Day = recommendProgram({
            experience: 'intermediate',
            daysPerWeek: 2,
            goal: 'hypertrophy',
            sessionDuration: 'medium',
        });
        expect(rec2Day.template).toHaveLength(2);

        const recBeg6 = recommendProgram({
            experience: 'beginner',
            daysPerWeek: 6,
            goal: 'hypertrophy',
            sessionDuration: 'medium',
        });
        expect(recBeg6.mesoType).toBe('nh_ult_bridge');
    });

    it('Bloque D: computeRpDietRecommendation parses local phaseStartDate and playTimerFinishSound reuses a single AudioContext', () => {
        const now = new Date(2026, 10, 27, 12, 0, 0).getTime(); // 2026-11-27 local noon
        const rec = computeRpDietRecommendation({
            goal: {
                calories: 2200,
                protein: 160,
                carbs: 220,
                fat: 65,
                phase: 'cut',
                phaseStartDate: '2026-11-27',
            },
            bodyLogs: [],
            nowMs: now,
        });
        expect(rec.weeksInPhase).toBe(1);
        expect(rec.dietBreakRecommended).toBe(false);

        const ctorSpy = vi.fn().mockImplementation(function MockAudioCtx(this: any) {
            this.state = 'running';
            this.currentTime = 0;
            this.destination = {};
            this.resume = vi.fn().mockResolvedValue(undefined);
            this.createOscillator = () => ({
                connect: vi.fn(),
                type: 'sine',
                frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
                start: vi.fn(),
                stop: vi.fn(),
            });
            this.createGain = () => ({
                connect: vi.fn(),
                gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            });
        });
        vi.stubGlobal('AudioContext', ctorSpy);
        playTimerFinishSound();
        playTimerFinishSound();
        playTimerFinishSound();
        expect(ctorSpy).toHaveBeenCalledTimes(1);
        vi.unstubAllGlobals();
    });
});
