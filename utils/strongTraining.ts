// Strong-parity training preferences. Field names, value unions and defaults
// mirror TrainingConfigFields (types.ts is the single type source; the value
// unions below are re-exported from there so existing importers keep working).
// Pure helpers (estimateOneRm, formatRestSeconds, startOfWeekKey,
// filterLogsByPreviousScope, format*/fromDisplay*,
// computePlateLoading in ./plateCalculator) stay here and are consumed
// directly; they never touch context.
// Fullscreen-by-default is NOT a new field: the existing
// config.restTimerDisplay ('compact' | 'expanded') already covers Strong's
// "pantalla completa por defecto" ('expanded' = fullscreen sheet).
// Stored values are canonical (kg / km / cm); unit prefs only affect display
// and entry, exactly like utils/units.ts does for weightUnit.

import type {
    BodyWeightUnit,
    DistanceUnit,
    IncompleteSets,
    Lang,
    OneRmFormula,
    PreviousScope,
    RestIncrement,
    SizeUnit,
    TrainingConfigFields,
    WeekStart,
} from '../types';
import { formatWeight } from './units';
import { pickLang } from './i18n';

export type {
    BodyWeightUnit,
    DistanceUnit,
    IncompleteSets,
    OneRmFormula,
    PreviousScope,
    RestIncrement,
    SizeUnit,
    TrainingConfigFields,
    WeekStart,
} from '../types';

export const TRAINING_CONFIG_DEFAULTS: TrainingConfigFields = {
    previousScope: 'any',
    incompleteSets: 'ask',
    defaultSets: 3,
    defaultRestSeconds: 120,
    warmupRestSeconds: 60,
    restIncrementSeconds: 15,
    restSound: true,
    restVibrate: true,
    autoStartRest: true,
    bodyWeightUnit: 'kg',
    distanceUnit: 'km',
    sizeUnit: 'cm',
    weekStart: 'monday',
    oneRmFormula: 'epley',
    plateBarKg: 20,
    platePlatesKg: [25, 20, 15, 10, 5, 2.5, 1.25],
};

/** useLocalStorage atom keys (same JSON encoding as the AppContext atoms). */
export const TRAINING_CONFIG_KEYS = {
    previousScope: 'il_training_previous_scope',
    incompleteSets: 'il_training_incomplete_sets',
    defaultSets: 'il_training_default_sets',
    defaultRestSeconds: 'il_training_rest_default',
    warmupRestSeconds: 'il_training_rest_warmup',
    restIncrementSeconds: 'il_training_rest_increment',
    restSound: 'il_training_rest_sound',
    restVibrate: 'il_training_rest_vibrate',
    autoStartRest: 'il_training_rest_autostart',
    bodyWeightUnit: 'il_training_unit_body',
    distanceUnit: 'il_training_unit_distance',
    sizeUnit: 'il_training_unit_size',
    weekStart: 'il_training_week_start',
    oneRmFormula: 'il_training_1rm_formula',
    plateBarKg: 'il_training_plate_bar',
    platePlatesKg: 'il_training_plate_plates',
} as const;

const clampInt = (value: unknown, fallback: number, min: number, max: number): number => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

const isOneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    (typeof value === 'string' && (options as readonly string[]).includes(value) ? value : fallback) as T;

const sanitizeRestIncrement = (value: unknown): RestIncrement => {
    const n = Number(value);
    return n === 5 || n === 10 || n === 15 || n === 30 ? n : 15;
};

const sanitizePlates = (value: unknown): number[] => {
    if (!Array.isArray(value)) return [...TRAINING_CONFIG_DEFAULTS.platePlatesKg];
    const out = value.map(Number).filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => b - a);
    return out.length > 0 ? out : [...TRAINING_CONFIG_DEFAULTS.platePlatesKg];
};

const sanitizeBar = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 20;
};

/** Merge a partial (e.g. future config slice) over defaults. Never throws. */
export const sanitizeTrainingConfig = (raw: unknown): TrainingConfigFields => {
    const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<TrainingConfigFields>;
    return {
        previousScope: isOneOf(src.previousScope, ['any', 'planDay'], 'any'),
        incompleteSets: isOneOf(src.incompleteSets, ['ask', 'complete', 'discard'], 'ask'),
        defaultSets: clampInt(src.defaultSets, 3, 1, 10),
        defaultRestSeconds: clampInt(src.defaultRestSeconds, 120, 0, 1800),
        warmupRestSeconds: clampInt(src.warmupRestSeconds, 60, 0, 1800),
        restIncrementSeconds: sanitizeRestIncrement(src.restIncrementSeconds),
        restSound: typeof src.restSound === 'boolean' ? src.restSound : true,
        restVibrate: typeof src.restVibrate === 'boolean' ? src.restVibrate : true,
        autoStartRest: typeof src.autoStartRest === 'boolean' ? src.autoStartRest : true,
        bodyWeightUnit: isOneOf(src.bodyWeightUnit, ['kg', 'lb'], 'kg'),
        distanceUnit: isOneOf(src.distanceUnit, ['km', 'mi'], 'km'),
        sizeUnit: isOneOf(src.sizeUnit, ['cm', 'in'], 'cm'),
        weekStart: isOneOf(src.weekStart, ['monday', 'sunday'], 'monday'),
        oneRmFormula: isOneOf(src.oneRmFormula, ['epley', 'brzycki', 'lombardi'], 'epley'),
        plateBarKg: sanitizeBar(src.plateBarKg),
        platePlatesKg: sanitizePlates(src.platePlatesKg),
    };
};

