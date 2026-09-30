import { AppState, ExerciseDef, GlobalTemplate, Log, MesoCycle, NutritionGoal, NutritionLog, ProgramDay, UserProfile, CardioSession, BodyLog, MacroGoals, CustomFood, ActiveSession } from '../types';
import { db } from '../utils/db';
import { useStore } from '../lib/store';
import { todayLocalDateKey } from '../utils/localDate';

export const BACKUP_SCHEMA = 'gainslab-backup';
export const CURRENT_BACKUP_VERSION = 1;
export const APP_VERSION = '4.0.3';

export interface GainsLabBackupState {
    program?: ProgramDay[];
    exercises?: ExerciseDef[];
    logs?: Log[];
    activeMeso?: MesoCycle | null;
    activeSession?: ActiveSession | null;
    userProfile?: UserProfile;
    nutritionLogs?: NutritionLog[];
    cardioSessions?: CardioSession[];
    bodyLogs?: BodyLog[];
    macroGoals?: MacroGoals | null;
    nutritionGoal?: NutritionGoal;
    personalTemplates?: GlobalTemplate[];
    customFoods?: CustomFood[];
    rpFeedback?: Record<string, any>;
    config?: {
        showRIR?: boolean;
        rpEnabled?: boolean;
        rpTargetRIR?: number;
        keepScreenOn?: boolean;
    };
}

export interface GainsLabBackupV1 {
    schema: 'gainslab-backup';
    version: number;
    exportedAt: number;
    appVersion: string;
    state: GainsLabBackupState;
}

export type BackupValidationResult =
    | { valid: true; backup: GainsLabBackupV1; summary: BackupDomainSummary }
    | { valid: false; errorKey: string; errorDetails?: string };

export interface BackupDomainSummary {
    programsCount: number;
    exercisesCount: number;
    logsCount: number;
    hasActiveMeso: boolean;
    hasActiveSession: boolean;
    hasProfile: boolean;
    nutritionDaysCount: number;
    cardioSessionsCount: number;
    bodyLogsCount: number;
    personalTemplatesCount: number;
    customFoodsCount: number;
}

/**
 * Creates a versioned backup payload from current application state.
 */
export const createBackupEnvelope = (state: GainsLabBackupState): GainsLabBackupV1 => {
    return {
        schema: BACKUP_SCHEMA,
        version: CURRENT_BACKUP_VERSION,
        exportedAt: Date.now(),
        appVersion: APP_VERSION,
        state: {
            program: state.program ?? [],
            exercises: state.exercises ?? [],
            logs: state.logs ?? [],
            activeMeso: state.activeMeso ?? null,
            activeSession: state.activeSession ?? null,
            userProfile: state.userProfile,
            nutritionLogs: state.nutritionLogs ?? [],
            cardioSessions: state.cardioSessions ?? [],
            bodyLogs: state.bodyLogs ?? [],
            macroGoals: state.macroGoals ?? null,
            nutritionGoal: state.nutritionGoal,
            personalTemplates: state.personalTemplates ?? [],
            customFoods: state.customFoods ?? [],
            rpFeedback: state.rpFeedback ?? {},
            config: state.config,
        },
    };
};

/**
 * Calculates a summary of data domains contained in a backup.
 */
export const summarizeBackup = (state: GainsLabBackupState): BackupDomainSummary => {
    return {
        programsCount: Array.isArray(state.program) ? state.program.length : 0,
        exercisesCount: Array.isArray(state.exercises) ? state.exercises.length : 0,
        logsCount: Array.isArray(state.logs) ? state.logs.length : 0,
        hasActiveMeso: !!state.activeMeso,
        hasActiveSession: !!state.activeSession,
        hasProfile: !!state.userProfile,
        nutritionDaysCount: Array.isArray(state.nutritionLogs) ? state.nutritionLogs.length : 0,
        cardioSessionsCount: Array.isArray(state.cardioSessions) ? state.cardioSessions.length : 0,
        bodyLogsCount: Array.isArray(state.bodyLogs) ? state.bodyLogs.length : 0,
        personalTemplatesCount: Array.isArray(state.personalTemplates) ? state.personalTemplates.length : 0,
        customFoodsCount: Array.isArray(state.customFoods) ? state.customFoods.length : 0,
    };
};

/**
 * Validates arbitrary input, migrating legacy 4.0.x un-enveloped exports if necessary.
 */
