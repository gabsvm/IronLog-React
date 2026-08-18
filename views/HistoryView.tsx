import React, { memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { formatDate, formatHoursMinutes, getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { HistoryCalendar } from '../components/history/HistoryCalendar';
import { usePro } from '../hooks/usePro';
import { useStore } from '../lib/store';
import { Log } from '../types';
import { HistoryDetailView } from './history/HistoryDetailView';

const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

const localDateKey = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

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
        if (ex.isIsometric) {
            const hold = Math.max(...completed.map(set => Number(set.duration || 0)), 0);
            return { name: getTranslated(ex.name, lang), value: `${hold}s` };
        }
        const best = completed.reduce((current, set) => Number(set.weight || 0) * Math.max(1, Number(set.reps || 0)) > Number(current.weight || 0) * Math.max(1, Number(current.reps || 0)) ? set : current, completed[0]);
        return { name: getTranslated(ex.name, lang), value: ex.isBodyweight ? `${best.reps || 0} reps${Number(best.weight || 0) > 0 ? ` +${best.weight}kg` : ''}` : `${best.weight || 0} kg × ${best.reps || 0}` };
    }).filter(Boolean), [log.exercises, lang]);

    return (
        <button id={id} type="button" onClick={onOpen} className="mx-4 mb-2.5 block w-[calc(100%-2rem)] rounded-2xl border border-[rgb(var(--border-subtle)/0.72)] bg-[rgb(var(--surface-raised)/0.62)] p-4 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{formatDate(log.endTime, lang)}</div>
                    <h3 className="truncate text-base font-black tracking-tight text-[rgb(var(--text-primary))]">{log.name}</h3>
                    {log.programSystem && <span className="mt-1 inline-flex rounded-lg bg-primary-500/10 px-2 py-0.5 text-[9px] font-black text-primary-500">KONG · B{log.programSystem.blockNumber} · W{log.week}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-[10px] font-bold text-[rgb(var(--text-muted))]"><Icon name="Clock" size={11} />{formatHoursMinutes(log.duration)}</div>
            </div>

            <div className="mt-3 space-y-1.5">
                {previews.slice(0, 3).map((preview: any) => <div key={preview.name} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 flex-1 truncate text-[rgb(var(--text-muted))]">{preview.name}</span><span className="shrink-0 font-mono font-bold text-[rgb(var(--text-secondary))]">{preview.value}</span></div>)}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--border-subtle)/0.45)] pt-3"><span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">{(log.exercises || []).length} {lang === 'es' ? 'ejercicios' : 'exercises'}</span><Icon name="ChevronRight" size={16} className="text-[rgb(var(--text-muted))]" /></div>
        </button>
    );
});

export const HistoryView: React.FC = () => {
    const { logs, setLogs, lang, tutorialProgress, markTutorialSeen } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const { isPro, showPaywall, setShowPaywall, checkPro } = usePro();
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const deferredSearch = useDeferredValue(search);

    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const selectedLog = useMemo(() => safeLogs.find(log => log.id === selectedLogId) || null, [safeLogs, selectedLogId]);

    useEffect(() => {
        const onPop = (event: PopStateEvent) => { if (!event.state?.historyDetail) setSelectedLogId(null); };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const visibleLogs = useMemo(() => {
        let result = safeLogs.filter(log => !log.skipped);
        if (selectedDate) result = result.filter(log => localDateKey(Number(log.endTime || log.startTime)) === selectedDate);
        if (deferredSearch.trim()) {
            const q = deferredSearch.trim().toLowerCase();
            result = result.filter(log => String(log.name || '').toLowerCase().includes(q) || (log.exercises || []).some(ex => getTranslated(ex.name, lang).toLowerCase().includes(q)));
        }
        return result;
    }, [deferredSearch, lang, safeLogs, selectedDate]);

    const openDetail = useCallback((log: Log) => {
        try { window.history.pushState({ ...(window.history.state || {}), historyDetail: log.id }, '', '#history-detail'); } catch { }
        setSelectedLogId(log.id);
    }, []);

    const closeDetail = useCallback(() => {
        try { if (window.history.state?.historyDetail) { window.history.back(); return; } } catch { }
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
                instanceId: now + Math.random(),
                sets: (exercise.sets || []).map((set: any, index) => ({ ...set, id: now + index + Math.floor(Math.random() * 10000), completed: false, skipped: false, rpe: '' })),
            })),
        };
        setActiveSession(repeated as any);
        setSelectedLogId(null);
        try { window.history.replaceState({ ...(window.history.state || {}), historyDetail: undefined }, '', '#history'); } catch { }
        window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'workout' } }));
    }, [activeSession, setActiveSession]);

    const handleExportCSV = useCallback(() => {
        if (!checkPro('csv_export')) return;
        const rows = [['Date', 'Session', 'Exercise', 'Muscle', 'Set', 'Type', 'Weight(kg)', 'Reps', 'RPE', 'Completed'].join(',')];
        safeLogs.forEach(log => {
            if (log.skipped) return;
            const date = new Date(log.startTime).toLocaleDateString('en-CA');
            (log.exercises || []).forEach(ex => {
                const exName = getTranslated(ex.name, lang).replace(/,/g, ';');
                (ex.sets || []).forEach((set, index) => rows.push([date, String(log.name || '').replace(/,/g, ';'), exName, ex.muscle, index + 1, set.type, set.weight || '', set.reps || '', set.rpe || '', set.completed ? '1' : '0'].join(',')));
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

    if (!safeLogs.length) return <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--surface-app))] p-8 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]"><Icon name="Dumbbell" size={28} /></div><h3 className="mb-2 text-xl font-black">{lang === 'en' ? 'No workouts yet' : 'Sin entrenamientos aún'}</h3><p className="max-w-[230px] text-sm leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'en' ? 'Complete your first session to see it here.' : 'Completa tu primera sesión para verla aquí.'}</p></div>;

    return (
        <div className="relative flex h-full w-full flex-col bg-[rgb(var(--surface-app))]">
            <div className="shrink-0 px-4 pb-3 pt-4">
                <div className="flex items-center justify-between gap-3">
                    <div><h2 className="text-2xl font-black tracking-tight">{lang === 'en' ? 'History' : 'Historial'}</h2><p className="mt-0.5 text-[10px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Todo tu entrenamiento, siempre disponible' : 'Your complete training history, always available'}</p></div>
                    <button type="button" onClick={handleExportCSV} className="flex min-h-10 items-center gap-2 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 text-xs font-bold text-[rgb(var(--text-secondary))] active:scale-95" aria-label="Download CSV"><Icon name="Download" size={14} /> CSV {!isPro && <Icon name="Lock" size={11} className="text-amber-500" />}</button>
                </div>
                <div id="tut-history-search" className="relative mt-3"><Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" /><input type="search" inputMode="search" enterKeyHint="search" placeholder={lang === 'en' ? 'Search workouts or exercises…' : 'Buscar entrenamientos o ejercicios…'} className="h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.7)] pl-10 pr-4 text-sm font-medium outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/45 focus:ring-2 focus:ring-primary-500/10" value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>

            <HistoryCalendar logs={safeLogs} selectedDate={selectedDate} onSelectDate={setSelectedDate} lang={lang} />

            <div className="min-h-0 flex-1">
                {visibleLogs.length ? <Virtuoso style={{ height: '100%' }} data={visibleLogs} itemContent={(index, log) => <HistoryCard id={index === 0 ? 'tut-first-card' : undefined} log={log} lang={lang} onOpen={() => openDetail(log)} />} /> : <div className="flex h-full flex-col items-center justify-center px-8 text-center"><Icon name="Search" size={22} className="text-[rgb(var(--text-muted))]" /><div className="mt-3 text-sm font-black">{lang === 'es' ? 'Sin resultados' : 'No results'}</div><div className="mt-1 text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Cambia la fecha o la búsqueda.' : 'Change the date or search query.'}</div></div>}
            </div>

            <TutorialOverlay steps={historyTutorialSteps} isActive={!tutorialProgress.history} onComplete={() => markTutorialSeen('history')} />
            {selectedLog && <HistoryDetailView log={selectedLog} lang={lang} onBack={closeDetail} onRepeat={() => repeatWorkout(selectedLog)} onDelete={() => setDeletingLogId(selectedLog.id)} repeatBlocked={!!activeSession} />}
            {showPaywall && <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}><PaywallModal onClose={() => setShowPaywall(false)} feature="csv_export" /></Suspense>}
            {deletingLogId !== null && <Suspense fallback={null}><ConfirmModal isOpen={true} title={lang === 'en' ? 'Delete Workout?' : '¿Eliminar Entrenamiento?'} description={lang === 'en' ? 'This workout will be permanently deleted. This cannot be undone.' : 'Este entrenamiento se eliminará permanentemente. No se puede deshacer.'} confirmText={lang === 'en' ? 'Delete' : 'Eliminar'} cancelText={t.cancel} onConfirm={() => { setLogs(prev => prev.filter(log => log.id !== deletingLogId)); setDeletingLogId(null); setSelectedLogId(null); try { window.history.replaceState({ ...(window.history.state || {}), historyDetail: undefined }, '', '#history'); } catch { } }} onCancel={() => setDeletingLogId(null)} variant="danger" /></Suspense>}
        </div>
    );
};