/**
 * Scope filter for previous-performance resolution (LoggerParity consumer).
 * Wraps the logs array BEFORE getExerciseHistorySummary / latest-set reads:
 * 'any' returns logs untouched (current behavior); 'planDay' prefers the
 * stable template identity (templateId + templateDayKey) with fallback to
 * the plan day (mesoId AND dayIdx) for unstamped logs (old builds).
 * Detached contexts (mesoId == null or < 0) yield no previous. dayIdx is
 * optional for back-compat: omitted → mesoId-only match until the caller
 * wires the active dayIdx (LoggerParity adopts it next).
 */
export const filterLogsByPreviousScope = <T extends { mesoId?: unknown; dayIdx?: unknown; templateId?: unknown; templateDayKey?: unknown }>(
    logs: readonly T[],
    scope: PreviousScope,
    mesoId?: number | null,
    dayIdx?: number | null,
    templateId?: string | null,
    templateDayKey?: string | null,
): T[] => {
    const list = Array.isArray(logs) ? [...logs] : [];
    if (scope !== 'planDay') return list;
    if (mesoId == null || mesoId < 0) return [];
    const wantTpl = typeof templateId === 'string' && templateId ? templateId : null;
    const wantKey = typeof templateDayKey === 'string' && templateDayKey ? templateDayKey : null;
    if (wantTpl && wantKey) {
        const strict = list.filter((log) => log?.templateId === wantTpl && log?.templateDayKey === wantKey);
        const seen = new Set(strict);
        // Misma mesociclo+día sin estampar (p. ej. escrito por build vieja contra meso nuevo): mismo plan, seguro.
        for (const log of list) {
            if (!seen.has(log) && (log as T)?.templateId == null && (log as T)?.templateDayKey == null
                && log?.mesoId === mesoId && (dayIdx == null || log?.dayIdx === dayIdx)) {
                strict.push(log); seen.add(log);
            }
        }
        return strict;
    }
    return list.filter((log) => log?.mesoId === mesoId && (dayIdx == null || log?.dayIdx === dayIdx));
};

// ─── xRM formula ─────────────────────────────────────────────────────────────

const ONE_RM_FORMULAS: Record<OneRmFormula, (w: number, r: number) => number> = {
    epley: (w, r) => w * (1 + r / 30),
    brzycki: (w, r) => (r >= 37 ? w : (w * 36) / (37 - r)),
    lombardi: (w, r) => w * Math.pow(r, 0.1),
};

/** Estimated 1RM in kg from a set (weight canonical kg). Reps<=0 → 0, 1 rep → weight. */
export const estimateOneRm = (weightKg: number, reps: number, formula: OneRmFormula = 'epley'): number => {
    const w = Number(weightKg);
    const r = Math.floor(Number(reps));
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return 0;
    if (r === 1) return w;
    const fn = ONE_RM_FORMULAS[formula] ?? ONE_RM_FORMULAS.epley;
    const out = fn(w, r);
    return Number.isFinite(out) && out > 0 ? out : 0;
};

// ─── Rest formatting ─────────────────────────────────────────────────────────

export const formatRestSeconds = (seconds: number): string => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

// ─── Week start ──────────────────────────────────────────────────────────────

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Local-date key (YYYY-MM-DD) of the week start containing `timestamp`. */
export const startOfWeekKey = (timestamp: number, weekStart: WeekStart): string => {
    const d = new Date(timestamp);
    const day = d.getDay();
    const diff = weekStart === 'monday' ? (day + 6) % 7 : day;
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
    return `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
};

// ─── Independent units (display/entry only; storage stays canonical) ─────────

export const KM_PER_MI = 1.609344;
export const CM_PER_IN = 2.54;

export const formatBodyWeight = (kg: number, unit: BodyWeightUnit, lang: Lang): string =>
    formatWeight(kg, unit, lang);

export const fromDisplayBodyWeight = (value: number, unit: BodyWeightUnit): number => {
    if (unit !== 'lb' || !Number.isFinite(value)) return value;
    return Math.round(value * 0.45359237 * 10000) / 10000;
};

export const formatDistance = (km: number, unit: DistanceUnit, lang: Lang): string => {
    const n = Number(km);
    if (!Number.isFinite(n)) return '—';
    const value = unit === 'mi' ? n / KM_PER_MI : n;
    return value.toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), {
        maximumFractionDigits: 2,
        useGrouping: false,
    });
};

export const fromDisplayDistance = (value: number, unit: DistanceUnit): number => {
    if (!Number.isFinite(value)) return value;
    const km = unit === 'mi' ? value * KM_PER_MI : value;
    return Math.round(km * 10000) / 10000;
};

export const distanceUnitLabel = (unit: DistanceUnit): string => (unit === 'mi' ? 'mi' : 'km');

export const formatSize = (cm: number, unit: SizeUnit, lang: Lang): string => {
    const n = Number(cm);
    if (!Number.isFinite(n)) return '—';
    const value = unit === 'in' ? n / CM_PER_IN : n;
    return value.toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), {
        maximumFractionDigits: 1,
        useGrouping: false,
    });
};

export const fromDisplaySize = (value: number, unit: SizeUnit): number => {
    if (!Number.isFinite(value)) return value;
    const cm = unit === 'in' ? value * CM_PER_IN : value;
    return Math.round(cm * 100) / 100;
};

export const sizeUnitLabel = (unit: SizeUnit): string => (unit === 'in' ? 'in' : 'cm');

/** Canonical cm → display value in the chosen unit, 0.1 precision (parity with utils/measurements for BodyMetricsModal). */
export const toSizeDisplay = (cm: number, unit: SizeUnit): number =>
    unit === 'in' ? Math.round((cm / CM_PER_IN) * 10) / 10 : Math.round(cm * 10) / 10;
