import { useEffect, useRef, useState } from 'react';
import { consumeNativeSharedFile } from '../utils/audio';
import type { SharedCsvLaunch } from '../utils/sharedCsv';

/**
 * T3: CSVs shared to the native app (Android Share / Open with). Checks on
 * mount and whenever the app becomes visible again (warm start through
 * onNewIntent); the native side hands each file over exactly once. Each new
 * file gets a fresh `seq` so the importer remounts for it.
 */
export const useNativeSharedCsv = (enabled: boolean) => {
    const [shared, setShared] = useState<{ seq: number; launch: Exclude<SharedCsvLaunch, { kind: 'none' }> } | null>(null);
    const seqRef = useRef(0);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        const check = async () => {
            const file = await consumeNativeSharedFile();
            if (cancelled || file === null) return;
            seqRef.current += 1;
            setShared({
                seq: seqRef.current,
                launch: file === 'error' ? { kind: 'error' } : { kind: 'file', payload: file },
            });
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

    return shared;
};
