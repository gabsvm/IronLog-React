/**
 * Measurements (Strong v6.2.4 parity): peso, grasa, calorías y perímetros.
 *
 * Autonomous module — no shared-file edits required. canonical storage units:
 * weight kg, girths cm, calories kcal, body fat %. Display units resolve from
 * config when present (SettingsParity contract) with device-local fallback.
 *
 * The persisted section (`measurementLogs` in AppContext, key
 * `il_measurements_v1`, dirty section + V2 collection + backup field) is
 * wired by the integrator (see MeasureIntegration contract). This module only
 * defines the shape + pure helpers; hooks/components below talk to context.
 */
import { pickLang } from './i18n';
import { toCsv } from './csv';
import { shareFileOrDownload } from './shareFile';
import { todayLocalDateKey } from './localDate';
import { resolveWeightUnit, toDisplay, fromDisplay } from './units';
import type { WeightUnit } from '../types';

export type MeasurementMetricKey =
    | 'weight' | 'bodyFat' | 'calories'
    | 'neck' | 'shoulders' | 'chest'
    | 'bicepsL' | 'bicepsR' | 'forearmL' | 'forearmR'
    | 'upperAbs' | 'lowerAbs' | 'waist' | 'hips'
    | 'thighL' | 'thighR' | 'calfL' | 'calfR';

/** Independent record. weight stays OPTIONAL here: never fake a 0 weight —
 *  a girth-only check-in is valid. BodyLog (weight required) is untouched. */
export interface MeasurementLog {
    id: number;
    /** Epoch ms chosen by the user (date + time), defaults to now. */
    date: number;
    weight?: number;
    bodyFat?: number;
    calories?: number;
    neck?: number;
    shoulders?: number;
    chest?: number;
    bicepsL?: number;
    bicepsR?: number;
    forearmL?: number;
    forearmR?: number;
    upperAbs?: number;
    lowerAbs?: number;
    waist?: number;
    hips?: number;
    thighL?: number;
    thighR?: number;
    calfL?: number;
    calfR?: number;
    notes?: string;
}


/** Form draft (Strong parity): everything except the assigned id. */
export type MeasurementInput = Omit<MeasurementLog, 'id'>;

export type MeasurementGroup = 'general' | 'torso' | 'arms' | 'core' | 'legs';

export interface MeasurementFieldDef {
    key: MeasurementMetricKey;
    group: MeasurementGroup;
    /** canonical unit: 'kg' | '%' | 'kcal' | 'cm' */
    unit: 'kg' | 'pct' | 'kcal' | 'cm';
    min: number;
    max: number;
}

/** Validation ranges (canonical units). */
export const MEASUREMENT_FIELDS: readonly MeasurementFieldDef[] = [
    { key: 'weight', group: 'general', unit: 'kg', min: 20, max: 400 },
    { key: 'bodyFat', group: 'general', unit: 'pct', min: 0, max: 80 },
    { key: 'calories', group: 'general', unit: 'kcal', min: 0, max: 20000 },
    { key: 'neck', group: 'torso', unit: 'cm', min: 10, max: 250 },
    { key: 'shoulders', group: 'torso', unit: 'cm', min: 10, max: 250 },
    { key: 'chest', group: 'torso', unit: 'cm', min: 10, max: 250 },
    { key: 'bicepsL', group: 'arms', unit: 'cm', min: 10, max: 250 },
    { key: 'bicepsR', group: 'arms', unit: 'cm', min: 10, max: 250 },
    { key: 'forearmL', group: 'arms', unit: 'cm', min: 10, max: 250 },
    { key: 'forearmR', group: 'arms', unit: 'cm', min: 10, max: 250 },
    { key: 'upperAbs', group: 'core', unit: 'cm', min: 10, max: 250 },
    { key: 'lowerAbs', group: 'core', unit: 'cm', min: 10, max: 250 },
    { key: 'waist', group: 'core', unit: 'cm', min: 10, max: 250 },
    { key: 'hips', group: 'core', unit: 'cm', min: 10, max: 250 },
    { key: 'thighL', group: 'legs', unit: 'cm', min: 10, max: 250 },
    { key: 'thighR', group: 'legs', unit: 'cm', min: 10, max: 250 },
    { key: 'calfL', group: 'legs', unit: 'cm', min: 10, max: 250 },
    { key: 'calfR', group: 'legs', unit: 'cm', min: 10, max: 250 },
];

