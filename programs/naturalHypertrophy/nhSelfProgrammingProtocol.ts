export type NhSourceKind = 'nh_principle' | 'inference' | 'gainslab_rule';
export type NhSchoolLevel = 'understand' | 'modify' | 'build' | 'self_coach';

export interface NhSelfProgrammingLesson {
  id: string;
  level: NhSchoolLevel;
  kind: NhSourceKind;
  title: { en: string; es: string };
  summary: { en: string; es: string };
  sourceScope: string;
}

export interface NhVerifiedSelfProgrammingStage {
  id: string;
  title: { en: string; es: string };
  action: { en: string; es: string };
  reason: { en: string; es: string };
  sourceStatus: 'verified';
  sourceScope: string;
}

export interface NhAlphaBetaPhase {
  id: 'alpha' | 'beta' | 'mature';
  title: { en: string; es: string };
  timing: { en: string; es: string };
  goal: { en: string; es: string };
  actions: Array<{ en: string; es: string }>;
  avoid: Array<{ en: string; es: string }>;
  sourceScope: string;
}

export interface NhIcebergLevel {
  id: 'sky' | 'tip' | 'surface' | 'depths' | 'abyss';
  title: { en: string; es: string };
  purpose: { en: string; es: string };
  concepts: Array<{ en: string; es: string }>;
  note: { en: string; es: string };
}

/**
 * Source-grounded additions from the uploaded NH transcripts:
 * - How to never have to buy a training program again in your life (Part 1 / theory)
 * - How to program your training yourself (Part 2 / practical writing)
 * - AlphaBeta testing your program (Part 3 / testing)
 * - No one understands progressive overload
 * - The Hypertrophy Iceberg Explained
 *
 * These are NH coaching/philosophy claims unless explicitly marked as a GainsLab rule.
 */
