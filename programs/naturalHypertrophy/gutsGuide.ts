import type { LocalizedText } from '../types';

export interface GutsGuideSection {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  points?: LocalizedText[];
}

const p = (en: string, es: string): LocalizedText => ({ en, es });

export const GUTS_GUIDE: GutsGuideSection[] = [
  {
    id: 'guts-identity',
    title: p('What GUTS is', 'Qué es GUTS'),
    summary: p(
      'Natural Hypertrophy built GUTS as a four-day intermediate-to-advanced physique program with a disproportionately strong upper body, arms, chest, shoulders, upper back, abs and neck, while keeping the legs athletic rather than making them the sole focus.',
      'Natural Hypertrophy construyó GUTS como un programa físico de cuatro días para nivel intermedio-avanzado, con un énfasis desproporcionado en torso, brazos, pecho, hombros, espalda alta, abdomen y cuello, manteniendo las piernas atléticas en lugar de convertirlas en el único foco.',
    ),
    points: [
      p('Black Swordsman is the heavy-compound variation currently implemented in GainsLab.', 'Black Swordsman es la variante de compuestos pesados implementada actualmente en GainsLab.'),
      p('The verified weekly rhythm is Upper 1 / Lower 1 / Upper 2 / Lower 2.', 'El ritmo semanal verificado es Torso 1 / Pierna 1 / Torso 2 / Pierna 2.'),
      p('The recommended layout is Monday, Wednesday, Friday and Saturday.', 'La distribución recomendada es lunes, miércoles, viernes y sábado.'),
    ],
  },
  {
    id: 'nh-85-rule',
    title: p('The 85% rule — productive work, not maximal exhaustion', 'Regla del 85% — trabajo productivo, no agotamiento máximo'),
    summary: p(
      'In Natural Hypertrophy’s framework, “85%” is not a percentage of one-rep max. It is a programming philosophy: do enough hard, relevant work to drive adaptation while preserving room to recover and repeat quality training.',
      'En el marco de Natural Hypertrophy, “85%” no es un porcentaje del 1RM. Es una filosofía de programación: hacer suficiente trabajo duro y relevante para adaptarte, conservando margen para recuperar y repetir entrenamiento de calidad.',
    ),
    points: [
      p('More fatigue is not automatically more productive bodybuilding.', 'Más fatiga no equivale automáticamente a más culturismo productivo.'),
      p('If a session routinely destroys the recovery window the schedule assumes, the workload and recovery schedule no longer match.', 'Si una sesión destruye de forma habitual la ventana de recuperación que presupone el calendario, la carga y la recuperación dejaron de coincidir.'),
      p('Progress should keep training hard without requiring every exposure to be maximal.', 'La progresión debe mantener el entrenamiento duro sin exigir que cada exposición sea máxima.'),
    ],
  },
  {
    id: 'nh-evolving-reps',
    title: p('Evolving rep ranges', 'Rangos de repeticiones evolutivos'),
    summary: p(
      'Do not force identical repetitions across every set. Keep the load stable and accumulate useful repetitions inside the prescribed range. A set pattern such as 8/7/6 can mature over several exposures before a small load increase resets the repetitions lower.',
      'No fuerces repeticiones idénticas en todas las series. Mantén estable la carga y acumula repeticiones útiles dentro del rango prescrito. Un patrón como 8/7/6 puede madurar durante varias exposiciones antes de que un pequeño aumento de carga vuelva a bajar las repeticiones.',
    ),
    points: [
      p('First priority: add clean repetitions with the same load.', 'Primera prioridad: añadir repeticiones limpias con la misma carga.'),
      p('A small load increase is earned after the range has clearly matured; it is not scheduled by the calendar.', 'Un aumento pequeño de carga se gana cuando el rango ha madurado claramente; no ocurre porque cambió la semana.'),
      p('After increasing load, rebuilding repetitions is expected and is not regression.', 'Después de subir la carga, reconstruir repeticiones es esperado y no es una regresión.'),
    ],
  },
  {
    id: 'nh-evolving-sets',
    title: p('Evolving sets are advanced, not automatic', 'Las series evolutivas son avanzadas, no automáticas'),
    summary: p(
      'Natural Hypertrophy also uses set progression, but it is a more advanced lever. GainsLab does not automatically add sets to GUTS v1 because a fixed public roster already provides substantial volume and because adding volume without a clear need undermines the 85% principle.',
      'Natural Hypertrophy también utiliza progresión de series, pero es una herramienta más avanzada. GainsLab no añade series automáticamente en GUTS v1 porque el roster público ya aporta un volumen considerable y porque sumar volumen sin una necesidad clara contradice el principio del 85%.',
    ),
    points: [
      p('Repetitions are the first progression lever.', 'Las repeticiones son la primera herramienta de progresión.'),
      p('Sets may be added later only when there is a specific reason and recovery supports it.', 'Las series pueden añadirse más adelante solo cuando exista una razón específica y la recuperación lo permita.'),
      p('Do not turn every muscle into a specialization project at once.', 'No conviertas todos los músculos en un proyecto de especialización al mismo tiempo.'),
    ],
  },
  {
    id: 'nh-failure',
    title: p('Failure has an exercise-specific price', 'El fallo tiene un precio distinto según el ejercicio'),
    summary: p(
      'GUTS should be trained hard, but Natural Hypertrophy’s modern philosophy treats failure as a tool whose value depends on its recovery cost. Heavy compounds and inexpensive isolation work do not need the same rule.',
      'GUTS debe entrenarse duro, pero la filosofía moderna de Natural Hypertrophy trata el fallo como una herramienta cuyo valor depende de su costo de recuperación. Un compuesto pesado y un aislamiento barato no necesitan la misma regla.',
    ),
    points: [
      p('On heavy bench, weighted chins, RDLs and deadlifts, preserve technique and avoid turning every set into a maximal grind.', 'En banca pesada, dominadas lastradas, RDL y peso muerto, conserva la técnica y evita convertir cada serie en un grind máximo.'),
      p('Low-cost isolation work can be pushed closer to failure when it does not compromise the next relevant session.', 'Los aislamientos de bajo costo pueden acercarse más al fallo cuando no comprometen la siguiente sesión relevante.'),
      p('The useful question is not “can I fail?” but “can I justify the recovery cost?”', 'La pregunta útil no es “¿puedo llegar al fallo?”, sino “¿puedo justificar el costo de recuperación?”.'),
    ],
  },
  {
    id: 'nh-supersets',
    title: p('Supersets are part of the architecture', 'Las superseries son parte de la arquitectura'),
    summary: p(
      'The public GUTS roster deliberately pairs exercises. GainsLab preserves those pairings and only starts the round rest after every member of the pair or giant set has caught up.',
      'El roster público de GUTS empareja ejercicios deliberadamente. GainsLab conserva esas parejas y solo inicia el descanso de la ronda cuando todos los miembros de la superserie o giant set han completado esa ronda.',
    ),
    points: [
      p('Move between paired exercises with little unnecessary delay, then recover before repeating the round.', 'Pasa entre ejercicios emparejados sin demoras innecesarias y luego recupera antes de repetir la ronda.'),
      p('Do not rush a heavy compound simply because its partner is an easier isolation movement.', 'No apresures un compuesto pesado solo porque su pareja sea un aislamiento más sencillo.'),
      p('If the pairing materially degrades the target lift, extend the between-round recovery.', 'Si la pareja degrada de forma importante el ejercicio objetivo, alarga la recuperación entre rondas.'),
    ],
  },
  {
    id: 'nh-recovery-schedule',
    title: p('Frequency is a recovery schedule', 'La frecuencia es un calendario de recuperación'),
    summary: p(
      'The recommended GUTS week places recovery where the workload needs it: two separated early sessions, then a Friday/Saturday back-to-back pair before the longer weekend-to-Monday recovery.',
      'La semana recomendada de GUTS coloca la recuperación donde la carga la necesita: dos sesiones separadas al principio y luego viernes/sábado consecutivos antes de una recuperación más larga hasta el lunes.',
    ),
    points: [
      p('Do not add training days merely to make the program look more advanced.', 'No añadas días de entrenamiento solo para que el programa parezca más avanzado.'),
      p('If recovery repeatedly exceeds the schedule, reduce the cost before pretending recovery is irrelevant.', 'Si la recuperación supera repetidamente el calendario, reduce el costo antes de fingir que la recuperación no importa.'),
    ],
  },
  {
    id: 'nh-stability',
    title: p('Keep the roster stable long enough to progress', 'Mantén el roster estable el tiempo suficiente para progresar'),
    summary: p(
      'Natural Hypertrophy explicitly discourages beginners to GUTS from rotating the two program variants immediately. Pick the relevant movement where an “OR” exists and keep it long enough to build a meaningful progression history.',
      'Natural Hypertrophy desaconseja que quien recién empieza GUTS rote inmediatamente las dos variantes del programa. Elige el movimiento correspondiente cuando exista un “OR” y mantenlo el tiempo suficiente para construir un historial de progresión útil.',
    ),
    points: [
      p('Novelty is not progressive overload.', 'La novedad no es sobrecarga progresiva.'),
      p('Change an exercise for a real reason: tolerance, equipment, poor stimulus or a genuine long-term stall.', 'Cambia un ejercicio por una razón real: tolerancia, equipamiento, mal estímulo o un estancamiento auténtico y prolongado.'),
      p('Berserker Armor can be added later as an alternate roster once its exact template is available and the first variation has been thoroughly learned.', 'Berserker Armor puede añadirse después como roster alternativo cuando tengamos su plantilla exacta y la primera variante esté completamente aprendida.'),
    ],
  },
  {
    id: 'guts-source-scope',
    title: p('What GainsLab preserves—and what it does not invent', 'Qué preserva GainsLab y qué no inventa'),
    summary: p(
      'Boostcamp publicly exposes the complete Week 1 Black Swordsman roster and identifies the program as a 12-week block, while its Weeks 2–12 targets and full coaching notes live inside the app. GainsLab preserves the verified exercise roster, sets, ranges and supersets for the 12-week run and applies Natural Hypertrophy’s documented evolving-rep philosophy instead of fabricating hidden week-by-week prescriptions.',
      'Boostcamp expone públicamente el roster completo de la Semana 1 de Black Swordsman e identifica el programa como un bloque de 12 semanas, mientras que los objetivos de las Semanas 2–12 y las notas completas del entrenador viven dentro de la app. GainsLab conserva durante las 12 semanas el roster, series, rangos y superseries verificadas y aplica la filosofía documentada de repeticiones evolutivas de Natural Hypertrophy en lugar de inventar prescripciones semanales ocultas.',
    ),
  },
];
