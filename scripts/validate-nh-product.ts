import assert from 'node:assert/strict';
import { buildNhTeachingDraft, auditNhProgram, makeNhSchoolTemplate } from '../programs/naturalHypertrophy/programmingSchool.ts';
import { buildNhCoachTrends, collectNhExerciseHistory } from '../programs/naturalHypertrophy/nhLogbookAnalysis.ts';
import { localizeNhTeachingDraft, summarizeNhAudit } from '../programs/naturalHypertrophy/nhSchoolProductLogic.ts';
import {
  attachNhLabMeta,
  createNhLabMeta,
  nhLabCanStartAlpha,
  nhLabNextPhase,
  transitionNhLabPhase,
} from '../programs/naturalHypertrophy/nhLabLifecycle.ts';

const scaffold = buildNhTeachingDraft({ days: 4, priorities: ['BACK'], experiencedExerciseIds: ['__manual_choice_required__'] });
assert.equal(scaffold.length, 4);
assert.ok(scaffold.flatMap(day => day.slots).every(slot => !slot.exerciseId), 'Guided builder scaffold must not silently choose exercises');
const localized = localizeNhTeachingDraft(scaffold, 'es');
assert.ok(localized.flatMap(day => day.slots).some(slot => String(slot.label).includes('Press') || String(slot.label).includes('Tirón') || String(slot.label).includes('Bisagra')), 'Spanish teaching draft should localize movement-role labels');

const hingeAudit = auditNhProgram([
  { id: 'd1', dayName: { en: 'D1', es: 'D1' }, slots: [{ muscle: 'HAMSTRINGS', setTarget: 2, reps: '6-10', exerciseId: 'rdl' }] },
  { id: 'd2', dayName: { en: 'D2', es: 'D2' }, slots: [{ muscle: 'BACK', setTarget: 2, reps: '3-5', exerciseId: 'deadlift' }] },
]);
const hingeFinding = hingeAudit.findings.find(item => item.id.startsWith('adjacent-hinges-'));
assert.equal(hingeFinding?.kind, 'inference');
const categories = summarizeNhAudit(hingeAudit);
assert.equal(categories.find(item => item.id === 'recovery')?.state, 'review', 'An inference about adjacent template positions must be review, not a hard change command');

const completeProgram = [{
  id: 'd1',
  dayName: { en: 'Day 1', es: 'Día 1' },
  slots: [{ muscle: 'CHEST' as const, setTarget: 3, reps: '6-10', exerciseId: 'bp_bar' }],
}];
const base = makeNhSchoolTemplate(completeProgram, 'Lifecycle test');
const notReady = attachNhLabMeta(base, createNhLabMeta({ exerciseReadiness: { bp_bar: { experienced: true, fit: 'unsure' } } }));
assert.equal(nhLabCanStartAlpha(notReady), false, 'Alpha readiness must respect the user fit confirmation when readiness metadata exists');
const ready = attachNhLabMeta(base, createNhLabMeta({ exerciseReadiness: { bp_bar: { experienced: true, fit: 'works' } } }));
assert.equal(nhLabCanStartAlpha(ready), true);
assert.equal(nhLabNextPhase('draft'), 'alpha');
const alpha = transitionNhLabPhase(ready, 'alpha', 1000);
assert.equal(alpha.nhLab?.phase, 'alpha');
assert.equal(transitionNhLabPhase(alpha, 'mature', 2000).nhLab?.phase, 'alpha', 'Lifecycle cannot skip Beta');
const beta = transitionNhLabPhase(alpha, 'beta', 3000);
const mature = transitionNhLabPhase(beta, 'mature', 4000);
assert.equal(mature.nhLab?.phase, 'mature');
assert.ok((mature.nhLab?.changeLog.length || 0) >= 3);

const fakeLogs: any[] = [
  { id: 4, skipped: false, startTime: 4_000, endTime: 4_100, exercises: [{ id: 'bp_bar', targetReps: '6-10', programSlotId: 'slot-a', sets: [
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
  ] }] },
  { id: 3, skipped: false, startTime: 3_000, endTime: 3_100, exercises: [{ id: 'bp_bar', targetReps: '6-10', programSlotId: 'slot-a', sets: [
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 9 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 9 },
  ] }] },
  { id: 2, skipped: false, startTime: 2_000, endTime: 2_100, exercises: [{ id: 'bp_bar', targetReps: '6-10', programSlotId: 'slot-a', sets: [
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
  ] }] },
];
const trend = buildNhCoachTrends(fakeLogs).find(item => item.exerciseId === 'bp_bar');
assert.ok(trend);
assert.equal(trend?.state, 'context_changed', 'Changing work-set count must not manufacture progress from total reps');
assert.ok((trend?.excludedForContext || 0) > 0);

const historyLogs: any[] = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  skipped: false,
  startTime: 1_700_000_000_000 + index * 20 * 86_400_000,
  endTime: 1_700_000_100_000 + index * 20 * 86_400_000,
  exercises: [{ id: 'row_cable', targetReps: '8-12', sets: [{ completed: true, skipped: false, type: 'regular', weight: 50, reps: 10 }] }],
}));
const history = collectNhExerciseHistory(historyLogs).find(item => item.exerciseId === 'row_cable');
assert.equal(history?.exposureCount, 6);
assert.ok((history?.spanDays || 0) >= 90);
assert.equal(history?.experiencedByGainsLabHeuristic, true);

console.log('validate-nh-product: OK');
