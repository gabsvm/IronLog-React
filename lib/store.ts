import { create } from 'zustand';
import { db } from '../utils/db';
import { ActiveSession, MesoCycle } from '../types';

interface AppStateStore {
    activeSession: ActiveSession | null;
    activeMeso: MesoCycle | null;
    isStoreLoading: boolean;
    setActiveSession: (val: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    _init: () => Promise<void>;
}

// Debounce helpers for IndexedDB
let sessionTimeout: ReturnType<typeof setTimeout> | null = null;
let mesoTimeout: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppStateStore>((set, get) => ({
    activeSession: null,
    activeMeso: null,
    isStoreLoading: true,
    _init: async () => {
        try {
            const [session, meso] = await Promise.all([
                db.get<ActiveSession | null>('il_session_v16', null),
                db.get<MesoCycle | null>('il_meso_v16', null)
            ]);
            set({ activeSession: session, activeMeso: meso, isStoreLoading: false });
        } catch (e) {
            console.error('[Store] IndexedDB init failed — defaulting to empty state:', e);
            set({ isStoreLoading: false });
        }
    },
    setActiveSession: (val) => {
        set((state) => {
            const nextVal = typeof val === 'function' ? val(state.activeSession) : val;
            
            // Persist to IDB
            if (sessionTimeout) clearTimeout(sessionTimeout);
            sessionTimeout = setTimeout(() => {
                db.set('il_session_v16', nextVal);
            }, 500);

            return { activeSession: nextVal };
        });
    },
    setActiveMeso: (val) => {
        set((state) => {
            const nextVal = typeof val === 'function' ? val(state.activeMeso) : val;
            
            // Persist to IDB
            if (mesoTimeout) clearTimeout(mesoTimeout);
            mesoTimeout = setTimeout(() => {
                db.set('il_meso_v16', nextVal);
            }, 500);

            return { activeMeso: nextVal };
        });
    }
}));

// Auto-initialize
useStore.getState()._init();
