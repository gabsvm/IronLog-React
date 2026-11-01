import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATES } from '../../data/defaultTemplates';
import { RP_ALL_TEMPLATES, RP_GUIDELINE_IMAGES } from '../../data/rpTemplates';
import { DEFAULT_LIBRARY } from '../../data/defaultLibrary';
import fs from 'node:fs';
import path from 'node:path';

describe('RP Templates & Guidelines', () => {
    it('should include all 16 RP templates in INITIAL_TEMPLATES', () => {
        const initialIds = new Set(INITIAL_TEMPLATES.map(t => t.id));
        expect(RP_ALL_TEMPLATES.length).toBe(16);
        for (const tpl of RP_ALL_TEMPLATES) {
            expect(initialIds.has(tpl.id)).toBe(true);
            expect(tpl.title.en).toBeTruthy();
            expect(tpl.title.es).toBeTruthy();
            expect(tpl.description.en).toBeTruthy();
            expect(tpl.description.es).toBeTruthy();
            expect(tpl.program.length).toBeGreaterThan(0);
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

    it('should have 18 guideline images rendered and existing on disk', () => {
        expect(RP_GUIDELINE_IMAGES.length).toBe(18);
        for (let i = 1; i <= 18; i++) {
            const filename = `rp_guide_${String(i).padStart(2, '0')}.png`;
            const filePath = path.join(process.cwd(), 'public', 'assets', 'templates', 'rp', filename);
            expect(fs.existsSync(filePath)).toBe(true);
        }
    });
});