export const validateAndMigrateBackup = (raw: unknown): BackupValidationResult => {
    if (!raw || typeof raw !== 'object') {
        return { valid: false, errorKey: 'backup_invalid_json', errorDetails: 'Root payload must be an object' };
    }

    const obj = raw as Record<string, any>;

    // Case 1: Standard versioned GainsLab backup
    if (obj.schema === BACKUP_SCHEMA) {
        const version = Number(obj.version);
        if (isNaN(version) || version <= 0) {
            return { valid: false, errorKey: 'backup_invalid_version', errorDetails: 'Invalid version number' };
        }
        if (version > CURRENT_BACKUP_VERSION) {
            return {
                valid: false,
                errorKey: 'backup_unsupported_future_version',
                errorDetails: `Backup version ${version} is newer than supported version ${CURRENT_BACKUP_VERSION}`,
            };
        }

        const state = obj.state;
        if (!state || typeof state !== 'object') {
            return { valid: false, errorKey: 'backup_missing_state', errorDetails: 'State payload is missing' };
        }

        const summary = summarizeBackup(state);
        const hasAnyData = summary.programsCount > 0 || summary.exercisesCount > 0 || summary.logsCount > 0 ||
            summary.hasActiveMeso || summary.hasProfile || summary.nutritionDaysCount > 0 || summary.bodyLogsCount > 0;

        if (!hasAnyData) {
            return { valid: false, errorKey: 'backup_empty', errorDetails: 'Backup contains no usable domain data' };
        }

        return {
            valid: true,
            backup: obj as GainsLabBackupV1,
            summary,
        };
    }

    // Case 2: Legacy 4.0.x un-enveloped backup compatibility
    // Has top-level arrays like program, exercises, logs, etc.
    const hasLegacyDomain = Array.isArray(obj.program) || Array.isArray(obj.exercises) || Array.isArray(obj.logs) ||
        Array.isArray(obj.nutritionLogs) || (obj.userProfile && typeof obj.userProfile === 'object');

    if (hasLegacyDomain) {
        const legacyState: GainsLabBackupState = {
            program: Array.isArray(obj.program) ? obj.program : undefined,
            exercises: Array.isArray(obj.exercises) ? obj.exercises : undefined,
            logs: Array.isArray(obj.logs) ? obj.logs : undefined,
            activeMeso: obj.activeMeso ?? undefined,
            activeSession: obj.activeSession ?? undefined,
            userProfile: obj.userProfile ?? undefined,
            nutritionLogs: Array.isArray(obj.nutritionLogs) ? obj.nutritionLogs : undefined,
            cardioSessions: Array.isArray(obj.cardioSessions) ? obj.cardioSessions : undefined,
            bodyLogs: Array.isArray(obj.bodyLogs) ? obj.bodyLogs : undefined,
            macroGoals: obj.macroGoals ?? undefined,
            nutritionGoal: obj.nutritionGoal ?? undefined,
            personalTemplates: Array.isArray(obj.personalTemplates) ? obj.personalTemplates : undefined,
            customFoods: Array.isArray(obj.customFoods) ? obj.customFoods : undefined,
            rpFeedback: obj.rpFeedback ?? undefined,
            config: obj.config ?? undefined,
        };

        const migratedBackup: GainsLabBackupV1 = {
            schema: BACKUP_SCHEMA,
            version: 1,
            exportedAt: Date.now(),
            appVersion: String(obj.version || '4.0.3-legacy'),
            state: legacyState,
        };

        return {
            valid: true,
            backup: migratedBackup,
            summary: summarizeBackup(legacyState),
        };
    }

    return {
        valid: false,
        errorKey: 'backup_unrecognized_format',
        errorDetails: 'File does not match GainsLab backup schema or legacy format',
    };
};

/**
 * Restores all domains from a valid backup directly into IndexedDB,
 * ensuring immediate persistence before app reload.
 */
export const restoreBackupToStorage = async (backup: GainsLabBackupV1): Promise<void> => {
    const s = backup.state;

    // Apply active workout & meso in Zustand store
    useStore.setState({
        activeSession: s.activeSession ?? null,
        activeMeso: s.activeMeso ?? null,
    });

    const writeTasks: Promise<void>[] = [];

    if (s.program !== undefined) writeTasks.push(db.set('il_prog_v16', s.program));
    if (s.exercises !== undefined) writeTasks.push(db.set('il_ex_v16', s.exercises));
    if (s.logs !== undefined) writeTasks.push(db.set('il_logs_v16', s.logs));
    if (s.activeMeso !== undefined) writeTasks.push(db.set('il_meso_v16', s.activeMeso));
    if (s.activeSession !== undefined) writeTasks.push(db.set('il_session_v16', s.activeSession));
    if (s.userProfile !== undefined) writeTasks.push(db.set('il_profile_v1', s.userProfile));
    if (s.nutritionLogs !== undefined) writeTasks.push(db.set('il_nutrition_v1', s.nutritionLogs));
    if (s.cardioSessions !== undefined) writeTasks.push(db.set('il_cardio_v1', s.cardioSessions));
    if (s.bodyLogs !== undefined) writeTasks.push(db.set('il_body_v1', s.bodyLogs));
    if (s.macroGoals !== undefined) writeTasks.push(db.set('il_macros_v1', s.macroGoals));
    if (s.nutritionGoal !== undefined) writeTasks.push(db.set('il_nut_goal_v1', s.nutritionGoal));
    if (s.personalTemplates !== undefined) writeTasks.push(db.set('il_personal_templates_v1', s.personalTemplates));
    if (s.customFoods !== undefined) writeTasks.push(db.set('il_custom_foods_v1', s.customFoods));
    if (s.rpFeedback !== undefined) writeTasks.push(db.set('il_rp_fb_v1', s.rpFeedback));

    // Ensure onboarding is marked complete if data was restored
    writeTasks.push(db.set('il_onboarded_v2', true));
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('il_has_seen_onboarding_v1', 'true');
    }

    await Promise.all(writeTasks);
};

/**
 * Generates the standardized download filename.
 */
export const getBackupDownloadFilename = (): string => {
    return `gainslab_backup_${todayLocalDateKey()}.json`;
};
