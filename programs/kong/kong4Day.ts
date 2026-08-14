import type { MuscleGroup } from '../../types';
import type {
  ExerciseWeekPrescription,
  ProgramBlockDefinition,
  ProgramDayDefinition,
  ProgramExercisePrescription,
  ProgramSystemDefinition,
  SetPrescription,
} from '../types';

const localized = (en: string, es = en) => ({ en, es });
const series = (reps: number | 'FAILURE', rpe?: number, roles?: SetPrescription['role'][]): SetPrescription[] =>
  Array.isArray(roles)
    ? roles.map((role, index) => ({ reps, targetRpe: rpe, role }))
    : [{ reps, targetRpe: rpe }];
const exact = (reps: (number | 'FAILURE')[], rpes?: number[], roles?: SetPrescription['role'][]): ExerciseWeekPrescription => ({
  sets: reps.map((rep, index) => ({ reps: rep, targetRpe: rpes?.[index], role: roles?.[index] })),
});
const uniform = (count: number, reps: number | 'FAILURE', rpes: number[], roles?: SetPrescription['role'][]): ExerciseWeekPrescription => ({
  sets: Array.from({ length: count }, (_, index) => ({ reps, targetRpe: rpes[index], role: roles?.[index] })),
});
const b1 = (slotId: string, sourceExerciseName: string, exerciseId: string, muscle: MuscleGroup, reps: [number, number, number, number], rpes: [number[], number[], number[], number[]], extra: Partial<ProgramExercisePrescription> = {}): ProgramExercisePrescription => ({
  slotId, sourceExerciseName, exerciseId, muscle,
  prescriptions: {
    1: uniform(reps[0], reps[0] === 0 ? 1 : (extra as any).weekReps?.[0] ?? (extra as any).constantReps ?? 15, rpes[0]),
    2: uniform(reps[1], (extra as any).weekReps?.[1] ?? (extra as any).constantReps ?? 12, rpes[1]),
    3: uniform(reps[2], (extra as any).weekReps?.[2] ?? (extra as any).constantReps ?? 12, rpes[2]),
    4: uniform(reps[3], (extra as any).weekReps?.[3] ?? (extra as any).constantReps ?? 10, rpes[3]),
  },
  recommendedRestSeconds: 60,
  ...extra,
});
const rpeB1 = (count: number, week: 1 | 2 | 3 | 4) => week === 1 ? Array(count).fill(7) : week === 2 ? [5, 7, ...Array(Math.max(0, count - 2)).fill(10)] : [5, 7, ...Array(Math.max(0, count - 2)).fill(10)];
const b1slot = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, counts: [number, number, number, number], repsByWeek: [number, number, number, number], extra: Partial<ProgramExercisePrescription> = {}) => ({
  slotId, sourceExerciseName: name, exerciseId, muscle,
  prescriptions: {
    1: uniform(counts[0], repsByWeek[0], rpeB1(counts[0], 1)),
    2: uniform(counts[1], repsByWeek[1], rpeB1(counts[1], 2)),
    3: uniform(counts[2], repsByWeek[2], rpeB1(counts[2], 3)),
    4: uniform(counts[3], repsByWeek[3], rpeB1(counts[3], 4)),
  }, recommendedRestSeconds: 60, ...extra,
} satisfies ProgramExercisePrescription);
const b1custom = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, reps: [number[], number[], number[], number[]], extra: Partial<ProgramExercisePrescription> = {}) => ({
  slotId, sourceExerciseName: name, exerciseId, muscle,
  prescriptions: {
    1: exact(reps[0], rpeB1(reps[0].length, 1)),
    2: exact(reps[1], rpeB1(reps[1].length, 2)),
    3: exact(reps[2], rpeB1(reps[2].length, 3)),
    4: exact(reps[3], rpeB1(reps[3].length, 4)),
  }, recommendedRestSeconds: 60, ...extra,
} satisfies ProgramExercisePrescription);