export const NH_SELF_PROGRAMMING_SOURCE_LESSONS: NhSelfProgrammingLesson[] = [
  {
    id: 'self-coaching-is-the-destination',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'The destination is self-coaching', es: 'El destino es autoentrenarte' },
    summary: {
      en: 'NH explicitly says his conviction is that a serious long-term lifter should eventually coach and program for himself. His rationale is accumulated personal knowledge: over decades, learning how your own body responds becomes more valuable than permanently outsourcing every training decision.',
      es: 'NH dice explícitamente que su convicción es que un atleta serio de largo plazo debería terminar entrenándose y programándose a sí mismo. Su argumento es el conocimiento personal acumulado: durante décadas, aprender cómo responde tu propio cuerpo vale más que tercerizar permanentemente cada decisión de entrenamiento.',
    },
    sourceScope: 'How to never have to buy a training program again in your life; How to program your training yourself Part 2; AlphaBeta testing your program.',
  },
  {
    id: 'novice-discovery-before-authorship',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Experience before authorship', es: 'Experiencia antes de autoría' },
    summary: {
      en: 'NH does not tell complete beginners to immediately write their own program. He frames the novice phase as discovery: learn movement patterns, rep ranges and which lifts fit your body, then use that practical database when you are ready to write.',
      es: 'NH no le dice al principiante absoluto que escriba inmediatamente su propia rutina. Plantea la fase novata como descubrimiento: aprender patrones, rangos y qué ejercicios encajan con tu cuerpo, y luego usar esa base práctica cuando estés listo para programar.',
    },
    sourceScope: 'How to never have to buy a training program again in your life.',
  },
  {
    id: 'program-hopping-hides-progression',
    level: 'modify',
    kind: 'nh_principle',
    title: { en: 'Do not confuse relearning with progression', es: 'No confundas reaprender con progresar' },
    summary: {
      en: 'NH warns that changing programs or major exercises too often can create the appearance of progress because the trainee repeatedly relearns new lifts. A good personal program should prove it can keep producing progress without constant structural replacement.',
      es: 'NH advierte que cambiar de programa o de ejercicios principales demasiado seguido puede crear apariencia de progreso porque el atleta reaprende movimientos nuevos. Un buen programa personal debe demostrar que puede seguir produciendo progreso sin reemplazos estructurales constantes.',
    },
    sourceScope: 'How to never have to buy a training program again in your life; Hypertrophy Iceberg (program hopping).',
  },
  {
    id: 'progressive-overload-is-multivariable',
    level: 'build',
    kind: 'nh_principle',
    title: { en: 'Progressive overload is not just more weight', es: 'Sobrecarga progresiva no es sólo más peso' },
    summary: {
      en: 'NH treats load as one overload tool among several. Reps, sets, frequency/time, volume and intensity manipulation, variations and rotations can all participate. Load still matters, but relying on automatic bar-weight increases alone eventually becomes too rigid.',
      es: 'NH trata la carga como una herramienta de sobrecarga entre varias. Reps, series, frecuencia/tiempo, manipulación de volumen e intensidad, variantes y rotaciones también participan. La carga sigue importando, pero depender sólo de aumentos automáticos de peso termina siendo demasiado rígido.',
    },
    sourceScope: 'No one understands progressive overload; Hypertrophy Iceberg.',
  },
  {
    id: 'conscious-load-increments',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Own the load jump', es: 'Sé dueño de la subida de carga' },
    summary: {
      en: 'NH distinguishes automatic increments from conscious increments. Evolving ranges are valuable partly because they force the trainee to decide whether a load jump makes sense in context: expected reps, current volume, recovery and the ability to keep the next load inside the intended bracket.',
      es: 'NH distingue aumentos automáticos de aumentos conscientes. Los rangos evolutivos son valiosos en parte porque obligan a decidir si una subida tiene sentido según el contexto: reps esperadas, volumen actual, recuperación y capacidad de mantener la nueva carga dentro del rango previsto.',
    },
    sourceScope: 'No one understands progressive overload; evolving-rep transcripts.',
  },
  {
    id: 'programming-literacy-is-progressive',
    level: 'understand',
    kind: 'nh_principle',
    title: { en: 'Programming knowledge should deepen gradually', es: 'El conocimiento de programación debe profundizar gradualmente' },
    summary: {
      en: 'The Hypertrophy Iceberg deliberately orders concepts by when they become useful, not by prestige. NH tells novices not to learn everything at once and presents programming literacy as a gradual descent from basic technique/frequency/recovery into volume, intensity, evolving ranges, tonnage, rotations and autoregulation.',
      es: 'El Hypertrophy Iceberg ordena deliberadamente conceptos según cuándo empiezan a ser útiles, no por prestigio. NH dice que el novato no necesita aprender todo de golpe y presenta la programación como una progresión desde técnica/frecuencia/recuperación hacia volumen, intensidad, rangos evolutivos, tonelaje, rotaciones y autorregulación.',
    },
    sourceScope: 'The Hypertrophy Iceberg Explained.',
  },
  {
    id: 'perfect-program-means-flexibility',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'A mature program is flexible, not frozen', es: 'Un programa maduro es flexible, no congelado' },
    summary: {
      en: 'NH defines his mature or “perfect” personal program by flexibility: its mechanisms let him adapt reps, sets, variations and day expression without destroying the program identity. The goal is not a sheet of paper that never changes; it is a system that no longer needs constant redesign.',
      es: 'NH define su programa personal maduro o “perfecto” por la flexibilidad: sus mecanismos permiten adaptar reps, series, variantes y la expresión de cada día sin destruir la identidad del programa. La meta no es una hoja que jamás cambie; es un sistema que ya no necesita rediseño constante.',
    },
    sourceScope: 'How to never have to buy a training program again in your life; AlphaBeta testing your program; Hypertrophy Iceberg.',
  },
  {
    id: 'alpha-subtract-before-adding',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Alpha testing mostly subtracts', es: 'El Alpha test principalmente resta' },
    summary: {
      en: 'NH expects first self-written programs to be greedy. During alpha testing he primarily removes obvious mistakes: excessive work, poor exercise fit, impossible supersets/logistics, sessions that run much longer than planned and day-to-day recovery conflicts. Alpha is not another brainstorming phase.',
      es: 'NH espera que los primeros programas propios sean demasiado ambiciosos. Durante Alpha elimina principalmente errores obvios: trabajo excesivo, ejercicios que no encajan, superseries/logística inviables, sesiones mucho más largas de lo planeado y conflictos de recuperación entre días. Alpha no es otra fase de brainstorming.',
    },
    sourceScope: 'AlphaBeta testing your program.',
  },
  {
    id: 'beta-tweak-before-rebuild',
    level: 'self_coach',
    kind: 'nh_principle',
    title: { en: 'Beta testing tweaks before it rebuilds', es: 'El Beta test ajusta antes de reconstruir' },
    summary: {
      en: 'After alpha, NH wants beta changes to become less severe: adjust reps or sets, move a lift, use a variation or add small low-impact work. Major compound additions or frequent structural changes are signals that the program may need a fresh design instead of endless patching.',
      es: 'Después de Alpha, NH quiere que los cambios de Beta sean menos severos: ajustar reps o series, mover un ejercicio, usar una variante o añadir trabajo pequeño de bajo impacto. Agregar compuestos grandes o hacer cambios estructurales frecuentes indica que quizá convenga rediseñar en lugar de seguir parcheando.',
    },
    sourceScope: 'AlphaBeta testing your program.',
  },
];

