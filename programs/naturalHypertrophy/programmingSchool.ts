import type { GlobalTemplate, MuscleGroup, ProgramDay, ProgramSlot } from '../../types';
import {
  NH_MASSTERPLAN_GUIDES,
  NH_SELF_PROGRAMMING_PATH,
  NH_TRANSCRIPT_LESSONS,
  type NhSourceEvidenceKind,
  type NhSourceLevel,
} from './nhVerifiedKnowledge.ts';

export type NhEvidenceKind = NhSourceEvidenceKind;
export type NhProgrammingLevel = NhSourceLevel;
export type NhMovementRole =
  | 'horizontal_press'
  | 'vertical_press'
  | 'vertical_pull'
  | 'horizontal_pull'
  | 'hinge'
  | 'knee_flexion'
  | 'knee_extension'
  | 'biceps'
  | 'triceps'
  | 'lateral_delt'
  | 'calves'
  | 'abs'
  | 'neck';

export interface NhTeachingPoint {
  id: string;
  level: NhProgrammingLevel;
  kind: NhEvidenceKind;
  title: { en: string; es: string };
  summary: { en: string; es: string };
  sourceScope?: string;
}

export interface NhRoleDefinition {
  id: NhMovementRole;
  muscle: MuscleGroup;
  title: { en: string; es: string };
  purpose: { en: string; es: string };
  defaultRepRange: string;
  candidateExerciseIds: string[];
  systemicCost: 'low' | 'medium' | 'high';
}

export interface NhAuditFinding {
  id: string;
  severity: 'info' | 'watch' | 'change';
  kind: NhEvidenceKind;
  title: { en: string; es: string };
  detail: { en: string; es: string };
  dayIndex?: number;
  muscle?: MuscleGroup;
}

export interface NhProgramAudit {
  score: number;
  directSets: Partial<Record<MuscleGroup, number>>;
  rolesPresent: NhMovementRole[];
  findings: NhAuditFinding[];
}

export interface NhDraftOptions {
  days: 3 | 4 | 5;
  priorities: MuscleGroup[];
  name?: string;
  experiencedExerciseIds?: string[];
}

