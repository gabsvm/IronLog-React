
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

const PaywallModal = React.lazy(() => import('../pro/PaywallModal').then(m => ({ default: m.PaywallModal })));

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
        config, setConfig, resetTutorials, deferredPrompt, installApp, isStandalone,
        userProfile, setUserProfile, syncStatus, isOnline, localLastUpdated, localSectionSyncMeta, pendingCloudSections,
        program, personalTemplates, setPersonalTemplates
    } = useApp();

    const { user, logout } = useAuth();
    const { isPro, tier, expiryDate, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const t = TRANSLATIONS[lang];

    const [tab, setTab] = useState<'account' | 'prefs' | 'advanced'>('account');
    const [showPhilosophy, setShowPhilosophy] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
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

    const handleInstallClick = () => {
        if (deferredPrompt) {
            installApp();
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
                alert(t.iosInstall);
            } else {
                alert(t.androidInstall || "Tap the browser menu (⋮) and select 'Install App' or 'Add to Home Screen'.");
            }
        }
    };

    const Divider = () => <div className="h-px bg-zinc-100 dark:bg-white/5 my-6 mx-2" />;

    const ColorPill = ({ color, active, onClick, label }: any) => (
        <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95 group`}>
            <div className={`w-10 h-10 rounded-full ${color} shadow-sm border-2 transition-all ${active ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-80 group-hover:opacity-100'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{label}</span>
        </button>
    );

    const ProToggle = ({ label, value, onChange, featureName }: any) => (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-white/5">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
            <button
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
            onClick={() => checkPro(featureName) && onClick()}
            className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPro ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400'}`}>
                    <Icon name={icon} size={18} />
                </div>
                <span className={`font-bold text-sm ${isPro ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-500'}`}>{label}</span>
            </div>
            {!isPro ? <Icon name="Lock" size={16} className="text-yellow-500" /> : <Icon name="ChevronRight" size={16} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />}
        </button>
    );

    const handleProfileUpdate = (field: keyof typeof userProfile, val: number) => {
        if (setUserProfile) {
            setUserProfile((prev: any) => ({ ...prev, [field]: val }));
        }
    };

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
                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase font-black">
                        {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left
                    </span>
                </div>
            );
        }
        return (
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                {isPro ? "Pro Member" : "Free Member"}
                {isPro && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded uppercase font-black">PRO</span>}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-sheet flex justify-end backdrop-blur-sm animate-in fade-in duration-base"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
        >
            <div className="w-80 bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col" onClick={e => e.stopPropagation()}>

                <div className="p-6 pb-2 shrink-0 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
                    <h2 id="settings-modal-title" className="font-bold text-2xl dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} aria-label="Close settings" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={24} /></button>
                </div>

                {/* Tab bar */}
                <div role="tablist" aria-label="Settings sections" className="px-4 shrink-0 flex gap-1 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-white/5">
                    {([
                        { id: 'account' as const, label: lang === 'es' ? 'Cuenta' : 'Account', icon: 'User' },
                        { id: 'prefs' as const, label: lang === 'es' ? 'Preferencias' : 'Preferences', icon: 'Settings' },
                        { id: 'advanced' as const, label: lang === 'es' ? 'Avanzado' : 'Advanced', icon: 'Shield' },
                    ]).map(tabDef => {
                        const active = tab === tabDef.id;
                        return (
                            <button
                                key={tabDef.id}
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(tabDef.id)}
                                className={`relative flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors duration-200 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            >
                                <Icon name={tabDef.icon} size={14} />
                                {tabDef.label}
                                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-500" />}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4 pb-24 space-y-2 scroll-container">

                    {tab === 'account' && (<>
                    {!isStandalone && (
                        <div className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600 p-4 rounded-2xl shadow-lg shadow-primary-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                            <div className="text-black">
                                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                    <Icon name="Download" size={16} className="animate-bounce" />
                                    {t.installApp}
                                </h3>
                                <p className="text-[10px] opacity-90 font-medium mt-1 max-w-[130px] leading-tight">
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

                    {/* Account */}
                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPro ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-200 text-zinc-500'}`}>
                                {isPro ? <Icon name="Crown" size={20} /> : <Icon name="User" size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <MemberStatus />
                                <div className="text-xs text-zinc-500 truncate">{user ? user.email : t.auth.localStorage}</div>
                            </div>
                        </div>
                        {user ? (
                            <div className="space-y-2">
                                <button onClick={() => { logout(); onClose(); }} className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                                    {t.auth.logout}
                                </button>
                                {isAdmin && <AdminControlPanel adminEmail={user?.email || undefined} />}
                            </div>
                        ) : (
                            <button onClick={onLogin} className="w-full py-2 bg-primary-500 text-black rounded-lg text-xs font-bold hover:bg-primary-400 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                                {t.auth.signInRegister}
                            </button>
                        )}
                    </div>

                    {/* NEW: Profile Stats */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.profile.stats}</label>
                        <div className="space-y-3 bg-zinc-50 dark:bg-white/5 p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">{t.profile.bw} (kg)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white dark:bg-zinc-900 rounded-lg p-2 text-sm font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                                    value={userProfile?.bodyWeight || ''}
                                    onChange={e => handleProfileUpdate('bodyWeight', Number(e.target.value))}
                                    placeholder="e.g. 75"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">{t.profile.height} (cm)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white dark:bg-zinc-900 rounded-lg p-2 text-sm font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                                        value={userProfile?.height || ''}
                                        onChange={e => handleProfileUpdate('height', Number(e.target.value))}
                                        placeholder="e.g. 175"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">{t.profile.bf}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white dark:bg-zinc-900 rounded-lg p-2 text-sm font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                                        value={userProfile?.bodyFat || ''}
                                        onChange={e => handleProfileUpdate('bodyFat', Number(e.target.value))}
                                        placeholder="%"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    </>)}

                    {tab === 'prefs' && (<>

                    {/* Content Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.programEditor || "Content Management"}</label>
                        <div className="space-y-3">
                            <ProButton label={t.programEditor} icon="Layout" onClick={onOpenProgram} featureName="Custom Routines" />
                            <ProButton label={t.manageEx} icon="Dumbbell" onClick={onOpenExercises} featureName="Exercise Library" />
                            <button
                                onClick={openSaveTemplate}
                                disabled={!activeMeso || program.length === 0}
                                className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-45 disabled:active:scale-100"
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white">
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

                    {/* Workout Config Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.workoutConfig}</label>
                        <div className="space-y-3">
                            <ProToggle label={t.showRIR} value={config.showRIR} onChange={(val: boolean) => setConfig({ ...config, showRIR: val })} featureName="RIR Tracking" />
                            <ProToggle label={t.keepScreen} value={config.keepScreenOn} onChange={(val: boolean) => setConfig({ ...config, keepScreenOn: val })} featureName="Screen Settings" />
                        </div>
                    </div>

                    <Divider />

                    {/* Appearance Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.appearance}</label>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <button onClick={() => setTheme('dark')} className={`py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors duration-base ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-transparent'}`}><Icon name="Moon" size={14} /> Dark</button>
                            <button onClick={() => setTheme('light')} className={`py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors duration-base ${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-300' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-transparent'}`}><Icon name="Sun" size={14} /> Light</button>
                            <button onClick={() => setTheme('system')} className={`py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors duration-base ${theme === 'system' ? 'bg-zinc-900 text-white border-primary-500 dark:bg-zinc-800 dark:border-primary-500' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-transparent'}`}><Icon name="Cpu" size={14} /> Auto</button>
                        </div>
                        <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">{lang === 'es' ? 'Color de Acento' : 'Accent Color'}</label>
                            <div className="grid grid-cols-3 gap-4">
                                {/* "iron" is the default RP Hypertrophy lime — use a swatch that mirrors the CSS variable, NOT red. */}
                                <ColorPill color="bg-[rgb(193,241,59)]" label={lang === 'es' ? 'Hipertrofia' : 'Hypertrophy'} active={colorTheme === 'iron'} onClick={() => setColorTheme('iron')} />
                                <ColorPill color="bg-blue-500" label="Ocean" active={colorTheme === 'ocean'} onClick={() => setColorTheme('ocean')} />
                                <ColorPill color="bg-emerald-500" label="Forest" active={colorTheme === 'forest'} onClick={() => setColorTheme('forest')} />
                                <ColorPill color="bg-purple-500" label="Royal" active={colorTheme === 'royal'} onClick={() => setColorTheme('royal')} />
                                <ColorPill color="bg-orange-500" label="Sunset" active={colorTheme === 'sunset'} onClick={() => setColorTheme('sunset')} />
                                <ColorPill color="bg-zinc-500" label="Mono" active={colorTheme === 'monochrome'} onClick={() => setColorTheme('monochrome')} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.language}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setLang('en')} className={`py-3 rounded-xl text-sm font-bold border ${lang === 'en' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>English</button>
                                <button onClick={() => setLang('es')} className={`py-3 rounded-xl text-sm font-bold border ${lang === 'es' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Español</button>
                            </div>
                        </div>
                    </div>

                    </>)}

                    {tab === 'advanced' && (<>

                    {/* Database Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.database}</label>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={onExport} className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2" aria-label="Download"> <Icon name="Download" size={14} /> {t.export}</button>
                                <label className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold cursor-pointer text-center flex items-center justify-center gap-2"><Icon name="Upload" size={14} /> {t.import}<input type="file" onChange={onImportFile} accept=".json" className="hidden" /></label>
                            </div>
                            {user && <button onClick={onForceSync} disabled={isSyncing} className="w-full py-3 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-primary-500/20" aria-label="Refresh"> <Icon name="RefreshCw" size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Syncing..." : "Force Sync"}</button>}
                        </div>
                    </div>

                    <Divider />

                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{lang === 'es' ? 'Diagnóstico Sync' : 'Sync Diagnostics'}</label>
                        <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-white/5">
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
                                {Object.entries(localSectionSyncMeta).slice(0, 8).map(([section, ts]) => (
                                    <span key={section} className="rounded-full bg-zinc-200 px-2 py-1 text-[9px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        {section}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Divider />

                    {/* Danger Zone Topic */}
                    <div>
                        <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                        <button onClick={onReset} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2" aria-label="Delete"> <Icon name="Trash2" size={16} /> {t.factoryReset}</button>
                    </div>

                    <Divider />

                    {/* Credits & Philosophy */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Credits & Philosophy</label>
                        <button onClick={() => setShowPhilosophy(true)} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold flex justify-center gap-2 items-center text-zinc-700 dark:text-zinc-300">
                            <Icon name="BookOpen" size={16} /> Natural Hypertrophy (NH) 85% Rule
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
        </div>
    );
};
