// U5: notification / exact-alarm one-time prompts, moved verbatim from components/ui/RestTimerOverlay.tsx.
import React from 'react';
import type { RestTimerOverlayState } from './useRestTimerOverlayState';

export const RestTimerNotifPrompt: React.FC<{ state: RestTimerOverlayState }> = ({ state }) => {
    const { t, showNotifPrompt, dismissNotifPrompt, enableNotifFromPrompt } = state;
    const notifPrompt = showNotifPrompt ? (
        <div role="status" className="fixed inset-x-0 z-sheet mx-auto max-w-md px-3 pointer-events-none" style={{ top: 'calc(var(--safe-area-top) + 76px)' }}>
            <div className="premium-theme-panel pointer-events-auto rounded-3xl p-4 shadow-xl">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t.notifPromptTitle}</p>
                <p className="mt-2 text-xs text-muted">{t.notifWebCaveat}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={dismissNotifPrompt}
                        className="min-h-[44px] rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-xs font-semibold text-[rgb(var(--text-primary))] active:scale-95 transition-all"
                    >
                        {t.notifPromptLater}
                    </button>
                    <button
                        type="button"
                        onClick={enableNotifFromPrompt}
                        className="min-h-[44px] rounded-full bg-primary-500 text-xs font-bold text-zinc-950 hover:bg-primary-400 active:scale-95 transition-all"
                    >
                        {t.notifPromptEnable}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    // Native-only twin of the web notification prompt (they never co-show).
    return notifPrompt;
};

export const RestTimerAlarmNotice: React.FC<{ state: RestTimerOverlayState }> = ({ state }) => {
    const { t, showAlarmNotice, dismissAlarmNotice, enableAlarmFromNotice } = state;
    const alarmNotice = showAlarmNotice ? (
        <div role="status" className="fixed inset-x-0 z-sheet mx-auto max-w-md px-3 pointer-events-none" style={{ top: 'calc(var(--safe-area-top) + 76px)' }}>
            <div className="premium-theme-panel pointer-events-auto rounded-3xl p-4 shadow-xl">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t.exactAlarmNoticeTitle}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={dismissAlarmNotice}
                        className="min-h-[44px] rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-xs font-semibold text-[rgb(var(--text-primary))] active:scale-95 transition-all"
                    >
                        {t.notifPromptLater}
                    </button>
                    <button
                        type="button"
                        onClick={enableAlarmFromNotice}
                        className="min-h-[44px] rounded-full bg-primary-500 text-xs font-bold text-zinc-950 hover:bg-primary-400 active:scale-95 transition-all"
                    >
                        {t.exactAlarmNoticeEnable}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return alarmNotice;
};

/** Idle state: both one-time prompts (the active views only show the notification one). */
export const RestTimerPrompts: React.FC<{ state: RestTimerOverlayState }> = ({ state }) => (
    <><RestTimerNotifPrompt state={state} /><RestTimerAlarmNotice state={state} /></>
);
