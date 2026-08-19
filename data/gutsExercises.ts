import type { ExerciseDef } from '../types';

/**
 * Exercise identities needed by the current public Black Swordsman roster that
 * are not already present in GainsLab's default library. Kept additive so old
 * persisted libraries self-heal through the normal extras merge on startup.
 */
export const GUTS_EXERCISES: ExerciseDef[] = [
  {
    id: 'guts_db_bench',
    name: { en: 'Dumbbell Bench Press', es: 'Press Banca con Mancuernas' },
    muscle: 'CHEST',
    instructions: {
      en: 'Flat dumbbell press. Keep the setup repeatable and use a controlled range of motion.',
      es: 'Press plano con mancuernas. Mantén un setup repetible y un rango de movimiento controlado.',
    },
  },
  {
    id: 'guts_landmine_twist',
    name: { en: 'Landmine Oblique Twist', es: 'Giro Oblicuo en Landmine' },
    muscle: 'ABS',
    instructions: {
      en: 'Rotate through the trunk under control. Do not turn the set into a loose arm swing.',
      es: 'Rota el tronco de forma controlada. No conviertas la serie en un balanceo libre de brazos.',
    },
  },
  {
    id: 'guts_seated_calf',
    name: { en: 'Seated Calf Raise', es: 'Elevación de Gemelos Sentado' },
    muscle: 'CALVES',
    instructions: {
      en: 'Use a consistent stretch and pause at the top. Progress the same setup over time.',
      es: 'Usa un estiramiento consistente y pausa arriba. Progresa el mismo setup con el tiempo.',
    },
  },
  {
    id: 'guts_smith_squat',
    name: { en: 'Smith Machine Squat', es: 'Sentadilla en Smith' },
    muscle: 'QUADS',
    instructions: {
      en: 'Choose a stance that lets you train the quads hard with a stable, repeatable path.',
      es: 'Elige una postura que permita entrenar fuerte los cuádriceps con una trayectoria estable y repetible.',
    },
  },
];
