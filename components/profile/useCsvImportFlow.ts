import type React from 'react';
import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { resolveWeightUnit } from '../../utils/units';
import {
    addImportKeys,
    buildImportLogs,
    matchParsedExerciseNames,
    parseTrainingCsv,
    readImportKeys,
    splitFreshSessions,
} from '../../services/trainingCsv';
import type { ExerciseMappingDecision, ParsedCsvImport } from '../../services/trainingCsv';
import type { WeightUnit } from '../../types';

/**
 * S3: the CSV import flow (parse → preview → mapping → confirm), moved
 * verbatim from DataSection so Perfil → Datos and files shared to the PWA
 * (share_target / file_handlers) run the exact same import.
 */
export const useCsvImportFlow = (options: { onImported?: (count: number) => void } = {}) => {
    const { lang, config, logs, setLogs, exercises, setExercises } = useApp();
    const t = TRANSLATIONS[lang];

    const [csvRaw, setCsvRaw] = useState<string | null>(null);
    const [csvParsed, setCsvParsed] = useState<ParsedCsvImport | null>(null);
    const [csvStrongUnit, setCsvStrongUnit] = useState<WeightUnit>('kg');
    const [csvError, setCsvError] = useState<string | null>(null);
    const [csvStatus, setCsvStatus] = useState<string | null>(null);
    const [csvKnownKeys, setCsvKnownKeys] = useState<ReadonlySet<string>>(new Set());

    const openCsvImport = (text: string, strongUnit: WeightUnit) => {
        try {
            const parsed = parseTrainingCsv(text, strongUnit);
            setCsvRaw(text);
            setCsvParsed(parsed);
            setCsvError(null);
            setCsvStatus(null);
            void readImportKeys().then((stored) => {
                const fromLogs = (logs || []).map((l: any) => l?.importKey).filter(Boolean);
                setCsvKnownKeys(new Set([...stored, ...fromLogs]));
            });
        } catch (err: any) {
            setCsvRaw(null);
            setCsvParsed(null);
            setCsvError(
                err?.message === 'empty' ? t.csv.errorEmpty
                : err?.message === 'unknown-format' ? t.csv.errorUnknown
                : t.csv.errorRead
            );
        }
    };

    /** Starts the flow from raw text with the user's current unit. */
    const openCsvText = (text: string) => {
        const unit = resolveWeightUnit(config);
        setCsvStrongUnit(unit);
        openCsvImport(text, unit);
    };

    const handleImportCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const unit = resolveWeightUnit(config);
        setCsvStrongUnit(unit);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                openCsvImport(String(reader.result ?? ''), unit);
            } catch {
                setCsvError(t.csv.errorRead);
            }
        };
        reader.onerror = () => setCsvError(t.csv.errorRead);
        reader.readAsText(file);
    };

    const handleStrongUnitChange = (unit: WeightUnit) => {
        setCsvStrongUnit(unit);
        if (csvRaw) {
            try {
                setCsvParsed(parseTrainingCsv(csvRaw, unit));
            } catch {
                // csvRaw already parsed once; re-parse cannot fail.
            }
        }
    };

    const csvFresh = useMemo(
        () => (csvParsed ? splitFreshSessions(csvParsed.sessions, csvKnownKeys) : { fresh: [], skippedCount: 0 }),
        [csvParsed, csvKnownKeys]
    );

    const csvMatches = useMemo(() => {
        const names: string[] = [];
        for (const session of csvFresh.fresh) {
            for (const ex of session.exercises) {
                if (!names.includes(ex.name)) names.push(ex.name);
            }
        }
        return matchParsedExerciseNames(names, exercises || []);
    }, [csvFresh, exercises]);

    const closeCsvImport = () => {
        setCsvRaw(null);
        setCsvParsed(null);
    };

    const confirmCsvImport = (mapping: Record<string, ExerciseMappingDecision>) => {
        if (!csvParsed || csvFresh.fresh.length === 0) return;
        const { logs: newLogs, newExercises } = buildImportLogs(csvFresh.fresh, mapping, exercises || []);
        setLogs((prev) => [...prev, ...newLogs]);
        if (newExercises.length > 0) setExercises((prev) => [...prev, ...newExercises]);
        void addImportKeys(newLogs.map((l) => l.importKey).filter(Boolean) as string[]);
        setCsvKnownKeys((prev) => new Set([...prev, ...newLogs.map((l) => l.importKey).filter(Boolean) as string[]]));
        setCsvStatus(t.csv.importedOk.replace('{n}', String(newLogs.length)));
        closeCsvImport();
        options.onImported?.(newLogs.length);
    };

    const sheetProps = csvParsed
        ? {
            open: true,
            onClose: closeCsvImport,
            parsed: csvParsed,
            fresh: csvFresh.fresh,
            skippedCount: csvFresh.skippedCount,
            matches: csvMatches,
            library: exercises || [],
            lang,
            strongUnit: csvStrongUnit,
            onStrongUnitChange: handleStrongUnitChange,
            onConfirm: confirmCsvImport,
        }
        : null;

    const clearMessages = () => {
        setCsvError(null);
        setCsvStatus(null);
    };

    return { csvError, setCsvError, csvStatus, clearMessages, handleImportCsvFile, openCsvText, sheetProps };
};
