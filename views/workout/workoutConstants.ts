// S6: moved verbatim from views/WorkoutViewImpl.tsx.
import { SetType } from '../../types';

// Module-scope constants never change at runtime. Previously these maps were
// allocated on every render of the set-type modal IIFE (~12 entries each), and
// the modal can re-render frequently during a workout because `applyToAll`
// state changes per click. Lifting them out drops 24 object allocations and
// 100+ string allocations per render of the modal.
export const SET_TYPE_COLORS: Record<string, string> = {
    regular: 'bg-zinc-800 text-zinc-300',
    warmup: 'bg-yellow-500/20 text-yellow-400',
    myorep: 'bg-purple-500/20 text-purple-400',
    giant: 'bg-orange-500/20 text-orange-400',
    top: 'bg-primary-500/20 text-primary-400',
    backoff: 'bg-blue-500/20 text-blue-400',
    cluster: 'bg-emerald-500/20 text-emerald-400',
    emom: 'bg-cyan-500/20 text-cyan-400',
    drop: 'bg-teal-500/20 text-teal-400',
    rest_pause: 'bg-rose-500/20 text-rose-400',
};
export const SET_TYPE_ICONS: Record<string, string> = {
    regular: 'Circle', warmup: 'Zap', myorep: 'Repeat',
    giant: 'Layers', top: 'TrendingUp', backoff: 'TrendingDown', cluster: 'Grid3x3',
    emom: 'Timer', drop: 'TrendingDown',
    rest_pause: 'Pause',
};
export const CORE_SET_TYPES: SetType[] = ['regular', 'warmup', 'drop', 'myorep', 'top', 'backoff'];
export const ADVANCED_SET_TYPES: SetType[] = ['giant', 'cluster', 'emom', 'rest_pause'];
export const MANUAL_REST_PRESETS = [60, 90, 120, 180] as const;
