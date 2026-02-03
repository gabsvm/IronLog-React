
import React, { useState, Suspense, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { getTranslated, formatDate } from '../utils';
import { MesoType, FeedbackEntry, GlobalTemplate } from '../types';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { usePro } from '../hooks/usePro';
import { PaywallModal } from '../components/pro/PaywallModal';

// Lazy load the AI Chat component
const IronCoachChat = React.lazy(() => import('../components/ai/IronCoachChat').then(module => ({ default: module.IronCoachChat })));

// --- INTERNAL COMPONENTS ---

// 1. Week Progress Bar
const WeekProgress = React.memo(({ program, logsForWeek, lang }: any) => {
    const safeProgram = Array.isArray(program) ? program : [];
    const uniqueDaysDone = new Set(logsForWeek.map((l: any) => l.dayIdx));

    return (
        <div className="flex items-center gap-1.5 h-1.5 w-full rounded-full overflow-hidden">
            {safeProgram.map((_: any, i: number) => {
                const isDone = uniqueDaysDone.has(i);
                return (
                    <div 
                        key={i} 
                        className={`flex-1 h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} 
                    />
                );
            })}
        </div>
    );
});

// 2. Next Session Card
const NextSessionCard = React.memo(({ nextDayDef, isSessionActive, nextWorkoutIdx, startSession, handleSkipClick, lang, t, tm }: any) => {
    if (!nextDayDef) return (
        <div className="w-full bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] animate-in fade-in">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-green-500/30">
                <Icon name="Check" size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-black text-green-600 dark:text-green-400 mb-2">{String(t.weekCompleteTitle)}</h3>
            <p className="text-sm text-green-700/70 dark:text-green-300/70">{String(t.weekCompleteDesc)}</p>
        </div>
    );

    return (
        <div 
            id="tut-up-next"
            onClick={() => startSession(nextWorkoutIdx)}
            className="relative w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl p-6 shadow-2xl shadow-zinc-900/20 dark:shadow-white/5 overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-300"
        >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/5 px-3 py-1 rounded-full backdrop-blur-sm">
                        <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isSessionActive ? (lang === 'en' ? "IN PROGRESS" : "EN PROGRESO") : String(t.upNext)}
                        </span>
                    </div>
                    
                    {!isSessionActive && (
                        <button 
                            onClick={(e) => handleSkipClick(e, nextWorkoutIdx)}
                            className="p-2 -mr-2 text-zinc-400 hover:text-red-500 transition-colors z-20 relative"
                            title={String(t.skipDay)}
                        >
                            <Icon name="SkipForward" size={20} />
                        </button>
                    )}
                </div>

                <h3 className="text-3xl font-black mb-2 leading-tight tracking-tight line-clamp-2">
                    {String(getTranslated(nextDayDef.dayName, lang))}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-6">
                    {(nextDayDef.slots || []).slice(0, 3).map((slot: any, sIdx: number) => (
                        <span key={sIdx} className="text-[10px] font-bold uppercase bg-white/10 dark:bg-black/5 px-2 py-1 rounded">
                            {String(tm(slot.muscle))}
                        </span>
                    ))}
                    {(nextDayDef.slots || []).length > 3 && (
                        <span className="text-[10px] font-bold uppercase bg-white/10 dark:bg-black/5 px-2 py-1 rounded">+{(nextDayDef.slots || []).length - 3}</span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm font-bold opacity-80 group-hover:gap-3 transition-all">
                    <span>{isSessionActive ? (lang === 'en' ? "RESUME SESSION" : "REANUDAR") : String(t.tapToStart)}</span>
                    <Icon name="ArrowRight" size={16} />
                </div>
            </div>
        </div>
    );
});

// 3. Template Selection Button (Extracted)
interface TemplateButtonProps {
    template: GlobalTemplate;
    isSelected: boolean;
    isPro: boolean;
    lang: any;
    onSelect: (t: GlobalTemplate) => void;
    onCheckPro: (name: string) => void;
}

const TemplateButton = React.memo(({ template, isSelected, isPro, lang, onSelect, onCheckPro }: TemplateButtonProps) => {
    const isLocked = template.isPro && !isPro;

    return (
        <button
            onClick={() => {
                if (isLocked) {
                    onCheckPro(getTranslated(template.title, lang));
                    return;
                }
                onSelect(template);
            }}
            className={`w-full text-left p-3 rounded-xl border transition-all mb-2 relative group overflow-hidden ${
                isSelected 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' 
                : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
            }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-bold mb-0.5 text-sm flex items-center gap-2">
                        {getTranslated(template.title, lang)}
                        {template.isPro && <span className="text-[9px] bg-zinc-900 text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded uppercase font-black tracking-wider">PRO</span>}
                    </div>
                    <div className="text-[10px] opacity-70 leading-relaxed">{getTranslated(template.description, lang)}</div>
                </div>
                {isLocked && <Icon name="Lock" size={16} className="text-zinc-400" />}
            </div>
        </button>
    );
});

// --- MAIN COMPONENT ---

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ startSession, onEditProgram, onSkipSession }) => {
    const { activeMeso, activeSession, program, setActiveMeso, lang, logs, config, rpFeedback, setProgram, exercises, tutorialProgress, markTutorialSeen, globalTemplates } = useApp();
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en']; 
    
    // Pro Hook
    const { isPro, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    
    // Safer Muscle Translator
    const tm = (key: string) => {
        if (!key || typeof key !== 'string') return 'Unknown';
        const val = (t.muscle as any)[key];
        return typeof val === 'string' ? val : key;
    };
    
    // Local UI State
    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);
    const [showMesoSettings, setShowMesoSettings] = useState(false);
    const [showStartWizard, setShowStartWizard] = useState(false);
    const [showRoutineGuide, setShowRoutineGuide] = useState(false);
    const [skipConfirmationId, setSkipConfirmationId] = useState<number | null>(null);
    const [showAIChat, setShowAIChat] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<GlobalTemplate | null>(null);

    const safeProgram = Array.isArray(program) ? program : [];
    const safeLogs = Array.isArray(logs) ? logs : [];

    // MEMOIZED LOGIC (Performance Optimization)
    const { 
        uniqueDaysDone, 
        weekComplete, 
        nextWorkoutIdx, 
        isSessionActive, 
        nextDayDef, 
        logsForWeek 
    } = useMemo(() => {
        if (!activeMeso) return { uniqueDaysDone: new Set(), weekComplete: false, nextWorkoutIdx: -1, isSessionActive: false, nextDayDef: null, logsForWeek: [] };

        const currentWeekLogs = safeLogs.filter(l => l.mesoId === activeMeso.id && l.week === activeMeso.week);
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

        return { uniqueDaysDone: daysDone, weekComplete: isComplete, nextWorkoutIdx: nextIdx, isSessionActive: active, nextDayDef: nextDef, logsForWeek: currentWeekLogs };
    }, [activeMeso, activeSession, safeLogs, safeProgram]);

    const handleStartMeso = () => {
        if (!selectedTemplate) return;

        const planToUse = selectedTemplate.program;
        setProgram(planToUse);

        const initialPlan = planToUse.map(day => (day?.slots || []).map(slot => slot.exerciseId || null)); 
        
        setActiveMeso({ 
            id: Date.now(), 
            week: 1, 
            plan: initialPlan, 
            targetWeeks: selectedTemplate.name === 'resensitization' ? 4 : 5, 
            isDeload: false,
            mesoType: selectedTemplate.name,
            name: String(getTranslated(selectedTemplate.title, lang) || t.unnamedCycle)
        });
        setShowStartWizard(false);
    };

    // --- RENDER HELPERS ---
    const handleSkipClick = (e: React.MouseEvent, dayIdx: number) => {
        e.stopPropagation();
        setSkipConfirmationId(dayIdx);
    };

    const confirmSkip = () => {
        if (onSkipSession && skipConfirmationId !== null) {
            onSkipSession(skipConfirmationId);
        }
        setSkipConfirmationId(null);
    };

    const handleFinishMeso = (exportReport: boolean) => {
        if (exportReport) {
            // Check Pro for Report
            if (!checkPro("Export Reports")) return;
            alert("Report Export not fully implemented in this optimized view. Check console.");
        }
        setActiveMeso(null);
        setShowCompleteModal(null);
    };

    const handleAdvanceWeek = () => {
        if (!activeMeso) return;
        // Simple advance logic
        const nextWeek = activeMeso.week + 1;
        const shouldBeDeload = activeMeso.targetWeeks ? nextWeek >= activeMeso.targetWeeks : false;
        setActiveMeso(prev => prev ? { ...prev, week: nextWeek, isDeload: shouldBeDeload } : null);
        setShowCompleteModal(null);
    };

    const handleOpenChat = () => {
        if (checkPro("IronCoach AI")) {
            setShowAIChat(true);
        }
    };

    // Empty State (No Active Meso)
    if (!activeMeso) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-grid-pattern">
                <div className="relative group cursor-pointer flex justify-center items-center -space-x-8" onClick={() => setShowStartWizard(true)}>
                    <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-xl">
                        <img src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale" />
                    </div>
                    <div className="relative z-0 w-36 h-36 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale" />
                    </div>
                    <div className="absolute -bottom-2 right-10 bg-red-600 text-white p-2 rounded-full shadow-lg z-20">
                        <Icon name="Plus" size={20} />
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tighter">IronLog <span className="text-red-600">PRO</span></h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                        {String(t.onb?.s1_desc || t.loading)}
                    </p>
                </div>

                <div className="w-full max-w-xs space-y-4">
                    <Button onClick={() => setShowStartWizard(true)} size="lg" fullWidth className="shadow-xl shadow-red-500/20 py-4 text-lg">
                        {String(t.startMeso)}
                    </Button>
                    <Button variant="ghost" onClick={onEditProgram} size="sm" fullWidth className="text-zinc-400">
                        <Icon name="Edit" size={14} /> {String(t.editTemplate)}
                    </Button>
                </div>

                {showStartWizard && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-0 shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-6 pb-4 shrink-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{String(t.startMeso)}</h3>
                                <button onClick={() => setShowStartWizard(false)} className="text-zinc-400"><Icon name="X" size={24} /></button>
                            </div>
                            <div className="space-y-6 overflow-y-auto scroll-container flex-1 px-6 pb-6">
                                {/* DYNAMIC TEMPLATES FROM CONTEXT */}
                                {globalTemplates.map(tpl => (
                                    <TemplateButton 
                                        key={tpl.id} 
                                        template={tpl}
                                        isSelected={selectedTemplate?.id === tpl.id}
                                        isPro={isPro}
                                        lang={lang}
                                        onSelect={setSelectedTemplate}
                                        onCheckPro={(featureName) => checkPro(featureName)}
                                    />
                                ))}
                            </div>
                            <div className="shrink-0 p-6 pt-2 border-t border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900 rounded-b-2xl">
                                <Button onClick={handleStartMeso} fullWidth size="lg">{String(t.createAndSelect)}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const homeTutorialSteps = [
        { targetId: 'tut-up-next', title: t.tutorial.home[0].title, text: t.tutorial.home[0].text, position: 'bottom' as const },
        { targetId: 'tut-settings-btn', title: t.tutorial.home[1].title, text: t.tutorial.home[1].text, position: 'bottom' as const },
        { targetId: 'tut-nav-bar', title: t.tutorial.home[2].title, text: t.tutorial.home[2].text, position: 'top' as const }
    ];

    // --- MAIN VIEW RENDER ---
    return (
        <div className="p-4 space-y-6 pb-safe bg-grid-pattern min-h-full relative">
            <div className="flex justify-between items-start pt-2">
                <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{String(activeMeso.name)}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${activeMeso.isDeload ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                            {String(t.phases?.[activeMeso.mesoType] || activeMeso.mesoType)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">•</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{String(t.week)} {activeMeso.week} / {activeMeso.targetWeeks}</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setShowRoutineGuide(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                        <Icon name="FileText" size={18} />
                    </button>
                    <button id="tut-settings-btn" onClick={() => setShowMesoSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                        <Icon name="Settings" size={18} />
                    </button>
                </div>
            </div>

            <WeekProgress program={safeProgram} logsForWeek={logsForWeek} />

            <NextSessionCard 
                nextDayDef={nextDayDef} 
                isSessionActive={isSessionActive} 
                nextWorkoutIdx={nextWorkoutIdx} 
                startSession={startSession} 
                handleSkipClick={handleSkipClick} 
                lang={lang} 
                t={t}
                tm={tm}
            />

            {weekComplete && !nextDayDef && (
                <div className="flex justify-center mt-4">
                    <Button onClick={() => setShowCompleteModal('week')} size="sm" className="bg-green-600 hover:bg-green-500 text-white border-none shadow-green-600/20">
                        {String(t.completeWeek)}
                    </Button>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">{String(t.schedule)}</h4>
                {safeProgram.map((day, idx) => {
                    const isDone = uniqueDaysDone.has(idx);
                    const isNext = idx === nextWorkoutIdx;
                    if (isNext) return null; // Don't duplicate next session

                    return (
                        <div 
                            key={idx}
                            onClick={() => !isDone && startSession(idx)}
                            className={`flex items-center p-4 rounded-2xl border transition-all ${
                                isDone 
                                ? 'bg-zinc-50 dark:bg-zinc-900/50 border-transparent opacity-60' 
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 active:scale-[0.98]'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 ${isDone ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                {isDone ? <Icon name="Check" size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                            <div className="flex-1">
                                <div className={`font-bold text-sm ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>
                                    {String(getTranslated(day.dayName, lang))}
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                                    {(day.slots || []).map((s: any) => String(tm(s.muscle))).join(', ')}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-white/5 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Icon name="TrendingUp" size={14} /> {String(t.consistency)}
                </h3>
                <ActivityHeatmap logs={safeLogs} />
            </div>

            <div className="fixed bottom-24 right-4 z-30">
                <button
                    onClick={handleOpenChat}
                    className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform ${isPro ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}
                >
                    {isPro ? <Icon name="Bot" size={24} fill="currentColor" /> : <Icon name="Lock" size={20} />}
                </button>
            </div>

            <TutorialOverlay 
                steps={homeTutorialSteps}
                isActive={!tutorialProgress.home}
                onComplete={() => markTutorialSeen('home')}
            />

            {/* --- MODALS --- */}
            {showAIChat && (
                <Suspense fallback={null}>
                    <IronCoachChat onClose={() => setShowAIChat(false)} />
                </Suspense>
            )}
            
            {showPaywall && (
                <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
            )}

            {skipConfirmationId !== null && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setSkipConfirmationId(null)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <Icon name="SkipForward" size={32} className="mx-auto text-orange-500 mb-4" />
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{String(t.skipDay)}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{String(t.skipDayConfirm)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" onClick={() => setSkipConfirmationId(null)}>{String(t.cancel)}</Button>
                            <Button variant="danger" onClick={confirmSkip}>{String(t.skipDay)}</Button>
                        </div>
                    </div>
                </div>
            )}

            {showCompleteModal && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                {showCompleteModal === 'week' ? String(t.completeWeek) : String(t.finishCycle)}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {showCompleteModal === 'week' ? String(t.completeWeekConfirm) : String(t.finishMesoConfirm)}
                            </p>
                        </div>
                        <div className={`grid ${showCompleteModal === 'meso' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-3'}`}>
                             {showCompleteModal === 'week' ? (
                                <>
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)}>{String(t.cancel)}</Button>
                                    <Button onClick={handleAdvanceWeek}>{String(t.completed)}</Button>
                                </>
                             ) : (
                                 <div className="flex flex-col gap-3">
                                     <Button onClick={() => handleFinishMeso(true)} className="bg-green-600 hover:bg-green-500 shadow-green-600/20">
                                        <Icon name="DownloadCloud" size={18} /> {String(t.exportReport)}
                                     </Button>
                                     <Button variant="secondary" onClick={() => handleFinishMeso(false)}>
                                        {String(t.justFinish)}
                                     </Button>
                                     <button onClick={() => setShowCompleteModal(null)} className="text-xs text-zinc-400 font-bold py-2">{String(t.cancel)}</button>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {showMesoSettings && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowMesoSettings(false)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-white/5 pb-4">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{String(t.mesoConfig)}</h3>
                            <button onClick={() => setShowMesoSettings(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={20} /></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{String(t.mesoName)}</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-red-500"
                                    value={activeMeso.name || ''}
                                    onChange={(e) => setActiveMeso(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowCompleteModal('meso')} 
                                fullWidth
                                className="text-red-500 border border-red-500/20 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                {String(t.finishCycle)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
