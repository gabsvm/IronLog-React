import React from 'react';
import { useApp, useSyncStatus } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';
import { CsvImportSheet } from '../CsvImportSheet';
import { AutoBackupList } from '../AutoBackupList';
import { DriveBackupCard } from '../DriveBackupCard';
import { useStore } from '../../../lib/store';
import { resolveWeightUnit } from '../../../utils/units';
import { shareFileOrDownload } from '../../../utils/shareFile';
import { buildTrainingCsv } from '../../../services/trainingCsv';
import { useCsvImportFlow } from '../useCsvImportFlow';

interface DataSectionProps {
    onExport: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onForceSync: () => void;
    isSyncing: boolean;
    syncStatusText: string;
}

/** Q18: "Datos" section, moved verbatim from ProfileSheet; S3: CSV import flow in useCsvImportFlow. */
export const DataSection: React.FC<DataSectionProps> = ({
    onExport, onImportFile, onForceSync, isSyncing, syncStatusText,
}) => {
    const appState = useApp();
    const { lang, config, logs } = appState;
    const activeMeso = useStore((state) => state.activeMeso);
    const activeSession = useStore((state) => state.activeSession);
    const { isOnline } = useSyncStatus();
    const { user } = useAuth();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const { csvError, csvStatus, handleImportCsvFile, sheetProps } = useCsvImportFlow();

    // Q12: training CSV export (one row per completed set, chosen unit in header).
    // Deliberately does NOT stamp the backup reminder: this is a partial export.
    const handleExportCsv = () => {
        const unit = resolveWeightUnit(config);
        const csv = buildTrainingCsv(logs, unit);
        const filename = `gainslab_history_${new Date().toISOString().slice(0, 10)}.csv`;
        void shareFileOrDownload(csv, filename, 'text/csv');
    };

    return (
        <div id="profile-section-data">
            <div className="label-reference px-1 mb-1.5">{ty.data}</div>
            <div className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden">
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted">{ty.cloudStatus}</span>
                        {user && (
                            <span className={`font-semibold ${isOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                {isOnline ? ty.online : ty.offline}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--surface-elevated))] text-primary-500">
                            <Icon name="Cloud" size={17} />
                        </span>
                        <div className="min-w-0 flex-1 truncate text-xs text-muted">
                            {syncStatusText}
                        </div>
                    </div>
                    {user && (
                        <button
                            type="button"
                            onClick={onForceSync}
                            disabled={isSyncing}
                            className="gl-quiet mt-2 w-full text-xs"
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
                            className="gl-quiet min-h-[44px] text-center text-xs"
                            aria-label={t.export}
                        >
                            <Icon name="Download" size={14} /> {t.export}
                        </button>
                        <label className="gl-quiet min-h-[44px] cursor-pointer text-center text-xs">
                            <Icon name="Upload" size={14} /> {t.import}
                            <input type="file" onChange={onImportFile} accept=".json" className="hidden" />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="gl-quiet min-h-[44px] text-center text-xs"
                            aria-label={t.csv.exportBtn}
                        >
                            <Icon name="Download" size={14} /> {t.csv.exportBtn}
                        </button>
                        <label className="gl-quiet min-h-[44px] cursor-pointer text-center text-xs">
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
            <div className="mt-2">
                <DriveBackupCard
                    lang={lang}
                    getState={() => {
                        const {
                            program, exercises, userProfile, nutritionLogs, cardioSessions, bodyLogs, measurementLogs, macroGoals,
                            nutritionGoal, personalTemplates, customFoods, templateFolders, rpFeedback,
                        } = appState;
                        return {
                            program, exercises, logs, activeMeso, activeSession,
                            userProfile, nutritionLogs, cardioSessions, bodyLogs, measurementLogs, macroGoals, nutritionGoal,
                            personalTemplates, customFoods, templateFolders, rpFeedback, config,
                        };
                    }}
                />
            </div>

            {sheetProps && <CsvImportSheet {...sheetProps} />}
        </div>
    );
};
