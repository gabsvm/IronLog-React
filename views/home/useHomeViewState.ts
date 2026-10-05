// S6: HomeView state, effects and handlers, moved verbatim from
// views/HomeViewImpl.tsx (the view is now an orchestrator).
import React, { useState, useMemo, useEffect } from 'react';
import { useApp, useAppConfig, useAppPreferences, useTutorial } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { getTranslated } from '../../utils';
import { usePro } from '../../hooks/usePro';
import { GlobalTemplate } from '../../types';
import { triggerHaptic, updateWidgetData } from '../../utils/audio';
import { scheduleWhenIdle } from '../../lib/idle';
import { useStore } from '../../lib/store';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { startProgramRun } from '../../programs/engine/ProgramRunHelpers';
import { getProgramBlockForWeek } from '../../programs/engine/ProgramResolver';

export interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

export const useHomeViewState = ({ startSession, onEditProgram, onSkipSession, onStartFreeSession }: HomeViewProps) => {
    const { program, logs, isAppLoading, setProgram, globalTemplates, personalTemplates, userProfile, exercises } = useApp();
    const { lang } = useAppPreferences();
    const { tutorialProgress, markTutorialSeen } = useTutorial();
    const { config } = useAppConfig();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const h = t.homeView;
    const kongBlock = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id ? getProgramBlockForWeek(KONG_4DAY_V1, activeMeso.week) : null;

    const { isPro, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();

    const tm = (key: string) => {
        if (!key || typeof key !== 'string') return 'Unknown';
        const val = (t.muscle as any)[key];
        return typeof val === 'string' ? val : key;
    };

    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);
    const [showMesoSettings, setShowMesoSettings] = useState(false);
    const [showPlanActions, setShowPlanActions] = useState(false);
    const [skipConfirmationId, setSkipConfirmationId] = useState<number | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);
    const [transitionBlock, setTransitionBlock] = useState<number | null>(null);
    const [showKongHub, setShowKongHub] = useState(false);

    // --- MESO SETTINGS LOCAL STATE ---
    const [editWeeks, setEditWeeks] = useState(4);

    useEffect(() => {
        if (activeMeso?.programSystem?.systemId !== KONG_4DAY_V1.id) return;
        const block = activeMeso.week === 5 ? 2 : activeMeso.week === 9 ? 3 : null;
        if (!block) return;
        const key = `${KONG_4DAY_V1.id}:block:${block}`;
        if (!(activeMeso.programSystem.seenBlockIntros || []).includes(key)) setTransitionBlock(block);
    }, [activeMeso?.week, activeMeso?.programSystem]);

    useEffect(() => {
        const cancel = scheduleWhenIdle(() => {
            void import('../../components/workout/WorkoutSortableList');
            void import('../../components/workout/SortableExerciseCardImpl');
        });
        return cancel;
    }, []);

    const closeTransition = () => {
        if (!activeMeso || !transitionBlock) return;
        const key = `${KONG_4DAY_V1.id}:block:${transitionBlock}`;
        setActiveMeso(prev => prev?.programSystem ? { ...prev, programSystem: { ...prev.programSystem, seenBlockIntros: [...(prev.programSystem.seenBlockIntros || []), key] } } : prev);
        setTransitionBlock(null);
    };
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

    // Q17: publish the next session name to the Android widget (no-op on web).
    useEffect(() => {
        if (!activeMeso) return;
        const dayDef = nextWorkoutIdx !== -1 ? safeProgram[nextWorkoutIdx] : null;
        updateWidgetData(dayDef ? String(getTranslated(dayDef.dayName, lang)) : '');
    }, [activeMeso, nextWorkoutIdx, safeProgram, lang]);

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

    const handleSelectProgram = (programId: string) => {
        if (programId !== KONG_4DAY_V1.id) return;
        const firstWeek = resolveProgramWeek(KONG_4DAY_V1, 1);
        setProgram(firstWeek);
        const plan = firstWeek.map((day) => (day.slots || []).map((slot) => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: 'KONG · Savage Size',
            mesoType: KONG_4DAY_V1.id,
            week: 1,
            targetWeeks: KONG_4DAY_V1.durationWeeks,
            isDeload: false,
            plan,
            duration: KONG_4DAY_V1.durationWeeks,
            programSystem: startProgramRun(KONG_4DAY_V1, userProfile?.bodyWeight),
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
        { targetId: 'tut-nav-bar', title: t.tutorial.home[3].title, text: t.tutorial.home[3].text, position: 'top' as const }
    ];


    return {
        startSession,
        onEditProgram,
        onSkipSession,
        onStartFreeSession,
        uniqueDaysDone,
        weekComplete,
        nextWorkoutIdx,
        isSessionActive,
        logsForWeek,
        estimatedMin,
        adherencePct,
        program,
        logs,
        isAppLoading,
        setProgram,
        globalTemplates,
        personalTemplates,
        userProfile,
        exercises,
        lang,
        tutorialProgress,
        markTutorialSeen,
        config,
        activeSession,
        activeMeso,
        setActiveMeso,
        t,
        h,
        kongBlock,
        isPro,
        checkPro,
        showPaywall,
        setShowPaywall,
        featureAttempted,
        tm,
        showCompleteModal,
        setShowCompleteModal,
        showMesoSettings,
        setShowMesoSettings,
        showPlanActions,
        setShowPlanActions,
        skipConfirmationId,
        setSkipConfirmationId,
        showTemplateSelector,
        setShowTemplateSelector,
        showGuidelines,
        setShowGuidelines,
        transitionBlock,
        setTransitionBlock,
        showKongHub,
        setShowKongHub,
        editWeeks,
        setEditWeeks,
        closeTransition,
        editDeload,
        setEditDeload,
        editNote,
        setEditNote,
        currentGuidelineImages,
        handleSaveSettings,
        safeProgram,
        safeLogs,
        selectedDayIdx,
        setSelectedDayIdx,
        selectedDayEstimatedMin,
        handleSkipClick,
        confirmSkip,
        handleFinishMeso,
        handleFinishWeek,
        handleOpenTemplateSelector,
        handleSelectTemplate,
        handleSelectProgram,
        handleCreateCustom,
        mesoSettingsTutorialSteps,
        homeTutorialSteps,
    };
};

export type HomeViewState = ReturnType<typeof useHomeViewState>;
