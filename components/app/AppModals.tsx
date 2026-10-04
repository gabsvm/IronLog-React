import React, { Suspense, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import type { CommandAction } from '../../components/ui/CommandPalette';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { resetLocalData } from '../../services/localDataReset';
import { syncService } from '../../services/syncService';
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
        userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
        setProgram,
    } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const activeSession = useStore(state => state.activeSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const { user } = useAuth();
    const { showPaywall, setShowPaywall, featureAttempted } = usePro();

    const t = TRANSLATIONS[lang];

    const executeForceSync = useCallback(async () => {
        if (!user) return;
        setIsSyncing(true);
        setShowForceSyncModal(false);
        try {
            await syncService.uploadState(user.uid, {
                program, activeMeso, activeSession, exercises, logs,
                config, rpFeedback,
                userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
                email: user.email || null,
                lastUpdated: Date.now(),
            });
            setForceSyncFeedback({
                type: 'success',
                message: t.forceSyncSuccess || (lang === 'en' ? 'Data synced to cloud successfully.' : 'Datos sincronizados con la nube correctamente.')
            });
        } catch (e: any) {
            console.error(e);
            setForceSyncFeedback({
                type: 'error',
                message: (t.forceSyncError || (lang === 'en' ? 'Failed to sync to cloud.' : 'Error al sincronizar con la nube.')) + (e?.message ? ` (${e.message})` : '')
            });
        } finally {
            setIsSyncing(false);
        }
    }, [user, program, activeMeso, activeSession, exercises, logs, config, rpFeedback, userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal, t, lang, setIsSyncing, setShowForceSyncModal, setForceSyncFeedback]);

    const confirmImport = useCallback(async () => {
        if (!validatedBackup) return;
        try {
            await restoreBackupToStorage(validatedBackup);
            setValidatedBackup(null);
            setBackupSummary(null);
            window.location.reload();
        } catch (err) {
            console.error('Failed to restore backup:', err);
            setImportError(lang === 'en' ? 'Failed to restore backup data' : 'Error al restaurar copia de seguridad');
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

            {/* Standard Modal Overlays */}
            {showMesoCompleteModal && (
                activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id ? <Suspense fallback={null}><ProgramCompletionView meso={activeMeso} logs={logs} lang={lang} onFinish={() => { setActiveMeso(null); setShowMesoCompleteModal(false); }} onKeep={() => { setActiveMeso(null); setShowMesoCompleteModal(false); }} /></Suspense> :
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.finishMesoTitle || "Complete Mesocycle?"}
                        description={t.finishMesoDesc || "You've completed the final week. Great work! Conclude the mesocycle now?"}
                        confirmText={t.complete || "Complete"}
                        cancelText={t.notYet || "Not Yet"}
                        onConfirm={() => {
                            setActiveMeso(null);
                            setShowMesoCompleteModal(false);
                        }}
                        onCancel={() => setShowMesoCompleteModal(false)}
                    />
                </Suspense>
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
                title={lang === 'en' ? "Cloud Sync" : "Sincronización Nube"}
                description={(() => {
                    const friendlySections = pendingCloudSections.map(sec => ((t.syncSections as any)?.[sec]) || sec);
                    const sectionsText = friendlySections.length > 0
                        ? (lang === 'en' ? ` in: ${friendlySections.join(', ')}` : ` en: ${friendlySections.join(', ')}`)
                        : '';
                    return lang === 'en'
                        ? `Newer cloud data found${sectionsText}. Download it? This will overwrite those local sections.`
                        : `Se encontraron datos más nuevos en la nube${sectionsText}. ¿Descargar? Esto sobrescribirá esas secciones locales.`;
                })()}
                confirmText={lang === 'en' ? "Download" : "Descargar"}
                cancelText={lang === 'en' ? "Keep Local" : "Mantener Local"}
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
                        lang === 'en'
                            ? `Restore ${backupSummary.programsCount} routines, ${backupSummary.exercisesCount} exercises, ${backupSummary.logsCount} logs, and ${backupSummary.nutritionDaysCount} nutrition days? This will overwrite local data.`
                            : `¿Restaurar ${backupSummary.programsCount} rutinas, ${backupSummary.exercisesCount} ejercicios, ${backupSummary.logsCount} entrenamientos y ${backupSummary.nutritionDaysCount} días de nutrición? Esto sobrescribirá los datos locales.`
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
                        title={lang === 'en' ? 'Import Error' : 'Error de Importación'}
                        description={importError}
                        confirmText={lang === 'en' ? 'OK' : 'Entendido'}
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
                        description={lang === 'es'
                            ? 'La definición oficial de KONG no se edita directamente para preservar la metodología original. ¿Deseas convertir tu ciclo actual en una rutina editable?'
                            : 'The official KONG definition cannot be edited directly to preserve the original methodology. Do you want to convert this cycle into an editable personal routine?'}
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
