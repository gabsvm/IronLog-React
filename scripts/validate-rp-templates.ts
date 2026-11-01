import { INITIAL_TEMPLATES } from '../data/defaultTemplates.ts';
import { RP_ALL_TEMPLATES, RP_GUIDELINE_IMAGES } from '../data/rpTemplates.ts';
import { DEFAULT_LIBRARY } from '../data/defaultLibrary.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const fail = (msg: string): never => {
    throw new Error(`[validate-rp-templates] ${msg}`);
};
const assert = (cond: unknown, msg: string): void => {
    if (!cond) fail(msg);
};

console.log(`Validating ${RP_ALL_TEMPLATES.length} RP templates...`);

// 1. Check all RP templates exist in INITIAL_TEMPLATES
const initialIds = new Set(INITIAL_TEMPLATES.map(t => t.id));
for (const tpl of RP_ALL_TEMPLATES) {
    assert(initialIds.has(tpl.id), `Template ${tpl.id} missing from INITIAL_TEMPLATES`);
    assert(tpl.title?.en && tpl.title?.es, `Template ${tpl.id} missing bilingual title`);
    assert(tpl.description?.en && tpl.description?.es, `Template ${tpl.id} missing bilingual description`);
    assert(tpl.program && tpl.program.length > 0, `Template ${tpl.id} has empty program`);
    assert(tpl.guidelineImages && tpl.guidelineImages.length === 18, `Template ${tpl.id} should have 18 guidelineImages`);
}

// 2. Check all slots and exercise IDs
const libraryIds = new Set(DEFAULT_LIBRARY.map(e => e.id));
let totalSlots = 0;

for (const tpl of RP_ALL_TEMPLATES) {
    for (const [dIdx, day] of tpl.program.entries()) {
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

// 3. Check guideline image files on disk
assert(RP_GUIDELINE_IMAGES.length === 18, 'Must have 18 RP guideline images');
for (let i = 1; i <= 18; i++) {
    const filename = `rp_guide_${String(i).padStart(2, '0')}.png`;
    const fullPath = join(process.cwd(), 'public', 'assets', 'templates', 'rp', filename);
    assert(existsSync(fullPath), `Guideline image missing on disk: ${fullPath}`);
}

console.log(`RP Validation PASSED: ${RP_ALL_TEMPLATES.length} templates, ${totalSlots} total slots verified against DEFAULT_LIBRARY, 18 guideline images verified on disk!`);
