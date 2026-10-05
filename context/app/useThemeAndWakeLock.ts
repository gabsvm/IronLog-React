// S6: theme classes, color theme and screen wake lock, moved verbatim from context/AppContext.tsx.
import { useEffect } from 'react';
import { Lang, Theme, ColorTheme } from '../../types';
import type { MutableRefObject } from 'react';

export interface UseThemeAndWakeLockDeps {
    lang: Lang;
    theme: Theme;
    colorTheme: ColorTheme;
    keepScreenOn: boolean;
    wakeLockRef: MutableRefObject<WakeLockSentinel>;
}

/** S6: theme classes, color theme and screen wake lock (moved verbatim from AppProvider; same hook order). */
export const useThemeAndWakeLock = ({
    lang,
    theme,
    colorTheme,
    keepScreenOn,
    wakeLockRef,
}: UseThemeAndWakeLockDeps) => {
    // --- THEME & WAKELOCK ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const resolvedTheme = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;
        root.classList.add(resolvedTheme);
        root.style.colorScheme = resolvedTheme;
    }, [theme]);

    useEffect(() => { window.document.documentElement.setAttribute('data-theme', colorTheme); }, [colorTheme]);
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang;
        }
    }, [lang]);

    useEffect(() => {
        const requestWakeLock = async () => {
            if (keepScreenOn && 'wakeLock' in navigator) {
                try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) { }
            } else if (!keepScreenOn && wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { });
                wakeLockRef.current = null;
            }
        };
        requestWakeLock();
        const handleVis = () => { if (document.visibilityState === 'visible' && keepScreenOn) requestWakeLock(); };
        document.addEventListener('visibilitychange', handleVis);
        return () => { document.removeEventListener('visibilitychange', handleVis); if (wakeLockRef.current) wakeLockRef.current.release().catch(() => { }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [keepScreenOn]);
};