const FIELD_BY_KEY: Record<MeasurementMetricKey, MeasurementFieldDef> = Object.fromEntries(
    MEASUREMENT_FIELDS.map((f) => [f.key, f]),
) as Record<MeasurementMetricKey, MeasurementFieldDef>;

export const isMeasurementMetricKey = (v: unknown): v is MeasurementMetricKey =>
    typeof v === 'string' && (v as MeasurementMetricKey) in FIELD_BY_KEY;

/** Cancelable event dispatched by navigation/widgets to open a measurement. */
export const OPEN_MEASURE_EVENT = 'gainslab:open-measure';

export interface OpenMeasureDetail {
    metric?: MeasurementMetricKey | null;
    entryId?: number | null;
}

/**
 * Single-ownership pending detail for the `measure` route: Layout stashes
 * the event detail here before setView('measure'); MeasurementsSection
 * consumes it once on mount. Module-level on purpose (no storage I/O).
 */
let pendingMeasureDetail: OpenMeasureDetail | null = null;

export const setPendingMeasureDetail = (detail: OpenMeasureDetail | null): void => {
    pendingMeasureDetail = detail;
};

export const consumePendingMeasureDetail = (): OpenMeasureDetail | null => {
    const current = pendingMeasureDetail;
    pendingMeasureDetail = null;
    return current;
};

// ─── Units ────────────────────────────────────────────────────────────────

export type SizeUnit = 'cm' | 'in';
export const CM_PER_IN = 2.54;
export const SIZE_UNITS: readonly SizeUnit[] = ['cm', 'in'];

/**
 * Single source of truth: AppState.config.sizeUnit (SettingsParity).
 * Canonical storage is always cm; absent config → cm. No local fallbacks.
 */
export const resolveSizeUnit = (config?: { sizeUnit?: unknown }): SizeUnit =>
    config?.sizeUnit === 'in' ? 'in' : 'cm';

/** config.bodyWeightUnit wins; legacy config.weightUnit; default kg. */
export const resolveBodyWeightUnit = (config?: {
    bodyWeightUnit?: unknown;
    weightUnit?: unknown;
}): WeightUnit => {
    if (config?.bodyWeightUnit === 'lb' || config?.bodyWeightUnit === 'kg') {
        return config.bodyWeightUnit;
    }
    return resolveWeightUnit(config as { weightUnit?: unknown } | undefined);
};

export const sizeUnitLabel = (u: SizeUnit): string => (u === 'in' ? 'in' : 'cm');

/** canonical cm → display value in the chosen unit, 0.1 precision. */
export const toSizeDisplay = (cm: number, unit: SizeUnit): number =>
    unit === 'in' ? Math.round((cm / CM_PER_IN) * 10) / 10 : Math.round(cm * 10) / 10;

/** display value → canonical cm, kept to 2 decimals. */
export const fromSizeDisplay = (value: number, unit: SizeUnit): number => {
    if (unit !== 'in') return Math.round(value * 100) / 100;
    return Math.round(value * CM_PER_IN * 100) / 100;
};

export const formatSize = (cm: number, unit: SizeUnit, lang: 'es' | 'en'): string =>
    toSizeDisplay(cm, unit).toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), {
        maximumFractionDigits: 1,
        useGrouping: false,
    });

// ─── Local strings (translations.* are integrator-owned; keep local) ──────

type Lang = 'es' | 'en';

const GROUP_LABEL: Record<Lang, Record<MeasurementGroup, string>> = {
    es: { general: 'General', torso: 'Torso', arms: 'Brazos', core: 'Tronco', legs: 'Piernas' },
    en: { general: 'General', torso: 'Torso', arms: 'Arms', core: 'Core', legs: 'Legs' },
};

const FIELD_LABEL: Record<Lang, Record<MeasurementMetricKey, string>> = {
    es: {
        weight: 'Peso', bodyFat: 'Grasa corporal', calories: 'Calorías',
        neck: 'Cuello', shoulders: 'Hombros', chest: 'Pecho',
        bicepsL: 'Bíceps izq.', bicepsR: 'Bíceps der.',
        forearmL: 'Antebrazo izq.', forearmR: 'Antebrazo der.',
        upperAbs: 'Abdomen superior', lowerAbs: 'Abdomen inferior',
        waist: 'Cintura', hips: 'Cadera',
        thighL: 'Muslo izq.', thighR: 'Muslo der.',
        calfL: 'Pantorrilla izq.', calfR: 'Pantorrilla der.',
    },
    en: {
        weight: 'Weight', bodyFat: 'Body fat', calories: 'Calories',
        neck: 'Neck', shoulders: 'Shoulders', chest: 'Chest',
        bicepsL: 'Left biceps', bicepsR: 'Right biceps',
        forearmL: 'Left forearm', forearmR: 'Right forearm',
        upperAbs: 'Upper abs', lowerAbs: 'Lower abs',
        waist: 'Waist', hips: 'Hips',
        thighL: 'Left thigh', thighR: 'Right thigh',
        calfL: 'Left calf', calfR: 'Right calf',
    },
};

