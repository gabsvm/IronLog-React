import { parseCsv, toCsv } from '../utils/csv';
import { KG_PER_LB, toDisplay } from '../utils/units';
import { getTranslated } from '../utils';
import { db } from '../utils/db';
import type {
    ExerciseDef,
    Log,
    MuscleGroup,
    SessionExercise,
    SetType,
    WeightUnit,
    WorkoutSet,
} from '../types';

/**
 * Q12: training CSV export + Hevy/Strong import.
 *
 * Conventions:
 * - Imported sessions use the reserved mesoId IMPORTED_MESO_ID (-100) so the
 *   "This plan" scope never includes them; they live in "All history".
 * - All stored weights are canonical kg (see utils/units).
 * - Reimports are idempotent via importKey (start + exercises + sets).
 * - Fixtures are synthetic, built from the documented Hevy/Strong headers;
 *   they must be validated against a real owner export (see report).
 */

export const IMPORTED_MESO_ID = -100;
export const CSV_IMPORT_KEYS_KEY = 'il_csv_import_keys_v1';

export type CsvSourceFormat = 'hevy' | 'strong';

export interface ParsedImportSet {
    index: number;
    type: SetType;
    weightKg: number | null;
    reps: number | null;
    rpe: number | null;
    note: string | null;
}

export interface ParsedImportExercise {
    name: string;
    notes: string[];
    sets: ParsedImportSet[];
}

export interface ParsedImportSession {
    /** Idempotency key: source + start + exercises + sets. */
    key: string;
    source: CsvSourceFormat;
    title: string;
    startTime: number;
    endTime: number;
    note: string | null;
    exercises: ParsedImportExercise[];
    setCount: number;
}

export interface ParsedCsvImport {
    source: CsvSourceFormat;
    sessions: ParsedImportSession[];
    skippedRows: number;
    dateRange: { min: number; max: number } | null;
}

/** Lowercase, accent-free, punctuation-collapsed Exercise name for matching. */
export const normalizeExerciseName = (name: string): string =>
    name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

/** Detect Hevy vs Strong by their documented header columns. */
export const detectCsvFormat = (header: string[]): CsvSourceFormat | null => {
    const cols = new Set(header.map((h) => h.trim().toLowerCase()));
    const has = (...names: string[]): boolean => names.every((n) => cols.has(n));
    if (has('title', 'start_time', 'end_time', 'exercise_title', 'set_index')) return 'hevy';
    if (has('date', 'workout name', 'exercise name', 'set order')) return 'strong';
    return null;
};

type Row = Record<string, string>;

const rowsToObjects = (rows: string[][]): { header: string[]; records: Row[] } => {
    const header = (rows[0] ?? []).map((h) => h.trim());
    const keys = header.map((h) => h.toLowerCase());
    const records = rows.slice(1).map((cells) => {
        const obj: Row = {};
        keys.forEach((key, i) => {
            obj[key] = (cells[i] ?? '').trim();
        });
        return obj;
    });
    return { header, records };
};

