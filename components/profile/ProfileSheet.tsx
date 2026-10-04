import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useApp, useSyncMeta, useSyncStatus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { GlobalTemplate } from '../../types';
import { countSessionsByScope, filterLogsByScope } from '../../utils/statsScope';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { BodyMetricsModal } from './BodyMetricsModal';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { ErrorLogCard } from './ErrorLogCard';
import { StoragePersistRow } from './StoragePersistRow';
import { AutoBackupList } from './AutoBackupList';
import { PhilosophyModal } from '../ui/PhilosophyModal';
import { AdminControlPanel } from '../settings/AdminControlPanel';
import { AdminTemplateManager } from '../admin/AdminTemplateManager';
import { triggerHaptic } from '../../utils/audio';
import { requestTimerNotificationPermission } from '../../hooks/useTimer';

const PaywallModal = React.lazy(() => import('../pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

export type ProfileSection = 'account' | 'body' | 'training' | 'appearance' | 'data' | 'advanced' | 'danger';

interface ProfileSheetProps {
    open: boolean;
    onClose: () => void;
    initialSection?: ProfileSection | null;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogin: () => void;
    isSyncing: boolean;
}

/**
 * Unified "You" sheet: the former profile sheet and the Settings modal
 * merged into a single surface (N6). Sections: Cuenta, Tu cuerpo,
 * Entrenamiento, Apariencia, Datos, Avanzado (collapsible), Zona peligrosa.
 * Every label comes from TRANSLATIONS (t.* shared, ty.* = you.* local).
 */
export const ProfileSheet: React.FC<ProfileSheetProps> = ({
    open, onClose, initialSection, onOpenProgram, onOpenExercises,
    onReset, onExport, onForceSync, onImportFile, onLogin, isSyncing,
}) => {
    const {
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        effectsMode, setEffectsMode, resolvedEffects,
        config, setConfig, deferredPrompt, installApp, isStandalone,
        userProfile, setUserProfile, pendingCloudSections,
        program, personalTemplates, setPersonalTemplates, logs,
    } = useApp();
    const { localLastUpdated, localSectionSyncMeta } = useSyncMeta();
    const { isOnline, syncStatus } = useSyncStatus();
    const { user, logout } = useAuth();
    const { isPro, tier, expiryDate, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showBodyModal, setShowBodyModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showPhilosophy, setShowPhilosophy] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [notificationPerm, setNotificationPerm] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    const [installInstructions, setInstallInstructions] = useState<string | null>(null);

    const isAdmin = user?.email === 'gabsvm@gmail.com';

    // External entry points can request a section (e.g. back from the
    // exercises library lands on training); scroll there once per opening.
    useEffect(() => {
        if (!open || !initialSection) return;
        const timer = window.setTimeout(() => {
            document.getElementById(`profile-section-${initialSection}`)?.scrollIntoView?.({ block: 'start' });
        }, 350);
        return () => window.clearTimeout(timer);
    }, [open, initialSection]);

    const daysRemaining = useMemo(() => {
        if (!expiryDate) return null;
        const diff = expiryDate - Date.now();
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [expiryDate]);

    const stats = useMemo(() => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recent = filterLogsByScope(logs, null).filter((log: any) => (log.endTime || log.startTime || 0) >= thirtyDaysAgo);
        return {
            total: countSessionsByScope(logs, null),
            recent: recent.length,
        };
    }, [logs]);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            installApp();
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            setInstallInstructions(isIOS ? ty.installIos : ty.installOther);
        }
    };

    const openSaveTemplate = () => {
        if (!activeMeso || program.length === 0) return;
        setTemplateName(activeMeso.name || ty.saveTemplateEmpty);
        setShowSaveTemplate(true);
    };

    const savePersonalTemplate = () => {
        const title = templateName.trim();
        if (!title || program.length === 0) return;

        const id = `personal_${Date.now()}`;
        const template: GlobalTemplate = {
            id,
            name: id,
            title: { en: title, es: title },
            description: {
                en: 'Private template saved from your active routine.',
                es: 'Plantilla privada guardada desde tu rutina activa.',
            },
            isPro: false,
            order: personalTemplates.length,
            scope: 'personal',
            program: JSON.parse(JSON.stringify(program)),
        };

        setPersonalTemplates(prev => [...prev, template]);
        setShowSaveTemplate(false);
    };

    const handleToggleRIR = () => {
        triggerHaptic('light');
        setConfig({ showRIR: !config.showRIR });
    };

    const handleToggleWakeLock = () => {
        triggerHaptic('light');
        setConfig({ keepScreenOn: !config.keepScreenOn });
    };

    const openProgramGated = () => {
        if (!checkPro('Custom Routines')) return;
        onClose();
        onOpenProgram();
    };

    const openExercisesGated = () => {
        if (!checkPro('Exercise Library')) return;
        onClose();
        onOpenExercises();
    };

    const accountLabel = !user
        ? ty.localMode
        : tier === 'demo'
            ? `${ty.demoAccount}${daysRemaining != null ? ` · ${daysRemaining} ${daysRemaining === 1 ? ty.dayLeft : ty.daysLeft}` : ''}`
            : isPro ? ty.proMember : ty.freeMember;
    const planLabel = isPro && tier && tier !== 'demo'
        ? ((t.planTypes as Record<string, string>)[tier] || tier)
        : null;

    const userName = user?.displayName || user?.email?.split('@')[0] || ty.defaultUser;
    const userInitial = (userName[0] || 'G').toUpperCase();

    const syncStatusText = !user
        ? ty.localMode
        : !isOnline
            ? ty.syncQueued
            : syncStatus.isSyncing
                ? ty.syncing
                : syncStatus.pending > 0
                    ? ty.pendingCount.replace('{pending}', String(syncStatus.pending))
                    : ty.upToDate;

    const ColorPill = ({ color, active, onClick, label, checkDark }: any) => (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group"
        >
            <div
                className={`w-9 h-9 rounded-full ${color} flex items-center justify-center transition-all ${
                    active
                        ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white dark:ring-white scale-105 shadow-md'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                }`}
            >
                {active && (
                    <Icon
                        name="Check"
                        size={16}
                        strokeWidth={3}
                        className={checkDark ? 'text-zinc-950' : 'text-white'}
                    />
                )}
            </div>
            <span className={`text-xs transition-colors ${active ? 'font-medium text-white' : 'text-muted group-hover:text-white'}`}>
                {label}
            </span>
        </button>
    );

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => { if (!next) onClose(); }}
            variant="full"
            title={ty.title}
            accent="primary"
        >
            <div className="mx-auto w-full max-w-md px-4 pb-24 pt-2 space-y-4">
                {/* 1. Cuenta */}
                <div id="profile-section-account" className="space-y-4">
                    {!isStandalone && (
                        <div data-install-banner className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 rounded-2xl shadow-lg shadow-primary-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                            <div className="text-black">
                                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                    <Icon name="Download" size={16} className="animate-bounce" />
                                    {t.installApp}
                                </h3>
                                <p className="text-[11px] opacity-90 font-medium mt-1 max-w-[140px] leading-tight">
                                    {t.installDesc}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleInstallClick}
                                className="bg-black text-primary-400 px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform"
                            >
                                {t.installBtn}
                            </button>
                        </div>
                    )}

                    <div className="label-reference px-1">{ty.account}</div>
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

                    <div className="grid grid-cols-2 gap-2">
                        <div className="card-reference p-3">
                            <div className="text-lg font-semibold text-white tabular-nums">{stats.total}</div>
                            <div className="text-xs text-muted">{ty.sessions}</div>
                        </div>
                        <div className="card-reference p-3">
                            <div className="text-lg font-semibold text-white tabular-nums">{stats.recent}</div>
                            <div className="text-xs text-muted">{ty.last30}</div>
                        </div>
                    </div>

                    {user ? (
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                logout();
                                onClose();
                            }}
                            className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                        >
                            {t.auth.logout}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onLogin}
                            className="w-full py-2.5 bg-primary-500 text-black rounded-xl text-xs font-bold hover:bg-primary-400 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                        >
                            {t.auth.signInRegister}
                        </button>
                    )}

                    {user && (
                        <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setShowDeleteDialog(true);
                                }}
                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-500/10 transition-colors"
                            >
                                <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                    <Icon name="Trash2" size={17} />
                                </span>
                                <div className="flex-1 text-sm font-medium text-red-400">{t.deleteAccount.rowLabel}</div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Tu cuerpo */}
                <div id="profile-section-body">
                    <div className="label-reference px-1 mb-1.5">{ty.body}</div>
                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-zinc-400">{ty.bodySubtitle}</p>
                            <button
                                type="button"
                                onClick={() => setShowBodyModal(true)}
                                className="px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary-500/20 active:scale-95 transition-all"
                            >
                                {ty.edit}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{ty.weight}</div>
                                <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                                    {userProfile?.bodyWeight ? `${userProfile.bodyWeight} kg` : '—'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{ty.height}</div>
                                <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                                    {userProfile?.height ? `${userProfile.height} cm` : '—'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{ty.bodyFat}</div>
                                <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                                    {userProfile?.bodyFat ? `${userProfile.bodyFat}%` : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Entrenamiento */}
                <div id="profile-section-training">
                    <div className="label-reference px-1 mb-1.5">{ty.training}</div>
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
                                        {ty.mesoWeek.replace('{week}', String(activeMeso.week)).replace('{target}', String(activeMeso.targetWeeks || activeMeso.duration))}
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={openProgramGated}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Layout" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{t.programEditor}</div>
                            {!isPro
                                ? <Icon name="Lock" size={16} className="text-yellow-500 shrink-0" />
                                : <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />}
                        </button>
                        <button
                            type="button"
                            onClick={openExercisesGated}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Dumbbell" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{ty.exercisesRow}</div>
                            {!isPro
                                ? <Icon name="Lock" size={16} className="text-yellow-500 shrink-0" />
                                : <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />}
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setShowTemplateManager(true)}
                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                            >
                                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                    <Icon name="Copy" size={17} />
                                </span>
                                <div className="flex-1 text-sm font-medium text-white">{t.manageTemplates}</div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={openSaveTemplate}
                        disabled={!activeMeso || program.length === 0}
                        className="mt-2 w-full p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-45 disabled:active:scale-100"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                                <Icon name="Copy" size={18} />
                            </div>
                            <div>
                                <span className="block font-bold text-sm text-zinc-700 dark:text-zinc-200">
                                    {ty.saveTemplate}
                                </span>
                                <span className="block text-xs text-muted mt-0.5">
                                    {activeMeso && program.length > 0 ? ty.saveTemplatePrivate : ty.saveTemplateEmpty}
                                </span>
                            </div>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
                    </button>
                    <p className="text-xs text-muted leading-snug px-1 mt-2">
                        {ty.twoBlockHint}
                    </p>

                    <div className="label-reference px-1 mt-4 mb-1.5">{ty.workoutSetup}</div>
                    <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                        <div className="flex items-center gap-3 p-3">
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Gauge" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{t.showRIR}</div>
                            <button
                                type="button"
                                onClick={handleToggleRIR}
                                aria-label={t.showRIR}
                                aria-pressed={config.showRIR}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.showRIR ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.showRIR ? 'left-[22px] bg-white' : 'left-0.5 bg-white'}`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 p-3">
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Smartphone" size={17} />
                            </span>
                            <div className="flex-1 text-sm font-medium text-white">{t.keepScreen}</div>
                            <button
                                type="button"
                                onClick={handleToggleWakeLock}
                                aria-label={t.keepScreen}
                                aria-pressed={config.keepScreenOn}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.keepScreenOn ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.keepScreenOn ? 'left-[22px] bg-white' : 'left-0.5 bg-white'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                            <span className="text-sm font-medium text-white">{t.restTimerDisplay}</span>
                            <div className="flex gap-1 bg-zinc-200/50 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-border-subtle shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setConfig({ ...config, restTimerDisplay: 'compact' })}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                                        (config.restTimerDisplay || 'compact') === 'compact'
                                            ? 'bg-primary-500 text-black shadow-sm'
                                            : 'text-muted hover:text-white'
                                    }`}
                                >
                                    {t.restTimerCompact}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfig({ ...config, restTimerDisplay: 'expanded' })}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                                        config.restTimerDisplay === 'expanded'
                                            ? 'bg-primary-500 text-black shadow-sm'
                                            : 'text-muted hover:text-white'
                                    }`}
                                >
                                    {t.restTimerExpanded}
                                </button>
                            </div>
                        </div>
                        {typeof window !== 'undefined' && 'Notification' in window && (
                            <div className="flex items-center justify-between gap-2 p-3">
                                <div className="flex flex-col pr-2">
                                    <span className="text-sm font-medium text-white">{t.restNotifications}</span>
                                    <span className="text-[10px] text-muted">{t.restNotificationsDesc}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await requestTimerNotificationPermission();
                                        if (typeof Notification !== 'undefined') {
                                            setNotificationPerm(Notification.permission);
                                        }
                                    }}
                                    className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all shrink-0 ${
                                        notificationPerm === 'granted'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : notificationPerm === 'denied'
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            : 'bg-primary-500 text-zinc-950 hover:bg-primary-400'
                                    }`}
                                >
                                    {notificationPerm === 'granted'
                                        ? ty.notifEnabled
                                        : notificationPerm === 'denied'
                                        ? ty.notifDenied
                                        : ty.notifAllow}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Apariencia */}
                <div id="profile-section-appearance">
                    <div className="label-reference px-1 mb-1.5">{ty.appearance}</div>
                    <div className="label-reference px-1 mb-1.5">{t.theme}</div>
                    <div className="seg-reference grid grid-cols-3 gap-1 p-1 mb-4">
                        <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                theme === 'dark'
                                    ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            <Icon name="Moon" size={14} /> {ty.themeDark}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                theme === 'light'
                                    ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            <Icon name="Sun" size={14} /> {ty.themeLight}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTheme('system')}
                            className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                theme === 'system'
                                    ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            <Icon name="Smartphone" size={14} /> {ty.themeAuto}
                        </button>
                    </div>

                    <div className="label-reference px-1 mb-1.5">{ty.accent}</div>
                    <div className="card-reference p-4 mb-4">
                        <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center text-xs">
                            <ColorPill color="bg-[#c4f13a]" checkDark label={ty.pillIron} active={colorTheme === 'iron'} onClick={() => setColorTheme('iron')} />
                            <ColorPill color="bg-[#378add]" label={ty.pillOcean} active={colorTheme === 'ocean'} onClick={() => setColorTheme('ocean')} />
                            <ColorPill color="bg-[#1d9e75]" label={ty.pillForest} active={colorTheme === 'forest'} onClick={() => setColorTheme('forest')} />
                            <ColorPill color="bg-[#8f4fc9]" label={ty.pillRoyal} active={colorTheme === 'royal'} onClick={() => setColorTheme('royal')} />
                            <ColorPill color="bg-[#d4631a]" label={ty.pillSunset} active={colorTheme === 'sunset'} onClick={() => setColorTheme('sunset')} />
                            <ColorPill color="bg-[#5f6068]" label={ty.pillMono} active={colorTheme === 'monochrome'} onClick={() => setColorTheme('monochrome')} />
                        </div>
                    </div>

                    <div className="label-reference px-1 mb-1.5">{t.language}</div>
                    <div className="seg-reference grid grid-cols-2 gap-1 p-1 mb-4">
                        <button
                            type="button"
                            onClick={() => setLang('en')}
                            className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                                lang === 'en'
                                    ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            English
                        </button>
                        <button
                            type="button"
                            onClick={() => setLang('es')}
                            className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                                lang === 'es'
                                    ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            Español
                        </button>
                    </div>

                    <div className="card-reference p-3.5 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                <Icon name="Zap" size={17} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white">{ty.effectsTitle}</div>
                                <div className="text-xs text-muted truncate">
                                    {effectsMode === 'system' && ty.effectsSystemDesc}
                                    {effectsMode === 'full' && ty.effectsFullDesc}
                                    {effectsMode === 'balanced' && ty.effectsBalancedDesc}
                                    {effectsMode === 'reduced' && ty.effectsReducedDesc}
                                </div>
                            </div>
                            <span className="chip-reference text-xs font-semibold text-muted">
                                {resolvedEffects.toUpperCase()}
                            </span>
                        </div>

                        <div className="seg-reference grid grid-cols-4 gap-1 p-1">
                            <button
                                type="button"
                                onClick={() => setEffectsMode('system')}
                                className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                    effectsMode === 'system'
                                        ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                        : 'text-muted hover:text-white'
                                }`}
                            >
                                <Icon name="Cpu" size={14} />
                                <span>{ty.effectsSystem}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEffectsMode('full')}
                                className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                    effectsMode === 'full'
                                        ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                        : 'text-muted hover:text-white'
                                }`}
                            >
                                <Icon name="Zap" size={14} />
                                <span>{ty.effectsFull}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEffectsMode('balanced')}
                                className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                    effectsMode === 'balanced'
                                        ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                        : 'text-muted hover:text-white'
                                }`}
                            >
                                <Icon name="Layers" size={14} />
                                <span>{ty.effectsBalanced}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEffectsMode('reduced')}
                                className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                    effectsMode === 'reduced'
                                        ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                        : 'text-muted hover:text-white'
                                }`}
                            >
                                <Icon name="EyeOff" size={14} />
                                <span>{ty.effectsReduced}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed px-1">
                            {effectsMode === 'system' && ty.effectsSystemLong}
                            {effectsMode === 'full' && ty.effectsFullLong}
                            {effectsMode === 'balanced' && ty.effectsBalancedLong}
                            {effectsMode === 'reduced' && ty.effectsReducedLong}
                        </p>
                    </div>
                </div>

                {/* 5. Datos */}
                <div id="profile-section-data">
                    <div className="label-reference px-1 mb-1.5">{ty.data}</div>
                    <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                        <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-500">{ty.cloudStatus}</span>
                                <span className={`font-black uppercase ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>
                                    {isOnline ? ty.online : ty.offline}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                                    <Icon name="Cloud" size={17} />
                                </span>
                                <div className="flex-1 min-w-0 text-xs text-muted truncate">
                                    {syncStatusText}
                                </div>
                            </div>
                            {user && (
                                <button
                                    type="button"
                                    onClick={onForceSync}
                                    disabled={isSyncing}
                                    className="w-full mt-2 py-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-primary-500/20 active:scale-98 transition-transform"
                                >
                                    <Icon name="RefreshCw" size={14} className={isSyncing ? "animate-spin" : ""} />
                                    {isSyncing ? ty.syncing : ty.syncNow}
                                </button>
                            )}
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={onExport}
                                    className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    aria-label="Download"
                                >
                                    <Icon name="Download" size={14} /> {t.export}
                                </button>
                                <label className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer text-center flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                    <Icon name="Upload" size={14} /> {t.import}
                                    <input type="file" onChange={onImportFile} accept=".json" className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2">
                        <AutoBackupList lang={lang} />
                    </div>
                </div>

                {/* 6. Avanzado (plegable) */}
                <div id="profile-section-advanced">
                    <details>
                        <summary className="label-reference px-1 mb-1.5 cursor-pointer list-none flex items-center gap-1.5 [&::-webkit-details-marker]:hidden">
                            {ty.advanced}
                            <Icon name="ChevronDown" size={14} className="text-muted" />
                        </summary>
                        <div className="space-y-4">
                            <div className="card-reference p-4 space-y-2">
                                <div className="label-reference px-1 mb-1">{ty.diagnostics}</div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-500">{ty.network}</span>
                                    <span className={`font-black ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-500">{ty.pendingQueue}</span>
                                    <span className="font-black text-zinc-900 dark:text-white">{syncStatus.pending}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-500">{ty.status}</span>
                                    <span className="font-black text-zinc-900 dark:text-white">{syncStatus.isSyncing ? ty.syncingState : ty.idleState}</span>
                                </div>
                                <div className="text-xs text-muted">
                                    {ty.lastChange} {localLastUpdated ? new Date(localLastUpdated).toLocaleString() : 'n/a'}
                                </div>
                                <StoragePersistRow lang={lang} />
                                {pendingCloudSections.length > 0 && (
                                    <div className="text-[10px] text-amber-500">
                                        {ty.cloudNewer}{' '}
                                        {pendingCloudSections.map(s => ((t.syncSections as any)?.[s]) || s).join(', ')}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {Object.entries(localSectionSyncMeta).slice(0, 8).map(([section]) => (
                                        <span key={section} className="rounded-full bg-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            {((t.syncSections as any)?.[section]) || section}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <ErrorLogCard lang={lang} syncStatusText={syncStatusText} />
                            <div>
                                <div className="label-reference px-1 mb-1.5">{t.creditsTitle}</div>
                                <button
                                    type="button"
                                    onClick={() => setShowPhilosophy(true)}
                                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex justify-center gap-2 items-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Icon name="BookOpen" size={16} /> {t.nhRule}
                                </button>
                            </div>

                            {isAdmin && <AdminControlPanel adminEmail={user?.email || undefined} />}
                        </div>
                    </details>
                </div>

                {/* 7. Zona peligrosa */}
                <div id="profile-section-danger">
                    <div className="label-reference px-1 mb-1.5 !text-red-400">{t.dangerZone}</div>
                    <button
                        type="button"
                        onClick={onReset}
                        className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Delete"
                    >
                        <Icon name="Trash2" size={16} /> {t.factoryReset}
                    </button>
                </div>
            </div>

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}

            <PhilosophyModal isOpen={showPhilosophy} onClose={() => setShowPhilosophy(false)} lang={lang} />

            <Sheet
                open={showSaveTemplate}
                onOpenChange={setShowSaveTemplate}
                title={ty.saveTemplateTitle}
                accent="primary"
                footer={<Button fullWidth onClick={savePersonalTemplate} disabled={!templateName.trim()}>{ty.saveTemplateBtn}</Button>}
            >
                <div className="p-5 space-y-3">
                    <p className="text-sm text-zinc-500">
                        {ty.saveTemplateDesc}
                    </p>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">{ty.templateName}</label>
                        <input
                            autoFocus
                            value={templateName}
                            onChange={event => setTemplateName(event.target.value)}
                            maxLength={80}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 font-bold text-zinc-900 dark:text-white outline-none focus:border-primary-500"
                            placeholder={ty.templateNamePlaceholder}
                        />
                    </div>
                </div>
            </Sheet>

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

            <DeleteAccountDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onDeleted={() => {
                    setShowDeleteDialog(false);
                    onClose();
                }}
                isPro={isPro}
            />

            {showTemplateManager && (
                <AdminTemplateManager onClose={() => setShowTemplateManager(false)} />
            )}

            {installInstructions && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={ty.installHow}
                        description={installInstructions}
                        confirmText={ty.understood}
                        cancelText=""
                        variant="primary"
                        onConfirm={() => setInstallInstructions(null)}
                        onCancel={() => setInstallInstructions(null)}
                    />
                </Suspense>
            )}
        </Sheet>
    );
};
