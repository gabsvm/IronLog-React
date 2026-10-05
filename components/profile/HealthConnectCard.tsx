import React, { useCallback, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import type { BodyLog } from '../../types';
import {
    getHealthConnectPrefs,
    healthConnectApi,
    isHealthConnectPlatform,
    mergeHealthWeights,
    setHealthConnectPrefs,
    type HealthConnectApi,
    type HealthConnectStatus,
} from '../../utils/healthConnect';

interface HealthConnectCardProps {
    lang: keyof typeof TRANSLATIONS;
    bodyLogs: BodyLog[];
    setBodyLogs: (value: BodyLog[] | ((prev: BodyLog[]) => BodyLog[])) => void;
    /** Test seams; production uses the native bridge. */
    api?: HealthConnectApi;
    isPlatform?: () => boolean;
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

type ImportState = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; added: number } | { kind: 'failed' };

/** U9: Health Connect row (Android app only; renders nothing on web). */
export const HealthConnectCard: React.FC<HealthConnectCardProps> = ({
    lang,
    bodyLogs,
    setBodyLogs,
    api = healthConnectApi,
    isPlatform = isHealthConnectPlatform,
}) => {
    const t = TRANSLATIONS[lang].you;
    const native = isPlatform();
    const [status, setStatus] = useState<HealthConnectStatus | null>(null);
    const [granted, setGranted] = useState(false);
    const [denied, setDenied] = useState(false);
    const [exportWorkouts, setExportWorkouts] = useState(() => getHealthConnectPrefs().exportWorkouts);
    const [importState, setImportState] = useState<ImportState>({ kind: 'idle' });

    const refresh = useCallback(async () => {
        const next = await api.getStatus();
        setStatus(next.status);
        setGranted(next.granted);
    }, [api]);

    useEffect(() => {
        if (!native) return;
        void refresh();
        const onReturn = () => {
            if (document.visibilityState === 'visible') void refresh();
        };
        document.addEventListener('visibilitychange', onReturn);
        return () => document.removeEventListener('visibilitychange', onReturn);
    }, [native, refresh]);

    if (!native || status === null) return null;

    const connect = async () => {
        setDenied(false);
        try {
            const ok = await api.requestAccess();
            setGranted(ok);
            setDenied(!ok);
        } catch {
            setDenied(true);
        }
    };

    const importWeight = async () => {
        setImportState({ kind: 'busy' });
        try {
            const { lastWeightImportAt } = getHealthConnectPrefs();
            const since = lastWeightImportAt > 0 ? lastWeightImportAt - 24 * 60 * 60 * 1000 : Date.now() - YEAR_MS;
            const records = await api.readWeights(since);
            // Count against the rendered logs; the updater re-merges against the
            // latest state (React may run it later), so nothing is lost or doubled.
            const { added } = mergeHealthWeights(bodyLogs, records);
            if (added > 0) setBodyLogs((prev) => mergeHealthWeights(prev, records).merged);
            setHealthConnectPrefs({ lastWeightImportAt: Date.now() });
            setImportState({ kind: 'done', added });
        } catch {
            setImportState({ kind: 'failed' });
        }
    };

    const toggleExport = () => {
        const next = !exportWorkouts;
        setExportWorkouts(next);
        setHealthConnectPrefs({ exportWorkouts: next });
    };

    return (
        <div className="mt-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-3" data-testid="health-connect-card">
            <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-rose-500 shrink-0">
                    <Icon name="Heart" size={17} />
                </span>
                <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">{t.healthTitle}</div>
                    <p className="text-[11px] text-muted">{t.healthDesc}</p>
                </div>
            </div>

            {status === 'unsupported' && <p className="text-xs text-muted">{t.healthUnavailable}</p>}

            {status === 'update_required' && (
                <button type="button" onClick={() => void api.openApp()} className="w-full py-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-black">
                    {t.healthUpdate}
                </button>
            )}

            {status === 'available' && !granted && (
                <>
                    <button type="button" onClick={() => void connect()} className="w-full py-2.5 rounded-xl bg-primary-500 text-black text-xs font-black">
                        {t.healthConnect}
                    </button>
                    {denied && <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{t.healthDenied}</p>}
                </>
            )}

            {status === 'available' && granted && (
                <>
                    <button
                        type="button"
                        onClick={() => void importWeight()}
                        disabled={importState.kind === 'busy'}
                        className="w-full py-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-black disabled:opacity-60"
                    >
                        {importState.kind === 'busy' ? t.healthImporting : t.healthImportWeight}
                    </button>
                    {importState.kind === 'done' && (
                        <p role="status" className="text-xs text-muted">
                            {importState.added > 0 ? t.healthImported.replace('{n}', String(importState.added)) : t.healthNothingNew}
                        </p>
                    )}
                    {importState.kind === 'failed' && <p role="alert" className="text-xs text-red-500">{t.healthImportFailed}</p>}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{t.healthExportWorkouts}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={exportWorkouts}
                            aria-label={t.healthExportWorkouts}
                            onClick={toggleExport}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${exportWorkouts ? 'bg-primary-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${exportWorkouts ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
