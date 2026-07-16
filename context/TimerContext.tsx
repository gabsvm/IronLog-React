
import React, { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import { useTimer, TimerState } from '../hooks/useTimer';
import { useAppPreferences } from './AppContext';

interface TimerActions {
    setRestTimer: React.Dispatch<React.SetStateAction<TimerState>>;
}

const TimerStateContext = createContext<TimerState | undefined>(undefined);
const TimerActionsContext = createContext<TimerActions | undefined>(undefined);

export const TimerProvider = ({ children }: PropsWithChildren) => {
    const { lang } = useAppPreferences();
    const { restTimer, setRestTimer } = useTimer(lang);
    const actions = useMemo(() => ({ setRestTimer }), [setRestTimer]);
    
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
