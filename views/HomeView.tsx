
import React, { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { getTranslated } from '../utils';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { usePro } from '../hooks/usePro';
import { PaywallModal } from '../components/pro/PaywallModal';
import { GlobalTemplate, ProgramDay } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useFatigueAI } from '../hooks/useFatigueAI';

// Lazy load the AI Chat component
const GainsLabChat = React.lazy(() => import('../components/ai/GainsLabChat').then(module => ({ default: module.GainsLabChat })));

// --- INTERNAL COMPONENTS ---

// New Guidelines Modal with Zoom & Pan Logic
const GuidelinesModal = ({ isOpen, onClose, images }: { isOpen: boolean, onClose: () => void, images?: string[] }) => {
    const [idx, setIdx] = useState(0);
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });

    // Reset state when opening or changing page
    useEffect(() => {
        if (isOpen) {
            setIdx(0);
            resetZoom();
        }
    }, [isOpen]);

    useEffect(() => {
        resetZoom();
    }, [idx]);

    const resetZoom = () => {
        setScale(1);
        setPos({ x: 0, y: 0 });
    };

    if (!isOpen || !images || images.length === 0) return null;

    const currentImg = images[idx];
    const hasNext = idx < images.length - 1;
    const hasPrev = idx > 0;

    const handleDoubleTap = () => {
        if (scale > 1) {
            resetZoom();
        } else {
            setScale(2.5);
            setPos({ x: 0, y: 0 }); // Center zoom for simplicity
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (scale === 1) return;
        setIsDragging(true);
        startPos.current = {
            x: e.touches[0].clientX - pos.x,
            y: e.touches[0].clientY - pos.y
        };
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || scale === 1) return;
        e.preventDefault(); // Prevent scrolling the body
        const x = e.touches[0].clientX - startPos.current.x;
        const y = e.touches[0].clientY - startPos.current.y;
        setPos({ x, y });
    };

    const onTouchEnd = () => setIsDragging(false);

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
            {/* Header with Zoom Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/90 to-transparent pt-safe">
                <h3 className="text-white font-black text-lg uppercase flex items-center gap-2 drop-shadow-md">
                    <Icon name="Info" size={20} className="text-blue-500" /> Guidelines
                </h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => setScale(s => Math.max(1, s - 0.5))}
                        className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/10 backdrop-blur-md active:bg-zinc-800"
                    >
                        <Icon name="Minus" size={20} />
                    </button>
                    <button
                        onClick={() => setScale(s => Math.min(4, s + 0.5))}
                        className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/10 backdrop-blur-md active:bg-zinc-800"
                    >
                        <Icon name="Plus" size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 border border-white/10 shadow-lg"
                    >
                        <Icon name="X" size={24} />
                    </button>
                </div>
            </div>

            {/* Image Viewer Container */}
            <div
                className="flex-1 overflow-hidden relative flex items-center justify-center touch-none bg-zinc-950"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onDoubleClick={handleDoubleTap}
            >
                <img
                    src={currentImg}
                    alt={`Page ${idx + 1}`}
                    className="max-w-none transition-transform duration-100 ease-out select-none pointer-events-none"
                    style={{
                        transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                        width: '100%',
                        height: 'auto',
                        maxHeight: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>

            {/* Navigation Controls - Raised to avoid bottom nav overlap */}
            {images.length > 1 && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center gap-6 z-50 pointer-events-none pb-safe">
                    <button
                        onClick={() => setIdx(i => Math.max(0, i - 1))}
                        disabled={!hasPrev}
                        className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all shadow-2xl ${hasPrev ? 'bg-zinc-900 text-white border-zinc-700 active:scale-95 hover:bg-zinc-800' : 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50'}`}
                    >
                        <Icon name="ChevronLeft" size={28} />
                    </button>

                    <span className="text-sm font-black text-white bg-zinc-900 px-4 py-2 rounded-full backdrop-blur-xl border border-zinc-700 shadow-2xl min-w-[80px] text-center">
                        {idx + 1} / {images.length}
                    </span>

                    <button
                        onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
                        disabled={!hasNext}
                        className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all shadow-2xl ${hasNext ? 'bg-zinc-900 text-white border-zinc-700 active:scale-95 hover:bg-zinc-800' : 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50'}`}
                    >
                        <Icon name="ChevronRight" size={28} />
                    </button>
                </div>
            )}

            {/* Helper Text */}
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-40 opacity-60 pb-safe">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest bg-black/40 inline-block px-3 py-1.5 rounded-full backdrop-blur border border-white/5">
                    Double tap to zoom • Drag to pan
                </p>
            </div>
        </div>
    );
};

const TemplateSelector = ({
    onClose,
    onSelectTemplate,
    onCreateCustom,
    templates,
    t,
    lang
}: {
    onClose: () => void,
    onSelectTemplate: (tpl: GlobalTemplate) => void,
    onCreateCustom: () => void,
    templates: GlobalTemplate[],
    t: any,
    lang: string
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-black text-white">{t.startMeso}</h2>
                <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
                    <Icon name="X" size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-container">
                {/* Option 1: Scratch */}
                <button
                    onClick={onCreateCustom}
                    className="w-full p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500 transition-all group text-left flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                        <Icon name="Edit" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{lang === 'en' ? "Design from Scratch" : "Crear desde Cero"}</h3>
                        <p className="text-xs text-zinc-500">{lang === 'en' ? "Empty canvas. You choose the exercises." : "Lienzo vacío. Tú eliges los ejercicios."}</p>
                    </div>
                </button>

                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{lang === 'en' ? "OR CHOOSE TEMPLATE" : "O ELIGE PLANTILLA"}</span>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                {/* Templates List */}
                <div className="grid gap-3">
                    {templates.map(tpl => (
                        <button
                            key={tpl.id}
                            onClick={() => onSelectTemplate(tpl)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-left hover:border-primary-600/50 transition-colors relative overflow-hidden group"
                        >
                            {/* Pro Badge */}
                            {tpl.isPro && (
                                <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-500 text-[9px] font-black px-2 py-0.5 rounded border border-yellow-500/30 uppercase tracking-wider">
                                    PRO
                                </div>
                            )}

                            <h3 className="font-bold text-white text-lg pr-8">{getTranslated(tpl.title, lang as any)}</h3>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{getTranslated(tpl.description, lang as any)}</p>

                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 px-2 py-1 rounded">
                                    {tpl.program.length} {lang === 'en' ? 'Days' : 'Días'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const WeekProgress = React.memo(({ program, logsForWeek }: any) => {
    const safeProgram = Array.isArray(program) ? program : [];
    const uniqueDaysDone = new Set(logsForWeek.map((l: any) => l.dayIdx));

    return (
        <div className="flex gap-1.5 w-full mb-6">
            {safeProgram.map((_: any, i: number) => {
                const isDone = uniqueDaysDone.has(i);
                return (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full flex-1 transition-all duration-700 origin-left ${isDone ? 'bg-gradient-to-r from-primary-600 to-orange-500 shadow-[0_0_8px_rgba(220,38,38,0.4)]' : 'bg-zinc-800'}`}
                        style={{ transitionDelay: `${i * 80}ms` }}
                    />
                );
            })}
        </div>
    );
});

const NextSessionCard = React.memo(({ nextDayDef, isSessionActive, nextWorkoutIdx, startSession, handleSkipClick, lang, t, tm }: any) => {
    if (!nextDayDef) return (
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[220px] animate-in-up">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 ring-1 ring-green-500/20">
                <Icon name="Check" size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{String(t.weekCompleteTitle)}</h3>
            <p className="text-zinc-400">{String(t.weekCompleteDesc)}</p>
        </div>
    );

    return (
        <div
            id="tut-up-next"
            onClick={() => startSession(nextWorkoutIdx)}
            className="group relative w-full rounded-[2rem] p-1 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-300"
        >
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 rounded-[2rem]"></div>

            {/* Inner Content */}
            <div className="relative bg-zinc-900 h-full rounded-[1.8rem] p-6 flex flex-col justify-between min-h-[260px] border border-white/5 shadow-2xl overflow-hidden">

                {/* Background Decor */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary-600/20 transition-colors duration-500"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div className={`
                        inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5
                        ${isSessionActive ? 'bg-primary-500/20 text-red-400' : 'bg-white/5 text-zinc-300'}
                    `}>
                        {isSessionActive && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isSessionActive ? (lang === 'en' ? "IN PROGRESS" : "EN CURSO") : String(t.upNext)}
                        </span>
                    </div>

                    {!isSessionActive && (
                        <button
                            onClick={(e) => handleSkipClick(e, nextWorkoutIdx)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <Icon name="SkipForward" size={20} />
                        </button>
                    )}
                </div>

                <div className="relative z-10 mt-6 mb-8">
                    <h3 className="text-4xl font-black text-white leading-[0.95] tracking-tight mb-3 text-balance">
                        {String(getTranslated(nextDayDef.dayName, lang))}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {(nextDayDef.slots || []).slice(0, 3).map((slot: any, sIdx: number) => (
                            <span key={sIdx} className="text-[10px] font-bold uppercase bg-white/10 text-zinc-300 px-2 py-1 rounded-md border border-white/5">
                                {String(tm(slot.muscle))}
                            </span>
                        ))}
                        {(nextDayDef.slots || []).length > 3 && (
                            <span className="text-[10px] font-bold uppercase bg-white/10 text-zinc-300 px-2 py-1 rounded-md border border-white/5">
                                +{(nextDayDef.slots || []).length - 3}
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 animate-bounce-cta`}>
                        <Icon name={isSessionActive ? "Play" : "ArrowRight"} size={26} fill="currentColor" />
                    </div>
                    <span className="text-sm font-bold text-white">
                        {isSessionActive ? (lang === 'en' ? "Resume Workout" : "Reanudar") : String(t.tapToStart)}
                    </span>
                </div>
            </div>
        </div>
    );
});

// --- MAIN COMPONENT ---

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ startSession, onEditProgram, onSkipSession, onStartFreeSession }) => {
    const { activeMeso, activeSession, program, setActiveMeso, lang, logs, isAppLoading, setProgram, tutorialProgress, markTutorialSeen, globalTemplates } = useApp();
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    const { isPro, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();

    const tm = (key: string) => {
        if (!key || typeof key !== 'string') return 'Unknown';
        const val = (t.muscle as any)[key];
        return typeof val === 'string' ? val : key;
    };

    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);
    const [showMesoSettings, setShowMesoSettings] = useState(false);
    const [showAIChat, setShowAIChat] = useState(false);
    const [skipConfirmationId, setSkipConfirmationId] = useState<number | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);

    // --- MESO SETTINGS LOCAL STATE ---
    const [editWeeks, setEditWeeks] = useState(4);
    const [editDeload, setEditDeload] = useState(false);
    const [editNote, setEditNote] = useState('');

    const fatigueReport = useFatigueAI();

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

    const safeProgram = Array.isArray(program) ? program : [];
    const safeLogs = Array.isArray(logs) ? logs : [];

    const {
        uniqueDaysDone, weekComplete, nextWorkoutIdx, isSessionActive, nextDayDef, logsForWeek
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

    // Handlers
    const handleSkipClick = (e: React.MouseEvent, dayIdx: number) => { e.stopPropagation(); setSkipConfirmationId(dayIdx); };
    const confirmSkip = () => { if (onSkipSession && skipConfirmationId !== null) onSkipSession(skipConfirmationId); setSkipConfirmationId(null); };
    const handleFinishMeso = (exportReport: boolean) => { setActiveMeso(null); setShowCompleteModal(null); };
    const handleFinishWeek = () => {
        if (!activeMeso) return;
        setActiveMeso(prev => prev ? {
            ...prev,
            week: prev.week + 1
        } : null);
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
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 bg-black relative overflow-hidden">
                {/* Background Atmosphere */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-zinc-900 to-black opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-sm">
                    {/* Hero Card Container */}
                    <div
                        onClick={handleOpenTemplateSelector}
                        className="group w-full aspect-square rounded-[2.5rem] relative overflow-hidden cursor-pointer shadow-2xl shadow-primary-900/10 active:scale-95 transition-all duration-300 border border-white/5"
                    >
                        {/* --- IMAGE / ARTWORK SPACE --- */}
                        {/* If you want to use your image, uncomment below and add file to public/cover.jpg */}
                        {/* <img src="/cover.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60" /> */}

                        {/* CSS Abstract Art (Default) */}
                        <div className="absolute inset-0 bg-zinc-900">
                            {/* Gradient Mesh */}
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black"></div>
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary-600/20 to-transparent"></div>

                            {/* Abstract Lines */}
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_top,black,transparent)]"></div>
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/10 shadow-lg">
                                <Icon name="Plus" size={40} className="text-white drop-shadow-md" strokeWidth={3} />
                            </div>

                            <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
                                {lang === 'en' ? "Start Journey" : "Empezar Viaje"}
                            </h2>
                            <p className="text-zinc-400 text-sm font-medium mt-2 max-w-[200px] leading-relaxed">
                                {lang === 'en' ? "Begin your first mesocycle to track progressive overload." : "Inicia tu primer ciclo para registrar tu progreso."}
                            </p>
                        </div>

                        {/* Hover Glow */}
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
                            className="w-full flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-600 active:scale-[0.98] transition-all"
                        >
                            <div className="flex gap-1">
                                <div className="w-7 h-7 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center"><Icon name="Dumbbell" size={14} /></div>
                                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Icon name="Zap" size={14} /></div>
                                <div className="w-7 h-7 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><Icon name="User" size={14} /></div>
                            </div>
                            <span className="flex-1 text-left text-xs font-black text-zinc-300">
                                {lang === 'es' ? 'Gym · CrossFit · Calistenia' : 'Gym · CrossFit · Calisthenics'}
                            </span>
                            <Icon name="ChevronRight" size={16} className="text-zinc-600" />
                        </button>
                    </div>
                )}

                {/* Modals */}
                {showTemplateSelector && (
                    <TemplateSelector
                        onClose={() => setShowTemplateSelector(false)}
                        onSelectTemplate={handleSelectTemplate}
                        onCreateCustom={handleCreateCustom}
                        templates={globalTemplates}
                        t={t}
                        lang={lang}
                    />
                )}
                {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />}
            </div>
        );
    }

    return (
        <div className="px-6 space-y-8 pb-40">
            {/* Header Info */}
            <div className="flex justify-between items-start pt-2">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">{activeMeso.name}</h2>
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

            {/* AI Fatigue Warning */}
            {fatigueReport && fatigueReport.shouldDeload && activeMeso && !activeMeso.isDeload && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-3xl p-5 mb-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 shadow-2xl shadow-red-500/10">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 ring-1 ring-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]">
                        <Icon name="AlertTriangle" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-red-400 font-black text-sm uppercase tracking-widest">{lang === 'es' ? 'Fatiga Sistémica' : 'Systemic Fatigue'}</h4>
                        <p className="text-zinc-300 text-sm mt-1 leading-relaxed text-balance">
                            {lang === 'es'
                                ? `El motor de IA detectó una caída de rendimiento y dolor muscular continuo en: `
                                : `The AI engine detected consecutive performance drops and high soreness in: `}
                            <span className="font-bold text-red-300">{fatigueReport.muscles.map(m => String((t.muscle as any)[m] || m)).join(', ')}</span>.
                        </p>
                        <button
                            onClick={() => setShowMesoSettings(true)}
                            className="mt-4 text-[10px] uppercase tracking-widest font-black bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <Icon name="Settings" size={14} /> {lang === 'es' ? 'Activar Descarga' : 'Activate Deload'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
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
            </div>

            {weekComplete && !nextDayDef && (
                <Button
                    onClick={() => {
                        if (activeMeso && activeMeso.week >= activeMeso.targetWeeks) {
                            setShowCompleteModal('meso');
                        } else {
                            setShowCompleteModal('week');
                        }
                    }}
                    fullWidth
                    className="bg-green-600 hover:bg-green-500 text-white py-4 text-lg"
                >
                    {activeMeso && activeMeso.week >= activeMeso.targetWeeks ? t.finishCycle : t.completeWeek}
                </Button>
            )}

            {/* Schedule List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{t.schedule}</h4>
                    <span className="text-[10px] text-zinc-600 font-bold">{Math.round((uniqueDaysDone.size / safeProgram.length) * 100)}% DONE</span>
                </div>

                <div className="space-y-3">
                    {safeProgram.map((day, idx) => {
                        const isDone = uniqueDaysDone.has(idx);
                        if (idx === nextWorkoutIdx) return null; // Hide duplicates

                        return (
                            <div
                                key={idx}
                                onClick={() => !isDone && startSession(idx)}
                                className={`
                                    group flex items-center p-4 rounded-2xl border transition-all relative
                                    ${isDone
                                        ? 'bg-zinc-900/30 border-transparent opacity-50'
                                        : 'bg-zinc-900 border-zinc-800 active:bg-zinc-800'
                                    }
                                `}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 shrink-0 font-bold text-xs ${isDone ? 'bg-green-900/30 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {isDone ? <Icon name="Check" size={14} strokeWidth={3} /> : idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold text-sm ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                        {String(getTranslated(day.dayName, lang))}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                                        {(day.slots || []).map((s: any) => String(tm(s.muscle))).join(', ')}
                                    </div>
                                </div>

                                {/* Restore Skip Button */}
                                {!isDone && (
                                    <button
                                        onClick={(e) => handleSkipClick(e, idx)}
                                        className="p-2 text-zinc-600 hover:text-white opacity-100 transition-all active:scale-95"
                                        title={t.skipDay}
                                    >
                                        <Icon name="SkipForward" size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Freestyle / CrossFit / Calisthenics quick launcher */}
            {onStartFreeSession && (
                <button
                    id="home-freestyle-btn"
                    onClick={onStartFreeSession}
                    className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-600 active:scale-[0.98] transition-all group"
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
                        <div className="text-sm font-black text-white">
                            {lang === 'es' ? 'Sesión Libre / CrossFit / Calistenia' : 'Freestyle / CrossFit / Calisthenics'}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                            {lang === 'es' ? 'Sin programa fijo · WODs · Progressions' : 'No fixed program · WODs · Progressions'}
                        </div>
                    </div>
                    <Icon name="ChevronRight" size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </button>
            )}

            {/* Consistency Heatmap */}
            <div className="relative p-px rounded-3xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900">
                <div className="bg-zinc-900 rounded-[calc(1.5rem-1px)] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon name="Activity" size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{t.consistency}</h3>
                    </div>
                    <ActivityHeatmap logs={safeLogs} />
                </div>
            </div>

            {/* AI Floating Button */}
            <div className="fixed bottom-24 right-6 z-40 pointer-events-none">
                <button
                    onClick={() => checkPro("GainsLab AI AI") && setShowAIChat(true)}
                    className="pointer-events-auto w-14 h-14 rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                >
                    <Icon name="Bot" size={24} fill="currentColor" />
                </button>
            </div>

            <TutorialOverlay
                steps={homeTutorialSteps}
                isActive={!tutorialProgress.home}
                onComplete={() => markTutorialSeen('home')}
            />

            {/* --- MODALS --- */}

            {showAIChat && <Suspense fallback={null}><GainsLabChat onClose={() => setShowAIChat(false)} /></Suspense>}
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />}

            {/* Guidelines Modal */}
            <GuidelinesModal
                isOpen={showGuidelines}
                onClose={() => setShowGuidelines(false)}
                images={currentGuidelineImages}
            />

            {/* Skip Confirmation */}
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

            {/* MESO SETTINGS MODAL */}
            {showMesoSettings && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowMesoSettings(false)}>
                    <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">{t.mesoConfig}</h3>
                            <button onClick={() => setShowMesoSettings(false)} className="text-zinc-400 hover:text-white">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Target Weeks */}
                            <div id="tut-meso-duration">
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-3">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4 bg-zinc-950 p-2 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setEditWeeks(Math.max(1, editWeeks - 1))}
                                        className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="flex-1 text-center font-mono text-2xl font-black text-white">{editWeeks}</span>
                                    <button
                                        onClick={() => setEditWeeks(editWeeks + 1)}
                                        className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Deload Toggle */}
                            <div id="tut-meso-deload" className="flex items-center justify-between bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                                <div>
                                    <span className="text-sm font-bold text-blue-200 block mb-1">{t.deloadMode}</span>
                                    <span className="text-[10px] text-blue-400/70 block leading-tight">{t.deloadDesc}</span>
                                </div>
                                <button
                                    onClick={() => setEditDeload(!editDeload)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${editDeload ? 'bg-blue-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${editDeload ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Edit Template Link */}
                            <button
                                id="tut-meso-edit"
                                onClick={() => { setShowMesoSettings(false); onEditProgram(); }}
                                className="w-full py-3 bg-zinc-800 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
                            >
                                <Icon name="Layout" size={16} /> {t.editTemplate}
                            </button>

                            {/* Notes */}
                            <div id="tut-meso-notes">
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.mesoNotes}</label>
                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder={t.mesoNotesPlaceholder}
                                    className="w-full bg-zinc-950 text-white text-sm p-3 rounded-xl border border-zinc-800 focus:border-zinc-600 outline-none min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button onClick={handleSaveSettings} fullWidth size="lg">
                                {t.save}
                            </Button>

                            <button
                                onClick={() => { setShowMesoSettings(false); setShowCompleteModal('meso'); }}
                                className="w-full py-3 text-xs font-bold text-primary-500 hover:text-red-400 hover:bg-primary-500/10 rounded-xl transition-colors"
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
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-zinc-900 w-full max-w-sm rounded-2xl p-6 border border-zinc-800 text-center">
                        {showCompleteModal === 'meso' ? (
                            <>
                                <h3 className="text-white font-bold text-xl mb-2">{t.finishCycle}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{t.finishMesoConfirm}</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)} fullWidth>{t.cancel}</Button>
                                    <Button onClick={() => handleFinishMeso(false)} fullWidth>{t.completed}</Button>
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