const BASE_TEACHING_POINTS: NhTeachingPoint[] = [
  {
    id: 'minimum-before-more',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Start with enough, not everything', es: 'Empieza con suficiente, no con todo' },
    summary: {
      en: 'NH repeatedly builds MASSterplans by starting with a small number of movement categories and adding work only as the trainee outgrows the previous step.',
      es: 'NH construye repetidamente sus MASSterplans empezando con pocas categorías de movimiento y añadiendo trabajo sólo cuando el atleta supera la etapa anterior.',
    },
    sourceScope: 'Compendium MASSterplans; Big Back / Shoulders / Forearms transcripts.',
  },
  {
    id: 'functions-before-exercises',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Program functions before favorite exercises', es: 'Programa funciones antes que ejercicios favoritos' },
    summary: {
      en: 'The Big Back MASSterplan begins with movement families — hinge, vertical pull and horizontal pull — while the exact exercise remains individualized.',
      es: 'El MASSterplan de espalda empieza por familias — hinge, tirón vertical y tirón horizontal — mientras el ejercicio exacto se individualiza.',
    },
    sourceScope: 'Big Back MASSterplan Step 1.',
  },
  {
    id: 'exercise-fit',
    level: 'modify',
    kind: 'nh_principle',
    title: { en: 'The exercise has to fit you', es: 'El ejercicio tiene que servirte a vos' },
    summary: {
      en: 'NH repeatedly tells trainees to choose movements they enjoy, can perform comfortably and can keep long enough to build real progression instead of chasing a supposedly optimal exercise.',
      es: 'NH repite que el atleta debe elegir movimientos que disfrute, pueda ejecutar cómodamente y mantener el tiempo suficiente para construir progresión real, en vez de perseguir un ejercicio supuestamente óptimo.',
    },
    sourceScope: 'Big Back, Big Shoulders, Forearms and self-programming transcripts.',
  },
  {
    id: 'volume-earned',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Do not add volume to a dose that works', es: 'No añadas volumen a una dosis que funciona' },
    summary: {
      en: 'Across MASSterplans and the 85% framework NH repeatedly says to milk a dose while progression continues, then add work only when the current structure is no longer enough and recovery can support it.',
      es: 'En sus MASSterplans y en el marco del 85%, NH repite que hay que exprimir una dosis mientras exista progresión y añadir trabajo sólo cuando la estructura actual deje de alcanzar y la recuperación pueda soportarlo.',
    },
    sourceScope: 'Big Back / Arms / Shoulders / Forearms MASSterplans; 85% Rule.',
  },
  {
    id: 'recovery-calendar',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Frequency is a recovery calendar', es: 'La frecuencia es un calendario de recuperación' },
    summary: {
      en: 'NH treats frequency as a recovery schedule: demanding work must fit the time available before the next relevant exposure. More frequency is not automatically better and more rest is not automatically better.',
      es: 'NH trata la frecuencia como un calendario de recuperación: el trabajo demandante debe encajar con el tiempo disponible antes de la próxima exposición relevante. Más frecuencia no es automáticamente mejor y más descanso tampoco.',
    },
    sourceScope: '85% Rule; Big Back and Big Shoulders scheduling examples.',
  },
  {
    id: '85-rule',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'The 85% Rule is balance, not a literal load', es: 'La Regla del 85% es equilibrio, no una carga literal' },
    summary: {
      en: 'NH explicitly says 85 is not 85% of 1RM and not a command to train at one fixed intensity. It is his framework for keeping volume, intensity, frequency and recovery close to a productive middle while cutting superfluous work.',
      es: 'NH dice explícitamente que 85 no es 85% del 1RM ni una orden de entrenar siempre a una intensidad fija. Es su marco para mantener volumen, intensidad, frecuencia y recuperación cerca de un punto medio productivo eliminando trabajo superfluo.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule).',
  },
  {
    id: 'hypothesis-logbook',
    level: 'self_coach',
    kind: 'inference',
    title: { en: 'Your routine is a hypothesis', es: 'Tu rutina es una hipótesis' },
    summary: {
      en: 'Taken together, NH principles imply keeping a program stable long enough to test it, then changing small variables in response to progression, recovery and weak points.',
      es: 'Tomados en conjunto, los principios de NH implican mantener el programa estable el tiempo suficiente para probarlo y luego cambiar variables pequeñas según progresión, recuperación y puntos débiles.',
    },
  },
];

export const NH_PROGRAMMING_TEACHING_POINTS: NhTeachingPoint[] = [
  ...BASE_TEACHING_POINTS,
  ...NH_TRANSCRIPT_LESSONS.map(item => ({ ...item })),
];

export { NH_MASSTERPLAN_GUIDES, NH_SELF_PROGRAMMING_PATH };