export const NH_SELF_PROGRAMMING_PATH_VERIFIED: NhVerifiedSelfProgrammingStage[] = [
  {
    id: 'inventory',
    title: { en: '1 · Build your lift inventory', es: '1 · Construí tu inventario de ejercicios' },
    action: { en: 'Accumulate real experience first. List lifts and variations you have actually practiced, placing the most familiar and productive movements at the top.', es: 'Acumulá experiencia real primero. Listá ejercicios y variantes que realmente hayas practicado, poniendo arriba los más familiares y productivos.' },
    reason: { en: 'NH calls the lift/variation list your data bank and the skeleton from which future programming is built.', es: 'NH llama a la lista de ejercicios/variantes tu banco de datos y el esqueleto desde el cual construirás la programación futura.' },
    sourceStatus: 'verified',
    sourceScope: 'How to never have to buy a training program again in your life; How to program your training yourself Part 2.',
  },
  {
    id: 'frame',
    title: { en: '2 · Choose the frame', es: '2 · Elegí el marco' },
    action: { en: 'Choose a template/split that gives your known exercises logical places and constrains frequency enough that the first design remains understandable.', es: 'Elegí una plantilla/split que dé lugares lógicos a tus ejercicios conocidos y limite la frecuencia lo suficiente para que el primer diseño siga siendo entendible.' },
    reason: { en: 'NH treats the template as a frame. The meaningful programming still comes from how exercises, volume, intensity and frequency are arranged inside it.', es: 'NH trata la plantilla como un marco. La programación real sigue viniendo de cómo se acomodan ejercicios, volumen, intensidad y frecuencia dentro de ella.' },
    sourceStatus: 'verified',
    sourceScope: 'How to program your training yourself Part 2; Hypertrophy Iceberg.',
  },
  {
    id: 'match-dose',
    title: { en: '3 · Match the dose you already tolerate', es: '3 · Igualá la dosis que ya tolerás' },
    action: { en: 'Keep initial tonnage, workload, rep ranges and frequency reasonably close to the program that already worked, especially during the novice-to-intermediate transition.', es: 'Mantené tonelaje, carga de trabajo, rangos y frecuencia iniciales razonablemente cerca del programa que ya funcionaba, especialmente al pasar de novato a intermedio.' },
    reason: { en: 'NH explicitly warns against jumping from a modest three-day program to six days with the same daily workload and crashing from the workload shock.', es: 'NH advierte explícitamente contra pasar de un programa moderado de tres días a seis manteniendo el mismo trabajo diario y estrellarse por el shock de carga.' },
    sourceStatus: 'verified',
    sourceScope: 'How to program your training yourself Part 2; AlphaBeta testing your program.',
  },
  {
    id: 'minimal-skeleton',
    title: { en: '4 · Write the smallest justified skeleton', es: '4 · Escribí el esqueleto mínimo justificable' },
    action: { en: 'Use proven breadwinner movements, familiar rep brackets and only accessories/variations you can already justify. Do not demonstrate sophistication for its own sake.', es: 'Usá movimientos ganadores ya probados, rangos familiares y sólo accesorios/variantes que ya puedas justificar. No intentes demostrar sofisticación porque sí.' },
    reason: { en: 'NH wants the first program to teach programming without burying the trainee under novelty and unnecessary complexity.', es: 'NH quiere que el primer programa enseñe a programar sin sepultar al atleta bajo novedad y complejidad innecesaria.' },
    sourceStatus: 'verified',
    sourceScope: 'How to never have to buy a training program again in your life; How to program your training yourself Part 2.',
  },
  {
    id: 'incubate',
    title: { en: '5 · Let the draft incubate', es: '5 · Dejá incubar el borrador' },
    action: { en: 'Keep training while the future program remains on paper. Revisit it periodically as you learn, making small reasoned changes before launch rather than jumping onto every new idea.', es: 'Seguí entrenando mientras el programa futuro permanece en papel. Revisalo periódicamente a medida que aprendés, haciendo cambios pequeños y razonados antes de lanzarlo en vez de saltar sobre cada idea nueva.' },
    reason: { en: 'NH separates the brainstorming/writing phase from real execution and repeatedly warns against programming ADHD.', es: 'NH separa la fase de brainstorming/escritura de la ejecución real y advierte repetidamente contra el ADHD de programación.' },
    sourceStatus: 'verified',
    sourceScope: 'How to program your training yourself Part 2; How to never have to buy a training program again in your life.',
  },
  {
    id: 'launch',
    title: { en: '6 · Launch the hypothesis', es: '6 · Lanzá la hipótesis' },
    action: { en: 'Run the complete draft in the gym and accept that paper logic is not enough. Record what actually works, what runs long, what hurts, what clashes and whether you can recover and progress week after week.', es: 'Ejecutá el borrador completo en el gimnasio y aceptá que la lógica en papel no alcanza. Registrá qué funciona, qué se alarga, qué molesta, qué choca y si podés recuperar y progresar semana tras semana.' },
    reason: { en: 'NH says an untested program exists only in potential. Trial and error is unavoidable.', es: 'NH dice que un programa no probado existe sólo en potencia. La prueba y error es inevitable.' },
    sourceStatus: 'verified',
    sourceScope: 'AlphaBeta testing your program.',
  },
  {
    id: 'alpha-beta',
    title: { en: '7 · Alpha, then beta test', es: '7 · Alpha y después Beta test' },
    action: { en: 'Spend roughly 2–3 months stripping obvious errors in alpha, then enter a much longer beta where changes become small, spaced and surgical.', es: 'Pasá aproximadamente 2–3 meses eliminando errores obvios en Alpha y después entrá a un Beta mucho más largo donde los cambios sean pequeños, espaciados y quirúrgicos.' },
    reason: { en: 'NH gives the complete alpha/beta protocol in Part 3: alpha shapes a realistic program; beta refines it over many months and can extend into one or two years.', es: 'NH da el protocolo completo Alpha/Beta en la Parte 3: Alpha da forma a un programa realista; Beta lo refina durante muchos meses y puede extenderse uno o dos años.' },
    sourceStatus: 'verified',
    sourceScope: 'AlphaBeta testing your program.',
  },
  {
    id: 'mature-program',
    title: { en: '8 · Build a mature flexible system', es: '8 · Construí un sistema maduro y flexible' },
    action: { en: 'Keep what repeatedly works. If the design becomes too saturated or a better skeleton emerges from years of learning, transfer the successful structures into a new draft and test again.', es: 'Conservá lo que funciona repetidamente. Si el diseño queda demasiado saturado o años de aprendizaje producen un esqueleto mejor, transferí las estructuras exitosas a un nuevo borrador y volvé a probar.' },
    reason: { en: 'NH describes the endpoint as a flexible personal system that can adapt without constant redesign, not an immutable routine.', es: 'NH describe el punto final como un sistema personal flexible que puede adaptarse sin rediseño constante, no como una rutina inmutable.' },
    sourceStatus: 'verified',
    sourceScope: 'How to never have to buy a training program again in your life; AlphaBeta testing your program; Hypertrophy Iceberg.',
  },
];

