export type NhSourceEvidenceKind = 'nh_principle' | 'inference' | 'gainslab_rule';
export type NhSourceLevel = 'understand' | 'modify' | 'build' | 'self_coach';

export interface NhSourceLesson {
  id: string;
  level: NhSourceLevel;
  kind: NhSourceEvidenceKind;
  title: { en: string; es: string };
  summary: { en: string; es: string };
  sourceScope: string;
}

export interface NhMassterplanStage {
  id: string;
  title: { en: string; es: string };
  prescription: { en: string; es: string };
  graduation: { en: string; es: string };
}

export interface NhMassterplanGuide {
  id: 'back' | 'shoulders' | 'forearms';
  title: { en: string; es: string };
  principle: { en: string; es: string };
  stages: NhMassterplanStage[];
  caveat: { en: string; es: string };
}

export const NH_TRANSCRIPT_LESSONS: NhSourceLesson[] = [
  {
    id: 'evolving-ceiling-not-target',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'The top of the bracket is a ceiling, not a target', es: 'El techo del rango es un límite, no una meta' },
    summary: {
      en: 'NH explicitly warns that waiting for every set to reach the top of an evolving range turns it back into a near-static prescription. A 4×8–12 does not require 12/12/12/12 before load can move.',
      es: 'NH advierte explícitamente que esperar que todas las series lleguen al techo convierte el rango evolutivo casi en una prescripción estática. Un 4×8–12 no exige 12/12/12/12 antes de mover la carga.',
    },
    sourceScope: 'When to progress forward with evolving rep ranges; How to use Evolving Rep Ranges for Hypertrophy.',
  },
  {
    id: 'evolving-rep-depreciation',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Rep depreciation is expected', es: 'La caída de reps entre series es esperable' },
    summary: {
      en: 'With hard evolving-range work, NH expects reps to fall as sets advance. Repeating the ceiling across many sets can indicate that the load increase was delayed or the earlier sets were sandbagged.',
      es: 'Con trabajo duro en rangos evolutivos, NH espera que las reps caigan a medida que avanzan las series. Repetir el techo durante muchas series puede indicar que el aumento de carga llegó tarde o que hubo sandbagging.',
    },
    sourceScope: 'When to progress forward with evolving rep ranges.',
  },
  {
    id: 'evolving-transition-is-learned',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Your transition signature is learned', es: 'Tu patrón de transición se aprende' },
    summary: {
      en: 'NH does not give one universal rep pattern that earns a load jump. The trainee learns which distribution of reps at the current load predicts that the next load can still land inside the bracket. A failed transition is feedback to revisit the jump, bracket or recovery.',
      es: 'NH no da un patrón universal de reps que “gane” una subida. El atleta aprende qué distribución con la carga actual predice que la siguiente carga seguirá entrando en el rango. Una transición fallida obliga a revisar salto, rango o recuperación.',
    },
    sourceScope: 'When to progress forward with evolving rep ranges.',
  },
  {
    id: 'bracket-controls-volume-intensity',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Bracket width manipulates volume and intensity', es: 'El ancho del rango manipula volumen e intensidad' },
    summary: {
      en: 'NH uses narrower brackets for more intensity-oriented work and wider brackets for more volume-oriented work. Wider ranges create more room to accumulate reps before a load jump; narrower ranges move faster but offer less cushioning.',
      es: 'NH usa rangos más estrechos para trabajo orientado a intensidad y más amplios para trabajo orientado a volumen. Los rangos amplios dan más espacio para acumular reps antes de subir; los estrechos avanzan más rápido pero ofrecen menos margen.',
    },
    sourceScope: 'How to use Evolving Rep Ranges for Hypertrophy.',
  },
  {
    id: 'keep-bracket-stable',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Keep the bracket stable long enough to test it', es: 'Mantené el rango estable el tiempo suficiente' },
    summary: {
      en: 'NH argues against constantly changing the rep bracket to rescue stalled progression. If a bracket truly does not fit, modify it, then commit to the new one. Flexibility is useful, but excessive flexibility makes programming unstable.',
      es: 'NH rechaza cambiar continuamente el rango para rescatar una progresión estancada. Si el rango realmente no sirve, se modifica y luego se mantiene. La flexibilidad sirve, pero demasiada flexibilidad vuelve inestable la programación.',
    },
    sourceScope: 'How to use Evolving Rep Ranges for Hypertrophy.',
  },
  {
    id: 'program-before-running',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Design first; edit rarely while running', es: 'Diseñá primero; editá poco durante la ejecución' },
    summary: {
      en: 'NH says program writing should take reflection time. Movements should work together, ranges should be assigned deliberately, and in-program changes should be rare, small and not create massive tonnage shifts. A beta test can be used to refine a range before committing.',
      es: 'NH dice que escribir un programa requiere reflexión. Los movimientos deben convivir, los rangos asignarse deliberadamente y los cambios durante la ejecución ser raros, pequeños y sin grandes saltos de tonelaje. Puede usarse una beta para afinar un rango antes de fijarlo.',
    },
    sourceScope: 'How to program evolving rep ranges.',
  },
  {
    id: 'variables-over-split-name',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Volume, intensity and frequency matter more than the split name', es: 'Volumen, intensidad y frecuencia importan más que el nombre del split' },
    summary: {
      en: 'NH describes templates such as PPL, full body or body-part splits mainly as frequency structures. The meaningful programming work is controlling volume, intensity and frequency and how they interact across days.',
      es: 'NH describe plantillas como PPL, full body o body-part split principalmente como estructuras de frecuencia. El trabajo real de programación es controlar volumen, intensidad y frecuencia y cómo interactúan entre días.',
    },
    sourceScope: 'How to program evolving rep ranges.',
  },
  {
    id: 'mix-volume-intensity',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Do not isolate volume and intensity into caricature days', es: 'No separes volumen e intensidad en días caricaturescos' },
    summary: {
      en: 'NH states a preference for mixing intensity-oriented and volume-oriented work within the same training environment rather than having days made only of very low-rep work or only of low-intensity volume.',
      es: 'NH expresa una preferencia por mezclar trabajo orientado a intensidad y a volumen dentro del mismo entorno de entrenamiento, en lugar de días compuestos sólo por reps muy bajas o sólo por volumen poco intenso.',
    },
    sourceScope: 'How to program evolving rep ranges. This is explicitly presented by NH as his bias/preference.',
  },
  {
    id: 'effort-before-biomechanics',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'A clever exercise still needs effort', es: 'Un ejercicio inteligente igual necesita esfuerzo' },
    summary: {
      en: 'NH argues that stability and biomechanics cannot replace proximity to failure and effort. A movement can be mechanically well targeted and still underperform if the trainee never learns to push it.',
      es: 'NH sostiene que estabilidad y biomecánica no reemplazan cercanía al fallo y esfuerzo. Un movimiento puede estar muy bien dirigido mecánicamente y aun rendir mal si el atleta nunca aprende a empujarlo.',
    },
    sourceScope: 'Hypertrophy training is CANCELLED.',
  },
  {
    id: 'compound-and-precision-balance',
    level: 'modify',
    kind: 'nh_principle',
    title: { en: 'Big movements and precise movements cover each other', es: 'Movimientos grandes y precisos se complementan' },
    summary: {
      en: 'NH criticizes taking stimulus-to-fatigue optimization so far that all demanding compounds disappear. He uses RDL vs leg curl and pull-up vs precise lat work to argue for combining global mass-building movements with lower-cost targeted work.',
      es: 'NH critica llevar la optimización estímulo/fatiga hasta eliminar todos los compuestos demandantes. Usa RDL vs leg curl y pull-up vs trabajo preciso de dorsales para defender combinar movimientos globales con trabajo localizado de menor costo.',
    },
    sourceScope: 'Hypertrophy training is CANCELLED.',
  },
  {
    id: 'strength-and-rom-serve-size',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Strength and range of motion serve hypertrophy', es: 'Fuerza y rango de movimiento sirven a la hipertrofia' },
    summary: {
      en: 'NH distinguishes bodybuilding from strength sport while still treating long-term strength progression and useful range of motion as qualities a good hypertrophy program should develop in service of muscle growth.',
      es: 'NH separa bodybuilding de deporte de fuerza, pero sigue tratando la progresión de fuerza a largo plazo y un rango de movimiento útil como cualidades que un buen programa de hipertrofia debe desarrollar al servicio del crecimiento.',
    },
    sourceScope: 'Hypertrophy training is CANCELLED.',
  },
];

