import assert from 'node:assert/strict';
import {
  NH_MASSTERPLAN_GUIDES,
  NH_PROGRAMMING_TEACHING_POINTS,
  NH_ROLE_LIBRARY,
  auditNhProgram,
  buildNhTeachingDraft,
  getNhMovementRole,
  makeNhSchoolTemplate,
} from '../programs/naturalHypertrophy/programmingSchool.ts';
import { evaluateNhEvolvingRepCue, evaluateNhPlateauTrend } from '../programs/naturalHypertrophy/nhVerifiedKnowledge.ts';
import {
  NH_ALPHA_BETA_PROTOCOL,
  NH_ICEBERG_CURRICULUM,
  NH_SELF_PROGRAMMING_PATH_VERIFIED,
  NH_SELF_PROGRAMMING_SOURCE_LESSONS,
} from '../programs/naturalHypertrophy/nhSelfProgrammingProtocol.ts';

assert.ok(NH_PROGRAMMING_TEACHING_POINTS.length >= 30, 'Programming School needs the expanded transcript-grounded lesson set');
assert.ok(NH_PROGRAMMING_TEACHING_POINTS.some(item => item.kind === 'nh_principle'), 'Must distinguish verified NH principles');
assert.ok(NH_PROGRAMMING_TEACHING_POINTS.some(item => item.kind === 'inference'), 'Must distinguish inference');
assert.ok(NH_PROGRAMMING_TEACHING_POINTS.some(item => item.kind === 'gainslab_rule'), 'Must distinguish GainsLab operational rules');

const eightyFive = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === '85-rule');
assert.equal(eightyFive?.kind, 'nh_principle', '85% rule must remain an NH principle');
assert.ok(eightyFive?.sourceScope?.includes('How to Get Bigger by Doing Less'), '85% card must point to the uploaded full transcript');
const ceiling = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'evolving-ceiling-not-target');
assert.equal(ceiling?.kind, 'nh_principle', 'Evolving ceiling rule is directly supported by the NH transcript');
const programFirst = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'program-before-running');
assert.equal(programFirst?.kind, 'nh_principle', 'Rare/small in-run changes are directly supported by the NH programming transcript');
const compoundBalance = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'compound-and-precision-balance');
assert.equal(compoundBalance?.kind, 'nh_principle', 'Compound + precision balance must remain sourced to NH');
const plateauPatience = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'plateau-two-three-exposures');
assert.equal(plateauPatience?.kind, 'nh_principle', '2–3 repeated exposures before escalating is now directly source-grounded');
const deloadBoundary = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'deload-safety-boundary');
assert.equal(deloadBoundary?.kind, 'gainslab_rule', 'Never-deload safety boundary must remain a GainsLab rule');
const selfProgramming = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'self-program-own-program');
assert.equal(selfProgramming?.kind, 'nh_principle', 'Self-programming goal is explicitly stated by NH');

assert.equal(NH_SELF_PROGRAMMING_PATH_VERIFIED.length, 8, 'Self-programming path must have eight verified stages');
assert.ok(NH_SELF_PROGRAMMING_PATH_VERIFIED.every(stage => stage.sourceStatus === 'verified'), 'No self-programming stage may remain source-pending');
assert.equal(NH_SELF_PROGRAMMING_PATH_VERIFIED.find(item => item.id === 'alpha-beta')?.sourceStatus, 'verified', 'Alpha/beta must be fully sourced from Part 3');
assert.ok(NH_SELF_PROGRAMMING_PATH_VERIFIED.find(item => item.id === 'alpha-beta')?.sourceScope.includes('AlphaBeta testing your program'));

assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'self-coaching-is-the-destination' && item.kind === 'nh_principle'));
assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'novice-discovery-before-authorship' && item.kind === 'nh_principle'));
assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'progressive-overload-is-multivariable' && item.kind === 'nh_principle'));
assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'conscious-load-increments' && item.kind === 'nh_principle'));
assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'programming-literacy-is-progressive' && item.kind === 'nh_principle'));
assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'alpha-subtract-before-adding' && item.kind === 'nh_principle'));
assert.ok(NH_SELF_PROGRAMMING_SOURCE_LESSONS.some(item => item.id === 'beta-tweak-before-rebuild' && item.kind === 'nh_principle'));

