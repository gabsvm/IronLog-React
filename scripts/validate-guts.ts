import { readFileSync } from 'node:fs';
import { GUTS_EXERCISES } from '../data/gutsExercises.ts';
import { GUTS_BLACK_SWORDSMAN_V1 } from '../programs/naturalHypertrophy/gutsBlackSwordsman.ts';
import { GUTS_GUIDE } from '../programs/naturalHypertrophy/gutsGuide.ts';
import { resolveProgramDay, resolveProgramWeek } from '../programs/engine/ProgramResolver.ts';
import { toEditableProgram } from '../programs/engine/ProgramConversion.ts';

const fail = (message: string): never => { throw new Error(`[validate-guts] ${message}`); };
const assert = (condition: unknown, message: string): void => { if (!condition) fail(message); };

const librarySource = readFileSync(new URL('../data/defaultLibrary.ts', import.meta.url), 'utf8');
const libraryIds = new Set(Array.from(librarySource.matchAll(/id:\s*'([^']+)'/g), match => match[1]));
GUTS_EXERCISES.forEach(exercise => libraryIds.add(exercise.id));

assert(GUTS_BLACK_SWORDSMAN_V1.id === 'natural_hypertrophy_guts_black_swordsman', 'system id changed');
assert(GUTS_BLACK_SWORDSMAN_V1.version === 1, 'v1 system version changed');
assert(GUTS_BLACK_SWORDSMAN_V1.author === 'Natural Hypertrophy', 'author changed');
assert(GUTS_BLACK_SWORDSMAN_V1.durationWeeks === 12, 'GUTS must resolve 12 tracked weeks');
assert(GUTS_BLACK_SWORDSMAN_V1.daysPerWeek === 4, 'GUTS Black Swordsman must have four days');
assert(GUTS_BLACK_SWORDSMAN_V1.progressionModel === 'evolving_rep_range', 'GUTS must retain evolving rep-range progression');
assert(GUTS_BLACK_SWORDSMAN_V1.blocks.length === 1, 'public Black Swordsman implementation should remain one stable roster block');

const expectedDays = [
  {
    id: 'guts-bs-upper-1',
    slots: [
      ['Bench Press (Barbell)', 3, 3, 5],
      ['Pullover (Dumbbell)', 3, 6, 10],
      ['Overhead Press (Barbell)', 3, 6, 10],
      ['Cable Crunch', 3, 8, 12],
      ['Bench Press (Dumbbell)', 4, 8, 12],
      ['Tricep Extension (Cable)', 4, 10, 15],
      ['Neck Extension', 4, 10, 20],
    ],
  },
  {
    id: 'guts-bs-lower-1',
    slots: [
      ['Chin-Up (Weighted)', 3, 3, 5],
      ['Leg Extension', 3, 10, 15],
      ['Romanian Deadlift (Barbell)', 4, 8, 12],
      ['Incline Curl (Dumbbell)', 4, 6, 12],
      ['Standing Calf Raise', 4, 10, 20],
      ['Leg Press', 4, 10, 15],
      ['Dumbbell Row', 4, 8, 12],
      ['Upright Row (Barbell)', 4, 10, 15],
    ],
  },
  {
    id: 'guts-bs-upper-2',
    slots: [
      ['Bench Press (Close Grip)', 3, 6, 10],
      ['Hammer Curl', 3, 8, 12],
      ['Incline Bench Press (Barbell)', 3, 8, 12],
      ['Neck Curl', 3, 10, 15],
      ['JM Press', 4, 8, 12],
      ['Landmine Oblique Twist', 4, 10, 15],
    ],
  },
  {
    id: 'guts-bs-lower-2',
    slots: [
      ['Deadlift (Barbell)', 3, 3, 3],
      ['Seated Calf Raise', 3, 15, 20],
      ['Squat (Smith Machine)', 4, 10, 15],
      ['Preacher Curl (Barbell)', 4, 6, 12],
      ['Kroc Row', 4, 8, 12],
      ['Lateral Raise (Cable)', 4, 10, 15],
    ],
  },
] as const;

for (let week = 1; week <= 12; week += 1) {
  const resolved = resolveProgramWeek(GUTS_BLACK_SWORDSMAN_V1, week);
  assert(resolved.length === 4, `week ${week} must resolve four days`);
  expectedDays.forEach((expectedDay, dayIndex) => {
    const day = resolved[dayIndex];
    assert(day.id === expectedDay.id, `week ${week} day ${dayIndex + 1} identity changed`);
    assert(day.slots.length === expectedDay.slots.length, `week ${week} ${expectedDay.id} exercise count changed`);
    expectedDay.slots.forEach(([name, sets, min, max], slotIndex) => {
      const slot = day.slots[slotIndex];
      assert(slot.programSourceName === name, `${expectedDay.id} slot ${slotIndex + 1} source exercise changed`);
      assert(libraryIds.has(String(slot.exerciseId)), `${name} exercise id missing from default + GUTS library`);
      assert(slot.prescription?.length === sets, `${name} set count must be ${sets}`);
      (slot.prescription || []).forEach(set => {
        assert(set.repRange?.min === min && set.repRange?.max === max, `${name} range must be ${min}-${max}`);
        assert(set.targetRpe === undefined, `${name} must not invent a fixed RPE target for Natural Hypertrophy`);
      });
      assert(!!slot.supersetId, `${name} lost its public superset/giant-set grouping`);
    });
  });
}

const week1 = resolveProgramWeek(GUTS_BLACK_SWORDSMAN_V1, 1);
const week12 = resolveProgramWeek(GUTS_BLACK_SWORDSMAN_V1, 12);
assert(JSON.stringify(week1) === JSON.stringify(week12), 'public roster should stay stable rather than fabricate hidden Weeks 2-12 changes');

const upper1 = resolveProgramDay(GUTS_BLACK_SWORDSMAN_V1, 1, 0);
const groupSizes = new Map<string, number>();
upper1.slots.forEach(slot => { if (slot.supersetId) groupSizes.set(slot.supersetId, (groupSizes.get(slot.supersetId) || 0) + 1); });
assert(groupSizes.get('gbs_u1_ss1') === 2, 'Upper 1 first superset must contain two exercises');
assert(groupSizes.get('gbs_u1_ss2') === 2, 'Upper 1 second superset must contain two exercises');
assert(groupSizes.get('gbs_u1_gs3') === 3, 'Upper 1 final giant set must contain three exercises');

const editable = toEditableProgram(week1);
assert(editable[0]?.slots[0]?.reps === '3-5', 'editable GUTS snapshot must preserve rep range');
assert(editable[0]?.slots[0]?.setTarget === 3, 'editable GUTS snapshot must preserve set count');
assert(!editable[0]?.slots[0]?.prescription, 'editable copy must strip structured prescription metadata');
assert(!editable[0]?.slots[0]?.programSlotId, 'editable copy must strip structured slot identity');

const requiredGuideSections = [
  'guts-identity',
  'nh-85-rule',
  'nh-evolving-reps',
  'nh-evolving-sets',
  'nh-failure',
  'nh-supersets',
  'nh-recovery-schedule',
  'nh-stability',
  'guts-source-scope',
];
const guideIds = new Set(GUTS_GUIDE.map(section => section.id));
assert(requiredGuideSections.every(id => guideIds.has(id)), 'a required Natural Hypertrophy guide section is missing');

console.log('GUTS validation passed: verified Black Swordsman roster, 12 stable weeks, exact supersets, evolving rep ranges, no fabricated RPE targets and complete NH philosophy guide.');
