import { formatMessage, pickLang } from '../../utils/i18n';
import React, { Suspense, useCallback } from 'react';
import { useApp, useSyncMeta } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import type { CommandAction } from '../../components/ui/CommandPalette';
import { KONG_4DAY_ID } from '../../programs/kong/constants';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { dirtySyncState } from '../../services/dirtySyncState';
import { resetLocalData } from '../../services/localDataReset';
import { buildSectionSyncMeta } from '../../services/syncHelpers';
import { syncService } from '../../services/syncService';
import { db } from '../../utils/db';
import { buildNextMesocycleCarryOver, saveMesocycleDraft, setMesoEditorIntent } from '../../utils/mesoDraft';
import { hasJointPainWarning, loadExerciseSfrHistory } from '../../utils/rpAutoregulation';
import {
    restoreBackupToStorage,
    type GainsLabBackupV1,
    type BackupDomainSummary
} from '../../services/backupService';

const ProgramCompletionView = React.lazy(() => import('../../components/programs/ProgramCompletionView').then((module) => ({ default: module.ProgramCompletionView })));
const CommandPalette = React.lazy(() => import('../../components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })));
const AuthModal = React.lazy(() => import('../../components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const ConfirmModal = React.lazy(() => import('../../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const PaywallModal = React.lazy(() => import('../../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));

interface AppModalsProps {
    showCommandPalette: boolean;
    setShowCommandPalette: (show: boolean) => void;
    commandActions: CommandAction[];
    showMesoCompleteModal: boolean;
    setShowMesoCompleteModal: (show: boolean) => void;
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
    validatedBackup: GainsLabBackupV1 | null;
    setValidatedBackup: (backup: GainsLabBackupV1 | null) => void;
    backupSummary: BackupDomainSummary | null;
    setBackupSummary: (summary: BackupDomainSummary | null) => void;
    importError: string | null;
    setImportError: (error: string | null) => void;
    showForceSyncModal: boolean;
    setShowForceSyncModal: (show: boolean) => void;
    forceSyncFeedback: { type: 'success' | 'error'; message: string } | null;
    setForceSyncFeedback: (feedback: { type: 'success' | 'error'; message: string } | null) => void;
    showResetModal: boolean;
    setShowResetModal: (show: boolean) => void;
    showKongConvertModal: boolean;
    setShowKongConvertModal: (show: boolean) => void;
    setIsSyncing: (syncing: boolean) => void;
    setView: (view: any) => void;
}

/**
 * Q18: all App-level modal dialogs, moved verbatim from App. Visibility state
 * stays in AppContent (it is toggled from non-modal flows); data comes
 * straight from the contexts. AppContext itself is untouched.
 */
export const AppModals: React.FC<AppModalsProps> = ({
    showCommandPalette, setShowCommandPalette, commandActions,
    showMesoCompleteModal, setShowMesoCompleteModal,
    showAuthModal, setShowAuthModal,
    validatedBackup, setValidatedBackup, backupSummary, setBackupSummary,
    importError, setImportError,
    showForceSyncModal, setShowForceSyncModal,
    forceSyncFeedback, setForceSyncFeedback,
    showResetModal, setShowResetModal,
    showKongConvertModal, setShowKongConvertModal,
    setIsSyncing, setView,
}) => {
    const {
        lang, program, exercises, logs, config, rpFeedback,
        pendingCloudData, pendingCloudSections, confirmCloudSync, cancelCloudSync,
        userProfile, getNutritionSnapshot, personalTemplates,
        setProgram,
    } = useApp();
    const { setLocalLastUpdated } = useSyncMeta();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const { user } = useAuth();
    const { showPaywall, setShowPaywall, featureAttempted } = usePro();

    const t = TRANSLATIONS[lang];

    const executeForceSync = useCallback(async () => {
        if (!user) return;
        setIsSyncing(true);
        setShowForceSyncModal(false);
        const currentActiveSession = useStore.getState().activeSession;
        const { nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal, customFoods } = getNutritionSnapshot();
        const now = Date.now();
        try {
            await syncService.uploadState(user.uid, {
                program, activeMeso, activeSession: currentActiveSession, exercises, logs,
                config, rpFeedback,
                userProfile, nutritionLogs, cardioSessions, bodyLogs,
                macroGoals: macroGoals ?? undefined,
                nutritionGoal,
                customFoods,
                personalTemplates,
                email: user.email || null,
                lastUpdated: now,
            });
            setLocalLastUpdated(now);
            await db.set('il_section_sync_meta_v1', buildSectionSyncMeta([
                'program', 'activeMeso', 'exercises', 'logs', 'config', 'rpFeedback',
                'userProfile', 'nutritionLogs', 'cardioSessions', 'nutritionGoal',
                'bodyLogs', 'macroGoals', 'customFoods', 'personalTemplates',
            ], now));
            await dirtySyncState.clear();
            setForceSyncFeedback({
                type: 'success',
                message: t.forceSyncSuccess || (TRANSLATIONS[lang].copy.appModals.dataSyncedToCloud)
            });
        } catch (e: any) {
            console.error(e);
            setForceSyncFeedback({
                type: 'error',
                message: (t.forceSyncError || (TRANSLATIONS[lang].copy.appModals.failedToSyncTo)) + (e?.message ? ` (${e.message})` : '')
            });
        } finally {
            setIsSyncing(false);
        }
    }, [user, program, activeMeso, exercises, logs, config, rpFeedback, userProfile, getNutritionSnapshot, personalTemplates, setLocalLastUpdated, t, lang, setIsSyncing, setShowForceSyncModal, setForceSyncFeedback]);

    const confirmImport = useCallback(async () => {
        if (!validatedBackup) return;
        try {
            await restoreBackupToStorage(validatedBackup);
            setValidatedBackup(null);
            setBackupSummary(null);
            window.location.reload();
        } catch (err) {
            console.error('Failed to restore backup:', err);
            setImportError(TRANSLATIONS[lang].copy.appModals.failedToRestoreBackup);
        }
    }, [validatedBackup, setValidatedBackup, setBackupSummary, setImportError, lang]);

    return (
        <>
            {/* Command Palette — primary "start a workout" entry point */}
            <Suspense fallback={null}>
                <CommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    actions={commandActions}
                />
            </Suspense>

            {/* Standard Modal Overlays (1:1 RP Mesocycle complete! sheet) */}
            {showMesoCompleteModal && (
                (activeMeso?.programSystem?.systemId === KONG_4DAY_ID || activeMeso?.programSystem?.systemId === 'kong_4day') ? <Suspense fallback={null}><ProgramCompletionView meso={activeMeso} logs={logs} lang={lang} onFinish={() => { setActiveMeso(null); setShowMesoCompleteModal(false); }} onKeep={() => { setActiveMeso(null); setShowMesoCompleteModal(false); }} /></Suspense> :
                <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in" role="dialog" aria-modal="true">
                    <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-base p-6 text-center shadow-2xl space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">
                                {pickLang(lang, { es: '¡Mesociclo completado!', en: 'Mesocycle complete!' })}
                            </h3>
                            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                                {t.finishMesoDesc || pickLang(lang, {
                                    es: 'Completaste la semana final. Revisa tus métricas o planifica tu siguiente bloque.',
                                    en: "You've completed the final week. Review your stats or plan your next block.",
                                })}
                            </p>
                        </div>
                        <div className="space-y-2 pt-1">
                            <button
                                type="button"
                                data-testid="plan-next-meso-carryover-btn"
                                onClick={() => {
                                    if (activeMeso && !activeMeso.programSystem) {
                                        const sfrHistory = loadExerciseSfrHistory();
                                        const jointPainIds = Object.keys(sfrHistory).filter((exId) =>
                                            hasJointPainWarning(sfrHistory[exId]),
                                        );
                                        const carry = buildNextMesocycleCarryOver({
                                            prevMeso: activeMeso,
                                            program,
                                            logs,
                                            experience: (userProfile?.experience as any) || 'intermediate',
                                            lang,
                                            jointPainIds,
                                            exercises,
                                        });
                                        saveMesocycleDraft(carry.draft);
                                        setMesoEditorIntent('builder');
                                        setActiveMeso(null);
                                        setShowMesoCompleteModal(false);
                                        setView('program');
                                        return;
                                    }
                                    setActiveMeso(null);
                                    setShowMesoCompleteModal(false);
                                    setView('mesos');
                                }}
                                className="w-full min-h-11 rounded-[8px] bg-primary-500 px-4 text-xs font-black uppercase tracking-wider text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all"
                            >
                                {pickLang(lang, { es: 'PLANIFICAR SIGUIENTE MESOCICLO', en: 'PLAN MY NEXT MESOCYCLE' })}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMeso(null);
                                    setShowMesoCompleteModal(false);
                                    setView('stats');
                                }}
                                className="w-full min-h-11 rounded-[8px] border border-border-subtle bg-surface-raised px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-surface-elevated active:scale-[0.99] transition-all"
                            >
                                {pickLang(lang, { es: 'VER ESTADÍSTICAS DEL CICLO', en: 'VIEW MESOCYCLE STATS' })}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMesoCompleteModal(false)}
                                className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                            >
                                {t.notYet || pickLang(lang, { es: 'Todavía no', en: 'Not yet' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAuthModal && (
                <Suspense fallback={null}>
                    <AuthModal onClose={() => setShowAuthModal(false)} />
                </Suspense>
            )}

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}

            {/* SYNC CONFLICT MODAL */}
            <Suspense fallback={null}>
            <ConfirmModal
                isOpen={!!pendingCloudData}
                title={TRANSLATIONS[lang].copy.appModals.cloudSync}
                description={(() => {
                    const friendlySections = pendingCloudSections.map(sec => ((t.syncSections as any)?.[sec]) || sec);
                    const sectionsText = friendlySections.length > 0
                        ? (formatMessage(TRANSLATIONS[lang].copy.appModals.inSections, { sections: friendlySections.join(', ') }))
                        : '';
                    return formatMessage(TRANSLATIONS[lang].copy.appModals.newerCloudDataFound, { sectionsText });
                })()}
                confirmText={TRANSLATIONS[lang].copy.appModals.download}
                cancelText={TRANSLATIONS[lang].copy.appModals.keepLocal}
                onConfirm={confirmCloudSync}
                onCancel={cancelCloudSync}
                variant="primary"
            />

            </Suspense>

            {/* IMPORT CONFIRM MODAL */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={!!validatedBackup}
                    title={t.import}
                    description={backupSummary ? (
                        formatMessage(TRANSLATIONS[lang].copy.appModals.restoreRoutinesExercisesLogs, { programsCount: backupSummary.programsCount, exercisesCount: backupSummary.exercisesCount, logsCount: backupSummary.logsCount, nutritionDaysCount: backupSummary.nutritionDaysCount })
                    ) : t.importConfirm}
                    confirmText={t.import}
                    cancelText={t.cancel}
                    onConfirm={confirmImport}
                    onCancel={() => { setValidatedBackup(null); setBackupSummary(null); }}
                    variant="danger"
                />
            </Suspense>

            {/* IMPORT ERROR MODAL */}
            {importError && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={TRANSLATIONS[lang].copy.appModals.importError}
                        description={importError}
                        confirmText={TRANSLATIONS[lang].copy.appModals.ok}
                        cancelText=""
                        variant="primary"
                        onConfirm={() => setImportError(null)}
                        onCancel={() => setImportError(null)}
                    />
                </Suspense>
            )}

            {/* FORCE SYNC MODAL */}
            <Suspense fallback={null}>
            <ConfirmModal
                isOpen={showForceSyncModal}
                title={t.forceSyncTitle}
                description={t.forceSyncConfirm}
                confirmText={t.upload}
                cancelText={t.cancel}
                onConfirm={executeForceSync}
                onCancel={() => setShowForceSyncModal(false)}
            />

            </Suspense>

            {/* FORCE SYNC FEEDBACK MODAL */}
            {forceSyncFeedback && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={forceSyncFeedback.type === 'success' ? t.syncComplete : t.syncError}
                        description={forceSyncFeedback.message}
                        confirmText={t.understood}
                        cancelText=""
                        variant={forceSyncFeedback.type === 'success' ? 'primary' : 'danger'}
                        onConfirm={() => setForceSyncFeedback(null)}
                        onCancel={() => setForceSyncFeedback(null)}
                    />
                </Suspense>
            )}

            {/* FACTORY RESET MODAL */}
            {showResetModal && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.dangerZone}
                        description={t.deleteDataConfirm}
                        confirmText={t.delete}
                        cancelText={t.cancel}
                        variant="danger"
                        onConfirm={async () => {
                            await resetLocalData();
                            window.location.reload();
                        }}
                        onCancel={() => setShowResetModal(false)}
                    />
                </Suspense>
            )}

            {/* KONG CONVERSION MODAL */}
            {showKongConvertModal && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.convertKongTitle}
                        description={TRANSLATIONS[lang].copy.appModals.theOfficialKongDefinition}
                        confirmText={t.convertKongConfirm}
                        cancelText={t.cancel}
                        onConfirm={() => {
                            if (!activeMeso) return;
                            const { editableProgram, convertedMeso } = convertKongToPersonalRoutine(activeMeso, lang);
                            setProgram(editableProgram);
                            setActiveMeso(convertedMeso);
                            setShowKongConvertModal(false);
                            setView('program');
                        }}
                        onCancel={() => setShowKongConvertModal(false)}
                    />
                </Suspense>
            )}
        </>
    );
};
