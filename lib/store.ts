import { create } from 'zustand';
import { db } from '../utils/db';
import { ActiveSession, MesoCycle, WorkoutSet } from '../types';
import {
    denormalizeActiveSession,
    normalizeActiveSession,
    NormalizedWorkoutState,
    updateNormalizedWorkoutSet,
} from './workout/workoutPersistenceAdapter';

interface AppStateStore {
    activeSession: ActiveSession | null;
    normalizedWorkout: NormalizedWorkoutState | null;
    activeMeso: MesoCycle | null;
    isStoreLoading: boolean;
    setActiveSession: (val: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => void;
    updateWorkoutSet: <K extends keyof WorkoutSet>(exerciseId: number, setId: number, field: K, value: WorkoutSet[K]) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    _init: () => Promise<void>;
}

// Debounce helpers for IndexedDB
let sessionTimeout: ReturnType<typeof setTimeout> | null = null;
let mesoTimeout: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppStateStore>((set, get) => ({
    activeSession: null,
    normalizedWorkout: null,
    activeMeso: null,
    isStoreLoading: true,
    _init: async () => {
        try {
            const [session, meso] = await Promise.all([
                db.get<ActiveSession | null>('il_session_v16', null),
                db.get<MesoCycle | null>('il_meso_v16', null)
            ]);
            set({ activeSession: session, normalizedWorkout: normalizeActiveSession(session), activeMeso: meso, isStoreLoading: false });
        } catch (e) {
            console.error('[Store] IndexedDB init failed — defaulting to empty state:', e);
            set({ isStoreLoading: false });
        }
    },
    setActiveSession: (val) => {
        set((state) => {
            const nextVal = typeof val === 'function' ? val(state.activeSession) : val;

            if (sessionTimeout) clearTimeout(sessionTimeout);
            sessionTimeout = setTimeout(() => {
                sessionTimeout = null;
                void db.set('il_session_v16', nextVal);
            }, 500);

            return { activeSession: nextVal, normalizedWorkout: normalizeActiveSession(nextVal) };
        });
    },
    updateWorkoutSet: (exerciseId, setId, field, value) => {
        set((state) => {
            const current = state.normalizedWorkout ?? normalizeActiveSession(state.activeSession);
            if (!current) return state;

            const nextWorkout = updateNormalizedWorkoutSet(current, exerciseId, setId, field, value);
            if (nextWorkout === current) return state;

            const nextSession = denormalizeActiveSession(nextWorkout);
            if (sessionTimeout) clearTimeout(sessionTimeout);
            sessionTimeout = setTimeout(() => {
                sessionTimeout = null;
                void db.set('il_session_v16', nextSession);
            }, 500);

            return { activeSession: nextSession, normalizedWorkout: nextWorkout };
        });
    },
    setActiveMeso: (val) => {
        set((state) => {
            const nextVal = typeof val === 'function' ? val(state.activeMeso) : val;

            if (mesoTimeout) clearTimeout(mesoTimeout);
            mesoTimeout = setTimeout(() => {
                mesoTimeout = null;
                void db.set('il_meso_v16', nextVal);
            }, 500);

            return { activeMeso: nextVal };
        });
    }
}));

/**
 * Commit the latest in-memory workout/mesocycle immediately. Android can pause
 * or kill a WebView after it backgrounds; waiting for the 500 ms debounce at
 * that boundary risks losing the very last set edit.
 */
export const flushStorePersistence = () => {
    const { activeSession, activeMeso } = useStore.getState();

    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
    if (mesoTimeout) {
        clearTimeout(mesoTimeout);
        mesoTimeout = null;
    }

    void db.set('il_session_v16', activeSession);
    void db.set('il_meso_v16', activeMeso);
};

// Auto-initialize
void useStore.getState()._init();

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushStorePersistence();
    });
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushStorePersistence);
}
