import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { countSessionsByScope, filterLogsByScope } from '../../utils/statsScope';
import { Icon } from '../ui/Icon';
import { pickLang } from '../../utils/i18n';

interface ProfileWidgetProps {
    onOpen?: () => void;
}

/**
 * Strong parity compact profile widget: avatar + identity + 30d/total
 * counters + entry to the full dashboard. Pure read of existing stores;
 * never writes. Integrator may embed it in Home without side effects.
 */
export const ProfileWidget: React.FC<ProfileWidgetProps> = ({ onOpen }) => {
    const { lang, logs } = useApp();
    const { user } = useAuth();
    const t = TRANSLATIONS[lang];
    const ty = t.you;
    const stats = useMemo(() => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recent = filterLogsByScope(logs, null).filter(
            (log) => (log.endTime || log.startTime || 0) >= thirtyDaysAgo,
        );
        return { total: countSessionsByScope(logs, null), recent: recent.length };
    }, [logs]);

    const userName =
        user?.displayName || user?.email?.split('@')[0] || ty.defaultUser;
    const initial = (userName[0] || 'G').toUpperCase();
    const openLabel = pickLang(lang, { es: 'Ver perfil', en: 'View profile' });

    return (
        <section aria-label={ty.title} className="strong-card p-4">
            <div className="flex items-center gap-3">
                <div
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-elevated))] text-xl font-bold text-[rgb(var(--text-primary))]"
                >
                    {initial}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[rgb(var(--text-primary))]">
                        {userName}
                    </p>
                    <p className="truncate text-xs text-muted">
                        {user?.email ?? ty.localMode}
                    </p>
                </div>
                {onOpen && (
                    <button type="button" onClick={onOpen} className="strong-quiet-btn shrink-0">
                        {openLabel}
                        <Icon name="ChevronRight" size={15} />
                    </button>
                )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2">
                <div className="strong-tile p-3 text-center">
                    <dt className="text-[11px] font-semibold text-muted">{ty.sessions}</dt>
                    <dd className="gl-num mt-0.5 text-lg font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                        {stats.recent}
                    </dd>
                    <dd className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {ty.last30}
                    </dd>
                </div>
                <div className="strong-tile p-3 text-center">
                    <dt className="text-[11px] font-semibold text-muted">{ty.sessions}</dt>
                    <dd className="gl-num mt-0.5 text-lg font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                        {stats.total}
                    </dd>
                    <dd className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {pickLang(lang, { es: 'Total', en: 'Total' })}
                    </dd>
                </div>
            </dl>
        </section>
    );
};
