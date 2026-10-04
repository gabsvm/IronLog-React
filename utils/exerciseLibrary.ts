import type { ExerciseDef } from '../types';
import { EXERCISE_ALIASES } from '../constants/exerciseAliases';

/**
 * Q14: exercise-library search and non-destructive merge.
 *
 * Merge model: `mergedInto` points a duplicate at its canonical exercise.
 * Logs are NEVER rewritten; every read path resolves ids through
 * resolveExerciseId / exerciseIdGroup. Unmerge = drop mergedInto.
 */

/** Lowercase, accent-free, punctuation-collapsed name for matching. */
export const normalizeExerciseName = (name: string): string =>
    (name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

/** All searchable names of a def: en + es + per-def aliases + curated map. */
export const exerciseSearchNames = (def: ExerciseDef): string[] => {
    const base = typeof def.name === 'string' ? [def.name] : [def.name?.en, def.name?.es];
    return [...base, ...(def.aliases ?? []), ...(EXERCISE_ALIASES[def.id] ?? [])].filter(
        (n): n is string => typeof n === 'string' && n.length > 0
    );
};

/** Normalized substring match over every searchable name (empty query matches). */
export const matchesExerciseQuery = (def: ExerciseDef, query: string): boolean => {
    const q = normalizeExerciseName(query);
    if (!q) return true;
    return exerciseSearchNames(def).some((name) => normalizeExerciseName(name).includes(q));
};

/** Follow mergedInto chains to the canonical id (cycle-safe, unknown → itself). */
export const resolveExerciseId = (exercises: readonly ExerciseDef[], id: string): string => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    let current = id;
    const seen = new Set<string>([id]);
    for (;;) {
        const next = byId.get(current)?.mergedInto;
        if (!next || seen.has(next)) return current;
        seen.add(next);
        current = next;
    }
};

/** Canonical id plus every id merged (transitively) into it. */
export const exerciseIdGroup = (exercises: readonly ExerciseDef[], id: string): string[] => {
    const canonical = resolveExerciseId(exercises, id);
    const group = [canonical];
    for (const def of exercises) {
        if (def.id !== canonical && resolveExerciseId(exercises, def.id) === canonical) {
            group.push(def.id);
        }
    }
    return group;
};

/** Everything a selector may offer: merged-away defs stay hidden. */
export const isSelectorVisible = (def: ExerciseDef): boolean => !def.mergedInto;

/**
 * Sum per-exercise counts under their canonical ids (merged members fold
 * into the survivor). Entries for unknown ids pass through untouched.
 */
export const aggregateExerciseFrequency = (
    frequency: Record<string, number>,
    exercises: readonly ExerciseDef[]
): [string, number][] => {
    const totals = new Map<string, number>();
    for (const [id, count] of Object.entries(frequency)) {
        const canonical = resolveExerciseId(exercises, id);
        totals.set(canonical, (totals.get(canonical) ?? 0) + count);
    }
    return [...totals.entries()];
};

/**
 * Point fromId at toId's canonical target. Refuses self-merges, unknown ids
 * and anything that would close a cycle (returns the input untouched).
 */
export const mergeExercises = (
    exercises: ExerciseDef[],
    fromId: string,
    toId: string
): ExerciseDef[] => {
    if (fromId === toId) return exercises;
    const from = exercises.find((e) => e.id === fromId);
    const to = exercises.find((e) => e.id === toId);
    if (!from || !to) return exercises;
    if (resolveExerciseId(exercises, toId) === fromId) return exercises;
    const target = resolveExerciseId(exercises, toId);
    return exercises.map((e) => (e.id === fromId ? { ...e, mergedInto: target } : e));
};

/** Drop mergedInto (no-op when absent). */
export const unmergeExercise = (exercises: ExerciseDef[], fromId: string): ExerciseDef[] => {
    let changed = false;
    const next = exercises.map((e) => {
        if (e.id !== fromId || !e.mergedInto) return e;
        changed = true;
        const { mergedInto: _dropped, ...rest } = e;
        return rest;
    });
    return changed ? next : exercises;
};

export interface DuplicateSuggestion {
    sourceId: string;
    targetId: string;
    reason: 'same-name' | 'shared-alias';
}

const isCustomish = (def: ExerciseDef): boolean =>
    !!def.isCustom || def.id.startsWith('custom_') || def.id.startsWith('custom_csv_');

/**
 * Suggest (source → target) pairs whose normalized names collide: either a
 * shared primary name ('same-name') or a name/alias collision ('shared-alias').
 * Already-merged pairs are skipped; built-ins win as targets over customs.
 */
export const suggestDuplicatePairs = (exercises: readonly ExerciseDef[]): DuplicateSuggestion[] => {
    const primaryByNorm = new Map<string, ExerciseDef[]>();
    const anyByNorm = new Map<string, ExerciseDef[]>();
    for (const def of exercises) {
        const primaries = new Set(
            (typeof def.name === 'string' ? [def.name] : [def.name?.en, def.name?.es])
                .map(normalizeExerciseName)
                .filter(Boolean)
        );
        for (const norm of primaries) {
            const list = primaryByNorm.get(norm) ?? [];
            list.push(def);
            primaryByNorm.set(norm, list);
        }
        const all = new Set(exerciseSearchNames(def).map(normalizeExerciseName).filter(Boolean));
        for (const norm of all) {
            const list = anyByNorm.get(norm) ?? [];
            list.push(def);
            anyByNorm.set(norm, list);
        }
    }

    const suggestions = new Map<string, DuplicateSuggestion>();
    const consider = (group: ExerciseDef[], reason: DuplicateSuggestion['reason']) => {
        const distinct = group.filter(
            (def, i) => group.findIndex((d) => resolveExerciseId(exercises, d.id) === resolveExerciseId(exercises, def.id)) === i
        );
        if (distinct.length < 2) return;
        const sorted = [...distinct].sort((a, b) => Number(isCustomish(a)) - Number(isCustomish(b)));
        const target = sorted[0]!;
        for (const source of sorted.slice(1)) {
            const key = `${source.id}→${target.id}`;
            if (!suggestions.has(key)) suggestions.set(key, { sourceId: source.id, targetId: target.id, reason });
        }
    };

    for (const group of primaryByNorm.values()) consider(group, 'same-name');
    for (const [norm, group] of anyByNorm) {
        // A same-name collision already reported for this pair wins over alias noise.
        void norm;
        consider(group, 'shared-alias');
    }
    return [...suggestions.values()];
};
