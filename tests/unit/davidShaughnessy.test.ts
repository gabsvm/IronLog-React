import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATES } from '../../data/defaultTemplates';
import { DAVID_SHAUGHNESSY_SILVERBACK_TEMPLATE, DAVID_SHAUGHNESSY_SILVERBACK_PROGRAM } from '../../data/davidShaughnessy';
import { DEFAULT_LIBRARY } from '../../data/defaultLibrary';

describe('David Shaughnessy 3-Day Silverback Program', () => {
    it('should be registered in INITIAL_TEMPLATES', () => {
        const found = INITIAL_TEMPLATES.find(t => t.id === 'david_shaughnessy_silverback_3d');
        expect(found).toBeDefined();
        expect(found?.title.en).toContain('Silverback');
        expect(found?.title.es).toContain('Silverback');
        expect(found?.description.en).toContain('David Shaughnessy');
        expect(found?.description.es).toContain('David Shaughnessy');
        expect(found?.program.length).toBe(3);
    });

    it('should have 3 distinct days with 7 slots each (21 total exercises)', () => {
        expect(DAVID_SHAUGHNESSY_SILVERBACK_PROGRAM.length).toBe(3);
        const [day1, day2, day3] = DAVID_SHAUGHNESSY_SILVERBACK_PROGRAM;

        expect(day1.slots.length).toBe(7);
        expect(day2.slots.length).toBe(7);
        expect(day3.slots.length).toBe(7);

        // Day 1 check
        expect(day1.slots[0].exerciseId).toBe('wide_bench_press');
        expect(day1.slots[1].exerciseId).toBe('pullup');
        expect(day1.slots[2].exerciseId).toBe('ohp_db');

        // Day 2 check
        expect(day2.slots[0].exerciseId).toBe('close_grip_bench');
        expect(day2.slots[2].exerciseId).toBe('single_arm_cable_fly');
        expect(day2.slots[3].exerciseId).toBe('seal_row');
        expect(day2.slots[4].exerciseId).toBe('behind_neck_press');
        expect(day2.slots[6].exerciseId).toBe('powell_raise');

        // Day 3 check
        expect(day3.slots[0].exerciseId).toBe('curl_preacher');
        expect(day3.slots[1].exerciseId).toBe('tri_push');
        expect(day3.slots[5].exerciseId).toBe('zercher_squat');
        expect(day3.slots[6].exerciseId).toBe('sq_hack');
    });

    it('should have 100% valid exercise IDs in DEFAULT_LIBRARY for every slot', () => {
        const libIds = new Set(DEFAULT_LIBRARY.map(e => e.id));

        for (const day of DAVID_SHAUGHNESSY_SILVERBACK_PROGRAM) {
            for (const slot of day.slots) {
                expect(slot.exerciseId).toBeDefined();
                expect(libIds.has(slot.exerciseId!)).toBe(true);
                expect(slot.setTarget).toBeGreaterThan(0);
                expect(slot.muscle).toBeDefined();
            }
        }
    });

    it('should have all 4 newly added exercises in DEFAULT_LIBRARY with video and instructions', () => {
        const newIds = ['zercher_squat', 'powell_raise', 'seal_row', 'single_arm_cable_fly'];
        for (const id of newIds) {
            const ex = DEFAULT_LIBRARY.find(e => e.id === id);
            expect(ex).toBeDefined();
            const nameEn = typeof ex?.name === 'object' ? ex.name.en : ex?.name;
            const nameEs = typeof ex?.name === 'object' ? ex.name.es : ex?.name;
            expect(nameEn).toBeTruthy();
            expect(nameEs).toBeTruthy();
            expect(ex?.instructions?.en).toBeTruthy();
            expect(ex?.instructions?.es).toBeTruthy();
            expect(ex?.videoId).toBeTruthy();
        }
    });
});
