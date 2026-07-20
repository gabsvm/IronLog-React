
import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { useApp, useAppPreferences, useTutorial } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { getTranslated } from '../utils';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { usePro } from '../hooks/usePro';
import { GlobalTemplate, ProgramDay } from '../types';
import { triggerHaptic } from '../utils/audio';

// Sub-components extracted in Phase 6.2
import { GuidelinesModal } from './home/GuidelinesModal';
import { TemplateSelector } from './home/TemplateSelector';
import { WeekProgress } from './home/WeekProgress';
import { WeeklyRecapCard } from './home/WeeklyRecapCard';
import { NextSessionCard } from './home/NextSessionCard';


import { useStore } from '../lib/store';

const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

// --- MAIN COMPONENT ---

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ startSession, onEditProgram, onSkipSession, onStartFreeSession }) => {
    const { program, logs, isAppLoading, setProgram, globalTemplates, personalTemplates } = useApp();
    const { lang } = useAppPreferences();
    const { tutorialProgress, markTutorialSeen } = useTutorial();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    const { isPro, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();

    const tm = (key: string) => {
        if (!key || typeof key !== 'string') return 'Unknown';
        const val = (t.muscle as any)[key];
        return typeof val === 'string' ? val : key;
    };

    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);
    const [showMesoSettings, setShowMesoSettings] = useState(false);
    const [skipConfirmationId, setSkipConfirmationId] = useState<number | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);

    // --- MESO SETTINGS LOCAL STATE ---
    const [editWeeks, setEditWeeks] = useState(4);
    const [editDeload, setEditDeload] = useState(false);
    const [editNote, setEditNote] = useState('');

    useEffect(() => {
        if (activeMeso && showMesoSettings) {
            setEditWeeks(activeMeso.targetWeeks || 4);
            setEditDeload(activeMeso.isDeload || false);
            setEditNote(activeMeso.note || '');
        }
    }, [activeMeso, showMesoSettings]);

    // Find the current active guideline images
    const currentGuidelineImages = useMemo(() => {
        if (!activeMeso) return null;
        // Find matching global template to get the images
        const template = globalTemplates.find(t => t.id === activeMeso.mesoType);
        return template?.guidelineImages;
    }, [activeMeso, globalTemplates]);

    const handleSaveSettings = () => {
        if (!activeMeso) return;
        setActiveMeso(prev => prev ? {
            ...prev,
            targetWeeks: editWeeks,
            isDeload: editDeload,
            note: editNote
        } : null);
        setShowMesoSettings(false);
    };

    // Stable references — the conditional `Array.isArray ? : []` was making
    // downstream useMemo dependency arrays churn every render.
    const safeProgram = useMemo(() => (Array.isArray(program) ? program : []), [program]);
    const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);

    // Single O(N) scan to compute all log-derived metrics for the Home screen
    const {
        uniqueDaysDone, weekComplete, nextWorkoutIdx, isSessionActive, logsForWeek,
        estimatedMin, adherencePct
    } = useMemo(() => {
        if (!activeMeso) {
            return { uniqueDaysDone: new Set(), weekComplete: false, nextWorkoutIdx: -1, isSessionActive: false, nextDayDef: null, logsForWeek: [], estimatedMin: 0, adherencePct: null };
        }

        // 1. O(N) Pass: Gather all logs for the current meso
        const mesoLogs = safeLogs.filter(l => l.mesoId === activeMeso.id);
        
        // 2. Weekly computations
        const currentWeekLogs = mesoLogs.filter(l => l.week === activeMeso.week);
        const daysDone = new Set(currentWeekLogs.map(l => l.dayIdx));
        const total = safeProgram.length;
        const isComplete = daysDone.size >= total && total > 0;

        let nextIdx = -1;
        for (let i = 0; i < total; i++) {
            if (!daysDone.has(i)) {
                nextIdx = i;
                break;
            }
        }
        if (nextIdx === -1 && isComplete) nextIdx = -1;

        const active = !!(activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === nextIdx);
        const nextDef = nextIdx !== -1 ? safeProgram[nextIdx] : null;

        // 3. Adherence computations
        let pct: number | null = null;
        if (mesoLogs.length > 0) {
            const completed = mesoLogs.filter(l => !l.skipped).length;
            pct = Math.round((completed / mesoLogs.length) * 100);
        }

        // 4. Estimation computation
        let est = 0;
        if (nextIdx !== -1) {
            const sameDayLogs = mesoLogs.filter(l => l.dayIdx === nextIdx && !l.skipped && l.duration > 0).slice(-3);
            if (sameDayLogs.length > 0) {
                const avgSec = sameDayLogs.reduce((s, l) => s + l.duration, 0) / sameDayLogs.length;
                est = Math.round(avgSec / 60);
            } else {
                const totalSets = (nextDef?.slots || []).reduce((s: number, slot: any) => s + (slot.setTarget || 3), 0);
                est = totalSets > 0 ? Math.round(totalSets * 2.5) : 0;
            }
        }

        return {
            uniqueDaysDone: daysDone,
            weekComplete: isComplete,
            nextWorkoutIdx: nextIdx,
            isSessionActive: active,
            logsForWeek: currentWeekLogs,
            estimatedMin: est,
            adherencePct: pct
        };
    }, [activeMeso, activeSession, safeLogs, safeProgram]);

    const [selectedDayIdx, setSelectedDayIdx] = useState<number>(nextWorkoutIdx !== -1 ? nextWorkoutIdx : 0);

    useEffect(() => {
        if (nextWorkoutIdx !== -1) {
            setSelectedDayIdx(nextWorkoutIdx);
        }
    }, [nextWorkoutIdx]);

    // Memoized estimate for the currently selected day. Previously this ran as
    // an IIFE inside the JSX, so the O(N) scan over logs fired on every render —
    // including every rest-timer tick that re-renders the home shell.
    const selectedDayEstimatedMin = useMemo(() => {
        if (!activeMeso) return 0;
        const dayDef = safeProgram[selectedDayIdx];
        if (!dayDef) return 0;
        const sameDayLogs = safeLogs
            .filter(l => l.mesoId === activeMeso.id && l.dayIdx === selectedDayIdx && !l.skipped && l.duration > 0)
            .slice(-3);
        if (sameDayLogs.length > 0) {
            const avgSec = sameDayLogs.reduce((s, l) => s + l.duration, 0) / sameDayLogs.length;
            return Math.round(avgSec / 60);
        }
        const totalSets = (dayDef.slots || []).reduce((s: number, slot: any) => s + (slot.setTarget || 3), 0);
        return totalSets > 0 ? Math.round(totalSets * 2.5) : 0;
    }, [activeMeso, safeLogs, safeProgram, selectedDayIdx]);

    // Handlers
    const handleSkipClick = (e: React.MouseEvent, dayIdx: number) => { e.stopPropagation(); setSkipConfirmationId(dayIdx); };
    const confirmSkip = () => {
        if (onSkipSession && skipConfirmationId !== null) {
            onSkipSession(skipConfirmationId);
            triggerHaptic('medium');
        }
        setSkipConfirmationId(null);
    };
    const handleFinishMeso = () => { setActiveMeso(null); setShowCompleteModal(null); };
    const handleFinishWeek = () => {
        if (!activeMeso) return;
        setActiveMeso(prev => prev ? {
            ...prev,
            week: prev.week + 1
        } : null);
        triggerHaptic('success');
        setShowCompleteModal(null);
    };

    // --- TEMPLATE LOGIC ---
    const handleOpenTemplateSelector = () => setShowTemplateSelector(true);

    const handleSelectTemplate = (tpl: GlobalTemplate) => {
        if (tpl.isPro && !checkPro("Pro Template")) return;

        setProgram(tpl.program);

        // Auto-start Meso
        const plan = tpl.program.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: getTranslated(tpl.title, lang as any),
            mesoType: tpl.id, // Using ID as type for tracking
            week: 1,
            targetWeeks: 5,
            isDeload: false,
            plan: plan,
            duration: 5
        });

        setShowTemplateSelector(false);
        triggerHaptic('success');
    };

    const handleCreateCustom = () => {
        // Clear program and go to editor
        setProgram([]); // Start empty
        setShowTemplateSelector(false);
        onEditProgram(); // Navigate to Editor
    };

    const mesoSettingsTutorialSteps = [
        { targetId: 'tut-meso-duration', title: t.tutorial.mesoSettings[0].title, text: t.tutorial.mesoSettings[0].text, position: 'bottom' as const },
        { targetId: 'tut-meso-deload', title: t.tutorial.mesoSettings[1].title, text: t.tutorial.mesoSettings[1].text, position: 'bottom' as const },
        { targetId: 'tut-meso-edit', title: t.tutorial.mesoSettings[2].title, text: t.tutorial.mesoSettings[2].text, position: 'bottom' as const },
        { targetId: 'tut-meso-notes', title: t.tutorial.mesoSettings[3].title, text: t.tutorial.mesoSettings[3].text, position: 'top' as const }
    ];

    const homeTutorialSteps = [
        { targetId: 'tut-up-next', title: t.tutorial.home[0].title, text: t.tutorial.home[0].text, position: 'bottom' as const },
        ...(currentGuidelineImages && currentGuidelineImages.length > 0 ? [{ targetId: 'tut-guidelines', title: t.tutorial.home[1].title, text: t.tutorial.home[1].text, position: 'bottom' as const }] : []),
        { targetId: 'tut-settings-btn', title: t.tutorial.home[2].title, text: t.tutorial.home[2].text, position: 'bottom' as const },
        { targetId: 'tut-nav-bar', title: t.tutorial.home[3].title, text: t.tutorial.home[3].text, position: 'top' as const },
        ...(onStartFreeSession ? [{ targetId: 'home-freestyle-btn', title: lang === 'es' ? '🏅 Sin Programa Fijo' : '🏅 No Fixed Program', text: lang === 'es' ? 'Aquí puedes iniciar sesiones de CrossFit (WODs), Calistenia (progressions) o entrenar libremente sin un mesociclo activo.' : 'Here you can start CrossFit (WODs), Calisthenics (progressions) or train freely without an active mesocycle.', position: 'top' as const }] : [])
    ];

    if (!activeMeso) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 bg-black">
                <div className="relative z-10 w-full max-w-sm">
                    {/* Hero Card Container */}
                    <div
                        onClick={handleOpenTemplateSelector}
                        className="group w-full aspect-square rounded-[1.5rem] relative overflow-hidden cursor-pointer bg-[#121212] active:scale-[0.98] transition-all duration-300 border border-white/5 flex flex-col items-center justify-center p-8 gap-4"
                    >
                        {/* Clean minimal UI replacing abstract art */}
                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-primary-500 mb-2">
                            <Icon name="Plus" size={32} strokeWidth={2} />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {t.startMeso}
                            </h2>
                            <p className="text-sm text-zinc-400 font-medium">
                                {lang === 'es' ? 'Comienza un nuevo plan' : 'Start a new plan'}
                            </p>
                        </div>
                        <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-500"></div>
                    </div>
                </div>

                {/* Optional: Quick Action Button below if card isn't obvious enough */}
                <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 delay-200">
                    <Button onClick={handleOpenTemplateSelector} variant="secondary" fullWidth className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                        {lang === 'en' ? "View Templates" : "Ver Plantillas"}
                    </Button>
                </div>

                {/* Freestyle / CrossFit / Calisthenics option */}
                {onStartFreeSession && (
                    <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 delay-300">
                        <button
                            onClick={onStartFreeSession}
                            className="w-full flex items-center gap-3 glass-card rounded-2xl p-4 hover:border-white/10 active:scale-[0.98] transition-all"
                        >
                            <div className="flex gap-1">
                                <div className="w-7 h-7 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center"><Icon name="Dumbbell" size={14} /></div>
                                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Icon name="Zap" size={14} /></div>
                                <div className="w-7 h-7 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><Icon name="User" size={14} /></div>
                            </div>
                            <span className="flex-1 text-left text-xs font-semibold text-zinc-300">
                                {lang === 'es' ? 'Gym · CrossFit · Calistenia' : 'Gym · CrossFit · Calisthenics'}
                            </span>
                            <Icon name="ChevronRight" size={16} className="text-zinc-650" />
                        </button>
                    </div>
                )}

                {/* Modals */}
                {showTemplateSelector && (
                    <TemplateSelector
                        onClose={() => setShowTemplateSelector(false)}
                        onSelectTemplate={handleSelectTemplate}
                        onCreateCustom={handleCreateCustom}
                        templates={[...personalTemplates, ...globalTemplates]}
                        t={t}
                        lang={lang}
                    />
                )}
                {showPaywall && (
                    <Suspense fallback={null}>
                        <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                    </Suspense>
                )}
            </div>
        );
    }

    return (
        <div className="px-6 space-y-8 pb-40">
            {/* Header Info */}
            <div className="flex justify-between items-start pt-2">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{activeMeso.name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                        {currentGuidelineImages && currentGuidelineImages.length > 0 ? (
                            <button
                                id="tut-guidelines"
                                onClick={() => checkPro("Guidelines") && setShowGuidelines(true)}
                                className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-zinc-800 text-blue-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-1.5 active:scale-95"
                            >
                                <Icon name="Info" size={12} /> GUIDELINES {!isPro && <Icon name="Lock" size={10} className="text-yellow-500 ml-1" />}
                            </button>
                        ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700`}>
                                {t.phases?.[activeMeso.mesoType] || activeMeso.mesoType}
                            </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.week} {activeMeso.week} / {activeMeso.targetWeeks}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button id="tut-settings-btn" onClick={() => setShowMesoSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <Icon name="Settings" size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <WeekProgress program={safeProgram} logsForWeek={logsForWeek} />

                {/* Horizontal Timeline of Days */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                            {lang === 'en' ? 'Weekly Timeline' : 'Cronograma Semanal'}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-bold">
                            {safeProgram.length > 0 ? Math.round((uniqueDaysDone.size / safeProgram.length) * 100) : 0}% {lang === 'en' ? 'DONE' : 'COMPLETADO'}
                        </span>
                    </div>
                    <div className="calendar-timeline gap-3 py-1 px-1">
                        {safeProgram.map((day, idx) => {
                            const isDone = uniqueDaysDone.has(idx);
                            const isNext = idx === nextWorkoutIdx;
                            const isSelected = idx === selectedDayIdx;

                            let cardBorderClass = 'border-zinc-800';
                            let cardBgClass = 'bg-zinc-950/40';
                            let textClass = 'text-zinc-500';

                            if (isSelected) {
                                cardBorderClass = 'border-primary-500/40 ring-1 ring-primary-500/20';
                                cardBgClass = 'bg-primary-500/5 shadow-[0_0_15px] shadow-primary-500/10';
                                textClass = 'text-white font-bold';
                            } else if (isDone) {
                                cardBorderClass = 'border-green-500/20';
                                cardBgClass = 'bg-green-950/5';
                                textClass = 'text-zinc-400';
                            } else if (isNext) {
                                cardBorderClass = 'border-zinc-700';
                                cardBgClass = 'bg-zinc-900/40';
                                textClass = 'text-zinc-300';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setSelectedDayIdx(idx);
                                    }}
                                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border ${cardBorderClass} ${cardBgClass} w-20 shrink-0 transition-all active:scale-95`}
                                >
                                    <span className={`text-[10px] tracking-wide uppercase font-bold ${textClass}`}>
                                        {lang === 'en' ? `Day ${idx + 1}` : `Día ${idx + 1}`}
                                    </span>
                                    <div className="mt-2.5 flex items-center justify-center">
                                        {isDone ? (
                                            <div className="w-6 h-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                                                <Icon name="Check" size={12} strokeWidth={3} />
                                            </div>
                                        ) : isNext ? (
                                            <div className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20 animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-zinc-800/20 text-zinc-600 flex items-center justify-center border border-zinc-800">
                                                <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Dynamic Selected Day Detail Card */}
                {(() => {
                    const dayDef = safeProgram[selectedDayIdx];
                    if (!dayDef) return null;

                    const isDone = uniqueDaysDone.has(selectedDayIdx);
                    const isNext = selectedDayIdx === nextWorkoutIdx;
                    const isSelectedActive = activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx;

                    // Estimate duration for this day — pre-memoized below the IIFE
                    const dayEstimatedMin = selectedDayEstimatedMin;

                    return (
                        <div 
                            id="tut-up-next"
                            onClick={() => startSession(selectedDayIdx)}
                            role="button"
                            tabIndex={0}
                            className="group relative w-full rounded-[1.5rem] p-6 cursor-pointer active:scale-[0.98] transition-all duration-300 bg-[#1A1A1A] border border-white/5 shadow-lg flex flex-col justify-between min-h-[220px] overflow-hidden"
                        >
                            <div className="relative z-10 flex justify-between items-start">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5 ${
                                        isSelectedActive ? 'bg-primary-500/20 text-primary-400' 
                                        : isDone ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : 'bg-white/5 text-zinc-300'
                                    }`}>
                                        {isSelectedActive && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />}
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {isSelectedActive ? (lang === 'en' ? 'IN PROGRESS' : 'EN CURSO') 
                                            : isDone ? (lang === 'en' ? 'COMPLETED' : 'COMPLETADO') 
                                            : isNext ? (lang === 'en' ? 'UP NEXT' : 'SIGUIENTE') 
                                            : (lang === 'en' ? 'SCHEDULED' : 'PROGRAMADO')}
                                        </span>
                                    </div>

                                    {!isDone && !isSelectedActive && (
                                        <button
                                            onClick={(e) => handleSkipClick(e, selectedDayIdx)}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors duration-fast"
                                            title={t.skipDay}
                                        >
                                            <Icon name="SkipForward" size={20} />
                                        </button>
                                    )}
                                </div>

                                <div className="relative z-10 mt-6 mb-8">
                                    <h3 className="text-4xl font-bold text-white leading-[0.95] tracking-tight mb-3 text-balance">
                                        {String(getTranslated(dayDef.dayName, lang))}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(dayDef.slots || []).slice(0, 3).map((slot: any, sIdx: number) => (
                                            <span
                                                key={sIdx}
                                                className="text-[10px] font-bold uppercase bg-white/10 text-zinc-300 px-2 py-1 rounded-md border border-white/5"
                                            >
                                                {String(tm(slot.muscle))}
                                            </span>
                                        ))}
                                        {(dayDef.slots || []).length > 3 && (
                                            <span className="text-[10px] font-bold uppercase bg-white/10 text-zinc-300 px-2 py-1 rounded-md border border-white/5">
                                                +{(dayDef.slots || []).length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {dayEstimatedMin > 0 && (
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Icon name="Clock" size={11} />
                                                <span className="text-[10px] font-bold">~{dayEstimatedMin} MIN</span>
                                            </div>
                                        )}
                                        {adherencePct !== null && isNext && (
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Icon name="TrendingUp" size={11} />
                                                <span className="text-[10px] font-bold">
                                                    {adherencePct}% {lang === 'es' ? 'adherencia' : 'adherence'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative z-10 flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${isDone ? 'bg-zinc-800 text-zinc-300 shadow-zinc-800/10' : 'bg-primary-500 text-black shadow-primary-500/20 animate-bounce-cta'}`}>
                                        <Icon name={isSelectedActive ? 'Play' : isDone ? 'Repeat' : 'ArrowRight'} size={26} fill="currentColor" />
                                    </div>
                                    <span className="text-sm font-bold text-white">
                                        {isSelectedActive 
                                            ? (lang === 'en' ? 'Resume Workout' : 'Reanudar') 
                                            : isDone 
                                                ? (lang === 'en' ? 'Repeat Workout' : 'Repetir Sesión')
                                                : String(t.tapToStart)}
                                    </span>
                                </div>
                        </div>
                    );
                })()}
            </div>

            {/* Freestyle / CrossFit / Calisthenics quick launcher */}
            {onStartFreeSession && (
                <button
                    id="home-freestyle-btn"
                    onClick={onStartFreeSession}
                    className="w-full flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-white/10 active:scale-[0.98] transition-all group"
                >
                    <div className="flex gap-1.5">
                        <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                            <Icon name="Dumbbell" size={16} />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Icon name="Zap" size={16} />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                            <Icon name="User" size={16} />
                        </div>
                    </div>
                    <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-white">
                            {lang === 'es' ? 'Sesión Libre / CrossFit / Calistenia' : 'Freestyle / CrossFit / Calisthenics'}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                            {lang === 'es' ? 'Sin programa fijo · WODs · Progressions' : 'No fixed program · WODs · Progressions'}
                        </div>
                    </div>
                    <Icon name="ChevronRight" size={18} className="text-zinc-650 group-hover:text-zinc-300 transition-colors" />
                </button>
            )}

            {/* Copy Last Session */}
            {(() => {
                // logs are stored newest-first ([newest, ..., oldest]), so [0] is the most recent
                const lastLog = safeLogs
                    .filter((l: any) => !l.skipped && l.mesoId === activeMeso.id && l.dayIdx < safeProgram.length)[0];
                if (!lastLog) return null;
                const logName = lastLog.name || (lang === 'es' ? 'Última Sesión' : 'Last Session');
                const exNames = (lastLog.exercises || []).slice(0, 3).map((e: any) => {
                    const n = e.name;
                    return typeof n === 'object' ? (n[lang] || n.en || '') : (n || '');
                }).filter(Boolean).join(' · ');
                return (
                    <button
                        onClick={() => startSession(lastLog.dayIdx)}
                        className="w-full flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary-500/30 active:scale-[0.98] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center shrink-0">
                            <Icon name="Repeat" size={18} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="text-sm font-bold text-white">
                                {lang === 'es' ? 'Repetir Última Sesión' : 'Repeat Last Session'}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                                {exNames || logName}
                            </div>
                        </div>
                        <Icon name="ChevronRight" size={18} className="text-zinc-650 group-hover:text-zinc-300 transition-colors shrink-0" />
                    </button>
                );
            })()}

            {/* Consistency Heatmap */}
            <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="Activity" size={16} className="text-zinc-500" />
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t.consistency}</h3>
                </div>
                <ActivityHeatmap logs={safeLogs} />
            </div>


            <TutorialOverlay
                steps={homeTutorialSteps}
                isActive={!tutorialProgress.home}
                onComplete={() => markTutorialSeen('home')}
            />

            {/* --- MODALS --- */}

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}

            {/* Guidelines Modal */}
            <GuidelinesModal
                isOpen={showGuidelines}
                onClose={() => setShowGuidelines(false)}
                images={currentGuidelineImages}
            />

            {/* Skip Confirmation */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={skipConfirmationId !== null}
                    title={t.skipDay}
                    description={t.skipDayConfirm}
                    onConfirm={confirmSkip}
                    onCancel={() => setSkipConfirmationId(null)}
                    confirmText={t.skip}
                    cancelText={t.cancel}
                    variant="danger"
                />
            </Suspense>

            {/* MESO SETTINGS MODAL */}
            {showMesoSettings && (
                <div className="fixed inset-0 z-modal bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowMesoSettings(false)}>
                    <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">{t.mesoConfig}</h3>
                            <button onClick={() => setShowMesoSettings(false)} className="text-zinc-400 hover:text-white">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Target Weeks */}
                            <div id="tut-meso-duration">
                                <label className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider block mb-2 px-1">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setEditWeeks(Math.max(1, editWeeks - 1))}
                                        className="w-10 h-10 rounded-lg bg-zinc-850 border border-zinc-750 flex items-center justify-center text-zinc-400 hover:text-white"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="flex-1 text-center font-mono text-2xl font-bold text-white">{editWeeks}</span>
                                    <button
                                        onClick={() => setEditWeeks(editWeeks + 1)}
                                        className="w-10 h-10 rounded-lg bg-zinc-850 border border-zinc-750 flex items-center justify-center text-zinc-400 hover:text-white"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Deload Toggle */}
                            <div id="tut-meso-deload" className="flex items-center justify-between bg-primary-500/10 border border-primary-500/20 p-4 rounded-xl">
                                <div>
                                    <span className="text-sm font-bold text-primary-200 block mb-1">{t.deloadMode}</span>
                                    <span className="text-[10px] text-primary-400/70 block leading-tight">{t.deloadDesc}</span>
                                </div>
                                <button
                                    onClick={() => setEditDeload(!editDeload)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${editDeload ? 'bg-primary-500 shadow-[0_2px_8px] shadow-primary-500/30' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${editDeload ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Edit Template Link */}
                            <button
                                id="tut-meso-edit"
                                onClick={() => { setShowMesoSettings(false); onEditProgram(); }}
                                className="w-full py-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <Icon name="Layout" size={16} /> {t.editTemplate}
                            </button>

                            {/* Notes */}
                            <div id="tut-meso-notes">
                                <label className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider block mb-2 px-1">{t.mesoNotes}</label>
                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder={t.mesoNotesPlaceholder}
                                    className="w-full bg-zinc-800 text-white text-sm p-3 rounded-xl border border-zinc-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none min-h-[80px] transition-all glow-input-neon"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button onClick={handleSaveSettings} fullWidth size="lg">
                                {t.save}
                            </Button>

                            <button
                                onClick={() => { setShowMesoSettings(false); setShowCompleteModal('meso'); }}
                                className="w-full py-3 text-xs font-bold text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-colors"
                            >
                                {t.finishCycle}
                            </button>
                        </div>

                        {/* INTERNAL TUTORIAL */}
                        <TutorialOverlay
                            steps={mesoSettingsTutorialSteps}
                            isActive={!tutorialProgress.mesoSettings}
                            onComplete={() => markTutorialSeen('mesoSettings')}
                        />
                    </div>
                </div>
            )}

            {showCompleteModal && (
                <div className="fixed inset-0 z-modal bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center">
                        {showCompleteModal === 'meso' ? (
                            <>
                                <h3 className="text-white font-bold text-xl mb-2">{t.finishCycle}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{t.finishMesoConfirm}</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)} fullWidth>{t.cancel}</Button>
                                    <Button onClick={() => handleFinishMeso()} fullWidth>{t.completed}</Button>
                                </div>
                            </>
                        ) : ( // 'week'
                            <>
                                <h3 className="text-white font-bold text-xl mb-2">{t.completeWeek}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{lang === 'en' ? 'Advance to the next week of your mesocycle?' : '¿Avanzar a la siguiente semana de tu mesociclo?'}</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)} fullWidth>{t.cancel}</Button>
                                    <Button onClick={handleFinishWeek} fullWidth>{lang === 'en' ? 'Next Week' : 'Siguiente Semana'}</Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


