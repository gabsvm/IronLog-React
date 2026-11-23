import type { LocalizedString } from './rpGuideData';
import type { IconName } from '../components/ui/Icon';

export interface RpVolumeLandmarkDef {
    code: 'MV' | 'MEV' | 'MAV' | 'MRV';
    tone: 'zinc' | 'emerald' | 'primary' | 'red';
    name: LocalizedString;
    definition: LocalizedString;
    typicalRange: LocalizedString;
}

export interface RpPrincipleDef {
    rank: number;
    id: string;
    icon: IconName;
    name: LocalizedString;
    tagline: LocalizedString;
    summary: LocalizedString;
    keyRules: LocalizedString[];
    pitfalls: LocalizedString[];
}

export type RpTrainingAgeId = 'beginner' | 'intermediate' | 'advanced';

export interface RpTrainingAgeDef {
    id: RpTrainingAgeId;
    label: LocalizedString;
    careerFocus: LocalizedString;
    repRanges: LocalizedString;
    rirFloor: LocalizedString;
    frequency: LocalizedString;
    volumeAndMesos: LocalizedString;
    variationAndSpec: LocalizedString;
    specialRule: LocalizedString;
}

export interface RpScoreRubricDef {
    id: string;
    label: LocalizedString;
    prompt: LocalizedString;
    levels: [LocalizedString, LocalizedString, LocalizedString, LocalizedString];
}

export interface RpMevBandDef {
    min: number;
    max: number;
    rangeLabel: string;
    tone: 'amber' | 'zinc' | 'emerald' | 'red';
    proximity: LocalizedString;
    recommendation: LocalizedString;
}

export interface RpSetProgressionCell {
    delta: string;
    label: LocalizedString;
    tone: 'primary' | 'emerald' | 'zinc' | 'red';
}

export interface RpOverloadModalityDef {
    id: string;
    name: LocalizedString;
    loadAndRest: LocalizedString;
    setCountRule: LocalizedString;
    whenToUse: LocalizedString;
    whenToAvoid: LocalizedString;
}

export interface RpGlossaryTermDef {
    id: string;
    term: LocalizedString;
    category: LocalizedString;
    definition: LocalizedString;
}

