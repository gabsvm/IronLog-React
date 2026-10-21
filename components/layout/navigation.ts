/**
 * Single navigation contract (Fase 2 shell).
 *
 * Root destinations: home (Hoy), routine (Rutina), progress (Progreso),
 * diary (Diario). Depth-2 children: workout, summary, exercises, program.
 * Editors/details are children of a root (program/exercises under routine).
 *
 * Legacy view names ('history' | 'stats' | 'nutrition') never reach the
 * renderers: resolveAppView() translates them once at the boundary
 * (App.setView, gainslab:navigate, shortcuts). Diary section travels in the
 * navigate event detail or persists in the Diary container.
 */
export type RootView = 'home' | 'routine' | 'progress' | 'diary';

export interface RootNavItem {
    id: RootView;
    labelKey: 'navToday' | 'navRoutine' | 'navProgress' | 'navDiary';
    icon: string;
}

/** Single nav definition for bottom bar and sidebar (labels resolve per lang at render). */
export const ROOT_NAV_ITEMS: readonly RootNavItem[] = [
    { id: 'home', labelKey: 'navToday', icon: 'Home' },
    { id: 'routine', labelKey: 'navRoutine', icon: 'Layers' },
    { id: 'progress', labelKey: 'navProgress', icon: 'TrendingUp' },
    { id: 'diary', labelKey: 'navDiary', icon: 'BookOpen' },
];
export type ChildView = 'workout' | 'summary' | 'exercises' | 'program';
export type AppView = RootView | ChildView;

export type DiarySection = 'sessions' | 'nutrition';


export const isValidDiarySection = (section: unknown): section is DiarySection =>
    section === 'sessions' || section === 'nutrition';

/** Pre-redesign names keep working at every entry point; renderers only see AppView. */
const LEGACY_VIEW_MAP: Record<string, AppView> = {
    home: 'home',
    workout: 'workout',
    history: 'diary',
    stats: 'progress',
    nutrition: 'diary',
    exercises: 'exercises',
    program: 'program',
    summary: 'summary',
    // The routine root did not exist before; program edit was the closest target.
    routine: 'routine',
    progress: 'progress',
    diary: 'diary',
};

export function resolveAppView(raw: unknown): AppView | null {
    if (typeof raw !== 'string') return null;
    return LEGACY_VIEW_MAP[raw] ?? null;
}

/** Opens the freestyle/session entry sheet from anywhere (Hoy/Rutina/sidebar). */
export const QUICK_START_EVENT = 'gainslab:quick-start';

export function requestQuickStart(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(QUICK_START_EVENT));
    }
}