export const NH_MASSTERPLAN_GUIDES: NhMassterplanGuide[] = [
  {
    id: 'back',
    title: { en: 'Big Back · 4 steps', es: 'Espalda grande · 4 pasos' },
    principle: {
      en: 'Start with one hinge, one vertical pull and one horizontal pull; add work only when work capacity and progression justify it. These are guidelines to integrate into an existing program, not a complete routine.',
      es: 'Empezá con un hinge, un tirón vertical y uno horizontal; agregá trabajo sólo cuando capacidad de trabajo y progresión lo justifiquen. Son guías para integrar en un programa existente, no una rutina completa.',
    },
    stages: [
      {
        id: 'back-1', title: { en: 'Step 1 · Minimum effective structure', es: 'Paso 1 · Estructura mínima efectiva' },
        prescription: { en: '3 movement families: hinge + vertical pull + horizontal pull. Up to ~12 weekly sets in the example. Keep the families separated enough to preserve quality.', es: '3 familias: hinge + tirón vertical + tirón horizontal. Hasta ~12 series semanales en el ejemplo. Separá las familias lo suficiente para preservar calidad.' },
        graduation: { en: 'Move on when the current work is clearly no longer enough and work capacity has grown.', es: 'Avanzá cuando el trabajo actual claramente deje de ser suficiente y haya crecido tu capacidad de trabajo.' },
      },
      {
        id: 'back-2', title: { en: 'Step 2 · Additions, not random rotation', es: 'Paso 2 · Adiciones, no rotación aleatoria' },
        prescription: { en: 'Add 2 movements, introduce them with 1–2 sets, and build toward coexistence of 5 weekly movements / roughly 10–20 sets without interference.', es: 'Agregá 2 movimientos, introducilos con 1–2 series y construí hasta que convivan 5 movimientos / aproximadamente 10–20 series sin interferencia.' },
        graduation: { en: 'All five can be trained consistently, recovered from and progressed.', es: 'Los cinco pueden entrenarse, recuperarse y progresar de forma consistente.' },
      },
      {
        id: 'back-3', title: { en: 'Step 3 · More volume only if needed', es: 'Paso 3 · Más volumen sólo si hace falta' },
        prescription: { en: 'Add one vertical/horizontal pull or shrug; keep hinges constrained, optionally rotate a hinge variation. Roughly 12–24 weekly sets in the example.', es: 'Agregá un tirón vertical/horizontal o shrug; mantené limitados los hinges y, si querés, rotá una variante. Aproximadamente 12–24 series semanales en el ejemplo.' },
        graduation: { en: 'If you keep progressing here, NH explicitly says you may stay here indefinitely.', es: 'Si seguís progresando acá, NH dice explícitamente que podés quedarte en este paso indefinidamente.' },
      },
      {
        id: 'back-4', title: { en: 'Step 4 · High-capacity ceiling', es: 'Paso 4 · Techo de alta capacidad' },
        prescription: { en: 'One more exercise plus rotations; roughly 14–28 weekly sets in the example. Never cram all back work into one day; NH gives a maximum of three back exercises per day in this stage.', es: 'Un ejercicio más más rotaciones; aproximadamente 14–28 series semanales en el ejemplo. No concentres toda la espalda en un día; NH da un máximo de tres ejercicios de espalda por día en esta etapa.' },
        graduation: { en: 'There is no requirement to reach this stage. Use only as much as necessary to keep growing.', es: 'No existe obligación de llegar a este paso. Usá sólo lo necesario para seguir creciendo.' },
      },
    ],
    caveat: { en: 'The set ranges are NH prescriptions for this MASSterplan, not universal scientific volume limits.', es: 'Los rangos de series son prescripciones de NH para este MASSterplan, no límites científicos universales.' },
  },
  {
    id: 'shoulders',
    title: { en: 'Big Shoulders · specialization framework', es: 'Hombros grandes · marco de especialización' },
    principle: {
      en: 'Choose movements you enjoy and can run for a long time: 1–2 vertical presses plus 2–3 shoulder elevations/isolations. Progress the same technique over time and distribute work for recovery.',
      es: 'Elegí movimientos que disfrutes y puedas sostener mucho tiempo: 1–2 presses verticales más 2–3 elevaciones/aislamientos. Progresá con la misma técnica y distribuí el trabajo para recuperar.',
    },
    stages: [
      {
        id: 'shoulders-novice', title: { en: 'Novice entry', es: 'Entrada novato' },
        prescription: { en: 'NH example: one vertical press + one isolation, 3–4 sets each once per week (6–8 total direct sets). One rep bracket per movement is enough.', es: 'Ejemplo NH: un press vertical + un aislamiento, 3–4 series cada uno una vez por semana (6–8 series directas totales). Un rango por movimiento alcanza.' },
        graduation: { en: 'Build skill, intensity tolerance and recovery before multiplying variations or weekly sets.', es: 'Construí técnica, tolerancia a la intensidad y recuperación antes de multiplicar variantes o series.' },
      },
      {
        id: 'shoulders-developed', title: { en: 'Developed specialization', es: 'Especialización desarrollada' },
        prescription: { en: 'NH suggests ~6–8 press sets and ~6–12 isolation sets as a working guideline, with 12–20 total shoulder sets discussed as a flexible range. He also describes his “one-half rule” as a scheduling guideline, not a law.', es: 'NH sugiere ~6–8 series de press y ~6–12 de aislamiento como guía, y comenta 12–20 series totales de hombro como rango flexible. Su “regla de la mitad” es una guía de distribución, no una ley.' },
        graduation: { en: 'Increase only as your own recovery and progression show that more work can be productively used.', es: 'Aumentá sólo cuando tu propia recuperación y progresión muestren que podés usar productivamente más trabajo.' },
      },
    ],
    caveat: { en: 'NH explicitly says this is not “copy my shoulder plan”; the framework is meant to be individualized.', es: 'NH dice explícitamente que esto no es “copiá mi plan de hombros”; el marco debe individualizarse.' },
  },
  {
    id: 'forearms',
    title: { en: 'Forearms · 7-step MASSterplan', es: 'Antebrazos · MASSterplan de 7 pasos' },
    principle: {
      en: 'Treat grip stamina as a budget. For hypertrophy, NH gradually shifts from incidental gripping toward direct wrist/elbow functions while trying not to steal recovery from back and posterior-chain training.',
      es: 'Tratà la resistencia de agarre como un presupuesto. Para hipertrofia, NH pasa gradualmente del agarre incidental a funciones directas de muñeca/codo sin robar recuperación a espalda y cadena posterior.',
    },
    stages: [
      {
        id: 'forearms-novice', title: { en: 'Novice · earn grip stamina', es: 'Novato · construí resistencia de agarre' },
        prescription: { en: 'Direct isolation can initially be zero or one enjoyable movement. If used: about 3–4 weekly sets, usually 6–12 reps; NH recommends keeping forearm work broadly between 6 and 15 reps.', es: 'El aislamiento directo puede ser inicialmente cero o un movimiento que disfrutes. Si lo usás: unas 3–4 series semanales, normalmente 6–12 reps; NH recomienda mantener el trabajo de antebrazo en general entre 6 y 15 reps.' },
        graduation: { en: 'Grip stamina is no longer the main limiter and direct work can coexist with pulling.', es: 'El agarre deja de ser el limitante principal y el trabajo directo puede convivir con los tirones.' },
      },
      {
        id: 'forearms-intermediate', title: { en: 'Intermediate · functions and frequency', es: 'Intermedio · funciones y frecuencia' },
        prescription: { en: 'Add 1–2 movements and train multiple functions: flexion, extension, pronation, supination and elbow-flexion hybrids. NH discusses roughly 6–12 isolation sets while prioritizing direct forearm work over exhausting grip-only work.', es: 'Agregá 1–2 movimientos y entrená varias funciones: flexión, extensión, pronación, supinación e híbridos de flexión de codo. NH comenta aproximadamente 6–12 series de aislamiento y prioriza trabajo directo sobre agotar el agarre por sí mismo.' },
        graduation: { en: 'Capacity to train forearms more often rises without impairing the rest of the program.', es: 'Aumenta la capacidad de entrenar antebrazos con mayor frecuencia sin perjudicar el resto del programa.' },
      },
      {
        id: 'forearms-advanced', title: { en: 'Advanced · high-frequency specialization', es: 'Avanzado · especialización de alta frecuencia' },
        prescription: { en: 'NH eventually allows very high frequency and many variations once stamina is exceptional. This is an advanced specialization endpoint, not a starting recommendation.', es: 'NH eventualmente permite frecuencia muy alta y muchas variantes cuando la resistencia es excepcional. Es un extremo avanzado de especialización, no una recomendación inicial.' },
        graduation: { en: 'There is no need to reach this stage; NH says many trainees may stay intermediate for years or forever.', es: 'No necesitás llegar a este punto; NH dice que muchos pueden quedarse años o para siempre en intermedio.' },
      },
    ],
    caveat: { en: 'Claims about very high advanced forearm volume are NH coaching prescriptions/observations, not universal evidence-based limits.', es: 'Las afirmaciones sobre volúmenes avanzados muy altos son prescripciones/observaciones de NH, no límites universales basados en evidencia.' },
  },
];

