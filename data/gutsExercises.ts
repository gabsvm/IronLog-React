import type { ExerciseDef } from '../types';

/**
 * Exact exercise identities needed by the public Black Swordsman roster that
 * are not represented precisely in GainsLab's legacy library. They are merged
 * additively when GUTS starts so existing user libraries are never replaced.
 */
export const GUTS_EXERCISES: ExerciseDef[] = [
  {
    id: 'guts_db_bench',
    name: { en: 'Dumbbell Bench Press', es: 'Press Banca con Mancuernas' },
    muscle: 'CHEST',
    instructions: { en: 'Flat dumbbell press with a repeatable setup and controlled range of motion.', es: 'Press plano con mancuernas con un setup repetible y rango de movimiento controlado.' },
  },
  {
    id: 'guts_cable_triceps_ext',
    name: { en: 'Cable Tricep Extension', es: 'Extensión de Tríceps en Polea' },
    muscle: 'TRICEPS',
    instructions: { en: 'Use the same cable setup each exposure and keep elbow motion controlled.', es: 'Usa el mismo setup de polea en cada exposición y controla el movimiento del codo.' },
  },
  {
    id: 'guts_weighted_chin',
    name: { en: 'Weighted Chin-Up', es: 'Dominada Supina Lastrada' },
    muscle: 'BACK',
    isBodyweight: true,
    instructions: { en: 'Supinated chin-up with external load. Keep ROM and body position consistent.', es: 'Dominada supina con carga externa. Mantén consistentes el ROM y la posición corporal.' },
  },
  {
    id: 'guts_standing_calf',
    name: { en: 'Standing Calf Raise', es: 'Elevación de Gemelos de Pie' },
    muscle: 'CALVES',
    instructions: { en: 'Use a repeatable stretch and lock the setup before progressing load.', es: 'Usa un estiramiento repetible y fija el setup antes de progresar la carga.' },
  },
  {
    id: 'guts_db_row',
    name: { en: 'Dumbbell Row', es: 'Remo con Mancuerna' },
    muscle: 'BACK',
    instructions: { en: 'Controlled dumbbell row. Keep torso and shoulder path consistent across weeks.', es: 'Remo con mancuerna controlado. Mantén consistentes el torso y la trayectoria del hombro entre semanas.' },
  },
  {
    id: 'guts_barbell_upright_row',
    name: { en: 'Barbell Upright Row', es: 'Remo al Mentón con Barra' },
    muscle: 'SHOULDERS',
    instructions: { en: 'Use a comfortable grip and a repeatable range that your shoulders tolerate.', es: 'Usa un agarre cómodo y un rango repetible que tus hombros toleren.' },
  },
  {
    id: 'guts_landmine_twist',
    name: { en: 'Landmine Oblique Twist', es: 'Giro Oblicuo en Landmine' },
    muscle: 'ABS',
    instructions: { en: 'Rotate through the trunk under control; avoid turning the set into a loose arm swing.', es: 'Rota el tronco de forma controlada; evita convertir la serie en un balanceo libre de brazos.' },
  },
  {
    id: 'guts_seated_calf',
    name: { en: 'Seated Calf Raise', es: 'Elevación de Gemelos Sentado' },
    muscle: 'CALVES',
    instructions: { en: 'Use a consistent stretch and pause at the top. Progress the same setup over time.', es: 'Usa un estiramiento consistente y pausa arriba. Progresa el mismo setup con el tiempo.' },
  },
  {
    id: 'guts_smith_squat',
    name: { en: 'Smith Machine Squat', es: 'Sentadilla en Smith' },
    muscle: 'QUADS',
    instructions: { en: 'Choose a stance that lets you train the quads hard with a stable, repeatable path.', es: 'Elige una postura que permita entrenar fuerte los cuádriceps con una trayectoria estable y repetible.' },
  },
  {
    id: 'guts_barbell_preacher',
    name: { en: 'Barbell Preacher Curl', es: 'Curl Predicador con Barra' },
    muscle: 'BICEPS',
    instructions: { en: 'Keep the upper arm fixed to the pad and use the same grip and ROM each exposure.', es: 'Mantén el brazo apoyado y usa el mismo agarre y ROM en cada exposición.' },
  },
  {
    id: 'guts_kroc_row',
    name: { en: 'Kroc Row', es: 'Remo Kroc' },
    muscle: 'BACK',
    instructions: { en: 'Heavy one-arm dumbbell row. Keep the execution style consistent enough for the logbook to remain meaningful.', es: 'Remo pesado con mancuerna a una mano. Mantén un estilo de ejecución suficientemente consistente para que el logbook siga siendo útil.' },
  },
];
