/**
 * Two Block Mass — Nick Nilsson (2018)
 *
 * Mesocycle programming for hypertrophy + strength.
 * 6-week cycle = 3 weeks Accumulation (volume) + 3 weeks Intensification (strength)
 * Deload week optional between cycles.
 *
 * Structure:
 *   - 4 Accumulation blocks (Time-Volume, Cluster, Rest-Pause, VHF)
 *   - 4 Intensification blocks (Low-Rep 5-3-1, Single-Rep Cluster, Triple Add, Compound Exercise Overload)
 *   - Deload week (Off → Fun → Off → Strength Test)
 *   - One-Week Mass (compressed: 2 days Accumulation + 2 days Intensification per week)
 */

import { MuscleGroup, SetType } from '../types';

export type TwoBlockPhase = 'accumulation' | 'intensification' | 'deload' | 'one_week';

export interface TwoBlockDay {
    day: number;
    label?: { en: string; es: string };       // optional title (e.g. "Pyramid Clusters Day")
    muscles: { group: MuscleGroup; sets: number }[];
    note?: { en: string; es: string };
}

export interface TwoBlockWeek {
    week: number;
    restSeconds: number;                       // primary rest between sets
    repRange?: string;                         // e.g. "12-15", "10x1", "5-3-1"
    setsPerLarge?: number;                     // hint for chest/back/quads
    setsPerSmall?: number;                     // hint for arms/calves
    days: TwoBlockDay[];
}

export interface TwoBlockProtocol {
    id: string;
    phase: TwoBlockPhase;
    blockNumber: number;                       // 1-4 within its phase
    name: { en: string; es: string };
    primarySetType: SetType;
    short: { en: string; es: string };         // 1-sentence summary
    long: { en: string; es: string };          // full protocol description
    keyRules: { en: string[]; es: string[] }; // bullet rules
    schedule: TwoBlockWeek[];                   // 3 weeks for Acc/Int, 1 for deload, etc
}

// ─── ACCUMULATION BLOCKS ──────────────────────────────────────────────────────