export interface MeasurementStrings {
    title: string;
    subtitle: string;
    log: string;
    editTitle: string;
    newTitle: string;
    history: string;
    trend: string;
    metric: string;
    dateTime: string;
    notes: string;
    notesPlaceholder: string;
    exportCsv: string;
    entries: (n: number) => string;
    emptyTitle: string;
    emptyBody: string;
    emptyChart: string;
    latest: string;
    includesWeighIns: string;
    atLeastOne: string;
    outOfRange: (min: number, max: number) => string;
    deleteTitle: string;
    deleteBody: string;
    badDate: string;
    group: (g: MeasurementGroup) => string;
    field: (k: MeasurementMetricKey) => string;
    extraGirths: string;
}

const STRINGS: Record<Lang, MeasurementStrings> = {
    es: {
        title: 'Mediciones',
        subtitle: 'Peso, grasa, calorías y perímetros como en Strong',
        log: 'Registrar',
        editTitle: 'Editar medición',
        newTitle: 'Nueva medición',
        history: 'Historial',
        trend: 'Evolución',
        metric: 'Métrica',
        dateTime: 'Fecha y hora',
        notes: 'Notas',
        notesPlaceholder: 'Opcional: sensaciones, ayuno, hora de la comida…',
        exportCsv: 'Exportar CSV',
        entries: (n) => `${n} ${n === 1 ? 'registro' : 'registros'}`,
        emptyTitle: 'Sin mediciones todavía',
        emptyBody: 'Registra tu primera medición: fecha y hora, peso, grasa, calorías y perímetros.',
        emptyChart: 'Sin datos para esta métrica todavía.',
        latest: 'Última medición',
        includesWeighIns: 'Incluye pesajes del diario',
        atLeastOne: 'Registra al menos una medida (peso, perímetro, grasa o calorías).',
        extraGirths: 'perímetros',
        outOfRange: (min, max) => `Debe estar entre ${min} y ${max}.`,
        deleteTitle: '¿Eliminar medición?',
        deleteBody: 'Se eliminará este registro de tus mediciones. Esta acción no se puede deshacer.',
        badDate: 'Revisa la fecha y la hora: no puede quedar vacía.',
        group: (g) => GROUP_LABEL.es[g],
        field: (k) => FIELD_LABEL.es[k],
    },
    en: {
        title: 'Measurements',
        subtitle: 'Weight, body fat, calories and girths like Strong',
        log: 'Log',
        editTitle: 'Edit measurement',
        newTitle: 'New measurement',
        history: 'History',
        trend: 'Progress',
        metric: 'Metric',
        dateTime: 'Date & time',
        notes: 'Notes',
        notesPlaceholder: 'Optional: how you feel, fasting, meal time…',
        exportCsv: 'Export CSV',
        entries: (n) => `${n} ${n === 1 ? 'entry' : 'entries'}`,
        emptyTitle: 'No measurements yet',
        emptyBody: 'Log your first measurement: date & time, weight, body fat, calories and girths.',
        emptyChart: 'No data for this metric yet.',
        latest: 'Latest check-in',
        includesWeighIns: 'Includes diary weigh-ins',
        atLeastOne: 'Log at least one value (weight, girth, body fat or calories).',
        extraGirths: 'girths',
        outOfRange: (min, max) => `Must be between ${min} and ${max}.`,
        deleteTitle: 'Delete measurement?',
        deleteBody: 'This record will be removed from your measurements. This cannot be undone.',
        badDate: 'Check the date and time: it cannot be empty.',
        group: (g) => GROUP_LABEL.en[g],
        field: (k) => FIELD_LABEL.en[k],
    },
};

export const mstr = (lang: Lang): MeasurementStrings => STRINGS[lang] ?? STRINGS.es;

