
import React, { useState, memo, useMemo, useDeferredValue, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { formatDate, formatHoursMinutes, getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { Log } from '../types';
import { Virtuoso } from 'react-virtuoso';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { usePro } from '../hooks/usePro';
import { PaywallModal } from '../components/pro/PaywallModal';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Helper to parse duration string "mm:ss" or number to string format
const formatDurationDisplay = (val: string | number) => {
    if (typeof val === 'number') return `${val}m`;
    if (!val) return '-';
    return val.includes(':') ? val : `${val}m`;
};

// Virtuoso context type — avoids recreating Header/Footer components on every render
interface HistoryVirtuosoContext {
    lang: 'en' | 'es';
    search: string;
    setSearch: (s: string) => void;
    hasLockedLogs: boolean;
    checkPro: (feature: string) => boolean;
    t: any;
}

const VirtuosoHeader = ({ context }: { context?: HistoryVirtuosoContext }) => {
    if (!context) return null;
    const { lang, search, setSearch } = context;
    return (
        <div className="px-5 pt-20 pb-4 space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">{lang === 'en' ? 'History' : 'Historial'}</h2>
            <div id="tut-history-search" className="relative">
                <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    placeholder={lang === 'en' ? 'Search workouts...' : 'Buscar entrenamientos...'}
                    className="w-full bg-zinc-900 border border-zinc-800/85 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white placeholder-zinc-500 transition-all glow-input-neon"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
    );
};

const VirtuosoFooter = ({ context }: { context?: HistoryVirtuosoContext }) => {
    if (!context) return null;
    const { hasLockedLogs, checkPro } = context;
    return (
        <div className="pb-24 pt-4 px-4">
            {hasLockedLogs && (
                <div className="bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                        <Icon name="Lock" size={24} />
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-2">History Locked</h4>
                    <p className="text-xs text-zinc-500 mb-6 max-w-[200px] mx-auto">
                        Older workouts are archived. Unlock Premium to access your full training history.
                    </p>
                    <Button
                        size="sm"
                        onClick={() => checkPro('history')}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-black mx-auto"
                    >
                        Unlock PRO
                    </Button>
                </div>
            )}
        </div>
    );
};

// Stable components object — defined outside render to prevent Virtuoso remounts
const VIRTUOSO_COMPONENTS = { Header: VirtuosoHeader, Footer: VirtuosoFooter };

// 1. Extract and Memoize the Card Component for Performance
interface HistoryCardProps {
    log: Log;
    isExpanded: boolean;
    onToggle: (id: number) => void;
    lang: 'en' | 'es';
    t: any;
    id?: string;
    onDeleteRequest: (id: number) => void;
}

const HistoryCard = memo(({ log, isExpanded, onToggle, lang, t, id, onDeleteRequest }: HistoryCardProps) => {

    // Process "Best Sets" for preview
    const bestSets = (log.exercises || []).map(ex => {
        const isCardio = ex.muscle === 'CARDIO';
        const validSets = (ex.sets || []).filter(s => s.completed && s.type !== 'avt_hop');

        if (validSets.length === 0) return null;

        if (isCardio) {
            // For cardio, summarize total time or distance
            const totalDist = validSets.reduce((acc, s) => acc + Number(s.distance || 0), 0);
            const totalTime = validSets.reduce((acc, s) => {
                // Parse duration potentially
                let mins = 0;
                if (typeof s.duration === 'string' && s.duration.includes(':')) {
                    const [m, sec] = s.duration.split(':').map(Number);
                    mins = m + (sec / 60);
                } else {
                    mins = Number(s.duration || 0);
                }
                return acc + mins;
            }, 0);

            return {
                name: getTranslated(ex.name, lang),
                isCardio: true,
                summary: `${Math.round(totalTime)} min ${totalDist > 0 ? `/ ${totalDist.toFixed(1)} km` : ''}`
            };
        }

        // Weightlifting logic
        const validLifts = validSets.filter(s => s.weight && s.reps);
        if (validLifts.length === 0) return null;

        const best = validLifts.reduce((prev, current) => (Number(prev.weight) > Number(current.weight)) ? prev : current);
        return { name: getTranslated(ex.name, lang), ...best, isCardio: false };
    }).filter(Boolean);

    return (
        <div
            id={id}
            onClick={() => onToggle(log.id)}
            className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer mb-3 mx-4
                ${isExpanded ? 'border-primary-500/40 ring-1 ring-primary-500/10 shadow-lg shadow-primary-500/5' : 'hover:border-white/10'}
            `}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                            {formatDate(log.endTime, lang)}
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                            {log.name}
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded inline-flex items-center gap-1">
                            <Icon name="Clock" size={12} />
                            {formatHoursMinutes(log.duration)}
                        </div>
                    </div>
                </div>

                {!isExpanded && (
                    <div className="space-y-2">
                        {bestSets.slice(0, 3).map((s: any) => (
                            <div key={s.name} className="flex justify-between items-center text-xs text-zinc-500">
                                <span className="truncate pr-4 max-w-[200px]">{s.name}</span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    {s.isCardio ? s.summary : `${s.weight}kg x ${s.reps}`}
                                </span>
                            </div>
                        ))}
                        {bestSets.length > 3 && (
                            <div className="text-[10px] text-zinc-400 italic">
                                {t.more.replace('{0}', String(bestSets.length - 3))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="bg-black/35 border-t border-white/5 p-4 space-y-5">
                    {(log.exercises || []).map((ex) => {
                        const isCardio = ex.muscle === 'CARDIO';
                        return (
                            <div key={ex.instanceId ?? ex.id ?? getTranslated(ex.name, lang)}>
                                <h4 className="font-bold text-sm text-white mb-2 flex items-center justify-between">
                                    <span>{getTranslated(ex.name, lang)}</span>
                                    {ex.note && <span className="text-[10px] text-zinc-500 italic font-normal max-w-[150px] truncate">{ex.note}</span>}
                                </h4>
                                <div className="space-y-1">
                                    {(ex.sets || []).filter(s => s.completed).map((s, idx) => (
                                        <div key={idx} className="flex items-center text-xs">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center font-bold mr-3 ${s.type === 'warmup' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-zinc-400'}`}>
                                                {s.type === 'warmup' ? 'W' : idx + 1}
                                            </div>
                                            <div className="flex-1 font-mono text-zinc-300">
                                                {isCardio ? (
                                                    <>
                                                        <span className="font-bold">{formatDurationDisplay(s.duration || 0)}</span>
                                                        {s.distance && (
                                                            <>
                                                                <span className="mx-2 text-zinc-600">|</span>
                                                                <span className="font-bold">{s.distance}</span> <span className="text-zinc-500 text-[10px]">KM</span>
                                                            </>
                                                        )}
                                                        {s.rpe && (
                                                            <>
                                                                <span className="mx-2 text-zinc-600">|</span>
                                                                <span className="text-zinc-500">{t.cardioSpeed}: {s.rpe}</span>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-white">{s.weight}</span> <span className="text-zinc-500 text-[10px]">KG</span>
                                                        <span className="mx-2 text-zinc-700">×</span>
                                                        <span className="font-bold text-white">{s.reps}</span> <span className="text-zinc-500 text-[10px]">REPS</span>
                                                        {s.rpe && (
                                                            <>
                                                                <span className="mx-2 text-zinc-700">|</span>
                                                                <span className="text-zinc-500">RIR {s.rpe}</span>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <div className="pt-4 border-t border-zinc-800 flex justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRequest(log.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold active:scale-95 transition-all hover:bg-red-500/25"
                        >
                            <Icon name="Trash2" size={14} />
                            {lang === 'en' ? 'Delete' : 'Eliminar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export const HistoryView: React.FC = () => {
    const { logs, setLogs, lang, tutorialProgress, markTutorialSeen } = useApp();
    const t = TRANSLATIONS[lang];
    const { isPro, showPaywall, setShowPaywall, checkPro } = usePro();

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    // Memoized so downstream useMemo/useCallback deps don't churn on every render.
    const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);

    // Filter Logs (Search + Time Limit for Free Users)
    const { visibleLogs, hasLockedLogs } = useMemo(() => {
        let result = safeLogs;

        // Search Filter
        if (deferredSearch.trim()) {
            const q = deferredSearch.toLowerCase();
            result = result.filter(log => {
                if (log.name.toLowerCase().includes(q)) return true;
                return log.exercises?.some(ex => getTranslated(ex.name, lang).toLowerCase().includes(q));
            });
        }

        // Pro Filter (7 Days)
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        if (isPro) {
            return { visibleLogs: result, hasLockedLogs: false };
        } else {
            const visible = [];
            let lockedCount = 0;

            for (const log of result) {
                if ((now - log.endTime) < SEVEN_DAYS) {
                    visible.push(log);
                } else {
                    lockedCount++;
                }
            }
            return { visibleLogs: visible, hasLockedLogs: lockedCount > 0 };
        }
    }, [safeLogs, deferredSearch, lang, isPro]);

    const handleExportCSV = useCallback(() => {
        if (!checkPro('csv_export')) return;
        const rows: string[] = [];
        // Header
        rows.push(['Date', 'Session', 'Exercise', 'Muscle', 'Set', 'Type', 'Weight(kg)', 'Reps', 'RPE', 'Completed'].join(','));

        safeLogs.forEach(log => {
            if (log.skipped) return;
            const date = new Date(log.startTime).toLocaleDateString('en-CA'); // YYYY-MM-DD
            (log.exercises || []).forEach(ex => {
                const exName = getTranslated(ex.name, lang).replace(/,/g, ';');
                (ex.sets || []).forEach((s, si) => {
                    rows.push([
                        date,
                        (log.name || '').replace(/,/g, ';'),
                        exName,
                        ex.muscle,
                        si + 1,
                        s.type,
                        s.weight || '',
                        s.reps || '',
                        s.rpe || '',
                        s.completed ? '1' : '0'
                    ].join(','));
                });
            });
        });

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ironlog_history_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [safeLogs, lang, checkPro]);

    const historyTutorialSteps = [
        { targetId: 'tut-history-search', title: t.tutorial.history[1].title, text: t.tutorial.history[1].text, position: 'bottom' as const },
        { targetId: 'tut-first-card', title: t.tutorial.history[0].title, text: t.tutorial.history[0].text, position: 'bottom' as const }
    ];

    const virtuosoContext = useMemo<HistoryVirtuosoContext>(() => ({
        lang, search, setSearch, hasLockedLogs, checkPro, t
    }), [lang, search, setSearch, hasLockedLogs, checkPro, t]);

    const renderItem = useCallback((index: number, log: Log) => (
        <HistoryCard
            id={index === 0 ? "tut-first-card" : undefined}
            log={log}
            isExpanded={expandedId === log.id}
            onToggle={(id) => setExpandedId(prev => prev === id ? null : id)}
            lang={lang}
            t={t}
            onDeleteRequest={(id) => setDeletingLogId(id)}
        />
    ), [expandedId, lang, t]);

    if (safeLogs.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-950">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
                    <Icon name="Dumbbell" size={36} className="text-zinc-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                    {lang === 'en' ? 'No workouts yet' : 'Sin entrenamientos aún'}
                </h3>
                <p className="text-zinc-500 text-sm max-w-[220px] leading-relaxed">
                    {lang === 'en' ? 'Complete your first session to see it here.' : 'Completa tu primera sesión para verla aquí.'}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-zinc-950 flex flex-col relative">
            <Virtuoso
                style={{ height: '100%' }}
                data={visibleLogs}
                components={VIRTUOSO_COMPONENTS}
                context={virtuosoContext}
                itemContent={renderItem}
            />

            {/* CSV Export FAB */}
            {safeLogs.length > 0 && (
                <button
                    onClick={handleExportCSV}
                    className="absolute bottom-24 right-4 flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-200 hover:text-white hover:border-white/20 px-4 py-2.5 rounded-full text-xs font-bold shadow-xl transition-all active:scale-95 duration-fast"
                 aria-label="Download"> <Icon name="Download" size={14} />
                    CSV
                    {!isPro && <Icon name="Lock" size={11} className="text-yellow-500" />}
                </button>
            )}

            <TutorialOverlay
                steps={historyTutorialSteps}
                isActive={!tutorialProgress.history}
                onComplete={() => markTutorialSeen('history')}
            />

            {showPaywall && (
                <PaywallModal onClose={() => setShowPaywall(false)} feature="history" />
            )}

            {deletingLogId !== null && (
                <ConfirmModal
                    isOpen={true}
                    title={lang === 'en' ? "Delete Workout?" : "¿Eliminar Entrenamiento?"}
                    description={lang === 'en' ? "This workout will be permanently deleted. This cannot be undone." : "Este entrenamiento se eliminará permanentemente. No se puede deshacer."}
                    confirmText={lang === 'en' ? "Delete" : "Eliminar"}
                    cancelText={t.cancel}
                    onConfirm={() => {
                        setLogs(prev => prev.filter(l => l.id !== deletingLogId));
                        setDeletingLogId(null);
                        setExpandedId(null);
                    }}
                    onCancel={() => setDeletingLogId(null)}
                    variant="danger"
                />
            )}
        </div>
    );
};