export const NH_ROLE_LIBRARY: NhRoleDefinition[] = [
  { id: 'horizontal_press', muscle: 'CHEST', title: { en: 'Horizontal press', es: 'Press horizontal' }, purpose: { en: 'Chest/triceps pressing base.', es: 'Base de empuje para pecho/tríceps.' }, defaultRepRange: '6-10', candidateExerciseIds: ['bp_bar','bp_inc','bp_inc_bar','bp_inc_wide','bp_flat','bp_mach_inc','close_grip_bench','guts_db_bench','dips'], systemicCost: 'medium' },
  { id: 'vertical_press', muscle: 'SHOULDERS', title: { en: 'Vertical press', es: 'Press vertical' }, purpose: { en: 'Primary direct shoulder compound.', es: 'Compuesto directo principal de hombro.' }, defaultRepRange: '6-10', candidateExerciseIds: ['ohp','ohp_db','neutral_db_press','behind_neck_press'], systemicCost: 'medium' },
  { id: 'vertical_pull', muscle: 'BACK', title: { en: 'Vertical pull', es: 'Tirón vertical' }, purpose: { en: 'Lat/upper-back pulling family.', es: 'Familia de tirón para dorsal/espalda alta.' }, defaultRepRange: '6-12', candidateExerciseIds: ['pullup','chinup','lat_pull','lat_pull_supine','one_arm_lat_pulldown','close_grip_lat_pulldown','behind_neck_pulldown'], systemicCost: 'medium' },
  { id: 'horizontal_pull', muscle: 'BACK', title: { en: 'Horizontal pull', es: 'Tirón horizontal' }, purpose: { en: 'Upper-back thickness; support can reduce hinge overlap.', es: 'Espesor de espalda alta; el apoyo puede reducir solapamiento con hinges.' }, defaultRepRange: '8-12', candidateExerciseIds: ['row_mach','row_cable','row_db','tbar_row_chest_supported','wide_grip_cable_row'], systemicCost: 'low' },
  { id: 'hinge', muscle: 'HAMSTRINGS', title: { en: 'Hip hinge', es: 'Bisagra de cadera' }, purpose: { en: 'Posterior chain and global back contribution.', es: 'Cadena posterior y contribución global a espalda.' }, defaultRepRange: '6-10', candidateExerciseIds: ['rdl','deadlift','sldl','good_morning','good_morning_pause','back_extension','rack_pull','deadlift_13in','bent_barbell_row','pendlay_row'], systemicCost: 'high' },
  { id: 'knee_flexion', muscle: 'QUADS', title: { en: 'Squat / knee-flexion pattern', es: 'Sentadilla / patrón dominante de rodilla' }, purpose: { en: 'Primary quad compound.', es: 'Compuesto principal de cuádriceps.' }, defaultRepRange: '6-12', candidateExerciseIds: ['sq_bar','sq_paused','sq_hack','front_squat','high_bar_close_squat','low_bar_wide_squat','leg_press','single_leg_press','bulgarian_split_squat','lunges','lunge_reverse','guts_smith_squat'], systemicCost: 'high' },
  { id: 'knee_extension', muscle: 'QUADS', title: { en: 'Knee extension', es: 'Extensión de rodilla' }, purpose: { en: 'Low-systemic-cost direct quad work.', es: 'Trabajo directo de cuádriceps con bajo costo sistémico.' }, defaultRepRange: '10-15', candidateExerciseIds: ['leg_ext','single_leg_extension'], systemicCost: 'low' },
  { id: 'biceps', muscle: 'BICEPS', title: { en: 'Biceps isolation', es: 'Aislamiento de bíceps' }, purpose: { en: 'Direct elbow-flexor work.', es: 'Trabajo directo de flexores del codo.' }, defaultRepRange: '6-12', candidateExerciseIds: ['curl_ez','curl_bar','curl_db','curl_hammer','curl_cable','curl_preacher','incline_db_curl','close_grip_cable_curl','rope_cable_curl'], systemicCost: 'low' },
  { id: 'triceps', muscle: 'TRICEPS', title: { en: 'Triceps isolation / biased press', es: 'Aislamiento / press sesgado a tríceps' }, purpose: { en: 'Direct triceps work.', es: 'Trabajo directo de tríceps.' }, defaultRepRange: '8-15', candidateExerciseIds: ['tri_push','tri_ext','skull_crusher','db_tri_ext','db_overhead_tri','rope_pressdown','jm_press','dip_machine'], systemicCost: 'low' },
  { id: 'lateral_delt', muscle: 'SHOULDERS', title: { en: 'Shoulder elevation / isolation', es: 'Elevación / aislamiento de hombro' }, purpose: { en: 'Direct shoulder work with relatively low systemic cost.', es: 'Trabajo directo de hombro con costo sistémico relativamente bajo.' }, defaultRepRange: '10-15', candidateExerciseIds: ['lat_raise','lat_raise_cable','lat_raise_mach','lat_raise_seat','rear_delt_fly','face_pull','upright_row'], systemicCost: 'low' },
  { id: 'calves', muscle: 'CALVES', title: { en: 'Calves', es: 'Gemelos' }, purpose: { en: 'Direct calf work.', es: 'Trabajo directo de gemelos.' }, defaultRepRange: '10-20', candidateExerciseIds: ['calf_raise','guts_seated_calf'], systemicCost: 'low' },
  { id: 'abs', muscle: 'ABS', title: { en: 'Trunk', es: 'Abdomen / tronco' }, purpose: { en: 'Direct trunk work.', es: 'Trabajo directo de tronco.' }, defaultRepRange: '8-15', candidateExerciseIds: ['abs_cable','leg_raise','knee_raise','guts_landmine_twist'], systemicCost: 'low' },
  { id: 'neck', muscle: 'NECK', title: { en: 'Neck', es: 'Cuello' }, purpose: { en: 'Direct neck development.', es: 'Desarrollo directo del cuello.' }, defaultRepRange: '10-20', candidateExerciseIds: ['neck_curl','neck_ext'], systemicCost: 'low' },
];