const b2 = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, pattern: 'main' | 'accessory', extra: Partial<ProgramExercisePrescription> = {}): ProgramExercisePrescription => {
  const rpes = [7, 8, 8, 9];
  const patterns = pattern === 'main' ? [[12, 10, 8, 5, 12], [10, 8, 5, 3, 12], [10, 8, 5, 3, 8, 12], [8, 5, 3, 5, 8, 12]] : [[12, 10, 8], [12, 10, 8], [10, 8, 6, 12], [10, 8, 6, 12]];
  return {
    slotId, sourceExerciseName: name, exerciseId, muscle,
    prescriptions: Object.fromEntries(patterns.map((reps, index) => [index + 1, exact(reps, Array(reps.length).fill(rpes[index]), Array(reps.length).fill('work'))])) as Record<number, ExerciseWeekPrescription>,
    substitutionGroup: extra.substitutionGroup,
    ...extra,
  };
};
const b3main = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, extra: Partial<ProgramExercisePrescription> = {}): ProgramExercisePrescription => {
  // The 4-Day source table omits the numeric RPE in its Week 3 header. We use
  // RPE 8 here as a documented inference from the program's 7/8/8/9 pattern.
  const rpes = [7, 8, 8, 9];
  const patterns = [[5, 8, 8, 8, 15], [5, 8, 8, 8, 12], [3, 6, 6, 6, 12], [1, 6, 6, 6, 10]];
  return { slotId, sourceExerciseName: name, exerciseId, muscle, prescriptions: Object.fromEntries(patterns.map((reps, index) => [index + 1, exact(reps, Array(reps.length).fill(rpes[index]), ['top', 'backoff', 'backoff', 'backoff', 'high_rep_backoff'])])) as Record<number, ExerciseWeekPrescription>, ...extra };
};
const b3reverse = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, extra: Partial<ProgramExercisePrescription> = {}) => ({ slotId, sourceExerciseName: name, exerciseId, muscle, prescriptions: Object.fromEntries([1, 2, 3, 4].map((week) => [week, exact([5, 8, 12, 15], Array(4).fill([7, 8, 8, 9][week - 1]), ['work', 'backoff', 'backoff', 'backoff'])])) as Record<number, ExerciseWeekPrescription>, ...extra }) satisfies ProgramExercisePrescription;
const b3fixed = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, reps: number, extra: Partial<ProgramExercisePrescription> = {}) => ({ slotId, sourceExerciseName: name, exerciseId, muscle, prescriptions: Object.fromEntries([1, 2, 3, 4].map((week) => [week, exact(Array(3).fill(reps), Array(3).fill([7, 8, 8, 9][week - 1]))])) as Record<number, ExerciseWeekPrescription>, ...extra }) satisfies ProgramExercisePrescription;
const b3failure = (slotId: string, name: string, exerciseId: string, muscle: MuscleGroup, extra: Partial<ProgramExercisePrescription> = {}) => ({ slotId, sourceExerciseName: name, exerciseId, muscle, prescriptions: Object.fromEntries([1, 2, 3, 4].map((week) => [week, exact(Array(4).fill('FAILURE'), Array(4).fill([7, 8, 8, 9][week - 1]), Array(4).fill('failure'))])) as Record<number, ExerciseWeekPrescription>, ...extra }) satisfies ProgramExercisePrescription;
const day = (number: number, name: string, focus: string, exercises: ProgramExercisePrescription[]): ProgramDayDefinition => ({ id: `kong-day-${number}`, dayNumber: number, name: localized(name), focus: localized(focus), exercises });
const ss = (id: string) => id;

