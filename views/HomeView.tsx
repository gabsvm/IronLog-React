import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { HomeView as HomeViewImpl } from './HomeViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { useStore } from '../lib/store';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../programs/performance/performanceUpperLower';
import { setPendingPerformanceRecoveryMode } from '../programs/performance/performanceRecovery';
import { getProgramBlockForWeek, resolveProgramWeek } from '../programs/engine/ProgramResolver';
import { toEditableProgram } from '../programs/engine/ProgramConversion';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';
import { getProgramDefinition } from '../programs/registry';
import { ProgramProgressStrip } from '../components/programs/ProgramProgressStrip';
import { PerformanceRecoveryGate } from '../components/programs/PerformanceRecoveryGate';
import { Icon } from '../components/ui/Icon';
import { TRANSLATIONS } from '../constants';
import './product-polish.css';
import './reorder-history-polish.css';
import './kong-final-polish.css';
import './today-benchmark.css';

const ProgramCompletionView = React.lazy(() =>
    import('../components/programs/ProgramCompletionView').then((module) => ({ default: module.ProgramCompletionView })),
);

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const { lang } = useAppPreferences();
    const { setProgram, logs, program } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const activeSession = useStore(state => state.activeSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const rootRef = useRef<HTMLDivElement>(null);
    const [showSkippedFinalCompletion, setShowSkippedFinalCompletion] = useState(false);
    const [pendingPerformanceDay, setPendingPerformanceDay] = useState<number | null>(null);
    const structuredDefinition = useMemo(() => activeMeso?.programSystem
        ? getProgramDefinition(activeMeso.programSystem.systemId, activeMeso.programSystem.systemVersion)
        : null,
    [activeMeso?.programSystem?.systemId, activeMeso?.programSystem?.systemVersion]);
    const isStructured = !!structuredDefinition;
    const isKong = structuredDefinition?.id === KONG_4DAY_V1.id;
    const isPerformance = structuredDefinition?.id === PERFORMANCE_UPPER_LOWER_V1.id;
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const safeProgram = useMemo(() => Array.isArray(program) ? program : [], [program]);
    const substitutionSignature = useMemo(
        () => JSON.stringify(activeMeso?.programSystem?.substitutions || {}),
        [activeMeso?.programSystem?.substitutions],
    );
    const structuredCycleResolvedCount = useMemo(() => {
        if (!isStructured || !structuredDefinition || !activeMeso) return 0;
        const safeLogs = Array.isArray(logs) ? logs : [];
        return new Set(
            safeLogs
                .filter(log => log.mesoId === activeMeso.id && log.week === activeMeso.week)
                .map(log => log.dayIdx)
                .filter(dayIdx => dayIdx >= 0 && dayIdx < structuredDefinition.daysPerWeek),
        ).size;
    }, [activeMeso, isStructured, logs, structuredDefinition]);

    useEffect(() => {
        if (!structuredDefinition || !activeMeso) return;
        const { block } = getProgramBlockForWeek(structuredDefinition, activeMeso.week);
        const resolvedBase = resolveProgramWeek(
            structuredDefinition,
            activeMeso.week,
            activeMeso.programSystem?.substitutions || {},
        );
        const resolved = isKong
            ? resolvedBase.map((day, dayIndex) => ({
                ...day,
                dayName: getKongDayDisplay(block.number, dayIndex),
            }))
            : resolvedBase;

        setProgram(prev => JSON.stringify(prev) === JSON.stringify(resolved) ? prev : resolved);
    }, [activeMeso?.week, isKong, setProgram, structuredDefinition, substitutionSignature]);

    useEffect(() => {
        if (!structuredDefinition || !activeMeso || activeSession) return;
        const safeLogs = Array.isArray(logs) ? logs : [];
        const currentCycleLogs = safeLogs.filter(log => log.mesoId === activeMeso.id && log.week === activeMeso.week);
        if (!currentCycleLogs.some(log => log.skipped)) return;

        const completedDays = new Set(
            currentCycleLogs
                .filter(log => !log.skipped)
                .map(log => log.dayIdx)
                .filter(dayIdx => dayIdx >= 0 && dayIdx < structuredDefinition.daysPerWeek),
        );
        if (completedDays.size >= structuredDefinition.daysPerWeek) return;

        const resolvedDays = new Set(
            currentCycleLogs
                .map(log => log.dayIdx)
                .filter(dayIdx => dayIdx >= 0 && dayIdx < structuredDefinition.daysPerWeek),
        );
        if (resolvedDays.size < structuredDefinition.daysPerWeek) return;

        if (activeMeso.week >= structuredDefinition.durationWeeks) {
            setShowSkippedFinalCompletion(true);
            return;
        }

        const mesoId = activeMeso.id;
        const completedCycle = activeMeso.week;
        setActiveMeso(prev => (
            prev && prev.id === mesoId && prev.week === completedCycle
                ? { ...prev, week: prev.week + 1, isDeload: false }
                : prev
        ));
    }, [activeMeso, activeSession, logs, setActiveMeso, structuredDefinition]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const normalizeProductLabels = () => {
            const label = lang === 'es' ? 'PERSONALIZADO' : 'CUSTOM';
            root.querySelectorAll<HTMLElement>('span').forEach((node) => {
                const text = (node.textContent || '').trim();
                if (/^(tpl_|personal_)/i.test(text)) {
                    node.classList.add('product-internal-plan-id');
                    node.dataset.productLabel = label;
                }
                if (isKong && lang === 'es' && /^KONG\s*·\s*BLOCK\s+\d+$/i.test(text)) {
                    node.textContent = text.replace(/BLOCK/i, 'BLOQUE');
                }
                if (isStructured && structuredDefinition && /^\d+%\s+(DONE|COMPLETADO)$/i.test(text)) {
                    node.textContent = lang === 'es'
                        ? `${structuredCycleResolvedCount} / ${structuredDefinition.daysPerWeek} sesiones`
                        : `${structuredCycleResolvedCount} / ${structuredDefinition.daysPerWeek} workouts`;
                }
                if (text === String(t.tapToStart || '')) {
                    node.textContent = lang === 'es' ? 'Empezar' : 'Start workout';
                }
            });

            if (isStructured && structuredDefinition) {
                const settingsButton = root.querySelector<HTMLElement>('#tut-settings-btn');
                if (isKong) settingsButton?.closest('.flex.justify-between.items-start.pt-2')?.classList.add('kong-home-header');

                if (isKong) root.querySelector<HTMLElement>('[role="progressbar"][aria-label="Week progress"]')?.classList.add('kong-legacy-week-progress');

                root.querySelectorAll<HTMLElement>('h4').forEach(node => {
                    const text = (node.textContent || '').trim();
                    if (/^(Weekly Timeline|Cronograma Semanal)$/i.test(text)) {
                        node.textContent = structuredDefinition.cadence?.unit === 'cycle'
                            ? (lang === 'es' ? 'Este ciclo' : 'This cycle')
                            : (lang === 'es' ? 'Esta semana' : 'This week');
                    }
                });

                const nextCard = root.querySelector<HTMLElement>('#tut-up-next');
                if (nextCard) {
                    const badgeContainer = Array.from(nextCard.querySelectorAll<HTMLElement>('div')).find(node =>
                        node.classList.contains('flex') && node.classList.contains('flex-wrap') && node.classList.contains('gap-2')
                    );
                    if (badgeContainer) {
                        const seen = new Set<string>();
                        badgeContainer.querySelectorAll<HTMLElement>('span').forEach(node => {
                            const text = (node.textContent || '').trim();
                            if (!text || text.startsWith('+')) return;
                            if (seen.has(text)) node.style.display = 'none';
                            else {
                                seen.add(text);
                                node.style.display = '';
                            }
                        });
                    }

                    const timelineButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.calendar-timeline > button'));
                    let selectedIdx = timelineButtons.findIndex(button => button.className.includes('ring-1'));
                    if (selectedIdx < 0) selectedIdx = Math.max(0, timelineButtons.findIndex(button => button.className.includes('border-primary')));
                    const selectedDay = safeProgram[selectedIdx >= 0 ? selectedIdx : 0];
                    const plannedSets = (selectedDay?.slots || []).reduce((sum: number, slot: any) => {
                        const prescriptionCount = Array.isArray(slot?.prescription) ? slot.prescription.length : 0;
                        return sum + (prescriptionCount || Number(slot?.setTarget) || 3);
                    }, 0);
                    const plannedMinutes = plannedSets > 0 ? Math.max(15, Math.round(plannedSets * 2.5)) : 0;

                    if (plannedMinutes > 0) {
                        nextCard.querySelectorAll<HTMLElement>('span').forEach(node => {
                            const match = (node.textContent || '').trim().match(/^~(\d+)\s*MIN$/i);
                            if (match && Number(match[1]) < 15) node.textContent = `~${plannedMinutes} MIN`;
                        });
                    }
                }
            }
        };

        normalizeProductLabels();
        const observer = new MutationObserver(normalizeProductLabels);
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [isKong, isStructured, lang, safeProgram, structuredCycleResolvedCount, structuredDefinition, t.tapToStart]);

    const startSessionWithRecovery = (dayIdx: number) => {
        if (!isPerformance) {
            props.startSession(dayIdx);
            return;
        }

        // Recovery Gate applies when a PERFORMANCE session is created. Once a
        // session already exists, Today is only resuming that exact session and
        // must not ask readiness again or leave a mode pending for the future.
        if (activeSession && activeMeso && activeSession.mesoId === activeMeso.id) {
            props.startSession(activeSession.dayIdx);
            return;
        }

        setPendingPerformanceDay(dayIdx);
    };

    const editProgramWithStructuredGuard = () => {
        if (!isPerformance || !activeMeso) {
            props.onEditProgram();
            return;
        }
        const convert = window.confirm(lang === 'es'
            ? 'PERFORMANCE usa progresión estructurada por rangos, RPE y ciclos. ¿Convertir el ciclo actual en una rutina personalizada? La copia dejará de seguir la progresión automática de PERFORMANCE.'
            : 'PERFORMANCE uses structured ranges, RPE and cycles. Convert the current cycle into a personal routine? The copy will stop following PERFORMANCE progression.');
        if (!convert) return;

        const editable = toEditableProgram(safeProgram);
        setProgram(editable);
        setActiveMeso(prev => prev ? {
            ...prev,
            name: 'PERFORMANCE · Personal',
            mesoType: 'personal',
            plan: editable.map(day => (day.slots || []).map(slot => slot.exerciseId || null)),
            programSystem: undefined,
        } : prev);
        props.onEditProgram();
    };

    const pendingDay = pendingPerformanceDay !== null ? safeProgram[pendingPerformanceDay] : null;
    const pendingDayName = pendingDay?.dayName
        ? (typeof pendingDay.dayName === 'object' ? pendingDay.dayName[lang] : pendingDay.dayName)
        : undefined;

    return (
        <div ref={rootRef} className={`product-home-polish ${isKong ? 'kong-active' : ''} ${isStructured ? 'structured-program-active' : ''} contents`}>
            {isStructured && activeMeso && structuredDefinition && (
                <ProgramProgressStrip
                    week={activeMeso.week}
                    totalWeeks={structuredDefinition.durationWeeks}
                    lang={lang}
                    name={activeMeso.name || structuredDefinition.title}
                />
            )}
            <HomeViewImpl {...props} startSession={startSessionWithRecovery} onEditProgram={editProgramWithStructuredGuard} />
            {pendingPerformanceDay !== null && isPerformance && (
                <PerformanceRecoveryGate
                    lang={lang}
                    sessionName={pendingDayName}
                    onCancel={() => setPendingPerformanceDay(null)}
                    onStart={(mode) => {
                        const dayIdx = pendingPerformanceDay;
                        setPendingPerformanceRecoveryMode(mode);
                        setPendingPerformanceDay(null);
                        props.startSession(dayIdx);
                    }}
                />
            )}
            {showSkippedFinalCompletion && activeMeso && isKong && (
                <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}>
                    <ProgramCompletionView
                        meso={activeMeso}
                        logs={Array.isArray(logs) ? logs : []}
                        lang={lang}
                        onFinish={() => {
                            setShowSkippedFinalCompletion(false);
                            setActiveMeso(null);
                        }}
                        onKeep={() => {
                            setShowSkippedFinalCompletion(false);
                            setActiveMeso(null);
                        }}
                    />
                </Suspense>
            )}
            {showSkippedFinalCompletion && activeMeso && isPerformance && (
                <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/70 p-4 pb-safe backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-md rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5 text-[rgb(var(--text-primary))] shadow-2xl">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="CheckCircle" size={20} /></div>
                        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">GainsLab PERFORMANCE</p>
                        <h2 className="mt-1 text-xl font-black">{lang === 'es' ? 'Ciclo 8 resuelto' : 'Cycle 8 resolved'}</h2>
                        <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'Llegaste al final del bloque de 8 ciclos. Una de las posiciones fue omitida, por eso la adherencia real queda preservada en el historial en vez de fingir una sesión completada.' : 'You reached the end of the 8-cycle block. One scheduled position was skipped, so real adherence remains preserved in history instead of pretending it was completed.'}</p>
                        <button type="button" onClick={() => { setShowSkippedFinalCompletion(false); setActiveMeso(null); }} className="mt-5 min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Finalizar PERFORMANCE' : 'Finish PERFORMANCE'}</button>
                        <button type="button" onClick={() => setShowSkippedFinalCompletion(false)} className="mt-2 min-h-11 w-full rounded-2xl bg-[rgb(var(--surface-base))] px-4 text-xs font-bold text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'Revisar antes de finalizar' : 'Review before finishing'}</button>
                    </div>
                </div>
            )}
        </div>
    );
};