const roleByExercise = new Map<string, NhMovementRole>();
NH_ROLE_LIBRARY.forEach(role => role.candidateExerciseIds.forEach(id => roleByExercise.set(id, role.id)));

export function getNhMovementRole(exerciseId?: string | null): NhMovementRole | null {
  if (!exerciseId) return null;
  return roleByExercise.get(exerciseId) || null;
}

const roleDefinition = (roleId: NhMovementRole) => NH_ROLE_LIBRARY.find(item => item.id === roleId)!;

const countDirectSets = (program: ProgramDay[]): Partial<Record<MuscleGroup, number>> => {
  const totals: Partial<Record<MuscleGroup, number>> = {};
  program.forEach(day => (day.slots || []).forEach(slot => {
    totals[slot.muscle] = (totals[slot.muscle] || 0) + Math.max(0, Number(slot.setTarget) || 0);
  }));
  return totals;
};

const addFinding = (findings: NhAuditFinding[], finding: NhAuditFinding) => {
  if (!findings.some(item => item.id === finding.id)) findings.push(finding);
};

export function auditNhProgram(program: ProgramDay[]): NhProgramAudit {
  const safeProgram = Array.isArray(program) ? program : [];
  const directSets = countDirectSets(safeProgram);
  const roles = new Set<NhMovementRole>();
  const findings: NhAuditFinding[] = [];
  let knownSlots = 0;
  let mediumOrHighCostSlots = 0;

  safeProgram.forEach((day, dayIndex) => {
    const roleCounts = new Map<NhMovementRole, number>();
    const supersetMuscles = new Map<string, MuscleGroup[]>();
    let backExerciseCount = 0;

    (day.slots || []).forEach(slot => {
      const movementRole = getNhMovementRole(slot.exerciseId);
      if (movementRole) {
        roles.add(movementRole);
        roleCounts.set(movementRole, (roleCounts.get(movementRole) || 0) + 1);
        knownSlots += 1;
        if (roleDefinition(movementRole).systemicCost !== 'low') mediumOrHighCostSlots += 1;
        if (movementRole === 'hinge' || movementRole === 'vertical_pull' || movementRole === 'horizontal_pull') backExerciseCount += 1;
      }
      if (slot.supersetId) {
        const list = supersetMuscles.get(slot.supersetId) || [];
        list.push(slot.muscle);
        supersetMuscles.set(slot.supersetId, list);
      }
    });

    roleCounts.forEach((count, movementRole) => {
      if (count <= 2) return;
      const isBackFamily = movementRole === 'hinge' || movementRole === 'vertical_pull' || movementRole === 'horizontal_pull';
      addFinding(findings, {
        id: `redundancy-${dayIndex}-${movementRole}`,
        severity: 'watch',
        kind: isBackFamily ? 'nh_principle' : 'gainslab_rule',
        dayIndex,
        title: { en: 'Possible same-day redundancy', es: 'Posible redundancia en el mismo día' },
        detail: isBackFamily
          ? {
              en: `This day contains ${count} exercises from the same back family. NH's Big Back progression explicitly avoids stacking three same-family back movements together.`,
              es: `Este día contiene ${count} ejercicios de la misma familia de espalda. La progresión Big Back de NH evita explícitamente apilar tres movimientos de la misma familia.`,
            }
          : {
              en: `This day contains ${count} slots from the ${movementRole} family. GainsLab flags this for review; NH does not prescribe a universal “two per day” ceiling.`,
              es: `Este día contiene ${count} slots de la familia ${movementRole}. GainsLab lo marca para revisión; NH no prescribe un límite universal de “dos por día”.`,
            },
      });
    });

    if (backExerciseCount > 3) {
      addFinding(findings, {
        id: `back-daily-density-${dayIndex}`,
        severity: 'change',
        kind: 'nh_principle',
        dayIndex,
        muscle: 'BACK',
        title: { en: 'Too much back work concentrated in one day', es: 'Demasiada espalda concentrada en un día' },
        detail: {
          en: `This day contains ${backExerciseCount} back-family movements. In Big Back Step 4, NH gives three back exercises in one day as the upper scheduling limit and argues that later exercises lose quality when everything is crammed together.`,
          es: `Este día contiene ${backExerciseCount} movimientos de familias de espalda. En Big Back Step 4, NH usa tres ejercicios de espalda en un día como límite superior de distribución y argumenta que la calidad cae cuando se concentra todo.`,
        },
      });
    }

    supersetMuscles.forEach((muscles, id) => {
      const duplicates = muscles.filter((muscle, index) => muscles.indexOf(muscle) !== index);
      if (duplicates.length === 0) return;
      addFinding(findings, {
        id: `superset-competition-${dayIndex}-${id}`,
        severity: 'info',
        kind: 'gainslab_rule',
        dayIndex,
        title: { en: 'Competing superset', es: 'Superserie competitiva' },
        detail: {
          en: 'Two exercises in this superset target the same primary muscle. This can be intentional, but expect more local fatigue and a larger performance drop.',
          es: 'Dos ejercicios de esta superserie tienen el mismo músculo primario. Puede ser intencional, pero esperá más fatiga local y mayor caída de rendimiento.',
        },
      });
    });
  });

  const hasBackWork = safeProgram.some(day => (day.slots || []).some(slot => slot.muscle === 'BACK' || getNhMovementRole(slot.exerciseId) === 'hinge'));
  if (hasBackWork) {
    (['hinge','vertical_pull','horizontal_pull'] as NhMovementRole[]).forEach(movementRole => {
      if (roles.has(movementRole)) return;
      addFinding(findings, {
        id: `back-missing-${movementRole}`,
        severity: 'watch',
        kind: 'nh_principle',
        muscle: 'BACK',
        title: { en: 'Back family missing', es: 'Falta una familia de espalda' },
        detail: {
          en: `NH's Big Back Step 1 starts with one hinge, one vertical pull and one horizontal pull. This routine has no ${movementRole.replace('_',' ')} role.`,
          es: `El Step 1 de Big Back de NH empieza con un hinge, un tirón vertical y uno horizontal. Esta rutina no tiene el rol ${movementRole.replace('_',' ')}.`,
        },
      });
    });
  }

  for (let dayIndex = 0; dayIndex < safeProgram.length - 1; dayIndex++) {
    const aHasHinge = (safeProgram[dayIndex].slots || []).some(slot => getNhMovementRole(slot.exerciseId) === 'hinge');
    const bHasHinge = (safeProgram[dayIndex + 1].slots || []).some(slot => getNhMovementRole(slot.exerciseId) === 'hinge');
    if (aHasHinge && bHasHinge) {
      addFinding(findings, {
        id: `adjacent-hinges-${dayIndex}`,
        severity: 'change',
        kind: 'inference',
        dayIndex,
        title: { en: 'Hinges on adjacent training days', es: 'Hinges en días de entrenamiento consecutivos' },
        detail: {
          en: 'NH repeatedly separates similar high-fatigue families to protect recovery. Because GainsLab does not know the actual rest days between these template positions, this remains an inference rather than a hard rule.',
          es: 'NH separa repetidamente familias similares de alta fatiga para proteger recuperación. Como GainsLab no conoce los descansos reales entre estas posiciones de la plantilla, esto sigue siendo una inferencia y no una regla rígida.',
        },
      });
    }
  }

  if (knownSlots >= 6 && mediumOrHighCostSlots === 0) {
    addFinding(findings, {
      id: 'precision-only-bias',
      severity: 'watch',
      kind: 'nh_principle',
      title: { en: 'Precision-only exercise bias', es: 'Sesgo hacia ejercicios sólo de precisión' },
      detail: {
        en: 'NH argues against optimizing stimulus-to-fatigue so aggressively that demanding mass-building movements disappear. Low-cost precise work is useful, but he presents it as complementary to larger movements rather than a total replacement.',
        es: 'NH critica optimizar estímulo/fatiga hasta hacer desaparecer los movimientos demandantes que construyen masa global. El trabajo preciso y barato es útil, pero lo presenta como complemento y no reemplazo total.',
      },
    });
  }

  (['BICEPS','TRICEPS'] as MuscleGroup[]).forEach(muscle => {
    const sets = directSets[muscle] || 0;
    if (sets <= 15) return;
    addFinding(findings, {
      id: `arm-volume-${muscle}`,
      severity: 'watch',
      kind: 'nh_principle',
      muscle,
      title: { en: 'Arm volume above the MASSterplan advanced range', es: 'Volumen de brazos sobre el rango avanzado del MASSterplan' },
      detail: {
        en: `${sets} direct weekly sets are above the 6–15 set range used in NH's advanced arm MASSterplan. This is a scoped comparison, not a universal hard cap.`,
        es: `${sets} series directas semanales superan el rango 6–15 usado en el MASSterplan avanzado de brazos de NH. Es una comparación específica, no un límite universal.`,
      },
    });
  });

  const shoulderSets = directSets.SHOULDERS || 0;
  if (shoulderSets > 20) {
    addFinding(findings, {
      id: 'shoulder-specialization-volume',
      severity: 'watch',
      kind: 'nh_principle',
      muscle: 'SHOULDERS',
      title: { en: 'Shoulder work exceeds the MASSterplan working range', es: 'El trabajo de hombro supera el rango del MASSterplan' },
      detail: {
        en: `${shoulderSets} direct sets exceed the flexible 12–20 total-set range discussed in NH's shoulder specialization framework. This is not a universal cap; it is a prompt to verify that the extra work is still progressive and recoverable.`,
        es: `${shoulderSets} series directas superan el rango flexible de 12–20 comentado por NH en su especialización de hombros. No es un límite universal; es una invitación a verificar que el trabajo extra siga siendo progresable y recuperable.`,
      },
    });
  }

  if (safeProgram.length === 0) {
    addFinding(findings, {
      id: 'empty', severity: 'change', kind: 'gainslab_rule',
      title: { en: 'No training days', es: 'No hay días de entrenamiento' },
      detail: { en: 'Add at least one training day before auditing the routine.', es: 'Agregá al menos un día antes de auditar la rutina.' },
    });
  }

  const penalty = findings.reduce((sum, finding) => sum + (finding.severity === 'change' ? 18 : finding.severity === 'watch' ? 8 : 2), 0);
  return {
    score: Math.max(0, Math.min(100, 100 - penalty)),
    directSets,
    rolesPresent: Array.from(roles),
    findings,
  };
}