const block1Days: ProgramDayDefinition[] = [
  day(1, 'Day 1 · Arms & Chest', 'Weak points first · pressing under fatigue', [
    b1custom('b1d1_jm_press', 'JM Press', 'jm_press', 'TRICEPS', [[15, 15, 15], [12, 12, 12, 12], [12, 12, 12, 12, 12], [10, 10, 10, 10, 10]], { supersetId: ss('b1d1_a') }),
    b1custom('b1d1_hammer_curl', 'Hammer Curl', 'curl_hammer', 'BICEPS', [[15, 15, 15], [12, 12, 12, 12], [12, 12, 12, 12, 12], [10, 10, 10, 10, 10]], { supersetId: ss('b1d1_a'), substitutionGroup: 'biceps_curl' }),
    b1custom('b1d1_v_handle_pressdown', 'V-Handle Pressdown', 'tri_push', 'TRICEPS', [[20, 20, 20], [15, 15, 15, 15], [15, 15, 15, 15], [12, 12, 12, 12]], { supersetId: ss('b1d1_b'), substitutionGroup: 'triceps_extension' }),
    b1custom('b1d1_cable_curl', 'Cable Curl', 'curl_cable', 'BICEPS', [[20, 20, 20], [15, 15, 15, 15], [15, 15, 15, 15], [12, 12, 12, 12]], { supersetId: ss('b1d1_b'), substitutionGroup: 'biceps_curl' }),
    b1custom('b1d1_front_raise', 'Front Raise w/ DBs', 'front_raise_db', 'SHOULDERS', [[15, 15], [12, 12, 12], [12, 12, 12, 12], [10, 10, 10, 10]], { substitutionGroup: 'front_delt_raise' }),
    b1custom('b1d1_upright_row', 'Upright Row', 'upright_row', 'SHOULDERS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'upright_row' }),
    b1custom('b1d1_barbell_incline', 'Barbell Incline Bench', 'bp_inc_bar', 'CHEST', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'incline_press', guideNoteId: 'b1_pressing' }),
    b1custom('b1d1_machine_chest', 'Machine Chest Press', 'bp_flat', 'CHEST', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'machine_chest_press', guideNoteId: 'b1_pressing' }),
    b1custom('b1d1_crossover', 'Cable Crossover', 'cable_crossover', 'CHEST', [[20, 20], [15, 15, 15], [15, 15, 15], [12, 12, 12]], { substitutionGroup: 'chest_fly' }),
  ]),
  day(2, 'Day 2 · Posterior & Back', 'Hamstrings first · high-density lower body', [
    b1custom('b1d2_ham_curl', 'Hamstring Curl', 'leg_curl', 'HAMSTRINGS', [[20, 20], [15, 15, 15], [15, 15, 15], [12, 12, 12]], { substitutionGroup: 'hamstring_knee_flexion', guideNoteId: 'b1_posterior' }),
    b1custom('b1d2_leg_press', 'Leg Press', 'leg_press', 'QUADS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d2_a'), substitutionGroup: 'leg_press' }),
    b1custom('b1d2_rdl', 'Romanian Deadlift', 'rdl', 'HAMSTRINGS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d2_a'), substitutionGroup: 'hip_hinge' }),
    b1custom('b1d2_walking_lunge', 'Walking Lunge w/ DBs', 'lunges', 'QUADS', [[12, 12], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d2_b'), substitutionGroup: 'lunge' }),
    b1custom('b1d2_leg_ext', 'Leg Extension', 'leg_ext', 'QUADS', [[12, 12], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d2_b'), substitutionGroup: 'leg_extension' }),
    b1custom('b1d2_one_arm_row', 'One Arm DB Row', 'row_db', 'BACK', [[20, 20], [15, 15, 15], [15, 15, 15], [12, 12, 12]], { substitutionGroup: 'horizontal_row' }),
    b1custom('b1d2_lat_pulldown', 'Lat Pulldown', 'lat_pull', 'BACK', [[15, 15], [12, 12, 12], [12, 12, 12, 12], [10, 10, 10, 10]], { substitutionGroup: 'vertical_pull' }),
  ]),
  day(3, 'Day 3 · Arms & Shoulders', 'Arm volume before pressing', [
    b1custom('b1d3_barbell_curl', 'Barbell Curl', 'curl_bar', 'BICEPS', [[15, 15, 15], [12, 12, 12, 12], [12, 12, 12, 12, 12], [10, 10, 10, 10, 10]], { supersetId: ss('b1d3_a'), substitutionGroup: 'biceps_curl' }),
    b1custom('b1d3_dips', 'Dips', 'dips', 'TRICEPS', [[15, 15, 15], [12, 12, 12, 12], [12, 12, 12, 12, 12], [10, 10, 10, 10, 10]], { supersetId: ss('b1d3_a'), substitutionGroup: 'dip', guideNoteId: 'dips' }),
    b1custom('b1d3_alt_db_curl', 'Alternating DB Curl', 'curl_db', 'BICEPS', [[15, 15, 15], [12, 12, 12, 12], [12, 12, 12, 12, 12], [10, 10, 10, 10, 10]], { supersetId: ss('b1d3_b'), substitutionGroup: 'biceps_curl' }),
    b1custom('b1d3_rope_pressdown', 'Rope Pressdown', 'rope_pressdown', 'TRICEPS', [[15, 15, 15], [12, 12, 12, 12], [12, 12, 12, 12, 12], [10, 10, 10, 10, 10]], { supersetId: ss('b1d3_b'), substitutionGroup: 'triceps_extension' }),
    b1custom('b1d3_wide_bench', 'Wide Grip Bench Press', 'wide_bench_press', 'CHEST', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'wide_bench_press' }),
    b1custom('b1d3_db_incline', 'DB Incline Press', 'bp_inc', 'CHEST', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'incline_press' }),
    b1custom('b1d3_behind_neck_press', 'Behind the Neck Press', 'behind_neck_press', 'SHOULDERS', [[15, 15], [12, 12, 12], [12, 12, 12, 12], [10, 10, 10, 10]], { substitutionGroup: 'military_press', guideNoteId: 'behind_neck_press' }),
    b1custom('b1d3_one_arm_lateral', 'One Arm Lateral Raise w/ Cables', 'lat_raise_cable', 'SHOULDERS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'lateral_raise' }),
  ]),
  day(4, 'Day 4 · Legs & Back', 'Keep the prescribed order; duplicate hamstring curl is intentional', [
    b1custom('b1d4_squat', 'Squat', 'sq_bar', 'QUADS', [[15, 15], [12, 12, 12], [12, 12, 12, 12], [10, 10, 10, 10]], { substitutionGroup: 'squat' }),
    b1custom('b1d4_weighted_back_extension', 'Weighted Back Extension', 'back_extension', 'HAMSTRINGS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d4_a'), substitutionGroup: 'back_extension' }),
    b1custom('b1d4_leg_extension', 'Leg Extension', 'leg_ext', 'QUADS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d4_a'), substitutionGroup: 'leg_extension' }),
    b1custom('b1d4_single_leg_press', 'Single Leg Press', 'single_leg_press', 'QUADS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d4_b'), substitutionGroup: 'leg_press' }),
    b1custom('b1d4_ham_curl_superset', 'Hamstring Curl', 'leg_curl', 'HAMSTRINGS', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { supersetId: ss('b1d4_b'), substitutionGroup: 'hamstring_knee_flexion', guideNoteId: 'b1_posterior' }),
    b1custom('b1d4_ham_curl_separate', 'Hamstring Curl', 'leg_curl', 'HAMSTRINGS', [[15, 15], [12, 12, 12], [12, 12, 12, 12], [10, 10, 10, 10]], { substitutionGroup: 'hamstring_knee_flexion', preserveOrderReason: localized('The source includes a second, separate Hamstring Curl slot.', 'La fuente incluye un segundo slot separado de Hamstring Curl.') }),
    b1custom('b1d4_cable_row', 'Cable Row', 'row_cable', 'BACK', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'horizontal_row' }),
    b1custom('b1d4_high_machine_row', 'High Machine Row', 'high_machine_row', 'BACK', [[15, 15], [12, 12, 12], [12, 12, 12], [10, 10, 10]], { substitutionGroup: 'horizontal_row' }),
  ]),
];

