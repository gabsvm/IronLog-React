import React, { useMemo, useState } from 'react';
import { useApp, useSyncStatus } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';
import { CsvImportSheet } from '../CsvImportSheet';
import { AutoBackupList } from '../AutoBackupList';
import { resolveWeightUnit } from '../../../utils/units';
import { shareFileOrDownload } from '../../../utils/shareFile';
import {
    addImportKeys,
    buildImportLogs,
    buildTrainingCsv,
    matchParsedExerciseNames,
    parseTrainingCsv,
    readImportKeys,
    splitFreshSessions,
} from '../../../services/trainingCsv';
import type { ExerciseMappingDecision, ParsedCsvImport } from '../../../services/trainingCsv';
import type { WeightUnit } from '../../../types';

interface DataSectionProps {
    onExport: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onForceSync: () => void;
    isSyncing: boolean;
    syncStatusText: string;
}

/** Q18: "Datos" section, moved verbatim from ProfileSheet (CSV logic included). */
export const DataSection: React.FC<DataSectionProps> = ({
    onExport, onImportFile, onForceSync, isSyncing, syncStatusText,
}) => {
    const { lang, config, logs, setLogs, exercises, setExercises } = useApp();
    const { isOnline } = useSyncStatus();
    const { user } = useAuth();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [csvRaw, setCsvRaw] = useState<string | null>(null);
    const [csvParsed, setCsvParsed] = useState<ParsedCsvImport | null>(null);
    const [csvStrongUnit, setCsvStrongUnit] = useState<WeightUnit>('kg');
    const [csvError, setCsvError] = useState<string | null>(null);
    const [csvStatus, setCsvStatus] = useState<string | null>(null);
    const [csvKnownKeys, setCsvKnownKeys] = useState<ReadonlySet<string>>(new Set());

    // Q12: training CSV export (one row per completed set, chosen unit in header).
    // Deliberately does NOT stamp the backup reminder: this is a partial export.
    const handleExportCsv = () => {
        const unit = resolveWeightUnit(config);
        const csv = buildTrainingCsv(logs, unit);
        const filename = `gainslab_history_${new Date().toISOString().slice(0, 10)}.csv`;
        void shareFileOrDownload(csv, filename, 'text/csv');
    };

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
    };

    return (
        <div id="profile-section-data">
            <div className="label-reference px-1 mb-1.5">{ty.data}</div>
            <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-500">{ty.cloudStatus}</span>
                        <span className={`font-black uppercase ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>
                            {isOnline ? ty.online : ty.offline}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                            <Icon name="Cloud" size={17} />
                        </span>
                        <div className="flex-1 min-w-0 text-xs text-muted truncate">
                            {syncStatusText}
                        </div>
                    </div>
                    {user && (
                        <button
                            type="button"
                            onClick={onForceSync}
                            disabled={isSyncing}
                            className="w-full mt-2 py-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-primary-500/20 active:scale-98 transition-transform"
                        >
                            <Icon name="RefreshCw" size={14} className={isSyncing ? "animate-spin" : ""} />
                            {isSyncing ? ty.syncing : ty.syncNow}
                        </button>
                    )}
                </div>
                <div className="p-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={onExport}
                            className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            aria-label={t.export}
                        >
                            <Icon name="Download" size={14} /> {t.export}
                        </button>
                        <label className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer text-center flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                            <Icon name="Upload" size={14} /> {t.import}
                            <input type="file" onChange={onImportFile} accept=".json" className="hidden" />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            aria-label={t.csv.exportBtn}
                        >
                            <Icon name="Download" size={14} /> {t.csv.exportBtn}
                        </button>
                        <label className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer text-center flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                            <Icon name="Upload" size={14} /> {t.csv.importBtn}
                            <input type="file" onChange={handleImportCsvFile} accept=".csv,text/csv" className="hidden" />
                        </label>
                    </div>
                    {csvError && (
                        <p role="alert" className="mt-2 text-xs font-bold text-red-500">{csvError}</p>
                    )}
                    {csvStatus && !csvError && (
                        <p role="status" className="mt-2 text-xs font-bold text-emerald-500">{csvStatus}</p>
                    )}
                </div>
            </div>
            <div className="mt-2">
                <AutoBackupList lang={lang} />
            </div>

            {csvParsed && (
                <CsvImportSheet
                    open={csvParsed !== null}
                    onClose={closeCsvImport}
                    parsed={csvParsed}
                    fresh={csvFresh.fresh}
                    skippedCount={csvFresh.skippedCount}
                    matches={csvMatches}
                    library={exercises || []}
                    lang={lang}
                    strongUnit={csvStrongUnit}
                    onStrongUnitChange={handleStrongUnitChange}
                    onConfirm={confirmCsvImport}
                />
            )}
        </div>
    );
};
