import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATES, JACKED_IN_3_TEMPLATE, TOKITA_TEMPLATE } from '../../data/defaultTemplates';
import { NATURAL_HYPERTROPHY_TEMPLATES } from '../../data/naturalHypertrophy';
import { DEFAULT_LIBRARY } from '../../data/defaultLibrary';
import { CALISTHENICS_EXERCISES, CROSSFIT_EXERCISES } from '../../data/disciplineExercises';

describe('Natural Hypertrophy Compendium 2.2 & Catalog Integrity', () => {
    const validIds = new Set([
        ...DEFAULT_LIBRARY.map((e) => e.id),
        ...CALISTHENICS_EXERCISES.map((e) => e.id),
        ...CROSSFIT_EXERCISES.map((e) => e.id),
    ]);

    it('removes legacy/duplicate templates and keeps Aesthetic V-Taper (full_body)', () => {
        const ids = new Set(INITIAL_TEMPLATES.map((t) => t.id));

        // Explicitly removed legacy & duplicate templates
        expect(ids.has('toji_fushiguro')).toBe(false);
        expect(ids.has('wizard')).toBe(false);
        expect(ids.has('male_physique')).toBe(false);
        expect(ids.has('hyp_1')).toBe(false);
        expect(ids.has('hyp_2')).toBe(false);
        expect(ids.has('metabolite')).toBe(false);
        expect(ids.has('resensitization')).toBe(false);

        // Explicitly kept
        expect(ids.has('full_body')).toBe(true);
        expect(ids.has('nh_toji')).toBe(true);
        expect(ids.has('tokita')).toBe(true);
        expect(ids.has('ji3')).toBe(true);
    });

    it('verifies every slot across all INITIAL_TEMPLATES has a valid exerciseId', () => {
        for (const tpl of INITIAL_TEMPLATES) {
            expect(tpl.program.length).toBeGreaterThan(0);
            for (const day of tpl.program) {
                expect(day.slots.length).toBeGreaterThan(0);
                for (const slot of day.slots) {
                    expect(
                        slot.exerciseId,
                        `Template ${tpl.id} day ${day.id} is missing exerciseId`
                    ).toBeTruthy();
                    expect(
                        validIds.has(slot.exerciseId!),
                        `Template ${tpl.id} day ${day.id} has unknown exerciseId '${slot.exerciseId}'`
                    ).toBe(true);
                }
            }
        }
    });

    it('verifies NH Compendium 2.2 day counts and structure for all 15 NH routines + Tokita + Jacked in 3', () => {
        const expectedDayCounts: Record<string, number> = {
            nh_ult_beginner: 3,
            nh_ult_novice: 3,
            nh_ult_bridge: 4,
            nh_ult_intermediate: 5,
            nh_ult_advanced: 6,
            nh_baki: 3,
            nh_toji: 4,
            nh_doom_slayer: 6,
            nh_superman: 3,
            nh_gentleman_split: 5,
            nh_silver_era: 3,
            nh_apollonian: 4,
            nh_alex_eubank: 4,
            nh_bald_omni_hybrid: 4,
            nh_guts: 4,
            nh_kratos: 5,
            nh_kinobody: 3,
        };

        for (const [id, expectedDays] of Object.entries(expectedDayCounts)) {
            const tpl = NATURAL_HYPERTROPHY_TEMPLATES.find((t) => t.id === id);
            expect(tpl, `Missing NH template ${id}`).toBeDefined();
            expect(tpl!.program.length, `Day count mismatch for ${id}`).toBe(expectedDays);
        }

        expect(TOKITA_TEMPLATE.length).toBe(4);
        expect(JACKED_IN_3_TEMPLATE.length).toBe(4);
    });

    it('verifies multi-stage configurations (Toji, Kratos, Baki, Silver Era, Tokita, Ultimate Hypertrophy) and valid exerciseIds', () => {
        const defaultLibIds = new Set(DEFAULT_LIBRARY.map((e) => e.id));

        // 1. Toji Fushiguro
        const toji = INITIAL_TEMPLATES.find((t) => t.id === 'nh_toji')!;
        expect(toji.defaultStageId).toBe('stage_3');
        expect(toji.stages?.map((s) => s.id)).toEqual(['stage_1', 'stage_2', 'stage_3']);
        expect(toji.stages![0].program.length).toBe(3);
        expect(toji.stages![1].program.length).toBe(3);
        expect(toji.stages![2].program.length).toBe(4);

        // 2. Kratos
        const kratos = INITIAL_TEMPLATES.find((t) => t.id === 'nh_kratos')!;
        expect(kratos.defaultStageId).toBe('stage_3');
        expect(kratos.stages?.map((s) => s.id)).toEqual(['stage_1', 'stage_2', 'stage_3']);
        expect(kratos.stages![0].program.length).toBe(3);
        expect(kratos.stages![1].program.length).toBe(4);
        expect(kratos.stages![2].program.length).toBe(5);

        // 3. Baki
        const baki = INITIAL_TEMPLATES.find((t) => t.id === 'nh_baki')!;
        expect(baki.defaultStageId).toBe('prog_2');
        expect(baki.stages?.map((s) => s.id)).toEqual(['prog_1', 'prog_2', 'prog_2_2']);
        expect(baki.stages![0].program.length).toBe(3);
        expect(baki.stages![1].program.length).toBe(3);
        expect(baki.stages![2].program.length).toBe(3);

        // 4. Silver Era
        const silverEra = INITIAL_TEMPLATES.find((t) => t.id === 'nh_silver_era')!;
        expect(silverEra.defaultStageId).toBe('intermediate');
        expect(silverEra.stages?.map((s) => s.id)).toEqual(['intermediate', 'advanced']);
        expect(silverEra.stages![0].program.length).toBe(3);
        expect(silverEra.stages![1].program.length).toBe(4);

        // 5. Tokita Ohma
        const tokita = INITIAL_TEMPLATES.find((t) => t.id === 'tokita')!;
        expect(tokita.defaultStageId).toBe('barbell');
        expect(tokita.stages?.map((s) => s.id)).toEqual(['barbell', 'no_barbell']);
        expect(tokita.stages![0].program.length).toBe(4);
        expect(tokita.stages![1].program.length).toBe(4);

        // 6. Ultimate Hypertrophy 5 stages
        const ultIds = [
            ['nh_ult_beginner', 'beginner'],
            ['nh_ult_novice', 'novice'],
            ['nh_ult_bridge', 'bridge'],
            ['nh_ult_intermediate', 'intermediate'],
            ['nh_ult_advanced', 'advanced'],
        ] as const;

        for (const [tplId, defStage] of ultIds) {
            const ult = INITIAL_TEMPLATES.find((t) => t.id === tplId)!;
            expect(ult.defaultStageId).toBe(defStage);
            expect(ult.stages?.map((s) => s.id)).toEqual(['beginner', 'novice', 'bridge', 'intermediate', 'advanced']);
        }

        // Verify all stage slots across all templates have valid exerciseIds in DEFAULT_LIBRARY
        for (const tpl of INITIAL_TEMPLATES) {
            if (!tpl.stages) continue;
            for (const stage of tpl.stages) {
                expect(stage.program.length).toBeGreaterThan(0);
                for (const day of stage.program) {
                    expect(day.slots.length).toBeGreaterThan(0);
                    for (const slot of day.slots) {
                        expect(slot.exerciseId).toBeTruthy();
                        expect(
                            defaultLibIds.has(slot.exerciseId!),
                            `Template ${tpl.id} stage ${stage.id} day ${day.id} has unknown exerciseId '${slot.exerciseId}'`
                        ).toBe(true);
                    }
                }
            }
        }
    });
});