const block2Days: ProgramDayDefinition[] = [
  day(1, 'Day 1 · Shoulders & Arms', 'Pyramids · fatigued strength', [
    b2('b2d1_military', 'Seated Military Press', 'ohp', 'SHOULDERS', 'main', { substitutionGroup: 'military_press' }),
    b2('b2d1_db_shoulder', 'DB Shoulder Press', 'ohp_db', 'SHOULDERS', 'accessory', { substitutionGroup: 'military_press' }),
    b2('b2d1_lateral', 'DB Lateral Raise', 'lat_raise', 'SHOULDERS', 'accessory', { substitutionGroup: 'lateral_raise' }),
    b2('b2d1_dips', 'Dips', 'dips', 'TRICEPS', 'accessory', { supersetId: 'b2d1_a', substitutionGroup: 'dip' }),
    b2('b2d1_preacher', 'Preacher Curl', 'curl_preacher', 'BICEPS', 'accessory', { supersetId: 'b2d1_a', substitutionGroup: 'biceps_curl' }),
    b2('b2d1_skull', 'Skull Crusher', 'skull_crusher', 'TRICEPS', 'accessory', { supersetId: 'b2d1_b', substitutionGroup: 'triceps_extension' }),
    b2('b2d1_barbell_curl', 'Barbell Curl', 'curl_bar', 'BICEPS', 'accessory', { supersetId: 'b2d1_b', substitutionGroup: 'biceps_curl' }),
    b2('b2d1_vbar', 'V-Bar Pressdown', 'tri_push', 'TRICEPS', 'accessory', { supersetId: 'b2d1_c', substitutionGroup: 'triceps_extension' }),
    b2('b2d1_cable_curl', 'Cable Curl', 'curl_cable', 'BICEPS', 'accessory', { supersetId: 'b2d1_c', substitutionGroup: 'biceps_curl' }),
  ]),
  day(2, 'Day 2 · Posterior & Back', 'Compounds first · fatigued strength', [
    b2('b2d2_sldl', 'Stiff Leg Deadlift', 'sldl', 'HAMSTRINGS', 'main', { substitutionGroup: 'stiff_leg_deadlift', guideNoteId: 'sldl' }),
    b2('b2d2_bent_row', 'Bent Barbell Row', 'bent_barbell_row', 'BACK', 'main', { substitutionGroup: 'horizontal_row' }),
    b2('b2d2_back_ext', 'Weighted Back Extension', 'back_extension', 'HAMSTRINGS', 'accessory', { supersetId: 'b2d2_a', substitutionGroup: 'back_extension' }),
    b2('b2d2_bulgarian', 'Bulgarian Split Squat', 'bulgarian_split_squat', 'QUADS', 'accessory', { supersetId: 'b2d2_a', substitutionGroup: 'split_squat', guideNoteId: 'bulgarian' }),
    b2('b2d2_leg_press', 'Leg Press', 'leg_press', 'QUADS', 'accessory', { substitutionGroup: 'leg_press' }),
    b2('b2d2_ham', 'Hamstring Curl', 'leg_curl', 'HAMSTRINGS', 'accessory', { supersetId: 'b2d2_b', substitutionGroup: 'hamstring_knee_flexion' }),
    b2('b2d2_leg_ext', 'Leg Extension', 'leg_ext', 'QUADS', 'accessory', { supersetId: 'b2d2_b', substitutionGroup: 'leg_extension' }),
    b2('b2d2_one_arm_lat', 'One Arm Lat Pulldown', 'one_arm_lat_pulldown', 'BACK', 'accessory', { substitutionGroup: 'vertical_pull' }),
  ]),
  day(3, 'Day 3 · Chest & Arms', 'Pyramids under fatigue', [
    b2('b2d3_close_bench', 'Close Grip Bench Press', 'close_grip_bench', 'CHEST', 'main', { substitutionGroup: 'close_grip_press' }),
    b2('b2d3_wide_incline', 'Wide Grip Incline Bench', 'bp_inc_wide', 'CHEST', 'accessory', { substitutionGroup: 'wide_bench_press' }),
    b2('b2d3_machine_chest', 'Machine Chest Press', 'bp_flat', 'CHEST', 'accessory', { substitutionGroup: 'machine_chest_press' }),
    b2('b2d3_db_fly', 'DB Fly', 'db_fly', 'CHEST', 'accessory', { substitutionGroup: 'chest_fly' }),
    b2('b2d3_dip_machine', 'Seated Dip Machine', 'dip_machine', 'TRICEPS', 'accessory', { supersetId: 'b2d3_a', substitutionGroup: 'dip' }),
    b2('b2d3_barbell_curl', 'Barbell Curl', 'curl_bar', 'BICEPS', 'accessory', { supersetId: 'b2d3_a', substitutionGroup: 'biceps_curl' }),
    b2('b2d3_db_overhead', '2 Hand DB Overhead Tricep Extension', 'db_overhead_tri', 'TRICEPS', 'accessory', { supersetId: 'b2d3_b', substitutionGroup: 'triceps_extension' }),
    b2('b2d3_hammer', 'Hammer Curl', 'curl_hammer', 'BICEPS', 'accessory', { supersetId: 'b2d3_b', substitutionGroup: 'biceps_curl' }),
  ]),
  day(4, 'Day 4 · Legs & Back', 'Pyramids · compound overload', [
    b2('b2d4_high_bar_squat', 'High Bar Close-Stance Squat', 'high_bar_close_squat', 'QUADS', 'main', { substitutionGroup: 'squat', guideNoteId: 'high_bar_close_squat' }),
    b2('b2d4_hack', 'Machine Hack Squat', 'sq_hack', 'QUADS', 'accessory', { substitutionGroup: 'hack_squat' }),
    b2('b2d4_step_up', 'Step Up w/ DBs', 'step_up_db', 'QUADS', 'accessory', { supersetId: 'b2d4_a', substitutionGroup: 'lunge' }),
    b2('b2d4_db_rdl', 'DB Romanian Deadlift', 'rdl', 'HAMSTRINGS', 'accessory', { supersetId: 'b2d4_a', substitutionGroup: 'hip_hinge' }),
    b2('b2d4_back_ext', 'Weighted Back Extension', 'back_extension', 'HAMSTRINGS', 'accessory', { supersetId: 'b2d4_b', substitutionGroup: 'back_extension' }),
    b2('b2d4_pullover', 'DB Pullover', 'pullover_db', 'BACK', 'accessory', { supersetId: 'b2d4_b', substitutionGroup: 'pullover' }),
    b2('b2d4_close_lat', 'Close Grip Lat Pulldown', 'close_grip_lat_pulldown', 'BACK', 'accessory', { substitutionGroup: 'vertical_pull' }),
    b2('b2d4_wide_row', 'Wide Grip Cable Row', 'wide_grip_cable_row', 'BACK', 'accessory', { substitutionGroup: 'horizontal_row' }),
  ]),
];

