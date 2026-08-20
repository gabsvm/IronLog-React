import type { GlobalTemplate, MuscleGroup, ProgramDay, ProgramSlot } from '../../types';

export type NhEvidenceKind = 'nh_principle' | 'inference' | 'gainslab_rule';
export type NhProgrammingLevel = 'understand' | 'modify' | 'build' | 'self_coach';
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
}

export const NH_PROGRAMMING_TEACHING_POINTS: NhTeachingPoint[] = [
  {
    id: 'minimum-before-more',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Start with enough, not everything', es: 'Empieza con suficiente, no con todo' },
    summary: {
      en: 'NH repeatedly builds MASSterplans by starting with a small number of movement categories and adding work only as the trainee outgrows the previous step.',
      es: 'NH construye repetidamente sus MASSterplans empezando con pocas categorías de movimiento y añadiendo trabajo sólo cuando el atleta supera la etapa anterior.',
    },
    sourceScope: 'Compendium MASSterplans; Big Back and Big Arms progression.',
  },
  {
    id: 'functions-before-exercises',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Program functions before favorite exercises', es: 'Programa funciones antes que ejercicios favoritos' },
    summary: {
      en: 'The Big Back MASSterplan starts with categories such as hinge, vertical pull and horizontal pull, while the exact exercise is left to the trainee.',
      es: 'El MASSterplan de espalda empieza por categorías como hinge, tirón vertical y tirón horizontal; el ejercicio exacto queda en manos del atleta.',
    },
    sourceScope: 'Big Back MASSterplan Step 1.',
  },
  {
    id: 'exercise-fit',
    level: 'modify',
    kind: 'nh_principle',
    title: { en: 'The exercise has to fit you', es: 'El ejercicio tiene que servirte a vos' },
    summary: {
      en: 'NH explicitly allows the trainee to choose movements they enjoy and can perform without discomfort instead of forcing one canonical lift.',
      es: 'NH permite explícitamente elegir movimientos que disfrutes y puedas ejecutar sin molestias, en vez de imponer un levantamiento canónico.',
    },
    sourceScope: 'Arm and Back MASSterplans.',
  },
  {
    id: 'evolving-reps',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Progress inside a range', es: 'Progresa dentro de un rango' },
    summary: {
      en: 'Evolving rep ranges let individual sets move inside a range. Progress is not restricted to identical reps on every set or adding load every session.',
      es: 'Los evolving rep ranges permiten que cada serie evolucione dentro de un rango. Progresar no exige repetir el mismo número en todas las series ni subir carga cada sesión.',
    },
    sourceScope: 'NH evolving rep-range method; Compendium instructions.',
  },
  {
    id: 'volume-earned',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Do not add volume to a dose that works', es: 'No añadas volumen a una dosis que funciona' },
    summary: {
      en: 'The arm MASSterplan tells the trainee to stay at the current step while load can keep progressing; extra exercises and sets arrive later.',
      es: 'El MASSterplan de brazos indica permanecer en la etapa actual mientras la carga siga progresando; más ejercicios y series aparecen después.',
    },
    sourceScope: 'Big Arms MASSterplan novice/intermediate stages.',
  },
  {
    id: 'recovery-calendar',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Frequency is a recovery calendar', es: 'La frecuencia es un calendario de recuperación' },
    summary: {
      en: 'NH places similar movements far enough apart to preserve performance and recovery, then allows denser scheduling as work capacity grows.',
      es: 'NH separa movimientos similares lo suficiente para preservar rendimiento y recuperación, y permite mayor densidad cuando aumenta la capacidad de trabajo.',
    },
    sourceScope: 'Big Back MASSterplan frequency examples.',
  },
  {
    id: '85-rule',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Seek stimulus, not fatigue', es: 'Busca estímulo, no fatiga' },
    summary: {
      en: 'The 85% rule is not 85% of 1RM. It is a programming philosophy: capture most of the productive stimulus without systematically extracting every unit of fatigue available.',
      es: 'La regla del 85% no es 85% del 1RM. Es una filosofía: capturar la mayor parte del estímulo productivo sin extraer sistemáticamente toda la fatiga posible.',
    },
    sourceScope: 'The 85% Rule.',
  },
  {
    id: 'hypothesis-logbook',
    level: 'self_coach',
    kind: 'inference',
    title: { en: 'Your routine is a hypothesis', es: 'Tu rutina es una hipótesis' },
    summary: {
      en: 'Taken together, NH principles imply that a program should be kept stable long enough to judge it, then changed in response to progression, recovery and weak points.',
      es: 'Tomados en conjunto, los principios de NH implican mantener una rutina estable el tiempo suficiente para evaluarla y cambiarla según progresión, recuperación y puntos débiles.',
    },
  },
  {
    id: 'three-exposure-flag',
    level: 'self_coach',
    kind: 'gainslab_rule',
    title: { en: 'Three-exposure diagnostic flag', es: 'Alerta diagnóstica de tres exposiciones' },
    summary: {
      en: 'GainsLab may flag three comparable exposures without progress for review. This is a product rule for teaching, not a number prescribed by NH.',
      es: 'GainsLab puede marcar tres exposiciones comparables sin progreso para revisión. Es una regla del producto para enseñar, no un número prescrito por NH.',
    },
  },
];

