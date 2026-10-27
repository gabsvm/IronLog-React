import React, { createContext, useContext, useMemo, PropsWithChildren, useCallback } from 'react';
import { useTimer, TimerState } from '../hooks/useTimer';
import type { Lang, RestSoundName } from '../types';
import {
    adjustRestTimer,
    pauseRestTimer,
    restartRestTimer,
    resumeRestTimer,
    skipRestTimer,
    startRestTimer,
    type RestSource,
} from '../components/ui/restTimer/restTimerControls';

interface TimerActions {
    setRestTimer: React.Dispatch<React.SetStateAction<TimerState>>;
    /** Bound Strong-parity controls (all funnel through setRestTimer). */
    pauseRest: () => void;
    resumeRest: () => void;
    restartRest: () => void;
    skipRest: () => void;
    adjustRest: (deltaSeconds: number) => void;
    startRest: (durationSeconds: number, source?: RestSource) => void;
}

export interface TimerProviderProps extends PropsWithChildren {
    /** App language; AppProvider passes its own. Defaults match the stored default. */
    lang?: Lang;
    /** SettingsParity prefs; AppProvider passes AppState.config values. Absent = enabled. */
    soundEnabled?: boolean;
    vibrateEnabled?: boolean;
    soundName?: RestSoundName;
}

export const TimerStateContext = createContext<TimerState | undefined>(undefined);
export const TimerActionsContext = createContext<TimerActions | undefined>(undefined);

export const TimerProvider = ({
    children,
    lang = 'es',
    soundEnabled = true,
    vibrateEnabled = true,
    soundName = 'boxingBell',
}: TimerProviderProps) => {
    const { restTimer, setRestTimer } = useTimer(lang, { soundEnabled, vibrateEnabled, soundName });
    const pauseRest = useCallback(() => setRestTimer((prev) => pauseRestTimer(prev)), [setRestTimer]);
    const resumeRest = useCallback(() => setRestTimer((prev) => resumeRestTimer(prev)), [setRestTimer]);
    const restartRest = useCallback(() => setRestTimer((prev) => restartRestTimer(prev)), [setRestTimer]);
    const skipRest = useCallback(() => setRestTimer((prev) => skipRestTimer(prev)), [setRestTimer]);
    const adjustRest = useCallback((deltaSeconds: number) => setRestTimer((prev) => adjustRestTimer(prev, deltaSeconds)), [setRestTimer]);
    const startRest = useCallback((durationSeconds: number, source?: RestSource) => setRestTimer(startRestTimer(durationSeconds, source)), [setRestTimer]);
    const actions = useMemo(
        () => ({ setRestTimer, pauseRest, resumeRest, restartRest, skipRest, adjustRest, startRest }),
        [setRestTimer, pauseRest, resumeRest, restartRest, skipRest, adjustRest, startRest],
    );

    return (
        <TimerActionsContext.Provider value={actions}>
            <TimerStateContext.Provider value={restTimer}>
                {children}
            </TimerStateContext.Provider>
        </TimerActionsContext.Provider>
    );
};

export const useTimerState = () => {
    const state = useContext(TimerStateContext);
    if (!state) throw new Error("useTimerState must be used within TimerProvider");
    return state;
};

// Components that only start/stop rest should not rerender on every tick.
export const useTimerActions = () => {
    const actions = useContext(TimerActionsContext);
    if (!actions) throw new Error("useTimerActions must be used within TimerProvider");
    return actions;
};
