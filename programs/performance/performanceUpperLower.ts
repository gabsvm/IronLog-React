import type { MuscleGroup } from '../../types';
import type {
  ExerciseWeekPrescription,
  ProgramBlockDefinition,
  ProgramDayDefinition,
  ProgramExercisePrescription,
  ProgramSystemDefinition,
  RepRange,
  SetPrescription,
} from '../types';

const localized = (en: string, es: string) => ({ en, es });

type EffortClass = 'compound' | 'accessory';

interface SlotSpec {
  slotId: string;
  sourceExerciseName: string;
  exerciseId: string;
  muscle: MuscleGroup;
  sets: number;
  range: [number, number];
  rest: number;
  effort: EffortClass;
  substitutionGroup?: string;
}

interface DaySpec {
  id: string;
  dayNumber: number;
  name: { en: string; es: string };
  focus: { en: string; es: string };
  slots: SlotSpec[];
}

const rangeSet = (range: [number, number], targetRpe: number): SetPrescription => ({
  // Keep a numeric compatibility target for legacy consumers while the logger
  // displays and uses the explicit repRange for Performance.
  reps: range[1],
  repRange: { min: range[0], max: range[1] } satisfies RepRange,
  targetRpe,
  role: 'work',
});

const prescriptions = (
  weeksInBlock: number,
  slot: SlotSpec,
  compoundRpe: number,
  accessoryRpe: number,
  setScale = 1,
): Record<number, ExerciseWeekPrescription> => {
  const setCount = Math.max(1, Math.ceil(slot.sets * setScale));
  const rpe = slot.effort === 'compound' ? compoundRpe : accessoryRpe;
  return Object.fromEntries(
    Array.from({ length: weeksInBlock }, (_, index) => [
      index + 1,
      { sets: Array.from({ length: setCount }, () => rangeSet(slot.range, rpe)) },
    ]),
  );
};