const pickExerciseForRole = (definition: NhRoleDefinition, experiencedExerciseIds?: string[]) => {
  if (!experiencedExerciseIds || experiencedExerciseIds.length === 0) return definition.candidateExerciseIds[0] || null;
  const experienced = new Set(experiencedExerciseIds.map(String));
  return definition.candidateExerciseIds.find(id => experienced.has(String(id))) || null;
};

const slotFromRole = (id: NhMovementRole, setTarget = 3, supersetId?: string, experiencedExerciseIds?: string[]): ProgramSlot => {
  const definition = roleDefinition(id);
  const exerciseId = pickExerciseForRole(definition, experiencedExerciseIds);
  return {
    muscle: definition.muscle,
    setTarget,
    reps: definition.defaultRepRange,
    exerciseId,
    label: definition.title.en,
    notes: exerciseId
      ? `NH School role: ${id}. Exercise selected from the supplied experienced-lift pool when available; preserve the function unless you intentionally redesign the routine.`
      : `NH School role: ${id}. No experienced exercise from this family was supplied; choose a movement you have actually practiced and tolerated before treating this as your program.`,
    ...(supersetId ? { supersetId } : {}),
  };
};

const prioritySlots = (priorities: MuscleGroup[], dayTag: string, experiencedExerciseIds?: string[]): ProgramSlot[] => priorities.slice(0, 2).flatMap((muscle, index) => {
  const make = (id: NhMovementRole, setTarget: number) => slotFromRole(id, setTarget, `${dayTag}-priority-${index}`, experiencedExerciseIds);
  if (muscle === 'BICEPS') return [make('biceps', 2)];
  if (muscle === 'TRICEPS') return [make('triceps', 2)];
  if (muscle === 'SHOULDERS') return [make('lateral_delt', 2)];
  if (muscle === 'BACK') return [make('horizontal_pull', 2)];
  if (muscle === 'CHEST') return [make('horizontal_press', 2)];
  if (muscle === 'QUADS') return [make('knee_extension', 2)];
  if (muscle === 'HAMSTRINGS') return [make('hinge', 2)];
  if (muscle === 'CALVES') return [make('calves', 2)];
  if (muscle === 'ABS') return [make('abs', 2)];
  if (muscle === 'NECK') return [make('neck', 2)];
  return [];
});

