import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const schoolUi = readFileSync(new URL('../components/programs/NhProgrammingSchoolView.tsx', import.meta.url), 'utf8');
const coachUi = readFileSync(new URL('../components/programs/NhLogbookCoachView.tsx', import.meta.url), 'utf8');
const programEditor = readFileSync(new URL('../views/ProgramEditView.tsx', import.meta.url), 'utf8');
assert.ok(!schoolUi.includes('selectedAudit.score') && !schoolUi.includes('draftAudit.score'), 'Programming School must not regress to a visible 0–100 audit grade');
assert.ok(schoolUi.includes('Sin nota 0–100'), 'Audit UI must explain why it uses categories instead of a grade');
assert.ok(schoolUi.includes('¿Qué problema querés resolver?'), 'Modify flow must require a reason before creating a teaching copy');
assert.ok(schoolUi.includes("experiencedExerciseIds: ['__manual_choice_required__']"), 'Guided builder must create function placeholders instead of auto-picking exercises');
assert.ok(schoolUi.includes('exerciseReadiness'), 'Builder experience/fit confirmations must persist with the NH Lab template');
assert.ok(schoolUi.includes('Draft → Alpha → Beta'), 'Lifecycle must be visible as a first-class Programming School path');
assert.ok(coachUi.includes('CONTEXTO CAMBIÓ') && coachUi.includes('CONTEXT CHANGED'), 'Self-Coach must surface context changes explicitly');
assert.ok(programEditor.includes('editingNhLabId') && programEditor.includes('setPersonalTemplates'), 'Advanced editor must keep an opened NH Lab template synchronized with Mine');
assert.ok(programEditor.includes("experienced: false, fit: 'unsure'"), 'A newly introduced exercise must become readiness-pending instead of being silently approved');
assert.ok(programEditor.includes('Confirmo: conozco y tolero todos los ejercicios actuales'), 'NH Lab editor must require an explicit readiness confirmation instead of inferring comfort');

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
  { id: 4, skipped: false, mesoId: 1, dayIdx: 0, startTime: 4_000, endTime: 4_100, exercises: [{ id: 'bp_bar', targetReps: '6-10', programSlotId: 'slot-a', sets: [
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
  ] }] },
  { id: 3, skipped: false, mesoId: 1, dayIdx: 0, startTime: 3_000, endTime: 3_100, exercises: [{ id: 'bp_bar', targetReps: '6-10', programSlotId: 'slot-a', sets: [
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 9 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 9 },
  ] }] },
  { id: 2, skipped: false, mesoId: 1, dayIdx: 0, startTime: 2_000, endTime: 2_100, exercises: [{ id: 'bp_bar', targetReps: '6-10', programSlotId: 'slot-a', sets: [
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
    { completed: true, skipped: false, type: 'regular', weight: 100, reps: 8 },
  ] }] },
];
const trend = buildNhCoachTrends(fakeLogs).find(item => item.exerciseId === 'bp_bar');
assert.ok(trend);
assert.equal(trend?.state, 'context_changed', 'Changing work-set count must not manufacture progress from total reps');
assert.ok((trend?.excludedForContext || 0) > 0);

const crossProgramLogs: any[] = [
  { id: 2, skipped: false, mesoId: 9, dayIdx: 0, startTime: 2_000, endTime: 2_100, exercises: [{ id: 'row_cable', targetReps: '8-12', sets: [{ completed: true, skipped: false, type: 'regular', weight: 50, reps: 12 }] }] },
  { id: 1, skipped: false, mesoId: 8, dayIdx: 0, startTime: 1_000, endTime: 1_100, exercises: [{ id: 'row_cable', targetReps: '8-12', sets: [{ completed: true, skipped: false, type: 'regular', weight: 50, reps: 10 }] }] },
];
assert.equal(buildNhCoachTrends(crossProgramLogs)[0]?.state, 'context_changed', 'Generic exercise history from another mesocycle must not be merged into a fake progression comparison');

const historyLogs: any[] = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  skipped: false,
  mesoId: 1,
  dayIdx: 0,
  startTime: 1_700_000_000_000 + index * 20 * 86_400_000,
  endTime: 1_700_000_100_000 + index * 20 * 86_400_000,
  exercises: [{ id: 'row_cable', targetReps: '8-12', sets: [{ completed: true, skipped: false, type: 'regular', weight: 50, reps: 10 }] }],
}));
const history = collectNhExerciseHistory(historyLogs).find(item => item.exerciseId === 'row_cable');
assert.equal(history?.exposureCount, 6);
assert.ok((history?.spanDays || 0) >= 90);
assert.equal(history?.experiencedByGainsLabHeuristic, true);

console.log('validate-nh-product: OK');