export type NhEvolvingCueStatus = 'below_range' | 'build' | 'transition_candidate' | 'late_transition';

export interface NhEvolvingCue {
  status: NhEvolvingCueStatus;
  ready: boolean;
  label: { en: string; es: string };
}

/**
 * Teaching heuristic built from NH's explicit examples, not a universal NH formula.
 * NH says the exact transition signature must be learned per lift/trainee.
 */
export function evaluateNhEvolvingRepCue(reps: number[], min: number, max: number): NhEvolvingCue {
  const clean = reps.filter(value => Number.isFinite(value) && value > 0);
  if (clean.length === 0 || clean.some(value => value < min)) {
    return {
      status: 'below_range', ready: false,
      label: {
        en: `Below the ${min}–${max} bracket · load, recovery or bracket needs review`,
        es: `Fuera del rango ${min}–${max} · revisá carga, recuperación o rango`,
      },
    };
  }

  const ceilingHits = clean.filter(value => value >= max).length;
  if (ceilingHits >= Math.min(2, clean.length) && clean.length > 1) {
    return {
      status: 'late_transition', ready: true,
      label: {
        en: 'Evolving reps · NH would have considered the load jump earlier; do not wait for every set to hit the ceiling',
        es: 'Evolving reps · NH habría considerado subir antes; no esperes que todas las series toquen el techo',
      },
    };
  }

  if (clean[0] >= max && clean.every(value => value >= min)) {
    return {
      status: 'transition_candidate', ready: true,
      label: {
        en: 'Transition candidate · try the smallest practical jump only if the next load should stay inside the bracket',
        es: 'Candidato a transición · probá el salto mínimo sólo si la siguiente carga debería seguir dentro del rango',
      },
    };
  }

  return {
    status: 'build', ready: false,
    label: {
      en: 'Evolving reps · keep the bracket and build a stronger transition signature',
      es: 'Evolving reps · mantené el rango y construí un patrón de transición más fuerte',
    },
  };
}