const block3Days: ProgramDayDefinition[] = [
  day(1, 'Day 1 · Pressing & Arms', 'Overload · top set fresh', [
    b3main('b3d1_push_press', 'Push Press', 'push_press', 'SHOULDERS', { substitutionGroup: 'push_press', guideNoteId: 'push_press' }),
    b3reverse('b3d1_military', 'Seated Military Press', 'ohp', 'SHOULDERS', { substitutionGroup: 'military_press' }),
    b3reverse('b3d1_weighted_dips', 'Weighted Dips', 'dips', 'TRICEPS', { supersetId: 'b3d1_a', substitutionGroup: 'dip' }),
    b3reverse('b3d1_barbell_curl', 'Barbell Curl', 'curl_bar', 'BICEPS', { supersetId: 'b3d1_a', substitutionGroup: 'biceps_curl' }),
    b3fixed('b3d1_skull', 'Skull Crusher', 'skull_crusher', 'TRICEPS', 8, { supersetId: 'b3d1_b', substitutionGroup: 'triceps_extension' }),
    b3fixed('b3d1_incline_curl', 'Incline DB Curl', 'incline_db_curl', 'BICEPS', 8, { supersetId: 'b3d1_b', substitutionGroup: 'biceps_curl' }),
    b3fixed('b3d1_vbar', 'V-Bar Pressdown', 'tri_push', 'TRICEPS', 12, { supersetId: 'b3d1_c', substitutionGroup: 'triceps_extension' }),
    b3fixed('b3d1_close_cable_curl', 'Close Grip Cable Curl', 'close_grip_cable_curl', 'BICEPS', 12, { supersetId: 'b3d1_c', substitutionGroup: 'biceps_curl' }),
  ]),
  day(2, 'Day 2 · Deadlift & Back', 'Overload · back volume', [
    b3main('b3d2_deadlift_13', '13" Deadlift', 'deadlift_13in', 'BACK', { substitutionGroup: 'elevated_deadlift', guideNoteId: 'deadlift_13' }),
    b3main('b3d2_pendlay', 'Pendlay Row', 'pendlay_row', 'BACK', { substitutionGroup: 'pendlay_row', guideNoteId: 'pendlay_row' }),
    b3reverse('b3d2_good_morning', 'Good Morning w/ Pause (2 count)', 'good_morning_pause', 'HAMSTRINGS', { supersetId: 'b3d2_a', substitutionGroup: 'good_morning' }),
    b3reverse('b3d2_tbar', 'Chest Supported T-Bar Row', 'tbar_row_chest_supported', 'BACK', { supersetId: 'b3d2_a', substitutionGroup: 'tbar_row' }),
    b3fixed('b3d2_back_ext', 'Weighted Back Extension', 'back_extension', 'HAMSTRINGS', 8, { supersetId: 'b3d2_b', substitutionGroup: 'back_extension' }),
    b3fixed('b3d2_behind_neck_pull', 'Behind the Neck Pulldown', 'behind_neck_pulldown', 'BACK', 12, { supersetId: 'b3d2_b', substitutionGroup: 'vertical_pull' }),
    b3fixed('b3d2_step_up', 'Step Ups w/ DBs', 'step_up_db', 'QUADS', 8, { substitutionGroup: 'lunge' }),
  ]),
  day(3, 'Day 3 · Chest & Arms', 'Overload · reverse pyramids', [
    b3main('b3d3_wide_bench', 'Wide Bench Press', 'wide_bench_press', 'CHEST', { substitutionGroup: 'wide_bench_press', guideNoteId: 'wide_bench' }),
    b3reverse('b3d3_floor_press', 'Close Grip Floor Press', 'close_grip_floor_press', 'CHEST', { substitutionGroup: 'floor_press', guideNoteId: 'floor_press' }),
    b3fixed('b3d3_neutral_db', 'Neutral Grip DB Press', 'neutral_db_press', 'CHEST', 8, { substitutionGroup: 'neutral_db_press' }),
    b3reverse('b3d3_dip_machine', 'Seated Dip Machine', 'dip_machine', 'TRICEPS', { supersetId: 'b3d3_a', substitutionGroup: 'dip' }),
    b3reverse('b3d3_alt_curl', 'Alternating DB Curl', 'curl_db', 'BICEPS', { supersetId: 'b3d3_a', substitutionGroup: 'biceps_curl' }),
    b3fixed('b3d3_rope_press', 'Rope Pressdown', 'rope_pressdown', 'TRICEPS', 12, { supersetId: 'b3d3_b', substitutionGroup: 'triceps_extension' }),
    b3fixed('b3d3_rope_curl', 'Rope Cable Curl', 'rope_cable_curl', 'BICEPS', 12, { supersetId: 'b3d3_b', substitutionGroup: 'biceps_curl' }),
  ]),
  day(4, 'Day 4 · Squat & Back', 'Overload · high-rep backoffs', [
    b3main('b3d4_low_bar_squat', 'Low Bar Wide-Stance Squat', 'low_bar_wide_squat', 'QUADS', { substitutionGroup: 'wide_stance_squat', guideNoteId: 'low_bar_wide_squat' }),
    b3reverse('b3d4_front_squat', 'Front Squat', 'front_squat', 'QUADS', { supersetId: 'b3d4_a', substitutionGroup: 'front_squat' }),
    b3failure('b3d4_chinups', 'Chin Ups', 'chinup', 'BACK', { supersetId: 'b3d4_a', substitutionGroup: 'chinup' }),
    b3fixed('b3d4_single_leg_ext', 'Single Leg Extension', 'single_leg_extension', 'QUADS', 8, { supersetId: 'b3d4_b', substitutionGroup: 'leg_extension' }),
    b3fixed('b3d4_single_leg_press', 'Single Leg Press', 'single_leg_press', 'QUADS', 8, { supersetId: 'b3d4_b', substitutionGroup: 'leg_press' }),
    b3fixed('b3d4_cable_row', 'Cable Row', 'row_cable', 'BACK', 12, { substitutionGroup: 'horizontal_row' }),
  ]),
];

