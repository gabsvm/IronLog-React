import React, { useMemo, useState } from 'react';
import { useApp, useAppPreferences, useSyncStatus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { countSessionsByScope, filterLogsByScope } from '../../utils/statsScope';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { BodyMetricsModal } from './BodyMetricsModal';
import { triggerHaptic } from '../../utils/audio';

interface ProfileSheetProps {
    open: boolean;
    onClose: () => void;
    onOpenSettings: (tab?: 'account' | 'training' | 'appearance' | 'data') => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ open, onClose, onOpenSettings }) => {
    const { userProfile, setUserProfile, logs, config, setConfig, theme, colorTheme } = useApp();
    const { isOnline, syncStatus } = useSyncStatus();
    const { lang, setLang } = useAppPreferences();
    const { user, logout } = useAuth();
    const { isPro, tier } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const [showBodyModal, setShowBodyModal] = useState(false);
    const planLabel = isPro && tier
        ? ((TRANSLATIONS[lang].planTypes as Record<string, string>)[tier] || tier)
        : null;

    const stats = useMemo(() => {
        const completed = filterLogsByScope(logs, null);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recent = completed.filter((log: any) => (log.endTime || log.startTime || 0) >= thirtyDaysAgo);
        return {
            total: countSessionsByScope(logs, null),
            recent: recent.length,
        };
    }, [logs]);

    const openSettingsTab = (tab?: 'account' | 'training' | 'appearance' | 'data') => {
        onClose();
        window.setTimeout(() => onOpenSettings(tab), 120);
    };

    const handleToggleRIR = () => {
        triggerHaptic('light');
        setConfig({ showRIR: !config.showRIR });
    };

    const handleToggleWakeLock = () => {
        triggerHaptic('light');
        setConfig({ keepScreenOn: !config.keepScreenOn });
    };

    const handleToggleLang = () => {
        triggerHaptic('light');
        setLang(lang === 'es' ? 'en' : 'es');
    };

    const accountLabel = user
        ? (isPro ? (lang === 'es' ? 'Miembro Pro' : 'Pro member') : (lang === 'es' ? 'Cuenta gratuita' : 'Free account'))
        : (lang === 'es' ? 'Modo local' : 'Local mode');

    const userName = user?.displayName || user?.email?.split('@')[0] || (lang === 'es' ? 'Usuario' : 'User');
    const userInitial = (userName[0] || 'G').toUpperCase();

    const colorThemeLabel: Record<string, string> = {
        emerald: lang === 'es' ? 'Lima' : 'Lime',
        ocean: lang === 'es' ? 'Océano' : 'Ocean',
        forest: lang === 'es' ? 'Bosque' : 'Forest',
        royal: lang === 'es' ? 'Real' : 'Royal',
        sunset: lang === 'es' ? 'Atardecer' : 'Sunset',
        monochrome: lang === 'es' ? 'Monocromo' : 'Monochrome',
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => { if (!next) onClose(); }}
            variant="full"
            title={lang === 'es' ? 'Tú' : 'You'}
            accent="primary"
        >
            <div className="mx-auto w-full max-w-md px-4 pb-24 pt-2 space-y-4">
                {/* 1. User Profile Info */}
                <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-full bg-surface-raised border-2 border-amber-400/90 flex items-center justify-center font-bold text-xl text-white shadow-sm shrink-0">
                        {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-white truncate">{userName}</span>
                            {isPro && (
                                <span className="chip-reference text-amber-400 font-semibold">
                                    Pro
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-muted truncate mt-0.5">
                            {user?.email ? `${user.email} · ` : ''}{planLabel || accountLabel}
                        </div>
                    </div>
                </div>

                {/* 2. Quick Stats (3 Columns) */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="card-reference p-3">
                        <div className="text-lg font-semibold text-white tabular-nums">{stats.total}</div>
                        <div className="text-xs text-muted">{lang === 'es' ? 'Sesiones' : 'Sessions'}</div>
                    </div>
                    <div className="card-reference p-3">
                        <div className="text-lg font-semibold text-white tabular-nums">{stats.recent}</div>
                        <div className="text-xs text-muted">{lang === 'es' ? 'Últimos 30 d' : 'Last 30 d'}</div>
                    </div>
                    <div className="card-reference p-3">
                        <div className="text-lg font-semibold text-white tabular-nums truncate">
                            {userProfile?.bodyWeight ? `${userProfile.bodyWeight} kg` : '—'}
                        </div>
                        <div className="text-xs text-muted flex items-center gap-1">
                            <span>{userProfile?.height ? `${userProfile.height} cm` : '—'}</span>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() => setShowBodyModal(true)}
                                className="text-primary-400 font-semibold hover:underline"
                            >
                                {lang === 'es' ? 'Editar' : 'Edit'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Training Group */}
                <div>
                    <div className="label-reference px-1 mb-1.5">{lang === 'es' ? 'Entrenamiento' : 'Training'}</div>
                    <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                        {activeMeso && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                            >
                                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                    <Icon name="Calendar" size={17} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{activeMeso.name}</div>
                                    <div className="text-xs text-muted">
                                        {lang === 'es' ? `Semana ${activeMeso.week} de ${activeMeso.targetWeeks || activeMeso.duration}` : `Week ${activeMeso.week} of ${activeMeso.targetWeeks || activeMeso.duration}`}
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => openSettingsTab('training')}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Layout" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Editor de programa' : 'Program editor'}</div>
                            <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={() => openSettingsTab('training')}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Dumbbell" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Ejercicios y plantillas' : 'Exercises & templates'}</div>
                            <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                        </button>
                        <div className="flex items-center gap-3 p-3">
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Gauge" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Mostrar columna RIR' : 'Show RIR column'}</div>
                            <button
                                type="button"
                                onClick={handleToggleRIR}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.showRIR ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.showRIR ? 'left-[22px] bg-zinc-950' : 'left-0.5 bg-zinc-400'}`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 p-3">
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Smartphone" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Mantener pantalla encendida' : 'Keep screen awake'}</div>
                            <button
                                type="button"
                                onClick={handleToggleWakeLock}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.keepScreenOn ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.keepScreenOn ? 'left-[22px] bg-zinc-950' : 'left-0.5 bg-zinc-400'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Appearance Group */}
                <div>
                    <div className="label-reference px-1 mb-1.5">{lang === 'es' ? 'Apariencia' : 'Appearance'}</div>
                    <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                        <button
                            type="button"
                            onClick={() => openSettingsTab('appearance')}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Palette" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Tema y color' : 'Theme & color'}</div>
                            <span className="text-xs text-muted">
                                {theme === 'light' ? (lang === 'es' ? 'Claro' : 'Light') : (lang === 'es' ? 'Oscuro' : 'Dark')} · {colorThemeLabel[colorTheme] || colorTheme}
                            </span>
                            <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleLang}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Globe" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Idioma' : 'Language'}</div>
                            <span className="text-xs text-muted">{lang === 'es' ? 'Español' : 'English'}</span>
                            <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                        </button>
                    </div>
                </div>

                {/* 5. Data Group */}
                <div>
                    <div className="label-reference px-1 mb-1.5">{lang === 'es' ? 'Datos' : 'Data'}</div>
                    <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                        <div className="flex items-center gap-3 p-3">
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Cloud" size={17} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white">{lang === 'es' ? 'Sincronización' : 'Cloud sync'}</div>
                                <div className="text-xs text-muted truncate">
                                    {!user
                                        ? (lang === 'es' ? 'Modo local' : 'Local mode')
                                        : !isOnline
                                        ? (lang === 'es' ? 'Sin conexión (en cola)' : 'Offline (queued)')
                                        : syncStatus.isSyncing
                                        ? (lang === 'es' ? 'Sincronizando...' : 'Syncing...')
                                        : syncStatus.pending > 0
                                        ? (lang === 'es' ? `${syncStatus.pending} pendientes` : `${syncStatus.pending} pending`)
                                        : (lang === 'es' ? 'Actualizado en la nube' : 'Up to date in cloud')}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => openSettingsTab('data')}
                                className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors shrink-0"
                            >
                                {lang === 'es' ? 'Ver' : 'View'}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => openSettingsTab('data')}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Download" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{lang === 'es' ? 'Exportar y copia de seguridad' : 'Export & backup'}</div>
                            <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                        </button>
                    </div>
                </div>

                {/* 6. Logout / Login */}
                <div className="text-center pt-2">
                    {user ? (
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                logout();
                                onClose();
                            }}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors py-2"
                        >
                            {lang === 'es' ? 'Cerrar sesión' : 'Sign out'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => openSettingsTab('account')}
                            className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors py-2"
                        >
                            {lang === 'es' ? 'Iniciar sesión' : 'Sign in'}
                        </button>
                    )}
                </div>
            </div>

            <BodyMetricsModal
                open={showBodyModal}
                onClose={() => setShowBodyModal(false)}
                userProfile={userProfile || null}
                onSave={(updated) => {
                    if (setUserProfile) {
                        setUserProfile((prev: any) => ({ ...prev, ...updated }));
                    }
                }}
                lang={lang}
            />
        </Sheet>
    );
};