// U5: state in restTimer/useRestTimerOverlayState; views in restTimer/.
import React from 'react';
import { useRestTimerOverlayState } from './restTimer/useRestTimerOverlayState';
import { RestTimerPrompts } from './restTimer/RestTimerPrompts';
import { RestTimerActive } from './restTimer/RestTimerActive';
export { CircularTimer } from './restTimer/CircularTimer';
export { TIMER_RING_RADIUS, TIMER_RING_CIRCUMFERENCE, calculateTimerPercentage, calculateRingDashOffset, applyEffortRatingToExercises, resolveRestNextAction } from './restTimer/restTimerLogic';
export type { RestNextAction } from './restTimer/restTimerLogic';

export const RestTimerOverlay: React.FC = () => {
    const state = useRestTimerOverlayState();
    if (!state.restTimer || !state.restTimer.active) return <RestTimerPrompts state={state} />;
    return <RestTimerActive state={state} />;
};
