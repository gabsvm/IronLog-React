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
                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                    <Icon name="Clock" size={17} />
                </span>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{t.exactAlarmTitle}</span>
                    <span className={`text-[10px] font-bold ${state.granted ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {state.granted ? t.exactAlarmGranted : t.exactAlarmDenied}
                    </span>
                </div>
            </div>
            {!state.granted && (
                <button
                    type="button"
                    onClick={() => openExactAlarmSettings()}
                    className="px-3 py-1.5 text-xs rounded-xl font-bold transition-all shrink-0 bg-primary-500 text-zinc-950 hover:bg-primary-400"
                >
                    {t.exactAlarmEnable}
                </button>
            )}
        </div>
    );
};