assert.equal(NH_ALPHA_BETA_PROTOCOL.length, 3, 'Alpha/beta protocol must include alpha, beta and mature phases');
const alpha = NH_ALPHA_BETA_PROTOCOL.find(item => item.id === 'alpha');
const beta = NH_ALPHA_BETA_PROTOCOL.find(item => item.id === 'beta');
const mature = NH_ALPHA_BETA_PROTOCOL.find(item => item.id === 'mature');
assert.ok(alpha?.timing.en.includes('2–3 months'), 'Alpha timing should preserve NH roughly 2–3 month guidance');
assert.ok(alpha?.avoid.some(item => item.en.includes('mostly subtraction')), 'Alpha must teach subtraction over new brainstorming');
assert.ok(beta?.timing.en.includes('year'), 'Beta should preserve NH long testing horizon');
assert.ok(beta?.avoid.some(item => item.en.includes('major compound')), 'Beta must guard against casually adding major compounds');
assert.ok(mature?.goal.en.includes('without requiring constant wholesale program replacement'), 'Mature program must be defined by flexible stability');

assert.equal(NH_ICEBERG_CURRICULUM.length, 5, 'Iceberg curriculum must include sky, tip, surface, depths and abyss');
assert.deepEqual(NH_ICEBERG_CURRICULUM.map(item => item.id), ['sky','tip','surface','depths','abyss']);
assert.ok(NH_ICEBERG_CURRICULUM.find(item => item.id === 'surface')?.concepts.some(item => item.en.includes('Evolving rep ranges')));
assert.ok(NH_ICEBERG_CURRICULUM.find(item => item.id === 'depths')?.concepts.some(item => item.en.includes('Programming')));
assert.ok(NH_ICEBERG_CURRICULUM.find(item => item.id === 'abyss')?.note.en.includes('not a scientific hierarchy'));

assert.equal(NH_MASSTERPLAN_GUIDES.length, 3, 'Back, shoulders and forearms MASSterplans must be represented');
assert.ok(NH_MASSTERPLAN_GUIDES.some(item => item.id === 'back' && item.stages.length === 4));
assert.ok(NH_MASSTERPLAN_GUIDES.some(item => item.id === 'shoulders' && item.stages.length >= 2));
assert.ok(NH_MASSTERPLAN_GUIDES.some(item => item.id === 'forearms' && item.stages.length >= 3));

const requiredRoles = ['horizontal_press','vertical_press','vertical_pull','horizontal_pull','hinge','knee_flexion','biceps','triceps','lateral_delt'];
requiredRoles.forEach(role => assert.ok(NH_ROLE_LIBRARY.some(item => item.id === role), `Missing role ${role}`));
assert.equal(getNhMovementRole('pullup'), 'vertical_pull');
assert.equal(getNhMovementRole('row_cable'), 'horizontal_pull');
assert.equal(getNhMovementRole('rdl'), 'hinge');

const evolvingBuild = evaluateNhEvolvingRepCue([9,8,7,6], 6, 10);
assert.equal(evolvingBuild.status, 'build');
assert.equal(evolvingBuild.ready, false);
const evolvingTransition = evaluateNhEvolvingRepCue([10,9,8,7], 6, 10);
assert.equal(evolvingTransition.status, 'transition_candidate', '10/9/8/7 should be treated as a candidate, not forced to 10/10/10/10');
assert.equal(evolvingTransition.ready, true);
const evolvingLate = evaluateNhEvolvingRepCue([10,10,9,9], 6, 10);
assert.equal(evolvingLate.status, 'late_transition', 'Repeated ceiling sets should teach that the jump may already be late');
const evolvingBelow = evaluateNhEvolvingRepCue([6,5,4,4], 6, 10);
assert.equal(evolvingBelow.status, 'below_range', 'A failed post-jump range must trigger review');

const hardWork = evaluateNhPlateauTrend([
  { maxWeight: 100, totalReps: 24 },
  { maxWeight: 100, totalReps: 24 },
  { maxWeight: 100, totalReps: 23 },
]);
assert.equal(hardWork.status, 'hard_work', 'Three flat-ish exposures should not automatically be called a plateau');
const plateau = evaluateNhPlateauTrend([
  { maxWeight: 100, totalReps: 24 },
  { maxWeight: 100, totalReps: 24 },
  { maxWeight: 100, totalReps: 23 },
  { maxWeight: 100, totalReps: 24 },
]);
assert.equal(plateau.status, 'plateau_candidate', 'A fourth comparable exposure can become a plateau candidate');