export const KONG_4DAY_V1: ProgramSystemDefinition = {
  id: 'kong_4day',
  version: 1,
  title: 'KONG 4-Day',
  subtitle: localized('Savage Size in 12 Weeks · 4 Day Split', 'Savage Size en 12 semanas · Split de 4 días'),
  author: 'Alexander Bromley',
  durationWeeks: 12,
  daysPerWeek: 4,
  guideId: 'kong-guide-v1',
  blocks: [
    { id: 'kong-block-1', number: 1, globalWeekStart: 1, globalWeekEnd: 4, name: localized('Capacity / Weak Points'), goal: localized('Weak points first · density · high reps'), principles: ['weak_points_first', 'density', 'volume', 'high_reps'], days: block1Days },
    { id: 'kong-block-2', number: 2, globalWeekStart: 5, globalWeekEnd: 8, name: localized('Pyramids / Fatigued Strength'), goal: localized('Compounds first · traditional pyramids'), principles: ['fatigued_strength', 'load_variation'], days: block2Days },
    { id: 'kong-block-3', number: 3, globalWeekStart: 9, globalWeekEnd: 12, name: localized('Overload / Reverse Pyramids'), goal: localized('Top sets fresh · high-rep backoffs'), principles: ['phase_potentiation', 'overload', 'reverse_pyramids'], days: block3Days },
  ],
};

export default KONG_4DAY_V1;
