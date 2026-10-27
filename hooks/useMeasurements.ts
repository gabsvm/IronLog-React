/**
 * Context-backed measurements store (Strong parity).
 *
 * Consumes the `measurementLogs` section like any other synced section
 * (IndexedDB key `il_measurements_v1`, dirty section, V2 collection and
 * backup field all named `measurementLogs`). Reads are sanitized; writes go
 * straight through setMeasurementLogs. Weight chart merges diary weigh-ins
 * visually — nothing is written or duplicated into either store.
 */
import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    mergedWeightSeries,
    sanitizeMeasurement,
    type BodyWeighIn,
    type MeasurementInput,
    type MeasurementLog,
    type WeightPoint,
} from '../utils/measurements';

/**
 * Post-integration slice (types.ts A + appContexts B + AppContext C).
 * Single bridge until AppContextType carries these fields, then this cast
 * dissolves into a plain useApp() destructure.
 */
interface MeasurementsSlice {
    measurementLogs: MeasurementLog[];
    setMeasurementLogs: (
        val: MeasurementLog[] | ((prev: MeasurementLog[]) => MeasurementLog[]),
    ) => void;
}

const sanitizeWeighIn = (raw: unknown): BodyWeighIn | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    if (
        (typeof r.id !== 'number' && typeof r.id !== 'string') ||
        typeof r.date !== 'number' ||
        !Number.isFinite(r.date) ||
        typeof r.weight !== 'number' ||
        !Number.isFinite(r.weight) ||
        r.weight <= 0
    ) {
        return null;
    }
    return { id: r.id, date: r.date, weight: r.weight };
};

const uniqueId = (prev: MeasurementLog[]): number => {
    let id = Date.now();
    while (prev.some((e) => e.id === id)) id += 1;
    return id;
};

const cleanAll = (list: MeasurementLog[]): MeasurementLog[] =>
    list.map(sanitizeMeasurement).filter((e): e is MeasurementLog => e !== null);

export interface MeasurementsStore {
    lang: 'es' | 'en';
    config: Record<string, unknown> | undefined;
    /** Newest first (same convention as bodyLogs). */
    entries: MeasurementLog[];
    /** Existing diary weigh-ins (bodyLogs), sanitized, for the weight chart. */
    bodyWeighIns: BodyWeighIn[];
    /** Visual merge for the weight chart (Strong parity, no store writes). */
    weightSeries: WeightPoint[];
    addEntry: (input: MeasurementInput) => void;
    updateEntry: (id: number, input: MeasurementInput) => void;
    deleteEntry: (id: number) => void;
}

export const useMeasurements = (): MeasurementsStore => {
    const { lang, config, bodyLogs } = useApp();
    const { measurementLogs, setMeasurementLogs } = useApp() as unknown as MeasurementsSlice;

    const entries = useMemo<MeasurementLog[]>(
        () => cleanAll(Array.isArray(measurementLogs) ? measurementLogs : []).sort((a, b) => b.date - a.date),
        [measurementLogs],
    );

    const bodyWeighIns = useMemo<BodyWeighIn[]>(
        () =>
            (Array.isArray(bodyLogs) ? bodyLogs : [])
                .map(sanitizeWeighIn)
                .filter((w): w is BodyWeighIn => w !== null),
        [bodyLogs],
    );

    const weightSeries = useMemo<WeightPoint[]>(
        () => mergedWeightSeries(entries, bodyWeighIns),
        [entries, bodyWeighIns],
    );

    const addEntry = useCallback(
        (input: MeasurementInput) => {
            setMeasurementLogs((prev) => [{ ...input, id: uniqueId(prev) }, ...cleanAll(prev)]);
        },
        [setMeasurementLogs],
    );

    const updateEntry = useCallback(
        (id: number, input: MeasurementInput) => {
            setMeasurementLogs((prev) =>
                cleanAll(prev).map((e) => (e.id === id ? { ...input, id } : e)),
            );
        },
        [setMeasurementLogs],
    );

    const deleteEntry = useCallback(
        (id: number) => {
            setMeasurementLogs((prev) => cleanAll(prev).filter((e) => e.id !== id));
        },
        [setMeasurementLogs],
    );

    return {
        lang,
        config: config as unknown as Record<string, unknown> | undefined,
        entries,
        bodyWeighIns,
        weightSeries,
        addEntry,
        updateEntry,
        deleteEntry,
    };
};