/** epoch ms → 'YYYY-MM-DDTHH:mm' in local time (datetime-local value). */
export const toLocalInputValue = (ms: number): string => {
    const d = new Date(ms);
    const p = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 'YYYY-MM-DDTHH:mm' (local) → epoch ms; falls back to now when invalid. */
export const fromLocalInputValue = (v: string): number => {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : Date.now();
};

export const formatMeasureDate = (ms: number, lang: Lang): string =>
    new Date(ms).toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// ─── Validation / sanitize ────────────────────────────────────────────────

const finiteIn = (v: unknown, min: number, max: number): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export interface MeasurementValidation {
    ok: boolean;
    empty: boolean;
    outOfRange: MeasurementMetricKey[];
}

export const validateMeasurementInput = (input: MeasurementInput): MeasurementValidation => {
    const outOfRange: MeasurementMetricKey[] = [];
    let count = 0;
    for (const f of MEASUREMENT_FIELDS) {
        const v: unknown = input[f.key];
        if (v === undefined || v === null || v === '') {
            continue;
        }
        if (typeof v !== 'number' || !Number.isFinite(v)) {
            outOfRange.push(f.key);
            continue;
        }
        count += 1;
        if (v < f.min || v > f.max) outOfRange.push(f.key);
    }
    return { ok: count > 0 && outOfRange.length === 0, empty: count === 0, outOfRange };
};

/** Coerces unknown data into a MeasurementLog; null when id/date unusable.
 *  Out-of-range numbers are dropped (never clamped into fake values). */
export const sanitizeMeasurement = (raw: unknown): MeasurementLog | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === 'string' && r.id !== '' ? Number(r.id) : r.id;
    const date = r.date;
    if (typeof id !== 'number' || !Number.isFinite(id)) return null;
    if (typeof date !== 'number' || !Number.isFinite(date) || date <= 0) return null;
    const out: MeasurementLog = { id, date };
    for (const f of MEASUREMENT_FIELDS) {
        const v = r[f.key];
        if (typeof v === 'number' && Number.isFinite(v) && v >= f.min && v <= f.max) {
            (out as unknown as Record<string, number>)[f.key] = v;
        }
    }
    if (typeof r.notes === 'string' && r.notes.trim() !== '') {
        out.notes = r.notes.slice(0, 500);
    }
    return out;
};

// ─── Series (charts) ──────────────────────────────────────────────────────

export interface MetricPoint {
    t: number;
    v: number;
}

/** Ascending series for one metric (canonical units), measurements only. */
export const metricSeries = (entries: MeasurementLog[], key: MeasurementMetricKey): MetricPoint[] =>
    entries
        .filter((e) => typeof e[key] === 'number')
        .map((e) => ({ t: e.date, v: e[key] as number }))
        .sort((a, b) => a.t - b.t);

export interface WeightPoint extends MetricPoint {
    source: 'measure' | 'body';
}

export interface BodyWeighIn {
    id: number | string;
    date: number;
    weight: number;
}

/**
 * Strong parity: the weight chart also shows existing diary weigh-ins
 * (bodyLogs) next to measurement weights. Visual merge only — nothing is
 * written or duplicated into either store.
 */
export const mergedWeightSeries = (
    entries: MeasurementLog[],
    bodyWeighIns: BodyWeighIn[],
    limit = 120,
): WeightPoint[] => {
    const pts: WeightPoint[] = [];
    for (const e of entries) {
        if (typeof e.weight === 'number' && Number.isFinite(e.weight)) {
            pts.push({ t: e.date, v: e.weight, source: 'measure' });
        }
    }
    for (const w of bodyWeighIns) {
        if (typeof w.weight === 'number' && Number.isFinite(w.weight) && w.weight > 0 &&
            typeof w.date === 'number' && Number.isFinite(w.date) && w.date > 0) {
            pts.push({ t: w.date, v: w.weight, source: 'body' });
        }
    }
    pts.sort((a, b) => a.t - b.t);
    return pts.length > limit ? pts.slice(pts.length - limit) : pts;
};

// ─── CSV export ───────────────────────────────────────────────────────────

const CSV_HEADERS = [
    'id', 'date_iso', 'weight_kg', 'bodyfat_pct', 'calories_kcal',
    'neck_cm', 'shoulders_cm', 'chest_cm',
    'bicepsL_cm', 'bicepsR_cm', 'forearmL_cm', 'forearmR_cm',
    'upperAbs_cm', 'lowerAbs_cm', 'waist_cm', 'hips_cm',
    'thighL_cm', 'thighR_cm', 'calfL_cm', 'calfR_cm', 'notes',
];

