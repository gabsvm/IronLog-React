// U5: hub panels and KONG Spanish copy / guide ids, moved verbatim from components/programs/ProgramHub.tsx.


export type HubPanel = 'home' | 'block' | 'principles' | 'rpe' | 'substitutions' | 'program' | 'progress';

export const ES_BLOCK_COPY: Record<number, { name: string; goal: string }> = {
  1: { name: 'Capacidad / Puntos débiles', goal: 'Puntos débiles primero · densidad · altas reps' },
  2: { name: 'Pirámides / Fuerza fatigada', goal: 'Compounds primero · pirámides tradicionales' },
  3: { name: 'Sobrecarga / Pirámides inversas', goal: 'Top sets frescos · backoffs de altas reps' },
};

export const ES_DAY_COPY: Record<number, string[]> = {
  1: ['Brazos y pecho', 'Cadena posterior y espalda', 'Brazos y hombros', 'Piernas y espalda'],
  2: ['Hombros y brazos', 'Cadena posterior y espalda', 'Pecho y brazos', 'Piernas y espalda'],
  3: ['Pressing y brazos', 'Peso muerto y espalda', 'Pecho y brazos', 'Sentadilla y espalda'],
};

export const PRINCIPLE_IDS = [
  'weak-points',
  'density',
  'volume',
  'high-reps',
  'fatigued-strength',
  'load-variation',
  'phase-potentiation',
] as const;

export const BLOCK_GUIDE_IDS: Record<number, string[]> = {
  1: ['weak-points', 'density', 'volume', 'high-reps'],
  2: ['fatigued-strength', 'load-variation', 'rpe'],
  3: ['phase-potentiation', 'load-variation', 'rpe'],
};
