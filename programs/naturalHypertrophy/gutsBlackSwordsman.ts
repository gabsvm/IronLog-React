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

interface GutsSlotSpec {
  slotId: string;
  sourceExerciseName: string;
  exerciseId: string;
  muscle: MuscleGroup;
  sets: number;
  range: [number, number];
  supersetId: string;
  rest: number;
  substitutionGroup?: string;
}

interface GutsDaySpec {
  id: string;
  dayNumber: number;
  name: { en: string; es: string };
  focus: { en: string; es: string };
  slots: GutsSlotSpec[];
}

const rangedWorkSet = (range: [number, number]): SetPrescription => ({
  reps: range[1],
  repRange: { min: range[0], max: range[1] } satisfies RepRange,
  role: 'work',
});

const repeatPrescription = (
  slot: GutsSlotSpec,
  weeks = 12,
): Record<number, ExerciseWeekPrescription> => Object.fromEntries(
  Array.from({ length: weeks }, (_, index) => [
    index + 1,
    { sets: Array.from({ length: slot.sets }, () => rangedWorkSet(slot.range)) },
  ]),
);

/**
 * Public Black Swordsman roster published by Natural Hypertrophy on Boostcamp.
 * Weeks 2-12 are intentionally NOT reverse-engineered: the public page exposes
 * Week 1 and states that the remaining week-by-week coaching lives in the app.
 * GainsLab keeps the verified roster/ranges stable and applies NH's documented
 * evolving-rep philosophy instead of fabricating hidden targets.
 */