for (const days of [3,4,5] as const) {
  const draft = buildNhTeachingDraft({ days, priorities: ['BACK','BICEPS'] });
  assert.equal(draft.length, days, `${days}-day draft must contain ${days} days`);
  assert.ok(draft.every(day => day.slots.length > 0), `${days}-day draft cannot contain empty days`);
  const audit = auditNhProgram(draft);
  assert.ok(audit.rolesPresent.includes('vertical_pull'), `${days}-day illustrative draft must teach vertical pulling`);
  assert.ok(audit.rolesPresent.includes('horizontal_pull'), `${days}-day illustrative draft must teach horizontal pulling`);
  assert.ok(audit.rolesPresent.includes('hinge'), `${days}-day illustrative draft must teach a hinge`);
  assert.ok(audit.score >= 0 && audit.score <= 100, 'Audit score must be bounded');
}

const experiencedPool = ['bp_bar','row_cable','pullup','rdl','sq_bar','leg_ext','curl_ez','tri_push','lat_raise','calf_raise','abs_cable'];
const experiencedDraft = buildNhTeachingDraft({ days: 4, priorities: ['BACK'], experiencedExerciseIds: experiencedPool });
experiencedDraft.flatMap(day => day.slots).forEach(slot => {
  if (slot.exerciseId) assert.ok(experiencedPool.includes(String(slot.exerciseId)), `Unexpected unpracticed exercise ${slot.exerciseId}`);
});
const emptyPoolDraft = buildNhTeachingDraft({ days: 3, priorities: [], experiencedExerciseIds: ['__none__'] });
assert.ok(emptyPoolDraft.flatMap(day => day.slots).some(slot => !slot.exerciseId), 'A supplied pool with no matching lifts must create placeholders instead of inventing experience');

const incompleteBack = [{
  id: 'one',
  dayName: { en: 'Day 1', es: 'Día 1' },
  slots: [{ muscle: 'BACK' as const, setTarget: 3, reps: '8-12', exerciseId: 'row_cable' }],
}];
const incompleteAudit = auditNhProgram(incompleteBack);
assert.ok(incompleteAudit.findings.some(item => item.id === 'back-missing-hinge' && item.kind === 'nh_principle'));
assert.ok(incompleteAudit.findings.some(item => item.id === 'back-missing-vertical_pull' && item.kind === 'nh_principle'));

const overloadedBackDay = [{
  id: 'back-day',
  dayName: { en: 'Back', es: 'Espalda' },
  slots: [
    { muscle: 'HAMSTRINGS' as const, setTarget: 2, reps: '6-10', exerciseId: 'rdl' },
    { muscle: 'BACK' as const, setTarget: 3, reps: '6-10', exerciseId: 'pullup' },
    { muscle: 'BACK' as const, setTarget: 3, reps: '8-12', exerciseId: 'row_cable' },
    { muscle: 'BACK' as const, setTarget: 3, reps: '8-12', exerciseId: 'row_db' },
  ],
}];
assert.ok(auditNhProgram(overloadedBackDay).findings.some(item => item.id === 'back-daily-density-0' && item.kind === 'nh_principle'));

const adjacentHinges = [
  { id: 'd1', dayName: { en: 'Day 1', es: 'Día 1' }, slots: [{ muscle: 'HAMSTRINGS' as const, setTarget: 2, reps: '6-10', exerciseId: 'rdl' }] },
  { id: 'd2', dayName: { en: 'Day 2', es: 'Día 2' }, slots: [{ muscle: 'BACK' as const, setTarget: 2, reps: '3-5', exerciseId: 'deadlift' }] },
];
const hingeAudit = auditNhProgram(adjacentHinges);
assert.ok(hingeAudit.findings.some(item => item.id === 'adjacent-hinges-0' && item.kind === 'inference'));

const template = makeNhSchoolTemplate(buildNhTeachingDraft({ days: 4, priorities: ['SHOULDERS'] }), 'Test NH Lab');
assert.equal(template.scope, 'personal');
assert.ok(template.description.en.includes('not an official NH program'), 'Generated drafts must disclose non-official status');

console.log('validate-nh-school: OK');