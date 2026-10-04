import React, { useEffect, useState } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import {
    dismissBackupReminder,
    exportCurrentBackup,
    getLastBackupAt,
    getReminderDismissedAt,
    shouldShowBackupReminder,
} from '../../services/autoBackup';

/**
 * Q6: dismissible Home banner when the last export is missing or ≥ 14 days
 * old and newer sessions exist. "Export now" runs the shared export flow;
 * closing stamps a dismissal (a newer session re-arms the banner).
 */
export const BackupReminderBanner: React.FC = () => {
    const { lang } = useAppPreferences();
    const appState = useApp();
    const activeMeso = useStore((state) => state.activeMeso);
    const activeSession = useStore((state) => state.activeSession);
    const t = TRANSLATIONS[lang].you;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const [lastExportAt, dismissedAt] = await Promise.all([
                getLastBackupAt(),
                getReminderDismissedAt(),
            ]);
            if (cancelled) return;
            setVisible(
                shouldShowBackupReminder({
                    now: Date.now(),
                    lastExportAt,
                    logs: Array.isArray(appState.logs) ? appState.logs : [],
                    dismissedAt,
                }),
            );
        })();
        return () => {
            cancelled = true;
        };
    }, [appState.logs]);

    if (!visible) return null;

    const handleExport = async () => {
        const {
            program, exercises, logs,
            userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
            personalTemplates, customFoods, rpFeedback, config,
        } = appState;
        await exportCurrentBackup({
            program, exercises, logs, activeMeso, activeSession,
            userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
            personalTemplates, customFoods, rpFeedback, config,
        });
        setVisible(false);
    };

    const handleDismiss = async () => {
        await dismissBackupReminder();
        setVisible(false);
    };

    return (
        <div
            role="status"
            className="card-reference p-3 flex items-center gap-3 border-amber-500/30"
        >
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Icon name="AlertTriangle" size={17} />
            </span>
            <p className="flex-1 text-xs font-medium text-white leading-snug">{t.reminderText}</p>
            <button
                type="button"
                onClick={() => void handleExport()}
                className="px-3 py-1.5 text-xs rounded-xl font-bold bg-primary-500 text-zinc-950 hover:bg-primary-400 shrink-0"
            >
                {t.reminderExport}
            </button>
            <button
                type="button"
                onClick={() => void handleDismiss()}
                aria-label={t.reminderDismiss}
                className="p-2 text-muted hover:text-white shrink-0"
            >
                <Icon name="X" size={14} />
            </button>
        </div>
    );
};