const GUTS_BLACK_SWORDSMAN_DAYS: GutsDaySpec[] = [
  {
    id: 'guts-bs-upper-1',
    dayNumber: 1,
    name: localized('Upper 1', 'Torso 1'),
    focus: localized(
      'Heavy benching plus upper-body volume, trunk work and neck training.',
      'Banca pesada más volumen de torso, trabajo de abdomen y cuello.',
    ),
    slots: [
      { slotId: 'gbs_u1_bench', sourceExerciseName: 'Bench Press (Barbell)', exerciseId: 'bp_bar', muscle: 'CHEST', sets: 3, range: [3, 5], supersetId: 'gbs_u1_ss1', rest: 180, substitutionGroup: 'guts_horizontal_press_heavy' },
      { slotId: 'gbs_u1_pullover', sourceExerciseName: 'Pullover (Dumbbell)', exerciseId: 'pullover_db', muscle: 'BACK', sets: 3, range: [6, 10], supersetId: 'gbs_u1_ss1', rest: 180, substitutionGroup: 'guts_pullover' },
      { slotId: 'gbs_u1_ohp', sourceExerciseName: 'Overhead Press (Barbell)', exerciseId: 'ohp', muscle: 'SHOULDERS', sets: 3, range: [6, 10], supersetId: 'gbs_u1_ss2', rest: 150, substitutionGroup: 'guts_vertical_press' },
      { slotId: 'gbs_u1_crunch', sourceExerciseName: 'Cable Crunch', exerciseId: 'abs_cable', muscle: 'ABS', sets: 3, range: [8, 12], supersetId: 'gbs_u1_ss2', rest: 150, substitutionGroup: 'guts_trunk_flexion' },
      { slotId: 'gbs_u1_db_bench', sourceExerciseName: 'Bench Press (Dumbbell)', exerciseId: 'guts_db_bench', muscle: 'CHEST', sets: 4, range: [8, 12], supersetId: 'gbs_u1_gs3', rest: 120, substitutionGroup: 'guts_horizontal_press_volume' },
      { slotId: 'gbs_u1_tri', sourceExerciseName: 'Tricep Extension (Cable)', exerciseId: 'guts_cable_triceps_ext', muscle: 'TRICEPS', sets: 4, range: [10, 15], supersetId: 'gbs_u1_gs3', rest: 120, substitutionGroup: 'guts_triceps_extension' },
      { slotId: 'gbs_u1_neck_ext', sourceExerciseName: 'Neck Extension', exerciseId: 'neck_ext', muscle: 'NECK', sets: 4, range: [10, 20], supersetId: 'gbs_u1_gs3', rest: 120, substitutionGroup: 'guts_neck_extension' },
    ],
  },
  {
    id: 'guts-bs-lower-1',
    dayNumber: 2,
    name: localized('Lower 1', 'Pierna 1'),
    focus: localized(
      'Weighted chins, posterior chain and leg work paired with arms and upper back.',
      'Dominadas lastradas, cadena posterior y piernas combinadas con brazos y espalda alta.',
    ),
    slots: [
      { slotId: 'gbs_l1_chin', sourceExerciseName: 'Chin-Up (Weighted)', exerciseId: 'guts_weighted_chin', muscle: 'BACK', sets: 3, range: [3, 5], supersetId: 'gbs_l1_ss1', rest: 180, substitutionGroup: 'guts_weighted_chin' },
      { slotId: 'gbs_l1_leg_ext', sourceExerciseName: 'Leg Extension', exerciseId: 'leg_ext', muscle: 'QUADS', sets: 3, range: [10, 15], supersetId: 'gbs_l1_ss1', rest: 180, substitutionGroup: 'guts_leg_extension' },
      { slotId: 'gbs_l1_rdl', sourceExerciseName: 'Romanian Deadlift (Barbell)', exerciseId: 'rdl', muscle: 'HAMSTRINGS', sets: 4, range: [8, 12], supersetId: 'gbs_l1_gs2', rest: 180, substitutionGroup: 'guts_hinge' },
      { slotId: 'gbs_l1_inc_curl', sourceExerciseName: 'Incline Curl (Dumbbell)', exerciseId: 'incline_db_curl', muscle: 'BICEPS', sets: 4, range: [6, 12], supersetId: 'gbs_l1_gs2', rest: 180, substitutionGroup: 'guts_biceps_lengthened' },
      { slotId: 'gbs_l1_calf', sourceExerciseName: 'Standing Calf Raise', exerciseId: 'guts_standing_calf', muscle: 'CALVES', sets: 4, range: [10, 20], supersetId: 'gbs_l1_gs2', rest: 180, substitutionGroup: 'guts_calf_standing' },
      { slotId: 'gbs_l1_leg_press', sourceExerciseName: 'Leg Press', exerciseId: 'leg_press', muscle: 'QUADS', sets: 4, range: [10, 15], supersetId: 'gbs_l1_gs3', rest: 150, substitutionGroup: 'guts_leg_press' },
      { slotId: 'gbs_l1_db_row', sourceExerciseName: 'Dumbbell Row', exerciseId: 'guts_db_row', muscle: 'BACK', sets: 4, range: [8, 12], supersetId: 'gbs_l1_gs3', rest: 150, substitutionGroup: 'guts_db_row' },
      { slotId: 'gbs_l1_upright', sourceExerciseName: 'Upright Row (Barbell)', exerciseId: 'guts_barbell_upright_row', muscle: 'SHOULDERS', sets: 4, range: [10, 15], supersetId: 'gbs_l1_gs3', rest: 150, substitutionGroup: 'guts_upright_row' },
    ],
  },
  {
    id: 'guts-bs-upper-2',
    dayNumber: 3,
    name: localized('Upper 2', 'Torso 2'),
    focus: localized(
      'Arm-heavy pressing with incline chest, neck and rotational trunk work.',
      'Empujes con énfasis en brazos, pecho inclinado, cuello y trabajo rotacional de abdomen.',
    ),
    slots: [
      { slotId: 'gbs_u2_cgbp', sourceExerciseName: 'Bench Press (Close Grip)', exerciseId: 'close_grip_bench', muscle: 'CHEST', sets: 3, range: [6, 10], supersetId: 'gbs_u2_ss1', rest: 150, substitutionGroup: 'guts_close_grip_press' },
      { slotId: 'gbs_u2_hammer', sourceExerciseName: 'Hammer Curl', exerciseId: 'curl_hammer', muscle: 'BICEPS', sets: 3, range: [8, 12], supersetId: 'gbs_u2_ss1', rest: 150, substitutionGroup: 'guts_hammer_curl' },
      { slotId: 'gbs_u2_incline', sourceExerciseName: 'Incline Bench Press (Barbell)', exerciseId: 'bp_inc_bar', muscle: 'CHEST', sets: 3, range: [8, 12], supersetId: 'gbs_u2_ss2', rest: 150, substitutionGroup: 'guts_incline_press' },
      { slotId: 'gbs_u2_neck', sourceExerciseName: 'Neck Curl', exerciseId: 'neck_curl', muscle: 'NECK', sets: 3, range: [10, 15], supersetId: 'gbs_u2_ss2', rest: 150, substitutionGroup: 'guts_neck_flexion' },
      { slotId: 'gbs_u2_jm', sourceExerciseName: 'JM Press', exerciseId: 'jm_press', muscle: 'TRICEPS', sets: 4, range: [8, 12], supersetId: 'gbs_u2_ss3', rest: 120, substitutionGroup: 'guts_jm_press' },
      { slotId: 'gbs_u2_landmine', sourceExerciseName: 'Landmine Oblique Twist', exerciseId: 'guts_landmine_twist', muscle: 'ABS', sets: 4, range: [10, 15], supersetId: 'gbs_u2_ss3', rest: 120, substitutionGroup: 'guts_rotational_core' },
    ],
  },
  {
    id: 'guts-bs-lower-2',
    dayNumber: 4,
    name: localized('Lower 2', 'Pierna 2'),
    focus: localized(
      'Heavy pulling followed by quad work, curls, rows and lateral delts.',
      'Tirón pesado seguido de cuádriceps, bíceps, remos y deltoide lateral.',
    ),
    slots: [
      { slotId: 'gbs_l2_deadlift', sourceExerciseName: 'Deadlift (Barbell)', exerciseId: 'deadlift', muscle: 'BACK', sets: 3, range: [3, 3], supersetId: 'gbs_l2_ss1', rest: 240, substitutionGroup: 'guts_deadlift' },
      { slotId: 'gbs_l2_seated_calf', sourceExerciseName: 'Seated Calf Raise', exerciseId: 'guts_seated_calf', muscle: 'CALVES', sets: 3, range: [15, 20], supersetId: 'gbs_l2_ss1', rest: 240, substitutionGroup: 'guts_calf_seated' },
      { slotId: 'gbs_l2_smith', sourceExerciseName: 'Squat (Smith Machine)', exerciseId: 'guts_smith_squat', muscle: 'QUADS', sets: 4, range: [10, 15], supersetId: 'gbs_l2_ss2', rest: 180, substitutionGroup: 'guts_smith_squat' },
      { slotId: 'gbs_l2_preacher', sourceExerciseName: 'Preacher Curl (Barbell)', exerciseId: 'guts_barbell_preacher', muscle: 'BICEPS', sets: 4, range: [6, 12], supersetId: 'gbs_l2_ss2', rest: 180, substitutionGroup: 'guts_preacher_curl' },
      { slotId: 'gbs_l2_kroc', sourceExerciseName: 'Kroc Row', exerciseId: 'guts_kroc_row', muscle: 'BACK', sets: 4, range: [8, 12], supersetId: 'gbs_l2_ss3', rest: 150, substitutionGroup: 'guts_kroc_row' },
      { slotId: 'gbs_l2_lateral', sourceExerciseName: 'Lateral Raise (Cable)', exerciseId: 'lat_raise_cable', muscle: 'SHOULDERS', sets: 4, range: [10, 15], supersetId: 'gbs_l2_ss3', rest: 150, substitutionGroup: 'guts_lateral_raise' },
    ],
  },
];

