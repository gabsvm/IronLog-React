import React, { memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { formatDate, formatHoursMinutes, getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { usePro } from '../hooks/usePro';
import { useStore } from '../lib/store';
import { Log } from '../types';
import { HistoryDetailView } from './history/HistoryDetailView';

const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface HistoryVirtuosoContext {
    lang: 'en' | 'es';
    search: string;
    setSearch: (s: string) => void;
    hasLockedLogs: boolean;
    checkPro: (feature: string) => boolean;
}

const VirtuosoHeader = ({ context }: { context?: HistoryVirtuosoContext }) => {
    if (!context) return null;
    const { lang, search, setSearch } = context;
    return (
        <div className="space-y-3 px-5 pb-4 pt-4">
            <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{lang === 'en' ? 'History' : 'Historial'}</h2>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    {lang === 'es' ? 'Tus entrenamientos completados' : 'Your completed workouts'}
                </p>
            </div>
            <div id="tut-history-search" className="relative">
                <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    placeholder={lang === 'en' ? 'Search workouts...' : 'Buscar entrenamientos...'}
                    className="w-full rounded-2xl border border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-raised)/0.8)] py-3 pl-10 pr-4 text-sm font-medium text-zinc-950 outline-none placeholder-zinc-500 transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>
    );
};

const VirtuosoFooter = ({ context }: { context?: HistoryVirtuosoContext }) => {
    if (!context || !context.hasLockedLogs) return <div className="h-24" />;
    return (
        <div className="px-4 pb-28 pt-4">
            <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.7)] p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-zinc-400 dark:bg-zinc-800">
                    <Icon name="Lock" size={24} />
                </div>
                <h4 className="mb-2 font-bold text-zinc-900 dark:text-white">History Locked</h4>
                <p className="mx-auto mb-6 max-w-[220px] text-xs text-zinc-500">Older workouts are archived. Unlock Premium to access your full training history.</p>
                <Button size="sm" onClick={() => context.checkPro('history')} className="mx-auto bg-zinc-900 text-white dark:bg-white dark:text-black">Unlock PRO</Button>
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
}

const HistoryCard = memo(({ log, lang, id, onOpen }: HistoryCardProps) => {
    const previews = useMemo(() => (log.exercises || []).map(ex => {
        const completed = (ex.sets || []).filter(set => set.completed && set.type !== 'avt_hop' && !set.skipped);
        if (!completed.length) return null;
        if (ex.muscle === 'CARDIO') {
            const distance = completed.reduce((sum, set) => sum + Number(set.distance || 0), 0);
            return { name: getTranslated(ex.name, lang), value: distance > 0 ? `${distance.toFixed(1)} km` : `${completed.length} sets` };
        }
        const best = completed.reduce((current, set) => Number(set.weight || 0) > Number(current.weight || 0) ? set : current, completed[0]);
        return { name: getTranslated(ex.name, lang), value: `${best.weight || 0} kg × ${best.reps || 0}` };
    }).filter(Boolean), [log.exercises, lang]);

    return (
        <button
            id={id}
            type="button"
            onClick={onOpen}
            className="mx-4 mb-3 block w-[calc(100%-2rem)] rounded-[1.3rem] border border-[rgb(var(--border-subtle)/0.72)] bg-[rgb(var(--surface-raised)/0.72)] p-4 text-left shadow-sm transition-all active:scale-[0.99] active:bg-[rgb(var(--surface-raised))]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">{formatDate(log.endTime, lang)}</div>
                    <h3 className="truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">{log.name}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500 dark:bg-white/5">
                    <Icon name="Clock" size={11} />
                    {formatHoursMinutes(log.duration)}
                </div>
            </div>

            <div className="mt-3 space-y-1.5">
                {previews.slice(0, 3).map((preview: any) => (
                    <div key={preview.name} className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 flex-1 truncate text-zinc-500">{preview.name}</span>
                        <span className="shrink-0 font-mono font-bold text-zinc-700 dark:text-zinc-300">{preview.value}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--border-subtle)/0.45)] pt-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {(log.exercises || []).length} {lang === 'es' ? 'ejercicios' : 'exercises'}
                </span>
                <Icon name="ChevronRight" size={16} className="text-zinc-400" />
            </div>
        </button>
    );
});

export const HistoryView: React.FC = () => {
    const { logs, setLogs, lang, tutorialProgress, markTutorialSeen } = useApp();
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const { isPro, showPaywall, setShowPaywall, checkPro } = usePro();
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const selectedLog = useMemo(() => safeLogs.find(log => log.id === selectedLogId) || null, [safeLogs, selectedLogId]);

    useEffect(() => {
        const onPop = (event: PopStateEvent) => {
            if (!event.state?.historyDetail) setSelectedLogId(null);
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const { visibleLogs, hasLockedLogs } = useMemo(() => {
        let result = safeLogs;
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
                instanceId: now + Math.random(),
                sets: (exercise.sets || []).map((set: any, index: number) => ({
                    ...set,
                    id: now + index + Math.floor(Math.random() * 10000),
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
    }, [setActiveSession]);

    const handleExportCSV = useCallback(() => {
        if (!checkPro('csv_export')) return;
        const rows = [['Date', 'Session', 'Exercise', 'Muscle', 'Set', 'Type', 'Weight(kg)', 'Reps', 'RPE', 'Completed'].join(',')];
        safeLogs.forEach(log => {
            if (log.skipped) return;
            const date = new Date(log.startTime).toLocaleDateString('en-CA');
            (log.exercises || []).forEach(ex => {
                const exName = getTranslated(ex.name, lang).replace(/,/g, ';');
                (ex.sets || []).forEach((set, index) => rows.push([
                    date, String(log.name || '').replace(/,/g, ';'), exName, ex.muscle, index + 1,
                    set.type, set.weight || '', set.reps || '', set.rpe || '', set.completed ? '1' : '0'
                ].join(',')));
            });
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `gainslab_history_${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }, [checkPro, lang, safeLogs]);

    const historyTutorialSteps = [
        { targetId: 'tut-history-search', title: t.tutorial.history[1].title, text: t.tutorial.history[1].text, position: 'bottom' as const },
        { targetId: 'tut-first-card', title: t.tutorial.history[0].title, text: t.tutorial.history[0].text, position: 'bottom' as const },
    ];

    const context = useMemo<HistoryVirtuosoContext>(() => ({ lang, search, setSearch, hasLockedLogs, checkPro }), [lang, search, hasLockedLogs, checkPro]);
    const renderItem = useCallback((index: number, log: Log) => (
        <HistoryCard id={index === 0 ? 'tut-first-card' : undefined} log={log} lang={lang} onOpen={() => openDetail(log)} />
    ), [lang, openDetail]);

    if (!safeLogs.length) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--surface-app))] p-8 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--surface-raised))] text-zinc-500"><Icon name="Dumbbell" size={34} /></div>
                <h3 className="mb-2 text-xl font-black text-zinc-950 dark:text-white">{lang === 'en' ? 'No workouts yet' : 'Sin entrenamientos aún'}</h3>
                <p className="max-w-[230px] text-sm leading-relaxed text-zinc-500">{lang === 'en' ? 'Complete your first session to see it here.' : 'Completa tu primera sesión para verla aquí.'}</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-full w-full flex-col bg-[rgb(var(--surface-app))]">
            <Virtuoso style={{ height: '100%' }} data={visibleLogs} components={VIRTUOSO_COMPONENTS} context={context} itemContent={renderItem} />

            <button
                type="button"
                onClick={handleExportCSV}
                className="absolute bottom-24 right-4 flex items-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.95)] px-4 py-2.5 text-xs font-bold text-zinc-600 shadow-xl transition-transform active:scale-95 dark:text-zinc-300"
                aria-label="Download CSV"
            >
                <Icon name="Download" size={14} /> CSV {!isPro && <Icon name="Lock" size={11} className="text-yellow-500" />}
            </button>

            <TutorialOverlay steps={historyTutorialSteps} isActive={!tutorialProgress.history} onComplete={() => markTutorialSeen('history')} />

            {selectedLog && (
                <HistoryDetailView
                    log={selectedLog}
                    lang={lang}
                    onBack={closeDetail}
                    onRepeat={() => repeatWorkout(selectedLog)}
                    onDelete={() => setDeletingLogId(selectedLog.id)}
                />
            )}

            {showPaywall && <Suspense fallback={null}><PaywallModal onClose={() => setShowPaywall(false)} feature="history" /></Suspense>}

            {deletingLogId !== null && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={lang === 'en' ? 'Delete Workout?' : '¿Eliminar Entrenamiento?'}
                        description={lang === 'en' ? 'This workout will be permanently deleted. This cannot be undone.' : 'Este entrenamiento se eliminará permanentemente. No se puede deshacer.'}
                        confirmText={lang === 'en' ? 'Delete' : 'Eliminar'}
                        cancelText={t.cancel}
                        onConfirm={() => {
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
        </div>
    );
};
