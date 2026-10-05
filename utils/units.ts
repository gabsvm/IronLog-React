import { pickLang } from './i18n';
import type { WeightUnit } from '../types';

/**
 * Q11: weight units. Stored data is ALWAYS kilograms (canonical); the unit
 * preference only changes presentation and input. Switching units never
 * rewrites stored logs, profile, or body data.
 */

export const KG_PER_LB = 0.45359237;

/** Smallest-to-largest plate inventory per unit (per-side plates). */
export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const LB_PLATES = [45, 35, 25, 10, 5, 2.5];

export const platesFor = (unit: WeightUnit): number[] =>
    unit === 'lb' ? [...LB_PLATES] : [...KG_PLATES];

/** Suggested overload step in display space: 2.5 kg or 5 lb. */
export const PROGRESSION_STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 };

export const unitLabel = (unit: WeightUnit): 'KG' | 'LBS' =>
    unit === 'lb' ? 'LBS' : 'KG';

/** Normalize a possibly-absent/legacy config value; unknown → 'kg'. */
export const resolveWeightUnit = (config?: { weightUnit?: unknown }): WeightUnit =>
    config?.weightUnit === 'lb' ? 'lb' : 'kg';

/**
 * Canonical kg → display value in the chosen unit, rounded to 0.1.
 * Identity in kg mode so the current behavior stays byte-identical.
 */
export const toDisplay = (kg: number, unit: WeightUnit): number => {
    if (unit !== 'lb') return kg;
    return Math.round((kg / KG_PER_LB) * 10) / 10;
};

/**
 * Display value → canonical kg, kept to 4 decimals.
 * Identity in kg mode so commits store exactly what was typed.
 */
export const fromDisplay = (value: number, unit: WeightUnit): number => {
    if (unit !== 'lb') return value;
    return Math.round(value * KG_PER_LB * 10000) / 10000;
};

/**
 * Localized weight string: converted to the unit, 0.1 precision, no
 * thousands grouping (same convention as formatSets in statsOverview).
 */
export const formatWeight = (kg: number, unit: WeightUnit, lang: 'es' | 'en'): string =>
    toDisplay(kg, unit).toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), {
        maximumFractionDigits: 1,
        useGrouping: false,
    });

/**
 * Round canonical kg to the nearest total loadable with real plates
 * (2.5 kg / 5 lb increments = twice the smallest per-side plate).
 * Returns canonical kg.
 */
export const roundToPlates = (kg: number, unit: WeightUnit): number => {
    const increment = unit === 'lb' ? 5 : 2.5;
    return fromDisplay(Math.round(toDisplay(kg, unit) / increment) * increment, unit);
};
