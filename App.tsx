
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useTimerContext } from './context/TimerContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { ExercisesView } from './views/ExercisesView';
import { ProgramEditView } from './views/ProgramEditView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { SetupWizard } from './components/onboarding/SetupWizard'; // New Import
import { ConfirmModal } from './components/ui/ConfirmModal'; 
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { Button } from './components/ui/Button';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { getLastLogForExercise } from './utils';
import { syncService } from './services/syncService';

// Lazy Load heavier views
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

// Define View Hierarchy for Directional Animations
const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'history': 1,
    'stats': 1,
    'workout': 2,
    'exercises': 2,
    'program': 2
};

const AppContent = () => {
    const { 
        activeSession, activeMeso, setActiveSession, 
        program, exercises, lang, setLang, logs, setLogs,
        theme, setTheme, colorTheme, setColorTheme, setExercises, setProgram, setActiveMeso,
        config, setConfig, hasSeenOnboarding, setHasSeenOnboarding,
        resetTutorials, rpFeedback,
        pendingCloudData, confirmCloudSync, cancelCloudSync
    } = useApp();
    
    const { setRestTimer } = useTimerContext();
    const { user, logout } = useAuth();
    
    const t = TRANSLATIONS[lang];

    const [view, setViewState] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats'>('home');
    const [showSettings, setShowSettings] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Custom Modals State
    const [importData, setImportData] = useState<any>(null);
    const [showForceSyncModal, setShowForceSyncModal] = useState(false);

    // UX: Helper to trigger View Transitions with Direction
    const setView = (newView: typeof view) => {
        if (newView === view) return;
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[newView] || 1;
        let direction = 'fade';
        if (nextDepth > currentDepth) direction = 'forward';
        else if (nextDepth < currentDepth) direction = 'back';
        document.documentElement.dataset.transition = direction;

        if ((document as any).startViewTransition) {
            const transition = (document as any).startViewTransition(() => {
                setViewState(newView);
            });
            transition.finished.finally(() => {
                document.documentElement.dataset.transition = '';
            });
        } else {
            setViewState(newView);
        }
    };

    // History management logic
    const isPopping = useRef(false);
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({ view: 'home', settings: false }, '', '#home');
            }
        } catch (e) {}

        const handlePop = (e: PopStateEvent) => {
            isPopping.current = true;
            if (e.state) {
                document.documentElement.dataset.transition = 'back';
                if ((document as any).startViewTransition) {
                    const t = (document as any).startViewTransition(() => {
                        if (e.state?.view) setViewState(e.state.view);
                        setShowSettings(!!e.state?.settings);
                    });
                    t.finished.finally(() => { document.documentElement.dataset.transition = ''; });
                } else {
                    if (e.state?.view) setViewState(e.state.view);
                    setShowSettings(!!e.state?.settings);
                }
            } else {
                setView('home');
                setShowSettings(false);
            }
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    useEffect(() => {
        if (isPopping.current) {
            isPopping.current = false;
            return;
        }
        const state = { view, settings: showSettings };
        const hash = showSettings ? 'settings' : view;
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.pushState(state, '', `#${hash}`);
            }
        } catch (e) {}
    }, [view, showSettings]);

    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        const data = {
            program, exercises, logs, activeMeso, activeSession,
            version: '3.0.0'
        };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ironlog_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleForceSync = async () => {
        if (!user) {
            // Replace alert with Auth Modal
            setShowAuthModal(true);
            return;
        }
        setShowForceSyncModal(true); // Open confirmation instead of immediate action
    };

    const executeForceSync = async () => {
        if(!user) return;
        setIsSyncing(true);
        setShowForceSyncModal(false);
        try {
            await syncService.uploadState(user.uid, {
                program, activeMeso, exercises, logs, config, rpFeedback, activeSession
            });
            // Replaced alert with temporary toast via Button or just silent success
            // For now, we can just log or show a small tick
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                setImportData(data); // Triggers Confirm Modal
            } catch (err) {
                console.error("Invalid File");
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if (importData) {
            if (importData.program) setProgram(importData.program);
            if (importData.exercises) setExercises(importData.exercises);
            if (importData.logs) setLogs(importData.logs);
            if (importData.activeMeso) setActiveMeso(importData.activeMeso);
            if (importData.activeSession) setActiveSession(importData.activeSession);
            setImportData(null);
            window.location.reload();
        }
    };

    const handleSkipSession = (dayIdx: number) => {
        if (!activeMeso) return;
        const safeProgram = Array.isArray(program) ? program : [];
        const dayDef = safeProgram[dayIdx];
        
        // Create a log entry marked as skipped
        const skippedLog: any = {
            id: Date.now(),
            dayIdx: dayIdx,
            name: dayDef ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) : `Day ${dayIdx + 1}`,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            mesoId: activeMeso.id,
            week: activeMeso.week,
            exercises: [],
            skipped: true
        };
        
        setLogs([skippedLog, ...(Array.isArray(logs) ? logs : [])]);
    };

    const ColorPill = ({ color, active, onClick, label }: any) => (
        <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95 group`}>
            <div className={`w-10 h-10 rounded-full ${color} shadow-sm border-2 transition-all ${active ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-80 group-hover:opacity-100'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{label}</span>
        </button>
    );

    return (
        <>
            {/* New Setup Wizard Logic */}
            {!hasSeenOnboarding && (
                <SetupWizard onComplete={() => setHasSeenOnboarding(true)} />
            )}

            {/* Main App Content - Only visible if onboarding is done */}
            {hasSeenOnboarding && (
                <>
                    {view === 'workout' && activeSession ? (
                        <WorkoutView 
                            onFinish={() => { 
                                if (!activeSession) return;
                                const duration = activeSession.startTime ? (Date.now() - activeSession.startTime) / 1000 : 0;
                                const log = { ...activeSession, endTime: Date.now(), duration };
                                setLogs([log as any, ...(Array.isArray(logs) ? logs : [])]);
                                setActiveSession(null);
                                setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); 
                                setView('home');
                            }} 
                            onBack={() => setView('home')} 
                        />
                    ) : view === 'exercises' ? (
                        <ExercisesView onBack={() => { setView('home'); setShowSettings(true); }} />
                    ) : view === 'program' ? (
                        <ProgramEditView onBack={() => setView('home')} />
                    ) : (
                        <Layout view={view as any} setView={setView as any} onOpenSettings={() => setShowSettings(true)}>
                            {view === 'home' && <HomeView 
                                startSession={(idx) => {
                                    if (!activeMeso) return;
                                    const safeProgram = Array.isArray(program) ? program : [];
                                    const dayDef = safeProgram[idx];
                                    if (!dayDef) return;
                                    const dayNameSafe = dayDef.dayName ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) : `Day ${idx + 1}`;
                                    const mesoPlan = Array.isArray(activeMeso.plan) ? activeMeso.plan : [];
                                    const dayPlan = Array.isArray(mesoPlan[idx]) ? mesoPlan[idx] : [];
                                    const safeExercises = Array.isArray(exercises) ? exercises.filter(e => !!e) : [];
                                    const safeLogs = Array.isArray(logs) ? logs : [];
                                    const isDeload = !!activeMeso.isDeload;

                                    const sessionExs = (dayDef.slots || []).map((slotDef, sIdx) => {
                                        if (!slotDef) return null;
                                        const exId = dayPlan[sIdx];
                                        let exDef = exId ? safeExercises.find(e => e.id === exId) : safeExercises.find(e => e.muscle === slotDef.muscle);
                                        if (!exDef && safeExercises.length > 0) exDef = safeExercises[0];
                                        if (!exDef) exDef = { id: 'unknown', name: 'Unknown', muscle: slotDef.muscle || 'CHEST' };

                                        const lastSets = getLastLogForExercise(exDef.id, safeLogs);
                                        let setTarget = slotDef.setTarget || 3;
                                        if (isDeload) setTarget = Math.max(1, Math.ceil(setTarget / 2));

                                        const initialSets = Array(setTarget).fill(null).map((_, i) => ({
                                            id: Date.now() + Math.random() + i,
                                            weight: '', reps: '', rpe: '', completed: false, type: 'regular',
                                            hintWeight: lastSets?.[i]?.weight, hintReps: lastSets?.[i]?.reps,
                                            prevWeight: lastSets?.[i]?.weight, prevReps: lastSets?.[i]?.reps
                                        }));

                                        return { ...exDef, instanceId: Date.now() + Math.random() + sIdx, slotLabel: slotDef.muscle, targetReps: slotDef.reps, sets: initialSets };
                                    }).filter(Boolean);

                                    setActiveSession({ id: Date.now(), dayIdx: idx, name: `${activeMeso.week} • ${dayNameSafe}`, exercises: sessionExs as any, startTime: Date.now(), mesoId: activeMeso.id, week: activeMeso.week });
                                    setView('workout');
                                }} 
                                onEditProgram={() => setView('program')} 
                                onSkipSession={handleSkipSession} 
                            />}
                            {view === 'history' && (
                                <Suspense fallback={<LoadingSpinner />}>
                                    <HistoryView />
                                </Suspense>
                            )}
                            {view === 'stats' && (
                                <Suspense fallback={<LoadingSpinner />}>
                                    <StatsView />
                                </Suspense>
                            )}
                        </Layout>
                    )}
                </>
            )}

            <RestTimerOverlay />
            
            {/* Standard Modal Overlays */}
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            {/* SYNC CONFLICT MODAL */}
            <ConfirmModal 
                isOpen={!!pendingCloudData}
                title={lang === 'en' ? "Cloud Sync" : "Sincronización Nube"}
                description={lang === 'en' ? "Newer data found in the cloud. Download it? (This will overwrite current local data)" : "Datos más recientes encontrados en la nube. ¿Descargar? (Esto sobrescribirá los datos locales actuales)"}
                confirmText={lang === 'en' ? "Download" : "Descargar"}
                cancelText={lang === 'en' ? "Keep Local" : "Mantener Local"}
                onConfirm={confirmCloudSync}
                onCancel={cancelCloudSync}
                variant="primary"
            />

            {/* IMPORT CONFIRM MODAL */}
            <ConfirmModal 
                isOpen={!!importData}
                title={t.import}
                description={t.importConfirm}
                confirmText={t.import}
                cancelText={t.cancel}
                onConfirm={confirmImport}
                onCancel={() => setImportData(null)}
                variant="danger"
            />

            {/* FORCE SYNC MODAL */}
            <ConfirmModal 
                isOpen={showForceSyncModal}
                title={lang === 'en' ? "Force Sync" : "Forzar Sincronización"}
                description={lang === 'en' ? "Upload current local data to cloud? This will overwrite cloud data." : "¿Subir datos locales a la nube? Esto sobrescribirá los datos de la nube."}
                confirmText={lang === 'en' ? "Upload" : "Subir"}
                cancelText={t.cancel}
                onConfirm={executeForceSync}
                onCancel={() => setShowForceSyncModal(false)}
            />

            {/* FACTORY RESET MODAL */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Icon name="AlertTriangle" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t.dangerZone}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{t.deleteDataConfirm}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" onClick={() => setShowResetModal(false)}>{t.cancel}</Button>
                            <Button variant="danger" onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}>{t.delete}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Overlay */}
            {showSettings && view !== 'exercises' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
                    <div className="w-80 bg-white dark:bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-2xl dark:text-white mb-6 tracking-tight">{t.settings}</h2>
                        
                        {/* Account Section */}
                        <div className="mb-8 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-500'}`}>
                                    <Icon name="User" size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-900 dark:text-white">{user ? t.auth.proMember : t.auth.guestUser}</div>
                                    <div className="text-xs text-zinc-500 truncate max-w-[160px]">{user ? user.email : t.auth.localStorage}</div>
                                </div>
                            </div>
                            {user ? (
                                <button onClick={() => { logout(); setShowSettings(false); }} className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold">
                                    {t.auth.logout}
                                </button>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500">
                                    {t.auth.signInRegister}
                                </button>
                            )}
                        </div>

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
                                        </div>
                                    </button>
                                    <button onClick={() => setConfig({ ...config, rpEnabled: !config.rpEnabled })} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.rpEnabled}</span>
                                        <div className={`w-10 h-6 rounded-full relative transition-colors ${config.rpEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.rpEnabled ? 'left-5' : 'left-1'}`} />
                                        </div>
                                    </button>
                                    <button onClick={() => setConfig({ ...config, keepScreenOn: !config.keepScreenOn })} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.keepScreen}</span>
                                        <div className={`w-10 h-6 rounded-full relative transition-colors ${config.keepScreenOn ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.keepScreenOn ? 'left-5' : 'left-1'}`} />
                                        </div>
                                    </button>
                                    
                                    <button onClick={() => { setView('program'); setShowSettings(false); }} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.editTemplate}</span>
                                        <Icon name="Edit" size={16} className="text-zinc-400" />
                                    </button>

                                    <button onClick={() => setView('exercises')} className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-between items-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.manageEx}</span>
                                        <Icon name="ChevronRight" size={16} className="text-zinc-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Database */}
                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.database}</label>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={handleExport} className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><Icon name="Download" size={14} /> {t.export}</button>
                                        <label className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold cursor-pointer text-center flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><Icon name="Upload" size={14} /> {t.import}<input type="file" onChange={handleImportFile} accept=".json" className="hidden" /></label>
                                    </div>
                                    {user && (
                                        <button 
                                            onClick={handleForceSync}
                                            disabled={isSyncing}
                                            className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <Icon name={isSyncing ? "RefreshCw" : "CloudOff"} size={14} className={isSyncing ? "animate-spin" : ""} />
                                            {isSyncing ? (lang === 'en' ? "Syncing..." : "Sincronizando...") : (lang === 'en' ? "Force Cloud Sync" : "Forzar Sincronización Nube")}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tutorials / Help */}
                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{lang === 'en' ? 'Tutorials' : 'Tutoriales'}</label>
                                <button 
                                    onClick={() => { resetTutorials(); setShowSettings(false); }}
                                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Icon name="RefreshCw" size={16} /> {t.tutorial.reset}
                                </button>
                            </div>

                            {/* Danger Zone */}
                            <div>
                                <label className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                                <button 
                                    onClick={() => setShowResetModal(true)}
                                    className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Icon name="Trash2" size={16} /> {t.factoryReset}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
