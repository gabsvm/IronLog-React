
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
        config, setConfig, resetTutorials 
    } = useApp();
    const { user, logout, subscription } = useAuth();
    const t = TRANSLATIONS[lang];

    // Admin State
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [targetInput, setTargetInput] = useState('');
    const [adminStatus, setAdminStatus] = useState<{ msg: string, type: 'success' | 'error' | 'neutral' } | null>(null);

    // HARDCODED ADMIN EMAIL CHECK
    const isAdmin = user?.email === 'gabsvm@gmail.com';

    const resolveUid = async (input: string): Promise<string | null> => {
        if (!db) return null;
        const trimmed = input.trim();
        if (!trimmed) return user?.uid || null;

        // Is it an email?
        if (trimmed.includes('@')) {
            try {
                setAdminStatus({ msg: `Searching for email: ${trimmed}...`, type: 'neutral' });
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("email", "==", trimmed));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    return null;
                }
                // Return the first match's UID
                return querySnapshot.docs[0].id;
            } catch (e) {
                console.error("Email lookup failed", e);
                return null;
            }
        }

        // Assume it's a UID
        return trimmed;
    };

    const handleSubscriptionChange = async (grantPro: boolean) => {
        if (!db) return;
        setAdminStatus({ msg: 'Processing...', type: 'neutral' });
        
        try {
            // Resolve UID from Input (Email or UID)
            const uidToModify = await resolveUid(targetInput);
            
            if (!uidToModify) {
                setAdminStatus({ msg: 'Error: User not found (Check Email or UID)', type: 'error' });
                return;
            }

            // Data payload
            const subData = {
                isPro: grantPro,
                tier: grantPro ? 'lifetime' : 'free',
                expiryDate: null,
                grantedByAdmin: grantPro,
                revokedByAdmin: !grantPro,
                updatedAt: Date.now(),
                adminUser: user?.email
            };

            // Write to Firestore: users/{uid}/data/subscription
            await setDoc(doc(db, "users", uidToModify, "data", "subscription"), subData, { merge: true });

            setAdminStatus({ 
                msg: grantPro 
                    ? `✅ PRO Granted to: ${uidToModify.slice(0,5)}...` 
                    : `🚫 PRO Revoked from: ${uidToModify.slice(0,5)}...`,
                type: grantPro ? 'success' : 'error' 
            });
            
            // Force refresh if modifying self
            if (uidToModify === user?.uid) {
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (e: any) {
            setAdminStatus({ msg: 'Error: ' + e.message, type: 'error' });
        }
    };

    const ColorPill = ({ color, active, onClick, label }: any) => (
        <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95 group`}>
            <div className={`w-10 h-10 rounded-full ${color} shadow-sm border-2 transition-all ${active ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-80 group-hover:opacity-100'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-80 bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Fixed Header */}
                <div className="p-6 pb-2 shrink-0 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
                    <h2 className="font-bold text-2xl dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={24} /></button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 pb-24 space-y-8 scroll-container">
                    
                    {/* Account Section */}
                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
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
                                
                                {/* ADMIN BUTTON */}
                                {isAdmin && (
                                    <button 
                                        onClick={() => setIsAdminMode(!isAdminMode)} 
                                        className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${isAdminMode ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}
                                    >
                                        <Icon name="Bot" size={14} /> {isAdminMode ? 'Close Admin' : 'Admin Panel'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={onLogin} 
                                className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all active:scale-95"
                            >
                                {t.auth.signInRegister}
                            </button>
                        )}
                    </div>

                    {/* ADMIN PANEL UI - No Overflow Hidden to prevent clipping */}
                    {isAdminMode && isAdmin && (
                        <div className="p-4 bg-zinc-900 rounded-2xl border-2 border-red-500/50 shadow-xl relative">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Admin Control</h3>
                                <span className="text-[9px] bg-red-900/50 text-red-200 px-1.5 py-0.5 rounded border border-red-500/30">GOD MODE</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">USER (EMAIL OR UID)</label>
                                    <input 
                                        className="w-full bg-black/50 text-white p-3 rounded-xl text-xs font-mono border border-zinc-700 focus:border-red-500 outline-none placeholder-zinc-600" 
                                        placeholder="Enter Email or UID"
                                        value={targetInput}
                                        onChange={e => setTargetInput(e.target.value)}
                                    />
                                    <div className="text-[9px] text-zinc-500 mt-1 flex justify-between">
                                        <span>Current: {user?.uid.slice(0,6)}...</span>
                                        {targetInput.includes('@') && <span className="text-blue-400">Email Mode</span>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" onClick={() => handleSubscriptionChange(true)} className="bg-green-600 hover:bg-green-500 border-none text-[10px] h-8">
                                        GRANT PRO
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleSubscriptionChange(false)} className="text-[10px] h-8">
                                        REVOKE
                                    </Button>
                                </div>
                                
                                {adminStatus && (
                                    <div className={`p-2 rounded-lg text-[10px] font-mono break-all border ${
                                        adminStatus.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-400' : 
                                        adminStatus.type === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-400' :
                                        'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    }`}>
                                        {adminStatus.msg}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Language */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.language}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setLang('en')} className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${lang === 'en' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'}`}>English</button>
                            <button onClick={() => setLang('es')} className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${lang === 'es' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'}`}>Español</button>
                        </div>
                    </div>

                    {/* Appearance */}
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
                    </div>

                    {/* Database */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.database}</label>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={onExport} className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><Icon name="Download" size={14} /> {t.export}</button>
                                <label className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold cursor-pointer text-center flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><Icon name="Upload" size={14} /> {t.import}<input type="file" onChange={onImportFile} accept=".json" className="hidden" /></label>
                            </div>
                            {user && (
                                <button 
                                    onClick={onForceSync}
                                    disabled={isSyncing}
                                    className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Icon name={isSyncing ? "RefreshCw" : "CloudOff"} size={14} className={isSyncing ? "animate-spin" : ""} />
                                    {isSyncing ? (lang === 'en' ? "Syncing..." : "Sincronizando...") : (lang === 'en' ? "Force Cloud Sync" : "Forzar Sincronización Nube")}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div>
                        <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                        <button 
                            onClick={onReset}
                            className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Icon name="Trash2" size={16} /> {t.factoryReset}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
