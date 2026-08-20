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

export interface NhSelfProgrammingStage {
  id: string;
  title: { en: string; es: string };
  action: { en: string; es: string };
  reason: { en: string; es: string };
  sourceStatus: 'verified' | 'missing_followup';
}

export const NH_TRANSCRIPT_LESSONS: NhSourceLesson[] = [
  {
    id: 'evolving-ceiling-not-target',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'The top of the bracket is a ceiling, not a repeated target', es: 'El techo del rango es un límite, no una meta repetida' },
    summary: {
      en: 'NH explicitly warns that forcing every set to reach the top of an evolving range turns it back toward a static prescription. The load can move once the distribution predicts that the next load will still land inside the bracket.',
      es: 'NH advierte explícitamente que forzar todas las series al techo vuelve el rango evolutivo hacia una prescripción estática. La carga puede subir cuando la distribución predice que la siguiente carga seguirá entrando en el rango.',
    },
    sourceScope: 'When to progress forward with evolving rep ranges; How to use Evolving Rep Ranges for Hypertrophy; Unlimited Hypertrophy Method.',
  },
  {
    id: 'evolving-rep-depreciation',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Rep depreciation is expected', es: 'La caída de reps entre series es esperable' },
    summary: {
      en: 'With hard evolving-range work, NH expects reps to fall as sets advance. Repeating the ceiling across many sets can mean the load jump was delayed or earlier work was sandbagged.',
      es: 'Con trabajo duro en rangos evolutivos, NH espera que las reps caigan a medida que avanzan las series. Repetir el techo durante muchas series puede indicar que la subida llegó tarde o que hubo sandbagging.',
    },
    sourceScope: 'When to progress forward with evolving rep ranges.',
  },
  {
    id: 'evolving-transition-is-learned',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Your transition signature is learned', es: 'Tu patrón de transición se aprende' },
    summary: {
      en: 'NH does not give one universal rep pattern that earns a load jump. You learn which distribution at the current load predicts that the next load can still stay inside the bracket. A failed transition is feedback about the jump, bracket or recovery.',
      es: 'NH no da un patrón universal de reps que “gane” una subida. Aprendés qué distribución con la carga actual predice que la siguiente seguirá dentro del rango. Una transición fallida da información sobre el salto, el rango o la recuperación.',
    },
    sourceScope: 'When to progress forward with evolving rep ranges.',
  },
  {
    id: 'bracket-controls-volume-intensity',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Bracket width manipulates volume and intensity', es: 'El ancho del rango manipula volumen e intensidad' },
    summary: {
      en: 'NH uses narrower brackets for more intensity-oriented work and wider brackets for more volume-oriented work. Wider ranges create more room to accumulate reps before a load jump; narrow ranges demand more conservative jumps.',
      es: 'NH usa rangos más estrechos para trabajo orientado a intensidad y más amplios para trabajo orientado a volumen. Los rangos amplios dan más espacio para acumular reps; los estrechos exigen saltos de carga más conservadores.',
    },
    sourceScope: 'How to use Evolving Rep Ranges for Hypertrophy; Unlimited Hypertrophy Method.',
  },
  {
    id: 'keep-bracket-stable',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Keep the bracket stable long enough to test it', es: 'Mantené el rango estable el tiempo suficiente' },
    summary: {
      en: 'NH argues against constantly changing the rep bracket to rescue progression. If a bracket truly does not fit, modify it, then commit to the new one. Flexibility is useful; excessive flexibility makes programming unstable.',
      es: 'NH rechaza cambiar continuamente el rango para rescatar la progresión. Si realmente no sirve, se modifica y luego se mantiene. La flexibilidad sirve; demasiada flexibilidad vuelve inestable la programación.',
    },
    sourceScope: 'How to use Evolving Rep Ranges for Hypertrophy.',
  },
  {
    id: 'evolving-sets-two-to-four',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Evolving sets are a second lever, not an excuse for endless volume', es: 'Las series evolutivas son una segunda palanca, no una excusa para volumen infinito' },
    summary: {
      en: 'In the Unlimited Hypertrophy method NH uses set count to keep a heavier transition inside the rep bracket, for example dropping from three sets to two after a load jump and rebuilding the third later. He recommends roughly two to four evolving sets so progression does not become excessively slow.',
      es: 'En Unlimited Hypertrophy NH usa el número de series para mantener una transición pesada dentro del rango; por ejemplo bajar de tres a dos series al subir carga y reconstruir la tercera después. Recomienda aproximadamente dos a cuatro series evolutivas para que la progresión no se vuelva excesivamente lenta.',
    },
    sourceScope: 'Unlimited Hypertrophy Method. This 2–4 range is NH coaching guidance, not a universal scientific limit.',
  },
  {
    id: '85-not-literal-load',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: '85 is a balancing metaphor, not 85% of 1RM', es: '85 es una metáfora de equilibrio, no 85% del 1RM' },
    summary: {
      en: 'NH explicitly says the 85% Rule is not an instruction to train at 85% load all the time. The number represents a balanced average state: hard enough to accumulate quality work, but not so extreme that fatigue or low-quality volume destabilizes the program.',
      es: 'NH dice explícitamente que la Regla del 85% no ordena entrenar siempre con 85% de carga. El número representa un estado medio equilibrado: suficientemente duro para acumular trabajo de calidad, pero sin que la fatiga o el volumen de baja calidad desestabilicen el programa.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule).',
  },
  {
    id: '85-not-minimalism',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: '“Just enough” is not minimalism', es: '“Lo justo” no es minimalismo' },
    summary: {
      en: 'NH positions the 85% Rule between minimalism and maximalism. He wants unnecessary work removed without accepting a deliberately reduced result. The objective is to maximize productive work, not simply minimize time or sets.',
      es: 'NH coloca la Regla del 85% entre minimalismo y maximalismo. Quiere eliminar trabajo innecesario sin aceptar deliberadamente menos resultado. El objetivo es maximizar trabajo productivo, no simplemente minimizar tiempo o series.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule).',
  },
  {
    id: '85-step-loading-order',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Progress reps, then sets, then load', es: 'Progresa reps, después series y después carga' },
    summary: {
      en: 'Within his 85% framework NH describes conservative step loading: first add repetitions inside the evolving range, then add a set when justified, and finally add load. After the load jump, reps and/or sets can fall and be rebuilt. Large simultaneous jumps are discouraged.',
      es: 'Dentro de su marco del 85%, NH describe un step loading conservador: primero añadir repeticiones dentro del rango, luego una serie cuando se justifique y finalmente carga. Después del salto de carga pueden bajar reps y/o series para reconstruirse. Desaconseja saltos grandes simultáneos.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule).',
  },
  {
    id: '85-frequency-recovery-budget',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Frequency is a recovery budget', es: 'La frecuencia es un presupuesto de recuperación' },
    summary: {
      en: 'NH says frequency should match the work and recovery window you planned. If Monday work destroys Tuesday performance, the schedule or dose was mismatched; if a small dose is followed by an unnecessarily long gap, the opposite mismatch can occur.',
      es: 'NH dice que la frecuencia debe corresponder al trabajo y a la ventana de recuperación planificada. Si el trabajo del lunes destruye el rendimiento del martes, calendario o dosis no coincidieron; si una dosis pequeña recibe un descanso innecesariamente largo puede ocurrir el desajuste contrario.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule). This is NH programming logic, not a fixed universal recovery-hour rule.',
  },
  {
    id: '85-failure-cost-scales',
    level: 'modify',
    kind: 'nh_principle',
    title: { en: 'Failure cost scales with the exercise', es: 'El costo del fallo cambia según el ejercicio' },
    summary: {
      en: 'NH distinguishes a high-systemic-cost lift from a low-cost isolation. He argues that hard deadlift/squat-style work deserves more conservative fatigue management, while curls or raises can often be pushed harder if the recovery cost remains easy to justify.',
      es: 'NH distingue un ejercicio de alto costo sistémico de un aislamiento barato. Sostiene que trabajo duro tipo deadlift/squat merece manejo de fatiga más conservador, mientras curls o elevaciones suelen poder empujarse más si el costo de recuperación sigue siendo justificable.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule); Hypertrophy training is CANCELLED.',
  },
  {
    id: '85-rep-zone-author-guideline',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'NH keeps most bodybuilding work in a moderate rep neighborhood', es: 'NH mantiene la mayor parte del bodybuilding en una zona moderada de reps' },
    summary: {
      en: 'In the 85% lecture NH says most physique trainees should live mostly around 6–12 reps, with roughly 3–4 as a lower edge and 15–20 as an upper edge. Treat these as his programming guidelines, not scientific universal cutoffs.',
      es: 'En la clase del 85% NH dice que la mayoría de quienes entrenan por estética deberían vivir principalmente alrededor de 6–12 reps, con aproximadamente 3–4 como borde inferior y 15–20 como superior. Son sus guías de programación, no cortes científicos universales.',
    },
    sourceScope: 'How to Get Bigger by Doing Less (The 85% Rule). Author prescription, not universal evidence-based limit.',
  },
  {
    id: 'program-before-running',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Design first; edit rarely while running', es: 'Diseñá primero; editá poco durante la ejecución' },
    summary: {
      en: 'NH says program writing should take reflection time. Movements should work together, ranges should be assigned deliberately, and in-program changes should be rare, small and not create massive tonnage shifts. Beta testing can refine details before a long-term version is trusted.',
      es: 'NH dice que escribir un programa requiere reflexión. Los movimientos deben convivir, los rangos asignarse deliberadamente y los cambios durante la ejecución ser raros, pequeños y sin grandes saltos de tonelaje. El beta testing puede afinar detalles antes de confiar en una versión de largo plazo.',
    },
    sourceScope: 'How to program evolving rep ranges; How to program your training yourself. Exact alpha/beta protocol is still missing because NH explicitly assigns it to Part 3.',
  },
  {
    id: 'self-program-exercise-list',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Your exercise list is the backbone', es: 'Tu lista de ejercicios es la columna vertebral' },
    summary: {
      en: 'For a first self-written program NH says to build from lifts you have already practiced regularly for at least about three months, that do not hurt, that you connect with and that have already produced progress. Novel exercises come later.',
      es: 'Para un primer programa propio NH dice construir desde ejercicios que ya practicás regularmente desde hace al menos unos tres meses, que no duelan, con los que conectes y que ya hayan producido progreso. Los ejercicios novedosos vienen después.',
    },
    sourceScope: 'How to program your training yourself, Part 2.',
  },
  {
    id: 'self-program-template-frame',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'The split is the frame; exercises are the pieces', es: 'El split es el marco; los ejercicios son las piezas' },
    summary: {
      en: 'NH describes the template as the frame of a puzzle, the exercises as its pieces, and volume/intensity/frequency as how the pieces are arranged. For a first self-written program he personally favors restrictive/simple frames such as full body or PPL; that recommendation is his preference, not a universal law.',
      es: 'NH describe la plantilla como el marco de un rompecabezas, los ejercicios como sus piezas y volumen/intensidad/frecuencia como la forma de ordenarlas. Para un primer programa propio prefiere marcos simples/restrictivos como full body o PPL; es su preferencia, no una ley universal.',
    },
    sourceScope: 'How to program your training yourself, Part 2.',
  },
  {
    id: 'self-program-match-old-dose',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Do not shock yourself when moving from novice to intermediate', es: 'No te des un shock al pasar de novato a intermedio' },
    summary: {
      en: 'NH advises the first self-written program to resemble the program that already worked: keep initial tonnage, rep ranges and workload reasonably close, then ramp later. He specifically warns that a sudden intermediate-volume jump can crash a trainee who came from a low-volume novice plan.',
      es: 'NH aconseja que el primer programa propio se parezca al que ya funcionaba: mantener tonelaje, rangos y carga de trabajo iniciales razonablemente cerca y aumentar después. Advierte específicamente que un salto brusco de volumen al pasar a intermedio puede hacer chocar a quien venía de un plan novato de poco volumen.',
    },
    sourceScope: 'How to program your training yourself, Part 2.',
  },
  {
    id: 'self-program-incubation',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Write it while you are still learning, then let it incubate', es: 'Escribilo mientras aprendés y dejalo incubar' },
    summary: {
      en: 'NH recommends drafting the next program while still running the current novice program, putting the draft aside, and revisiting it occasionally as knowledge and experience accumulate. He warns against obsessively adding things; the draft should evolve in small steps.',
      es: 'NH recomienda redactar el próximo programa mientras todavía ejecutás el programa novato actual, dejar el borrador a un lado y revisarlo ocasionalmente a medida que acumulás conocimiento y experiencia. Advierte contra agregar cosas obsesivamente; el borrador debe evolucionar de a poco.',
    },
    sourceScope: 'How to program your training yourself, Part 2.',
  },
  {
    id: 'self-program-own-program',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'The end goal is to know how to program for yourself', es: 'La meta final es saber programarte vos mismo' },
    summary: {
      en: 'NH explicitly argues that lifters with the best long-term natural development tend to program for themselves. His reasoning is not that coaches know nothing, but that once the trainee gains enough programming knowledge, nobody has more empirical knowledge of that trainee than the trainee.',
      es: 'NH sostiene explícitamente que los atletas con mejor desarrollo natural a largo plazo tienden a programarse a sí mismos. Su razonamiento no es que los coaches no sepan, sino que una vez adquirido suficiente conocimiento de programación nadie posee más conocimiento empírico del atleta que el propio atleta.',
    },
    sourceScope: 'How to program your training yourself, Part 2. This is NH coaching philosophy, not a scientific comparative claim.',
  },
  {
    id: 'self-program-long-refinement',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'A mature personal program can take years to refine', es: 'Un programa personal maduro puede tardar años en refinarse' },
    summary: {
      en: 'NH describes a “final program” as a long-refined system whose exercises, volume and intensity have been repeatedly tested. He reports that his own process took years. GainsLab should therefore teach iteration, not promise a perfect routine after one wizard.',
      es: 'NH describe un “programa final” como un sistema refinado durante mucho tiempo, con ejercicios, volumen e intensidad repetidamente probados. Cuenta que su propio proceso tomó años. Por eso GainsLab debe enseñar iteración, no prometer una rutina perfecta después de un solo asistente.',
    },
    sourceScope: 'How to program your training yourself, Part 2. The duration is NH personal experience, not a required timeline.',
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
      en: 'NH states a preference for mixing intensity-oriented and volume-oriented work rather than building days made only of very low-rep work or only of low-intensity volume.',
      es: 'NH expresa una preferencia por mezclar trabajo orientado a intensidad y a volumen en lugar de construir días compuestos sólo por reps muy bajas o sólo por volumen poco intenso.',
    },
    sourceScope: 'How to program evolving rep ranges. Explicit NH preference/bias.',
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
  {
    id: 'plateau-do-not-dodge',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Do not swap exercises merely to dodge a hard plateau', es: 'No cambies ejercicios sólo para esquivar un plateau difícil' },
    summary: {
      en: 'NH warns that replacing a stalled lift with a novel one can create the illusion of progress because neurological learning is fast. He wants the trainee to keep the lift long enough to determine whether the difficult period is productive adaptation or a real plateau.',
      es: 'NH advierte que reemplazar un ejercicio estancado por uno novedoso puede crear una ilusión de progreso porque el aprendizaje neurológico es rápido. Quiere mantener el ejercicio el tiempo suficiente para distinguir una etapa difícil productiva de un plateau real.',
    },
    sourceScope: 'Unlimited Hypertrophy Method.',
  },
  {
    id: 'plateau-two-three-exposures',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Two or three repeated hard exposures can still be normal', es: 'Dos o tres exposiciones duras repetidas todavía pueden ser normales' },
    summary: {
      en: 'NH says retaking approximately the same load and reps for two or three sessions can simply mean the exercise is finally challenging enough to force adaptation. He calls a longer persistence a legitimate plateau. GainsLab therefore should not panic after a single flat session.',
      es: 'NH dice que repetir aproximadamente la misma carga y reps durante dos o tres sesiones puede significar simplemente que el ejercicio por fin es lo bastante desafiante para forzar adaptación. Una persistencia más larga sí la llama plateau legítimo. GainsLab no debería alarmarse por una sola sesión plana.',
    },
    sourceScope: 'Unlimited Hypertrophy Method. “Approximately the same reps” still requires product interpretation; exact tolerance is a GainsLab implementation detail.',
  },
  {
    id: 'variation-after-plateau',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Add a variation because the main lift needs help, not because you are bored', es: 'Agregá una variante porque el ejercicio principal necesita ayuda, no por aburrimiento' },
    summary: {
      en: 'In Unlimited Hypertrophy NH recommends introducing a variation when an evolving-range movement repeatedly plateaus. The variation should contribute relevant volume while the original lift remains healthy; if the main lift gets worse, the addition may be unnecessary or too large.',
      es: 'En Unlimited Hypertrophy NH recomienda introducir una variante cuando un movimiento con rango evolutivo entra repetidamente en plateau. La variante debe aportar volumen relevante sin perjudicar al ejercicio principal; si el principal empeora, la adición puede ser innecesaria o excesiva.',
    },
    sourceScope: 'Unlimited Hypertrophy Method.',
  },
  {
    id: 'variation-enter-small',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Introduce a variation with a small dose', es: 'Introducí una variante con una dosis pequeña' },
    summary: {
      en: 'NH suggests starting a newly added variation with about one to two sets, around half the original movement’s set/volume contribution, then building it gradually with evolving sets if performance and recovery support it.',
      es: 'NH sugiere empezar una variante nueva con aproximadamente una o dos series, cerca de la mitad del aporte de series/volumen del movimiento original, y aumentarla gradualmente con series evolutivas si rendimiento y recuperación lo permiten.',
    },
    sourceScope: 'Unlimited Hypertrophy Method. These numbers are NH coaching prescriptions.',
  },
  {
    id: 'variation-soft-hard',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Specificity has soft and hard variations', es: 'La especificidad tiene variantes suaves y duras' },
    summary: {
      en: 'NH distinguishes soft variations that remain very close to the original movement from hard variations that train the target muscle through a more different pattern. Hard variations can provide different volume/intensity and joint exposure, but too many dilute practice and make the program hard to read.',
      es: 'NH distingue variantes suaves muy cercanas al movimiento original de variantes duras que entrenan el músculo mediante un patrón más diferente. Las duras pueden aportar otro volumen/intensidad y otra exposición articular, pero demasiadas diluyen la práctica y vuelven el programa difícil de leer.',
    },
    sourceScope: 'Unlimited Hypertrophy Method.',
  },
  {
    id: 'variation-count-author-guideline',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Variation count rises with experience', es: 'La cantidad de variantes aumenta con la experiencia' },
    summary: {
      en: 'NH gives his own rough numbers for hard variations: about 0–1 for novices, 1–2 for intermediates and 3–5 for advanced lifters, while emphasizing that fewer is better whenever progression works without them.',
      es: 'NH da sus propios números aproximados para variantes duras: 0–1 para novatos, 1–2 para intermedios y 3–5 para avanzados, enfatizando que menos es mejor siempre que la progresión funcione sin ellas.',
    },
    sourceScope: 'Unlimited Hypertrophy Method. Explicitly NH opinion/guideline, not a scientific standard.',
  },
  {
    id: 'deload-prevent-before-week',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'NH prefers preventing the need for a scheduled deload week', es: 'NH prefiere evitar necesitar una semana de deload programada' },
    summary: {
      en: 'In his deload lecture NH argues that a bodybuilding program should manage fatigue before a planned deload becomes necessary. He rejects borrowing a powerlifting-style week of very light work merely because the calendar says so.',
      es: 'En su clase sobre deload NH sostiene que un programa de bodybuilding debe manejar la fatiga antes de que haga falta una semana programada de descarga. Rechaza copiar una semana muy liviana estilo powerlifting sólo porque lo diga el calendario.',
    },
    sourceScope: 'Why I never deload (and why you should not either). This is NH philosophy, not a universal medical/sports-science rule.',
  },
  {
    id: 'deload-bodypart-autoregulation',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'His “bodybuilding deload” is muscle-specific autoregulation', es: 'Su “deload de bodybuilding” es autoregulación por músculo' },
    summary: {
      en: 'Instead of a global deload week, NH describes adjusting per-muscle exposure through frequency, evolving reps/sets, back-off work and eventually exercise rotations. A body part can receive less or no work while other recovered areas keep training.',
      es: 'En vez de una semana global de descarga, NH describe ajustar la exposición por músculo mediante frecuencia, reps/series evolutivas, back-offs y eventualmente rotaciones. Una zona puede recibir menos o ningún trabajo mientras otras áreas recuperadas siguen entrenando.',
    },
    sourceScope: 'Why I never deload (and why you should not either). Advanced autoregulation in this video is explicitly described as not suitable for everyone immediately.',
  },
  {
    id: 'deload-safety-boundary',
    level: 'self_coach',
    kind: 'gainslab_rule',
    title: { en: 'GainsLab never turns “never deload” into an absolute command', es: 'GainsLab nunca convierte “nunca hagas deload” en una orden absoluta' },
    summary: {
      en: 'NH is making a bodybuilding-programming argument against scheduled powerlifting-style deloads. GainsLab must preserve that position without using it to override pain, injury, illness, medical advice or clearly abnormal performance/recovery signals.',
      es: 'NH hace un argumento de programación de bodybuilding contra deloads programados estilo powerlifting. GainsLab debe preservar esa postura sin usarla para ignorar dolor, lesión, enfermedad, indicaciones médicas o señales claramente anormales de rendimiento/recuperación.',
    },
    sourceScope: 'Product safety boundary around Why I never deload. This boundary is GainsLab policy, not an NH quote.',
  },
];

