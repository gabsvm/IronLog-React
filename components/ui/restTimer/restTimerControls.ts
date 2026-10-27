// Strong parity: pure rest-timer state transitions + control labels.
// All transitions are plain (prev) => next functions so every surface
// (dock, pill, sheet, notification-command sync) shares one motor through
// TimerContext.setRestTimer. No React, no bridge, no globals here.
import type { TimerState } from '../../../hooks/useTimer';
import { pickLang } from '../../../utils/i18n';

export type RestSource = NonNullable<TimerState['source']>;
/** SettingsParity prefs consumed defensively: AppState.config owns them (no parallel store). */
export interface RestTimerPrefs {
    autoStartRest?: boolean;
    restIncrementSeconds?: number;
    restSound?: boolean;
    restVibrate?: boolean;
    defaultRestSeconds?: number;
    warmupRestSeconds?: number;
}

export const resolveRestAutoStart = (config?: RestTimerPrefs | null): boolean =>
    config?.autoStartRest ?? true;

export const resolveRestIncrement = (config?: RestTimerPrefs | null): number => {
    const step = Math.round(Number(config?.restIncrementSeconds) || 0);
    return step >= 5 && step <= 120 ? step : 15;
};

export const resolveDefaultRest = (config?: RestTimerPrefs | null): number => {
    const fallback = Math.round(Number(config?.defaultRestSeconds) || 0);
    return fallback > 0 ? fallback : 120;
};

export const resolveWarmupRest = (config?: RestTimerPrefs | null): number => {
    const fallback = Math.round(Number(config?.warmupRestSeconds) || 0);
    return fallback > 0 ? fallback : 60;
};

const remainingSeconds = (prev: TimerState, now = Date.now()): number => {
    if (typeof prev.pausedRemaining === 'number' && Number.isFinite(prev.pausedRemaining)) {
        return Math.max(0, Math.ceil(prev.pausedRemaining));
    }
    if (prev.endAt > 0) return Math.max(0, Math.ceil((prev.endAt - now) / 1000));
    return Math.max(0, Math.floor(Number(prev.timeLeft) || 0));
};

/** Freeze a running rest. No-op unless the rest is actively counting down. */
export const pauseRestTimer = (prev: TimerState): TimerState => {
    if (!prev.active || prev.paused) return prev;
    const remaining = remainingSeconds(prev);
    if (remaining <= 0) return prev;
    return { ...prev, paused: true, pausedRemaining: remaining, timeLeft: remaining };
};

/** Resume a paused rest with a fresh deadline. No-op unless paused. */
export const resumeRestTimer = (prev: TimerState, now = Date.now()): TimerState => {
    if (!prev.active || !prev.paused) return prev;
    const remaining = remainingSeconds(prev, now);
    if (remaining <= 0) {
        return { ...prev, active: false, paused: false, pausedRemaining: undefined, timeLeft: 0, endAt: 0, source: undefined };
    }
    return { ...prev, paused: false, pausedRemaining: undefined, timeLeft: remaining, endAt: now + remaining * 1000 };
};

/** Restart the current rest at its full duration (keeps the set context). */
export const restartRestTimer = (prev: TimerState, now = Date.now()): TimerState => {
    const duration = Math.max(1, Math.round(Number(prev.duration) || 0));
    if (!prev.active && duration <= 0) return prev;
    return { ...prev, active: true, paused: false, pausedRemaining: undefined, duration, timeLeft: duration, endAt: now + duration * 1000 };
};

/** Dismiss the rest without completion feedback (mirrors the pill's skip). */
export const skipRestTimer = (prev: TimerState): TimerState => {
    if (!prev.active) return prev;
    return { ...prev, active: false, paused: false, pausedRemaining: undefined, timeLeft: 0, endAt: 0, source: undefined };
};

/**
 * Shift a rest by deltaSeconds. Growing extends the planned duration;
 * shrinking past zero dismisses silently (same as skip, never a fanfare).
 */
export const adjustRestTimer = (prev: TimerState, deltaSeconds: number, now = Date.now()): TimerState => {
    if (!prev.active || !Number.isFinite(deltaSeconds) || deltaSeconds === 0) return prev;
    const delta = Math.round(deltaSeconds);
    if (prev.paused) {
        const next = remainingSeconds(prev, now) + delta;
        if (next <= 0) return skipRestTimer(prev);
        return { ...prev, pausedRemaining: next, timeLeft: next, duration: delta > 0 ? prev.duration + delta : prev.duration };
    }
    const next = Math.max(0, prev.timeLeft + delta);
    if (next <= 0) return skipRestTimer(prev);
    return {
        ...prev,
        endAt: (prev.endAt || now) + delta * 1000,
        timeLeft: next,
        duration: delta > 0 ? prev.duration + delta : prev.duration,
    };
};

/** Start a fresh rest (manual chip or auto-start); replaces any running rest. */
export const startRestTimer = (durationSeconds: number, source?: RestSource, now = Date.now()): TimerState => {
    const duration = Math.max(1, Math.round(Number(durationSeconds) || 0));
    return { active: true, paused: false, pausedRemaining: undefined, duration, timeLeft: duration, endAt: now + duration * 1000, source };
};

export interface RestControlLabels {
    pause: string;
    resume: string;
    restart: string;
    skip: string;
    add30: string;
    minus15: string;
    pausedBadge: string;
    autoStart: string;
    manualRest: string;
}

/** Control copy without touching constants/translations (integrator moves these later). */
export const getRestControlLabels = (lang: 'es' | 'en'): RestControlLabels => ({
    pause: pickLang(lang, { es: 'Pausar', en: 'Pause' }),
    resume: pickLang(lang, { es: 'Reanudar', en: 'Resume' }),
    restart: pickLang(lang, { es: 'Reiniciar', en: 'Restart' }),
    skip: pickLang(lang, { es: 'Saltar descanso', en: 'Skip rest' }),
    add30: '+30s',
    minus15: '-15s',
    pausedBadge: pickLang(lang, { es: 'En pausa', en: 'Paused' }),
    autoStart: pickLang(lang, { es: 'Inicio automático', en: 'Auto-start' }),
    manualRest: pickLang(lang, { es: 'Descanso manual', en: 'Manual rest' }),
});
