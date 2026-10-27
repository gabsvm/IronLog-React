// Strong parity: there is no floating rest pill and no expanded sheet.
// The workout shows its own in-flow dock; everywhere else the rest keeps
// running silently (native alarm) and the FAB/banner own the return path.
// This component only renders the one-time notification prompts.
import React from 'react';
import { useRestTimerOverlayState } from './restTimer/useRestTimerOverlayState';
import { RestTimerNotifPrompt, RestTimerAlarmNotice } from './restTimer/RestTimerPrompts';

export const RestTimerOverlay: React.FC = () => {
    const state = useRestTimerOverlayState();
    return (
        <>
            <RestTimerNotifPrompt state={state} />
            <RestTimerAlarmNotice state={state} />
        </>
    );
};

// Re-exported helpers keep older deep imports working.
export {
    calculateTimerPercentage,
    calculateRingDashOffset,
    TIMER_RING_RADIUS,
    TIMER_RING_CIRCUMFERENCE,
    applyEffortRatingToExercises,
    resolveRestNextAction,
} from './restTimer/restTimerLogic';
export { CircularTimer } from './restTimer/CircularTimer';
export type { RestTimerOverlayState } from './restTimer/useRestTimerOverlayState';