export const NH_ROLE_LIBRARY: NhRoleDefinition[] = [
  { id: 'horizontal_press', muscle: 'CHEST', title: { en: 'Horizontal press', es: 'Press horizontal' }, purpose: { en: 'Chest/triceps pressing base.', es: 'Base de empuje para pecho/tríceps.' }, defaultRepRange: '6-10', candidateExerciseIds: ['bp_bar','bp_inc','bp_inc_bar','bp_inc_wide','bp_flat','bp_mach_inc','close_grip_bench','guts_db_bench','dips'], systemicCost: 'medium' },
  { id: 'vertical_press', muscle: 'SHOULDERS', title: { en: 'Vertical press', es: 'Press vertical' }, purpose: { en: 'Shoulder pressing strength and size.', es: 'Fuerza y masa de empuje para hombros.' }, defaultRepRange: '6-10', candidateExerciseIds: ['ohp','ohp_db','neutral_db_press','behind_neck_press'], systemicCost: 'medium' },
  { id: 'vertical_pull', muscle: 'BACK', title: { en: 'Vertical pull', es: 'Tirón vertical' }, purpose: { en: 'Lat/upper-back width.', es: 'Dorsal y amplitud de espalda.' }, defaultRepRange: '6-12', candidateExerciseIds: ['pullup','chinup','lat_pull','lat_pull_supine','one_arm_lat_pulldown','close_grip_lat_pulldown','behind_neck_pulldown'], systemicCost: 'medium' },
  { id: 'horizontal_pull', muscle: 'BACK', title: { en: 'Horizontal pull', es: 'Tirón horizontal' }, purpose: { en: 'Upper-back thickness with less hinge overlap when supported.', es: 'Espesor de espalda alta con menor solapamiento de hinge si hay apoyo.' }, defaultRepRange: '8-12', candidateExerciseIds: ['row_mach','row_cable','row_db','tbar_row_chest_supported','wide_grip_cable_row'], systemicCost: 'low' },
  { id: 'hinge', muscle: 'HAMSTRINGS', title: { en: 'Hip hinge', es: 'Bisagra de cadera' }, purpose: { en: 'Posterior chain and hip extension.', es: 'Cadena posterior y extensión de cadera.' }, defaultRepRange: '6-10', candidateExerciseIds: ['rdl','deadlift','sldl','good_morning','good_morning_pause','back_extension','rack_pull','deadlift_13in','bent_barbell_row','pendlay_row'], systemicCost: 'high' },
  { id: 'knee_flexion', muscle: 'QUADS', title: { en: 'Squat / knee-flexion pattern', es: 'Sentadilla / patrón dominante de rodilla' }, purpose: { en: 'Primary quad compound.', es: 'Compuesto principal de cuádriceps.' }, defaultRepRange: '6-12', candidateExerciseIds: ['sq_bar','sq_paused','sq_hack','front_squat','high_bar_close_squat','low_bar_wide_squat','leg_press','single_leg_press','bulgarian_split_squat','lunges','lunge_reverse','guts_smith_squat'], systemicCost: 'high' },
  { id: 'knee_extension', muscle: 'QUADS', title: { en: 'Knee extension', es: 'Extensión de rodilla' }, purpose: { en: 'Low-systemic-cost direct quad work.', es: 'Trabajo directo de cuádriceps con bajo costo sistémico.' }, defaultRepRange: '10-15', candidateExerciseIds: ['leg_ext','single_leg_extension'], systemicCost: 'low' },
  { id: 'biceps', muscle: 'BICEPS', title: { en: 'Biceps isolation', es: 'Aislamiento de bíceps' }, purpose: { en: 'Direct elbow-flexor work.', es: 'Trabajo directo de flexores del codo.' }, defaultRepRange: '6-12', candidateExerciseIds: ['curl_ez','curl_bar','curl_db','curl_hammer','curl_cable','curl_preacher','incline_db_curl','close_grip_cable_curl','rope_cable_curl'], systemicCost: 'low' },
  { id: 'triceps', muscle: 'TRICEPS', title: { en: 'Triceps isolation / biased press', es: 'Aislamiento / press sesgado a tríceps' }, purpose: { en: 'Direct triceps work.', es: 'Trabajo directo de tríceps.' }, defaultRepRange: '8-15', candidateExerciseIds: ['tri_push','tri_ext','skull_crusher','db_tri_ext','db_overhead_tri','rope_pressdown','jm_press','dip_machine'], systemicCost: 'low' },
  { id: 'lateral_delt', muscle: 'SHOULDERS', title: { en: 'Lateral / rear delt', es: 'Deltoide lateral / posterior' }, purpose: { en: 'Shoulder width with low systemic cost.', es: 'Anchura de hombros con bajo costo sistémico.' }, defaultRepRange: '10-20', candidateExerciseIds: ['lat_raise','lat_raise_cable','lat_raise_mach','lat_raise_seat','rear_delt_fly','face_pull','upright_row'], systemicCost: 'low' },
  { id: 'calves', muscle: 'CALVES', title: { en: 'Calves', es: 'Gemelos' }, purpose: { en: 'Direct calf work.', es: 'Trabajo directo de gemelos.' }, defaultRepRange: '10-20', candidateExerciseIds: ['calf_raise','guts_seated_calf'], systemicCost: 'low' },
  { id: 'abs', muscle: 'ABS', title: { en: 'Trunk', es: 'Abdomen / tronco' }, purpose: { en: 'Trunk flexion or leg-raise pattern.', es: 'Flexión de tronco o elevación de piernas.' }, defaultRepRange: '8-15', candidateExerciseIds: ['abs_cable','leg_raise','knee_raise','guts_landmine_twist'], systemicCost: 'low' },
  { id: 'neck', muscle: 'NECK', title: { en: 'Neck', es: 'Cuello' }, purpose: { en: 'Direct neck development.', es: 'Desarrollo directo del cuello.' }, defaultRepRange: '10-20', candidateExerciseIds: ['neck_curl','neck_ext'], systemicCost: 'low' },
];

