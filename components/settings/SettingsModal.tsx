
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { usePro } from '../../hooks/usePro';
import { PaywallModal } from '../pro/PaywallModal';
import { AdminControlPanel } from './AdminControlPanel';

interface SettingsModalProps {
    onClose: () => void;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onOpenTwoBlock: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogin: () => void;
    isSyncing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, onOpenProgram, onOpenExercises, onOpenTwoBlock, onReset, onExport, onForceSync, onImportFile, onLogin, isSyncing
}) => {
    const {
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        config, setConfig, resetTutorials, deferredPrompt, installApp, isStandalone,
        userProfile, setUserProfile
    } = useApp();

    const { user, logout } = useAuth();
    const { isPro, tier, expiryDate, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const t = TRANSLATIONS[lang];

    const [tab, setTab] = useState<'account' | 'prefs' | 'advanced'>('account');

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
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${value ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
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
                        <div className="mb-6 bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                            <div className="text-white">
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
                                className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform"
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
                            <button onClick={onLogin} className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-50 shadow-lg shadow-red-600/20 transition-all active:scale-95">
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
                            <ProToggle label={t.rpEnabled} value={config.rpEnabled} onChange={(val: boolean) => setConfig({ ...config, rpEnabled: val })} featureName="IronCoach AI" />
                            <ProToggle label={t.keepScreen} value={config.keepScreenOn} onChange={(val: boolean) => setConfig({ ...config, keepScreenOn: val })} featureName="Screen Settings" />
                        </div>
                    </div>

                    <Divider />

                    {/* Appearance Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.appearance}</label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button onClick={() => setTheme('dark')} className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-50 text-zinc-500 border-transparent'}`}><Icon name="Moon" size={16} /> Dark</button>
                            <button onClick={() => setTheme('light')} className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-300' : 'bg-zinc-800/50 text-zinc-500 border-transparent'}`}><Icon name="Sun" size={16} /> Light</button>
                        </div>
                        <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Accent Color</label>
                            <div className="grid grid-cols-4 gap-4">
                                <ColorPill color="bg-red-600" label="Iron" active={colorTheme === 'iron'} onClick={() => setColorTheme('iron')} />
                                <ColorPill color="bg-blue-600" label="Ocean" active={colorTheme === 'ocean'} onClick={() => setColorTheme('ocean')} />
                                <ColorPill color="bg-emerald-600" label="Forest" active={colorTheme === 'forest'} onClick={() => setColorTheme('forest')} />
                                <ColorPill color="bg-purple-600" label="Royal" active={colorTheme === 'royal'} onClick={() => setColorTheme('royal')} />
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
                            {user && <button onClick={onForceSync} disabled={isSyncing} className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2" aria-label="Refresh"> <Icon name="RefreshCw" size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Syncing..." : "Force Sync"}</button>}
                        </div>
                    </div>

                    <Divider />

                    {/* Danger Zone Topic */}
                    <div>
                        <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                        <button onClick={onReset} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2" aria-label="Delete"> <Icon name="Trash2" size={16} /> {t.factoryReset}</button>
                    </div>

                    </>)}
                </div>
            </div>
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />}
        </div>
    );
};