export const NH_SELF_PROGRAMMING_PATH: NhSelfProgrammingStage[] = [
  {
    id: 'inventory',
    title: { en: '1 · Build your lift inventory', es: '1 · Construí tu inventario de ejercicios' },
    action: { en: 'List movements you have practiced regularly for ~3 months or more, that do not hurt and have already worked for you.', es: 'Listá movimientos que practicás regularmente desde hace ~3 meses o más, que no duelan y que ya te hayan funcionado.' },
    reason: { en: 'NH calls this list the backbone of the first self-written program.', es: 'NH llama a esta lista la columna vertebral del primer programa propio.' },
    sourceStatus: 'verified',
  },
  {
    id: 'frame',
    title: { en: '2 · Choose the frame', es: '2 · Elegí el marco' },
    action: { en: 'Choose a split/template that makes the exercise puzzle easy to organize. NH personally recommends simpler/restrictive templates for the first attempt.', es: 'Elegí un split/plantilla que haga fácil ordenar el rompecabezas de ejercicios. NH personalmente recomienda plantillas simples/restrictivas para el primer intento.' },
    reason: { en: 'The template mainly constrains frequency and gives each exercise a logical place.', es: 'La plantilla principalmente restringe la frecuencia y le da un lugar lógico a cada ejercicio.' },
    sourceStatus: 'verified',
  },
  {
    id: 'match-dose',
    title: { en: '3 · Match the dose that already works', es: '3 · Igualá la dosis que ya funciona' },
    action: { en: 'Keep the starting tonnage, rep ranges and overall workload reasonably close to the novice program you are leaving.', es: 'Mantené tonelaje, rangos y carga total inicial razonablemente cerca del programa novato que estás dejando.' },
    reason: { en: 'NH wants to avoid a sudden novice-to-intermediate workload shock.', es: 'NH quiere evitar un shock brusco de carga al pasar de novato a intermedio.' },
    sourceStatus: 'verified',
  },
  {
    id: 'minimal-skeleton',
    title: { en: '4 · Write a minimal skeleton', es: '4 · Escribí un esqueleto mínimo' },
    action: { en: 'Use breadwinner movements and only the accessories/variations you can already justify. Copy known rep ranges if needed.', es: 'Usá movimientos ganadores y sólo accesorios/variantes que ya puedas justificar. Copiá rangos conocidos si hace falta.' },
    reason: { en: 'The first goal is to learn programming, not to display advanced complexity.', es: 'La primera meta es aprender a programar, no demostrar complejidad avanzada.' },
    sourceStatus: 'verified',
  },
  {
    id: 'incubate',
    title: { en: '5 · Let the draft incubate', es: '5 · Dejá incubar el borrador' },
    action: { en: 'Keep running the current program while revisiting the future draft occasionally and making small evidence-based changes.', es: 'Seguí ejecutando el programa actual mientras revisás ocasionalmente el borrador futuro y hacés cambios pequeños con fundamento.' },
    reason: { en: 'NH explicitly separates writing the program from actually jumping onto it.', es: 'NH separa explícitamente escribir el programa de empezar a ejecutarlo.' },
    sourceStatus: 'verified',
  },
  {
    id: 'launch',
    title: { en: '6 · Launch when you are ready to learn from it', es: '6 · Lanzalo cuando estés listo para aprender de él' },
    action: { en: 'Accept that the first self-written program will contain mistakes; the programming skill is part of the long-term adaptation.', es: 'Aceptá que el primer programa propio tendrá errores; la habilidad de programar forma parte de la adaptación a largo plazo.' },
    reason: { en: 'NH argues the learning value is worth more than trying to preserve a supposedly perfect novice transition forever.', es: 'NH sostiene que el valor de aprender supera intentar preservar para siempre una transición novata supuestamente perfecta.' },
    sourceStatus: 'verified',
  },
  {
    id: 'alpha-beta',
    title: { en: '7 · Alpha / beta test', es: '7 · Alpha / beta test' },
    action: { en: 'Fine-tune the program in real training before treating it as mature.', es: 'Afiná el programa en entrenamiento real antes de tratarlo como maduro.' },
    reason: { en: 'The uploaded Part 2 explicitly says the detailed alpha/beta protocol belongs to Part 3, which we do not yet have. GainsLab must not invent those details.', es: 'La Parte 2 subida dice explícitamente que el protocolo detallado de alpha/beta pertenece a la Parte 3, que todavía no tenemos. GainsLab no debe inventar esos detalles.' },
    sourceStatus: 'missing_followup',
  },
  {
    id: 'mature-program',
    title: { en: '8 · Mature personal system', es: '8 · Sistema personal maduro' },
    action: { en: 'Keep refining only when experience shows a real reason. Over years, exercise selection and volume/intensity control can become increasingly personal and flexible.', es: 'Seguí refinando sólo cuando la experiencia muestre una razón real. Con los años, selección de ejercicios y control de volumen/intensidad pueden volverse cada vez más personales y flexibles.' },
    reason: { en: 'NH describes his own “final program” as the result of years of testing, not a template generated instantly.', es: 'NH describe su propio “programa final” como resultado de años de pruebas, no como una plantilla generada al instante.' },
    sourceStatus: 'verified',
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
        en: 'Evolving reps · the jump may already be late; do not wait for every set to hit the ceiling',
        es: 'Evolving reps · la subida puede estar llegando tarde; no esperes que todas las series toquen el techo',
      },
    };
  }

  if (clean[0] >= max && clean.every(value => value >= min)) {
    return {
      status: 'transition_candidate', ready: true,
      label: {
        en: 'Transition candidate · use the smallest practical jump only if the next load should stay inside the bracket',
        es: 'Candidato a transición · usá el salto mínimo sólo si la siguiente carga debería seguir dentro del rango',
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

export interface NhComparableExposure {
  maxWeight: number;
  totalReps: number;
}

export type NhPlateauStatus = 'learning' | 'progressing' | 'hard_work' | 'plateau_candidate';

export interface NhPlateauCue {
  status: NhPlateauStatus;
  label: { en: string; es: string };
}

/**
 * Product interpretation of NH's Unlimited Hypertrophy statement that repeating
 * approximately the same load/reps for 2–3 sessions can be normal, while longer
 * persistence can indicate a real plateau. Exact rep tolerance is a GainsLab rule.
 * Exposures are expected newest-first.
 */
export function evaluateNhPlateauTrend(exposures: NhComparableExposure[], repTolerance = 1): NhPlateauCue {
  const clean = exposures.filter(item => Number.isFinite(item.maxWeight) && Number.isFinite(item.totalReps));
  if (clean.length < 2) {
    return {
      status: 'learning',
      label: { en: 'More comparable exposures are needed.', es: 'Todavía faltan exposiciones comparables.' },
    };
  }

  const latest = clean[0];
  const previous = clean[1];
  if (latest.maxWeight > previous.maxWeight || (latest.maxWeight === previous.maxWeight && latest.totalReps > previous.totalReps + repTolerance)) {
    return {
      status: 'progressing',
      label: { en: 'Load or meaningful rep output improved.', es: 'Mejoró la carga o el rendimiento de reps de forma clara.' },
    };
  }

  const window = clean.slice(0, 4);
  const sameLoad = window.every(item => Math.abs(item.maxWeight - window[0].maxWeight) < 0.001);
  const repSpread = Math.max(...window.map(item => item.totalReps)) - Math.min(...window.map(item => item.totalReps));

  if (window.length >= 4 && sameLoad && repSpread <= repTolerance) {
    return {
      status: 'plateau_candidate',
      label: {
        en: 'NH-style plateau candidate · more than 2–3 comparable sessions at essentially the same load/reps.',
        es: 'Candidato a plateau estilo NH · más de 2–3 sesiones comparables prácticamente con la misma carga/reps.',
      },
    };
  }

  if (window.length >= 2 && sameLoad && repSpread <= repTolerance) {
    return {
      status: 'hard_work',
      label: {
        en: 'Hard work, not automatically a plateau · NH allows 2–3 repeated sessions before escalating.',
        es: 'Trabajo difícil, no plateau automático · NH admite 2–3 sesiones repetidas antes de escalar.',
      },
    };
  }

  return {
    status: 'learning',
    label: { en: 'Trend is mixed; keep collecting comparable exposures.', es: 'La tendencia es mixta; seguí reuniendo exposiciones comparables.' },
  };
}