export const NH_ALPHA_BETA_PROTOCOL: NhAlphaBetaPhase[] = [
  {
    id: 'alpha',
    title: { en: 'ALPHA · Make the paper program real', es: 'ALPHA · Convertí el papel en realidad' },
    timing: { en: 'About 2–3 months; NH says it generally should not drag much beyond ~3 months.', es: 'Aproximadamente 2–3 meses; NH dice que generalmente no debería prolongarse mucho más de ~3 meses.' },
    goal: { en: 'Remove glaring mistakes and make the program realistic enough to run consistently.', es: 'Eliminar errores evidentes y volver el programa suficientemente realista para ejecutarlo de forma consistente.' },
    actions: [
      { en: 'Run every day as written and record what works and what does not.', es: 'Ejecutá cada día como está escrito y registrá qué funciona y qué no.' },
      { en: 'Compare planned session duration with real duration; strip work when a 75-minute idea becomes a two-hour reality.', es: 'Compará duración planeada con duración real; recortá cuando una idea de 75 minutos termina siendo dos horas.' },
      { en: 'Remove exercises that slipped through despite poor fit, pain or inability to execute/productively progress them.', es: 'Quitá ejercicios que se colaron pese a encajar mal, doler o no poder ejecutarse/progresarse productivamente.' },
      { en: 'Fix exercise synergy, supersets and gym logistics that worked on paper but fail in practice.', es: 'Corregí sinergia de ejercicios, superseries y logística del gimnasio que funcionaban en papel pero fallan en práctica.' },
      { en: 'Check whether adjacent days actually recover; reduce greed in volume/frequency when the next session is compromised.', es: 'Chequeá si los días adyacentes realmente recuperan; reducí codicia de volumen/frecuencia cuando la sesión siguiente se ve comprometida.' },
      { en: 'Keep workload/tonnage reasonably close to what you previously tolerated while the program finds its shape.', es: 'Mantené carga/tonelaje razonablemente cerca de lo que tolerabas antes mientras el programa encuentra su forma.' },
    ],
    avoid: [
      { en: 'Do not use alpha as a new brainstorming phase.', es: 'No uses Alpha como otra fase de brainstorming.' },
      { en: 'Do not keep adding new work unless it replaces a clear mistake; NH says alpha is mostly subtraction.', es: 'No sigas agregando trabajo salvo que reemplace un error claro; NH dice que Alpha es principalmente sustracción.' },
      { en: 'Do not strip so long that you eventually remove the program skeleton itself.', es: 'No recortes durante tanto tiempo que termines eliminando el propio esqueleto del programa.' },
    ],
    sourceScope: 'AlphaBeta testing your program.',
  },
  {
    id: 'beta',
    title: { en: 'BETA · Refine, do not thrash', es: 'BETA · Refiná, no sacudas todo' },
    timing: { en: 'Roughly a year as a useful horizon; NH says his own program remained in beta for about two years.', es: 'Aproximadamente un año como horizonte útil; NH cuenta que su propio programa permaneció unos dos años en Beta.' },
    goal: { en: 'Turn an already-solid alpha version into a deeply personal, flexible long-term system.', es: 'Convertir una versión Alpha ya sólida en un sistema profundamente personal, flexible y de largo plazo.' },
    actions: [
      { en: 'When something underperforms, first tweak reps or sets, move it to another day or use an appropriate variation.', es: 'Cuando algo rinde mal, primero ajustá reps o series, movelo de día o usá una variante apropiada.' },
      { en: 'Small additions are allowed when their tonnage impact is small: NH gives examples such as calves, neck or modest extra forearm work.', es: 'Se permiten adiciones pequeñas cuando su impacto de tonelaje sea pequeño: NH usa ejemplos como gemelos, cuello o trabajo adicional moderado de antebrazo.' },
      { en: 'Space modifications. NH describes personal changes roughly every month to two months, not every few sessions.', es: 'Espaciá las modificaciones. NH describe cambios personales aproximadamente cada uno o dos meses, no cada pocas sesiones.' },
      { en: 'Preserve the original skeleton and learn from each modification before making another.', es: 'Preservá el esqueleto original y aprendé de cada modificación antes de hacer otra.' },
    ],
    avoid: [
      { en: 'Do not be trigger-happy: beta is intentionally less severe than alpha.', es: 'No seas gatillo fácil: Beta es deliberadamente menos severo que Alpha.' },
      { en: 'Do not add a major compound movement casually; NH says a change that large may justify starting a fresh design cycle.', es: 'No agregues casualmente un compuesto principal; NH dice que un cambio tan grande puede justificar empezar un ciclo de diseño nuevo.' },
      { en: 'Do not change something every few days; if the program needs that much surgery, redesign it.', es: 'No cambies algo cada pocos días; si el programa necesita tanta cirugía, rediseñalo.' },
    ],
    sourceScope: 'AlphaBeta testing your program.',
  },
  {
    id: 'mature',
    title: { en: 'MATURE · Flexibility becomes the feature', es: 'MADURO · La flexibilidad se vuelve la función' },
    timing: { en: 'No fixed deadline. NH describes one to several years of refinement as realistic.', es: 'Sin plazo fijo. NH describe uno a varios años de refinamiento como algo realista.' },
    goal: { en: 'Reach a system whose internal mechanisms can adapt without requiring constant wholesale program replacement.', es: 'Llegar a un sistema cuyos mecanismos internos puedan adaptarse sin requerir reemplazar constantemente el programa completo.' },
    actions: [
      { en: 'Keep the movement-pattern skeleton and successful structures stable.', es: 'Mantené estable el esqueleto de patrones y las estructuras exitosas.' },
      { en: 'Use planned flexibility in reps, sets, variations and rotations instead of program hopping.', es: 'Usá flexibilidad planificada en reps, series, variantes y rotaciones en vez de saltar de programa.' },
      { en: 'If years of learning reveal a superior skeleton, transfer the proven pieces into a new draft and repeat the test process.', es: 'Si años de aprendizaje revelan un esqueleto superior, transferí las piezas probadas a un nuevo borrador y repetí el proceso de test.' },
    ],
    avoid: [
      { en: 'Do not equate “mature” with immutable.', es: 'No confundas “maduro” con inmutable.' },
      { en: 'Do not preserve a saturated design merely because you invested time in it.', es: 'No conserves un diseño saturado sólo porque invertiste tiempo en él.' },
    ],
    sourceScope: 'How to never have to buy a training program again in your life; AlphaBeta testing your program; Hypertrophy Iceberg.',
  },
];