const toNumberOrNull = (value: string): number | null => {
    if (value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const mapHevySetType = (value: string): SetType => {
    const v = value.trim().toLowerCase();
    if (v === 'warmup') return 'warmup';
    if (v === 'drop' || v === 'dropset') return 'drop';
    return 'regular';
};

const mapStrongSetType = (value: string): SetType => {
    // Strong encodes drops/warmups in notes; without markers everything is a working set.
    const v = value.trim().toLowerCase();
    if (v === 'warmup' || v === 'w') return 'warmup';
    if (v === 'drop' || v === 'd') return 'drop';
    return 'regular';
};

const kg4 = (kg: number): number => Math.round(kg * 10000) / 10000;

const finishSessionKey = (
    source: CsvSourceFormat,
    startTime: number,
    title: string,
    exCount: number,
    setCount: number
): string =>
    `${source}:${startTime}:${normalizeExerciseName(title) || 'session'}:${exCount}x${setCount}`;

interface SessionAccumulator {
    title: string;
    startTime: number;
    endTime: number;
    note: string | null;
    exercises: ParsedImportExercise[];
    byName: Map<string, ParsedImportExercise>;
    setCount: number;
}

const newAccumulator = (title: string, startTime: number, endTime: number): SessionAccumulator => ({
    title,
    startTime,
    endTime,
    note: null,
    exercises: [],
    byName: new Map(),
    setCount: 0,
});

const accExercise = (acc: SessionAccumulator, name: string): ParsedImportExercise => {
    let ex = acc.byName.get(name);
    if (!ex) {
        ex = { name, notes: [], sets: [] };
        acc.byName.set(name, ex);
        acc.exercises.push(ex);
    }
    return ex;
};

const finishAccumulator = (source: CsvSourceFormat, acc: SessionAccumulator): ParsedImportSession => {
    for (const ex of acc.exercises) {
        ex.sets.sort((a, b) => a.index - b.index);
        // Dedupe identical sets that some exports repeat (same index twice).
        ex.sets = ex.sets.filter(
            (set, i, arr) =>
                i === 0 ||
                set.index !== arr[i - 1]!.index ||
                set.weightKg !== arr[i - 1]!.weightKg ||
                set.reps !== arr[i - 1]!.reps
        );
    }
    const setCount = acc.exercises.reduce((n, ex) => n + ex.sets.length, 0);
    return {
        key: finishSessionKey(source, acc.startTime, acc.title, acc.exercises.length, setCount),
        source,
        title: acc.title,
        startTime: acc.startTime,
        endTime: acc.endTime,
        note: acc.note,
        exercises: acc.exercises,
        setCount,
    };
};

const summarizeImport = (source: CsvSourceFormat, sessions: ParsedImportSession[], skippedRows: number): ParsedCsvImport => {
    const times = sessions.map((s) => s.startTime).filter((t) => Number.isFinite(t));
    return {
        source,
        sessions: sessions.sort((a, b) => a.startTime - b.startTime),
        skippedRows,
        dateRange: times.length > 0 ? { min: Math.min(...times), max: Math.max(...times) } : null,
    };
};

/** Parse a Hevy export (weight_kg or weight_lbs columns carry the unit). */
export const parseHevyCsv = (text: string): ParsedCsvImport => {
    const { records } = rowsToObjects(parseCsv(text));
    const sessions = new Map<string, SessionAccumulator>();
    let skippedRows = 0;

    for (const row of records) {
        const title = row['title'] || 'Hevy workout';
        const startMs = Date.parse(row['start_time'] || '');
        const endMs = Date.parse(row['end_time'] || '');
        const exName = row['exercise_title'] || '';
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || exName === '') {
            skippedRows += 1;
            continue;
        }
        const groupKey = `${title}|||${row['start_time']}|||${row['end_time']}`;
        let acc = sessions.get(groupKey);
        if (!acc) {
            acc = newAccumulator(title, startMs, endMs);
            const desc = (row['description'] || '').trim();
            if (desc) acc.note = desc;
            sessions.set(groupKey, acc);
        }
        const ex = accExercise(acc, exName);
        const exNote = (row['exercise_notes'] || '').trim();
        if (exNote && !ex.notes.includes(exNote)) ex.notes.push(exNote);

        const kgRaw = toNumberOrNull(row['weight_kg'] || '');
        const lbRaw = toNumberOrNull(row['weight_lbs'] || '');
        const weightKg = kgRaw != null ? kg4(kgRaw) : lbRaw != null ? kg4(lbRaw * KG_PER_LB) : null;
        ex.sets.push({
            index: toNumberOrNull(row['set_index'] || '') ?? ex.sets.length,
            type: mapHevySetType(row['set_type'] || 'normal'),
            weightKg,
            reps: toNumberOrNull(row['reps'] || ''),
            rpe: toNumberOrNull(row['rpe'] || ''),
            note: null,
        });
        acc.setCount += 1;
    }

    return summarizeImport(
        'hevy',
        [...sessions.values()].map((acc) => finishAccumulator('hevy', acc)),
        skippedRows
    );
};

/**
 * Parse a Strong export. Strong rows carry no unit column, so the caller
 * passes the unit the file's weights are written in (asked in the UI).
 */
export const parseStrongCsv = (text: string, fileWeightUnit: WeightUnit): ParsedCsvImport => {
    const { records } = rowsToObjects(parseCsv(text));
    const sessions = new Map<string, SessionAccumulator>();
    let skippedRows = 0;

    for (const row of records) {
        const dateMs = Date.parse(row['date'] || '');
        const workout = row['workout name'] || 'Strong workout';
        const exName = row['exercise name'] || '';
        if (!Number.isFinite(dateMs) || exName === '') {
            skippedRows += 1;
            continue;
        }
        const groupKey = `${row['date']}|||${workout}`;
        let acc = sessions.get(groupKey);
        if (!acc) {
            acc = newAccumulator(workout, dateMs, dateMs);
            const wnote = (row['workout notes'] || '').trim();
            if (wnote) acc.note = wnote;
            sessions.set(groupKey, acc);
        }
        const ex = accExercise(acc, exName);
        const setNote = (row['notes'] || '').trim();
        if (setNote && !ex.notes.includes(setNote)) ex.notes.push(setNote);

        const raw = toNumberOrNull(row['weight'] || '');
        ex.sets.push({
            index: toNumberOrNull(row['set order'] || '') ?? ex.sets.length,
            type: mapStrongSetType(''),
            weightKg: raw != null ? (fileWeightUnit === 'lb' ? kg4(raw * KG_PER_LB) : kg4(raw)) : null,
            reps: toNumberOrNull(row['reps'] || ''),
            rpe: toNumberOrNull(row['rpe'] || ''),
            note: setNote || null,
        });
        acc.setCount += 1;
    }

    return summarizeImport(
        'strong',
        [...sessions.values()].map((acc) => finishAccumulator('strong', acc)),
        skippedRows
    );
};

/** Parse either supported format (throws on unknown headers or empty files). */
export const parseTrainingCsv = (text: string, strongWeightUnit: WeightUnit = 'kg'): ParsedCsvImport => {
    const rows = parseCsv(text);
    if (rows.length === 0 || (rows[0] ?? []).every((c) => c === '')) {
        throw new Error('empty');
    }
    const format = detectCsvFormat(rows[0]!);
    if (format === 'hevy') return parseHevyCsv(text);
    if (format === 'strong') return parseStrongCsv(text, strongWeightUnit);
    throw new Error('unknown-format');
};

export interface ExerciseNameMatch {
    parsedName: string;
    matched: ExerciseDef | null;
}

/**
 * Exact normalized-name match against the library (both languages).
 * Alias/fuzzy suggestions arrive with Q14; anything unmatched goes to the
 * manual mapping step.
 */
export const matchParsedExerciseNames = (names: string[], library: ExerciseDef[]): ExerciseNameMatch[] => {
    const byNorm = new Map<string, ExerciseDef>();
    for (const def of library) {
        const candidates = typeof def.name === 'string' ? [def.name] : [def.name.en, def.name.es];
        for (const candidate of candidates) {
            const norm = normalizeExerciseName(candidate || '');
            if (norm && !byNorm.has(norm)) byNorm.set(norm, def);
        }
    }
    return names.map((parsedName) => ({
        parsedName,
        matched: byNorm.get(normalizeExerciseName(parsedName)) ?? null,
    }));
};

export type ExerciseMappingDecision =
    | { kind: 'existing'; exerciseId: string }
    | { kind: 'create'; muscle: MuscleGroup };

export interface BuiltImport {
    logs: Log[];
    newExercises: ExerciseDef[];
}

/**
 * Build Logs + new custom exercises from parsed sessions and the user's
 * per-exercise mapping decisions. Imported sets are stored completed.
 */
export const buildImportLogs = (
    sessions: ParsedImportSession[],
    mapping: Record<string, ExerciseMappingDecision>,
    library: ExerciseDef[],
    now: number = Date.now()
): BuiltImport => {
    const byId = new Map(library.map((def) => [def.id, def]));
    const newExercises: ExerciseDef[] = [];
    const createdByName = new Map<string, ExerciseDef>();
    let counter = 0;
    const nextId = () => {
        counter += 1;
        return now + counter;
    };

    const resolveDef = (parsedName: string): ExerciseDef => {
        const decision = mapping[parsedName];
        if (!decision) throw new Error(`missing-mapping:${parsedName}`);
        if (decision.kind === 'existing') {
            const def = byId.get(decision.exerciseId);
            if (!def) throw new Error(`unknown-exercise:${decision.exerciseId}`);
            return def;
        }
        let created = createdByName.get(parsedName);
        if (!created) {
            created = {
                id: `custom_csv_${now}_${createdByName.size}`,
                name: parsedName,
                muscle: decision.muscle,
                isCustom: true,
            };
            createdByName.set(parsedName, created);
            newExercises.push(created);
        }
        return created;
    };

    const logs: Log[] = sessions.map((session, sessionIdx) => {
        const exercises: SessionExercise[] = session.exercises.map((parsed) => {
            const def = resolveDef(parsed.name);
            const sets: WorkoutSet[] = parsed.sets.map((set) => ({
                id: nextId(),
                weight: set.weightKg != null ? String(set.weightKg) : '',
                reps: set.reps != null ? String(set.reps) : '',
                rpe: set.rpe != null ? String(set.rpe) : '',
                completed: true,
                type: set.type,
            }));
            return {
                ...def,
                instanceId: nextId(),
                note: parsed.notes.length > 0 ? parsed.notes.join(' · ') : undefined,
                sets,
            };
        });
        return {
            id: now + 1000000 + sessionIdx,
            dayIdx: -1,
            name: session.title,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: Math.max(0, Math.round((session.endTime - session.startTime) / 1000)),
            mesoId: IMPORTED_MESO_ID,
            week: -1,
            exercises,
            note: session.note ?? undefined,
            importKey: session.key,
            importedFrom: session.source,
        };
    });

    return { logs, newExercises };
};

/** Split parsed sessions into fresh vs already-imported by key. */
export const splitFreshSessions = (
    sessions: ParsedImportSession[],
    knownKeys: ReadonlySet<string>
): { fresh: ParsedImportSession[]; skippedCount: number } => {
    const fresh = sessions.filter((s) => !knownKeys.has(s.key));
    return { fresh, skippedCount: sessions.length - fresh.length };
};

export const readImportKeys = async (): Promise<string[]> => {
    try {
        return await db.get<string[]>(CSV_IMPORT_KEYS_KEY, []);
    } catch {
        return [];
    }
};

export const addImportKeys = async (keys: string[]): Promise<void> => {
    if (keys.length === 0) return;
    try {
        const prev = await db.get<string[]>(CSV_IMPORT_KEYS_KEY, []);
        const merged = [...prev];
        for (const key of keys) {
            if (!merged.includes(key)) merged.push(key);
        }
        await db.set(CSV_IMPORT_KEYS_KEY, merged);
    } catch {
        // Best-effort: idempotency also checks the logs themselves.
    }
};

/**
 * Export training history to CSV: one row per completed set. Weights use the
 * chosen display unit (declared in the header); decimals always use a dot so
 * the file stays valid CSV regardless of locale. Skipped logs and
 * incomplete/skipped sets are excluded.
 */
export const buildTrainingCsv = (logs: Log[], unit: WeightUnit): string => {
    const rows: unknown[][] = [
        ['Date', 'Session', 'Exercise', 'Muscle', 'Set', 'Type', `Weight(${unit})`, 'Reps', 'RIR', 'Notes'],
    ];
    const ordered = [...logs].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    for (const log of ordered) {
        if (log.skipped) continue;
        const date = new Date(log.startTime || 0).toLocaleDateString('en-CA');
        for (const ex of log.exercises || []) {
            let setNumber = 0;
            for (const set of ex.sets || []) {
                if (!set.completed || set.skipped) continue;
                setNumber += 1;
                const kg = Number(set.weight || 0);
                rows.push([
                    date,
                    log.name || '',
                    getTranslated(ex.name, 'en'),
                    ex.muscle || '',
                    setNumber,
                    set.type || 'regular',
                    Number.isFinite(kg) ? String(toDisplay(kg, unit)) : '',
                    set.reps ?? '',
                    set.rpe ?? '',
                    ex.note ?? '',
                ]);
            }
        }
    }
    return toCsv(rows);
};
