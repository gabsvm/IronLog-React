
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SettingsModalProps {
    onClose: () => void;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSyncing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, onOpenProgram, onOpenExercises, onReset, onExport, onForceSync, onImportFile, isSyncing 
}) => {
    const { 
        lang, setLang, theme, setTheme, colorTheme, setColorTheme, 
        config, setConfig, resetTutorials 
    } = useApp();
    const { user, logout, isGuest, subscription, upgradeToPro } = useAuth();
    const t = TRANSLATIONS[lang];

    // Admin State
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [targetUid, setTargetUid] = useState('');
    const [adminStatus, setAdminStatus] = useState('');

    const isAdmin = user?.email === 'gabsvm@gmail.com';

    const handleAdminGrant = async () => {
        if (!db) return;
        setAdminStatus('Processing...');
        try {
            const uidToGrant = targetUid.trim() || user?.uid;
            if (!uidToGrant) return;

            await setDoc(doc(db, "users", uidToGrant, "data", "subscription"), {
                isPro: true,
                tier: 'lifetime',
                expiryDate: null,
                grantedByAdmin: true,
                grantedAt: Date.now()
            }, { merge: true });

            setAdminStatus(`Success! Pro granted to ${uidToGrant.slice(0, 5)}...`);
            // Refresh local if self
            if (uidToGrant === user?.uid) {
                window.location.reload();
            }
        } catch (e: any) {
            setAdminStatus('Error: ' + e.message);
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
            <div className="w-80 bg-white dark:bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-2xl dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={24} /></button>
                </div>
                
                {/* Account Section */}
                <div className="mb-8 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
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
                            <button onClick={() => { logout(); onClose(); }} className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold">
                                {t.auth.logout}
                            </button>
                            {/* ADMIN BUTTON */}
                            {isAdmin && (
                                <button onClick={() => setIsAdminMode(!isAdminMode)} className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                    <Icon name="Bot" size={14} /> Admin Panel
                                </button>
                            )}
                        </div>
                    ) : (
                        // Auth Trigger is handled in parent, this is just info
                        <div className="text-center text-xs text-zinc-400">
                            Sign in from main menu to sync.
                        </div>
                    )}
                </div>

                {/* ADMIN PANEL */}
                {isAdminMode && (
                    <div className="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-2 border-red-500/20">
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3">Master Control</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-zinc-400 block mb-1">Target UID (Leave empty for self)</label>
                                <input 
                                    className="w-full bg-white dark:bg-zinc-950 p-2 rounded text-xs font-mono" 
                                    placeholder={user?.uid}
                                    value={targetUid}
                                    onChange={e => setTargetUid(e.target.value)}
                                />
                            </div>
                            <Button size="sm" fullWidth onClick={handleAdminGrant}>Grant Lifetime PRO</Button>
                            {adminStatus && <p className="text-[10px] font-mono text-green-500 break-all">{adminStatus}</p>}
                        </div>
                    </div>
                )}

                <div className="space-y-8 flex-1">
                    {/* Language */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.language}</label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
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

                    {/* Workout Configuration */}
                    <div>
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.workoutConfig}</label>
                        <div className="space-y-2">
                            <button onClick={() => setConfig({ ...config, showRIR: !config.showRIR })} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.showRIR}</span>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${config.showRIR ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.showRIR ? 'left-5' : 'left-1'}`} />