const roleByExercise = new Map<string, NhMovementRole>();
NH_ROLE_LIBRARY.forEach(role => role.candidateExerciseIds.forEach(id => roleByExercise.set(id, role.id)));

export function getNhMovementRole(exerciseId?: string | null): NhMovementRole | null {
  if (!exerciseId) return null;
  return roleByExercise.get(exerciseId) || null;
}

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

  safeProgram.forEach((day, dayIndex) => {
    const roleCounts = new Map<NhMovementRole, number>();
    const supersetMuscles = new Map<string, MuscleGroup[]>();
    (day.slots || []).forEach(slot => {
      const role = getNhMovementRole(slot.exerciseId);
      if (role) {
        roles.add(role);
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
      }
      if (slot.supersetId) {
        const list = supersetMuscles.get(slot.supersetId) || [];
        list.push(slot.muscle);
        supersetMuscles.set(slot.supersetId, list);
      }
    });

    roleCounts.forEach((count, role) => {
      if (count <= 2) return;
      addFinding(findings, {
        id: `redundancy-${dayIndex}-${role}`,
        severity: 'watch',
        kind: 'gainslab_rule',
        dayIndex,
        title: { en: 'Possible same-day redundancy', es: 'Posible redundancia en el mismo día' },
        detail: {
          en: `This day contains ${count} slots from the ${role} family. GainsLab flags this for review; NH does not prescribe a universal “two per day” ceiling.`,
          es: `Este día contiene ${count} slots de la familia ${role}. GainsLab lo marca para revisión; NH no prescribe un límite universal de “dos por día”.`,
        },
      });
    });

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
    (['hinge','vertical_pull','horizontal_pull'] as NhMovementRole[]).forEach(role => {
      if (roles.has(role)) return;
      addFinding(findings, {
        id: `back-missing-${role}`,
        severity: 'watch',
        kind: 'nh_principle',
        muscle: 'BACK',
        title: { en: 'Back family missing', es: 'Falta una familia de espalda' },
        detail: {
          en: `NH's Big Back Step 1 starts with one hinge, one vertical pull and one horizontal pull. This routine has no ${role.replace('_',' ')} role.`,
          es: `El Step 1 de Big Back de NH empieza con un hinge, un tirón vertical y uno horizontal. Esta rutina no tiene el rol ${role.replace('_',' ')}.`,
        },
      });
    });
  }

  for (let dayIndex = 0; dayIndex < safeProgram.length - 1; dayIndex++) {
    const aHasHighHinge = (safeProgram[dayIndex].slots || []).some(slot => getNhMovementRole(slot.exerciseId) === 'hinge');
    const bHasHighHinge = (safeProgram[dayIndex + 1].slots || []).some(slot => getNhMovementRole(slot.exerciseId) === 'hinge');
    if (aHasHighHinge && bHasHighHinge) {
      addFinding(findings, {
        id: `adjacent-hinges-${dayIndex}`,
        severity: 'change',
        kind: 'inference',
        dayIndex,
        title: { en: 'Hinges on adjacent training days', es: 'Hinges en días de entrenamiento consecutivos' },
        detail: {
          en: 'NH often separates similar high-fatigue movement families to protect recovery and performance. Consider moving one farther away or consolidating the stress.',
          es: 'NH suele separar familias similares de alta fatiga para proteger recuperación y rendimiento. Considerá alejar una o consolidar el estrés.',
        },
      });
    }
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

const role = (id: NhMovementRole) => NH_ROLE_LIBRARY.find(item => item.id === id)!;
const slotFromRole = (id: NhMovementRole, setTarget = 3, supersetId?: string): ProgramSlot => {
  const definition = role(id);
  return {
    muscle: definition.muscle,
    setTarget,
    reps: definition.defaultRepRange,
    exerciseId: definition.candidateExerciseIds[0] || null,
    label: definition.title.en,
    notes: `NH School role: ${id}. Exercise choice is editable; preserve the function unless you intentionally redesign the routine.`,
    ...(supersetId ? { supersetId } : {}),
  };
};

const prioritySlots = (priorities: MuscleGroup[], dayTag: string): ProgramSlot[] => {
  const selected = priorities.slice(0, 2);
  return selected.flatMap((muscle, index) => {
    if (muscle === 'BICEPS') return [slotFromRole('biceps', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'TRICEPS') return [slotFromRole('triceps', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'SHOULDERS') return [slotFromRole('lateral_delt', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'BACK') return [slotFromRole('horizontal_pull', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'CHEST') return [slotFromRole('horizontal_press', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'QUADS') return [slotFromRole('knee_extension', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'HAMSTRINGS') return [slotFromRole('hinge', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'CALVES') return [slotFromRole('calves', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'ABS') return [slotFromRole('abs', 2, `${dayTag}-priority-${index}`)];
    if (muscle === 'NECK') return [slotFromRole('neck', 2, `${dayTag}-priority-${index}`)];
    return [];
  });
};

/**
 * GainsLab teaching scaffold, not an “official Natural Hypertrophy routine”.
 * The roles and sequencing are chosen to demonstrate NH principles; the user is
 * expected to edit the resulting draft and learn why each slot exists.
 */
export function buildNhTeachingDraft(options: NhDraftOptions): ProgramDay[] {
  const p = options.priorities.slice(0, 2);
  if (options.days === 3) {
    return [
      { id: 'nh_school_d1', dayName: { en: 'Day 1 · Push / Pull / Quads', es: 'Día 1 · Empuje / Tirón / Cuádriceps' }, slots: [slotFromRole('horizontal_press', 3, 'd1-a'), slotFromRole('horizontal_pull', 3, 'd1-a'), slotFromRole('knee_flexion', 3, 'd1-b'), slotFromRole('biceps', 2, 'd1-b'), ...prioritySlots(p, 'd1')] },
      { id: 'nh_school_d2', dayName: { en: 'Day 2 · Vertical / Hinge', es: 'Día 2 · Vertical / Hinge' }, slots: [slotFromRole('vertical_press', 3, 'd2-a'), slotFromRole('vertical_pull', 3, 'd2-a'), slotFromRole('hinge', 2, 'd2-b'), slotFromRole('triceps', 2, 'd2-b'), slotFromRole('abs', 2)] },
      { id: 'nh_school_d3', dayName: { en: 'Day 3 · Hypertrophy / Accessories', es: 'Día 3 · Hipertrofia / Accesorios' }, slots: [slotFromRole('knee_extension', 3, 'd3-a'), slotFromRole('horizontal_press', 3, 'd3-a'), slotFromRole('vertical_pull', 3, 'd3-b'), slotFromRole('lateral_delt', 3, 'd3-b'), slotFromRole('calves', 2)] },
    ];
  }
  if (options.days === 4) {
    return [
      { id: 'nh_school_d1', dayName: { en: 'Upper A', es: 'Torso A' }, slots: [slotFromRole('horizontal_press', 3, 'u1-a'), slotFromRole('horizontal_pull', 3, 'u1-a'), slotFromRole('vertical_press', 3, 'u1-b'), slotFromRole('biceps', 2, 'u1-b'), ...prioritySlots(p, 'u1')] },
      { id: 'nh_school_d2', dayName: { en: 'Lower A', es: 'Pierna A' }, slots: [slotFromRole('knee_flexion', 3, 'l1-a'), slotFromRole('calves', 3, 'l1-a'), slotFromRole('hinge', 2, 'l1-b'), slotFromRole('abs', 2, 'l1-b')] },
      { id: 'nh_school_d3', dayName: { en: 'Upper B', es: 'Torso B' }, slots: [slotFromRole('vertical_pull', 3, 'u2-a'), slotFromRole('horizontal_press', 3, 'u2-a'), slotFromRole('horizontal_pull', 3, 'u2-b'), slotFromRole('triceps', 2, 'u2-b'), slotFromRole('lateral_delt', 2)] },
      { id: 'nh_school_d4', dayName: { en: 'Lower B', es: 'Pierna B' }, slots: [slotFromRole('hinge', 2, 'l2-a'), slotFromRole('knee_extension', 3, 'l2-a'), slotFromRole('knee_flexion', 3, 'l2-b'), slotFromRole('calves', 2, 'l2-b'), slotFromRole('abs', 2)] },
    ];
  }
  return [
    { id: 'nh_school_d1', dayName: { en: 'Upper', es: 'Torso' }, slots: [slotFromRole('horizontal_press', 3, 'd1-a'), slotFromRole('horizontal_pull', 3, 'd1-a'), slotFromRole('vertical_press', 3, 'd1-b'), slotFromRole('biceps', 2, 'd1-b')] },
    { id: 'nh_school_d2', dayName: { en: 'Lower', es: 'Pierna' }, slots: [slotFromRole('knee_flexion', 3, 'd2-a'), slotFromRole('calves', 3, 'd2-a'), slotFromRole('hinge', 2, 'd2-b'), slotFromRole('abs', 2, 'd2-b')] },
    { id: 'nh_school_d3', dayName: { en: 'Arms / Delts', es: 'Brazos / Hombros' }, slots: [slotFromRole('biceps', 3, 'd3-a'), slotFromRole('triceps', 3, 'd3-a'), slotFromRole('lateral_delt', 3, 'd3-b'), slotFromRole('abs', 2, 'd3-b'), ...prioritySlots(p, 'd3')] },
    { id: 'nh_school_d4', dayName: { en: 'Upper 2', es: 'Torso 2' }, slots: [slotFromRole('vertical_pull', 3, 'd4-a'), slotFromRole('horizontal_press', 3, 'd4-a'), slotFromRole('horizontal_pull', 3, 'd4-b'), slotFromRole('triceps', 2, 'd4-b')] },
    { id: 'nh_school_d5', dayName: { en: 'Lower 2', es: 'Pierna 2' }, slots: [slotFromRole('hinge', 2, 'd5-a'), slotFromRole('knee_extension', 3, 'd5-a'), slotFromRole('knee_flexion', 3, 'd5-b'), slotFromRole('calves', 2, 'd5-b')] },
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
