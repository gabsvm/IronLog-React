
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SubscriptionTier } from '../../types';

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

const ColorPill = ({ color, active, onClick, label }: { color: string, active: boolean, onClick: () => void, label: string }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group">
        <div className={`w-10 h-10 rounded-full ${color} shadow-sm border-2 transition-all ${active ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-80 group-hover:opacity-100'}`} />
        <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{label}</span>
    </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, onOpenProgram, onOpenExercises, onReset, onExport, onForceSync, onImportFile, isSyncing 
}) => {
    const { 
        lang, setLang, theme, setTheme, colorTheme, setColorTheme, 
        resetTutorials, setIsAuthModalOpen
    } = useApp();
    const { 
        user, profile, updateProfile, logout, subscription, 
        loading, isGuest 
    } = useAuth();
    const t = TRANSLATIONS[lang];

    const [displayName, setDisplayName] = useState(profile?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (profile?.displayName) {
            setDisplayName(profile.displayName);
        } else {
            setDisplayName('');
        }
    }, [profile]);

    const handleSaveProfile = async () => {
        if (!profile || !displayName.trim() || displayName.trim() === profile.displayName) return;
        setIsSaving(true);
        try {
            await updateProfile({ displayName: displayName.trim() });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Failed to update profile", error);
        }
        setIsSaving(false);
    };

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
                grantedAt: Date.now()
            }, { merge: true });
            setAdminStatus(`Success! Pro granted to ${uidToGrant.slice(0, 5)}...`);
            if (uidToGrant === user?.uid) window.location.reload();
        } catch (e: any) {
            setAdminStatus('Error: ' + e.message);
        }
    };

    const isNameChanged = profile ? displayName.trim() !== profile.displayName : false;
    
    // Correctly get the tier as a string
    const getTierString = (tier: SubscriptionTier | { tier: SubscriptionTier, grantedByAdmin: boolean }): SubscriptionTier => {
        if (typeof tier === 'object') {
            return tier.tier;
        }
        return tier;
    };

    const renderAccountSection = () => {
        const tierString = getTierString(subscription.tier);

        if (loading) {
            return (
                <div className="mb-8 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 h-[160px] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-red-600 rounded-full animate-spin" />
                </div>
            );
        }

        if (isGuest || !user) {
            return (
                <div className="mb-8 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Icon name="User" size={16} className="text-zinc-500" />
                        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Guest User</p>
                    </div>
                    <div className={`text-xs font-bold uppercase py-1 px-2 rounded-full inline-block bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300`}>
                        {tierString}
                    </div>
                    <Button onClick={() => { setIsAuthModalOpen(true); onClose(); }} fullWidth>
                        <Icon name="LogIn" size={16} />
                        <span className="ml-2">Login / Sign Up</span>
                    </Button>
                    <p className="text-xs text-zinc-400 px-2 pt-1">Create an account to sync your data.</p>
                </div>
            );
        }

        if (user && profile) {
            return (
                <div className="mb-8 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold dark:text-white pt-1">Account</h3>
                        <div className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full ${subscription.isPro ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
                            {tierString}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Display Name</label>
                        <input 
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-800 p-2 rounded-lg text-sm font-bold mt-1 border-2 border-transparent focus:border-red-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Email</label>
                        <p className="text-xs text-zinc-500 mt-1">{profile.email}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                       <Button 
                            onClick={handleSaveProfile} 
                            disabled={!isNameChanged || isSaving} 
                            size="sm" 
                            fullWidth
                            variant={saved ? "success" : "primary"}
                        >
                            {isSaving ? 'Saving...' : (saved ? 'Saved!' : 'Save Changes')}
                       </Button>
                       <Button onClick={() => { logout(); onClose(); }} size="sm" variant="secondary">
                            <Icon name="LogOut" size={16} />
                       </Button>
                    </div>
                    {isAdmin && (
                        <button onClick={() => setIsAdminMode(!isAdminMode)} className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-2">
                            <Icon name="Bot" size={14} /> Admin Panel
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-80 bg-white dark:bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-2xl dark:text-white tracking-tight">{t.settings}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                        <Icon name="X" size={24} />
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 pr-1 -mr-3">
                    {renderAccountSection()}

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

                    <div className="space-y-8">
                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.language}</label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button onClick={() => setLang('en')} className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${lang === 'en' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'}`}>English</button>
                                <button onClick={() => setLang('es')} className={`py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${lang === 'es' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent'}`}>Español</button>
                            </div>
                        </div>
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
                        <div>
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Data</label>
                            <div className="space-y-2">
                                <button onClick={onExport} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Export Data</span>
                                    <Icon name="Download" size={16} className="text-zinc-400" />
                                </button>
                                <label htmlFor="import-file" className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer">
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Import Data</span>
                                    <Icon name="Upload" size={16} className="text-zinc-400" />
                                </label>
                                <input type="file" id="import-file" className="hidden" onChange={onImportFile} accept=".json" />
                                <button onClick={onForceSync} disabled={!user || isSyncing} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Force Sync</span>
                                    {isSyncing ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Icon name="RefreshCw" size={16} className="text-zinc-400" />}
                                </button>
                            </div>
                        </div>
                        <div>
                             <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Advanced</label>
                             <div className="space-y-2">
                                <button onClick={resetTutorials} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.tutorial.reset}</span>
                                    <Icon name="BookOpen" size={16} className="text-zinc-400" />
                                </button>
                                <button onClick={onReset} className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex justify-between items-center transition-colors hover:bg-red-100 dark:hover:bg-red-900/40">
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">Reset All Data</span>
                                    <Icon name="Trash" size={16} className="text-red-500" />
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
                 <div className="text-center text-xs text-zinc-400 mt-6">
                    Version 4.0.3
                </div>
            </div>
        </div>
    );
};
