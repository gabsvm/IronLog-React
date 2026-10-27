// U5: RestTimerOverlay state, effects and handlers, moved verbatim from components/ui/RestTimerOverlay.tsx.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useTimerActions, useTimerState } from '../../../context/TimerContext';
import { requestTimerNotificationPermission } from '../../../hooks/useTimer';
import { useAppConfig, useAppPreferences } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { getExactAlarmState, openExactAlarmSettings, shouldShowExactAlarmNotice, triggerHaptic, updateNativeRestTimerContent } from '../../../utils/audio';
import { useStore } from '../../../lib/store';
import { resolveWeightUnit } from '../../../utils/units';
import { pickLang } from '../../../utils/i18n';
import { applyEffortRatingToExercises, resolveRestNextAction, resolveRestNotificationContent } from './restTimerLogic';

export const useRestTimerOverlayState = () => {
    const restTimer = useTimerState();
    const { setRestTimer } = useTimerActions();
    const { lang, reducedEffects } = useAppPreferences();
    const { config } = useAppConfig();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const activeSession = useStore(state => restTimer.active ? state.activeSession : null);
    const setActiveSession = useStore(state => state.setActiveSession);

    const initialMode = config?.restTimerDisplay === 'expanded' ? 'expanded' : 'compact';
    const [mode, setMode] = useState<'compact' | 'expanded'>(initialMode);
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const [showNotifPrompt, setShowNotifPrompt] = useState(false);
    const [showAlarmNotice, setShowAlarmNotice] = useState(false);
    const lastFreshStartRef = useRef(0);
    const [pillElement, setPillElement] = useState<HTMLElement | null>(null);
    const pillRef = useCallback((node: HTMLElement | null) => {
        setPillElement(node);
    }, []);

    // Reset to user preference when a new rest begins
    useEffect(() => {
        if (!restTimer?.active) {
            setMode(config?.restTimerDisplay === 'expanded' ? 'expanded' : 'compact');
            lastFreshStartRef.current = 0;
            return;
        }

        const looksLikeFreshStart = restTimer.duration > 0 && restTimer.timeLeft >= restTimer.duration - 1;
        if (looksLikeFreshStart && restTimer.endAt !== lastFreshStartRef.current) {
            lastFreshStartRef.current = restTimer.endAt;
            setMode(config?.restTimerDisplay === 'expanded' ? 'expanded' : 'compact');
        }
    }, [restTimer?.active, restTimer?.duration, restTimer?.endAt, restTimer?.timeLeft, config?.restTimerDisplay]);

    // Keyboard avoidance via visualViewport only
    useEffect(() => {
        if (!window.visualViewport) return;

        const viewport = window.visualViewport;
        const syncViewportOffset = () => {
            const offset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
            setKeyboardOffset(offset);
        };

        syncViewportOffset();
        viewport.addEventListener('resize', syncViewportOffset);
        viewport.addEventListener('scroll', syncViewportOffset);

        return () => {
            viewport.removeEventListener('resize', syncViewportOffset);
            viewport.removeEventListener('scroll', syncViewportOffset);
        };
    }, []);

    // Expose the compact pill height as --rest-pill-height so scrollable
    // content (workout exercise list) can pad its bottom and never slide
    // under the pill. '0px' whenever the pill is not mounted.
    useEffect(() => {
        const root = document.documentElement;
        if (!restTimer?.active || mode !== 'compact' || !pillElement) {
            root.style.setProperty('--rest-pill-height', '0px');
            return;
        }
        const applyHeight = () => {
            root.style.setProperty('--rest-pill-height', `${Math.ceil(pillElement.getBoundingClientRect().height)}px`);
        };
        applyHeight();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(applyHeight);
        observer.observe(pillElement);
        return () => {
            observer.disconnect();
            root.style.setProperty('--rest-pill-height', '0px');
        };
    }, [restTimer?.active, mode, pillElement]);

    // A focused set input must remain visible when the compact timer moves beneath the header.
    // Reserve space at the top of the scrollable exercise list only while the soft keyboard is open.
    useEffect(() => {
        const root = document.documentElement;
        if (restTimer?.active && mode === 'compact' && keyboardOffset > 120) {
            root.style.setProperty('--rest-pill-top-offset', '64px');
        } else {
            root.style.removeProperty('--rest-pill-top-offset');
        }
        return () => { root.style.removeProperty('--rest-pill-top-offset'); };
    }, [restTimer?.active, mode, keyboardOffset]);

    // Expanded rest controls consume the viewport: collapse them when editing a set.
    useEffect(() => {
        if (keyboardOffset > 120 && mode === 'expanded') setMode('compact');
    }, [keyboardOffset, mode]);

    // One-time, non-blocking notification opt-in (web/PWA only): after the
    // first naturally completed rest, offer the finish alert once. Never
    // shown on native (AlarmManager owns it), when permission is already
    // decided, or when the API is missing. The flag is set at show time, so
    // "later" never resurfaces the prompt.
    useEffect(() => {
        const onRestCompleted = () => {
            try {
                if (Capacitor.isNativePlatform()) return;
                if (typeof Notification === 'undefined') return;
                if (Notification.permission !== 'default') return;
                if (window.localStorage.getItem('il_notif_prompted')) return;
                window.localStorage.setItem('il_notif_prompted', '1');
                setShowNotifPrompt(true);
            } catch {
                // Private-mode storage (or exotic shells): stay silent.
            }
        };
        window.addEventListener('ironlog:rest-completed', onRestCompleted);
        return () => window.removeEventListener('ironlog:rest-completed', onRestCompleted);
    }, []);

    // One-time exact-alarm notice (native Android 12+ only): after the first
    // naturally completed rest, offer the system toggle once when exact
    // alarms are not granted (denied by default since Android 14). The flag
    // is set at show time, so it never comes back.
    useEffect(() => {
        const onRestCompleted = async () => {
            try {
                if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
                if (window.localStorage.getItem('il_exact_alarm_noticed')) return;
                const alarmState = await getExactAlarmState();
                if (!alarmState) return;
                if (!shouldShowExactAlarmNotice({ platform: 'android', isNative: true, sdkInt: alarmState.sdkInt, granted: alarmState.granted, alreadyNoticed: false })) return;
                window.localStorage.setItem('il_exact_alarm_noticed', '1');
                setShowAlarmNotice(true);
            } catch {
                // Stay silent: the row in Training stays available.
            }
        };
        window.addEventListener('ironlog:rest-completed', onRestCompleted);
        return () => window.removeEventListener('ironlog:rest-completed', onRestCompleted);
    }, []);

    // Same non-blocking auto-dismiss as the notification prompt.
    useEffect(() => {
        if (!showAlarmNotice) return;
        const timer = window.setTimeout(() => setShowAlarmNotice(false), 10_000);
        return () => window.clearTimeout(timer);
    }, [showAlarmNotice]);

    // The prompt never blocks: it auto-dismisses after 10 s (the once-flag
    // was already set at show time, so it never comes back).
    useEffect(() => {
        if (!showNotifPrompt) return;
        const timer = window.setTimeout(() => setShowNotifPrompt(false), 10_000);
        return () => window.clearTimeout(timer);
    }, [showNotifPrompt]);

    // Derived: Current source set for effort feedback
    const currentSourceSet = useMemo(() => {
        if (!restTimer?.source || !activeSession?.exercises) return null;
        const ex = activeSession.exercises.find(e => e.instanceId === restTimer.source?.exerciseInstanceId);
        return ex?.sets?.find(s => s.id === restTimer.source?.setId) || null;
    }, [activeSession?.exercises, restTimer?.source]);

    const showEffortFeedback = Boolean(config?.showRIR || config?.rpEnabled);

    const handleRateEffort = (effort: 'easy' | 'ok' | 'hard') => {
        if (!restTimer?.source || restTimer.source.setId === undefined) return;
        const { exerciseInstanceId, setId } = restTimer.source;
        triggerHaptic('light');
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: applyEffortRatingToExercises(prev.exercises || [], exerciseInstanceId, setId, effort)
            };
        });
    };

    // Truthful next exercise / superset context resolution
    const nextExerciseInfo = useMemo(() => {
        return resolveRestNextAction(activeSession?.exercises, restTimer?.source, lang, resolveWeightUnit(config));
    }, [activeSession?.exercises, lang, restTimer?.source, config]);

    // Android 15 supports updating an existing notification by ID. Update only
    // when the exercise/set context changes, not with each countdown tick.
    // The native bridge validates endAt so a delayed render cannot resurrect
    // a skipped rest or overwrite a +30s action.
    const notificationInfo = useMemo(
        () => resolveRestNotificationContent(activeSession?.exercises, restTimer?.source, lang),
        [activeSession?.exercises, restTimer?.source, lang],
    );
    const liveTitle = notificationInfo?.liveTitle ?? t.timer.resting;
    const liveBody = notificationInfo?.liveBody ?? t.timer.restingBody;
    const hasActiveSession = Boolean(activeSession);
    useEffect(() => {
        if (!restTimer?.active || !restTimer.endAt) return;
        // A restored alarm already owns the last valid context; do not erase
        // it with generic text while the session store is still bootstrapping.
        if (!hasActiveSession) return;
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
        updateNativeRestTimerContent(restTimer.endAt, {
            liveTitle, liveBody,
            skipLabel: pickLang(lang, { es: 'Omitir', en: 'Skip' }),
        });
    }, [restTimer?.active, restTimer?.endAt, hasActiveSession, liveTitle, liveBody, lang]);

    const dismissNotifPrompt = () => setShowNotifPrompt(false);
    const dismissAlarmNotice = () => setShowAlarmNotice(false);
    const enableAlarmFromNotice = () => {
        setShowAlarmNotice(false);
        openExactAlarmSettings();
    };
    const enableNotifFromPrompt = () => {
        setShowNotifPrompt(false);
        // Called from the click handler: a real user gesture.
        void requestTimerNotificationPermission();
    };


    return {
        restTimer,
        setRestTimer,
        lang,
        reducedEffects,
        config,
        t,
        activeSession,
        setActiveSession,
        initialMode,
        mode,
        setMode,
        keyboardOffset,
        setKeyboardOffset,
        showNotifPrompt,
        setShowNotifPrompt,
        showAlarmNotice,
        setShowAlarmNotice,
        lastFreshStartRef,
        pillRef,
        currentSourceSet,
        showEffortFeedback,
        handleRateEffort,
        nextExerciseInfo,
        dismissNotifPrompt,
        dismissAlarmNotice,
        enableAlarmFromNotice,
        enableNotifFromPrompt,
    };
};

export type RestTimerOverlayState = ReturnType<typeof useRestTimerOverlayState>;
