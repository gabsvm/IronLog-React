export type KongDisplayText = { en: string; es: string };

const DAY_NAMES: Record<number, KongDisplayText[]> = {
  1: [
    { en: 'Day 1 · Arms & Chest', es: 'Día 1 · Brazos y pecho' },
    { en: 'Day 2 · Posterior & Back', es: 'Día 2 · Cadena posterior y espalda' },
    { en: 'Day 3 · Arms & Shoulders', es: 'Día 3 · Brazos y hombros' },
    { en: 'Day 4 · Legs & Back', es: 'Día 4 · Piernas y espalda' },
  ],
  2: [
    { en: 'Day 1 · Shoulders & Arms', es: 'Día 1 · Hombros y brazos' },
    { en: 'Day 2 · Posterior & Back', es: 'Día 2 · Cadena posterior y espalda' },
    { en: 'Day 3 · Chest & Arms', es: 'Día 3 · Pecho y brazos' },
    { en: 'Day 4 · Legs & Back', es: 'Día 4 · Piernas y espalda' },
  ],
  3: [
    { en: 'Day 1 · Pressing & Arms', es: 'Día 1 · Press y brazos' },
    { en: 'Day 2 · Deadlift & Back', es: 'Día 2 · Peso muerto y espalda' },
    { en: 'Day 3 · Chest & Arms', es: 'Día 3 · Pecho y brazos' },
    { en: 'Day 4 · Squat & Back', es: 'Día 4 · Sentadilla y espalda' },
  ],
};

const BLOCK_NAMES: Record<number, KongDisplayText> = {
  1: { en: 'Capacity / Weak Points', es: 'Capacidad / Puntos débiles' },
  2: { en: 'Pyramids / Fatigued Strength', es: 'Pirámides / Fuerza fatigada' },
  3: { en: 'Overload / Reverse Pyramids', es: 'Sobrecarga / Pirámides inversas' },
};

export function getKongDayDisplay(blockNumber: number, dayIndex: number): KongDisplayText {
  return DAY_NAMES[blockNumber]?.[dayIndex] || {
    en: `Day ${dayIndex + 1}`,
    es: `Día ${dayIndex + 1}`,
  };
}

export function getKongBlockDisplay(blockNumber: number): KongDisplayText {
  return BLOCK_NAMES[blockNumber] || {
    en: `Block ${blockNumber}`,
    es: `Bloque ${blockNumber}`,
  };
}
