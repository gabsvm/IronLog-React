
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { usePro } from '../../hooks/usePro';
import { PaywallModal } from '../pro/PaywallModal';

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
        config, setConfig, resetTutorials, deferredPrompt, installApp, isStandalone 
    } = useApp();
    const { user, logout, subscription } = useAuth();
    const { checkPro, isPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const t = TRANSLATIONS[lang];

    // Admin State
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [targetInput, setTargetInput] = useState('');
    const [adminStatus, setAdminStatus] = useState<{ msg: string, type: 'success' | 'error' | 'neutral', details?: string, codeSnippet?: string } | null>(null);

    const isAdmin = user?.email === 'gabsvm@gmail.com';

    const resolveUid = async (input: string): Promise<string | null> => {
        if (!db) return null;
        const trimmed = input.trim();
        if (!trimmed) return user?.uid || null;

        if (trimmed.includes('@')) {
            try {
                setAdminStatus({ msg: `Searching: ${trimmed}...`, type: 'neutral' });
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("email", "==", trimmed));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) return null;
                return querySnapshot.docs[0].id;
            } catch (e: any) {
                if (e.code === 'permission-denied') throw new Error("PERMISSION_DENIED_LIST");
                throw new Error(`Email lookup failed: ${e.message}`);
            }
        }
        return trimmed;
    };

    const handleSubscriptionChange = async (grantPro: boolean) => {
        if (!db) return;
        setAdminStatus({ msg: 'Processing...', type: 'neutral' });
        try {
            const uidToModify = await resolveUid(targetInput);
            if (!uidToModify) {
                setAdminStatus({ msg: 'Error: User not found', type: 'error' });
                return;
            }
            const subData = {
                isPro: grantPro,
                tier: grantPro ? 'lifetime' : 'free',
                expiryDate: null,
                grantedByAdmin: grantPro,
                revokedByAdmin: !grantPro,
                updatedAt: Date.now(),
                adminUser: user?.email
            };
            await setDoc(doc(db, "users", uidToModify, "data", "subscription"), subData, { merge: true });
            setAdminStatus({ 
                msg: grantPro ? `✅ PRO Granted` : `🚫 PRO Revoked`,
                type: grantPro ? 'success' : 'error' 
            });
            if (uidToModify === user?.uid) setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            let helpfulMsg = e.message;
            let codeSnippet = "";
            if (e.code === 'permission-denied' || e.message === 'PERMISSION_DENIED_LIST') {
                helpfulMsg = "⛔ FIREBASE RULES BLOCKING";
                codeSnippet = `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { function isAdmin() { return request.auth != null && request.auth.token.email == '${user?.email}'; } match /users { allow list: if isAdmin(); } match /users/{userId}/{document=**} { allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin()); } } }`;
            }
            setAdminStatus({ msg: helpfulMsg, type: 'error', codeSnippet });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied!");
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

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-80 bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col" onClick={e => e.stopPropagation()}>
                
                <div className="p-6 pb-2 shrink-0 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
                    <h2 className="font-bold text-2xl dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 pt-2 pb-24 space-y-2 scroll-container">
                    
                    {/* Account */}
                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${subscription.isPro ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-200 text-zinc-500'}`}>
                                {subscription.isPro ? <Icon name="Crown" size={20} /> : <Icon name="User" size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    {user ? (subscription.isPro ? "Pro Member" : "Free Member") : t.auth.guestUser}
                                    {subscription.isPro && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded uppercase font-black">PRO</span>}
                                </div>
                                <div className="text-xs text-zinc-500 truncate">{user ? user.email : t.auth.localStorage}</div>
                            </div>
                        </div>
                        {user ? (
                            <div className="space-y-2">
                                <button onClick={() => { logout(); onClose(); }} className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                                    {t.auth.logout}
                                </button>
                                {isAdmin && (
                                    <button onClick={() => setIsAdminMode(!isAdminMode)} className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${isAdminMode ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                                        <Icon name="Bot" size={14} /> {isAdminMode ? 'Close Admin' : 'Admin Panel'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button onClick={onLogin} className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all active:scale-95">
                                {t.auth.signInRegister}
                            </button>
                        )}
                    </div>

                    {/* INSTALL APP */}
                    {!isStandalone && (
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg text-white animate-in zoom-in-95 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                    <Icon name="Download" size={20} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm mb-1">{t.installApp}</h4>
                                    <p className="text-[10px] opacity-80 leading-relaxed mb-3">
                                        {t.installDesc}
                                    </p>
                                    
                                    {deferredPrompt ? (
                                        <button 
                                            onClick={installApp}
                                            className="w-full py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-md hover:bg-zinc-50 transition-colors active:scale-95"
                                        >
                                            {t.installBtn}
                                        </button>
                                    ) : (
                                        <div className="bg-black/20 rounded-lg p-3 text-[10px] space-y-2 border border-white/10">
                                            <div className="flex items-center gap-2"><Icon name="Share2" size={12} /><span><strong>{t.iosInstall}</strong></span></div>
                                            <div className="flex items-center gap-2"><Icon name="MoreVertical" size={12} /><span><strong>{t.androidInstall}</strong></span></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Panel */}
                    {isAdminMode && isAdmin && (
                        <div className="p-4 bg-zinc-900 rounded-2xl border-2 border-red-500/50 shadow-xl relative animate-in slide-in-from-top-4 fade-in duration-300 mb-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">USER (EMAIL OR UID)</label>
                                    <input className="w-full bg-black/50 text-white p-3 rounded-xl text-xs font-mono border border-zinc-700 outline-none" value={targetInput} onChange={e => setTargetInput(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" onClick={() => handleSubscriptionChange(true)} className="bg-green-600 border-none text-[10px] h-8">GRANT PRO</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleSubscriptionChange(false)} className="text-[10px] h-8">REVOKE</Button>
                                </div>
                                {adminStatus && (
                                    <div className={`p-3 rounded-xl text-[10px] font-mono break-all border ${adminStatus.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-400' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}>
                                        <div className="font-bold mb-1">{adminStatus.msg}</div>
                                        {adminStatus.codeSnippet && <button onClick={() => copyToClipboard(adminStatus.codeSnippet!)} className="mt-3 w-full py-2 bg-red-600 text-white rounded font-bold text-[10px]">Copy Rules</button>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.programEditor || "Content Management"}</label>
                        <div className="space-y-3">
                            <ProButton label={t.programEditor} icon="Layout" onClick={onOpenProgram} featureName="Custom Routines" />
                            <ProButton label={t.manageEx} icon="Dumbbell" onClick={onOpenExercises} featureName="Exercise Library" />
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

                    <Divider />

                    {/* Help Topic (Restored) */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Help & Support</label>
                        <div className="space-y-3">
                            <button onClick={() => { resetTutorials(); onClose(); alert(lang === 'en' ? "Tutorials reset!" : "¡Tutoriales reiniciados!"); }} className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600 flex items-center justify-between group active:scale-[0.98]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 text-zinc-400">
                                        <Icon name="Info" size={18} />
                                    </div>
                                    <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">{t.tutorial?.reset || "Reset Tutorials"}</span>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
                            </button>
                        </div>
                    </div>

                    <Divider />

                    {/* Database Topic */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.database}</label>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={onExport} className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Icon name="Download" size={14} /> {t.export}</button>
                                <label className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold cursor-pointer text-center flex items-center justify-center gap-2"><Icon name="Upload" size={14} /> {t.import}<input type="file" onChange={onImportFile} accept=".json" className="hidden" /></label>
                            </div>
                            {user && <button onClick={onForceSync} disabled={isSyncing} className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Icon name="RefreshCw" size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Syncing..." : "Force Sync"}</button>}
                        </div>
                    </div>

                    <Divider />

                    {/* Danger Zone Topic */}
                    <div>
                        <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                        <button onClick={onReset} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Icon name="Trash2" size={16} /> {t.factoryReset}</button>
                    </div>
                </div>
            </div>
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />}
        </div>
    );
};
