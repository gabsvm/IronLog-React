import { describe, it, expect } from 'vitest';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { resolveProgramDay, resolveProgramWeek, getProgramBlockForWeek } from '../../programs/engine/ProgramResolver';
import { toEditableProgram, convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';

describe('KONG resolver and progression invariants', () => {
    it('has valid structure with 3 blocks and 12 weeks total', () => {
        expect(KONG_4DAY_V1.durationWeeks).toBe(12);
        expect(KONG_4DAY_V1.daysPerWeek).toBe(4);
        expect(KONG_4DAY_V1.blocks.length).toBe(3);
        expect(KONG_4DAY_V1.blocks[0].globalWeekStart).toBe(1);
        expect(KONG_4DAY_V1.blocks[0].globalWeekEnd).toBe(4);
        expect(KONG_4DAY_V1.blocks[1].globalWeekStart).toBe(5);
        expect(KONG_4DAY_V1.blocks[1].globalWeekEnd).toBe(8);
        expect(KONG_4DAY_V1.blocks[2].globalWeekStart).toBe(9);
        expect(KONG_4DAY_V1.blocks[2].globalWeekEnd).toBe(12);
    });

    it('resolves every day for every week with valid prescriptions', () => {
        for (let week = 1; week <= 12; week++) {
            const weekDays = resolveProgramWeek(KONG_4DAY_V1, week);
            expect(weekDays.length).toBe(4);

            weekDays.forEach((day, dIdx) => {
                expect(day.slots.length).toBeGreaterThan(0);
                day.slots.forEach(slot => {
                    expect(slot.prescription).toBeDefined();
                    expect(slot.prescription!.length).toBeGreaterThan(0);
                    slot.prescription!.forEach(set => {
                        if (set.targetRpe !== undefined) {
                            expect(set.targetRpe).toBeGreaterThanOrEqual(1);
                            expect(set.targetRpe).toBeLessThanOrEqual(10);
                        }
                    });
                });
            });
        }
    });

    it('identifies correct block transitions across 12 weeks', () => {
        expect(getProgramBlockForWeek(KONG_4DAY_V1, 1).block.number).toBe(1);
        expect(getProgramBlockForWeek(KONG_4DAY_V1, 4).block.number).toBe(1);
        expect(getProgramBlockForWeek(KONG_4DAY_V1, 5).block.number).toBe(2);
        expect(getProgramBlockForWeek(KONG_4DAY_V1, 8).block.number).toBe(2);
        expect(getProgramBlockForWeek(KONG_4DAY_V1, 9).block.number).toBe(3);
        expect(getProgramBlockForWeek(KONG_4DAY_V1, 12).block.number).toBe(3);
    });

    it('applies exercise substitutions without mutating immutable program source', () => {
        const substitution = resolveProgramDay(
            KONG_4DAY_V1,
            1,
            0,
            { b1d1_jm_press: 'tri_ext' }
        ).slots[0];

        expect(substitution.exerciseId).toBe('tri_ext');
        expect(substitution.programSourceName).toBe('JM Press');

        // Original resolve without substitution remains JM Press
        const original = resolveProgramDay(KONG_4DAY_V1, 1, 0).slots[0];
        expect(original.exerciseId).toBe('jm_press');
    });

    it('converts resolved KONG week into editable program safely stripping internal system tags', () => {
        const resolvedW1 = resolveProgramWeek(KONG_4DAY_V1, 1);
        const editable = toEditableProgram(resolvedW1);

        expect(editable.length).toBe(4);
        editable.forEach(day => {
            day.slots.forEach(slot => {
                expect(slot.programSlotId).toBeUndefined();
                expect(slot.prescription).toBeUndefined();
                expect(slot.substitutionGroup).toBeUndefined();
                expect(slot.programSourceName).toBeUndefined();
                expect(slot.targetMuscle).toBeUndefined();
            });
        });
    });

    it('convertKongToPersonalRoutine canonically transforms active KONG meso into personal routine', () => {
        const mockActiveMeso: any = {
            id: 111111,
            name: 'KONG · 4 Días V1',
            mesoType: 'structured',
            week: 3,
            targetWeeks: 12,
            duration: 12,
            isDeload: false,
            plan: [],
            programSystem: {
                systemId: KONG_4DAY_V1.id,
                substitutions: {
                    b1d1_jm_press: 'tri_pushdown',
                },
            },
        };

        const timestamp = 222222;
        const resultEs = convertKongToPersonalRoutine(mockActiveMeso, 'es', timestamp);
        const resultEn = convertKongToPersonalRoutine(mockActiveMeso, 'en', timestamp);

        // 1. New identity and personal meso semantics
        expect(resultEs.convertedMeso.id).toBe(timestamp);
        expect(resultEs.convertedMeso.mesoType).toBe('personal');
        expect(resultEs.convertedMeso.week).toBe(1);
        expect(resultEs.convertedMeso.targetWeeks).toBe(4);
        expect(resultEs.convertedMeso.duration).toBe(4);
        expect(resultEs.convertedMeso.programSystem).toBeUndefined();
        expect(resultEs.convertedMeso.name).toBe('KONG · Rutina personal');
        expect(resultEn.convertedMeso.name).toBe('KONG · Personal routine');

        // 2. Program days and plan are rebuilt
        expect(resultEs.editableProgram.length).toBe(4);
        expect(resultEs.convertedMeso.plan.length).toBe(4);
        resultEs.convertedMeso.plan.forEach((dayPlan, dIdx) => {
            expect(dayPlan.length).toBe(resultEs.editableProgram[dIdx].slots.length);
        });

        // 3. Exercise substitutions are preserved in the converted program
        const day1Slot0 = resultEs.editableProgram[0].slots[0];
        expect(day1Slot0.exerciseId).toBe('tri_pushdown');

        // 4. KONG internal metadata is stripped
        resultEs.editableProgram.forEach(day => {
            day.slots.forEach(slot => {
                expect(slot.programSlotId).toBeUndefined();
                expect(slot.prescription).toBeUndefined();
                expect(slot.substitutionGroup).toBeUndefined();
                expect(slot.programSourceName).toBeUndefined();
            });
        });

        // 5. Calling again with identical input produces structurally identical data
        const secondCall = convertKongToPersonalRoutine(mockActiveMeso, 'es', timestamp);
        expect(secondCall).toEqual(resultEs);

        // 6. Source KONG_4DAY_V1 remains unmutated
        expect(KONG_4DAY_V1.blocks[0].days[0].exercises[0].exerciseId).toBe('jm_press');
    });
});
