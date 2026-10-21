// Phase 4 (focused workout): single visual rest instance. The global floating
// rest pill (RestTimerOverlay, mounted in App) stays the only rest surface
// outside the workout; while the in-flow WorkoutRestDock is mounted, the
// overlay suppresses its floating views so both never show at once.
// Same TimerContext motor in both cases — this module is only a mount signal.

type Listener = () => void;

let docked = false;
const listeners = new Set<Listener>();

export const isWorkoutRestDocked = (): boolean => docked;

export const setWorkoutRestDocked = (value: boolean): void => {
    if (docked === value) return;
    docked = value;
    listeners.forEach((listener) => {
        try {
            listener();
        } catch {
            // A stale listener must never break the timer UI.
        }
    });
};

export const subscribeWorkoutRestDocked = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
