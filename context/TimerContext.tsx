
import React, { createContext, useContext, PropsWithChildren } from 'react';
import { useTimer, TimerState } from '../hooks/useTimer';
import { useAppPreferences } from './AppContext';

interface TimerContextType {
    restTimer: TimerState;
    setRestTimer: React.Dispatch<React.SetStateAction<TimerState>>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: PropsWithChildren) => {
    const { lang } = useAppPreferences();
    const { restTimer, setRestTimer } = useTimer(lang);
    
    return (
        <TimerContext.Provider value={{ restTimer, setRestTimer }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimerContext = () => {
    const context = useContext(TimerContext);
    if (!context) throw new Error("useTimerContext must be used within TimerProvider");
    return context;
};
