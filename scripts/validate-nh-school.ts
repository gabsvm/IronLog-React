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
import { evaluateNhEvolvingRepCue } from '../programs/naturalHypertrophy/nhVerifiedKnowledge.ts';

assert.ok(NH_PROGRAMMING_TEACHING_POINTS.length >= 18, 'Programming School needs the expanded transcript-grounded lesson set');
assert.ok(NH_PROGRAMMING_TEACHING_POINTS.some(item => item.kind === 'nh_principle'), 'Must distinguish verified NH principles');
assert.ok(NH_PROGRAMMING_TEACHING_POINTS.some(item => item.kind === 'inference'), 'Must distinguish inference');
assert.ok(NH_PROGRAMMING_TEACHING_POINTS.some(item => item.kind === 'gainslab_rule'), 'Must distinguish GainsLab operational rules');

const operational = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'three-exposure-flag');
assert.equal(operational?.kind, 'gainslab_rule', 'Three-exposure flag must never be attributed to NH');
const eightyFive = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === '85-rule');
assert.equal(eightyFive?.kind, 'nh_principle', '85% rule must remain an NH principle');
const ceiling = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'evolving-ceiling-not-target');
assert.equal(ceiling?.kind, 'nh_principle', 'Evolving ceiling rule is directly supported by the NH transcript');
const programFirst = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'program-before-running');
assert.equal(programFirst?.kind, 'nh_principle', 'Rare/small in-run changes are directly supported by the NH programming transcript');
const compoundBalance = NH_PROGRAMMING_TEACHING_POINTS.find(item => item.id === 'compound-and-precision-balance');
assert.equal(compoundBalance?.kind, 'nh_principle', 'Compound + precision balance must remain sourced to NH');

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

for (const days of [3,4,5] as const) {
  const draft = buildNhTeachingDraft({ days, priorities: ['BACK','BICEPS'] });
  assert.equal(draft.length, days, `${days}-day draft must contain ${days} days`);
  assert.ok(draft.every(day => day.slots.length > 0), `${days}-day draft cannot contain empty days`);
  const audit = auditNhProgram(draft);
  assert.ok(audit.rolesPresent.includes('vertical_pull'), `${days}-day draft must teach vertical pulling`);
  assert.ok(audit.rolesPresent.includes('horizontal_pull'), `${days}-day draft must teach horizontal pulling`);
  assert.ok(audit.rolesPresent.includes('hinge'), `${days}-day draft must teach a hinge`);
  assert.ok(audit.score >= 0 && audit.score <= 100, 'Audit score must be bounded');
}

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
