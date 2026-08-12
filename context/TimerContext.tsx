import React, { createContext, useContext, PropsWithChildren, useMemo } from 'react';
import { useTimer, TimerState } from '../hooks/useTimer';
import { useApp } from './AppContext';

interface TimerControlsContextType {
    /**
     * Intentionally non-reactive legacy snapshot.
     *
     * Components that only need timer controls should keep using useTimerContext().
     * Components that render the countdown must use useTimerState(). This prevents
     * a 1 Hz countdown from re-rendering the entire workout tree and every exercise
     * card during rest periods.
     */
    restTimer: TimerState;
    setRestTimer: React.Dispatch<React.SetStateAction<TimerState>>;
}

const TimerControlsContext = createContext<TimerControlsContextType | undefined>(undefined);
const TimerStateContext = createContext<TimerState | undefined>(undefined);

// Keep the backwards-compatible `restTimer` field inert. The only legacy reader
// is the small badge embedded in each exercise card; the authoritative countdown
// now lives in RestTimerOverlay via useTimerState(). Removing that card-level
// subscription is what keeps every exercise card from re-rendering once per second.
const NON_REACTIVE_TIMER: TimerState = Object.freeze({
    active: false,
    timeLeft: 0,
    duration: 0,
    endAt: 0,
});

export const TimerProvider = ({ children }: PropsWithChildren) => {
    const { lang } = useApp();
    const { restTimer, setRestTimer } = useTimer(lang);

    // setRestTimer is stable. Keeping this context value stable means consumers
    // that only start/stop the timer are completely isolated from countdown ticks.
    const controls = useMemo<TimerControlsContextType>(() => ({
        restTimer: NON_REACTIVE_TIMER,
        setRestTimer,
    }), [setRestTimer]);

    return (
        <TimerControlsContext.Provider value={controls}>
            <TimerStateContext.Provider value={restTimer}>
                {children}
            </TimerStateContext.Provider>
        </TimerControlsContext.Provider>
    );
};

/**
 * Stable timer controls. Does NOT subscribe the caller to countdown ticks.
 */
export const useTimerContext = () => {
    const context = useContext(TimerControlsContext);
    if (!context) throw new Error('useTimerContext must be used within TimerProvider');
    return context;
};

/**
 * Reactive timer state. Use only in small UI surfaces that actually display the
 * countdown (for example RestTimerOverlay).
 */
export const useTimerState = () => {
    const state = useContext(TimerStateContext);
    if (!state) throw new Error('useTimerState must be used within TimerProvider');
    return state;
};