const TIME_VOLUME: TwoBlockProtocol = {
    id: 'tbm_acc_time_volume',
    phase: 'accumulation',
    blockNumber: 1,
    name: { en: 'Time-Volume Training', es: 'Time-Volume Training' },
    primarySetType: 'time_volume',
    short: {
        en: 'Density training: 3-rep sets every 10s within 15-min blocks. Front-loads volume, no failure.',
        es: 'Densidad: series de 3 reps cada 10s en bloques de 15 min. Carga front-loaded, sin fallo.',
    },
    long: {
        en: 'Pick a weight you could do for 10–12 reps. Do 3 reps, rest 10s. Repeat with the same weight and 10s rest until you can no longer hit 3. Then bump rest to 20s, then 30s, etc., always with 3-rep sets. Keep going for 15 min (large parts) or 7.5 min (small parts). NEVER go to failure — stop the moment a 3rd rep would be a struggle. PROGRESSION: if you can hold 10s rest for at least 1/3 of the block (5 min for large, 2.5 min for small), increase the weight next time.',
        es: 'Elige un peso para 10–12 reps. Haz 3 reps, descansa 10s. Repite con el mismo peso y 10s hasta que ya no puedas 3. Sube descanso a 20s, luego 30s, etc., siempre con series de 3. Continúa 15 min (grandes) o 7,5 min (pequeños). NUNCA al fallo — para cuando la 3ª rep sería difícil. PROGRESIÓN: si mantienes 10s al menos 1/3 del bloque (5 min grandes / 2,5 min pequeños), sube el peso la próxima vez.',
    },
    keyRules: {
        en: [
            'Large muscles (Chest/Back/Quads): 15-min blocks',
            'Small muscles (Shoulders/Arms/Hams/Calves/Abs): 7.5-min blocks',
            'Calves+Abs can share a block (alternate exercises, no rest)',
            'Increase weight only if you hold 10s rest for 1/3 of the block',
            'Use only the SAME exercise within a block',
        ],
        es: [
            'Músculos grandes (Pecho/Espalda/Cuádriceps): bloques de 15 min',
            'Pequeños (Hombros/Brazos/Isquios/Gemelos/Abs): bloques de 7,5 min',
            'Gemelos+Abs pueden compartir bloque (alterna sin descanso)',
            'Sube peso sólo si mantienes 10s al menos 1/3 del bloque',
            'Usa el MISMO ejercicio en todo el bloque',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 10, repRange: '3', days: [
                { day: 1, muscles: [{ group: 'CHEST', sets: 1 }, { group: 'BACK', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 2, muscles: [{ group: 'QUADS', sets: 1 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'ABS', sets: 1 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, muscles: [{ group: 'CHEST', sets: 1 }, { group: 'BACK', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 5, muscles: [{ group: 'QUADS', sets: 1 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'ABS', sets: 1 }] },
            ],
        },
        // Weeks 2 & 3 use same structure; progression is driven by the rule above (heavier weights as you earn them).
        { week: 2, restSeconds: 10, repRange: '3', days: [] },
        { week: 3, restSeconds: 10, repRange: '3', days: [] },
    ],
};

const CLUSTER: TwoBlockProtocol = {
    id: 'tbm_acc_cluster',
    phase: 'accumulation',
    blockNumber: 2,
    name: { en: 'Cluster Training', es: 'Cluster Training' },
    primarySetType: 'cluster',
    short: {
        en: 'Break a normal set into mini-sets with 10s in-set rest. Hit 20+ reps with a 10RM weight.',
        es: 'Rompe la serie en mini-series con 10s descanso intra-serie. 20+ reps con tu 10RM.',
    },
    long: {
        en: 'Use a weight you can do for 10 reps. Do 4 reps, set the weight down, rest 10s. Pick up and do 4 more. Repeat for 6 mini-sets (24 total reps). That is ONE cluster set. Take prescribed inter-set rest then repeat the cluster set per the day\'s schedule. Days 4–5 use Pyramid Clusters: 1-2-3-2-1 reps with 10s rest using a 5–6RM weight.',
        es: 'Peso para 10 reps. Haz 4 reps, baja la barra, 10s descanso. Levanta y haz 4 más. Repite 6 mini-series (24 reps totales). Eso es UNA serie cluster. Toma el descanso inter-serie del día. Días 4–5 usan Pyramid Clusters: 1-2-3-2-1 reps con 10s descanso usando peso de 5–6RM.',
    },
    keyRules: {
        en: [
            'Week 1: 4 mini-sets x 3 reps, 2 min between cluster sets',
            'Week 2: 5 mini-sets x 3 reps, 90s rest',
            'Week 3: 6 mini-sets x 3 reps, 1 min rest',
            'Days 4-5 use Pyramid Clusters (1-2-3-2-1) with a 5-6RM',
            'Same exercise within a cluster set; you may swap between rounds',
        ],
        es: [
            'Semana 1: 4 mini-series x 3 reps, 2 min entre cluster sets',
            'Semana 2: 5 mini x 3, 90s descanso',
            'Semana 3: 6 mini x 3, 1 min descanso',
            'Días 4-5: Pyramid Clusters (1-2-3-2-1) con peso de 5-6RM',
            'Mismo ejercicio dentro del cluster; puedes cambiar entre rondas',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 120, repRange: '4x3', setsPerLarge: 2, setsPerSmall: 1, days: [
                { day: 1, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 2, muscles: [{ group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, label: { en: 'Pyramid Clusters', es: 'Pyramid Clusters' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 5, label: { en: 'Pyramid Clusters', es: 'Pyramid Clusters' }, muscles: [{ group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
            ],
        },
        { week: 2, restSeconds: 90, repRange: '5x3', setsPerLarge: 3, setsPerSmall: 1, days: [] },
        { week: 3, restSeconds: 60, repRange: '6x3', setsPerLarge: 3, setsPerSmall: 2, days: [] },
    ],
};

const REST_PAUSE: TwoBlockProtocol = {
    id: 'tbm_acc_rest_pause',
    phase: 'accumulation',
    blockNumber: 3,
    name: { en: 'Rest-Pause Training', es: 'Rest-Pause Training' },
    primarySetType: 'rest_pause',
    short: {
        en: '1 working set near failure → 20s rest → more reps → 20s rest → more reps. Stop 1 rep shy.',
        es: '1 serie de trabajo cerca del fallo → 20s descanso → más reps → 20s → más reps. Queda a 1 rep.',
    },
    long: {
        en: '"10-rep start" days: weight is your 10RM. Hit 9–10 reps (1 shy of failure), rest 20s, get as many more as you can (~3–5), rest 20s, final mini-set (~1–2). That counts as ONE rest-pause set. Take prescribed rest between rest-pause sets. "5-rep start" days use a heavier weight starting with 5 reps. NEVER go to true failure — keep one rep in the tank. INCREASE the weight every time you repeat an exercise.',
        es: 'Días "10-rep start": peso = 10RM. Llega a 9–10 reps (1 antes del fallo), 20s descanso, saca todas las que puedas (~3–5), 20s, mini-serie final (~1–2). Eso es UNA serie rest-pause. Toma descanso inter-serie. Días "5-rep start" usan peso más alto comenzando con 5 reps. NUNCA al fallo real — deja 1 rep en el banco. SUBE el peso cada vez que repites un ejercicio.',
    },
    keyRules: {
        en: [
            'Use mass-builders: squat, deadlift, bench, OHP, rows, dips, BB curls',
            '20s rest WITHIN the rest-pause sequence (3 mini-sets per "set")',
            'Inter-set rest: Week 1=2 min, Week 2=90s, Week 3=1 min',
            'Stop 1 rep shy of failure on EVERY mini-set',
            'Increase weight each week even as rest drops',
        ],
        es: [
            'Usa ejercicios de masa: sentadilla, peso muerto, press banca, OHP, remos, fondos, curl con barra',
            '20s descanso DENTRO de la secuencia rest-pause (3 mini-series por "set")',
            'Descanso inter-serie: Semana 1=2 min, Semana 2=90s, Semana 3=1 min',
            'Para 1 rep antes del fallo en CADA mini-serie',
            'Sube el peso cada semana aunque baje el descanso',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 120, repRange: '10-RP', setsPerLarge: 2, setsPerSmall: 1, days: [
                { day: 1, label: { en: '10-rep start', es: '10-rep start' }, muscles: [{ group: 'BACK', sets: 2 }, { group: 'CHEST', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }] },
                { day: 2, label: { en: '10-rep start', es: '10-rep start' }, muscles: [{ group: 'TRICEPS', sets: 1 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, label: { en: '5-rep start', es: '5-rep start' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }] },
                { day: 5, label: { en: '5-rep start', es: '5-rep start' }, muscles: [{ group: 'SHOULDERS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'QUADS', sets: 2 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
            ],
        },
        { week: 2, restSeconds: 90, repRange: '10-RP', setsPerLarge: 3, setsPerSmall: 1, days: [] },
        { week: 3, restSeconds: 60, repRange: '10-RP', setsPerLarge: 3, setsPerSmall: 2, days: [] },
    ],
};

const VHF: TwoBlockProtocol = {
    id: 'tbm_acc_vhf',
    phase: 'accumulation',
    blockNumber: 4,
    name: { en: 'Very High Frequency (VHF)', es: 'Very High Frequency (VHF)' },
    primarySetType: 'regular',
    short: {
        en: 'Train EVERY muscle EVERY day, 6 days in a row, low sets, never to failure.',
        es: 'Entrena CADA músculo CADA día, 6 días seguidos, pocas series, sin fallo.',
    },
    long: {
        en: 'Hit every body part every day with very low volume per session (1–3 sets) and never to failure. Twice a week use IN-SET SUPERSETS: alternate reps of an isolation move and a compound move within one set (e.g. lying tricep extension + close-grip bench). On the final set, rep out the stronger compound. Rest drops 90s→60s→45s across the 3 weeks; rep range drops 12–15→10–12→8–10 (and 10–12→8–10→6–8 on heavier days).',
        es: 'Entrena cada parte cada día con muy poco volumen (1–3 series) y sin fallo. Dos veces por semana usa IN-SET SUPERSETS: alterna reps de un movimiento de aislamiento y uno compuesto en la misma serie (p.ej. extensión + press cerrado). En la última serie, saca reps al fallo del compuesto. Descanso baja 90s→60s→45s en 3 semanas; rango de reps baja 12-15→10-12→8-10 (y 10-12→8-10→6-8 en días pesados).',
    },
    keyRules: {
        en: [
            'Train 6 days in a row, every muscle every day',
            'Days 3 & 6: In-Set Supersets (alternate isolation + compound reps in one set)',
            'NEVER train to failure — leave 2+ reps in the tank',
            'Rest: Week 1 = 90s, Week 2 = 60s, Week 3 = 45s',
        ],
        es: [
            'Entrena 6 días seguidos, cada músculo cada día',
            'Días 3 y 6: In-Set Supersets (alterna aislamiento + compuesto en una serie)',
            'NUNCA al fallo — deja 2+ reps en reserva',
            'Descanso: Sem 1 = 90s, Sem 2 = 60s, Sem 3 = 45s',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 90, repRange: '12-15', setsPerLarge: 2, setsPerSmall: 1, days: [
                { day: 1, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 2, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 3, label: { en: 'In-Set Supersets', es: 'In-Set Supersets' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 4, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 5, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 6, label: { en: 'In-Set Supersets', es: 'In-Set Supersets' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
            ],
        },
        { week: 2, restSeconds: 60, repRange: '10-12', setsPerLarge: 3, setsPerSmall: 1, days: [] },
        { week: 3, restSeconds: 45, repRange: '8-10', setsPerLarge: 3, setsPerSmall: 2, days: [] },
    ],
};

// ─── INTENSIFICATION BLOCKS ───────────────────────────────────────────────────

const LOW_REP_531: TwoBlockProtocol = {
    id: 'tbm_int_low_rep',
    phase: 'intensification',
    blockNumber: 1,
    name: { en: 'Low-Rep Strength (5-3-1)', es: 'Fuerza Bajas Reps (5-3-1)' },
    primarySetType: 'top',
    short: {
        en: 'Simple 5-3-1: heavier each set. 3 sets per body part. No failure, no intensity tricks.',
        es: 'Simple 5-3-1: más pesado cada serie. 3 series por músculo. Sin fallo, sin trucos.',
    },
    long: {
        en: '3 sets per muscle: first set of 5, then 3, then 1 — adding weight each set. The single-rep set is 95–98% of 1RM, NOT a true max attempt. NEVER go to failure. If you fail the rep count (e.g. 4 on the 5-rep set), keep that same weight on the next set instead of going up. If 5 felt easy and you could do more, STOP and add more weight than planned to the 3-rep set.',
        es: '3 series por músculo: primero 5, luego 3, luego 1 — subiendo peso cada serie. La serie de 1 rep es 95–98% de tu 1RM, NO un intento real al máximo. NUNCA al fallo. Si fallas el conteo (p.ej. 4 en la de 5), mantén el mismo peso en la siguiente en vez de subir. Si las 5 fueron fáciles y podías más, PARA y sube más peso al set de 3.',
    },
    keyRules: {
        en: [
            'Same rep scheme all 3 weeks: 5-3-1, increasing weight each set',
            'Stay 1 rep shy of failure on every set',
            'Single rep ≠ max attempt (save that for deload week)',
            'Use same exercises across the 3 weeks',
        ],
        es: [
            'Mismo esquema las 3 semanas: 5-3-1, subiendo peso cada serie',
            'Queda a 1 rep del fallo en cada serie',
            'La rep única ≠ intento al máximo (eso es para deload)',
            'Usa los mismos ejercicios durante las 3 semanas',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 180, repRange: '5-3-1', setsPerLarge: 3, setsPerSmall: 3, days: [
                { day: 1, muscles: [{ group: 'CHEST', sets: 3 }, { group: 'BACK', sets: 3 }, { group: 'BICEPS', sets: 3 }, { group: 'TRICEPS', sets: 3 }] },
                { day: 2, muscles: [{ group: 'QUADS', sets: 3 }, { group: 'SHOULDERS', sets: 3 }, { group: 'HAMSTRINGS', sets: 3 }, { group: 'CALVES', sets: 3 }, { group: 'TRAPS', sets: 3 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, muscles: [{ group: 'CHEST', sets: 3 }, { group: 'BACK', sets: 3 }, { group: 'BICEPS', sets: 3 }, { group: 'TRICEPS', sets: 3 }] },
                { day: 5, muscles: [{ group: 'QUADS', sets: 3 }, { group: 'SHOULDERS', sets: 3 }, { group: 'HAMSTRINGS', sets: 3 }, { group: 'CALVES', sets: 3 }, { group: 'TRAPS', sets: 3 }] },
            ],
        },
        { week: 2, restSeconds: 180, repRange: '5-3-1', days: [] },
        { week: 3, restSeconds: 180, repRange: '5-3-1', days: [] },
    ],
};

const SINGLE_REP_CLUSTER: TwoBlockProtocol = {
    id: 'tbm_int_single_cluster',
    phase: 'intensification',
    blockNumber: 2,
    name: { en: 'Single-Rep Cluster', es: 'Cluster de 1 Rep' },
    primarySetType: 'cluster',
    short: {
        en: 'Singles at ~90% 1RM with 10s rest — get 10–12 reps with near-max weight.',
        es: 'Singles al ~90% 1RM con 10s descanso — saca 10–12 reps con peso casi máximo.',
    },
    long: {
        en: 'Use 88–92% of 1RM. Do 1 rep, rack the bar, rest 10s. Unrack, do 1 rep, rest 10s. Repeat for 10–12 mini-sets total. With 95%, target 5–7 mini-sets. Days 4–5 use BOTTOM-START: set the bar in the rack pins at the bottom of the ROM (squat, bench, OHP) so each rep starts from a dead stop. This kills elastic rebound and forces full muscular work.',
        es: 'Usa 88–92% del 1RM. 1 rep, racka, 10s descanso. Desracka, 1 rep, 10s. Repite 10–12 mini-series totales. Al 95%, apunta a 5–7 mini-series. Días 4–5 usan BOTTOM-START: pon la barra en los pines al fondo del ROM (sentadilla, banca, OHP) — cada rep parte de paro muerto. Elimina el rebote elástico y fuerza el trabajo muscular total.',
    },
    keyRules: {
        en: [
            'Single reps with 10s rest, ~90% 1RM',
            'Days 4-5: BOTTOM-START (bar in rack at bottom of ROM)',
            'Lower-rep days (5-7 reps) use 95% of 1RM',
            'Same scheme all 3 weeks',
        ],
        es: [
            'Reps únicas con 10s descanso, ~90% 1RM',
            'Días 4-5: BOTTOM-START (barra en pines al fondo del ROM)',
            'Días de menos reps (5-7) usan 95% del 1RM',
            'Mismo esquema las 3 semanas',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 120, repRange: '10-12x1', setsPerLarge: 2, setsPerSmall: 1, days: [
                { day: 1, label: { en: '10-12 singles @ 90%', es: '10-12 singles @ 90%' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 2, label: { en: '10-12 singles @ 90%', es: '10-12 singles @ 90%' }, muscles: [{ group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, label: { en: '5-7 singles @ 95% (Bottom-Start)', es: '5-7 singles @ 95% (Bottom-Start)' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 5, label: { en: '5-7 singles @ 95% (Bottom-Start)', es: '5-7 singles @ 95% (Bottom-Start)' }, muscles: [{ group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
            ],
        },
        { week: 2, restSeconds: 120, days: [] },
        { week: 3, restSeconds: 120, days: [] },
    ],
};

const TRIPLE_ADD: TwoBlockProtocol = {
    id: 'tbm_int_triple_add',
    phase: 'intensification',
    blockNumber: 3,
    name: { en: 'Triple Add Sets', es: 'Triple Add Sets' },
    primarySetType: 'triple_add',
    short: {
        en: 'Inverse drop set: light high-rep → 10s → moderate → 10s → heavy low-rep. Hits all 3 fiber types.',
        es: 'Drop set inverso: ligero altas reps → 10s → moderado → 10s → pesado bajas reps. Activa los 3 tipos de fibra.',
    },
    long: {
        en: 'Start LIGHT and work UP (inverse of a normal drop set). Part 1: light weight, 20–30 reps (Type I endurance fibers). Rest 10s while changing weight. Part 2: about double the load, 6–8 reps (Type IIa fibers). Rest 10s. Part 3: heavy weight, 1–3 reps (Type IIb explosive fibers + connective tissue). The whole thing is ONE set. Days 3–5 of the week use Low-Rep Strength (3-2-1) — Triple Add twice a week is enough.',
        es: 'Empieza LIGERO y sube (inverso al drop set normal). Parte 1: peso ligero, 20–30 reps (fibras Tipo I de resistencia). 10s descanso para cambiar peso. Parte 2: aprox. el doble, 6–8 reps (Tipo IIa). 10s. Parte 3: peso pesado, 1–3 reps (Tipo IIb explosivas + tejido conectivo). Todo eso es UNA serie. Días 4–5 usan Fuerza Bajas Reps (3-2-1) — 2 veces a la semana de Triple Add basta.',
    },
    keyRules: {
        en: [
            'Inverse drop: LIGHT → MODERATE → HEAVY (not heavy to light)',
            '10s between parts of one Triple Add set',
            'Part 2 weight is roughly double Part 1',
            'Days 1-2: Triple Add | Days 4-5: 3-2-1 Low-Rep Strength',
        ],
        es: [
            'Drop inverso: LIGERO → MODERADO → PESADO (no al revés)',
            '10s entre partes de una serie Triple Add',
            'Parte 2 ≈ doble del peso de la Parte 1',
            'Días 1-2: Triple Add | Días 4-5: Fuerza Bajas Reps 3-2-1',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 120, repRange: 'TA + 3-2-1', setsPerLarge: 2, setsPerSmall: 2, days: [
                { day: 1, label: { en: 'Triple Add Sets', es: 'Triple Add Sets' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 2 }, { group: 'TRICEPS', sets: 2 }] },
                { day: 2, label: { en: 'Triple Add Sets', es: 'Triple Add Sets' }, muscles: [{ group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 2 }, { group: 'HAMSTRINGS', sets: 2 }, { group: 'CALVES', sets: 1 }, { group: 'TRAPS', sets: 1 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, label: { en: 'Low-Rep 3-2-1', es: 'Bajas Reps 3-2-1' }, muscles: [{ group: 'CHEST', sets: 3 }, { group: 'BACK', sets: 3 }, { group: 'BICEPS', sets: 3 }, { group: 'TRICEPS', sets: 3 }] },
                { day: 5, label: { en: 'Low-Rep 3-2-1', es: 'Bajas Reps 3-2-1' }, muscles: [{ group: 'QUADS', sets: 3 }, { group: 'SHOULDERS', sets: 3 }, { group: 'HAMSTRINGS', sets: 3 }, { group: 'CALVES', sets: 3 }, { group: 'TRAPS', sets: 3 }] },
            ],
        },
        { week: 2, restSeconds: 120, days: [] },
        { week: 3, restSeconds: 120, days: [] },
    ],
};

const CEO: TwoBlockProtocol = {
    id: 'tbm_int_ceo',
    phase: 'intensification',
    blockNumber: 4,
    name: { en: 'Compound Exercise Overload (CEO)', es: 'Compound Exercise Overload (CEO)' },
    primarySetType: 'time_volume',
    short: {
        en: 'ONE exercise for 40 min: 3-rep sets, 30s rest, drop weight when you fail 3 reps. Massive specificity.',
        es: 'UN ejercicio durante 40 min: series de 3 reps, 30s descanso, baja peso al fallar las 3. Especificidad brutal.',
    },
    long: {
        en: 'Single compound (squat, bench, or deadlift variant) for an ENTIRE 40-min session. Start with a weight you could normally do for ~6 reps. Do 3 reps, rest 30s (20s for upper-body lifts like bench/curl), do 3 more, rest 30s. Continue until you can no longer hit 3 reps cleanly. Drop 20 lbs total (10 per side for squat/DL, 10 lbs total / 5 per side for bench), keep going. NEVER go to failure — keep a "do-or-die" rep in you. On the final set, rest 2 min then rep out with the last weight (typically 5–8 reps). Days are rotated: Squat → Bench → Deadlift.',
        es: 'UN compuesto (sentadilla, banca o peso muerto) durante TODA la sesión de 40 min. Empieza con peso para ~6 reps normalmente. 3 reps, 30s descanso (20s en lifts de tren superior), 3 reps, 30s. Continúa hasta que ya no puedas 3 limpias. Baja 20 lb total (10 por lado en sq/DL, 10 lb total / 5 por lado en banca), sigue. NUNCA al fallo — mantén la "rep do-or-die". En la última serie, descansa 2 min y haz reps al fallo con el último peso (5–8 reps típico). Días rotan: Sentadilla → Banca → Peso Muerto.',
    },
    keyRules: {
        en: [
            'Pick ONE compound for the entire 40-min session',
            '3 reps per set, 30s rest (20s for upper-body lifts)',
            'Drop weight 20 lb (or 10 lb upper) when you fail 3 clean reps',
            'NEVER go to failure — leave do-or-die rep in you',
            'Final set: rest 2 min, then max-rep burnout',
            'Load small plates first — easier to strip mid-session',
        ],
        es: [
            'Elige UN compuesto para los 40 min completos',
            '3 reps por serie, 30s descanso (20s en tren superior)',
            'Baja 20 lb (o 10 lb tren superior) al fallar las 3 limpias',
            'NUNCA al fallo — mantén la rep do-or-die',
            'Última serie: 2 min descanso + reps al fallo',
            'Carga discos pequeños primero — más fácil quitarlos',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 30, repRange: '3 reps, 40 min', setsPerLarge: 1, setsPerSmall: 1, days: [
                { day: 1, label: { en: 'CEO Squat — 40 min', es: 'CEO Sentadilla — 40 min' }, muscles: [{ group: 'QUADS', sets: 1 }] },
                { day: 2, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 3, label: { en: 'CEO Bench — 40 min', es: 'CEO Banca — 40 min' }, muscles: [{ group: 'CHEST', sets: 1 }] },
                { day: 4, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 5, label: { en: 'CEO Deadlift — 40 min', es: 'CEO Peso Muerto — 40 min' }, muscles: [{ group: 'BACK', sets: 1 }] },
            ],
        },
        { week: 2, restSeconds: 30, days: [] },
        { week: 3, restSeconds: 30, days: [] },
    ],
};

// ─── DELOAD ───────────────────────────────────────────────────────────────────

const DELOAD: TwoBlockProtocol = {
    id: 'tbm_deload',
    phase: 'deload',
    blockNumber: 1,
    name: { en: 'Deload Week', es: 'Semana de Deload' },
    primarySetType: 'top',
    short: {
        en: '4 days off → 1 fun day (optional) → 1 day off → 1RM strength test.',
        es: '4 días off → 1 día divertido (opcional) → 1 día off → test de 1RM.',
    },
    long: {
        en: 'OFF: Days 1, 2, and 4 are fully off. FUN (Day 3, optional): light work on exercises you enjoy that are not main mass-builders (Concentration Curls, etc). MAX OUT (Day 5): test 1RM on the lifts you most want to know. Use ramping/feeler sets — never max cold. Sequence: warm-up at ~50% for 5–6 reps, then ~70% for 3 reps, then ~85% for 1, then ~92% for 1 (feeler), rest 2–3 min and GO. Lift you most care about FIRST (others may be lower due to fatigue).',
        es: 'OFF: Días 1, 2 y 4 totalmente libres. FUN (Día 3, opcional): trabajo ligero con ejercicios que te gusten que no son principales (Concentration Curls, etc.). MAX OUT (Día 5): test de 1RM en los lifts que más te importan. Usa rampas/feeler sets — nunca al máximo en frío. Secuencia: calentamiento al ~50% por 5–6 reps, ~70% por 3, ~85% por 1, ~92% por 1 (feeler), descansa 2–3 min y VAMOS. El lift que más te importa PRIMERO (los demás bajan por fatiga).',
    },
    keyRules: {
        en: [
            'Days 1, 2, 4: Off completely',
            'Day 3 (optional): Fun light exercises — no main mass-builders',
            'Day 5: 1RM test on the lifts you want to track',
            'Ramp: 50% x5 → 70% x3 → 85% x1 → 92% x1 → 100% x1',
            'Most-important lift FIRST',
            'No max out without a spotter on bench press',
        ],
        es: [
            'Días 1, 2 y 4: Off completos',
            'Día 3 (opcional): Ejercicios divertidos ligeros — nada principal',
            'Día 5: Test 1RM en los lifts que quieras trackear',
            'Rampa: 50% x5 → 70% x3 → 85% x1 → 92% x1 → 100% x1',
            'El lift más importante PRIMERO',
            'No hagas max en banca sin spotter',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 180, days: [
                { day: 1, muscles: [], label: { en: 'Off', es: 'Off' } },
                { day: 2, muscles: [], label: { en: 'Off', es: 'Off' } },
                { day: 3, label: { en: 'Fun Day (optional)', es: 'Día Divertido (opcional)' }, muscles: [{ group: 'BICEPS', sets: 3 }, { group: 'CALVES', sets: 3 }, { group: 'ABS', sets: 3 }] },
                { day: 4, muscles: [], label: { en: 'Off', es: 'Off' } },
                { day: 5, label: { en: '1RM Max Out', es: 'Test 1RM' }, muscles: [{ group: 'CHEST', sets: 5 }, { group: 'QUADS', sets: 5 }, { group: 'BACK', sets: 5 }] },
            ],
        },
    ],
};

// ─── ONE-WEEK MASS ────────────────────────────────────────────────────────────

const ONE_WEEK_MASS: TwoBlockProtocol = {
    id: 'tbm_one_week',
    phase: 'one_week',
    blockNumber: 1,
    name: { en: 'One-Week Mass', es: 'One-Week Mass' },
    primarySetType: 'cluster',
    short: {
        en: 'Compressed: 2 days Accumulation + 2 days Intensification, repeat weekly.',
        es: 'Comprimido: 2 días Acumulación + 2 días Intensificación, repite semanalmente.',
    },
    long: {
        en: 'Take any Accumulation method and any Intensification method and run 2 days of each per week. Mon/Tue: Accumulation (e.g. Cluster Training Week-1 Day-1 then Day-2). Thu/Sat: Intensification (e.g. Low-Rep 5-3-1 Day-1 then Day-2). Either repeat exact workouts the next week or progress to Week-2 of that method. Lets you "sample" methods or commit to one and progress slowly.',
        es: 'Toma un método de Acumulación y uno de Intensificación y haz 2 días de cada uno por semana. Lun/Mar: Acumulación (p.ej. Cluster Training Sem-1 Día-1 luego Día-2). Jue/Sáb: Intensificación (p.ej. 5-3-1 Día-1 luego Día-2). Repite los workouts exactos la siguiente semana o progresa a Sem-2 del método. Te permite "probar" métodos o comprometerte con uno y progresar lento.',
    },
    keyRules: {
        en: [
            'Pick 1 Accumulation method + 1 Intensification method',
            'Mon/Tue = Accumulation | Thu/Sat = Intensification',
            'Each week: repeat or progress',
            'Use for sampling methods OR slow committed progress',
        ],
        es: [
            'Elige 1 método de Acumulación + 1 de Intensificación',
            'Lun/Mar = Acumulación | Jue/Sáb = Intensificación',
            'Cada semana: repite o progresa',
            'Útil para probar métodos O progreso lento comprometido',
        ],
    },
    schedule: [
        {
            week: 1, restSeconds: 120, days: [
                { day: 1, label: { en: 'Accumulation Day 1', es: 'Acumulación Día 1' }, muscles: [{ group: 'CHEST', sets: 2 }, { group: 'BACK', sets: 2 }, { group: 'BICEPS', sets: 1 }, { group: 'TRICEPS', sets: 1 }] },
                { day: 2, label: { en: 'Accumulation Day 2', es: 'Acumulación Día 2' }, muscles: [{ group: 'QUADS', sets: 2 }, { group: 'SHOULDERS', sets: 1 }, { group: 'HAMSTRINGS', sets: 1 }, { group: 'CALVES', sets: 1 }] },
                { day: 3, muscles: [], label: { en: 'Rest', es: 'Descanso' } },
                { day: 4, label: { en: 'Intensification Day 1', es: 'Intensificación Día 1' }, muscles: [{ group: 'CHEST', sets: 3 }, { group: 'BACK', sets: 3 }, { group: 'BICEPS', sets: 3 }, { group: 'TRICEPS', sets: 3 }] },
                { day: 5, label: { en: 'Intensification Day 2', es: 'Intensificación Día 2' }, muscles: [{ group: 'QUADS', sets: 3 }, { group: 'SHOULDERS', sets: 3 }, { group: 'HAMSTRINGS', sets: 3 }, { group: 'CALVES', sets: 3 }] },
            ],
        },
    ],
};

export const TWO_BLOCK_PROTOCOLS: TwoBlockProtocol[] = [
    TIME_VOLUME, CLUSTER, REST_PAUSE, VHF,
    LOW_REP_531, SINGLE_REP_CLUSTER, TRIPLE_ADD, CEO,
    DELOAD, ONE_WEEK_MASS,
];

export const TWO_BLOCK_PHILOSOPHY = {
    en: {
        title: 'Two Block Mass — Accumulation + Intensification',
        body: 'A 6-week mesocycle: 3 weeks of volume-based Accumulation push you toward acute overtraining, then 3 weeks of low-volume heavy Intensification rebound you into super-compensation. Build muscle in the first half, build strength in the second, then deload and run another combo. Pick any 1 of the 4 Accumulation blocks and any 1 of the 4 Intensification blocks per cycle.',
        cycle: '6-week cycle = 3 wk Accumulation → 3 wk Intensification → 1 wk Deload (optional)',
    },
    es: {
        title: 'Two Block Mass — Acumulación + Intensificación',
        body: 'Mesociclo de 6 semanas: 3 semanas de Acumulación basada en volumen te empujan al sobreentreno agudo, luego 3 semanas de Intensificación pesada y de bajo volumen te rebotan a supercompensación. Construye músculo en la primera mitad, fuerza en la segunda, deload y otra combinación. Elige 1 de los 4 bloques de Acumulación y 1 de los 4 de Intensificación por ciclo.',
        cycle: 'Ciclo de 6 semanas = 3 sem Acumulación → 3 sem Intensificación → 1 sem Deload (opcional)',
    },
};