/**
 * GainsLab teaching scaffold, never an official Natural Hypertrophy routine.
 * If experiencedExerciseIds are supplied, slots only select exercises from that pool;
 * otherwise the historical behavior remains as an illustrative scaffold.
 */
export function buildNhTeachingDraft(options: NhDraftOptions): ProgramDay[] {
  const p = options.priorities.slice(0, 2);
  const pool = options.experiencedExerciseIds;
  const s = (id: NhMovementRole, sets = 3, supersetId?: string) => slotFromRole(id, sets, supersetId, pool);
  const prioritiesFor = (tag: string) => prioritySlots(p, tag, pool);

  if (options.days === 3) {
    return [
      { id: 'nh_school_d1', dayName: { en: 'Day 1 · Push / Pull / Quads', es: 'Día 1 · Empuje / Tirón / Cuádriceps' }, slots: [s('horizontal_press', 3, 'd1-a'), s('horizontal_pull', 3, 'd1-a'), s('knee_flexion', 3, 'd1-b'), s('biceps', 2, 'd1-b'), ...prioritiesFor('d1')] },
      { id: 'nh_school_d2', dayName: { en: 'Day 2 · Vertical / Hinge', es: 'Día 2 · Vertical / Hinge' }, slots: [s('vertical_press', 3, 'd2-a'), s('vertical_pull', 3, 'd2-a'), s('hinge', 2, 'd2-b'), s('triceps', 2, 'd2-b'), s('abs', 2)] },
      { id: 'nh_school_d3', dayName: { en: 'Day 3 · Hypertrophy / Accessories', es: 'Día 3 · Hipertrofia / Accesorios' }, slots: [s('knee_extension', 3, 'd3-a'), s('horizontal_press', 3, 'd3-a'), s('vertical_pull', 3, 'd3-b'), s('lateral_delt', 3, 'd3-b'), s('calves', 2)] },
    ];
  }

  if (options.days === 4) {
    return [
      { id: 'nh_school_d1', dayName: { en: 'Upper A', es: 'Torso A' }, slots: [s('horizontal_press', 3, 'u1-a'), s('horizontal_pull', 3, 'u1-a'), s('vertical_press', 3, 'u1-b'), s('biceps', 2, 'u1-b'), ...prioritiesFor('u1')] },
      { id: 'nh_school_d2', dayName: { en: 'Lower A', es: 'Pierna A' }, slots: [s('knee_flexion', 3, 'l1-a'), s('calves', 3, 'l1-a'), s('hinge', 2, 'l1-b'), s('abs', 2, 'l1-b')] },
      { id: 'nh_school_d3', dayName: { en: 'Upper B', es: 'Torso B' }, slots: [s('vertical_pull', 3, 'u2-a'), s('horizontal_press', 3, 'u2-a'), s('horizontal_pull', 3, 'u2-b'), s('triceps', 2, 'u2-b'), s('lateral_delt', 2)] },
      { id: 'nh_school_d4', dayName: { en: 'Lower B', es: 'Pierna B' }, slots: [s('hinge', 2, 'l2-a'), s('knee_extension', 3, 'l2-a'), s('knee_flexion', 3, 'l2-b'), s('calves', 2, 'l2-b'), s('abs', 2)] },
    ];
  }

  return [
    { id: 'nh_school_d1', dayName: { en: 'Upper', es: 'Torso' }, slots: [s('horizontal_press', 3, 'd1-a'), s('horizontal_pull', 3, 'd1-a'), s('vertical_press', 3, 'd1-b'), s('biceps', 2, 'd1-b')] },
    { id: 'nh_school_d2', dayName: { en: 'Lower', es: 'Pierna' }, slots: [s('knee_flexion', 3, 'd2-a'), s('calves', 3, 'd2-a'), s('hinge', 2, 'd2-b'), s('abs', 2, 'd2-b')] },
    { id: 'nh_school_d3', dayName: { en: 'Arms / Delts', es: 'Brazos / Hombros' }, slots: [s('biceps', 3, 'd3-a'), s('triceps', 3, 'd3-a'), s('lateral_delt', 3, 'd3-b'), s('abs', 2, 'd3-b'), ...prioritiesFor('d3')] },
    { id: 'nh_school_d4', dayName: { en: 'Upper 2', es: 'Torso 2' }, slots: [s('vertical_pull', 3, 'd4-a'), s('horizontal_press', 3, 'd4-a'), s('horizontal_pull', 3, 'd4-b'), s('triceps', 2, 'd4-b')] },
    { id: 'nh_school_d5', dayName: { en: 'Lower 2', es: 'Pierna 2' }, slots: [s('hinge', 2, 'd5-a'), s('knee_extension', 3, 'd5-a'), s('knee_flexion', 3, 'd5-b'), s('calves', 2, 'd5-b')] },
  ];
}

export function makeNhSchoolTemplate(program: ProgramDay[], name: string): GlobalTemplate {
  const now = Date.now();
  return {
    id: `personal_nh_school_${now}`,
    name,
    title: { en: name, es: name },
    description: {
      en: 'Personal routine created in Natural Hypertrophy Programming School. GainsLab scaffold; not an official NH program.',
      es: 'Rutina personal creada en Natural Hypertrophy Programming School. Borrador de GainsLab; no es un programa oficial de NH.',
    },
    isPro: false,
    order: now,
    scope: 'personal',
    program,
  };
}