const createDays = (): ProgramDayDefinition[] => GUTS_BLACK_SWORDSMAN_DAYS.map(day => ({
  id: day.id,
  dayNumber: day.dayNumber,
  name: day.name,
  focus: day.focus,
  exercises: day.slots.map((slot): ProgramExercisePrescription => ({
    slotId: slot.slotId,
    sourceExerciseName: slot.sourceExerciseName,
    exerciseId: slot.exerciseId,
    muscle: slot.muscle,
    prescriptions: repeatPrescription(slot),
    supersetId: slot.supersetId,
    substitutionGroup: slot.substitutionGroup,
    recommendedRestSeconds: slot.rest,
  })),
}));

const blocks: ProgramBlockDefinition[] = [
  {
    id: 'guts-black-swordsman-block',
    number: 1,
    globalWeekStart: 1,
    globalWeekEnd: 12,
    name: localized('Black Swordsman', 'Black Swordsman'),
    goal: localized(
      'Keep the exercise roster stable, accumulate quality reps inside each range and earn small load increases.',
      'Mantén estable el roster de ejercicios, acumula repeticiones de calidad dentro de cada rango y gánate aumentos pequeños de carga.',
    ),
    principles: ['guts-identity', 'nh-85-rule', 'nh-evolving-reps', 'nh-supersets', 'nh-recovery-schedule'],
    days: createDays(),
  },
];

export const GUTS_BLACK_SWORDSMAN_V1: ProgramSystemDefinition = {
  id: 'natural_hypertrophy_guts_black_swordsman',
  version: 1,
  title: 'GUTS · Black Swordsman',
  subtitle: localized(
    'Natural Hypertrophy · 4-day physique specialization',
    'Natural Hypertrophy · especialización física de 4 días',
  ),
  author: 'Natural Hypertrophy',
  durationWeeks: 12,
  daysPerWeek: 4,
  blocks,
  guideId: 'natural-hypertrophy-guts-black-swordsman-v1',
  cadence: { unit: 'week', rolling: false },
  progressionModel: 'evolving_rep_range',
};

export const GUTS_BLACK_SWORDSMAN_DAY_SPECS = GUTS_BLACK_SWORDSMAN_DAYS;
