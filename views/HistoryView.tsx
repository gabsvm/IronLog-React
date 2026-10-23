import React, { memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useApp, useAppPreferences, useAppConfig, useTutorial } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { formatDate, formatDurationShort, getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { usePro } from '../hooks/usePro';
import { useStore } from '../lib/store';
import { Log, WeightUnit } from '../types';
import { formatWeight, resolveWeightUnit, unitLabel } from '../utils/units';
import { buildUndoLog } from '../utils/historyEdit';
import { uid } from '../utils';
import { buildTrainingCsv } from '../services/trainingCsv';
import { shareFileOrDownload } from '../utils/shareFile';
import { todayLocalDateKey } from '../utils/localDate';
import { pickLang } from '../utils/i18n';

const HistoryDetailView = React.lazy(() => import('./history/HistoryDetailView').then(m => ({ default: m.HistoryDetailView })));
const TutorialOverlay = React.lazy(() => import('../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));
const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface HistoryVirtuosoContext {
    lang: 'en' | 'es';
    search: string;
    setSearch: (s: string) => void;
    hasLockedLogs: boolean;
    checkPro: (feature: string) => boolean;
    onExportCSV?: () => void;
    isPro?: boolean;
}

const VirtuosoHeader = ({ context }: { context?: HistoryVirtuosoContext }) => {
    if (!context) return null;
    const { lang, search, setSearch, onExportCSV, isPro } = context;
    return (
        <div className="px-4 pb-3 pt-3">
            {/* The Sessions tab already names this list; the heading stays for assistive tech. */}
            <h2 className="sr-only">{TRANSLATIONS[lang].copy.history.history}</h2>
            <div className="flex items-center gap-2">
            <div id="tut-history-search" className="relative min-w-0 flex-1">
                <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    placeholder={TRANSLATIONS[lang].copy.history.searchWorkouts}
                    className="min-h-[44px] w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] py-2.5 pl-10 pr-4 text-base text-[rgb(var(--text-primary))] outline-none placeholder-zinc-500 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
                {onExportCSV && (
                    <button
                        type="button"
                        onClick={onExportCSV}
                        className="gl-quiet shrink-0 gap-1.5 !px-3.5"
                        aria-label={pickLang(lang, { es: 'Descargar CSV', en: 'Download CSV' })}
                    >
                        <Icon name="Download" size={13} />
                        <span>CSV</span>
                        {!isPro && <Icon name="Lock" size={10} className="text-yellow-500" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const VirtuosoFooter = ({ context }: { context?: HistoryVirtuosoContext }) => {
    if (!context || !context.hasLockedLogs) return <div className="h-24" />;
    return (
        <div className="px-4 pb-28 pt-4">
            {/* Same compact unlock row as ProLock; the gate itself is unchanged. */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[rgb(var(--border-subtle))] px-3 py-2">
                <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted">
                    <Icon name="Lock" size={16} className="shrink-0" />
                    {pickLang(context.lang, { es: 'Historial bloqueado', en: 'History locked' })}
                </span>
                <button type="button" onClick={() => context.checkPro('history')} className="gl-quiet shrink-0">
                    {pickLang(context.lang, { es: 'Desbloquear PRO', en: 'Unlock PRO' })}
                </button>
            </div>
        </div>
    );
};

const VIRTUOSO_COMPONENTS = { Header: VirtuosoHeader, Footer: VirtuosoFooter };

interface HistoryCardProps {
    log: Log;
    lang: 'en' | 'es';
    id?: string;
    onOpen: () => void;
    unit?: WeightUnit;
}

const HistoryCard = memo(({ log, lang, id, onOpen, unit = 'kg' }: HistoryCardProps) => {
    const previews = useMemo(() => (log.exercises || []).map(ex => {
        const completed = (ex.sets || []).filter(set => set.completed && set.type !== 'avt_hop' && !set.skipped);
        if (!completed.length) return null;
        if (ex.muscle === 'CARDIO') {
            const distance = completed.reduce((sum, set) => sum + Number(set.distance || 0), 0);
            return { name: getTranslated(ex.name, lang), value: distance > 0 ? `${distance.toFixed(1)} km` : `${completed.length} ${pickLang(lang, { es: 'series', en: 'sets' })}` };
        }
        const best = completed.reduce((current, set) => Number(set.weight || 0) > Number(current.weight || 0) ? set : current, completed[0]);
        return { name: getTranslated(ex.name, lang), value: `${formatWeight(Number(best.weight || 0), unit, lang)} ${unitLabel(unit).toLowerCase()} × ${best.reps || 0}` };
    }).filter(Boolean), [log.exercises, lang, unit]);

    return (
        <button
            id={id}
            type="button"
            onClick={onOpen}
            className="premium-theme-panel premium-history-row mx-4 mb-3 block w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] min-w-0 box-border p-4 text-left"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs font-semibold tracking-normal text-muted">{formatDate(log.endTime, lang)}</div>
                    <h3 className="truncate text-base font-semibold tracking-tight text-[rgb(var(--text-primary))]">{log.name}</h3>
                    {log.programSystem && <span className="mt-1 inline-flex rounded-full bg-primary-500/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-300">KONG · B{log.programSystem.blockNumber} · W{log.week}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-muted">
                    {formatDurationShort(log.duration)}
                    <Icon name="ChevronRight" size={16} />
                </div>
            </div>

            <div className="mt-3 space-y-1.5">
                {previews.slice(0, 3).map((preview: any) => (
                    <div key={preview.name} className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 flex-1 truncate text-zinc-500">{preview.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-[rgb(var(--text-primary))]">{preview.value}</span>
                    </div>
                ))}
                {previews.length > 3 && <div className="text-xs text-muted">+{previews.length - 3}</div>}
            </div>
        </button>
    );
});

export const HistoryView: React.FC<{ search: string; onSearchChange: (search: string) => void }> = ({ search, onSearchChange: setSearch }) => {
    const { logs, setLogs } = useApp();
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const { tutorialProgress, markTutorialSeen } = useTutorial();
    const unit = resolveWeightUnit(config);
    const activeSession = useStore(state => state.activeSession);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const { isPro, showPaywall, setShowPaywall, checkPro } = usePro();
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
    const [deletedLogBackup, setDeletedLogBackup] = useState<{ log: Log; index: number } | null>(null);
    const [editBackup, setEditBackup] = useState<{ original: Log; edited: Log } | null>(null);
    const deferredSearch = useDeferredValue(search);

    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    useEffect(() => {
        if (!editBackup) return;
        const timer = window.setTimeout(() => setEditBackup(null), 8000);
        return () => window.clearTimeout(timer);
    }, [editBackup]);

    // A saved edit replaces the log in place (same id) and always carries a newer
    // updatedAt than the previous version, so cloud sync (last-writer-wins) keeps it.
    const handleSaveEdit = useCallback((original: Log, edited: Log) => {
        setLogs(prev => prev.map(log => (log.id === original.id ? edited : log)));
        setEditBackup({ original, edited });
    }, [setLogs]);

    const handleUndoEdit = useCallback(() => {
        if (!editBackup) return;
        const { original, edited } = editBackup;
        setLogs(prev => prev.map(log => (log.id === original.id ? buildUndoLog(original, edited, Date.now()) : log)));
        setEditBackup(null);
    }, [editBackup, setLogs]);

    const selectedLog = useMemo(() => safeLogs.find(log => log.id === selectedLogId) || null, [safeLogs, selectedLogId]);

    useEffect(() => {
        if (!deletedLogBackup) return;
        const timer = window.setTimeout(() => setDeletedLogBackup(null), 5500);
        return () => window.clearTimeout(timer);
    }, [deletedLogBackup]);

    const [isDetailDirty, setIsDetailDirty] = useState(false);

    useEffect(() => {
        const onPop = (event: PopStateEvent) => {
            if (isDetailDirty) return;
            if (!event.state?.historyDetail) setSelectedLogId(null);
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [isDetailDirty]);

    const { visibleLogs, hasLockedLogs } = useMemo(() => {
        // Imports and cloud restores don't guarantee order, so sort newest first here.
        let result = [...safeLogs].sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));
        if (deferredSearch.trim()) {
            const q = deferredSearch.trim().toLowerCase();
            result = result.filter(log =>
                String(log.name || '').toLowerCase().includes(q) ||
                (log.exercises || []).some(ex => getTranslated(ex.name, lang).toLowerCase().includes(q))
            );
        }
        if (isPro) return { visibleLogs: result, hasLockedLogs: false };
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const visible = result.filter(log => now - log.endTime < sevenDays);
        return { visibleLogs: visible, hasLockedLogs: visible.length !== result.length };
    }, [safeLogs, deferredSearch, isPro, lang]);

    const openDetail = useCallback((log: Log) => {
        try {
            window.history.pushState({ ...(window.history.state || {}), historyDetail: log.id }, '', '#history-detail');
        } catch { }
        setSelectedLogId(log.id);
    }, []);

    const closeDetail = useCallback(() => {
        try {
            if (window.history.state?.historyDetail) {
                window.history.back();
                return;
            }
        } catch { }
        setSelectedLogId(null);
    }, []);

    const repeatWorkout = useCallback((log: Log) => {
        if (activeSession) return;
        const now = Date.now();
        const repeated = {
            ...log,
            id: now,
            startTime: now,
            endTime: undefined,
            duration: undefined,
            dayIdx: -1,
            mesoId: -1,
            week: -1,
            name: log.name,
            exercises: (log.exercises || []).map((exercise: any) => ({
                ...exercise,
                instanceId: uid(),
                sets: (exercise.sets || []).map((set: any) => ({
                    ...set,
                    id: uid(),
                    completed: false,
                    skipped: false,
                    rpe: '',
                })),
            })),
        };
        setActiveSession(repeated as any);
        setSelectedLogId(null);
        try {
            window.history.replaceState({ ...(window.history.state || {}), historyDetail: undefined }, '', '#history');
        } catch { }
        window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'workout' } }));
    }, [activeSession, setActiveSession]);

    const handleExportCSV = useCallback(async () => {
        if (!checkPro('csv_export')) return;
        const csv = buildTrainingCsv(safeLogs, resolveWeightUnit(config));
        const filename = `gainslab_history_${todayLocalDateKey()}.csv`;
        await shareFileOrDownload(csv, filename, 'text/csv');
    }, [checkPro, config, safeLogs]);

    const historyTutorialSteps = [
        { targetId: 'tut-history-search', title: t.tutorial.history[1].title, text: t.tutorial.history[1].text, position: 'bottom' as const },
        { targetId: 'tut-first-card', title: t.tutorial.history[0].title, text: t.tutorial.history[0].text, position: 'bottom' as const },
    ];

    const context = useMemo<HistoryVirtuosoContext>(
        () => ({ lang, search, setSearch, hasLockedLogs, checkPro, onExportCSV: handleExportCSV, isPro }),
        [lang, search, setSearch, hasLockedLogs, checkPro, handleExportCSV, isPro]
    );
    const renderItem = useCallback((index: number, log: Log) => (
        <HistoryCard id={index === 0 ? 'tut-first-card' : undefined} log={log} lang={lang} onOpen={() => openDetail(log)} unit={unit} />
    ), [lang, openDetail, unit]);

    if (!safeLogs.length) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--surface-app))] p-8 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--surface-raised))] text-zinc-500"><Icon name="Dumbbell" size={34} /></div>
                <h3 className="mb-2 text-xl font-black text-zinc-950 dark:text-white">{TRANSLATIONS[lang].copy.history.noWorkoutsYet}</h3>
                <p className="mb-5 max-w-[230px] text-sm leading-relaxed text-zinc-500">{TRANSLATIONS[lang].copy.history.completeYourFirstSession}</p>
                <Button
                    onClick={() => window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'home' } }))}
                    className="min-h-11 rounded-full px-6 font-bold"
                >
                    {pickLang(lang, { es: 'Ir a entrenar', en: 'Go to training' })}
                </Button>
            </div>
        );
    }

    return (
        <div className="relative flex h-full w-full flex-col bg-[rgb(var(--surface-app))]">
            <Virtuoso style={{ height: '100%' }} data={visibleLogs} components={VIRTUOSO_COMPONENTS} context={context} itemContent={renderItem} />

            <Suspense fallback={null}>
                <TutorialOverlay steps={historyTutorialSteps} isActive={!tutorialProgress.history} onComplete={() => markTutorialSeen('history')} />
            </Suspense>

            {selectedLog && (
                <Suspense fallback={null}>
                    <HistoryDetailView
                        log={selectedLog}
                        lang={lang}
                        unit={unit}
                        onBack={closeDetail}
                        onRepeat={() => repeatWorkout(selectedLog)}
                        onDelete={() => setDeletingLogId(selectedLog.id)}
                        onSaveEdit={handleSaveEdit}
                        repeatBlocked={!!activeSession}
                        onDirtyChange={setIsDetailDirty}
                    />
                </Suspense>
            )}

            {showPaywall && <Suspense fallback={null}><PaywallModal onClose={() => setShowPaywall(false)} feature="history" /></Suspense>}

            {deletingLogId !== null && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={TRANSLATIONS[lang].copy.history.deleteWorkout}
                        description={TRANSLATIONS[lang].copy.history.thisWorkoutWillBe}
                        confirmText={TRANSLATIONS[lang].copy.history.delete}
                        cancelText={t.cancel}
                        onConfirm={() => {
                            const idx = safeLogs.findIndex(l => l.id === deletingLogId);
                            const logToDelete = safeLogs[idx];
                            if (logToDelete) {
                                setDeletedLogBackup({ log: logToDelete, index: idx });
                            }
                            setLogs(prev => prev.filter(log => log.id !== deletingLogId));
                            setDeletingLogId(null);
                            setSelectedLogId(null);
                            try { window.history.replaceState({ ...(window.history.state || {}), historyDetail: undefined }, '', '#history'); } catch { }
                        }}
                        onCancel={() => setDeletingLogId(null)}
                        variant="danger"
                    />
                </Suspense>
            )}

            {editBackup && !deletedLogBackup && (
                <div role="status" className="fixed bottom-24 left-4 right-4 z-[80] flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-700/80 px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
                    <span className="text-xs font-semibold text-white">
                        {TRANSLATIONS[lang].copy.history.workoutUpdated}
                    </span>
                    <button
                        onClick={handleUndoEdit}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary-400 hover:text-primary-300 active:scale-95 transition-transform"
                    >
                        <Icon name="RotateCcw" size={14} />
                        <span>{TRANSLATIONS[lang].copy.history.undo}</span>
                    </button>
                </div>
            )}

            {deletedLogBackup && (
                <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-700/80 px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
                    <span className="text-xs font-semibold text-white">
                        {TRANSLATIONS[lang].copy.history.workoutDeleted}
                    </span>
                    <button
                        onClick={() => {
                            setLogs(prev => {
                                const next = [...prev];
                                next.splice(deletedLogBackup.index, 0, deletedLogBackup.log);
                                return next;
                            });
                            setDeletedLogBackup(null);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary-400 hover:text-primary-300 active:scale-95 transition-transform"
                    >
                        <Icon name="RotateCcw" size={14} />
                        <span>{TRANSLATIONS[lang].copy.history.undo}</span>
                    </button>
                </div>
            )}
        </div>
    );
};
