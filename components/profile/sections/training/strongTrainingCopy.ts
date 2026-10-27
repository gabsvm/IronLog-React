// SettingsParity owner: copy for the Strong-parity training rows.
// Kept OUT of constants/translations.* (frozen); same es/en shape as TRANSLATIONS.
import type { Lang } from '../../../../types';
import { pickLang } from '../../../../utils/i18n';

interface StrongTrainingCopy {
    restGroup: string;
    defaultRest: string;
    warmupRest: string;
    restIncrement: string;
    restSound: string;
    restSoundName: string;
    restSoundBoxing: string;
    restSoundChime: string;
    restSoundTri: string;
    restSoundShort: string;
    restVibrate: string;
    autoStartRest: string;
    simpleTimers: string;
    simpleTimersHint: string;
    autoFullscreen: string;
    autoFullscreenHint: string;
    setsGroup: string;
    defaultSets: string;
    defaultSetsHint: string;
    previousScope: string;
    previousAny: string;
    previousPlanDay: string;
    incompleteSets: string;
    incompleteAsk: string;
    incompleteComplete: string;
    incompleteDiscard: string;
    unitsGroup: string;
    bodyUnit: string;
    distanceUnit: string;
    sizeUnit: string;
    weekFormulaGroup: string;
    weekStart: string;
    weekMonday: string;
    weekSunday: string;
    oneRmFormula: string;
    oneRmHybridRecommended: string;
    factorInRpe: string;
    factorInRpeHint: string;
    plateGroup: string;
    plateBar: string;
    platePlates: string;
    plateTarget: string;
    plateTargetPlaceholder: string;
    platePerSide: string;
    plateTotal: string;
    plateRemainder: string;
    plateBarOnly: string;
    plateUnderBar: string;
    secondsShort: string;
}

const ES: StrongTrainingCopy = {
    restGroup: 'Temporizador de descanso',
    defaultRest: 'Descanso por defecto',
    warmupRest: 'Descanso de calentamiento',
    restIncrement: 'Incremento (+/−)',
    restSound: 'Sonido al terminar',
    restSoundName: 'Tono',
    restSoundBoxing: 'Campana',
    restSoundChime: 'Campanadas',
    restSoundTri: 'Triple tono',
    restSoundShort: 'Corto',
    restVibrate: 'Vibración al terminar',
    autoStartRest: 'Iniciar descanso solo',
    simpleTimers: 'Temporizadores simples',
    simpleTimersHint: 'Pantalla completa al iniciar el descanso',
    autoFullscreen: 'Pantalla completa automática',
    autoFullscreenHint: 'Abre el temporizador a pantalla completa',
    setsGroup: 'Series',
    defaultSets: 'Series por defecto',
    defaultSetsHint: 'Al añadir un ejercicio',
    previousScope: 'Series anteriores',
    previousAny: 'Cualquier entreno',
    previousPlanDay: 'Mismo día del plan',
    incompleteSets: 'Series incompletas',
    incompleteAsk: 'Preguntar',
    incompleteComplete: 'Completar',
    incompleteDiscard: 'Descartar',
    unitsGroup: 'Unidades',
    bodyUnit: 'Peso corporal',
    distanceUnit: 'Distancia',
    sizeUnit: 'Tamaño',
    weekFormulaGroup: 'Semana y 1RM',
    weekStart: 'La semana empieza',
    weekMonday: 'Lunes',
    weekSunday: 'Domingo',
    oneRmFormula: 'Fórmula 1RM',
    oneRmHybridRecommended: '(recomendado)',
    factorInRpe: 'Ajustar por RPE',
    factorInRpeHint: 'Ajusta el 1RM estimado según el RPE registrado',
    plateGroup: 'Calculadora de discos',
    plateBar: 'Barra',
    platePlates: 'Discos disponibles',
    plateTarget: 'Peso objetivo',
    plateTargetPlaceholder: 'p. ej. 100',
    platePerSide: 'Por lado',
    plateTotal: 'Total cargado',
    plateRemainder: 'Resto sin cargar',
    plateBarOnly: 'Solo la barra',
    plateUnderBar: 'Por debajo de la barra',
    secondsShort: 's',
};

const EN: StrongTrainingCopy = {
    restGroup: 'Rest timer',
    defaultRest: 'Default rest',
    warmupRest: 'Warm-up rest',
    restIncrement: 'Step (+/−)',
    restSound: 'Finish sound',
    restSoundName: 'Tone',
    restSoundBoxing: 'Boxing bell',
    restSoundChime: 'Chime',
    restSoundTri: 'Tri tone',
    restSoundShort: 'Short',
    restVibrate: 'Finish vibration',
    autoStartRest: 'Auto-start rest',
    simpleTimers: 'Simple timers',
    simpleTimersHint: 'Fullscreen rest screen on start',
    autoFullscreen: 'Auto full screen',
    autoFullscreenHint: 'Open the timer fullscreen',
    setsGroup: 'Sets',
    defaultSets: 'Default sets',
    defaultSetsHint: 'When adding an exercise',
    previousScope: 'Previous sets',
    previousAny: 'Any workout',
    previousPlanDay: 'Same plan day',
    incompleteSets: 'Incomplete sets',
    incompleteAsk: 'Ask',
    incompleteComplete: 'Complete',
    incompleteDiscard: 'Discard',
    unitsGroup: 'Units',
    bodyUnit: 'Body weight',
    distanceUnit: 'Distance',
    sizeUnit: 'Size',
    weekFormulaGroup: 'Week & 1RM',
    weekStart: 'Week starts on',
    weekMonday: 'Monday',
    weekSunday: 'Sunday',
    oneRmFormula: '1RM formula',
    oneRmHybridRecommended: '(recommended)',
    factorInRpe: 'Factor in RPE',
    factorInRpeHint: 'Adjusts the estimated 1RM from logged RPE',
    plateGroup: 'Plate calculator',
    plateBar: 'Bar',
    platePlates: 'Available plates',
    plateTarget: 'Target weight',
    plateTargetPlaceholder: 'e.g. 100',
    platePerSide: 'Per side',
    plateTotal: 'Loaded total',
    plateRemainder: 'Unloaded remainder',
    plateBarOnly: 'Bar only',
    plateUnderBar: 'Below the bar',
    secondsShort: 's',
};

export const getStrongTrainingCopy = (lang: Lang): StrongTrainingCopy => pickLang(lang, { es: ES, en: EN });