const DAY_SPECS: DaySpec[] = [
  {
    id: 'performance-upper-a',
    dayNumber: 1,
    name: localized('Upper A · Tension', 'Torso A · Tensión'),
    focus: localized(
      'Stable pressing and pulling. High-quality reps without systemic exhaustion.',
      'Empujes y tirones estables. Repeticiones de calidad sin agotamiento sistémico.',
    ),
    slots: [
      { slotId: 'pua_incline', sourceExerciseName: 'Wide Grip Incline Press', exerciseId: 'bp_inc_wide', muscle: 'CHEST', sets: 3, range: [6, 10], rest: 180, effort: 'compound', substitutionGroup: 'performance_incline_press' },
      { slotId: 'pua_supported_row', sourceExerciseName: 'Chest Supported T-Bar Row', exerciseId: 'tbar_row_chest_supported', muscle: 'BACK', sets: 3, range: [6, 10], rest: 180, effort: 'compound', substitutionGroup: 'performance_supported_row' },
      { slotId: 'pua_pullup', sourceExerciseName: 'Neutral-Grip Pull-Up', exerciseId: 'pullup', muscle: 'BACK', sets: 2, range: [6, 10], rest: 180, effort: 'compound', substitutionGroup: 'performance_vertical_pull' },
      { slotId: 'pua_press', sourceExerciseName: 'Seated DB / Machine Press', exerciseId: 'ohp_db', muscle: 'SHOULDERS', sets: 2, range: [8, 12], rest: 150, effort: 'compound', substitutionGroup: 'performance_shoulder_press' },
      { slotId: 'pua_lateral', sourceExerciseName: 'Cable Lateral Raise', exerciseId: 'lat_raise_cable', muscle: 'SHOULDERS', sets: 2, range: [12, 20], rest: 90, effort: 'accessory', substitutionGroup: 'performance_lateral_raise' },
      { slotId: 'pua_curl', sourceExerciseName: 'Preacher Curl', exerciseId: 'curl_preacher', muscle: 'BICEPS', sets: 2, range: [8, 12], rest: 90, effort: 'accessory', substitutionGroup: 'performance_curl' },
      { slotId: 'pua_triceps', sourceExerciseName: 'Overhead Cable Extension', exerciseId: 'tri_ext', muscle: 'TRICEPS', sets: 2, range: [10, 15], rest: 90, effort: 'accessory', substitutionGroup: 'performance_triceps' },
    ],
  },
  {
    id: 'performance-lower-a',
    dayNumber: 2,
    name: localized('Lower A · Quads', 'Pierna A · Cuádriceps'),
    focus: localized(
      'One demanding knee-dominant lift, then local work with a controlled fatigue cost.',
      'Un movimiento dominante de rodilla exigente y luego trabajo local con costo de fatiga controlado.',
    ),
    slots: [
      { slotId: 'pla_hack', sourceExerciseName: 'Hack Squat', exerciseId: 'sq_hack', muscle: 'QUADS', sets: 3, range: [6, 10], rest: 210, effort: 'compound', substitutionGroup: 'performance_knee_compound' },
      { slotId: 'pla_leg_curl', sourceExerciseName: 'Seated Leg Curl', exerciseId: 'leg_curl', muscle: 'HAMSTRINGS', sets: 3, range: [8, 12], rest: 120, effort: 'accessory', substitutionGroup: 'performance_leg_curl' },
      { slotId: 'pla_leg_press', sourceExerciseName: 'Leg Press', exerciseId: 'leg_press', muscle: 'QUADS', sets: 2, range: [10, 15], rest: 180, effort: 'compound', substitutionGroup: 'performance_quad_press' },
      { slotId: 'pla_leg_ext', sourceExerciseName: 'Leg Extension', exerciseId: 'leg_ext', muscle: 'QUADS', sets: 2, range: [12, 18], rest: 120, effort: 'accessory', substitutionGroup: 'performance_leg_extension' },
      { slotId: 'pla_calf', sourceExerciseName: 'Calf Raise', exerciseId: 'calf_raise', muscle: 'CALVES', sets: 2, range: [10, 20], rest: 90, effort: 'accessory', substitutionGroup: 'performance_calf' },
      { slotId: 'pla_abs', sourceExerciseName: 'Cable Crunch', exerciseId: 'abs_cable', muscle: 'ABS', sets: 2, range: [10, 20], rest: 90, effort: 'accessory', substitutionGroup: 'performance_abs' },
    ],
  },
  {
    id: 'performance-upper-b',
    dayNumber: 3,
    name: localized('Upper B · Hypertrophy', 'Torso B · Hipertrofia'),
    focus: localized(
      'Moderate-rep pressing, weighted pulling and inexpensive local volume.',
      'Presses en reps medias, tirón lastrado y volumen local de bajo costo sistémico.',
    ),
    slots: [
      { slotId: 'pub_machine_incline', sourceExerciseName: 'Machine Incline Press', exerciseId: 'bp_mach_inc', muscle: 'CHEST', sets: 3, range: [8, 12], rest: 180, effort: 'compound', substitutionGroup: 'performance_incline_press' },
      { slotId: 'pub_chin', sourceExerciseName: 'Weighted Neutral/Supine Chin-Up', exerciseId: 'chinup', muscle: 'BACK', sets: 3, range: [5, 8], rest: 180, effort: 'compound', substitutionGroup: 'performance_vertical_pull' },
      { slotId: 'pub_dips', sourceExerciseName: 'Weighted Dips', exerciseId: 'dips', muscle: 'TRICEPS', sets: 2, range: [6, 10], rest: 180, effort: 'compound', substitutionGroup: 'performance_dip_press' },
      { slotId: 'pub_row', sourceExerciseName: 'Machine Row', exerciseId: 'row_mach', muscle: 'BACK', sets: 2, range: [8, 12], rest: 150, effort: 'compound', substitutionGroup: 'performance_supported_row' },
      { slotId: 'pub_rear_delt', sourceExerciseName: 'Rear Delt Fly', exerciseId: 'rear_delt_fly', muscle: 'SHOULDERS', sets: 2, range: [12, 20], rest: 90, effort: 'accessory', substitutionGroup: 'performance_rear_delt' },
      { slotId: 'pub_lateral', sourceExerciseName: 'Machine Lateral Raise', exerciseId: 'lat_raise_mach', muscle: 'SHOULDERS', sets: 2, range: [12, 20], rest: 90, effort: 'accessory', substitutionGroup: 'performance_lateral_raise' },
      { slotId: 'pub_hammer', sourceExerciseName: 'Hammer Curl', exerciseId: 'curl_hammer', muscle: 'BICEPS', sets: 2, range: [8, 12], rest: 90, effort: 'accessory', substitutionGroup: 'performance_curl' },
      { slotId: 'pub_pushdown', sourceExerciseName: 'Tricep Pushdown', exerciseId: 'tri_push', muscle: 'TRICEPS', sets: 2, range: [10, 15], rest: 90, effort: 'accessory', substitutionGroup: 'performance_triceps' },
    ],
  },
  {
    id: 'performance-lower-b',
    dayNumber: 4,
    name: localized('Lower B · Posterior', 'Pierna B · Cadena posterior'),
    focus: localized(
      'A restrained hinge plus machine-supported leg work. Stimulate the posterior chain without turning the session into a recovery tax.',
      'Una bisagra contenida más trabajo de pierna apoyado en máquinas. Estimula la cadena posterior sin convertir la sesión en un impuesto de recuperación.',
    ),
    slots: [
      { slotId: 'plb_rdl', sourceExerciseName: 'Romanian Deadlift', exerciseId: 'rdl', muscle: 'HAMSTRINGS', sets: 2, range: [8, 12], rest: 210, effort: 'compound', substitutionGroup: 'performance_hinge' },
      { slotId: 'plb_single_press', sourceExerciseName: 'Single Leg Press', exerciseId: 'single_leg_press', muscle: 'QUADS', sets: 3, range: [8, 12], rest: 180, effort: 'compound', substitutionGroup: 'performance_quad_press' },
      { slotId: 'plb_leg_curl', sourceExerciseName: 'Lying Leg Curl', exerciseId: 'lying_curl', muscle: 'HAMSTRINGS', sets: 2, range: [10, 15], rest: 120, effort: 'accessory', substitutionGroup: 'performance_leg_curl' },
      { slotId: 'plb_leg_ext', sourceExerciseName: 'Leg Extension', exerciseId: 'leg_ext', muscle: 'QUADS', sets: 2, range: [12, 18], rest: 120, effort: 'accessory', substitutionGroup: 'performance_leg_extension' },
      { slotId: 'plb_calf', sourceExerciseName: 'Calf Raise', exerciseId: 'calf_raise', muscle: 'CALVES', sets: 2, range: [12, 20], rest: 90, effort: 'accessory', substitutionGroup: 'performance_calf' },
      { slotId: 'plb_abs', sourceExerciseName: 'Knee Raise', exerciseId: 'knee_raise', muscle: 'ABS', sets: 2, range: [12, 25], rest: 90, effort: 'accessory', substitutionGroup: 'performance_abs' },
    ],
  },
];

