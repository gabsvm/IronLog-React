import React, { useState, useMemo, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { usePro } from '../../hooks/usePro';
import { AdminControlPanel } from './AdminControlPanel';
import { PhilosophyModal } from '../ui/PhilosophyModal';
import { Sheet } from '../ui/Sheet';
import { useStore } from '../../lib/store';
import { GlobalTemplate } from '../../types';
import { BodyMetricsModal } from '../profile/BodyMetricsModal';

const PaywallModal = React.lazy(() => import('../pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface SettingsModalProps {
    onClose: () => void;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogin: () => void;
    isSyncing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, onOpenProgram, onOpenExercises, onReset, onExport, onForceSync, onImportFile, onLogin, isSyncing
}) => {
    const {
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        effectsMode, setEffectsMode, resolvedEffects,
        config, setConfig, deferredPrompt, installApp, isStandalone,
        userProfile, setUserProfile, syncStatus, isOnline, localLastUpdated, localSectionSyncMeta, pendingCloudSections,
        program, personalTemplates, setPersonalTemplates
    } = useApp();

    const { user, logout } = useAuth();
    const { isPro, tier, expiryDate, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const t = TRANSLATIONS[lang];

    const [tab, setTab] = useState<'account' | 'training' | 'appearance' | 'data'>('account');
    const [showPhilosophy, setShowPhilosophy] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showBodyModal, setShowBodyModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const activeMeso = useStore(state => state.activeMeso);

    const isAdmin = user?.email === 'gabsvm@gmail.com';

    const daysRemaining = useMemo(() => {
        if (!expiryDate) return null;
        const now = Date.now();
        const diff = expiryDate - now;
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [expiryDate]);

    const [installInstructions, setInstallInstructions] = useState<string | null>(null);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            installApp();
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
                setInstallInstructions(
                    lang === 'es'
                        ? 'En Safari, toca el botón Compartir (icono cuadrado con flecha hacia arriba) y selecciona "Agregar al inicio" (+) para instalar GainsLab.'
                        : 'In Safari, tap the Share button (square icon with upward arrow) and select "Add to Home Screen" (+) to install GainsLab.'
                );
            } else {
                setInstallInstructions(
                    lang === 'es'
                        ? 'Toca el menú del navegador (⋮) y selecciona "Instalar app" o "Agregar a la pantalla principal".'
                        : 'Tap the browser menu (⋮) and select "Install app" or "Add to Home Screen".'
                );
            }
        }
    };

    const Divider = () => <div className="h-px bg-zinc-100 dark:bg-white/5 my-5 mx-1" />;

    const ColorPill = ({ color, active, onClick, label }: any) => (
        <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group">
            <div className={`w-10 h-10 rounded-full ${color} shadow-sm border-2 transition-all ${active ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-80 group-hover:opacity-100'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{label}</span>
        </button>
    );

    const ProToggle = ({ label, value, onChange, featureName }: any) => (
        <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
            <button
                type="button"
                onClick={() => checkPro(featureName) && onChange(!value)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${value ? 'bg-primary-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
            >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${value ? 'translate-x-6' : 'translate-x-0'}`}>
                    {!isPro && !value && <Icon name="Lock" size={8} className="text-zinc-400" />}
                </div>
            </button>
        </div>
    );

    const ProButton = ({ label, icon, onClick, featureName }: any) => (
        <button
            type="button"
            onClick={() => checkPro(featureName) && onClick()}
            className="w-full p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isPro ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                    <Icon name={icon} size={18} />
                </div>
                <span className={`font-bold text-sm ${isPro ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500'}`}>{label}</span>
            </div>
            {!isPro ? <Icon name="Lock" size={16} className="text-yellow-500" /> : <Icon name="ChevronRight" size={16} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />}
        </button>
    );

    const openSaveTemplate = () => {
        if (!activeMeso || program.length === 0) return;
        setTemplateName(activeMeso.name || (lang === 'es' ? 'Mi rutina' : 'My routine'));
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

    const MemberStatus = () => {
        if (tier === 'demo') {
            return (
                <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    Demo Account
                    <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase font-black">
                        {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left
                    </span>
                </div>
            );
        }
        return (
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                {isPro ? (lang === 'es' ? 'Miembro Pro' : 'Pro Member') : (lang === 'es' ? 'Cuenta gratuita' : 'Free Member')}
                {isPro && <span className="text-[9px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 px-1.5 py-0.5 rounded uppercase font-black">PRO</span>}
            </div>
        );
    };

    const tabs = [
        { id: 'account' as const, label: lang === 'es' ? 'Cuenta' : 'Account', icon: 'User' },
        { id: 'training' as const, label: lang === 'es' ? 'Entreno' : 'Training', icon: 'Dumbbell' },
        { id: 'appearance' as const, label: lang === 'es' ? 'Visual' : 'Theme', icon: 'Sun' },
        { id: 'data' as const, label: lang === 'es' ? 'Datos' : 'Data', icon: 'Shield' },
    ];

    return (
        <div
            className="fixed inset-0 bg-black/60 z-sheet flex justify-end backdrop-blur-sm animate-in fade-in duration-base"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
        >
            <div className="w-88 sm:w-96 max-w-full bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col" onClick={e => e.stopPropagation()}>

                <div className="p-5 pb-3 shrink-0 flex justify-between items-center bg-white dark:bg-zinc-900 z-10 border-b border-zinc-100 dark:border-white/5">
                    <h2 id="settings-modal-title" className="font-bold text-xl dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} aria-label="Close settings" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Tab bar */}
                <div role="tablist" aria-label="Settings sections" className="px-3 shrink-0 flex gap-1 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-white/5">
                    {tabs.map(tabDef => {
                        const active = tab === tabDef.id;
                        return (
                            <button
                                key={tabDef.id}
                                role="tab"
                                id={`settings-tab-${tabDef.id}`}
                                aria-controls={`settings-panel-${tabDef.id}`}
                                aria-selected={active}
                                onClick={() => setTab(tabDef.id)}
                                className={`relative flex-1 py-3 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors duration-200 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            >
                                <Icon name={tabDef.icon} size={15} />
                                <span className="truncate">{tabDef.label}</span>
                                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-500" />}
                            </button>
                        );
                    })}
                </div>

                <div
                    id={`settings-panel-${tab}`}
                    role="tabpanel"
                    aria-labelledby={`settings-tab-${tab}`}
                    className="flex-1 overflow-y-auto p-5 pb-24 space-y-4 scroll-container"
                >

                    {/* ACCOUNT TAB */}
                    {tab === 'account' && (<>
                        {!isStandalone && (
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 rounded-2xl shadow-lg shadow-primary-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
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
                                    onClick={handleInstallClick}
                                    className="bg-black text-primary-400 px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform"
                                >
                                    {t.installBtn}
                                </button>
                            </div>
                        )}

                        <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isPro ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                                    {isPro ? <Icon name="Crown" size={20} /> : <Icon name="User" size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <MemberStatus />
                                    <div className="text-xs text-zinc-500 truncate">{user ? user.email : (lang === 'es' ? 'Modo local (sin cuenta)' : 'Local mode (no account)')}</div>
                                </div>
                            </div>
                            {user ? (
                                <div className="space-y-2 pt-1">
                                    <button onClick={() => { logout(); onClose(); }} className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                                        {t.auth.logout}
                                    </button>
                                    {isAdmin && <AdminControlPanel adminEmail={user?.email || undefined} />}
                                </div>
                            ) : (
                                <button onClick={onLogin} className="w-full py-2.5 bg-primary-500 text-black rounded-xl text-xs font-bold hover:bg-primary-400 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                                    {t.auth.signInRegister}
                                </button>
                            )}
                        </div>

                        {/* Body Metrics Summary with Dedicated Edit Sheet Launcher */}
                        <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">{lang === 'es' ? 'Tu cuerpo' : 'Your body'}</h4>
                                    <p className="text-[10px] text-zinc-400">{lang === 'es' ? 'Medidas para cálculo de fuerza y calorías' : 'Metrics for strength & calories'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowBodyModal(true)}
                                    className="px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary-500/20 active:scale-95 transition-all"
                                >
                                    {lang === 'es' ? 'Editar' : 'Edit'}
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{lang === 'es' ? 'Peso' : 'Weight'}</div>
                                    <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                                        {userProfile?.bodyWeight ? `${userProfile.bodyWeight} kg` : '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{lang === 'es' ? 'Altura' : 'Height'}</div>
                                    <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                                        {userProfile?.height ? `${userProfile.height} cm` : '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{lang === 'es' ? 'Grasa' : 'Body fat'}</div>
                                    <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                                        {userProfile?.bodyFat ? `${userProfile.bodyFat}%` : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cloud Sync State */}
                        <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-500">{lang === 'es' ? 'Estado Cloud' : 'Cloud Status'}</span>
                                <span className={`font-black ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>
                                    {isOnline ? (lang === 'es' ? 'ONLINE' : 'ONLINE') : (lang === 'es' ? 'OFFLINE' : 'OFFLINE')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-500">{lang === 'es' ? 'Sincronización' : 'Sync'}</span>
                                <span className="font-black text-zinc-900 dark:text-white">
                                    {syncStatus.isSyncing ? (lang === 'es' ? 'SINCRONIZANDO...' : 'SYNCING...') : (lang === 'es' ? 'ACTUALIZADO' : 'IDLE')}
                                </span>
                            </div>
                            {user && (
                                <button
                                    onClick={onForceSync}
                                    disabled={isSyncing}
                                    className="w-full mt-2 py-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-primary-500/20 active:scale-98 transition-transform"
                                >
                                    <Icon name="RefreshCw" size={14} className={isSyncing ? "animate-spin" : ""} />
                                    {isSyncing ? (lang === 'es' ? 'Sincronizando...' : 'Syncing...') : (lang === 'es' ? 'Sincronizar ahora' : 'Sync now')}
                                </button>
                            )}
                        </div>
                    </>)}

                    {/* TRAINING TAB */}
                    {tab === 'training' && (<>
                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">
                                {lang === 'es' ? 'Gestión de Rutinas' : 'Routine Management'}
                            </label>
                            <div className="space-y-2.5">
                                <ProButton label={t.programEditor} icon="Layout" onClick={onOpenProgram} featureName="Custom Routines" />
                                <ProButton label={t.manageEx} icon="Dumbbell" onClick={onOpenExercises} featureName="Exercise Library" />
                                <button
                                    type="button"
                                    onClick={openSaveTemplate}
                                    disabled={!activeMeso || program.length === 0}
                                    className="w-full p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-45 disabled:active:scale-100"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                                            <Icon name="Copy" size={18} />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-sm text-zinc-700 dark:text-zinc-200">
                                                {lang === 'es' ? 'Guardar rutina como plantilla' : 'Save routine as template'}
                                            </span>
                                            <span className="block text-[10px] text-zinc-500 mt-0.5">
                                                {activeMeso && program.length > 0
                                                    ? (lang === 'es' ? 'Privada: solo visible en tu cuenta' : 'Private: visible only in your account')
                                                    : (lang === 'es' ? 'Inicia una rutina para poder guardarla' : 'Start a routine to save it')}
                                            </span>
                                        </div>
                                    </div>
                                    <Icon name="ChevronRight" size={16} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
                                </button>
                                <p className="text-[10px] text-zinc-500 leading-snug px-1">
                                    {lang === 'es'
                                        ? '💡 Two Block Mass se inicia desde el botón (+) en la barra inferior.'
                                        : '💡 Start Two Block Mass from the (+) button in the bottom bar.'}
                                </p>
                            </div>
                        </div>

                        <Divider />

                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">
                                {t.workoutConfig}
                            </label>
                            <div className="space-y-2.5">
                                <ProToggle label={t.showRIR} value={config.showRIR} onChange={(val: boolean) => setConfig({ ...config, showRIR: val })} featureName="RIR Tracking" />
                                <ProToggle label={t.keepScreen} value={config.keepScreenOn} onChange={(val: boolean) => setConfig({ ...config, keepScreenOn: val })} featureName="Screen Settings" />
                            </div>
                        </div>
                    </>)}

                    {/* APPEARANCE TAB */}
                    {tab === 'appearance' && (<>
                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.appearance}</label>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <button onClick={() => setTheme('dark')} className={`py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-transparent'}`}>
                                    <Icon name="Moon" size={14} /> Dark
                                </button>
                                <button onClick={() => setTheme('light')} className={`py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-300 shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-transparent'}`}>
                                    <Icon name="Sun" size={14} /> Light
                                </button>
                                <button onClick={() => setTheme('system')} className={`py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${theme === 'system' ? 'bg-zinc-900 text-white border-primary-500 dark:bg-zinc-800 dark:border-primary-500' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-transparent'}`}>
                                    <Icon name="Cpu" size={14} /> Auto
                                </button>
                            </div>

                            <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 mb-5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">{lang === 'es' ? 'Color de Acento' : 'Accent Color'}</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <ColorPill color="bg-[rgb(193,241,59)]" label={lang === 'es' ? 'Hipertrofia' : 'Hypertrophy'} active={colorTheme === 'iron'} onClick={() => setColorTheme('iron')} />
                                    <ColorPill color="bg-blue-500" label="Ocean" active={colorTheme === 'ocean'} onClick={() => setColorTheme('ocean')} />
                                    <ColorPill color="bg-emerald-500" label="Forest" active={colorTheme === 'forest'} onClick={() => setColorTheme('forest')} />
                                    <ColorPill color="bg-purple-500" label="Royal" active={colorTheme === 'royal'} onClick={() => setColorTheme('royal')} />
                                    <ColorPill color="bg-orange-500" label="Sunset" active={colorTheme === 'sunset'} onClick={() => setColorTheme('sunset')} />
                                    <ColorPill color="bg-zinc-500" label="Mono" active={colorTheme === 'monochrome'} onClick={() => setColorTheme('monochrome')} />
                                </div>
                            </div>

                            <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 mb-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                                        {lang === 'es' ? 'Efectos y Rendimiento' : 'Effects & Performance'}
                                    </label>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        {resolvedEffects.toUpperCase()}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEffectsMode('system')}
                                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${effectsMode === 'system' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-primary-500 shadow-sm' : 'bg-white dark:bg-zinc-800/40 text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        <Icon name="Cpu" size={14} />
                                        <span>{lang === 'es' ? 'Auto' : 'System'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEffectsMode('full')}
                                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${effectsMode === 'full' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-primary-500 shadow-sm' : 'bg-white dark:bg-zinc-800/40 text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        <Icon name="Zap" size={14} />
                                        <span>{lang === 'es' ? 'Completo' : 'Full'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEffectsMode('balanced')}
                                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${effectsMode === 'balanced' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-primary-500 shadow-sm' : 'bg-white dark:bg-zinc-800/40 text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        <Icon name="Layers" size={14} />
                                        <span>{lang === 'es' ? 'Equilibrado' : 'Balanced'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEffectsMode('reduced')}
                                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${effectsMode === 'reduced' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-primary-500 shadow-sm' : 'bg-white dark:bg-zinc-800/40 text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        <Icon name="EyeOff" size={14} />
                                        <span>{lang === 'es' ? 'Reducido' : 'Reduced'}</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                                    {effectsMode === 'system' && (lang === 'es' ? 'Equilibrado en móvil, completo en escritorio. Respeta la configuración de accesibilidad del sistema.' : 'Balanced on mobile, full on desktop. Honors system accessibility settings.')}
                                    {effectsMode === 'full' && (lang === 'es' ? 'Máxima fidelidad visual con desenfoques de vidrio completos y todas las animaciones.' : 'Full visual polish with rich backdrop blurs and complete animations.')}
                                    {effectsMode === 'balanced' && (lang === 'es' ? 'Recomendado para entrenar: transiciones suaves y vidrio contextual sin animaciones continuas de fondo.' : 'Recommended for workouts: smooth transitions and contextual glass without continuous background animation.')}
                                    {effectsMode === 'reduced' && (lang === 'es' ? 'Accesibilidad: elimina desenfoques pesados y minimiza el movimiento para ahorrar batería.' : 'Accessibility: disables backdrop blurs and minimizes motion for battery saving.')}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.language}</label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button onClick={() => setLang('en')} className={`py-3 rounded-xl text-xs font-bold border transition-colors ${lang === 'en' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-transparent'}`}>
                                        English
                                    </button>
                                    <button onClick={() => setLang('es')} className={`py-3 rounded-xl text-xs font-bold border transition-colors ${lang === 'es' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-transparent'}`}>
                                        Español
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>)}

                    {/* DATA TAB */}
                    {tab === 'data' && (<>
                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.database}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={onExport} className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" aria-label="Download">
                                    <Icon name="Download" size={14} /> {t.export}
                                </button>
                                <label className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer text-center flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                    <Icon name="Upload" size={14} /> {t.import}
                                    <input type="file" onChange={onImportFile} accept=".json" className="hidden" />
                                </label>
                            </div>
                        </div>

                        <Divider />

                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{lang === 'es' ? 'Diagnóstico Sync' : 'Sync Diagnostics'}</label>
                            <div className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-white/5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-500">{lang === 'es' ? 'Red' : 'Network'}</span>
                                    <span className={`font-black ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-500">{lang === 'es' ? 'Cola pendiente' : 'Pending queue'}</span>
                                    <span className="font-black text-zinc-900 dark:text-white">{syncStatus.pending}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-500">{lang === 'es' ? 'Estado' : 'Status'}</span>
                                    <span className="font-black text-zinc-900 dark:text-white">{syncStatus.isSyncing ? 'SYNCING' : 'IDLE'}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                    {lang === 'es' ? 'Último cambio local:' : 'Last local change:'} {localLastUpdated ? new Date(localLastUpdated).toLocaleString() : 'n/a'}
                                </div>
                                {pendingCloudSections.length > 0 && (
                                    <div className="text-[10px] text-amber-500">
                                        {lang === 'es' ? 'Secciones más nuevas en nube:' : 'Cloud-newer sections:'} {pendingCloudSections.join(', ')}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {Object.entries(localSectionSyncMeta).slice(0, 8).map(([section]) => (
                                        <span key={section} className="rounded-full bg-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            {section}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Credits & Philosophy</label>
                            <button onClick={() => setShowPhilosophy(true)} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex justify-center gap-2 items-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                <Icon name="BookOpen" size={16} /> Natural Hypertrophy (NH) 85% Rule
                            </button>
                        </div>

                        <Divider />

                        <div>
                            <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                            <button onClick={onReset} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" aria-label="Delete">
                                <Icon name="Trash2" size={16} /> {t.factoryReset}
                            </button>
                        </div>
                    </>)}
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
                title={lang === 'es' ? 'Guardar plantilla privada' : 'Save private template'}
                accent="primary"
                footer={<Button fullWidth onClick={savePersonalTemplate} disabled={!templateName.trim()}>{lang === 'es' ? 'Guardar plantilla' : 'Save template'}</Button>}
            >
                <div className="p-5 space-y-3">
                    <p className="text-sm text-zinc-500">
                        {lang === 'es'
                            ? 'Se guardará una copia de la rutina activa con todos sus cambios. No será visible para otros usuarios.'
                            : 'A copy of the active routine and its changes will be saved. Other users cannot see it.'}
                    </p>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">{lang === 'es' ? 'Nombre' : 'Name'}</label>
                        <input
                            autoFocus
                            value={templateName}
                            onChange={event => setTemplateName(event.target.value)}
                            maxLength={80}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 font-bold text-zinc-900 dark:text-white outline-none focus:border-primary-500"
                            placeholder={lang === 'es' ? 'Ej. Upper/Lower personalizado' : 'E.g. Custom Upper/Lower'}
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

            {installInstructions && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={lang === 'es' ? 'Cómo instalar GainsLab' : 'How to install GainsLab'}
                        description={installInstructions}
                        confirmText={lang === 'es' ? 'Entendido' : 'Got it'}
                        cancelText=""
                        variant="primary"
                        onConfirm={() => setInstallInstructions(null)}
                        onCancel={() => setInstallInstructions(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};
