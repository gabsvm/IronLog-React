import { KONG_4DAY_V1 } from '../programs/kong/kong4Day.ts';
import { resolveProgramDay, resolveProgramWeek, getProgramBlockForWeek } from '../programs/engine/ProgramResolver.ts';
import { toEditableProgram } from '../programs/engine/ProgramConversion.ts';
import { readFileSync } from 'node:fs';

const fail = (message: string): never => { throw new Error(`[validate-kong] ${message}`); };
const assert = (condition: unknown, message: string): void => { if (!condition) fail(message); };
const allSlots = KONG_4DAY_V1.blocks.flatMap((block) => block.days.flatMap((day) => day.exercises));
const librarySource = readFileSync(new URL('../data/defaultLibrary.ts', import.meta.url), 'utf8');
const validIds = new Set(Array.from(librarySource.matchAll(/id:\s*'([^']+)'/g), (match) => match[1]));

assert(KONG_4DAY_V1.durationWeeks === 12, 'duration must be 12 weeks');
assert(KONG_4DAY_V1.daysPerWeek === 4, 'daysPerWeek must be 4');
assert(KONG_4DAY_V1.blocks.length === 3, 'must have 3 blocks');
assert(JSON.stringify(KONG_4DAY_V1.blocks.map((block) => [block.globalWeekStart, block.globalWeekEnd])) === JSON.stringify([[1, 4], [5, 8], [9, 12]]), 'block ranges are incorrect');
assert(allSlots.length > 0, 'no KONG slots');
assert(allSlots.every((slot) => validIds.has(slot.exerciseId)), 'a KONG exerciseId is missing from the default library');
assert(KONG_4DAY_V1.blocks.every((block) => block.days.length === 4), 'every block must resolve four days');
for (let week = 1; week <= 12; week += 1) {
  const resolved = KONG_4DAY_V1.blocks.flatMap((block) => block.days).map((_, dayIndex) => resolveProgramDay(KONG_4DAY_V1, week, dayIndex % 4));
  assert(resolved.length === 12, `week ${week} did not resolve all days`);
  for (const day of resolved) for (const slot of day.slots) assert((slot.prescription || []).length > 0, `week ${week} has an empty prescription`);
}
for (const slot of allSlots) for (const week of [1, 2, 3, 4]) {
  const prescription = slot.prescriptions[week];
  assert(prescription?.sets.length, `${slot.slotId} missing week ${week}`);
  assert(prescription.sets.every((set) => set.targetRpe === undefined || (set.targetRpe >= 1 && set.targetRpe <= 10)), `${slot.slotId} has invalid RPE`);
}
const duplicate = KONG_4DAY_V1.blocks[0].days[3].exercises.filter((slot) => slot.sourceExerciseName === 'Hamstring Curl');
assert(duplicate.length === 2 && duplicate[0].slotId !== duplicate[1].slotId, 'B1D4 duplicate Hamstring Curl was lost');
const w5Main = resolveProgramDay(KONG_4DAY_V1, 5, 0).slots[0].prescription?.map((set) => set.reps).join(',');
assert(w5Main === '12,10,8,5,12', 'Block 2 week 5 main pattern mismatch');
const w7Main = resolveProgramDay(KONG_4DAY_V1, 7, 0).slots[0].prescription?.map((set) => set.reps).join(',');
assert(w7Main === '10,8,5,3,8,12', 'Block 2 week 7 main pattern mismatch');
const w8Main = resolveProgramDay(KONG_4DAY_V1, 8, 0).slots[0].prescription?.map((set) => set.reps).join(',');
assert(w8Main === '8,5,3,5,8,12', 'Block 2 week 8 main pattern mismatch');
const w9Push = resolveProgramDay(KONG_4DAY_V1, 9, 0).slots[0].prescription || [];
assert(w9Push.map((set) => set.reps).join(',') === '5,8,8,8,15' && w9Push[0].role === 'top' && w9Push[4].role === 'high_rep_backoff', 'Block 3 week 9 main roles mismatch');
const w12Squat = resolveProgramDay(KONG_4DAY_V1, 12, 3).slots[0].prescription || [];
assert(w12Squat.map((set) => set.reps).join(',') === '1,6,6,6,10', 'Block 3 week 12 main pattern mismatch');
const chin = resolveProgramDay(KONG_4DAY_V1, 9, 3).slots.find((slot) => slot.programSlotId === 'b3d4_chinups');
assert(chin?.prescription?.every((set) => set.reps === 'FAILURE'), 'Chin Ups failure prescription mismatch');
assert(getProgramBlockForWeek(KONG_4DAY_V1, 5).block.number === 2 && getProgramBlockForWeek(KONG_4DAY_V1, 9).block.number === 3, 'block transitions mismatch');
const substitution = resolveProgramDay(KONG_4DAY_V1, 1, 0, { b1d1_jm_press: 'tri_ext' }).slots[0];
assert(substitution.exerciseId === 'tri_ext' && substitution.programSourceName === 'JM Press', 'persistent substitution did not resolve without mutating source metadata');

// Leaving a Program System must create a genuinely editable legacy routine.
// Hidden prescription metadata would otherwise continue to override the SETS /
// REPS controls shown by ProgramEditView.
const editableW12 = toEditableProgram(resolveProgramWeek(KONG_4DAY_V1, 12));
const editableSlots = editableW12.flatMap((day) => day.slots);
assert(editableSlots.every((slot) => !slot.prescription && !slot.programSlotId && !slot.substitutionGroup && !slot.programSourceName && !slot.targetMuscle), 'editable conversion leaked Program System metadata');
assert(editableW12[3].slots[0].setTarget === 5, 'editable Week 12 squat should preserve five visible sets');
assert(editableW12[3].slots[0].reps === '1 · 6 · 6 · 6 · 10', 'editable Week 12 squat should preserve the visible rep sequence');

console.log('KONG validation passed: 12 weeks, 4 days, 3 blocks, exact prescriptions, exercise IDs, and safe editable conversion.');