export const RP_PRINCIPLES_DATA = {
    volumeLandmarks: [
        {
            code: 'MV',
            tone: 'zinc',
            name: { es: 'Volumen de Mantenimiento', en: 'Maintenance Volume' },
            definition: {
                es: 'Cantidad mínima de series semanales necesaria para conservar la masa muscular actual sin perder tejido.',
                en: 'Minimum weekly set volume required to prevent muscle loss and preserve existing tissue.',
            },
            typicalRange: {
                es: 'Muy bajo en déficit neutro/superávit (p. ej. ~4–6 series/sem en grupos entrenados)',
                en: 'Very low outside deep dieting (e.g., ~4–6 sets/week in trained lifters)',
            },
        },
        {
            code: 'MEV',
            tone: 'emerald',
            name: { es: 'Volumen Mínimo Efectivo', en: 'Minimum Effective Volume' },
            definition: {
                es: 'Umbral mínimo de series por encima del cual comienza a estimularse hipertrofia medible. Punto de partida ideal del mesociclo.',
                en: 'Minimum training volume required to stimulate measurable hypertrophy. Ideal mesocycle starting point.',
            },
            typicalRange: {
                es: 'Intermedio promedio: ~2–4 series por sesión para arrancar el mesociclo',
                en: 'Average intermediate: ~2–4 sets per session to open a mesocycle',
            },
        },
        {
            code: 'MAV',
            tone: 'primary',
            name: { es: 'Volumen Adaptativo Máximo', en: 'Maximum Adaptive Volume' },
            definition: {
                es: 'Zona dinámica entre MEV y MRV que produce las mayores ganancias musculares por unidad de tiempo. Se desplaza al alza a medida que avanza el mesociclo.',
                en: 'Moving volume peak between MEV and MRV yielding the greatest muscle growth per unit of time across the mesocycle.',
            },
            typicalRange: {
                es: 'Intermedio promedio: suele rondar ~12–22 series/sem (y ~5–10 series/sesión)',
                en: 'Average intermediate: roughly ~12–22 sets/week (around ~5–10 sets/session)',
            },
        },
        {
            code: 'MRV',
            tone: 'red',
            name: { es: 'Volumen Máximo Recuperable', en: 'Maximum Recoverable Volume' },
            definition: {
                es: 'Techo máximo de volumen del que tu cuerpo aún puede recuperarse. Superarlo provoca sobreentrenamiento funcional, estancamiento o pérdida de rendimiento.',
                en: 'Upper volume ceiling from which you can still recover. Exceeding it causes overreaching, performance drops, and diminishing returns.',
            },
            typicalRange: {
                es: 'Hasta ~10–12+ series/sesión en la última semana antes del Deload (2–4x/sem)',
                en: 'Up to ~10–12+ sets/session on peak accumulation week before deload (2–4x/wk)',
            },
        },
    ] as RpVolumeLandmarkDef[],
    mvMevGapWarning: {
        title: {
            es: 'Cuidado con la "Zona Muerta" entre MV y MEV',
            en: 'Beware the MV-to-MEV "Dead Zone"',
        },
        body: {
            es: 'Cuanto más avanzado sos, mayor es la brecha entre MV y MEV (ej. MV = 4 series/sem y MEV = 10 series/sem). Entrenar a 7 series semanales en un músculo que solo querés mantener suma fatiga sistémica sin generar crecimiento nuevo (volumen basura). Mantenelo estrictamente en MV.',
            en: 'As you advance, the gap between MV and MEV widens (e.g., MV = 4 sets/wk vs. MEV = 10 sets/wk). Doing 7 sets/wk for a muscle you only want to maintain adds needless fatigue for zero added hypertrophy—keep maintained or deprioritized muscles strictly at MV.',
        },
    },
    phasePotentiation: {
        mesoLengthRule: {
            title: { es: 'Duración de Acumulación (4–8 Semanas)', en: 'Accumulation Duration (4–8 Weeks)' },
            body: {
                es: 'Apuntá a al menos 4 semanas efectivas antes de descargar (rango típico: 4–8 semanas; más largo en principiantes y más corto en avanzados). Arrancá cerca de tu MEV y ~4 RIR para maximizar las semanas productivas hasta llegar a 1–0 RIR (principiantes: mínimo 2 RIR) justo antes del Deload.',
                en: 'Aim for at least 4 accumulation weeks before deloading (typical range: 4–8 weeks; longer for beginners, shorter for advanced lifters). Start near MEV at ~4 RIR and climb gradually toward 1–0 RIR (beginners stop at >=2 RIR) just before your deload.',
            },
        },
        microcycleRule: {
            title: { es: 'Potenciación Microciclo a Microciclo', en: 'Microcycle-to-Microcycle Potentiation' },
            body: {
                es: 'Al progresar en peso semanal, agregá solo la carga justa para sostener repeticiones similares con un RIR igual o 1 punto menor. Al progresar en repeticiones, sumá solo las reps suficientes con el mismo peso para mantener la progresión gradual de RIR sin quemarte en la semana 2.',
                en: 'When progressing load week-to-week, add just enough weight to hold similar reps at the same or slightly lower RIR. When progressing reps, keep load steady and add reps gradually without burning out early.',
            },
        },
        mesoToMesoTitle: {
            es: 'Cómo Calibrar Cargas entre Mesociclos',
            en: 'Meso-to-Meso Load Calibration (3 Scenarios)',
        },
        mesoToMesoProgression: [
            {
                title: { es: '1. Mismo ejercicio + mismo rango de reps', en: '1. Same Exercise + Same Rep Range' },
                body: {
                    es: 'Salvo que seas principiante, casi nunca conviene arrancar el nuevo mesociclo con el peso pico del ciclo anterior. Empezá un poco más liviano (con margen limpio a 4 RIR) para permitir que la carga progrese y termine superando tu récord anterior al final del bloque.',
                    en: 'Except as a beginner, rarely start a new mesocycle with your previous peak weight. Start conservatively below last peak at a clean 4 RIR so progressive overload carries you to a higher peak by the end of the cycle.',
                },
            },
            {
                title: { es: '2. Mismo ejercicio + distinto rango de reps', en: '2. Same Exercise + Different Rep Range' },
                body: {
                    es: 'No esperes usar el mismo peso si pasás de 5–10 reps a 10–20 reps. Elegí un peso acorde al nuevo rango restando 4 RIR (ej. para 10–20 reps en Semana 1 a 4 RIR, elegí tu aproximado 14–24RM). El estímulo sigue en rango efectivo siempre que progrese hacia 1–0 RIR.',
                    en: 'Do not expect the same absolute weight when shifting rep bands. For 10–20 rep sets starting at 4 RIR, select roughly your 14–24RM; progression happens within the rep range across accumulation.',
                },
            },
            {
                title: { es: '3. Ejercicio nuevo en el mesociclo', en: '3. Introducing a New Exercise' },
                body: {
                    es: 'No intentes extrapolar pesos de otro movimiento (como convertir sentadilla Multipower a sentadilla libre). Calibrá el nuevo ejercicio de forma independiente buscando un peso que entre dentro del rango de reps objetivo a ~4 RIR reales en la Semana 1.',
                    en: 'Never try to math-convert loads from a different lift. Calibrate any new movement independently using whatever conservative weight lands inside your target rep band at ~4 RIR in Week 1.',
                },
            },
        ],
        resensitizationBlock: {
            title: { es: 'Bloque de Resensibilización (3–6 Semanas en MV)', en: 'Resensitization Phase (3–6 Weeks at MV)' },
            body: {
                es: 'Los deloads de 1 semana reducen parte de la fatiga, pero tras 3–6 mesociclos de alto volumen la resistencia adaptativa sube y tu MEV se acerca peligrosamente al MRV. Dedicá un bloque de 3–6 semanas con alimentación de mantenimiento (eucalórica) entrenando en MV con baja frecuencia y 5–10 reps: así bajás tu MEV, curás tejidos conectivos y devolvés sensibilidad anabólica extrema al siguiente macrociclo.',
                en: 'Weekly deloads only partially lower MEV. After 3–6 high-volume mesocycles, adaptive resistance pushes MEV close to MRV. Run a 3–6 week eucaloric maintenance block strictly at MV with low frequency and mostly 5–10 rep loads: MEV drops back down, connective tissues heal, fibers re-sensitize, and your next hypertrophy block explodes in responsiveness.',
            },
        },
    },
    sevenPrinciples: [
        {
            rank: 1,
            id: 'specificity',
            icon: 'Target',
            name: { es: 'Especificidad', en: 'Specificity' },
            tagline: {
                es: 'Entrená exactamente la adaptación que buscás y mantenela en secuencia.',
                en: 'Train specifically for hypertrophy and sustain directed adaptation.',
            },
            summary: {
                es: 'Todo entrenamiento debe estimular hipertrofia directa, conservar masa o potenciar crecimiento futuro. Además, la adaptación dirigida exige repetir patrones estables durante semanas y meses en lugar de cambiar todo al azar. Si tu meta es masa muscular, tu análisis de necesidades prioriza los grupos musculares deseados y respalda el proceso con superávit calórico o dieta acorde.',
                en: 'All training should directly stimulate muscle growth, maintain mass, or potentiate future growth. Directed adaptation requires repeating similar exercises and rep ranges across weeks and months rather than random novelty. Pair training with a Needs Analysis and aligned nutrition.',
            },
            keyRules: [
                {
                    es: 'Adaptación dirigida: conservá los mismos ejercicios y estructura durante todo el mesociclo para consolidar técnica y progresión.',
                    en: 'Directed adaptation: hold exercises and structure steady throughout a mesocycle before rotating variants.',
                },
                {
                    es: 'Reglas de interferencia con otras modalidades: otras actividades interfieren más cuando (1) exigen las mismas estructuras, (2) generan estímulos opuestos (ej. maratón vs cuádriceps), (3) consumen muchas calorías o (4) producen alta fatiga sistémica y daño.',
                    en: 'Modality interference increases when other activities (1) tax the same structures, (2) present dissimilar stimuli, (3) burn excessive calories, or (4) add high disruption/fatigue.',
                },
                {
                    es: 'No confundas fuerza máxima con hipertrofia: mejorar 1RM con poco volumen responde mayormente a eficiencia neural, no a tejido muscular nuevo.',
                    en: 'Do not conflate strength peaking with hypertrophy: low-volume 1RM gains reflect mostly neural efficiency.',
                },
            ],
            pitfalls: [
                {
                    es: 'Especializar grupos demasiado pronto siendo principiante o abusar de aislamientos dejando de lado compuestos básicos efectivos.',
                    en: 'Running specialization blocks as a beginner or excessively relying on isolations while ignoring productive compounds.',
                },
            ],
        },
        {
            rank: 2,
            id: 'overload',
            icon: 'TrendingUp',
            name: { es: 'Sobrecarga', en: 'Overload' },
            tagline: {
                es: 'Superá el umbral efectivo y aumentá el desafío progresivamente de MEV a MRV.',
                en: 'Cross the effective stimulus threshold and progress from MEV to MRV.',
            },
            summary: {
                es: 'Regla maestra de la sobrecarga hipertrófica: "Hacé múltiples series de 5–30 repeticiones controladas (≤9 s/rep) con rango completo seguro, llevadas cerca del fallo (5–0 RIR) con 30%–85% 1RM, donde el músculo objetivo sea el factor limitante, progresando entre MEV y MRV".',
                en: 'Core rule of hypertrophy overload: "Perform multiple sets of 5–30 controlled, safe full-ROM reps (<=9 s/rep) close to failure (5–0 RIR) with 30%–85% 1RM where the target muscle is the limiting factor, progressing from MEV to MRV."',
            },
            keyRules: [
                {
                    es: 'Jerarquía de estimuladores: Tensión Mecánica y Volumen (series duras a 5–0 RIR) lideran, seguidos por Esfuerzo Relativo (RIR), Rango de Movimiento (ROM), Estrés Metabólico, Hinchazón Celular (pump), Conexión Mente-Músculo (óptima en 10–20 reps), Velocidad de Movimiento (excéntrica 2–3 s) y Daño Muscular (correlación en U invertida).',
                    en: 'Stimulator hierarchy: Tension and Hard-Set Volume (5–0 RIR) lead, followed by Relative Effort, ROM, Metabolites, Cell Swelling (pump), Mind-Muscle Connection (best at 10–20 reps), Velocity (2–3s eccentric), and Muscle Damage (inverted-U correlate).',
                },
                {
                    es: 'Dentro de 30%–85% 1RM el crecimiento por serie dura es similar: el número de series efectivas pesa más que obsesionarse con kilos máximos.',
                    en: 'Across 30%–85% 1RM, per-set growth is comparable—total hard sets between MEV and MRV drive hypertrophy more reliably than load chasing.',
                },
            ],
            pitfalls: [
                {
                    es: 'Entrenar por encima del 85% 1RM (menos reps y riesgo exponencial), abusar de técnicas más allá del fallo desde semana 1, descansar muy poco entre series rectas, recortar el ROM para cargar más o acumular volumen basura sin cercanía al fallo.',
                    en: 'Heavier-is-better >85% 1RM, abusing beyond-failure sets in Week 1, cutting rest too short on straight sets, cutting ROM for ego weight, or piling up junk volume far from failure.',
                },
            ],
        },
        {
            rank: 3,
            id: 'fatigue',
            icon: 'Shield',
            name: { es: 'Gestión de la Fatiga', en: 'Fatigue Management' },
            tagline: {
                es: 'Equilibrá estímulo y costo recuperativo usando el Ratio Estímulo-Fatiga (SFR).',
                en: 'Balance hypertrophy stimulus against recovery cost using the Stimulus-to-Fatigue Ratio (SFR).',
            },
            summary: {
                es: 'La fatiga se acumula en tres niveles: local (músculo y tejido conectivo), sistémica (SNC, energía, sueño, hormonas) y axial (erectores espinales que limitan otros ejercicios). El rendimiento objetivo en la barra/máquina es el detector más confiable de fatiga excesiva, por encima de sensaciones aisladas.',
                en: 'Fatigue accumulates locally (muscle and connective tissue), systemically (CNS, energy, sleep, mood), and axially (spinal erectors). Objective training performance is the most reliable fatigue detector.',
            },
            keyRules: [
                {
                    es: 'Fórmula central: SFR = Magnitud de Estímulo Bruto (RSM) ÷ Fatiga Generada.',
                    en: 'Core ratio: SFR = Raw Stimulus Magnitude (RSM) ÷ Fatigue Generated.',
                },
                {
                    es: 'Índices de selección: priorizá RSM si sobra tiempo/recuperación y faltan ganancias; priorizá SFR si la recuperación limita; priorizá STR (estímulo/tiempo) si te falta tiempo; buscá alto SFTR global.',
                    en: 'Selection indexes: maximize RSM when recovery/time are abundant, SFR when recovery limits growth, STR when time-crunched, and balanced SFTR overall.',
                },
                {
                    es: 'Combina prevención (Volume Landmarks, técnica estricta, pulsatilidad semanal) con alivio (días libres, sesiones de recuperación, deloads y descanso activo).',
                    en: 'Combine prevention (volume landmarks, strict technique, microcycle pulsatility) with alleviation (rest days, recovery sessions, deloads, active rest).',
                },
            ],
            pitfalls: [
                {
                    es: 'Bajar el volumen artificialmente solo para sentirse "fresco" o sacar PRs tempranos, temer en exceso al trabajo duro, autoregular solo por sensaciones ignorando el rendimiento o normalizar dolor articular crónico.',
                    en: 'Dropping volume prematurely just to reveal PR performance, over-fearing hard sets, perceptual-only autoregulation ignoring performance, or accepting chronic joint pain as normal.',
                },
            ],
        },
        {
            rank: 4,
            id: 'sra',
            icon: 'Repeat',
            name: { es: 'SRA y Frecuencia', en: 'SRA & Frequency' },
            tagline: {
                es: 'Volvé a estimular cada músculo apenas se disipa la fatiga y termina la adaptación.',
                en: 'Re-stimulate each muscle as soon as fatigue clears and hypertrophy adaptation completes.',
            },
            summary: {
                es: 'La síntesis proteica y crecimiento post-sesión suelen completarse en 1–3 días, pero la fatiga local o conectiva a menudo tarda más y termina fijando tu frecuencia ideal. Para la mayoría de intermedios y avanzados, entrenar cada grupo muscular 2–4 veces por semana (hasta 5–6x en músculos chicos) con ~3–8 series por sesión optimiza el equilibrio.',
                en: 'Muscle growth post-session typically completes within 1–3 days, while fatigue recovery often lags and governs practical frequency. For most intermediate/advanced lifters, 2–4 weekly sessions per muscle (up to 5–6x for small muscles) averaging ~3–8 sets/session hits the sweet spot.',
            },
            keyRules: [
                {
                    es: 'Por qué falla la frecuencia muy baja (1x/sem): obliga a meter demasiadas series en un día (~15+ techo por sesión), cayendo glucógeno, técnica, conexión mente-músculo y acumulando daño y volumen basura.',
                    en: 'Why overly low frequency fails: cramming all weekly volume into one day surpasses ~10–15 sets/session ceilings, causing junk volume, glycogen depletion, and technique breakdown.',
                },
                {
                    es: 'Por qué falla la frecuencia excesiva: 1–2 series por sesión desperdician energía en calentamientos, pierden potenciación neural y pump intra-sesión, e irritan tendones que curan más lento que el músculo.',
                    en: 'Why overly high frequency fails: 1–2 set micro-sessions waste warm-up energy, lose within-session potentiation/pump, and stress connective tissues faster than tendons recover.',
                },
            ],
            pitfalls: [
                {
                    es: 'Rutinas "bro split" de 1 músculo/semana para intermedios, obsesionarse con simetría perfecta (7 días es asimétrico y funciona a favor) o sostener frecuencias altísimas sin rotar bloques más espaciados para los tendones.',
                    en: 'Using 1x/wk bro splits past novice stage, forcing artificial calendar symmetry, or running ultra-high frequencies nonstop without joint-recovery blocks.',
                },
            ],
        },
        {
            rank: 5,
            id: 'variation',
            icon: 'Shuffle',
            name: { es: 'Variación', en: 'Variation' },
            tagline: {
                es: 'Introducí novedad estratégica para evitar mesetas y lesiones por sobreuso sin perder inercia.',
                en: 'Use directed, strategic novelty to prevent adaptive resistance and overuse without losing momentum.',
            },
            summary: {
                es: 'La Especificidad manda por defecto: nunca cambies cosas solo por aburrimiento o "confusión muscular". Aplicá Variación dirigida únicamente cuando haga falta —rotando ejercicios quemados entre mesociclos, combinando rangos de repeticiones y ordenando las sesiones de mayor demanda a menor demanda.',
                en: 'Specificity defaults to consistency: never randomize lifts for "muscle confusion." Apply directed Variation only with purpose—swapping stale/painful exercises between mesocycles, spanning the rep-range spectrum, and ordering high-demand work first.',
            },
            keyRules: [
                {
                    es: 'Cantidad óptima por músculo: 1–3 ejercicios por sesión (ideal 1–2) y 2–4 variantes distintas por semana.',
                    en: 'Optimal exercise spread: 1–3 lifts per muscle per session (sweet spot 1–2) and 2–4 distinct variants per week.',
                },
                {
                    es: 'Variación dentro del mesociclo: cero rotaciones semana a semana en los días equivalentes.',
                    en: 'Intra-mesocycle consistency: never change exercises week-to-week on matching workout days.',
                },
            ],
            pitfalls: [
                {
                    es: 'Rotar ejercicios cada semana o borrar todo al iniciar un mesociclo nuevo aunque siga dando PRs, buen pump y cero dolor; usar cadencias exóticas sin razón; limitarse a un único rango de repeticiones.',
                    en: 'Changing exercises weekly, dropping productive pain-free lifts just because a new meso started, using gimmicky tempos, or locking into a single rep range year-round.',
                },
            ],
        },
        {
            rank: 6,
            id: 'potentiation',
            icon: 'Layers',
            name: { es: 'Potenciación entre Fases', en: 'Phase Potentiation' },
            tagline: {
                es: 'Hacé que el bloque actual prepare y multiplique los resultados del bloque siguiente.',
                en: 'Sequence workouts, mesocycles, and blocks so each phase amplifies the responsiveness of the next.',
            },
            summary: {
                es: 'La potenciación ocurre en cuatro escalas: (1) microciclo (cargas/reps graduales hacia >4 semanas), (2) mesociclo a mesociclo (ir de fases más pesadas y menor frecuencia a fases más livianas/metabólicas y mayor frecuencia mientras sube el MEV), (3) bloque a bloque (alternar ganancia muscular, resensibilización en mantenimiento y definición), y (4) carrera deportiva (Técnica -> Esfuerzo RIR -> Conexión Mente-Músculo/SFR).',
                en: 'Operates across 4 scales: microcycle (gradual load/rep steps), mesocycle-to-mesocycle (heavier/lower-frequency into lighter/higher-frequency metabolic phases as MEV rises), block-to-block (massing, MV resensitization, fat loss), and career progression (Technique -> RIR Effort -> MMC/SFR).',
            },
            keyRules: [
                {
                    es: 'Empezá los bloques frescos priorizando rangos pesados (5–10) y frecuencias moderadas; a medida que sube el MEV, pasá a cargas moderadas/altas en repeticiones más seguras para articulaciones.',
                    en: 'Open fresh blocks biased toward heavier 5–10 rep loads and moderate frequencies; shift toward higher-rep metabolic work and higher frequencies as fatigue and MEV climb.',
                },
                {
                    es: 'No saltes la resensibilización ni las etapas de definición necesarias cuando la grasa corporal frena la partición de nutrientes.',
                    en: 'Include periodic MV resensitization phases and fat-loss blocks rather than bulking indefinitely.',
                },
            ],
            pitfalls: [
                {
                    es: 'Alternar volumen y definición demasiado rápido (meses sueltos sin consolidar bloques), restringir cada mesociclo a un único rango rígido de repeticiones o no descargar nunca la resistencia al volumen.',
                    en: 'Flip-flopping bulk and cut every few weeks without full blocks, forcing hyper-rigid single rep ranges, or never running resensitization.',
                },
            ],
        },
        {
            rank: 7,
            id: 'individualization',
            icon: 'Cpu',
            name: { es: 'Individualización', en: 'Individualization' },
            tagline: {
                es: 'Ajustá los seis principios anteriores a tu genética, edad de entrenamiento, estilo de vida y respuesta real.',
                en: 'Tailor all six prior principles around your genetics, training age, diet phase, lifestyle, and real feedback.',
            },
            summary: {
                es: 'La individualización modifica todo el programa según capacidad de trabajo, recuperación, antropometría, proporción de fibras, sexo, edad de entrenamiento, horas de sueño y estrés diario. Los algoritmos de autorregulación (MEV Estimator, Set Progression y SFR) convierten tu respuesta real en ajustes concretos.',
                en: 'Modifies every principle using individual work capacity, recovery, anthropometry, fiber type profile, sex, training age, sleep, and stress. RP autoregulation algorithms translate your personal feedback directly into programming adjustments.',
            },
            keyRules: [
                {
                    es: 'Antes de declarar que un ejercicio "no va con tu cuerpo" (~5% real), probá al menos un mesociclo ajustando agarre, postura, posición de pies y técnica limpia.',
                    en: 'Before ditching a lift as "wrong for my anatomy" (truly ~5% of cases), refine grip, stance, bar path, and form across at least one full mesocycle.',
                },
                {
                    es: 'La técnica estandarizada y el ROM seguro mandan sobre "sentir el músculo" haciendo parciales arbitrarias (salvo excepciones muy específicas en atletas avanzados).',
                    en: 'Standardized technique and full safe ROM beat sacrificing movement integrity just for "feel" (except narrow advanced SFR exceptions).',
                },
            ],
            pitfalls: [
                {
                    es: 'Copiar la rutina exacta de un profesional o de tu compañero de gimnasio, síndrome de "copo de nieve especial" rechazando básicos sin dominarlos, o glorificar "the grind" empujando dolor articular más allá del MRV.',
                    en: 'Copying pro routines or cloning your training partner, "Special Snowflake Syndrome" abandoning basics prematurely, or blind "grind" culture pushing through systemic overreaching.',
                },
            ],
        },
    ] as RpPrincipleDef[],
    sraFrequencyAlgorithm: {
        title: {
            es: 'Algoritmo SRA para Derivar tu Frecuencia Óptima',
            en: 'SRA Frequency-Deriving Algorithm (5 Steps)',
        },
        steps: [
            {
                es: 'Entrená el grupo muscular con su MEV por sesión usando el Estimador MEV (puntuación objetivo 4–6/9).',
                en: 'Train the target muscle at session-MEV using the RP MEV Stimulus Estimator (targeting 4–6/9 score).',
            },
            {
                es: 'Esperá los días necesarios justo hasta que desaparezcan las agujetas y la sensación de cansancio local, y volvé a entrenarlo.',
                en: 'Wait just until target-muscle soreness and local fatigue clear, then train that muscle again.',
            },
            {
                es: 'Verificá tu rendimiento frente a la línea base: si igualaste o superaste tus reps/kilos al RIR planeado, anotá ese intervalo de días como válido. Si rendiste por debajo, sumá 1 día extra de descanso antes de la siguiente vuelta.',
                en: 'Check performance against baseline: if at/above planned reps & RIR, record that interval. If underperforming, add 1 extra recovery day before the next interval.',
            },
            {
                es: 'A partir de ahí, regulá el aumento de series sesión a sesión mediante el Algoritmo de Progresión de Series.',
                en: 'From that cadence onward, adjust session sets dynamically using the RP Set Progression Algorithm.',
            },
            {
                es: 'Tras 2–5 sesiones seguidas emergerá tu frecuencia estable real por músculo (generalmente 2–4x/sem). Alternativa práctica: partí de 2–3x/sem en splits fijos y bajá/subí medio o un día según si terminás recuperado o sobrecargado.',
                en: 'Across 2–5 sessions your true organic frequency stabilizes (typically 2–4x/wk). Practical shortcut: start with 2–3x/wk and add/remove a weekly slot if cumulative recovery lags or outperforms.',
            },
        ] as LocalizedString[],
    },
    exerciseSwapAudit: {
        title: {
            es: 'Auditoría de 3 Preguntas para Cambiar Ejercicios',
            en: '3-Question Exercise Deletion & Replacement Audit',
        },
        questions: [
            {
                es: '1. ¿Se estancó el rendimiento? ¿Dejaste de estar en camino a nuevos récords (PRs) de repeticiones/carga respecto a meses previos?',
                en: '1. Has performance stalled? Have you stopped hitting or tracking toward new rep/load PRs?',
            },
            {
                es: '2. ¿Te está lastimando? ¿Genera dolor articular o tendinoso persistente o creciente que no desaparece corrigiendo la técnica?',
                en: '2. Is it hurting you? Does it provoke worsening joint/tendon aches not resolved by technique refinement?',
            },
            {
                es: '3. ¿Se siente estancado/quemado? ¿Perdiste conexión mente-músculo, bombeo y disrupción local limpia, o cuesta demasiadas series estimularlo frente al desgaste articular?',
                en: '3. Does it feel stale? Are mind-muscle connection, pumps, and smooth technique fading relative to joint wear?',
            },
        ] as LocalizedString[],
        verdict: {
            es: 'Regla de decisión: si 2 o 3 respuestas son SÍ (o #2 empeora sin solución técnica), reemplazalo en el próximo mesociclo. Si todo funciona (PRs, bombeo, cero dolor), mantenelo meses o años. Al incorporar un ejercicio nuevo sin dolor agudo, dale al menos 1 mesociclo completo antes de juzgarlo.',
            en: 'Rule: If most answers are YES—or #2 involves worsening pain—swap the exercise next mesocycle. If a movement still delivers PRs, pumps, and zero joint pain, keep it for multiple cycles. Always give newly added pain-free lifts at least 1 full mesocycle.',
        },
    },
    trainingAges: [
        {
            id: 'beginner',
            label: { es: 'Principiante', en: 'Beginner' },
            careerFocus: {
                es: 'Dominar técnica limpia en patrones básicos compuestos (sentadilla, peso muerto, press, remo, dominada) en todos los grupos musculares principales.',
                en: 'Master crisp technique on foundational compounds (squats, hinges, presses, rows, pull-ups) across all major muscle groups.',
            },
            repRanges: {
                es: 'Mayoría en 5–10 reps (las series muy largas fatigan y degradan la técnica aprendida).',
                en: 'Mostly 5–10 reps—avoiding high-rep burnout that ingrains sloppy motor habits.',
            },
            rirFloor: {
                es: 'Nunca bajar de 2 RIR (mantener ≥2 reps limpias en recámara por seguridad técnica).',
                en: 'Never drop below 2 RIR—keep >=2 clean reps in reserve to lock in safe mechanics.',
            },
            frequency: {
                es: '2–3 sesiones full-body por semana (máx. 3–5 si es muy comprometido; nunca "bro splits"). Alta frecuencia por músculo y bajo volumen por sesión acelera el aprendizaje técnico.',
                en: '2–3 full-body sessions/wk (up to 3–5 max; never bro splits). Frequent practice with low sets/session speeds motor learning.',
            },
            volumeAndMesos: {
                es: 'Volúmenes MEV muy bajos (1–2 series iniciales), acumulaciones más largas, muy pocos bloques de resensibilización (bloques de hasta ~1 año).',
                en: 'Very low MEV (1–2 sets/session), longer accumulation runs, rare resensitization needed (blocks lasting up to ~1 year).',
            },
            variationAndSpec: {
                es: 'Pocos ejercicios totales; cero necesidad de especialización muscular (todo crece rápido). Elegí los movimientos de mayor RSM.',
                en: 'Small pool of exercises; zero specialization phases needed since everything grows rapidly on basic high-RSM lifts.',
            },
            specialRule: {
                es: 'Checklist de carga del principiante (2 preguntas): (1) ¿Mi técnica hoy fue igual o mejor que la sesión pasada? (2) ¿Mantengo al menos 2 RIR? Solo si ambas son SÍ, subí peso de forma gradual.',
                en: 'Beginner 2-Part Weight-Add Checklist: (1) Was technique as good or better than last session? (2) Is RIR still >=2? Add conservative weight only if BOTH answers are YES.',
            },
        },
        {
            id: 'intermediate',
            label: { es: 'Intermedio', en: 'Intermediate' },
            careerFocus: {
                es: 'Desplazar el foco del puro RSM hacia optimizar el Ratio Estímulo-Fatiga (SFR) e individualizar técnica, rangos de reps y frecuencias por músculo.',
                en: 'Shift focus from raw RSM to maximizing Stimulus-to-Fatigue Ratio (SFR) while individualizing technique, rep ranges, and per-muscle frequency.',
            },
            repRanges: {
                es: 'Todo el espectro efectivo (5–10, 10–20, 20–30), normalmente ~50% en la zona media de 10–20 reps por su alto SFR.',
                en: 'Full effective spectrum (5–10, 10–20, 20–30), typically centering ~50% of sets in 10–20 reps for peak SFR.',
            },
            rirFloor: {
                es: 'Progresión completa de ~4 RIR en Semana 1 hasta 1–0 RIR al cierre antes del Deload.',
                en: 'Full accumulation RIR ramp from ~4 RIR in Week 1 down to 1–0 RIR before deload.',
            },
            frequency: {
                es: '4–6 sesiones semanales, derivando frecuencias orgánicas de 2–6x/semana por grupo muscular según SRA.',
                en: '4–6 weekly sessions, targeting 2–6x/week per muscle organically derived via recovery speed.',
            },
            volumeAndMesos: {
                es: 'De MEV a MRV completo con acumulaciones ligeramente más cortas, resensibilizaciones periódicas cada varios mesociclos y primeros límites de MRV sistémico.',
                en: 'Full MEV-to-MRV ramps with shorter accumulations, scheduled resensitization blocks every 3–6 mesos, and early systemic MRV limits.',
            },
            variationAndSpec: {
                es: '2–3 ejercicios por músculo/meso siguiendo la auditoría de 3 preguntas. Empezá a bajar músculos secundarios a MEV cuando priorices otros.',
                en: '2–3 lifts/muscle per meso guided by the 3-question swap audit. Drop minor muscles to MEV on occasion to prioritize targets.',
            },
            specialRule: {
                es: 'Los intermedios consolidan su mapa personal de qué rangos (5–10 vs 10–20 vs 20–30) y variantes entregan mayor bomba, tensión y menor desgaste articular.',
                en: 'Intermediates build their personal logbook mapping which rep bands and exercises maximize pump/tension at lowest joint cost.',
            },
        },
        {
            id: 'advanced',
            label: { es: 'Avanzado', en: 'Advanced' },
            careerFocus: {
                es: 'Atacar puntos rezagados con máxima conexión mente-músculo, SFR quirúrgico y gestión agresiva de la fatiga acumulativa y tendinosa.',
                en: 'Bring up lagging muscles with razor-sharp mind-muscle connection, surgical SFR selection, and proactive joint/systemic fatigue control.',
            },
            repRanges: {
                es: 'Mayor sesgo hacia 10–20 y 20–30 reps; muchas veces limitan el rango 5–10 en músculos grandes si la carga axial/articular dispara el riesgo lesivo.',
                en: 'Greater bias toward 10–20 and 20–30 ranges; heavy 5–10 work may be curbed when high absolute loads lower SFR or risk injury.',
            },
            rirFloor: {
                es: 'Promedios bajos (2–0 RIR gran parte del ciclo), especialmente empujando al fallo en músculos pequeños de bajo costo sistémico.',
                en: 'Predominantly 2–0 RIR across blocks—especially pushing smaller low-fatigue muscles close to failure.',
            },
            frequency: {
                es: 'A menudo >6 sesiones semanales (o dobles diarios) con especialización obligatoria para no cruzar el MRV sistémico antes del MRV local.',
                en: 'Often >6 sessions/wk (even twice-daily splits) paired with specialization so systemic MRV never chokes local growth.',
            },
            volumeAndMesos: {
                es: 'Brecha MEV–MRV estrecha con saltos pequeños de series/carga; reemplazá algunas resensibilizaciones por Descanso Activo para sanar tendones.',
                en: 'Narrow MEV–MRV window requiring tiny weekly increments; substitute Active Rest blocks regularly to heal connective tissues.',
            },
            variationAndSpec: {
                es: 'Especialización constante: bajá músculos grandes ya desarrollados estrictamente a MV (nunca zona muerta MV–MEV) para liberar recuperación hacia 1–2 prioridades.',
                en: 'Frequent specialization: hold non-prioritized large muscles strictly at MV (avoiding MV–MEV junk volume) to fund recovery for 1–2 priority muscles.',
            },
            specialRule: {
                es: 'Avanzados pueden experimentar por mesos con sesgo MEV-MRV (cerca MEV con más carga/reps vs rango medio vs cerca MRV con más series) y usar ROM parcial estricto solo si el músculo objetivo pasa a ser el limitante real o mejora drásticamente el SFR.',
                en: 'Advanced lifters can test MEV–MRV biasing (near-MEV load-biased vs mid-range vs top-end volume-biased) and targeted partial ROM only when it makes the target muscle the true limiter or dramatically boosts SFR.',
            },
        },
    ] as RpTrainingAgeDef[],
    effectiveStimulusRanges: {
        specs: [
            {
                label: { es: 'Tensión / Carga', en: 'Tension / Load' },
                value: '30%–85% 1RM',
                note: { es: 'Efecto equivalente por serie dura', en: 'Equal growth per hard set across range' },
            },
            {
                label: { es: 'Repeticiones', en: 'Rep Range' },
                value: '5–30 reps',
                note: { es: 'Distribuidas en los 3 sub-rangos', en: 'Spread across all 3 loading bands' },
            },
            {
                label: { es: 'Esfuerzo (RIR)', en: 'Relative Effort' },
                value: '5–0 RIR',
                note: { es: 'Promedio óptimo del ciclo: 2–3 RIR', en: 'Optimal cycle average: 2–3 RIR' },
            },
            {
                label: { es: 'Cadencia', en: 'Tempo' },
                value: '2–3s exc · ≤9s',
                note: { es: 'Control excéntrico + toque limpio', en: 'Controlled eccentric · <=9s total/rep' },
            },
        ],
        repDistribution: [
            {
                range: '5–10 reps',
                share: '~25%',
                tone: 'red' as const,
                profile: {
                    es: 'Sesgo hacia fibras rápidas (Tipo II) y máxima tensión por rep. Más desgaste articular y fatiga sistémica; ejecútalo al inicio de la sesión y al principio de la semana cuando estás fresco.',
                    en: 'Biases fast-twitch tension stimulus. Higher joint/systemic wear—place first in sessions and earlier in the week while fresh.',
                },
                caution: {
                    es: 'Evitalo en aislamientos frágiles como elevaciones laterales o aperturas con mancuernas.',
                    en: 'Avoid overly heavy 5-rep loading on delicate isolations like lateral raises or DB flyes.',
                },
            },
            {
                range: '10–20 reps',
                share: '~50%',
                tone: 'primary' as const,
                profile: {
                    es: 'El "punto dulce" de hipertrofia: combina tensión sólida, metabolitos, excelente conexión mente-músculo y el mayor SFR promedio para la mayoría de atletas.',
                    en: 'The classic hypertrophy sweet spot: marries strong mechanical tension, metabolites, peak mind-muscle connection (MMC), and highest average SFR.',
                },
                caution: {
                    es: 'Ideal para la mitad del trabajo semanal y para movimientos compuestos guiados o mancuernas.',
                    en: 'Forms the bulk (~50%) of weekly volume across compounds, machines, and dumbbells.',
                },
            },
            {
                range: '20–30 reps',
                share: '~25%',
                tone: 'emerald' as const,
                profile: {
                    es: 'Máximo bombeo, acumulación de metabolitos y estrés bajo sobre articulaciones; ideal para el final de sesión, final de semana y bloques de definición o poca fatiga axial.',
                    en: 'Maximizes cell swelling and metabolic stress with gentle joint loads—great late in sessions/weeks, in machines, or during fat-loss blocks.',
                },
                caution: {
                    es: 'Evitalo en pesos muertos o sentadillas pesadas (limita el cardio/espalda baja antes que el músculo) y sin excéntricas ultra lentas que caigan bajo 30% 1RM.',
                    en: 'Incompatible with barbell deadlifts (systemic/cardio fails first) or ultra-slow eccentrics under 30% 1RM.',
                },
            },
        ],
        romRules: {
            title: {
                es: 'Rango de Movimiento (ROM): Estiramiento Completo Sin Quiebre',
                en: 'Range of Motion (ROM): Deep Stretch Within Safe Limits',
            },
            summary: {
                es: 'Buscá el ROM más amplio posible que brinde estiramiento y contracción profundos manteniendo al músculo objetivo como limitante. Frená la extensión adicional del ROM solo si ocurre una de estas 3 señales:',
                en: 'Use the fullest safe ROM producing a clear stretch and contraction with the target muscle limiting the lift. Stop extending ROM further only if one of 3 limits hits:',
            },
            limits: [
                {
                    es: '1. La técnica se deforma (ej. redondeo lumbar excesivo al fondo de la sentadilla).',
                    en: '1. Technique breaks down (e.g., lumbar spine rounding excessively at squat bottom).',
                },
                {
                    es: '2. El esfuerzo migra a otros músculos no deseados (ej. hiper-estirar brazos en aperturas sobrecarga bíceps en lugar de pectoral).',
                    en: '2. Non-target muscles take over (e.g., hyper-extending elbows on flyes shifts load off pecs onto biceps).',
                },
                {
                    es: '3. Aparece dolor articular específico por tu anatomía (acortá justo antes del pinzamiento o rotá a una variante amigable).',
                    en: '3. Joint pain arises from individual anthropometry (shorten just short of impingement or pick a joint-friendly variant).',
                },
            ],
        },
        loadVsRepRule: {
            title: {
                es: 'Progresión en Carga vs Repeticiones (Saltos de Mancuernas)',
                en: 'Load vs. Rep Progression (Handling Large Plate/Dumbbell Jumps)',
            },
            body: {
                es: 'Tanto subir kilos manteniendo reps como subir reps manteniendo peso cumplen la sobrecarga mientras sigan el mapa RIR (4 -> 3 -> 2 -> 1). Cuando el salto mínimo disponible es muy grande (ej. mancuernas de 7.5 a 10 kg en vuelos laterales 10–20 reps), progresá primero en repeticiones semana a semana hasta superar el techo de 20 reps y recién entonces subí al siguiente par cerca de 10 reps. Ante la duda, pecá siempre de conservador al subir kilos.',
                en: 'Progressing weight at steady reps or progressing reps at steady weight both drive hypertrophy as long as RIR tightens weekly (4 -> 3 -> 2 -> 1). When plate/DB jumps are too steep to stay in-band (e.g. 15->20 lb lateral raises), push reps up toward the top ceiling first, then jump up in load near the bottom rep target. Always err conservatively on load jumps.',
            },
        },
    },
    autoregAlgorithms: {
        mevEstimator: {
            title: {
                es: 'Estimador MEV / Magnitud de Estímulo (RSM)',
                en: 'RP MEV Stimulus Estimator & RSM (0–9)',
            },
            subtitle: {
                es: 'Usalo tras tu primera sesión de Semana 1 para verificar si tu volumen inicial dio en tu MEV real.',
                en: 'Score Week 1 target muscle response across 3 metrics to verify your starting set volume matches your true MEV.',
            },
            metrics: [
                {
                    id: 'mmc',
                    label: { es: 'Conexión Mente-Músculo (Tensión / Ardor)', en: 'Mind-Muscle Connection (Tension / Burn)' },
                    prompt: { es: '¿Cuánto desafiaste al músculo objetivo?', en: 'How much did the session challenge target muscles?' },
                    levels: [
                        { es: '0: Apenas sentí el músculo objetivo durante el ejercicio', en: '0: Barely aware of target muscles during the lift' },
                        { es: '1: Sentí que trabajó de manera leve/moderada', en: '1: Felt target muscles work, but only mildly' },
                        { es: '2: Buena tensión y/o ardor metabólico claro en el objetivo', en: '2: Felt a good amount of tension and/or burn' },
                        { es: '3: Tensión y ardor cerca del límite directamente en el músculo objetivo', en: '3: Tension and burn near limit directly in target muscles' },
                    ],
                },
                {
                    id: 'pump',
                    label: { es: 'Congestión / Bombeo (Pump)', en: 'The Pump (Cell Swelling)' },
                    prompt: { es: '¿Qué nivel de bombeo lograste en el músculo objetivo?', en: 'How much pump did you experience in target muscles?' },
                    levels: [
                        { es: '0: Cero bombeo en absoluto', en: '0: No pump at all in target muscles' },
                        { es: '1: Bombeo muy leve y fugaz', en: '1: Very mild pump in target muscles' },
                        { es: '2: Bombeo decente y notorio', en: '2: Decent, noticeable pump' },
                        { es: '3: Bombeo cercano al máximo posible', en: '3: Close to maximal pump in target muscles' },
                    ],
                },
                {
                    id: 'disruption',
                    label: { es: 'Disrupción Muscular (Fatiga local / Perturbación / DOMS)', en: 'Muscle Disruption (Weakness / Stiffness / DOMS)' },
                    prompt: { es: '¿Cuánto disrumpiste al músculo objetivo post-sesión?', en: 'How much did the session disrupt target muscles?' },
                    levels: [
                        { es: '0: Sin fatiga, perturbación ni agujetas posteriores', en: '0: No fatigue, perturbation, or soreness' },
                        { es: '1: Rigidez/debilidad breve resuelta al día siguiente', en: '1: Brief stiffness/weakness, recovered by next day' },
                        { es: '2: Debilidad post-sesión y algo de agujetas al día siguiente', en: '2: Post-session stiffness + some soreness the next day' },
                        { es: '3: Debilidad marcada inmediata + agujetas por varios días', en: '3: Pronounced weakness/perturbation + soreness for days' },
                    ],
                },
            ] as RpScoreRubricDef[],
            bands: [
                {
                    min: 0,
                    max: 1,
                    rangeLabel: '0–1',
                    tone: 'amber',
                    proximity: { es: 'Muy por debajo de tu MEV', en: 'Likely well below MEV' },
                    recommendation: { es: 'Sumá +2 a +4 series por semana desde la próxima semana.', en: 'Increase volume next week by 2–4 sets.' },
                },
                {
                    min: 2,
                    max: 3,
                    rangeLabel: '2–3',
                    tone: 'amber',
                    proximity: { es: 'En el borde o algo debajo de tu MEV', en: 'Likely at or just below MEV' },
                    recommendation: { es: 'Sumá +2 a +4 series la semana próxima para entrar de lleno en crecimiento.', en: 'Increase volume next week by 2–4 sets.' },
                },
                {
                    min: 4,
                    max: 6,
                    rangeLabel: '4–6',
                    tone: 'emerald',
                    proximity: { es: 'Punto justo: en o apenas encima de tu MEV', en: 'Sweet spot: right at or just above MEV' },
                    recommendation: { es: 'Arranque ideal del mesociclo. Progresá normalmente con el Algoritmo de Series.', en: 'Ideal mesocycle start! Progress normally using Set Progression.' },
                },
                {
                    min: 7,
                    max: 9,
                    rangeLabel: '7–9',
                    tone: 'red',
                    proximity: { es: 'Entre MAV y MRV (posible exceso temprano)', en: 'Between MAV & MRV (possibly exceeding MRV)' },
                    recommendation: { es: 'Reducí ligeramente el volumen la próxima semana para no agotar el ciclo antes de tiempo.', en: 'Drop volume the following week to protect accumulation length.' },
                },
            ] as RpMevBandDef[],
        },
        setProgression: {
            title: {
                es: 'Algoritmo de Progresión de Series (Tabla 2.3)',
                en: 'RP Set Progression Algorithm (Table 2.3)',
            },
            subtitle: {
                es: 'Combiná tu nivel de agujetas al volver a entrenar con tu rendimiento respecto al objetivo semanal.',
                en: 'Cross-reference muscle soreness upon returning to train that muscle with your rep/RIR performance.',
            },
            sorenessLevels: [
                { es: '0: Nada adolorido en el músculo objetivo', en: '0: Not sore at all in target muscles' },
                { es: '1: Rigidez unas horas y agujetas leves resueltas antes de volver a entrenarlo', en: '1: Stiff briefly + mild soreness healed before next session' },
                { es: '2: DOMS moderado que sanó justo a tiempo para esta sesión', en: '2: DOMS that resolved just in time for next session' },
                { es: '3: Todavía con DOMS activo al llegar la siguiente sesión de ese músculo', en: '3: DOMS remained when the next session arrived' },
            ] as [LocalizedString, LocalizedString, LocalizedString, LocalizedString],
            performanceLevels: [
                { es: '0: Cumpliste reps objetivo pero hiciste ≥2 reps extra (o ≥2 RIR sobrados)', en: '0: Hit reps easily (+2 extra reps or 2+ RIR ahead of target)' },
                { es: '1: Cumpliste reps objetivo con 0–1 rep extra o 1 RIR de margen', en: '1: Hit target reps at or 1 RIR ahead of target' },
                { es: '2: Alcanzaste las reps pasando el RIR objetivo (más cerca del fallo de lo planeado)', en: '2: Hit target reps only by overshooting target RIR' },
                { es: '3: No pudiste igualar las repeticiones de la semana pasada a ningún RIR', en: '3: Could not match last week reps at any RIR' },
            ] as [LocalizedString, LocalizedString, LocalizedString, LocalizedString],
            // matrix[soreness][performance]
            matrix: [
                [
                    { delta: '+1–3', label: { es: 'Sumá 1–3 series', en: 'Add 1–3 sets' }, tone: 'primary' },
                    { delta: '+0–2', label: { es: 'Sumá 0–2 series', en: 'Add 0–2 sets' }, tone: 'emerald' },
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: 'Recup.', label: { es: 'Sesión de recuperación', en: 'Employ recovery session' }, tone: 'red' },
                ],
                [
                    { delta: '+1–2', label: { es: 'Sumá 1–2 series', en: 'Add 1–2 sets' }, tone: 'emerald' },
                    { delta: '+0–1', label: { es: 'Sumá 0–1 series', en: 'Add 0–1 sets' }, tone: 'emerald' },
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: 'Recup.', label: { es: 'Sesión de recuperación', en: 'Employ recovery session' }, tone: 'red' },
                ],
                [
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: 'Recup.', label: { es: 'Sesión de recuperación', en: 'Employ recovery session' }, tone: 'red' },
                ],
                [
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: '+0', label: { es: 'No sumes series', en: 'Do not add sets' }, tone: 'zinc' },
                    { delta: 'Recup.', label: { es: 'Sesión de recuperación', en: 'Employ recovery session' }, tone: 'red' },
                ],
            ] as RpSetProgressionCell[][],
            plainSummary: [
                {
                    es: 'Si te recuperás antes de tiempo y sobra rendimiento -> sumá series.',
                    en: 'Recovering ahead of schedule -> add sets.',
                },
                {
                    es: 'Si te recuperás justo a tiempo o un poco tarde pero cumplís objetivo -> mantené series.',
                    en: 'Recovering just in time while hitting targets -> hold sets steady.',
                },
                {
                    es: 'Si no te recuperás y perdés rendimiento -> aplicá sesión de recuperación o deload.',
                    en: 'Under-recovering and missing last week targets -> deploy fatigue management.',
                },
            ] as LocalizedString[],
        },
        sfrCalculator: {
            title: {
                es: 'Calculadora SFR (Estímulo ÷ Fatiga — Fig. 3.1)',
                en: 'SFR Calculator (Stimulus ÷ Fatigue — Fig. 3.1)',
            },
            subtitle: {
                es: 'Divide tu Magnitud de Estímulo Bruto (RSM 0–9 de arriba) entre los 3 indicadores de fatiga generada.',
                en: 'Divides your Raw Stimulus Magnitude (RSM 0–9 above) by the 3 generated fatigue proxies.',
            },
            fatigueMetrics: [
                {
                    id: 'joint',
                    label: { es: 'Desgaste Articular y Conectivo', en: 'Joint & Connective Tissue Disruption' },
                    prompt: { es: '¿Cuánto estresó articulaciones y tendones?', en: 'How much joint/connective tissue stress occurred?' },
                    levels: [
                        { es: '0: Dolor o molestia nula o mínima en articulaciones', en: '0: Minimal to no joint/connective tissue pain' },
                        { es: '1: Alguna molestia leve recuperada al día siguiente', en: '1: Mild ache recovered by the next day' },
                        { es: '2: Tensión o dolor persistente durante 1 o varios días', en: '2: Persistent pain/tightness across 1+ days' },
                        { es: '3: Dolor crónico en tendones o articulaciones por días/semanas', en: '3: Chronic joint/tendon pain persisting days to weeks' },
                    ],
                },
                {
                    id: 'exertion',
                    label: { es: 'Esfuerzo Percibido por Serie', en: 'Perceived Exertion Per Set' },
                    prompt: { es: '¿Cuánto desgaste psicológico/sistémico demandó?', en: 'How taxing was perceived systemic exertion?' },
                    levels: [
                        { es: '0: Se sintió liviano psicológicamente', en: '0: Felt easy with very low psychological drain' },
                        { es: '1: Exigente, pero recuperado antes de terminar el día', en: '1: Solid effort, felt recovered by end of day' },
                        { es: '2: Gran esfuerzo; te sentiste drenado hasta el día siguiente', en: '2: Hard effort; felt drained into next day' },
                        { es: '3: Esfuerzo brutal; exhausto durante varios días', en: '3: All-out war; drained systemically for days' },
                    ],
                },
                {
                    id: 'unusedPerformance',
                    label: { es: 'Caída en Músculos No Usados', en: 'Unused Muscle Performance Drop' },
                    prompt: { es: '¿Cuánto cayó el rendimiento de otros músculos luego?', en: 'Did subsequent unused muscles lose performance?' },
                    levels: [
                        { es: '0: Rendimiento en ejercicios posteriores mejor de lo esperado', en: '0: Performance on later unused lifts better than expected' },
                        { es: '1: Rendimiento posterior exactamente como se esperaba', en: '1: Performance on later unused lifts normal' },
                        { es: '2: Rendimiento notablemente peor en músculos no relacionados', en: '2: Performance on later unused lifts noticeably worse' },
                        { es: '3: Deterioro severo tras el ejercicio (ej. press tras peso muerto)', en: '3: Huge performance drop in unrelated lifts after' },
                    ],
                },
            ] as RpScoreRubricDef[],
            verdicts: {
                high: {
                    label: { es: 'SFR Excelente — Ejercicio Estrella', en: 'High SFR — Prime Hypertrophy Choice' },
                    advice: {
                        es: 'Mucho estímulo local por muy poca fatiga. Priorizalo como pilar en tus mesociclos.',
                        en: 'High local growth stimulus for minimal recovery tax. Keep this lift as a staple.',
                    },
                },
                moderate: {
                    label: { es: 'SFR Sólido / Equilibrado', en: 'Solid / Balanced SFR' },
                    advice: {
                        es: 'Buen balance estímulo-fatiga. Podés elevar el SFR puliendo el control excéntrico y evitando balanceos.',
                        en: 'Workable trade-off. Raise SFR further by slowing eccentrics, expanding safe ROM, and cutting momentum.',
                    },
                },
                low: {
                    label: { es: 'SFR Bajo — Revisar Técnica o Variar', en: 'Low SFR — Refine Technique or Replace' },
                    advice: {
                        es: 'Genera demasiada fatiga articular o sistémica frente al estímulo recibido. Probá ajustar postura/agarre o rotar a una máquina o variante con mejor palanca.',
                        en: 'Costing too much joint/systemic fatigue for limited target stimulus. Refine execution or rotate next meso.',
                    },
                },
            },
            improveRules: [
                {
                    es: 'Aplicar fuerzas altas en el mayor ROM seguro del músculo objetivo.',
                    en: 'Apply high tension across the largest safe target-muscle ROM.',
                },
                {
                    es: 'Minimizar participación e impulso de músculos secundarios no deseados.',
                    en: 'Minimize swinging, momentum, and non-target muscle takeover.',
                },
                {
                    es: 'Controlar fase excéntrica y concéntrica reduciendo estrés tendinoso.',
                    en: 'Control eccentrics and reversals to cut joint/connective wear.',
                },
                {
                    es: 'Elegir variantes de menor carga axial/sistémica cuando el estímulo empata (ej. peso muerto rumano o curl femoral vs peso muerto convencional para isquios).',
                    en: 'Prefer lower axial/systemic fatigue variants at equal local stimulus (e.g., RDL or leg curl vs conventional deadlift for hamstrings).',
                },
            ] as LocalizedString[],
        },
    },
    executionScience: {
        restChecklistTitle: {
            es: 'Checklist de 4 Puntos Antes de la Próxima Serie',
            en: '4-Point Inter-Set Rest Readiness Checklist',
        },
        restChecklistNote: {
            es: 'En series rectas el tiempo típico oscila entre 30 s y 4–5 min según el tamaño muscular y la carga axial. Arrancá la siguiente serie solo cuando los 4 puntos sean SÍ:',
            en: 'Typical straight-set rests fall between 30 s and 4–5 min depending on muscle mass and systemic load. Begin the next set only once all 4 checks pass:',
        },
        restChecklist: [
            {
                es: '1. ¿El músculo objetivo ya se recuperó para sacar al menos 5 reps limpias?',
                en: '1. Has the target muscle recovered enough to perform at least 5 clean reps?',
            },
            {
                es: '2. ¿Se recuperaron los músculos sinergistas (ej. tríceps/hombros) para que no limiten al músculo principal?',
                en: '2. Have synergist muscles recovered so they do not fail before the target muscle?',
            },
            {
                es: '3. ¿Se recuperó tu sistema nervioso para reclutar fuerza estable sin temblor excesivo?',
                en: '3. Has your central nervous system recovered enough not to limit force output?',
            },
            {
                es: '4. ¿Normalizaste la respiración y el sistema cardiorrespiratorio?',
                en: '4. Has your cardiorespiratory system recovered so breathing is no longer the limiter?',
            },
        ] as LocalizedString[],
        overloadModalitiesTitle: {
            es: 'Modalidades de Sobrecarga y Conteo de Series (Tablas 2.1 y 5.1)',
            en: 'Overload Modalities & Set Counting (Tables 2.1 & 5.1)',
        },
        overloadModalities: [
            {
                id: 'straight',
                name: { es: 'Series Rectas (Straight Sets)', en: 'Straight Sets' },
                loadAndRest: { es: '5–30 reps · 30s–4min descanso', en: '5–30 reps · 30s–4min rest' },
                setCountRule: { es: 'Conteo 1:1 (cada serie cuenta como 1 serie)', en: 'Count 1:1 (each set = 1 set)' },
                whenToUse: {
                    es: 'Base del programa en 5–10 reps y mayoría del volumen semanal.',
                    en: 'Ideal for heavy 5–10 rep work and the majority of baseline hypertrophy volume.',
                },
                whenToAvoid: {
                    es: 'Cuando buscás estrés metabólico extremo con tiempo mínimo o descanso muy breve.',
                    en: 'When specifically chasing extreme short-rest metabolite fatigue in late-stage isolation work.',
                },
            },
            {
                id: 'down_sets',
                name: { es: 'Series Descendentes (Down Sets)', en: 'Down Sets (Back-Off)' },
                loadAndRest: { es: 'Bajás peso tras series pesadas (<5 reps)', en: 'Reduce load after heavy sets drop <5 reps' },
                setCountRule: { es: 'Conteo 1:1', en: 'Count 1:1' },
                whenToUse: {
                    es: 'Cuando en series muy pesadas empezás a caer por debajo de 5 reps efectivas.',
                    en: 'Whenever heavy fatigue pushes later working sets below 5 reps.',
                },
                whenToAvoid: {
                    es: 'No bajes el peso si todavía podés sostener reps válidas dentro del rango con la carga inicial.',
                    en: 'Avoid dropping load prematurely while you can still stay inside the target rep range.',
                },
            },
            {
                id: 'eccentric_pause',
                name: { es: 'Excéntricas Controladas y Pausas', en: 'Controlled Eccentrics & Pauses' },
                loadAndRest: { es: 'Pausa 1s + excéntrica 2–3s', en: '1s pause + 2–3s eccentric' },
                setCountRule: { es: 'Conteo 1:1', en: 'Count 1:1' },
                whenToUse: {
                    es: 'Mejorar técnica, eliminar rebotes peligrosos y rehabilitar/prevenir lesiones articulares.',
                    en: 'Technique refinement, injury prevention/rehab, and removing bounce out of the hole.',
                },
                whenToAvoid: {
                    es: 'En series de 20–30 reps (obliga a usar pesos debajo del ~30% 1RM).',
                    en: 'In 20–30 rep sets where slowed cadence drops load below effective 30% 1RM.',
                },
            },
            {
                id: 'giant_sets',
                name: { es: 'Giant Sets / Marathon Sets', en: 'Giant / Marathon Sets' },
                loadAndRest: { es: 'Objetivo total de reps (ej. 50–100) con micro-pausas', en: 'Target rep total (e.g., 50–100) in mini clusters' },
                setCountRule: { es: 'Cada tramo con descanso cuenta como 2/3 de serie', en: 'Each bout between rests counts as ~2/3 set' },
                whenToUse: {
                    es: 'Cuando dominás tus landmarks, buscás técnica/MMC fluida o volvés de lesión con pesos livianos.',
                    en: 'When landmarks are dialed in, polishing MMC/technique, or returning from injury.',
                },
                whenToAvoid: {
                    es: 'Si aún no conocés tu MEV/MRV: es muy difícil rastrear sobrecarga y fatiga exacta.',
                    en: 'When unsure of your volume landmarks, as tracking week-to-week overload is noisy.',
                },
            },
            {
                id: 'myoreps',
                name: { es: 'Myoreps (Match Reps / Rest-Pause)', en: 'Myoreps' },
                loadAndRest: { es: '10–20RM · descansos de 5–30s', en: '10–20RM · 5–30s micro-rests' },
                setCountRule: { es: 'Cada mini-serie cuenta ~2/3 de serie (o 1:1 si te fatigan mucho)', en: 'Each mini-set = ~2/3 set (or 1:1 if very fatiguing)' },
                whenToUse: {
                    es: 'Cuando tenés poco tiempo en músculos pequeños o de bajo desgaste sistémico (aislamientos/máquinas).',
                    en: 'When time-crunched on isolations/machines with low systemic fatigue.',
                },
                whenToAvoid: {
                    es: 'Cuando la prioridad es técnica limpia o en compuestos sistémicos (sentadilla, peso muerto, remo libre).',
                    en: 'Avoid on high systemic lifts or when technique/MMC refinement is the goal.',
                },
            },
            {
                id: 'drop_sets',
                name: { es: 'Drop Sets', en: 'Drop Sets' },
                loadAndRest: { es: '10–20RM -> 20–30RM · 2–5s de transición', en: '10–20RM -> 20–30RM · 2–5s swap' },
                setCountRule: { es: 'Cada descarga cuenta como ~2/3 de serie', en: 'Each drop counts as ~2/3 set' },
                whenToUse: {
                    es: 'Para disparar metabolitos y bombeo rápido en máquinas o aislamientos (bias hacia fibras lentas).',
                    en: 'Rapidly driving metabolites and pump on isolations/machines.',
                },
                whenToAvoid: {
                    es: 'En ejercicios pesados de 5–10 reps o movimientos de alta fatiga axial.',
                    en: 'Avoid on heavy 5–10 rep compounds or systemically demanding barbell lifts.',
                },
            },
            {
                id: 'supersets',
                name: { es: 'Superseries (Pre-Fatiga y Antagonistas)', en: 'Supersets (Pre-Exhaust & Antagonist)' },
                loadAndRest: { es: '0–5s entre par · 1–3min (o 30–90s Meso 3) tras par', en: '0–5s inside pair · 1–3min (30–90s Meso 3) after' },
                setCountRule: { es: 'Antagonista: 1+1 por músculo · Pre-fatiga: 1.5–2 para el objetivo', en: 'Antagonist: 1 set each · Pre-exhaust: 1.5–2 sets target' },
                whenToUse: {
                    es: 'Antagonistas (empuje/tirón): ahorran mucho tiempo. Pre-fatiga (aislamiento -> compuesto): supera sinergistas dominantes.',
                    en: 'Non-overlapping (antagonist): huge time-saver. Pre-exhaust: isolates hard-to-feel muscles before a compound.',
                },
                whenToAvoid: {
                    es: 'En avanzados buscando rendimiento pico o si el ahogo cardiovascular limita antes que el músculo.',
                    en: 'Avoid when cardiovascular fatigue caps performance or maximal heavy load progression is priority.',
                },
            },
            {
                id: 'occlusion',
                name: { es: 'Entrenamiento con Oclusión (BFR)', en: 'Blood Flow Restriction (Occlusion / BFR)' },
                loadAndRest: { es: '20–30% 1RM · descansos 5–30s', en: '20–30% 1RM · 5–30s rest' },
                setCountRule: { es: 'Cada serie cuenta ~2/3 de serie efectiva', en: 'Each set counts as ~2/3 set' },
                whenToUse: {
                    es: 'Al volver de lesiones (extremidades) o al final de definiciones duras para acumular metabolitos sin carga mecánica.',
                    en: 'Injury return or deep contest prep on limb muscles to drive growth with very light 20–30% 1RM loads.',
                },
                whenToAvoid: {
                    es: 'En torso/core imposible de ocluir, compuestos pesados o más de ~1 mesociclo seguido (se adapta rápido).',
                    en: 'Avoid on trunk muscles, primary compounds, or for longer than ~1 mesocycle (rapid adaptation).',
                },
            },
        ] as RpOverloadModalityDef[],
        fatigueToolbox: {
            title: {
                es: 'Caja de Herramientas Completa de Fatiga (7 Estrategias)',
                en: '7 Fatigue Management Tools (Prevention + Alleviation)',
            },
            pulsatility: {
                title: { es: 'Pulsatilidad del Microciclo (Prevención)', en: 'Microcycle Pulsatility (Prevention)' },
                body: {
                    es: '1) Rotá sesiones pesadas y livianas (y ángulos distintos, ej. tirón vertical pesado + remo liviano en día 1 y al revés en día 2). 2) Colocá músculos grandes y cargas pesadas (5–10 reps) al inicio de la semana cuando estás fresco y dejá volumen liviano/aislado (20–30) para el cierre. 3) Aprovechá la asimetría natural de la semana dejando 1–2 días libres completos tras los últimos días de mayor fatiga.',
                    en: '1) Rotate heavy vs light days and movement angles (e.g., heavy vertical pull + light rows early week, then flip late week). 2) Place heavy big-muscle sessions early in the week while fresh and lighter metabolic work later. 3) Put 1–2 complete rest days at week end so accumulated fatigue clears cleanly.',
                },
            },
            restDays: {
                title: { es: 'Días de Descanso Completo (1–2/Semana)', en: 'Complete Rest Days (1–2/Week)' },
                body: {
                    es: 'A igual volumen semanal (ej. 100 series en 6 o 5 días vs 7 días seguidos), incluir 1–2 días libres totales de gimnasio reduce drásticamente el estrés psicológico y sistémico. Evitá crear un día extra solo para bíceps y pantorrillas si podés sumarlos al cierre de otras sesiones.',
                    en: 'Even with weekly sets equated, taking 1–2 full days off from the gym lowers psychological and systemic fatigue dramatically. Only exceed 6 sessions/wk if you are genuinely advanced.',
                },
            },
            recoverySessions: {
                title: { es: 'Sesiones de Recuperación (Autorregulación Puntual)', en: 'Recovery Sessions (Targeted Autoregulation)' },
                body: {
                    es: 'Cuándo usarlas: si chocás con tu MRV antes de lo previsto, ante una molestia articular menor o un resfrío sin fiebre. Cómo hacerlas: recortá series Y repeticiones a la mitad manteniendo la carga planeada (o recortá series Y peso a la mitad manteniendo reps). Al volver: si fue por MRV temprano, reanudá en el punto medio entre tu MEV y MRV; si fue por resfrío/molestia resuelta, bajá 1–2 series por ejercicio en la vuelta.',
                    en: 'When: hitting MRV early, minor acute tweak, or fever-free head cold. How: cut sets AND reps in half at planned weight (or cut sets AND weight in half at planned reps). Return: restart midway between MEV and MRV if due to early MRV, or trim 1–2 sets/exercise if returning from cold/tweak.',
                },
            },
            deloadProtocolExtra: {
                title: { es: 'Disparadores de Deload Autoregulado y Variantes', en: 'Autoregulated Deload Triggers & Exercise Choices' },
                body: {
                    es: 'Adelantá el Deload sin esperar a la última semana si: (1) más de la mitad de tus músculos ya necesitaron 2 rondas de recuperación en este ciclo, (2) más de la mitad requirió sesión de recuperación en las últimas 2 semanas, o (3) tenés fiebre o lesión aguda. Estructura semanal: 1.ª mitad = mitad de series y mitad de reps con la carga pico; 2.ª mitad = mitad de series, mitad de reps y además mitad de peso. Principiantes usan mismos ejercicios; intermedios pueden ensayar variantes del próximo meso; avanzados pueden usar sustitutos de baja carga axial (ej. hiperextensiones a 45° en lugar de peso muerto rumano pesado).',
                    en: 'Pull deload early if >50% of muscles needed recovery cycles twice this meso, >50% needed a recovery session in the past 2 weeks, or illness/fever strikes. Weekly structure: 1st half cuts sets & reps 50% at peak weight; 2nd half also cuts weight 50%. Exercise options: beginners keep current lifts, intermediates may rehearse next-meso lifts, advanced may swap to low-axial substitutes (e.g., 45-degree back extensions vs heavy RDLs).',
                },
            },
            activeRest: {
                title: { es: 'Descanso Activo Anual (1–2 Semanas)', en: 'Annual Active Rest (1–2 Weeks/Year)' },
                body: {
                    es: 'Tomate al menos 1–2 semanas de descanso total o actividad muy ligera al año (ideal tras un Deload o en vacaciones): la mínima pérdida muscular temporal vuelve rapidísimo al retomar, mientras limpiás microtraumas tendinosos, desbalances hormonales y saturación mental. Cuidá no atracarte para no sumar grasa innecesaria.',
                    en: 'Take 1–2 weeks off from hard training once per year (ideally right after a deload/holiday): any brief muscle loss rebounds rapidly while tendons, hormones, and psychology reset completely. Keep nutrition sensible rather than binging.',
                },
            },
        },
    },
    dietAndCardioScience: {
        dietPhasesTitle: {
            es: 'Cómo Cambian tus Volume Landmarks en Cada Dieta',
            en: 'How Diet Phases Shift Your Volume Landmarks',
        },
        dietPhases: [
            {
                phase: { es: 'Superávit Calórico (Massing)', en: 'Muscle Gain Phase (Surplus)' },
                tone: 'emerald' as const,
                landmarksShift: {
                    es: 'MV baja · MEV baja · Pico de MAV más alto · MRV sube',
                    en: 'MV drops · MEV drops · Peak MAV rises · MRV rises',
                },
                strategy: {
                    es: 'La ventana MEV–MRV se ensancha y cada serie genera más músculo nuevo. Mejor estrategia: mantené la progresión semanal prudente y estirá la acumulación 1+ semana extra (avanzados pueden sumar saltos de carga levemente mayores). Podés usar ejercicios de mayor RSM y mantener grupos no prioritarios con poquísimas series.',
                    en: 'Your adaptive window widens and MAV peaks higher. Best play: keep weekly jumps conservative and extend accumulation by 1+ extra week (or slightly faster load progress for advanced lifters). Great time for high-RSM lifts and low-cost specialization.',
                },
            },
            {
                phase: { es: 'Mantenimiento (Eucalórico)', en: 'Weight Maintenance (Eucaloric)' },
                tone: 'zinc' as const,
                landmarksShift: {
                    es: 'Ventana MEV–MRV estándar (línea base)',
                    en: 'Baseline MEV–MRV window',
                },
                strategy: {
                    es: 'Para intermedios avanzados y avanzados, buscar crecimiento agresivo en mantenimiento suele tener bajo retorno; brillan en cambio las fases breves de Resensibilización estrictamente en MV (incluso 1x/semana en rangos de 5–10 reps) con alta eficiencia estímulo/tiempo.',
                    en: 'For advanced lifters, chasing new growth at maintenance yields diminishing returns—use maintenance periods primarily for sharp MV Resensitization blocks (down to 1x/wk in heavy 5–10 ranges) to restore volume sensitivity.',
                },
            },
            {
                phase: { es: 'Déficit Calórico (Cutting)', en: 'Fat Loss Phase (Hypocaloric)' },
                tone: 'red' as const,
                landmarksShift: {
                    es: 'MV sube · MEV sube · MRV baja · MAV casi en cero',
                    en: 'MV rises · MEV rises · MRV drops · MAV drops near zero',
                },
                strategy: {
                    es: 'Necesitás más estímulo solo para no perder músculo, mientras tu recuperación cae. Mantené la duración normal de mesociclos con progresiones más chicas y quédate cerca del MEV sin perseguir PRs irreales. Priorizá ejercicios de máximo SFR, más trabajo en 10–20/20–30 (seguridad articular) y frecuencias algo mayores anti-catabólicas. NO hagas fases de especialización en definición: distribuí el estímulo parejo para conservar todo el cuerpo.',
                    en: 'You need more sets just to hold muscle while recovery drops. Keep normal meso duration with tiny increments near MEV; favor highest-SFR exercises, lighter 10–20/20–30 rep ranges for tendon safety, and higher frequencies. NEVER specialize during a cut—maintain every muscle evenly.',
                },
            },
        ],
        neatAndCardioTitle: {
            es: 'NEAT, Cardio de Bajo Impacto y Señal de Alerta',
            en: 'NEAT Priority, Low-Impact Cardio & Red Flags',
        },
        neatAndCardioRules: [
            {
                es: 'Priorizá el NEAT (pasos diarios, caminar, actividad cotidiana) antes de añadir cardio estructurado: quema muchas calorías con fatiga sistémica mínima.',
                en: 'Prioritize NEAT (daily steps and lifestyle movement) over formal cardio—burning calories with minimal systemic fatigue.',
            },
            {
                es: 'Señal de alerta roja: si tu NEAT se desploma en pocas semanas de dieta (hasta levantarte de la silla cuesta esfuerzo), estás haciendo demasiado cardio, comiendo demasiado poco o ambos.',
                en: 'Red-flag warning: if NEAT plummets abruptly early in a diet (simple daily tasks feel exhausting), you are doing too much cardio, dieting too hard, or both.',
            },
            {
                es: 'Jerarquía por menor impacto articular y reparto muscular: Elíptica > Caminata inclinada > Bicicleta estática > Correr (mayor daño e interferencia en piernas).',
                en: 'Low-impact modality hierarchy: Elliptical > Incline Walking > Cycling > Running (highest local leg damage and interference).',
            },
            {
                es: 'Límites de cardio pro-hipertrofia: mantené sesiones ≤60 min, frecuencia cardíaca moderada (≤140 LPM en la mayoría) y evitá HIIT innecesario en etapas de ganancia muscular.',
                en: 'Hypertrophy-safe cardio caps: <=60 min per session, cap intensity around <=140 BPM, and limit unnecessary HIIT.',
            },
            {
                es: 'Consolidación de estresores (Chad Wesley Smith): nunca mezcles cardio duro y pesas en la misma tanda; si coinciden el mismo día, separalos 4–8 h (mínimo 2 h) con comidas de por medio — así preservás días de recuperación completa.',
                en: 'Consolidation of Stressors: separate lifting and cardio by 4–8 hours (2 h minimum) with meals between rather than cramming them together, preserving true off days during the week.',
            },
        ] as LocalizedString[],
        sportAndStrengthTitle: {
            es: 'Fuerza vs Hipertrofia e Integración en Otros Deportes',
            en: 'Strength vs. Hypertrophy & Multi-Sport Athletes',
        },
        sportAndStrengthNotes: [
            {
                es: 'No optimices fuerza máxima e hipertrofia al máximo en un mismo bloque: el powerlifting usa menor volumen para expresar adaptaciones neurales; el culturismo acumula alto volumen que enmascara fuerza temporalmente pero añade masa real que luego potencia tu fuerza futura.',
                en: 'Do not expect a single block to peak both 1RM strength and muscle mass simultaneously: lower-volume strength blocks express neural output, while high-volume hypertrophy adds the new muscle ceiling for future strength.',
            },
            {
                es: 'Si entrenás otro deporte (MMA, CrossFit, rugby, resistencia): usá compuestos básicos con barra en 5–10 reps (máxima intención veloz en concéntrica), bajá frecuencia muscular 0.5–1x/semana menos que un plan puro de físico y reducí volumen deportivo/cardio a MV durante los bloques dedicados a ganar masa.',
                en: 'Sports integration rules: anchor lifts on barbell compounds at 5–10 reps with maximal concentric velocity intent, drop weekly per-muscle frequency by 0.5–1x vs pure physique templates, and trim conditioning/cardio down to MV.',
            },
        ] as LocalizedString[],
    },
    specialCases: {
        troubleshootingTitle: {
            es: 'Diagnóstico en 9 Puntos Cuando Falta Progreso',
            en: '9-Point Troubleshooting Checklist for Stalled Progress',
        },
        troubleshooting: [
            {
                es: '1. Revisá tus Volume Landmarks: confirmá que cada músculo estancado esté realmente entre MEV y MRV (ni sub-entrenado ni pasado de rosca).',
                en: '1. Audit Volume Landmarks: ensure the lagging muscle truly lives between MEV and MRV.',
            },
            {
                es: '2. Controlá la fatiga integral: 8+ horas de sueño, nutrición diligente, manejo de estrés y deloads/autorregulación puntuales.',
                en: '2. Manage overall fatigue: prioritize 8+ hours sleep, steady nutrition, stress control, and timely deloads.',
            },
            {
                es: '3. Auditá SFR y variedad de repeticiones: si solo hiciste 5–10 reps en un músculo, probá llevar trabajo a 10–20 y 20–30.',
                en: '3. Check SFR and rep variety: if you only ever trained 5–10 reps on a body part, test 10–20 and 20–30 bands.',
            },
            {
                es: '4. Mejorá técnica, RIR y conexión mente-músculo: verificá técnica estricta -> cercanía real a 5–0 RIR -> conexión local.',
                en: '4. Refine order of stimulus: strict technique -> genuine proximity to failure (5–0 RIR) -> mind-muscle connection.',
            },
            {
                es: '5. Verificá balance nutricional neto: ganar 4 kg en volumen y perder 6 kg en definición no acumula peso magro año a año.',
                en: '5. Check net macrocycle nutrition: if you cut more weight than you gain across cycles, overall mass stagnates.',
            },
            {
                es: '6. Hacé fases de Resensibilización y Descanso Activo periódicas cada varios mesociclos.',
                en: '6. Include periodic MV Resensitization and annual Active Rest phases to restore sensitivity.',
            },
            {
                es: '7. Tené paciencia por bloques: el músculo apreciable crece a escala de bloques y macrociclos, no semana a semana.',
                en: '7. Think in blocks and macrocycles: measurable tissue takes blocks to accumulate, not single weeks.',
            },
            {
                es: '8. Mantené expectativas realistas ajustadas a tu edad de entrenamiento y genética.',
                en: '8. Keep expectations calibrated to genetics and training age.',
            },
            {
                es: '9. Consistencia sostenida: sin adherencia en entrenamiento, dieta y sueño es imposible diagnosticar qué ajustar.',
                en: '9. Stay consistent across training, diet, and sleep before diagnosing variable tweaks.',
            },
        ] as LocalizedString[],
        measuringProgressTitle: {
            es: 'Cómo Medir Progreso Muscular Real (Y Ritmos Anuales)',
            en: 'Measuring Real Hypertrophy & Realistic Annual Gain Rates',
        },
        measuringProgressPoints: [
            {
                es: 'RSM y SFR confirmados: buenos bombeos, tensión, disrupción razonable + comida y descanso adecuados = crecimiento garantizado aunque tarde en verse en el espejo.',
                en: 'High RSM & SFR paired with proper surplus nutrition and recovery confirms growth is occurring even before mirror changes pop.',
            },
            {
                es: 'Récords al reintroducir un ejercicio: tras varios meses sin hacer un movimiento, batir tu PR previo apenas recuperás la coordinación es prueba sólida de tejido muscular nuevo (no solo neural).',
                en: 'Rep-strength PRs upon reintroducing a lift after months away provide hard evidence of real contractile tissue added rather than pure neural practice.',
            },
            {
                es: 'Expectativa anual realista (incluso DEXA tiene margen de ruido semanal): Principiante ~4.5–9 kg (10–20 lb)/año · Intermedio ~2.2–4.5 kg (5–10 lb)/año · Avanzado ~1–2.2 kg (2–5 lb)/año.',
                en: 'Realistic annual lean muscle rates (explaining why single-week scans are noisy): Beginner ~10–20 lb/yr · Intermediate ~5–10 lb/yr · Advanced ~2–5 lb/yr.',
            },
        ] as LocalizedString[],
        specializationTitle: {
            es: 'Fases de Especialización (Cuando el MRV Sistémico Limita)',
            en: 'Specialization Phases (Freeing Systemic Recovery Bandwidth)',
        },
        specializationBody: {
            es: 'Cuando ya sos grande y fuerte, entrenarlo todo al límite choca contra tu MRV sistémico (caen sueño, humor, apetito y motivación) antes de que varios músculos lleguen a su MRV local. Solución: dedicá un bloque de entrenamiento priorizando 1–2 grupos musculares de MEV a MRV mientras mantenés el resto en MEV (intermedios) o estrictamente en MV (avanzados). Ejemplo: bajar espalda de MEV 10 a MV 4 libera 6 series recuperativas semanales para brazos u hombros. Recordá resensibilizar también los grupos priorizados cada varios mesos.',
            en: 'Bigger, stronger lifters often hit systemic MRV (poor sleep, mood, motivation, appetite) before local muscles reach their MRVs. Dedicate a training block running 1–2 priority muscles from MEV to MRV while holding other muscles—especially big systemic drivers—strictly at MV (or MEV for intermediates). Dropping back from 10 to 4 weekly sets frees massive recovery bandwidth for lagging targets. Remember to resensitize even priority muscles every few mesocycles.',
        },
        timeCrunchedTitle: {
            es: '9 Estrategias de Máxima Eficiencia (Poca Disponibilidad Horaria)',
            en: '9 Time-Saving Strategies (Maximizing STR)',
        },
        timeCrunched: [
            { es: '1. Priorizá compuestos multiarticulares (sentadilla, remo, press) para estimular varios músculos simultáneamente.', en: '1. Favor multi-joint compounds (squats, rows, presses) to hit multiple muscles simultaneously.' },
            { es: '2. Elegí compuestos "generales" más balanceados (ej. press cerrado o dominada supina cerrada reparten estímulo en pectoral/espalda y brazos).', en: '2. Pick balanced general compounds (e.g., close-grip bench, underhand pull-ups) sharing work across prime movers and arms.' },
            { es: '3. Usá ejercicios de armado y calentamiento rápido (máquinas selectorizadas, mancuernas, flexiones o zancadas vs cargas lentas de barra).', en: '3. Choose fast setup/warm-up gear (machines, dumbbells, pushups/lunges vs long barbell rack setups).' },
            { es: '4. Incluí más trabajo en rangos moderados-livianos (15–30 reps): requieren muchas menos series de aproximación.', en: '4. Lean toward lighter 15–30 rep ranges which need far fewer warm-up sets to reach safe working loads.' },
            { es: '5. Aplicá superseries antagonistas (ej. flexiones <-> jalones con 15–30 s): un músculo descansa localmente mientras trabaja el opuesto.', en: '5. Run antagonist supersets (e.g., push <-> pull with 15–30 s rest) for huge time compression.' },
            { es: '6. Aprovechá Myoreps y Drop Sets en aislamientos de rápida recuperación.', en: '6. Deploy myoreps and drop sets on quick-recovering isolation muscles.' },
            { es: '7. Recortá o congelá el escalado de series (ej. 3–4 -> 7–8 o serie fija semanal) para que la Semana 5 no se duplique en duración.', en: '7. Dampen or freeze set additions (e.g. 3–4 up to 7–8, or static set counts) so late-week workouts stay short.' },
            { es: '8. Entrená un poco más cerca del fallo desde Semana 1 (2–1 RIR -> 0 RIR): cuando hacés bajo volumen semanal podés gastar ese margen en intensidad.', en: '8. Start at lower RIRs (2–1 RIR down to 0 RIR) since low weekly volume leaves abundant recovery margin.' },
            { es: '9. Avanzados sin tiempo: rotá fases claras de especialización (2 músculos de MEV->MRV y el resto al mínimo MV).', en: '9. Time-crunched advanced lifters: cycle sharp specialization phases (2 priority muscles MEV->MRV, everything else at MV).' },
        ] as LocalizedString[],
        lowInjuryRiskTitle: {
            es: 'Entrenamiento de Muy Bajo Riesgo de Lesión (9 Reglas)',
            en: 'Very Low Injury Risk Training Protocol (9 Rules)',
        },
        lowInjuryRiskIntro: {
            es: 'Útil tras desgarros repetidos, en viajes con estrés/jet-lag o semanas previas a un campeonato donde lesionarse sería catastrófico:',
            en: 'Ideal after recurring strains, during stressful travel, or late contest prep when preventing injury outweighs squeezing out peak overload:',
        },
        lowInjuryRisk: [
            { es: '1. No superes ~70% de tu 1RM (no bajes del ~15RM en ningún movimiento).', en: '1. Cap all loads at <=70% 1RM (~15RM or lighter across lifts).' },
            { es: '2. Usá pausas completas en cada transición (arriba y abajo) eliminando picos de fuerza por rebote.', en: '2. Pause cleanly at every directional turnaround to eliminate rebound force spikes.' },
            { es: '3. Ralentizá excéntricas a ~3 s y concéntricas controladas a ~2 s.', en: '3. Slow eccentrics to ~3 s and concentrics to ~2 s to maintain strict control.' },
            { es: '4. Concentrá la atención en conexión mente-músculo para maximizar estímulo con menos kilos.', en: '4. Emphasize mind-muscle connection to amplify local stimulus with lighter loads.' },
            { es: '5. Frená la acumulación a ~2/3 o 3/4 de tu MRV (descargá apenas notes bombeos/agujetas grandes).', en: '5. End accumulation ~2/3 to 3/4 of the way to MRV and deload proactively.' },
            { es: '6. Progresá agregando repeticiones antes que peso cada microciclo.', en: '6. Progress reps rather than load week-to-week.' },
            { es: '7. Preferí máquinas estables y guiadas frente a pesos libres inestables.', en: '7. Favor stable machines over free weights where balance deviations spike forces.' },
            { es: '8. Detené todas las series dejando al menos 2 RIR (evitá fallos técnicos inestables).', en: '8. Stop sets at >=2 RIR—never push to unstable maximal failure.' },
            { es: '9. Aumentá series semanalmente de forma conservadora (+1 serie en lugar de +2).', en: '9. Add sets conservatively (+1 where you might normally add +2).' },
        ] as LocalizedString[],
        postInjuryTitle: {
            es: 'Regreso Gradual Post-Lesión en 6 Fases',
            en: 'Post-Injury Return to Training (6 Phases)',
        },
        postInjuryDisclaimer: {
            es: 'Siempre obtené alta médica y completá tu rehabilitación kinésica antes de reiniciar cargas. Si aparece dolor agudo en la zona lesionada, detené el protocolo y consultá a tu médico.',
            en: 'Always obtain medical clearance and complete prescribed physical therapy first. Stop immediately if sharp pain returns at the injury site.',
        },
        postInjuryPhases: [
            {
                phase: '1',
                title: { es: 'Completar Fisioterapia / Kinesiología', en: 'Finish Physical Therapy (PT)' },
                body: {
                    es: 'Cumplí toda la rehabilitación clínica hasta recuperar funciones diarias normales sin dolor y recibir luz verde médica.',
                    en: 'Complete prescribed PT until cleared for everyday functional tasks pain-free.',
                },
            },
            {
                phase: '2',
                title: { es: 'Aislamientos con Oclusión (si aplica)', en: 'Occluded Isolation Sets (Limb Injuries)' },
                body: {
                    es: 'En músculos ocluibles, arrancá con 1 serie aislada al ~20% 1RM subiendo lento hasta ~30% 1RM y RIR ≥3 (máx. 3x/sem), dentro del ROM totalmente indoloro. (Si no es ocluible, como pectoral, pasá a la Fase 3).',
                    en: 'Start with 1 occluded isolation set at ~20% 1RM climbing gradually to ~30% 1RM at >=3 RIR (<=3x/wk) inside pain-free ROM. (Skip to Phase 3 for trunk muscles.)',
                },
            },
            {
                phase: '3',
                title: { es: 'Aislamientos Descanso Corto y Expansión de ROM', en: 'Short-Rest Isolations & ROM Expansion' },
                body: {
                    es: 'Subí progresivamente del 30% al 50% 1RM en sets de ≥25 reps con recuperación total entre 2–3 sesiones/sem (llegando cerca de 1 RIR al final), ganando ROM completo sin molestias.',
                    en: 'Transition off occlusion climbing slowly from 30% toward 50% 1RM (25+ reps first sets, 2–3x/wk) while safely expanding back toward full anatomical ROM.',
                },
            },
            {
                phase: '4',
                title: { es: 'Reintroducir Compuestos (Pre-Fatiga si ayuda)', en: 'Reintroduce Compound Movements' },
                body: {
                    es: 'Sumá movimientos compuestos estables con pausas completas en cada transición; podés mantener el aislamiento antes para limitar el peso del compuesto. Subí lento hasta ~60% 1RM (~15–20 reps) sin molestias.',
                    en: 'Add compounds with full turnaround pauses (optionally pre-fatiguing with isolation first to limit absolute load). Progress gradually toward ~60% 1RM (15–20 reps).',
                },
            },
            {
                phase: '5',
                title: { es: 'Escalado Gradual de Carga hacia 10RM', en: 'Gradual Load Climb Back to ~10RM' },
                body: {
                    es: 'Dedica al menos 1 mes (o más sin apuro) a acercarte paulatinamente a tu 10RM en compuestos por múltiples series con cero síntomas de la lesión vieja.',
                    en: 'Spend at least a full month without rushing climbing compound weights steadily toward working 10RM loads with zero old-injury symptoms.',
                },
            },
            {
                phase: '6',
                title: { es: 'Entrenamiento Normal Periodizado', en: 'Full Normal Hypertrophy Training' },
                body: {
                    es: 'Tras lesiones mayores puede llevar 6–12 meses totales, aunque en los primeros ~3 meses recuperás casi toda la masa perdida gracias a la memoria muscular.',
                    en: 'Full timelines range 6–12 months after major surgery/rehab, yet almost all lost muscle typically rebounds within the first ~3 months of progressive loading.',
                },
            },
        ],
        membersModulesTitle: {
            es: 'Módulos Avanzados y Members-Only RP',
            en: 'RP Members-Only & Advanced Modules',
        },
        membersModules: [
            {
                id: 'deload_stages',
                badge: { es: 'DELOAD', en: 'DELOAD' },
                title: { es: 'Las 4 Etapas del Deload (Wired → Ready)', en: '4 Stages of Deload Recovery (Wired → Ready)' },
                body: {
                    es: '1. Wired (energía acelerada inicial: no subas peso ni bajes de 5 RIR) → 2. Tired (letargo profundo a mitad de semana al caer adrenalina) → 3. Restless (ansiedad por volver a entrenar duro: aguantá los días finales suaves) → 4. Ready (articulaciones limpias y explosividad intacta para Semana 1).',
                    en: '1. Wired (initial amped bounce: never add volume or push below 5 RIR) → 2. Tired (deep mid-week lethargy as stress hormones normalize) → 3. Restless (itchy to lift heavy again: finish light days) → 4. Ready (snappy joints and bar speed for Week 1).',
                },
            },
            {
                id: 'active_vs_passive',
                badge: { es: 'RECUPERACIÓN', en: 'RECOVERY' },
                title: { es: 'Recuperación Activa vs. Pasiva', en: 'Active vs. Passive Recovery' },
                body: {
                    es: 'La recuperación activa (sesión al ~50% de carga y 5 RIR o caminatas suaves) acelera flujo sanguíneo y despeja agujetas locales mejor que el reposo absoluto en cama, siempre que no añadas fatiga nueva ni estrés excéntrico.',
                    en: 'Active recovery (flush sets at ~50% load / 5 RIR plus easy walking) enhances local blood flow and soreness clearance compared to complete inactivity, provided it avoids eccentric damage.',
                },
            },
            {
                id: 'delayed_gains',
                badge: { es: 'ADAPTACIÓN', en: 'ADAPTATION' },
                title: { es: 'Delayed Gains y Supercompensación', en: 'Delayed Gains & Post-Meso Supercompensation' },
                body: {
                    es: 'El cansancio crónico de las semanas MRV enmascara tu fuerza y tamaño visual temporalmente. La síntesis proteica y fuerza explosiva suelen manifestarse recién tras limpiar fatiga al completar el Deload y abrir el siguiente bloque.',
                    en: 'Cumulative fatigue during peak MRV weeks masks true strength and muscle fullness. Expressing delayed gains requires finishing the deload before judging a mesocycle outcome.',
                },
            },
            {
                id: 'low_volume_tradeoffs',
                badge: { es: 'VOLUMEN', en: 'VOLUME' },
                title: { es: 'Trade-offs del Bajo Volumen vs. Alto Volumen', en: 'Low-Volume Trade-offs' },
                body: {
                    es: 'Entrenar cerca de MV/MEV ahorra tiempo y articulaciones, ideal en mantenimiento, cortes agresivos o vida saturada, pero deja hipertrofia sin exprimir en músculos prioritarios respecto a recorrer todo tu rango MEV→MRV en superávit.',
                    en: 'Training near MV/MEV preserves muscle with tiny fatigue and time cost—great during cuts or busy periods—but sacrifices maximal growth upside compared to progressing MEV→MRV in a surplus.',
                },
            },
            {
                id: 'rir_vs_rpe',
                badge: { es: 'ESFUERZO', en: 'EFFORT' },
                title: { es: 'RIR vs. RPE en Hipertrofia RP', en: 'RIR vs. RPE in RP Hypertrophy' },
                body: {
                    es: 'Aunque son inversos (2 RIR ≈ RPE 8), RP usa RIR porque contar repeticiones restantes en series de 10–30 reps es más concreto para autorregular cargas que estimar una escala subjetiva de esfuerzo global.',
                    en: 'While mathematically inverse (2 RIR ≈ RPE 8), RP standardizes on RIR because counting reps left in reserve scales cleanly across 10–30 rep hypertrophy sets.',
                },
            },
            {
                id: 'mm_lp',
                badge: { es: 'SET TYPES', en: 'SET TYPES' },
                title: { es: 'Myorep Match (MM) y Lengthened Partials (LP)', en: 'Myorep Match (MM) & Lengthened Partials (LP)' },
                body: {
                    es: 'Myorep Match exige igualar la meta de reps de la serie 1 usando mini-descansos de 10–15 s cuando no llegas directo. Lengthened Partials extiende el rango estirado al alcanzar el fallo concéntrico completo en aislamientos seguros.',
                    en: 'Myorep Match matches Set 1 reps via brief 10–15 s rest-pauses whenever straight reps fall short. Lengthened Partials add controlled stretch-range half-reps after concentric failure on safe isolations.',
                },
            },
            {
                id: 'cut_autoregulation',
                badge: { es: 'DIETA', en: 'DIETING' },
                title: { es: 'Autorregulación en Déficit Calórico', en: 'Caloric Deficit Autoregulation' },
                body: {
                    es: 'En déficit, tu MRV baja y tu MEV sube: no persigas PRs agresivos ni bloques de especialización. Usá los ajustes RP para sostener cargas actuales y detener la subida de series ni bien las articulaciones o recuperación avisen.',
                    en: 'During fat loss, MRV compresses while MEV creeps up. Avoid aggressive PR chasing or specialization blocks; prioritize holding existing loads cleanly and capping set increases early.',
                },
            },
        ],
    },
    glossary: [
        {
            id: 'mv',
            term: { es: 'MV — Volumen de Mantenimiento', en: 'MV — Maintenance Volume' },
            category: { es: 'Landmarks', en: 'Landmarks' },
            definition: { es: 'Series semanales mínimas para evitar pérdida de masa muscular.', en: 'Minimum training volume required to prevent muscle loss.' },
        },
        {
            id: 'mev',
            term: { es: 'MEV — Volumen Mínimo Efectivo', en: 'MEV — Minimum Effective Volume' },
            category: { es: 'Landmarks', en: 'Landmarks' },
            definition: { es: 'Volumen mínimo a partir del cual comienza hipertrofia medible; punto ideal de inicio del mesociclo.', en: 'Minimum volume needed to stimulate robust muscle growth; ideal meso starting point.' },
        },
        {
            id: 'mav',
            term: { es: 'MAV — Volumen Adaptativo Máximo', en: 'MAV — Maximum Adaptive Volume' },
            category: { es: 'Landmarks', en: 'Landmarks' },
            definition: { es: 'Rango móvil entre MEV y MRV que entrega el mayor ritmo de crecimiento muscular por unidad de tiempo.', en: 'Dynamic volume peak between MEV and MRV delivering greatest hypertrophy per unit time.' },
        },
        {
            id: 'mrv',
            term: { es: 'MRV — Volumen Máximo Recuperable', en: 'MRV — Maximum Recoverable Volume' },
            category: { es: 'Landmarks', en: 'Landmarks' },
            definition: { es: 'Techo máximo de volumen recuperable antes de caer en sobreentrenamiento funcional y pérdida de rendimiento.', en: 'Maximum recoverable training volume before overreaching and negative returns occur.' },
        },
        {
            id: 'rir',
            term: { es: 'RIR — Repeticiones en Reserva', en: 'RIR — Reps in Reserve' },
            category: { es: 'Esfuerzo', en: 'Effort' },
            definition: { es: 'Distancia en repeticiones limpias hasta el fallo técnico. Rango efectivo: 5–0 RIR.', en: 'Reps shy of technical muscular failure. Effective stimulus range: 5–0 RIR.' },
        },
        {
            id: 'rsm',
            term: { es: 'RSM — Magnitud de Estímulo Bruto', en: 'RSM — Raw Stimulus Magnitude' },
            category: { es: 'Cálculo', en: 'Metric' },
            definition: { es: 'Suma 0–9 de Conexión Mente-Músculo (0–3) + Pump (0–3) + Disrupción Muscular (0–3).', en: '0–9 stimulus score combining Mind-Muscle Connection + Pump + Muscle Disruption.' },
        },
        {
            id: 'sfr',
            term: { es: 'SFR — Ratio Estímulo-Fatiga', en: 'SFR — Stimulus to Fatigue Ratio' },
            category: { es: 'Cálculo', en: 'Metric' },
            definition: { es: 'RSM ÷ Fatiga generada (dolor articular + esfuerzo percibido + caída en músculos no usados).', en: 'RSM ÷ Fatigue generated (joint disruption + exertion + unused muscle drop).' },
        },
        {
            id: 'str',
            term: { es: 'STR — Ratio Estímulo-Tiempo', en: 'STR — Stimulus to Time Ratio' },
            category: { es: 'Cálculo', en: 'Metric' },
            definition: { es: 'Cuánta hipertrofia se estimula por minuto invertido en el gimnasio (clave con poco tiempo).', en: 'Muscle growth stimulus delivered per unit of training time invested.' },
        },
        {
            id: 'sftr',
            term: { es: 'SFTR — Ratio Estímulo-Fatiga-Tiempo', en: 'SFTR — Stimulus Fatigue Time Ratio' },
            category: { es: 'Cálculo', en: 'Metric' },
            definition: { es: 'Índice combinado que evalúa estímulo total frente al costo conjunto de fatiga y tiempo.', en: 'Combined index weighing muscle growth against both fatigue cost and time spent.' },
        },
        {
            id: 'sra',
            term: { es: 'SRA — Estímulo-Recuperación-Adaptación', en: 'SRA — Stimulus-Recovery-Adaptation' },
            category: { es: 'Frecuencia', en: 'Frequency' },
            definition: { es: 'Ciclo de estímulo, recuperación de fatiga y supercompensación que dicta cuándo volver a entrenar un músculo.', en: 'Cycle of training stimulus, fatigue recovery, and growth determining optimal training frequency.' },
        },
        {
            id: 'microcycle',
            term: { es: 'Microciclo', en: 'Microcycle' },
            category: { es: 'Estructura', en: 'Structure' },
            definition: { es: 'Unidad cíclica mínima que incluye todos los días de entreno y descanso (típicamente 1 semana).', en: 'Shortest repeated cycle containing all training and rest days (typically 1 week).' },
        },
        {
            id: 'mesocycle',
            term: { es: 'Mesociclo', en: 'Mesocycle' },
            category: { es: 'Estructura', en: 'Structure' },
            definition: { es: 'Secuencia organizada de microciclos compuesta por una fase de Acumulación (4–8 sem) y un Deload.', en: 'Organized sequence of microcycles composed of an accumulation phase (4–8 wks) plus a deload.' },
        },
        {
            id: 'accumulation',
            term: { es: 'Fase de Acumulación', en: 'Accumulation Phase' },
            category: { es: 'Estructura', en: 'Structure' },
            definition: { es: 'Semanas progresivas donde aumentan series, reps, carga y cercanía al fallo desde MEV hasta MRV.', en: 'Sequential weeks ramping sets, reps, load, and proximity to failure from MEV toward MRV.' },
        },
        {
            id: 'deload',
            term: { es: 'Descarga (Deload)', en: 'Deload Phase' },
            category: { es: 'Fatiga', en: 'Fatigue' },
            definition: { es: 'Microciclo completo de bajo volumen y carga en MV que disipa fatiga sistémica y tendinosa conservando el músculo.', en: 'Full low-volume/low-load microcycle dissipating cumulative fatigue while preserving muscle size.' },
        },
        {
            id: 'macrocycle',
            term: { es: 'Macrociclo y Bloque', en: 'Macrocycle & Block' },
            category: { es: 'Estructura', en: 'Structure' },
            definition: { es: 'Un Bloque agrupa mesos con igual objetivo (ganancia o definición); 1–4 bloques forman un Macrociclo anual.', en: 'A Block groups mesocycles sharing a goal; 1–4 blocks comprise a full multi-month Macrocycle.' },
        },
        {
            id: 'resensitization',
            term: { es: 'Fase de Resensibilización', en: 'Resensitization Phase' },
            category: { es: 'Potenciación', en: 'Potentiation' },
            definition: { es: 'Bloque corto (3–6 sem) en mantenimiento y volumen MV para bajar el MEV elevado y recuperar respuesta anabólica.', en: 'Short low-volume MV maintenance block reducing adaptive resistance and lowering MEV for future growth.' },
        },
        {
            id: 'minicut',
            term: { es: 'Minicut', en: 'Minicut' },
            category: { es: 'Dieta', en: 'Diet' },
            definition: { es: 'Fase breve y agresiva de pérdida de grasa diseñada para potenciar un nuevo bloque de ganancia muscular.', en: 'Short, focused fat-loss phase designed to shed excess fat and potentiate subsequent muscle gain.' },
        },
        {
            id: 'functional_overreaching',
            term: { es: 'Sobreentrenamiento Funcional (Overreaching)', en: 'Functional Overreaching' },
            category: { es: 'Fatiga', en: 'Fatigue' },
            definition: { es: 'Acumulación planificada de fatiga en el pico de la última semana justo antes de descargar en Deload.', en: 'Planned accumulation of fatigue at peak accumulation week intentionally cleared by a scheduled deload.' },
        },
        {
            id: 'neat',
            term: { es: 'NEAT — Termogénesis Sin Ejercicio', en: 'NEAT — Non-Exercise Activity Thermogenesis' },
            category: { es: 'Cardio/Dieta', en: 'Diet/Cardio' },
            definition: { es: 'Gasto calórico de actividades diarias fuera del gym (caminar, tareas, moverse); clave para definir con mínima fatiga.', en: 'Daily calories burned outside formal workouts (walking, chores, posture); burns energy with minimal recovery cost.' },
        },
    ] as RpGlossaryTermDef[],
};