export const NH_ICEBERG_CURRICULUM: NhIcebergLevel[] = [
  {
    id: 'sky',
    title: { en: 'Sky · Foundations', es: 'Cielo · Fundamentos' },
    purpose: { en: 'Build a safe, consistent training base before worrying about advanced programming vocabulary.', es: 'Construir una base de entrenamiento segura y consistente antes de preocuparse por vocabulario avanzado.' },
    concepts: [
      { en: 'Resistance training and motivation/discipline', es: 'Entrenamiento de resistencia y motivación/disciplina' },
      { en: 'Frequency that fits the real schedule', es: 'Frecuencia que encaje con el calendario real' },
      { en: 'Technique, compounds plus isolation exposure', es: 'Técnica, compuestos más exposición a aislamientos' },
      { en: 'Recovery, consistency and goals', es: 'Recuperación, consistencia y objetivos' },
      { en: 'Progressive overload as a broad principle', es: 'Sobrecarga progresiva como principio amplio' },
    ],
    note: { en: 'NH explicitly tells novices not to learn the entire iceberg at once.', es: 'NH dice explícitamente que el novato no necesita aprender todo el iceberg de golpe.' },
  },
  {
    id: 'tip',
    title: { en: 'Tip · Learn to track', es: 'Punta · Aprendé a registrar' },
    purpose: { en: 'Move from “just train” toward measurable progression and exercise selection.', es: 'Pasar de “simplemente entrená” hacia progresión medible y selección de ejercicios.' },
    concepts: [
      { en: 'Reps, progression and smaller load jumps', es: 'Reps, progresión y saltos de carga más pequeños' },
      { en: 'Top/hard sets and work capacity', es: 'Top/hard sets y capacidad de trabajo' },
      { en: 'Tracking and exercise selection', es: 'Registro y selección de ejercicios' },
      { en: 'Basic supersets and static rep prescriptions', es: 'Superseries básicas y prescripciones de reps estáticas' },
      { en: 'Recovery between sessions and avoiding program hopping', es: 'Recuperación entre sesiones y evitar program hopping' },
    ],
    note: { en: 'This is where the trainee starts seeing a program rather than isolated workouts.', es: 'Acá el atleta empieza a ver un programa en lugar de sesiones aisladas.' },
  },
  {
    id: 'surface',
    title: { en: 'Surface · Manipulate the variables', es: 'Superficie · Manipulá las variables' },
    purpose: { en: 'Understand the variables that make two routines with the same split behave differently.', es: 'Entender las variables que hacen que dos rutinas con el mismo split se comporten diferente.' },
    concepts: [
      { en: 'Volume and intensity', es: 'Volumen e intensidad' },
      { en: 'Evolving rep ranges', es: 'Rangos de reps evolutivos' },
      { en: 'Muscular vs mechanical failure', es: 'Fallo muscular vs mecánico' },
      { en: 'Variations, weak points and fatigue', es: 'Variantes, puntos débiles y fatiga' },
      { en: 'Templates, sets and form fluidity', es: 'Plantillas, series y fluidez técnica' },
    ],
    note: { en: 'NH places evolving reps here: useful before the most advanced programming tools.', es: 'NH coloca evolving reps acá: útiles antes de las herramientas de programación más avanzadas.' },
  },
  {
    id: 'depths',
    title: { en: 'Depths · Program deliberately', es: 'Profundidad · Programá deliberadamente' },
    purpose: { en: 'Progress stops being assumed and becomes something the program must deliberately create.', es: 'La progresión deja de darse por sentada y pasa a ser algo que el programa debe crear deliberadamente.' },
    concepts: [
      { en: 'Programming and progression schemes', es: 'Programación y esquemas de progresión' },
      { en: 'Baseline, tonnage and relative intensity', es: 'Baseline, tonelaje e intensidad relativa' },
      { en: 'Specialization and risk-to-reward', es: 'Especialización y riesgo/beneficio' },
      { en: 'Rotations and autoregulation', es: 'Rotaciones y autorregulación' },
      { en: 'Back-off sets and evolving sets', es: 'Back-off sets y series evolutivas' },
    ],
    note: { en: 'NH explicitly places “programming” deep because most lifters never develop much programming literacy.', es: 'NH coloca explícitamente “programming” en profundidad porque la mayoría de atletas nunca desarrolla mucha alfabetización de programación.' },
  },
  {
    id: 'abyss',
    title: { en: 'Abyss · Optional specialization tools', es: 'Abismo · Herramientas opcionales de especialización' },
    purpose: { en: 'Recognize niche concepts without mistaking them for prerequisites for growth.', es: 'Reconocer conceptos de nicho sin confundirlos con prerrequisitos para crecer.' },
    concepts: [
      { en: 'Highly specific intensity/ROM techniques', es: 'Técnicas muy específicas de intensidad/ROM' },
      { en: 'Advanced assisted/negative-only methods', es: 'Métodos avanzados asistidos/negative-only' },
      { en: 'Diffuse vs targeted tonnage', es: 'Tonelaje difuso vs dirigido' },
      { en: 'Intra-workout frequency and deep autoregulation', es: 'Frecuencia intra-workout y autorregulación profunda' },
      { en: 'Niche concepts that most trainees never need', es: 'Conceptos de nicho que la mayoría nunca necesita' },
    ],
    note: { en: 'This is NH’s curriculum map, not a scientific hierarchy. GainsLab does not turn every iceberg claim into a training rule.', es: 'Este es el mapa curricular de NH, no una jerarquía científica. GainsLab no convierte cada afirmación del iceberg en una regla de entrenamiento.' },
  },
];