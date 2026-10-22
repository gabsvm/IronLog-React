import React, { useEffect, useState } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import {
    getExactAlarmState,
    openExactAlarmSettings,
    type ExactAlarmState,
} from '../../utils/audio';

interface ExactAlarmRowProps {
    lang: keyof typeof TRANSLATIONS;
}

/**
 * Q8: exact-alarms row for ProfileSheet → Training. Rendered only on native
 * Android API 31+, where the permission exists. Refreshes when returning to
 * the app (the user may have toggled it in system settings).
 */
export const ExactAlarmRow: React.FC<ExactAlarmRowProps> = ({ lang }) => {
    const t = TRANSLATIONS[lang].you;
    const [state, setState] = useState<ExactAlarmState | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const refresh = async () => {
            const next = await getExactAlarmState();
            if (!cancelled) {
                setState(next);
                setLoaded(true);
            }
        };
        void refresh();
        const onReturn = () => void refresh();
        document.addEventListener('visibilitychange', onReturn);
        window.addEventListener('focus', onReturn);
        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onReturn);
            window.removeEventListener('focus', onReturn);
        };
    }, []);

    if (!loaded || !state || state.sdkInt < 31) return null;

    return (
        <div className="flex items-center justify-between gap-2 p-3">
            <div className="flex items-center gap-3 pr-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-accent">
                    <Icon name="Clock" size={17} />
                </span>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t.exactAlarmTitle}</span>
                    <span className={`text-xs font-semibold ${state.granted ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {state.granted ? t.exactAlarmGranted : t.exactAlarmDenied}
                    </span>
                </div>
            </div>
            {!state.granted && (
                <button
                    type="button"
                    onClick={() => openExactAlarmSettings()}
                    className="gl-quiet min-h-11 shrink-0 rounded-xl px-4 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                    {t.exactAlarmEnable}
                </button>
            )}
        </div>
    );
};
