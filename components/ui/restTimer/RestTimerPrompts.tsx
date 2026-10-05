// U5: notification / exact-alarm one-time prompts, moved verbatim from components/ui/RestTimerOverlay.tsx.
import React from 'react';
import type { RestTimerOverlayState } from './useRestTimerOverlayState';

export const RestTimerNotifPrompt: React.FC<{ state: RestTimerOverlayState }> = ({ state }) => {
    const { t, showNotifPrompt, dismissNotifPrompt, enableNotifFromPrompt } = state;
    const notifPrompt = showNotifPrompt ? (
        <div role="status" className="fixed inset-x-0 z-sheet mx-auto max-w-md px-3 pointer-events-none" style={{ bottom: 'calc(var(--safe-area-bottom) + 80px + var(--rest-pill-height, 0px) + 16px)' }}>
            <div className="pointer-events-auto rounded-2xl border border-border-strong bg-surface-raised/95 p-3 shadow-xl backdrop-blur-md">
                <p className="text-xs font-medium text-zinc-100">{t.notifPromptTitle}</p>
                <p className="mt-1 text-[11px] text-muted">{t.notifWebCaveat}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={dismissNotifPrompt}
                        className="min-h-[44px] rounded-xl border border-border-subtle bg-surface-elevated text-xs font-semibold text-muted hover:text-white active:scale-95 transition-all"
                    >
                        {t.notifPromptLater}
                    </button>
                    <button
                        type="button"
                        onClick={enableNotifFromPrompt}
                        className="min-h-[44px] rounded-xl bg-primary-500 text-xs font-bold text-black hover:bg-primary-400 active:scale-95 transition-all"
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
        <div role="status" className="fixed inset-x-0 z-sheet mx-auto max-w-md px-3 pointer-events-none" style={{ bottom: 'calc(var(--safe-area-bottom) + 80px + var(--rest-pill-height, 0px) + 16px)' }}>
            <div className="pointer-events-auto rounded-2xl border border-border-strong bg-surface-raised/95 p-3 shadow-xl backdrop-blur-md">
                <p className="text-xs font-medium text-zinc-100">{t.exactAlarmNoticeTitle}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={dismissAlarmNotice}
                        className="min-h-[44px] rounded-xl border border-border-subtle bg-surface-elevated text-xs font-semibold text-muted hover:text-white active:scale-95 transition-all"
                    >
                        {t.notifPromptLater}
                    </button>
                    <button
                        type="button"
                        onClick={enableAlarmFromNotice}
                        className="min-h-[44px] rounded-xl bg-primary-500 text-xs font-bold text-black hover:bg-primary-400 active:scale-95 transition-all"
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
