import { INITIAL_TEMPLATES } from '../data/defaultTemplates.ts';
import { RP_ALL_TEMPLATES } from '../data/rpTemplates.ts';
import { DEFAULT_LIBRARY } from '../data/defaultLibrary.ts';

const fail = (msg: string): never => {
    throw new Error(`[validate-rp-templates] ${msg}`);
};
const assert = (cond: unknown, msg: string): void => {
    if (!cond) fail(msg);
};

console.log(`Validating ${RP_ALL_TEMPLATES.length} RP templates...`);

// 1. Check all RP templates exist in INITIAL_TEMPLATES with native guideId
const initialIds = new Set(INITIAL_TEMPLATES.map(t => t.id));
for (const tpl of RP_ALL_TEMPLATES) {
    assert(initialIds.has(tpl.id), `Template ${tpl.id} missing from INITIAL_TEMPLATES`);
    assert(tpl.title?.en && tpl.title?.es, `Template ${tpl.id} missing bilingual title`);
    assert(tpl.description?.en && tpl.description?.es, `Template ${tpl.id} missing bilingual description`);
    assert(tpl.program && tpl.program.length > 0, `Template ${tpl.id} has empty program`);
    assert(tpl.guideId === 'rp_mpt', `Template ${tpl.id} should have guideId: 'rp_mpt'`);
}

// 2. Check all slots and exercise IDs
const libraryIds = new Set(DEFAULT_LIBRARY.map(e => e.id));
let totalSlots = 0;

for (const tpl of RP_ALL_TEMPLATES) {
    for (const day of tpl.program) {
        assert(day.dayName?.en && day.dayName?.es, `Day ${day.id} missing bilingual dayName`);
        assert(day.slots && day.slots.length > 0, `Day ${day.id} has no slots`);

        for (const [sIdx, slot] of day.slots.entries()) {
            totalSlots++;
            assert(slot.exerciseId, `Slot ${sIdx} in day ${day.id} has no exerciseId`);
            assert(libraryIds.has(slot.exerciseId), `Slot exerciseId '${slot.exerciseId}' in day ${day.id} not found in DEFAULT_LIBRARY`);
            assert(slot.muscle, `Slot ${sIdx} in day ${day.id} missing muscle`);
            assert(slot.setTarget > 0, `Slot ${sIdx} in day ${day.id} has invalid setTarget (${slot.setTarget})`);
        }
    }
}

console.log(`RP Validation PASSED: ${RP_ALL_TEMPLATES.length} templates, ${totalSlots} total slots verified against DEFAULT_LIBRARY, native RP guide linked cleanly!`);
