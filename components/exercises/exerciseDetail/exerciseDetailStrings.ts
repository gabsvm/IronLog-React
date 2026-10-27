import type { Lang } from '../../../types';
import type { OneRmFormula } from '../../../utils/strongTraining';

// Local bilingual copy for the exercise detail tabs. Global dictionaries
// (constants/translations.*) are shared and must not be extended from here,
// so detail-specific labels live next to the detail components.
export interface ExerciseDetailStrings {
    about: string;
    history: string;
    charts: string;
    records: string;
    // About — per-exercise preferences + history reference strip.
    refTitle: string;
    refSessions: string;
    refLast: string;
    refBest: string;
    refNever: string;
    restTitle: string;
    restHint: string;
    restPlaceholder: string;
    restClear: string;
    restSeconds: string;
    // History tab.
    historyEmptyTitle: string;
    historyEmptyBody: string;
    historySets: string;
    historyVolume: string;
    historyBest: string;
    historyTime: string;
    historyDistance: string;
    historyHold: string;
    historyReps: string;
    showMore: string;
    showLess: string;
    // Charts tab (metric abbreviations stay language-independent).
    chartEstimatedNote: Record<OneRmFormula, string>;
    // Records tab.
    recordsEmptyTitle: string;
    recordsEmptyBody: string;
    recordsBest1RM: string;
    recordsMaxWeight: string;
    recordsMaxVolume: string;
    recordsMaxReps: string;
    recordsBestHold: string;
    recordsTotalVolume: string;
    recordsSessions: string;
    recordsLastDate: string;
    recordsEstimatedTag: string;
}

export const EXERCISE_DETAIL_STRINGS: Record<Lang, ExerciseDetailStrings> = {
    en: {
        about: 'About',
        history: 'History',
        charts: 'Charts',
        records: 'Records',
        refTitle: 'At a glance',
        refSessions: 'Sessions',
        refLast: 'Last',
        refBest: 'Best set',
        refNever: 'Not logged yet',
        restTitle: 'Rest timer',
        restHint: 'Default rest before the next set of this exercise. Empty uses the app preset.',
        restPlaceholder: 'App preset',
        restClear: 'Use app preset',
        restSeconds: 'sec',
        historyEmptyTitle: 'No history yet',
        historyEmptyBody: 'Complete a workout with this exercise to see every logged set here.',
        historySets: 'sets',
        historyVolume: 'Volume',
        historyBest: 'Best',
        historyTime: 'Time',
        historyDistance: 'Distance',
        historyHold: 'Hold',
        historyReps: 'reps',
        showMore: 'Show more',
        showLess: 'Show less',
        chartEstimatedNote: {
            epley: '1RM values are Epley estimates from logged sets, not measured maxes.',
            brzycki: '1RM values are Brzycki estimates from logged sets, not measured maxes.',
            lombardi: '1RM values are Lombardi estimates from logged sets, not measured maxes.',
            hybrid: '1RM values are Hybrid estimates (Brzycki below 10 reps, Epley above) from logged sets, not measured maxes.',
        },
        recordsEmptyTitle: 'No records yet',
        recordsEmptyBody: 'Log this exercise to unlock personal records and the rep-max table.',
        recordsBest1RM: 'Best est. 1RM',
        recordsMaxWeight: 'Heaviest load',
        recordsMaxVolume: 'Best session volume',
        recordsMaxReps: 'Most reps (set)',
        recordsBestHold: 'Longest hold',
        recordsTotalVolume: 'Total volume',
        recordsSessions: 'Sessions',
        recordsLastDate: 'Last logged',
        recordsEstimatedTag: 'estimated',
    },
    es: {
        about: 'Info',
        history: 'Historial',
        charts: 'Gráficas',
        records: 'Récords',
        refTitle: 'De un vistazo',
        refSessions: 'Sesiones',
        refLast: 'Última',
        refBest: 'Mejor serie',
        refNever: 'Aún sin registros',
        restTitle: 'Temporizador de descanso',
        restHint: 'Descanso por defecto antes de la siguiente serie de este ejercicio. Vacío usa el ajuste de la app.',
        restPlaceholder: 'Ajuste de la app',
        restClear: 'Usar ajuste de la app',
        restSeconds: 's',
        historyEmptyTitle: 'Sin historial todavía',
        historyEmptyBody: 'Completa un entreno con este ejercicio para ver aquí cada serie registrada.',
        historySets: 'series',
        historyVolume: 'Volumen',
        historyBest: 'Mejor',
        historyTime: 'Tiempo',
        historyDistance: 'Distancia',
        historyHold: 'Aguante',
        historyReps: 'reps',
        showMore: 'Ver más',
        showLess: 'Ver menos',
        chartEstimatedNote: {
            epley: 'Los valores de 1RM son estimaciones de Epley desde tus series, no máximos medidos.',
            brzycki: 'Los valores de 1RM son estimaciones de Brzycki desde tus series, no máximos medidos.',
            lombardi: 'Los valores de 1RM son estimaciones de Lombardi desde tus series, no máximos medidos.',
            hybrid: 'Los valores de 1RM son estimaciones Hybrid (Brzycki bajo 10 reps, Epley por encima) desde tus series, no máximos medidos.',
        },
        recordsEmptyTitle: 'Sin récords todavía',
        recordsEmptyBody: 'Registra este ejercicio para desbloquear récords personales y la tabla por repeticiones.',
        recordsBest1RM: 'Mejor 1RM est.',
        recordsMaxWeight: 'Carga máxima',
        recordsMaxVolume: 'Mejor volumen/sesión',
        recordsMaxReps: 'Más reps (serie)',
        recordsBestHold: 'Aguante máximo',
        recordsTotalVolume: 'Volumen total',
        recordsSessions: 'Sesiones',
        recordsLastDate: 'Último registro',
        recordsEstimatedTag: 'estimado',
    },
};
