import type { IncompleteSets, OneRmFormula, PreviousScope } from './strongTraining';

/**
 * Back-compat reader for Settings-owned workout prefs.
 *
 * Nomenclature is owned by SettingsParity (`utils/strongTraining.ts`):
 * field names, value unions and defaults mirror `TrainingConfigFields`.
 * Until Main lands these keys in `AppState.config`, every field resolves to
 * `undefined` and call sites apply IronLog's current defaults. Narrowing is
 * inline `typeof`/`in` per field (no helpers, no casts); each field validates
 * its own runtime shape at this boundary.
 */
export interface WorkoutPrefs {
    defaultRestSeconds?: number;
    warmupRestSeconds?: number;
    autoStartRest?: boolean;
    incompleteSets?: IncompleteSets;
    previousScope?: PreviousScope;
    defaultSets?: number;
    oneRmFormula?: OneRmFormula;
}

export const readWorkoutPrefs = (config: unknown): WorkoutPrefs => {
    const prefs: WorkoutPrefs = {};
    if (typeof config !== 'object' || config === null) return prefs;
    if ('defaultRestSeconds' in config) {
        const v: unknown = config.defaultRestSeconds;
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) prefs.defaultRestSeconds = v;
    }
    if ('warmupRestSeconds' in config) {
        const v: unknown = config.warmupRestSeconds;
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) prefs.warmupRestSeconds = v;
    }
    if ('autoStartRest' in config) {
        const v: unknown = config.autoStartRest;
        if (typeof v === 'boolean') prefs.autoStartRest = v;
    }
    if ('incompleteSets' in config) {
        const v: unknown = config.incompleteSets;
        // Canonical ask/complete/discard; legacy 'keep' behaves as 'ask'
        // (safe default, mirroring sanitizeTrainingConfig) until renamed.
        if (v === 'ask' || v === 'complete' || v === 'discard') prefs.incompleteSets = v;
        else if (v === 'keep') prefs.incompleteSets = 'ask';
    }
    if ('previousScope' in config) {
        const v: unknown = config.previousScope;
        // Canonical any/planDay; legacy 'routine' behaves as 'planDay'.
        if (v === 'any' || v === 'planDay') prefs.previousScope = v;
        else if (v === 'routine') prefs.previousScope = 'planDay';
    }
    if ('defaultSets' in config) {
        const v: unknown = config.defaultSets;
        if (typeof v === 'number' && Number.isFinite(v)) prefs.defaultSets = Math.min(10, Math.max(1, Math.round(v)));
    }
    if ('oneRmFormula' in config) {
        const v: unknown = config.oneRmFormula;
        if (v === 'epley' || v === 'brzycki' || v === 'lombardi') prefs.oneRmFormula = v;
    }
    return prefs;
};
