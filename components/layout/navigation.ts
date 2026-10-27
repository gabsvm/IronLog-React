/**
 * Single navigation contract (Fase 2 shell).
 *
 * Root destinations: home (Hoy), routine (Rutina), progress (Progreso),
 * diary (Diario). Depth-2 children: workout, summary, exercises, program,
 * measure (real route owned by MeasurementsParity).
 *
 * Legacy view names ('history' | 'stats' | 'nutrition') never reach the
 * renderers: resolveAppView() translates them once at the boundary
 * (App.setView, gainslab:navigate, shortcuts). Diary section travels in the
 * navigate event detail or persists in the Diary container.
 */
import { OPEN_MEASURE_EVENT } from '../../utils/measurements';
import { pickLang } from '../../utils/i18n';
import type { OpenMeasureDetail } from '../../utils/measurements';
export { setPendingMeasureDetail, consumePendingMeasureDetail } from '../../utils/measurements';
export type { OpenMeasureDetail };
export type StrongMeasureDetail = OpenMeasureDetail;

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
export type ChildView = 'workout' | 'summary' | 'exercises' | 'program' | 'measure';
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
    measure: 'measure',
};

/* ── Strong v6.2.4 parity (visual/structural) ─────────────────────────────
 * Five Strong destinations: Profile · History · Workout · Exercises · Measure.
 * History/Workout/Exercises map onto existing AppView roots + children;
 * Measure is a real 'measure' route (views/MeasureView, owned by
 * MeasurementsParity) reached via STRONG_MEASURE_EVENT + the shared
 * pending-detail store; only Profile stays a Layout-level overlay until it
 * is promoted to a first-class AppView. Back-compat: ROOT_NAV_ITEMS,
 * resolveAppView(), QUICK_START_EVENT and requestQuickStart() unchanged.
 */

export type StrongRootId = 'profile' | 'history' | 'workout' | 'exercises' | 'measure';

export interface StrongNavItem {
    id: StrongRootId;
    /** Must exist in Icon.tsx ICON_MAP. */
    icon: string;
    label: { en: string; es: string };
    /** Central raised action (Workout). */
    isFab?: boolean;
}

export const STRONG_NAV_ITEMS: readonly StrongNavItem[] = [
    { id: 'profile', icon: 'User', label: { en: 'Profile', es: 'Perfil' } },
    { id: 'history', icon: 'Calendar', label: { en: 'History', es: 'Historial' } },
    { id: 'workout', icon: 'Dumbbell', label: { en: 'Workout', es: 'Entreno' }, isFab: true },
    { id: 'exercises', icon: 'Layers', label: { en: 'Exercises', es: 'Ejercicios' } },
    { id: 'measure', icon: 'Scale', label: { en: 'Measure', es: 'Medidas' } },
];

export const strongLabel = (item: StrongNavItem, lang: string): string =>
    pickLang(lang, item.label);

/** STRONG_MEASURE_EVENT requests the real 'measure' route; STRONG_PROFILE_EVENT opens the profile dashboard overlay. */
export const STRONG_MEASURE_EVENT = OPEN_MEASURE_EVENT;
export const STRONG_PROFILE_EVENT = 'gainslab:open-strong-profile';

/** Measure destination is a real route ('measure' AppView); the pending
 * detail store lives in utils/measurements.ts (re-exported at top). */
export function requestMeasurePanel(detail?: OpenMeasureDetail): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(STRONG_MEASURE_EVENT, { detail: detail ?? null, cancelable: true }));
    }
}
export function requestStrongProfile(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(STRONG_PROFILE_EVENT));
    }
}

export interface StrongActiveCtx {
    view: AppView;
    diarySection?: DiarySection;
    strongProfileOpen: boolean;
    measureOpen: boolean;
}

/**
 * Which Strong tab appears active for a given shell state.
 * Training family (home/workout/summary/routine/program) → workout.
 * Diary (sessions + nutrition) → history. Exercises → exercises.
 * Measure (real route) → measure. Progress surfaces inside the Strong
 * Profile dashboard, so it highlights profile. The profile overlay wins.
 */
export function strongActiveId(ctx: StrongActiveCtx): StrongRootId {
    if (ctx.strongProfileOpen) return 'profile';
    if (ctx.measureOpen) return 'measure';
    switch (ctx.view) {
        case 'measure': return 'measure';
        case 'exercises': return 'exercises';
        case 'diary': return 'history';
        case 'progress': return 'profile';
        case 'home':
        case 'workout':
        case 'summary':
        case 'routine':
        case 'program':
        default: return 'workout';
    }
}

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
