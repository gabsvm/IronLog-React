import React, { useMemo } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';

interface ProfileSheetProps {
    open: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
}

const Metric = ({ label, value, suffix }: { label: string; value?: number | null; suffix: string }) => (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-white/5 dark:bg-white/5">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</div>
        <div className="mt-1 text-xl font-black tabular-nums text-zinc-900 dark:text-white">
            {value ? `${value}${suffix}` : '—'}
        </div>
    </div>
);

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ open, onClose, onOpenSettings }) => {
    const { userProfile, logs } = useApp();
    const { lang } = useAppPreferences();
    const { user } = useAuth();
    const { isPro, tier } = usePro();
    const activeMeso = useStore(state => state.activeMeso);

    const stats = useMemo(() => {
        const safeLogs = Array.isArray(logs) ? logs : [];
        const completed = safeLogs.filter((log: any) => !log.skipped);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recent = completed.filter((log: any) => (log.endTime || log.startTime || 0) >= thirtyDaysAgo);
        return {
            total: completed.length,
            recent: recent.length,
        };
    }, [logs]);

    const openSettings = () => {
        onClose();
        window.setTimeout(onOpenSettings, 120);
    };

    const accountLabel = user
        ? (isPro ? (lang === 'es' ? 'Miembro Pro' : 'Pro member') : (lang === 'es' ? 'Cuenta gratuita' : 'Free account'))
        : (lang === 'es' ? 'Modo local' : 'Local mode');

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => { if (!next) onClose(); }}
            variant="full"
            title={lang === 'es' ? 'Perfil' : 'Profile'}
            accent="primary"
        >
            <div className="mx-auto w-full max-w-lg px-5 pb-28 pt-6">
                <section className="rounded-[2rem] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-zinc-900">
                    <div className="flex items-center gap-4">
                        <Avatar
                            email={user?.email}
                            photoURL={(user as any)?.photoURL}
                            isPro={isPro}
                            size={72}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="truncate text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                                    {user?.displayName || user?.email?.split('@')[0] || (lang === 'es' ? 'Usuario local' : 'Local user')}
                                </h2>
                                {isPro && (
                                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500">
                                        PRO
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 truncate text-xs font-medium text-zinc-500">{user?.email || accountLabel}</p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">
                                {isPro && tier ? `${accountLabel} · ${tier}` : accountLabel}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openSettings}
                        className="mt-5 flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3 text-left transition-transform active:scale-[0.98] dark:bg-white/5"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                <Icon name="Settings" size={18} />
                            </span>
                            <div>
                                <div className="text-sm font-black text-zinc-900 dark:text-white">{lang === 'es' ? 'Ajustes' : 'Settings'}</div>
                                <div className="text-[10px] text-zinc-500">{lang === 'es' ? 'Cuenta, apariencia, entrenamiento y datos' : 'Account, appearance, training and data'}</div>
                            </div>
                        </div>
                        <Icon name="ChevronRight" size={18} className="text-zinc-400" />
                    </button>
                </section>

                <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{lang === 'es' ? 'Tu cuerpo' : 'Your body'}</h3>
                        <button onClick={openSettings} className="text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
                            {lang === 'es' ? 'Editar' : 'Edit'}
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <Metric label={lang === 'es' ? 'Peso' : 'Weight'} value={userProfile?.bodyWeight} suffix=" kg" />
                        <Metric label={lang === 'es' ? 'Altura' : 'Height'} value={userProfile?.height} suffix=" cm" />
                        <Metric label={lang === 'es' ? 'Grasa' : 'Body fat'} value={userProfile?.bodyFat} suffix="%" />
                    </div>
                </section>

                <section className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 dark:border-white/5 dark:bg-zinc-900">
                        <Icon name="Dumbbell" size={18} className="text-primary-600 dark:text-primary-400" />
                        <div className="mt-4 text-3xl font-black tabular-nums text-zinc-950 dark:text-white">{stats.total}</div>
                        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{lang === 'es' ? 'Sesiones' : 'Sessions'}</div>
                    </div>
                    <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 dark:border-white/5 dark:bg-zinc-900">
                        <Icon name="Activity" size={18} className="text-primary-600 dark:text-primary-400" />
                        <div className="mt-4 text-3xl font-black tabular-nums text-zinc-950 dark:text-white">{stats.recent}</div>
                        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{lang === 'es' ? 'Últimos 30 días' : 'Last 30 days'}</div>
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-5 dark:border-white/5 dark:bg-zinc-900">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                            <Icon name="Calendar" size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{lang === 'es' ? 'Plan actual' : 'Current plan'}</div>
                            <div className="mt-1 truncate text-base font-black text-zinc-950 dark:text-white">
                                {activeMeso?.name || (lang === 'es' ? 'Sin plan activo' : 'No active plan')}
                            </div>
                            {activeMeso && (
                                <div className="mt-1 text-xs font-medium text-zinc-500">
                                    {lang === 'es' ? `Semana ${activeMeso.week} de ${activeMeso.targetWeeks || activeMeso.duration || '—'}` : `Week ${activeMeso.week} of ${activeMeso.targetWeeks || activeMeso.duration || '—'}`}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </Sheet>
    );
};