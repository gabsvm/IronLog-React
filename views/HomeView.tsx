
import React, { useState, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, FULL_BODY_TEMPLATE, DEFAULT_TEMPLATE, METABOLITE_TEMPLATE, RESENS_TEMPLATE, UPPER_LOWER_TEMPLATE, WIZARD_TEMPLATE, MALE_PHYSIQUE_TEMPLATE } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { getTranslated, formatDate } from '../utils';
import { MesoType, FeedbackEntry } from '../types';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { Logo } from '../components/ui/Logo';
import { TutorialOverlay } from '../components/ui/TutorialOverlay'; // Import Tutorial

// Lazy load the AI Chat component to save bundle size
const IronCoachChat = React.lazy(() => import('../components/ai/IronCoachChat').then(module => ({ default: module.IronCoachChat })));

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ startSession, onEditProgram, onSkipSession }) => {
    const { activeMeso, activeSession, program, setActiveMeso, lang, logs, config, rpFeedback, setProgram, exercises, tutorialProgress, markTutorialSeen } = useApp();
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en']; // Safe fallback
    
    // Safer Muscle Translator
    const tm = (key: string) => {
        if (!key || typeof key !== 'string') return 'Unknown';
        const val = (t.muscle as any)[key];
        return typeof val === 'string' ? val : key;
    };
    
    // Modal state
    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);
    const [showMesoSettings, setShowMesoSettings] = useState(false);
    const [showStartWizard, setShowStartWizard] = useState(false);
    const [showRoutineGuide, setShowRoutineGuide] = useState(false);
    const [skipConfirmationId, setSkipConfirmationId] = useState<number | null>(null);
    const [showAIChat, setShowAIChat] = useState(false);

    // New Meso State
    const [newMesoType, setNewMesoType] = useState<MesoType>('hyp_1');

    // Defensive: Ensure program is an array
    const safeProgram = Array.isArray(program) ? program : [];
    const safeLogs = Array.isArray(logs) ? logs : [];

    const handleStartMeso = () => {
        let planToUse = safeProgram;

        // Apply specific template based on selection
        switch (newMesoType) {
            case 'hyp_1':
                planToUse = DEFAULT_TEMPLATE;
                setProgram(DEFAULT_TEMPLATE);
                break;
            case 'hyp_2':
                planToUse = UPPER_LOWER_TEMPLATE;
                setProgram(UPPER_LOWER_TEMPLATE);
                break;
            case 'metabolite':
                planToUse = METABOLITE_TEMPLATE;
                setProgram(METABOLITE_TEMPLATE);
                break;
            case 'resensitization':
                planToUse = RESENS_TEMPLATE;
                setProgram(RESENS_TEMPLATE);
                break;
            case 'full_body':
                planToUse = FULL_BODY_TEMPLATE;
                setProgram(FULL_BODY_TEMPLATE);
                break;
            case 'wizard':
                planToUse = WIZARD_TEMPLATE;
                setProgram(WIZARD_TEMPLATE);
                break;
            case 'male_physique':
                planToUse = MALE_PHYSIQUE_TEMPLATE;
                setProgram(MALE_PHYSIQUE_TEMPLATE);
                break;
            default:
                break;
        }

        const initialPlan = planToUse.map(day => (day?.slots || []).map(slot => slot.exerciseId || null)); 
        
        let targetWeeks = 5;
        if (newMesoType === 'resensitization') targetWeeks = 4;
        
        setActiveMeso({ 
            id: Date.now(), 
            week: 1, 
            plan: initialPlan, 
            targetWeeks: targetWeeks, 
            isDeload: false,
            mesoType: newMesoType,
            name: String(t.phases[newMesoType] || t.unnamedCycle)
        });
        setShowStartWizard(false);
    };

    // ... (KEEP ALL EXISTING REPORT AND UTILITY FUNCTIONS) ...
    const generateMesoReport = () => {
        if (!activeMeso) return null;
        
        const mesoLogs = safeLogs.filter(l => l.mesoId === activeMeso.id).sort((a,b) => a.endTime - b.endTime);
        if (mesoLogs.length === 0) return null;

        const startTime = mesoLogs[0].endTime;
        const endTime = mesoLogs[mesoLogs.length - 1].endTime;
        
        const volumeByWeek: Record<number, Record<string, number>> = {};
        
        mesoLogs.forEach(log => {
            if (log.skipped) return;
            if (!volumeByWeek[log.week]) volumeByWeek[log.week] = {};
            (log.exercises || []).forEach(ex => {
                const sets = (ex.sets || []).filter(s => s.completed).length;
                if (!volumeByWeek[log.week][ex.muscle]) volumeByWeek[log.week][ex.muscle] = 0;
                volumeByWeek[log.week][ex.muscle] += sets;
            });
        });

        const exerciseProgress: Record<string, any> = {};
        
        mesoLogs.forEach(log => {
            if (log.skipped) return;
            (log.exercises || []).forEach(ex => {
                const bestSet = (ex.sets || []).filter(s => s.completed).reduce((prev: any, curr: any) => {
                     return (Number(curr.weight) > Number(prev?.weight || 0)) ? curr : prev;
                }, null);

                if (bestSet) {
                    const exName = getTranslated(ex.name, 'en');
                    if (!exerciseProgress[exName]) {
                        exerciseProgress[exName] = { start: null, end: null, id: ex.id, muscle: ex.muscle };
                    }
                    
                    const setStr = `${bestSet.weight}kg x ${bestSet.reps}`;
                    if (!exerciseProgress[exName].start) {
                        exerciseProgress[exName].start = setStr;
                    }
                    exerciseProgress[exName].end = setStr; 
                }
            });
        });

        const report = {
            mesoName: activeMeso.name || "Unnamed Cycle",
            mesoType: activeMeso.mesoType,
            dateStart: formatDate(startTime, lang),
            dateEnd: formatDate(endTime, lang),
            durationWeeks: activeMeso.week,
            totalWorkouts: mesoLogs.length,
            volumeSummary: volumeByWeek,
            progression: exerciseProgress,
            feedback: rpFeedback[activeMeso.id] || {}
        };

        return report;
    };

    const handleFinishMeso = (exportReport: boolean) => {
        if (exportReport) {
            const report = generateMesoReport();
            if (report) {
                const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ironlog_meso_report_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
            }
        }
        setActiveMeso(null);
        setShowCompleteModal(null);
    };

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

    const handleAdvanceWeek = () => {
        if (!activeMeso) return;

        let changesReport: string[] = [];
        if (config.rpEnabled) {
            const currentFeedback = rpFeedback[activeMeso.id]?.[activeMeso.week];
            if (currentFeedback) {
                const adjustments: Record<string, number> = {};
                
                Object.entries(currentFeedback).forEach(([muscle, val]) => {
                     const data = val as FeedbackEntry;
                     if (data.adjustment !== 0) {
                         adjustments[muscle] = data.adjustment;
                     }
                });

                if (Object.keys(adjustments).length > 0) {
                    setProgram(prev => (Array.isArray(prev) ? prev : []).map(day => ({
                        ...day,
                        slots: (day.slots || []).map(slot => {
                            const adj = adjustments[slot.muscle];
                            if (adj) {
                                const newTarget = Math.max(1, Math.min(12, slot.setTarget + adj));
                                if (newTarget !== slot.setTarget) {
                                    const msg = `${tm(slot.muscle)}: ${adj > 0 ? '+1' : '-1'} set (${newTarget})`;
                                    if (!changesReport.includes(msg)) changesReport.push(msg);
                                    return { ...slot, setTarget: newTarget };
                                }
                            }
                            return slot;
                        })
                    })));
                }
            }
        }

        const msg = changesReport.length > 0 
            ? `${String(t.applyingChanges)}\n• ${changesReport.join('\n• ')}` 
            : null;
        
        if (msg) alert(msg);
        
        const nextWeek = activeMeso.week + 1;
        const shouldBeDeload = activeMeso.targetWeeks ? nextWeek >= activeMeso.targetWeeks : false;

        setActiveMeso(prev => prev ? { 
            ...prev, 
            week: nextWeek,
            isDeload: shouldBeDeload 
        } : null);
        
        setShowCompleteModal(null);
    };

    const handleMesoSettingUpdate = (field: string, val: any) => {
        if (!activeMeso) return;
        setActiveMeso(prev => prev ? { ...prev, [field]: val } : null);
    };

    // Helper to render template buttons
    const TemplateButton = ({ type }: { type: MesoType }) => (
        <button
            onClick={() => setNewMesoType(type)}
            className={`w-full text-left p-3 rounded-xl border transition-all mb-2 ${
                newMesoType === type 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' 
                : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
            }`}
        >
            <div className="font-bold mb-0.5 text-sm">{String(t.phases?.[type] || type)}</div>
            <div className="text-[10px] opacity-70 leading-relaxed">{String(t.phaseDesc?.[type] || "")}</div>
        </button>
    );

    if (!activeMeso) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-grid-pattern">
                {/* ... (EXISTING INTRO UI) ... */}
                <div className="relative group cursor-pointer flex justify-center items-center -space-x-8" onClick={() => setShowStartWizard(true)}>
                    <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-xl">
                        <img 
                            src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=400&auto=format&fit=crop" 
                            className="w-full h-full object-cover grayscale" 
                            alt="Workout 1"
                            width="128" height="128"
                            loading="eager"
                        />
                    </div>
                    <div className="relative z-0 w-36 h-36 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-2xl">
                        <img 
                            src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400&auto=format&fit=crop" 
                            className="w-full h-full object-cover grayscale" 
                            alt="Workout 2"
                            width="144" height="144"
                            loading="eager"
                        />
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
                                {/* Beginner / Reset */}
                                <div>
                                    <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        {String(t.cat.beginner)}
                                    </div>
                                    <TemplateButton type="resensitization" />
                                </div>

                                {/* Intermediate */}
                                <div>
                                    <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        {String(t.cat.intermediate)}
                                    </div>
                                    <TemplateButton type="wizard" />
                                    <TemplateButton type="hyp_2" />
                                </div>

                                {/* Advanced */}
                                <div>
                                    <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                        {String(t.cat.advanced)}
                                    </div>
                                    <TemplateButton type="male_physique" />
                                    <TemplateButton type="hyp_1" />
                                    <TemplateButton type="full_body" />
                                    <TemplateButton type="metabolite" />
                                </div>
                            </div>

                            <div className="shrink-0 p-6 pt-2 border-t border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900 rounded-b-2xl">
                                <Button onClick={handleStartMeso} fullWidth size="lg">
                                    {String(t.createAndSelect)}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const logsForWeek = safeLogs.filter(l => l.mesoId === activeMeso.id && l.week === activeMeso.week);
    const uniqueDaysDone = new Set(logsForWeek.map(l => l.dayIdx));
    const uniqueDaysDoneCount = uniqueDaysDone.size;
    const totalDays = safeProgram.length;
    const weekComplete = uniqueDaysDoneCount >= totalDays && totalDays > 0;
    const isDeload = !!activeMeso.isDeload;

    let nextWorkoutIdx = -1;
    for (let i = 0; i < totalDays; i++) {
        if (!uniqueDaysDone.has(i)) {
            nextWorkoutIdx = i;
            break;
        }
    }
    if (nextWorkoutIdx === -1 && weekComplete) {
        nextWorkoutIdx = -1;
    }

    // Check if there is an active suspended session for the current day
    const isSessionActive = activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === nextWorkoutIdx;

    const nextDayDef = nextWorkoutIdx !== -1 ? safeProgram[nextWorkoutIdx] : null;

    // Tutorial Steps for Home
    const homeTutorialSteps = [
        { targetId: 'tut-up-next', title: t.tutorial.home[0].title, text: t.tutorial.home[0].text, position: 'bottom' as const },
        { targetId: 'tut-settings-btn', title: t.tutorial.home[1].title, text: t.tutorial.home[1].text, position: 'bottom' as const },
        { targetId: 'tut-nav-bar', title: t.tutorial.home[2].title, text: t.tutorial.home[2].text, position: 'top' as const }
    ];

    return (
        <div className="p-4 space-y-6 pb-safe bg-grid-pattern min-h-full relative">
            <div className="flex justify-between items-start pt-2">
                <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{String(activeMeso.name)}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isDeload ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                            {String(t.phases?.[activeMeso.mesoType] || "Phase")}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">•</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{String(t.week)} {activeMeso.week} / {activeMeso.targetWeeks}</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowRoutineGuide(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                    >
                        <Icon name="FileText" size={18} />
                    </button>
                    <button 
                        id="tut-settings-btn" // Tutorial ID
                        onClick={() => setShowMesoSettings(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                    >
                        <Icon name="Settings" size={18} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1.5 h-1.5 w-full rounded-full overflow-hidden">
                {safeProgram.map((_, i) => {
                    const isDone = uniqueDaysDone.has(i);
                    return (
                        <div 
                            key={i} 
                            className={`flex-1 h-full rounded-full ${isDone ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} 
                        />
                    );
                })}
            </div>

            {nextDayDef ? (
                <div 
                    id="tut-up-next" // Tutorial ID
                    onClick={() => startSession(nextWorkoutIdx)}
                    className="relative w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl p-6 shadow-2xl shadow-zinc-900/20 dark:shadow-white/5 overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-300"
                >
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/5 px-3 py-1 rounded-full backdrop-blur-sm">
                                <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isSessionActive ? (lang === 'en' ? "IN PROGRESS" : "EN PROGRESO") : String(t.upNext)}
                                </span>
                            </div>
                            
                            {/* Skip Button for the Main Card */}
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

                        <h3 className="text-3xl font-black mb-2 leading-tight tracking-tight">
                            {String(getTranslated(nextDayDef.dayName, lang))}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(nextDayDef.slots || []).slice(0, 3).map((slot, sIdx) => (
                                <span key={sIdx} className="text-[10px] font-bold uppercase bg-white/10 dark:bg-black/5 px-2 py-1 rounded">
                                    {String(tm(slot.muscle))}
                                </span>
                            ))}
                            {(nextDayDef.slots || []).length > 3 && (
                                <span className="text-[10px] font-bold uppercase bg-white/10 dark:bg-black/5 px-2 py-1 rounded">+{(nextDayDef.slots || []).length - 3}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-bold opacity-80">
                            <span>{isSessionActive ? (lang === 'en' ? "RESUME SESSION" : "REANUDAR") : String(t.tapToStart)}</span>
                            <Icon name="ArrowRight" size={16} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-green-500/30">
                        <Icon name="Check" size={32} strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-black text-green-600 dark:text-green-400 mb-2">{String(t.weekCompleteTitle)}</h3>
                    <p className="text-sm text-green-700/70 dark:text-green-300/70 mb-6">{String(t.weekCompleteDesc)}</p>
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
                    
                    if (isNext) return null;

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
                                    {(day.slots || []).map(s => String(tm(s.muscle))).join(', ')}
                                </div>
                            </div>
                            {!isDone && (
                                <button onClick={(e) => handleSkipClick(e, idx)} className="text-zinc-300 hover:text-zinc-500 p-2">
                                    <Icon name="SkipForward" size={16} />
                                </button>
                            )}
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
                    onClick={() => setShowAIChat(true)}
                    className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                    <Icon name="Bot" size={24} fill="currentColor" />
                </button>
            </div>

            <TutorialOverlay 
                steps={homeTutorialSteps}
                isActive={!tutorialProgress.home}
                onComplete={() => markTutorialSeen('home')}
            />

            {showAIChat && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center sm:items-center">
                        <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md h-[50vh] rounded-t-3xl flex items-center justify-center">
                            <Icon name="RefreshCw" size={32} className="animate-spin text-zinc-400" />
                        </div>
                    </div>
                }>
                    <IronCoachChat onClose={() => setShowAIChat(false)} />
                </Suspense>
            )}

             {showRoutineGuide && activeMeso && (
                 /* ... existing modal code ... */
                 <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowRoutineGuide(false)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl p-0 shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50/50 dark:bg-white/[0.02]">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{String(t.routineGuide)}</h3>
                                <p className="text-xs text-zinc-500">{String(t.executionInfo)}</p>
                            </div>
                            <button onClick={() => setShowRoutineGuide(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={24} /></button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 space-y-8 scroll-container">
                            {safeProgram.map((day, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h4 className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-wider sticky top-0 bg-white dark:bg-zinc-900 py-2 z-10 border-b border-zinc-100 dark:border-white/5">
                                        {String(getTranslated(day.dayName, lang))}
                                    </h4>
                                    <div className="space-y-3">
                                        {day.slots?.map((slot, sIdx) => {
                                            const exId = activeMeso.plan?.[idx]?.[sIdx] || slot.exerciseId;
                                            const exDef = exId ? exercises.find(e => e.id === exId) : null;
                                            
                                            if (!exDef) return null;

                                            return (
                                                <div key={sIdx} className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 border border-zinc-100 dark:border-white/5">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{String(getTranslated(exDef.name, lang))}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-white/5">{String(tm(slot.muscle))}</span>
                                                    </div>
                                                    {exDef.instructions ? (
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2 italic border-l-2 border-red-500/30 pl-2">
                                                            {String(getTranslated(exDef.instructions, lang))}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-zinc-400 mt-1">{String(t.noData)}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}

            {/* ... (Existing skip and complete modals) ... */}
            {skipConfirmationId !== null && (
                /* ... existing modal code ... */
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setSkipConfirmationId(null)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 flex items-center justify-center mx-auto mb-4">
                                <Icon name="SkipForward" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                {String(t.skipDay)}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {String(t.skipDayConfirm)}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" onClick={() => setSkipConfirmationId(null)}>{String(t.cancel)}</Button>
                            <Button variant="danger" onClick={confirmSkip}>{String(t.skipDay)}</Button>
                        </div>
                    </div>
                </div>
            )}

            {showCompleteModal && (
                /* ... existing modal code ... */
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                {showCompleteModal === 'week' ? String(t.completeWeek) : String(t.finishCycle)}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {showCompleteModal === 'week' ? String(t.completeWeekConfirm) : String(t.finishMesoConfirm)}
                            </p>
                            {showCompleteModal === 'week' && config.rpEnabled && (
                                <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                    <Icon name="Zap" size={12} className="inline mr-1" />
                                    {String(t.autoRegulateDesc)}
                                </p>
                            )}
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

             {showMesoSettings && activeMeso && (
                 /* ... existing modal code ... */
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
                                    placeholder={String(t.massPhase)}
                                    onChange={(e) => handleMesoSettingUpdate('name', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{String(t.targetWeeks)}</label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => handleMesoSettingUpdate('targetWeeks', Math.max(1, (activeMeso.targetWeeks || 4) - 1))}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="font-mono text-2xl font-bold w-12 text-center text-zinc-900 dark:text-white">{activeMeso.targetWeeks || 4}</span>
                                    <button 
                                        onClick={() => handleMesoSettingUpdate('targetWeeks', (activeMeso.targetWeeks || 4) + 1)}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                    <span className="text-sm font-bold text-zinc-500">{String(t.weeks)}</span>
                                </div>
                            </div>

                            <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{String(t.deloadMode)}</div>
                                    <div className="text-xs text-zinc-500 max-w-[180px] leading-tight">{String(t.deloadDesc)}</div>
                                </div>
                                <button 
                                    onClick={() => handleMesoSettingUpdate('isDeload', !activeMeso.isDeload)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${activeMeso.isDeload ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${activeMeso.isDeload ? 'left-6' : 'left-1'}`} />
                                </button>
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

                        <div className="mt-8">
                            <Button fullWidth onClick={() => setShowMesoSettings(false)}>{String(t.save)}</Button>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
