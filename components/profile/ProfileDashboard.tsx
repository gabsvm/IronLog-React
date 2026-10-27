import React, { useMemo } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { countSessionsByScope, filterLogsByScope } from '../../utils/statsScope';
import { Icon } from '../ui/Icon';
import { pickLang } from '../../utils/i18n';
import { formatWeight, resolveWeightUnit, unitLabel } from '../../utils/units';
import { useTrainingConfig } from '../../hooks/useTrainingConfig';
import { requestQuickStart, STRONG_MEASURE_EVENT } from '../layout/navigation';
import type { ProfileSection } from './ProfileSheet';
import { MeasureWidget } from './MeasureWidget';

interface ProfileDashboardProps {
    onClose?: () => void;
    onOpenProfileSection?: (section?: ProfileSection | null) => void;
    onOpenMeasure?: () => void;
}

type LegacyTarget = { view: string; section?: string };

/**
 * Strong parity Profile destination: dashboard + widget surface.
 * Read-only over existing stores; every action routes through existing
 * entry points (gainslab:navigate, gainslab:open-profile, quick-start),
 * so current features stay reachable and persistence/sync are untouched.
 */
export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
    onClose,
    onOpenProfileSection,
    onOpenMeasure,
}) => {
    const { lang } = useAppPreferences();
    const { logs, userProfile, config, bodyLogs } = useApp();
    const { user } = useAuth();
    const hasActiveSession = useStore((state) => Boolean(state.activeSession));
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const copy = pickLang(lang, {
        es: {
            dashboard: 'Perfil',
            subtitle: 'Tu actividad, medidas y accesos directos.',
            thisWeek: 'Últimos 30 d',
            total: 'Totales',
            weight: 'Peso actual',
            start: 'Iniciar entreno',
            resume: 'Retomar sesión',
            plan: 'Tu plan',
            today: 'Hoy',
            routine: 'Rutina',
            progress: 'Progreso',
            diet: 'Dieta',
            exercises: 'Ejercicios',
            measure: 'Medidas',
            settings: 'Ajustes',
            account: 'Cuenta',
            body: 'Tu cuerpo',
            training: 'Entrenamiento',
            appearance: 'Apariencia',
            data: 'Datos',
            advanced: 'Avanzado',
            viewProgress: 'Ver progreso',
            close: 'Cerrar',
        },
        en: {
            dashboard: 'Profile',
            subtitle: 'Your activity, measures and shortcuts.',
            thisWeek: 'Last 30 d',
            total: 'Total',
            weight: 'Current weight',
            start: 'Start workout',
            resume: 'Resume session',
            plan: 'Your plan',
            today: 'Today',
            routine: 'Routine',
            progress: 'Progress',
            diet: 'Diet',
            exercises: 'Exercises',
            measure: 'Measure',
            settings: 'Settings',
            account: 'Account',
            body: 'Your body',
            training: 'Training',
            appearance: 'Appearance',
            data: 'Data',
            advanced: 'Advanced',
            viewProgress: 'View progress',
            close: 'Close',
        },
    });

    const stats = useMemo(() => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recent = filterLogsByScope(logs, null).filter(
            (log) => (log.endTime || log.startTime || 0) >= thirtyDaysAgo,
        );
        return { total: countSessionsByScope(logs, null), recent: recent.length };
    }, [logs]);

    // Independent body-weight unit (display only; bodyLogs/profile store kg).
    const [trainingPrefs] = useTrainingConfig();
    const unit = trainingPrefs.bodyWeightUnit ?? resolveWeightUnit(config);
    const latestWeight = useMemo(() => {
        const sorted = [...(bodyLogs ?? [])].sort((a, b) => a.date - b.date);
        return sorted[sorted.length - 1]?.weight ?? userProfile?.bodyWeight ?? null;
    }, [bodyLogs, userProfile]);

    const userName = user?.displayName || user?.email?.split('@')[0] || ty.defaultUser;
    const initial = (userName[0] || 'G').toUpperCase();

    // Layout's gainslab:navigate handler dismisses the panel (sync strip) and
    // flips the view; calling onClose here would schedule a competing back().
    const navigate = (target: LegacyTarget): void => {
        window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: target }));
    };

    const openProfileSection = (section?: ProfileSection | null): void => {
        if (onOpenProfileSection) {
            onOpenProfileSection(section ?? null);
            return;
        }
        window.dispatchEvent(
            new CustomEvent('gainslab:open-profile', { detail: { section: section ?? undefined } }),
        );
    };

    const openMeasure = (): void => {
        if (onOpenMeasure) {
            onOpenMeasure();
            return;
        }
        window.dispatchEvent(new CustomEvent(STRONG_MEASURE_EVENT));
    };

    const planItems: Array<{ id: string; label: string; icon: string; run: () => void }> = [
        { id: 'today', label: copy.today, icon: 'Home', run: () => navigate({ view: 'home' }) },
        { id: 'routine', label: copy.routine, icon: 'Layers', run: () => navigate({ view: 'routine' }) },
        { id: 'progress', label: copy.progress, icon: 'TrendingUp', run: () => navigate({ view: 'progress' }) },
        { id: 'diet', label: copy.diet, icon: 'Utensils', run: () => navigate({ view: 'diary', section: 'nutrition' }) },
        { id: 'exercises', label: copy.exercises, icon: 'Search', run: () => navigate({ view: 'exercises' }) },
        { id: 'measure', label: copy.measure, icon: 'Scale', run: openMeasure },
    ];

    const settingsItems: Array<{ id: ProfileSection; label: string; icon: string }> = [
        { id: 'account', label: copy.account, icon: 'User' },
        { id: 'body', label: copy.body, icon: 'Heart' },
        { id: 'training', label: copy.training, icon: 'Dumbbell' },
        { id: 'appearance', label: copy.appearance, icon: 'Palette' },
        { id: 'data', label: copy.data, icon: 'DownloadCloud' },
        { id: 'advanced', label: copy.advanced, icon: 'Settings' },
    ];

    return (
        <div className="space-y-4 px-4 pb-28 pt-2" role="region" aria-label={copy.dashboard} data-testid="profile-dashboard">
            <div className="flex items-start justify-between gap-3 pt-1">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] sm:text-3xl">
                        {copy.dashboard}
                    </h1>
                    <p className="mt-0.5 text-xs font-medium text-[rgb(var(--text-secondary))] sm:text-sm">
                        {copy.subtitle}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => openProfileSection(null)}
                        className="strong-quiet-btn !px-3"
                        aria-label={copy.settings}
                    >
                        <Icon name="Settings" size={17} />
                    </button>
                    {onClose && (
                        <button type="button" onClick={onClose} className="strong-quiet-btn !px-3" aria-label={copy.close}>
                            <Icon name="X" size={17} />
                        </button>
                    )}
                </div>
            </div>

            <section aria-label={ty.account} className="strong-card flex items-center gap-3 p-4">
                <div
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-elevated))] text-2xl font-bold text-[rgb(var(--text-primary))]"
                >
                    {initial}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-extrabold text-[rgb(var(--text-primary))]">{userName}</p>
                    <p className="truncate text-xs text-muted">{user?.email ?? ty.localMode}</p>
                    <button type="button" onClick={() => navigate({ view: 'progress' })} className="gl-textbtn mt-0.5 px-0">
                        {copy.viewProgress}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => (hasActiveSession ? navigate({ view: 'workout' }) : requestQuickStart())}
                    className="strong-action-btn shrink-0 !px-4"
                >
                    <Icon name={hasActiveSession ? 'Play' : 'Plus'} size={16} strokeWidth={2.5} />
                    {hasActiveSession ? copy.resume : copy.start}
                </button>
            </section>

            <dl className="grid grid-cols-3 gap-2" aria-label={copy.dashboard}>
                <div className="strong-tile p-3 text-center">
                    <dt className="text-[11px] font-semibold text-muted">{copy.thisWeek}</dt>
                    <dd className="gl-num mt-0.5 text-xl font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                        {stats.recent}
                    </dd>
                </div>
                <div className="strong-tile p-3 text-center">
                    <dt className="text-[11px] font-semibold text-muted">{copy.total}</dt>
                    <dd className="gl-num mt-0.5 text-xl font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                        {stats.total}
                    </dd>
                </div>
                <div className="strong-tile p-3 text-center">
                    <dt className="text-[11px] font-semibold text-muted">{copy.weight}</dt>
                    <dd className="gl-num mt-0.5 truncate text-xl font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                        {latestWeight
                            ? `${formatWeight(latestWeight, unit, lang)}`
                            : '—'}
                    </dd>
                    <dd className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {unitLabel(unit).toLowerCase()}
                    </dd>
                </div>
            </dl>

            <MeasureWidget mode="compact" onOpenFull={openMeasure} />

            <section aria-label={copy.plan}>
                <h2 className="strong-eyebrow px-1 pb-2">{copy.plan}</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {planItems.map((item) => (
                        <button key={item.id} type="button" onClick={item.run} className="strong-tile flex min-h-[64px] items-center gap-3 p-3 text-left">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--strong-action)/0.16)] text-[rgb(var(--strong-action-soft))]">
                                <Icon name={item.icon} size={19} strokeWidth={2.25} />
                            </span>
                            <span className="truncate text-sm font-bold text-[rgb(var(--text-primary))]">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section aria-label={copy.settings}>
                <h2 className="strong-eyebrow px-1 pb-2">{copy.settings}</h2>
                <ul className="divide-y divide-[rgb(var(--border-subtle))] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))]">
                    {settingsItems.map((item) => (
                        <li key={item.id} className="bg-[rgb(var(--surface-base))]">
                            <button
                                type="button"
                                onClick={() => openProfileSection(item.id)}
                                className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left transition-colors hover:bg-[rgb(var(--surface-raised))]"
                            >
                                <Icon name={item.icon} size={18} className="shrink-0 text-muted" />
                                <span className="flex-1 text-sm font-semibold text-[rgb(var(--text-primary))]">{item.label}</span>
                                <Icon name="ChevronRight" size={16} className="shrink-0 text-muted" />
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};