const csvCell = (v: number | string | undefined): string | number =>
    v === undefined ? '' : v;

export const measurementsToCsv = (entries: MeasurementLog[]): string => {
    const rows: (string | number)[][] = [CSV_HEADERS];
    const sorted = [...entries].sort((a, b) => a.date - b.date);
    for (const e of sorted) {
        rows.push([
            e.id,
            new Date(e.date).toISOString(),
            csvCell(e.weight), csvCell(e.bodyFat), csvCell(e.calories),
            csvCell(e.neck), csvCell(e.shoulders), csvCell(e.chest),
            csvCell(e.bicepsL), csvCell(e.bicepsR), csvCell(e.forearmL), csvCell(e.forearmR),
            csvCell(e.upperAbs), csvCell(e.lowerAbs), csvCell(e.waist), csvCell(e.hips),
            csvCell(e.thighL), csvCell(e.thighR), csvCell(e.calfL), csvCell(e.calfR),
            e.notes ?? '',
        ]);
    }
    return toCsv(rows);
};

export const exportMeasurementsCsv = (
    entries: MeasurementLog[],
): Promise<'shared' | 'downloaded'> =>
    shareFileOrDownload(
        measurementsToCsv(entries),
        `measurements_${todayLocalDateKey()}.csv`,
        'text/csv',
        'GainsLab',
    );

// ─── Backup fragment (integrator reuse) ───────────────────────────────────

export const extractMeasurementsFragment = (state: {
    measurementLogs?: unknown;
}): { measurementLogs: MeasurementLog[] } => ({
    measurementLogs: Array.isArray(state.measurementLogs)
        ? (state.measurementLogs.map(sanitizeMeasurement).filter(Boolean) as MeasurementLog[])
        : [],
});

/** Merges an incoming backup fragment: dedupe by id (newer date wins), desc. */
export const mergeMeasurementsFragment = (
    current: MeasurementLog[],
    incoming: unknown,
    cap = 500,
): MeasurementLog[] => {
    const byId = new Map<number, MeasurementLog>();
    for (const e of current) {
        const s = sanitizeMeasurement(e);
        if (s) byId.set(s.id, s);
    }
    const list = Array.isArray(incoming) ? incoming : [];
    for (const raw of list) {
        const s = sanitizeMeasurement(raw);
        if (!s) continue;
        const prev = byId.get(s.id);
        if (!prev || s.date >= prev.date) byId.set(s.id, s);
    }
    return [...byId.values()].sort((a, b) => b.date - a.date).slice(0, cap);
};

/** Display formatting for one metric value (converted to display units). */
export const formatMetricValue = (
    key: MeasurementMetricKey,
    canonical: number,
    weightUnit: WeightUnit,
    sizeUnit: SizeUnit,
    lang: Lang,
): string => {
    if (key === 'weight') {
        return `${toDisplay(canonical, weightUnit).toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { maximumFractionDigits: 1, useGrouping: false })}`;
    }
    if (key === 'bodyFat') return `${canonical}`;
    if (key === 'calories') return `${Math.round(canonical)}`;
    return formatSize(canonical, sizeUnit, lang);
};

export const metricUnitSuffix = (
    key: MeasurementMetricKey,
    weightUnit: WeightUnit,
    sizeUnit: SizeUnit,
): string => {
    if (key === 'weight') return weightUnit === 'lb' ? 'lbs' : 'kg';
    if (key === 'bodyFat') return '%';
    if (key === 'calories') return 'kcal';
    return sizeUnitLabel(sizeUnit);
};

/** Display value (for inputs) from a canonical stored value. */
export const canonicalToInput = (
    key: MeasurementMetricKey,
    canonical: number,
    weightUnit: WeightUnit,
    sizeUnit: SizeUnit,
): string => {
    if (key === 'weight') return String(toDisplay(canonical, weightUnit));
    if (key === 'bodyFat' || key === 'calories') return String(canonical);
    return String(toSizeDisplay(canonical, sizeUnit));
};

/** Canonical stored value from a display input string (NaN → undefined). */
export const inputToCanonical = (
    key: MeasurementMetricKey,
    raw: string,
    weightUnit: WeightUnit,
    sizeUnit: SizeUnit,
): number | undefined => {
    if (raw.trim() === '') return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n)) return NaN;
    if (key === 'weight') return fromDisplay(n, weightUnit);
    if (key === 'bodyFat' || key === 'calories') return n;
    return fromSizeDisplay(n, sizeUnit);
};
