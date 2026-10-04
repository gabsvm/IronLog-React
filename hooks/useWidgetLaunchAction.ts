import { useEffect, useRef } from 'react';
import { getNativeLaunchAction } from '../utils/audio';

/**
 * Q17: run onStart once per widget tap. Checks on mount and whenever the app
 * becomes visible again (warm start via onNewIntent). The native side
 * consumes the pending action, so each tap is delivered exactly once by
 * construction — even across StrictMode double-effects.
 */
export const useWidgetLaunchAction = (enabled: boolean, onStart: () => void) => {
    const onStartRef = useRef(onStart);
    onStartRef.current = onStart;

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        const check = async () => {
            const action = await getNativeLaunchAction();
            if (!cancelled && action === 'start') onStartRef.current();
        };
        void check();
        const onVisible = () => {
            if (document.visibilityState === 'visible') void check();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [enabled]);
};
