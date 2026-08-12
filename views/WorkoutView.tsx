import React, { Suspense } from 'react';

interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
}

type WorkoutModule = typeof import('./WorkoutViewImpl');
let workoutModulePromise: Promise<WorkoutModule> | null = null;

const loadWorkoutModule = () => {
    if (!workoutModulePromise) workoutModulePromise = import('./WorkoutViewImpl');
    return workoutModulePromise;
};

const LazyWorkoutView = React.lazy(() =>
    loadWorkoutModule().then(module => ({ default: module.WorkoutView }))
);

// Keep the heavy workout/DnD graph out of the initial bundle, but fetch it once
// the home screen has had a chance to paint. In normal use the module is therefore
// already warm by the time the user taps Start/Resume.
if (typeof window !== 'undefined') {
    const preload = () => { void loadWorkoutModule(); };
    const requestIdle = (window as any).requestIdleCallback as undefined | ((cb: () => void, options?: { timeout: number }) => number);
    if (requestIdle) requestIdle(preload, { timeout: 3000 });
    else window.setTimeout(preload, 1500);
}

const WorkoutLoading = () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center" role="status" aria-label="Loading workout">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-white animate-spin" />
    </div>
);

export const WorkoutView: React.FC<WorkoutViewProps> = (props) => (
    <Suspense fallback={<WorkoutLoading />}>
        <LazyWorkoutView {...props} />
    </Suspense>
);
