import { describe, it, expect } from 'vitest';
import type { SessionExercise } from '../../types';

describe('Visual Redesign Critical Interactions', () => {
    describe('Reorder & Superset Grouping Integrity', () => {
        const createExercise = (instanceId: number, supersetId?: string): SessionExercise => ({
            id: `ex_${instanceId}`,
            instanceId,
            name: `Exercise ${instanceId}`,
            muscle: 'CHEST',
            sets: [
                { id: 1, type: 'regular', weight: 80, reps: 10, rpe: 8, completed: false },
                { id: 2, type: 'regular', weight: 80, reps: 10, rpe: 8, completed: false },
            ],
            supersetId,
        });

        it('moves superset exercises together as a contiguous block', () => {
            const list: SessionExercise[] = [
                createExercise(1),
                createExercise(2, 'ss_1'),
                createExercise(3, 'ss_1'),
                createExercise(4),
            ];

            // Reorder algorithm from ReorderExercisesSheet
            const moveSuperset = (current: SessionExercise[], activeId: number, overId: number) => {
                const oldIndex = current.findIndex(e => e.instanceId === activeId);
                const newIndex = current.findIndex(e => e.instanceId === overId);
                if (oldIndex < 0 || newIndex < 0) return current;

                const activeItem = current[oldIndex];
                if (activeItem.supersetId) {
                    const ssId = activeItem.supersetId;
                    const ssIndices = current
                        .map((ex, idx) => (ex.supersetId === ssId ? idx : -1))
                        .filter(idx => idx !== -1);

                    const isContiguous = ssIndices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);
                    if (isContiguous && ssIndices.length > 1) {
                        const ssItems = current.filter(ex => ex.supersetId === ssId);
                        const remaining = current.filter(ex => ex.supersetId !== ssId);
                        let insertIndex = remaining.findIndex(ex => ex.instanceId === overId);
                        if (insertIndex < 0) {
                            insertIndex = newIndex > oldIndex ? remaining.length : 0;
                        } else if (newIndex > oldIndex) {
                            insertIndex += 1;
                        }
                        const next = [...remaining];
                        next.splice(insertIndex, 0, ...ssItems);
                        return next;
                    }
                }
                const copy = [...current];
                const [moved] = copy.splice(oldIndex, 1);
                copy.splice(newIndex, 0, moved);
                return copy;
            };

            // Move instanceId 2 (part of ss_1) to bottom (after instanceId 4)
            const resultDown = moveSuperset(list, 2, 4);
            expect(resultDown.map(e => e.instanceId)).toEqual([1, 4, 2, 3]);
            // instanceId 2 and 3 remain strictly adjacent

            // Move instanceId 3 (part of ss_1) to top (before instanceId 1)
            const resultUp = moveSuperset(list, 3, 1);
            expect(resultUp.map(e => e.instanceId)).toEqual([2, 3, 1, 4]);
            // instanceId 2 and 3 remain strictly adjacent
        });

        it('assigns sequential superset letters A, B, C for distinct supersets', () => {
            const list: SessionExercise[] = [
                createExercise(1, 'ss_alpha'),
                createExercise(2, 'ss_alpha'),
                createExercise(3),
                createExercise(4, 'ss_beta'),
                createExercise(5, 'ss_beta'),
            ];

            const map = new Map<string, string>();
            let currentCode = 65;
            for (const ex of list) {
                if (ex.supersetId && !map.has(ex.supersetId)) {
                    map.set(ex.supersetId, String.fromCharCode(currentCode));
                    currentCode++;
                }
            }

            expect(map.get('ss_alpha')).toBe('A');
            expect(map.get('ss_beta')).toBe('B');
        });
    });

    describe('Finish Session Sheet & KONG Protection', () => {
        it('strictly forbids "Actualizar plantilla" mutation for official KONG programs', () => {
            const isKongProgram = (programId?: string, programName?: string) => {
                const id = String(programId || '').toLowerCase();
                const name = String(programName || '').toLowerCase();
                return id.includes('kong') || name.includes('kong') || id.includes('two_block') || name.includes('two block');
            };

            const canUpdateTemplate = (isKong: boolean, completedSets: number) => {
                return !isKong && completedSets > 0;
            };

            expect(canUpdateTemplate(isKongProgram('kong_savage_v1', 'KONG: Savage'), 10)).toBe(false);
            expect(canUpdateTemplate(isKongProgram('custom_123', 'My Custom Push'), 10)).toBe(true);
            expect(canUpdateTemplate(isKongProgram('custom_123', 'My Custom Push'), 0)).toBe(false);
        });

        it('correctly calculates completed series and duration for summary cards', () => {
            const exercises: SessionExercise[] = [
                {
                    id: 'ex1',
                    instanceId: 1,
                    name: 'Bench Press',
                    muscle: 'CHEST',
                    sets: [
                        { id: 1, type: 'regular', weight: 80, reps: 10, rpe: 8, completed: true },
                        { id: 2, type: 'regular', weight: 80, reps: 10, rpe: 8, completed: true },
                        { id: 3, type: 'avt_hop', weight: 80, reps: 10, rpe: 8, completed: true }, // should not inflate regular set count
                    ],
                },
                {
                    id: 'ex2',
                    instanceId: 2,
                    name: 'Incline Dumbbell Press',
                    muscle: 'CHEST',
                    sets: [
                        { id: 4, type: 'regular', weight: 30, reps: 12, rpe: 8, completed: true },
                        { id: 5, type: 'regular', weight: 30, reps: 12, rpe: 8, completed: false },
                    ],
                },
            ];

            const completedSets = exercises.reduce((acc, ex) =>
                acc + (ex.sets || []).filter(s => s.completed && !s.skipped && s.type !== 'avt_hop').length, 0);

            expect(completedSets).toBe(3);
        });
    });

    describe('Rest Timer Calculations', () => {
        it('computes circular SVG progress circumference and stroke dashoffset correctly', () => {
            const radius = 52;
            const circumference = 2 * Math.PI * radius; // ~326.725
            expect(circumference).toBeCloseTo(326.73, 1);

            const calculateOffset = (remaining: number, total: number) => {
                const progress = total > 0 ? Math.max(0, Math.min(1, (total - remaining) / total)) : 0;
                return circumference * (1 - progress);
            };

            // At start (0 elapsed): offset equals full circumference
            expect(calculateOffset(90, 90)).toBeCloseTo(circumference);
            // Halfway (45s elapsed of 90s): offset equals half circumference
            expect(calculateOffset(45, 90)).toBeCloseTo(circumference / 2);
            // Complete (90s elapsed of 90s): offset equals 0
            expect(calculateOffset(0, 90)).toBe(0);
        });

        it('quick adjustment clamps time correctly above 0', () => {
            const adjust = (current: number, delta: number) => Math.max(0, current + delta);

            expect(adjust(30, 30)).toBe(60);
            expect(adjust(30, -10)).toBe(20);
            expect(adjust(5, -10)).toBe(0);
        });
    });

    describe('Workout Active Card & Progress Header', () => {
        it('calculates total remaining sets accurately across exercises', () => {
            const exercises: SessionExercise[] = [
                {
                    id: 'ex1',
                    instanceId: 1,
                    name: 'Squat',
                    muscle: 'QUADS',
                    sets: [
                        { id: 1, type: 'regular', weight: 100, reps: 5, rpe: 8, completed: true },
                        { id: 2, type: 'regular', weight: 100, reps: 5, rpe: 8, completed: true },
                        { id: 3, type: 'regular', weight: 100, reps: 5, rpe: 8, completed: false },
                    ],
                },
                {
                    id: 'ex2',
                    instanceId: 2,
                    name: 'Leg Extension',
                    muscle: 'QUADS',
                    sets: [
                        { id: 4, type: 'regular', weight: 50, reps: 15, rpe: 8, completed: false },
                        { id: 5, type: 'regular', weight: 50, reps: 15, rpe: 8, completed: false },
                    ],
                },
            ];

            const totalSets = exercises.reduce((acc, ex) =>
                acc + (ex.sets || []).filter(s => s.type !== 'avt_hop').length, 0);
            const completedSets = exercises.reduce((acc, ex) =>
                acc + (ex.sets || []).filter(s => s.completed && !s.skipped && s.type !== 'avt_hop').length, 0);
            const remainingSets = Math.max(0, totalSets - completedSets);

            expect(totalSets).toBe(5);
            expect(completedSets).toBe(2);
            expect(remainingSets).toBe(3);
        });
    });
});