const createDays = (
  weeksInBlock: number,
  compoundRpe: number,
  accessoryRpe: number,
  setScale = 1,
): ProgramDayDefinition[] => DAY_SPECS.map((day) => ({
  id: day.id,
  dayNumber: day.dayNumber,
  name: day.name,
  focus: day.focus,
  exercises: day.slots.map((slot): ProgramExercisePrescription => ({
    slotId: slot.slotId,
    sourceExerciseName: slot.sourceExerciseName,
    exerciseId: slot.exerciseId,
    muscle: slot.muscle,
    prescriptions: prescriptions(weeksInBlock, slot, compoundRpe, accessoryRpe, setScale),
    recommendedRestSeconds: slot.rest,
    substitutionGroup: slot.substitutionGroup,
  })),
}));

const blocks: ProgramBlockDefinition[] = [
  {
    id: 'performance-calibration',
    number: 1,
    globalWeekStart: 1,
    globalWeekEnd: 2,
    name: localized('Calibration', 'Calibración'),
    goal: localized(
      'Find honest working loads and finish with visible reserve.',
      'Encontrar cargas de trabajo honestas y terminar con reserva visible.',
    ),
    principles: ['fatigue-budget', 'double-progression', 'rir', 'rolling-cycle'],
    days: createDays(2, 7, 7.5),
  },
  {
    id: 'performance-build',
    number: 2,
    globalWeekStart: 3,
    globalWeekEnd: 7,
    name: localized('Productive Build', 'Construcción productiva'),
    goal: localized(
      'Add reps first, then load. Keep compounds around two reps in reserve.',
      'Añadir primero repeticiones y después carga. Mantener los compuestos cerca de dos repeticiones en reserva.',
    ),
    principles: ['double-progression', 'rir', 'volume', 'recovery-gate'],
    days: createDays(5, 8, 8.5),
  },
  {
    id: 'performance-pivot',
    number: 3,
    globalWeekStart: 8,
    globalWeekEnd: 8,
    name: localized('Pivot', 'Pivote'),
    goal: localized(
      'Cut fatigue, keep the movement pattern and leave hungry for the next run.',
      'Bajar la fatiga, conservar los patrones de movimiento y terminar con ganas de comenzar el siguiente bloque.',
    ),
    principles: ['pivot', 'fatigue-budget', 'recovery-gate'],
    days: createDays(1, 7, 7, 0.5),
  },
];

export const PERFORMANCE_UPPER_LOWER_V1: ProgramSystemDefinition = {
  id: 'performance_upper_lower',
  version: 1,
  title: 'GainsLab PERFORMANCE',
  subtitle: localized(
    'Upper/Lower for sustainable hypertrophy',
    'Torso/Pierna para hipertrofia sostenible',
  ),
  author: 'GainsLab',
  durationWeeks: 8,
  daysPerWeek: 4,
  blocks,
  guideId: 'performance-upper-lower-v1',
  cadence: {
    unit: 'cycle',
    rolling: true,
    recommendedRestDaysBetweenSessions: 1,
  },
  progressionModel: 'double_progression',
};

export const PERFORMANCE_DAY_SPECS = DAY_SPECS;
