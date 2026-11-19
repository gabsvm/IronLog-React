import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATES } from '../../data/defaultTemplates';
import { RP_ALL_TEMPLATES } from '../../data/rpTemplates';
import { RP_GUIDE_DATA, RP_GUIDE_TABS } from '../../data/rpGuideData';
import { RP_PRINCIPLES_DATA } from '../../data/rpPrinciplesData';
import { DEFAULT_LIBRARY } from '../../data/defaultLibrary';

describe('RP Templates & Native Guide', () => {
    it('should include all 16 RP templates in INITIAL_TEMPLATES with native guideId', () => {
        const initialIds = new Set(INITIAL_TEMPLATES.map(t => t.id));
        expect(RP_ALL_TEMPLATES.length).toBe(16);
        for (const tpl of RP_ALL_TEMPLATES) {
            expect(initialIds.has(tpl.id)).toBe(true);
            expect(tpl.title.en).toBeTruthy();
            expect(tpl.title.es).toBeTruthy();
            expect(tpl.description.en).toBeTruthy();
            expect(tpl.description.es).toBeTruthy();
            expect(tpl.program.length).toBeGreaterThan(0);
            expect(tpl.guideId).toBe('rp_mpt');
            expect(tpl.guidelineImages).toBeUndefined();
        }
    });

    it('should have valid exercise IDs in DEFAULT_LIBRARY for every single slot', () => {
        const libraryIds = new Set(DEFAULT_LIBRARY.map(e => e.id));
        let slotCount = 0;

        for (const tpl of RP_ALL_TEMPLATES) {
            for (const day of tpl.program) {
                expect(day.dayName.en).toBeTruthy();
                expect(day.dayName.es).toBeTruthy();
                expect(day.slots.length).toBeGreaterThan(0);

                for (const slot of day.slots) {
                    slotCount++;
                    expect(slot.exerciseId).toBeTruthy();
                    expect(libraryIds.has(slot.exerciseId!)).toBe(true);
                    expect(slot.setTarget).toBeGreaterThan(0);
                    expect(slot.muscle).toBeTruthy();
                }
            }
        }

        expect(slotCount).toBeGreaterThan(300);
    });

    it('should provide complete bilingual native RP guide data without spreadsheet/purchase boilerplate', () => {
        expect(RP_GUIDE_TABS).toHaveLength(8);
        expect(RP_GUIDE_DATA.mesocycles).toHaveLength(4);
        expect(RP_GUIDE_DATA.rirLevels).toHaveLength(3);
        expect(RP_GUIDE_DATA.ratingScale.map(r => r.score)).toEqual(['-2', '-1', '0', '+1', '+2']);
        expect(RP_GUIDE_DATA.warmupSteps).toHaveLength(4);
        expect(RP_GUIDE_DATA.nutrition.dayTiers).toHaveLength(3);
        expect(RP_GUIDE_DATA.nutrition.cardioPriority).toHaveLength(4);
        expect(RP_GUIDE_DATA.faqs.length).toBeGreaterThanOrEqual(15);

        for (const faq of RP_GUIDE_DATA.faqs) {
            expect(faq.question.es.trim().length).toBeGreaterThan(5);
            expect(faq.question.en.trim().length).toBeGreaterThan(5);
            expect(faq.answer.es.trim().length).toBeGreaterThan(10);
            expect(faq.answer.en.trim().length).toBeGreaterThan(10);
        }

        const serialized = JSON.stringify(RP_GUIDE_DATA);
        expect(serialized).not.toMatch(/\bExcel\b/i);
        expect(serialized).not.toMatch(/\bFacebook\b/i);
        expect(serialized).not.toMatch(/Thank you for purchasing/i);
    });

    it('should include complete verified Scientific Principles of Hypertrophy Training dataset in ES and EN', () => {
        expect(RP_PRINCIPLES_DATA.sevenPrinciples).toHaveLength(7);
        expect(RP_PRINCIPLES_DATA.volumeLandmarks).toHaveLength(4);
        expect(RP_PRINCIPLES_DATA.trainingAges).toHaveLength(3);
        expect(RP_PRINCIPLES_DATA.executionScience.overloadModalities).toHaveLength(8);
        expect(RP_PRINCIPLES_DATA.autoregAlgorithms.setProgression.matrix).toHaveLength(4);
        for (const row of RP_PRINCIPLES_DATA.autoregAlgorithms.setProgression.matrix) {
            expect(row).toHaveLength(4);
        }
        expect(RP_PRINCIPLES_DATA.specialCases.troubleshooting).toHaveLength(9);
        expect(RP_PRINCIPLES_DATA.specialCases.lowInjuryRisk).toHaveLength(9);
        expect(RP_PRINCIPLES_DATA.specialCases.postInjuryPhases).toHaveLength(6);
        expect(RP_PRINCIPLES_DATA.specialCases.timeCrunched).toHaveLength(9);
        expect(RP_PRINCIPLES_DATA.glossary.length).toBeGreaterThanOrEqual(15);

        const verifyLocalizedFields = (node: unknown, path = 'root') => {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
                node.forEach((item, idx) => verifyLocalizedFields(item, `${path}[${idx}]`));
                return;
            }
            const record = node as Record<string, unknown>;
            if (typeof record.es === 'string' && typeof record.en === 'string') {
                expect(record.es.trim().length, `${path}.es empty`).toBeGreaterThan(0);
                expect(record.en.trim().length, `${path}.en empty`).toBeGreaterThan(0);
                return;
            }
            for (const [k, v] of Object.entries(record)) {
                verifyLocalizedFields(v, `${path}.${k}`);
            }
        };

        verifyLocalizedFields(RP_PRINCIPLES_DATA);

        const serialized = JSON.stringify(RP_PRINCIPLES_DATA);
        expect(serialized).not.toMatch(/\bExcel\b/i);
        expect(serialized).not.toMatch(/\bFacebook\b/i);
        expect(serialized).not.toMatch(/Thank you for purchasing/i);
    });
});
