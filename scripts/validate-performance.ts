import { readFileSync } from 'node:fs';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../programs/performance/performanceUpperLower.ts';
import { PERFORMANCE_GUIDE } from '../programs/performance/performanceGuide.ts';
import { getProgramBlockForWeek, resolveProgramDay, resolveProgramWeek } from '../programs/engine/ProgramResolver.ts';
import { toEditableProgram } from '../programs/engine/ProgramConversion.ts';

const fail = (message: string): never => { throw new Error(`[validate-performance] ${message}`); };
const assert = (condition: unknown, message: string): void => { if (!condition) fail(message); };

const librarySource = readFileSync(new URL('../data/defaultLibrary.ts', import.meta.url), 'utf8');
const validIds = new Set(Array.from(librarySource.matchAll(/id:\s*'([^']+)'/g), (match) => match[1]));
const allSlots = PERFORMANCE_UPPER_LOWER_V1.blocks.flatMap(block => block.days.flatMap(day => day.exercises));

assert(PERFORMANCE_UPPER_LOWER_V1.id === 'performance_upper_lower', 'system id changed unexpectedly');
assert(PERFORMANCE_UPPER_LOWER_V1.version === 1, 'v1 system version changed unexpectedly');
assert(PERFORMANCE_UPPER_LOWER_V1.durationWeeks === 8, 'must resolve eight cycles');
assert(PERFORMANCE_UPPER_LOWER_V1.daysPerWeek === 4, 'must have four sessions per cycle');
assert(PERFORMANCE_UPPER_LOWER_V1.cadence?.unit === 'cycle', 'cadence must use rolling cycles');
assert(PERFORMANCE_UPPER_LOWER_V1.cadence?.rolling === true, 'cadence must remain rolling');
assert(PERFORMANCE_UPPER_LOWER_V1.cadence?.recommendedRestDaysBetweenSessions === 1, 'default cadence must retain one rest day between sessions');
assert(PERFORMANCE_UPPER_LOWER_V1.progressionModel === 'double_progression', 'progression model must remain double progression');
assert(PERFORMANCE_UPPER_LOWER_V1.blocks.length === 3, 'must have Calibration, Build and Pivot blocks');
assert(
  JSON.stringify(PERFORMANCE_UPPER_LOWER_V1.blocks.map(block => [block.globalWeekStart, block.globalWeekEnd])) === JSON.stringify([[1, 2], [3, 7], [8, 8]]),
  'cycle ranges must be 1-2 / 3-7 / 8',
);
assert(PERFORMANCE_UPPER_LOWER_V1.blocks.every(block => block.days.length === 4), 'every phase must resolve all four sessions');
assert(allSlots.length > 0, 'program has no exercise slots');
assert(allSlots.every(slot => validIds.has(slot.exerciseId)), 'a PERFORMANCE exerciseId is missing from the default library');

for (let cycle = 1; cycle <= PERFORMANCE_UPPER_LOWER_V1.durationWeeks; cycle += 1) {
  const resolved = resolveProgramWeek(PERFORMANCE_UPPER_LOWER_V1, cycle);
  assert(resolved.length === 4, `cycle ${cycle} must resolve four sessions`);
  resolved.forEach((day, dayIndex) => {
    assert(day.slots.length > 0, `cycle ${cycle} session ${dayIndex + 1} is empty`);
    day.slots.forEach(slot => {
      assert((slot.prescription || []).length > 0, `cycle ${cycle} ${slot.programSlotId} has no work sets`);
      (slot.prescription || []).forEach(set => {
        assert(!!set.repRange, `cycle ${cycle} ${slot.programSlotId} lost its rep range`);
        assert((set.repRange?.min || 0) > 0, `cycle ${cycle} ${slot.programSlotId} has invalid minimum reps`);
        assert((set.repRange?.max || 0) >= (set.repRange?.min || 0), `cycle ${cycle} ${slot.programSlotId} has inverted rep range`);
        assert(set.targetRpe !== undefined && set.targetRpe >= 1 && set.targetRpe <= 10, `cycle ${cycle} ${slot.programSlotId} has invalid target RPE`);
      });
    });
  });
}

const cycle1 = resolveProgramDay(PERFORMANCE_UPPER_LOWER_V1, 1, 0);
const cycle3 = resolveProgramDay(PERFORMANCE_UPPER_LOWER_V1, 3, 0);
const cycle8 = resolveProgramDay(PERFORMANCE_UPPER_LOWER_V1, 8, 0);
assert(cycle1.slots[0].prescription?.[0].targetRpe === 7, 'Calibration compounds must start at RPE 7');
assert(cycle3.slots[0].prescription?.[0].targetRpe === 8, 'Build compounds must target RPE 8');
assert(cycle8.slots[0].prescription?.[0].targetRpe === 7, 'Pivot compounds must return to RPE 7');
assert((cycle8.slots[0].prescription?.length || 0) < (cycle3.slots[0].prescription?.length || 0), 'Pivot must reduce main-lift set count');

const expectedSessionNames = ['performance-upper-a', 'performance-lower-a', 'performance-upper-b', 'performance-lower-b'];
assert(
  JSON.stringify(resolveProgramWeek(PERFORMANCE_UPPER_LOWER_V1, 1).map(day => day.id)) === JSON.stringify(expectedSessionNames),
  'session order changed unexpectedly',
);

const upperARanges = resolveProgramDay(PERFORMANCE_UPPER_LOWER_V1, 3, 0).slots.map(slot => slot.prescription?.[0].repRange ? `${slot.prescription[0].repRange?.min}-${slot.prescription[0].repRange?.max}` : '');
assert(upperARanges[0] === '6-10' && upperARanges[4] === '12-20', 'Upper A progression ranges changed unexpectedly');

const editableBuild = toEditableProgram(resolveProgramWeek(PERFORMANCE_UPPER_LOWER_V1, 3));
assert(editableBuild[0]?.slots[0]?.reps === '6-10', 'editable PERFORMANCE snapshot must preserve the 6-10 rep range');
assert(editableBuild[0]?.slots[0]?.setTarget === 3, 'editable PERFORMANCE snapshot must preserve work-set count');
assert(!editableBuild[0]?.slots[0]?.prescription, 'editable PERFORMANCE snapshot must strip structured prescription metadata');
assert(!editableBuild[0]?.slots[0]?.programSlotId, 'editable PERFORMANCE snapshot must strip structured slot identity');

assert(getProgramBlockForWeek(PERFORMANCE_UPPER_LOWER_V1, 1).block.id === 'performance-calibration', 'cycle 1 must be Calibration');
assert(getProgramBlockForWeek(PERFORMANCE_UPPER_LOWER_V1, 3).block.id === 'performance-build', 'cycle 3 must be Productive Build');
assert(getProgramBlockForWeek(PERFORMANCE_UPPER_LOWER_V1, 8).block.id === 'performance-pivot', 'cycle 8 must be Pivot');

const requiredGuideSections = [
  'what-is-performance',
  'fatigue-budget',
  'rolling-cycle',
  'double-progression',
  'rir',
  'volume',
  'recovery-gate',
  'exercise-selection',
  'pivot',
  'after-eight-cycles',
];
const guideIds = new Set(PERFORMANCE_GUIDE.map(section => section.id));
assert(requiredGuideSections.every(id => guideIds.has(id)), 'a required philosophy/progression guide section is missing');

console.log('PERFORMANCE validation passed: 8 rolling cycles, 4 sessions, valid exercise IDs, ranged double progression, RPE phases, pivot, editable conversion and philosophy guide.');
