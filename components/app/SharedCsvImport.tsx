import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { CsvImportSheet } from '../profile/CsvImportSheet';
import { useCsvImportFlow } from '../profile/useCsvImportFlow';
import { consumeSharedCsvLaunch, subscribeFileHandlerLaunches, type SharedCsvLaunch } from '../../utils/sharedCsv';

interface SharedCsvImportProps {
    /** True once local data is hydrated (imports must merge into real logs). */
    ready: boolean;
    onImported: () => void;
    /** T3: a file the native app received (Android Share / Open with). */
    nativeLaunch?: SharedCsvLaunch;
}

/**
 * S3: imports a CSV that reached the installed PWA from outside — the share
 * sheet (manifest share_target, stored by the service worker) or desktop
 * "Open with" (manifest file_handlers / launchQueue). Same flow as
 * Perfil → Datos → Importar CSV (useCsvImportFlow).
 */
export const SharedCsvImport: React.FC<SharedCsvImportProps> = ({ ready, onImported, nativeLaunch }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang].csv;
    const flow = useCsvImportFlow({ onImported });
    const flowRef = useRef(flow);
    flowRef.current = flow;
    const handledRef = useRef(false);

    useEffect(() => {
        if (!ready || handledRef.current) return;
        handledRef.current = true;
        const handle = (launch: SharedCsvLaunch) => {
            if (launch.kind === 'file') flowRef.current.openCsvText(launch.payload.text);
            else if (launch.kind === 'error') flowRef.current.setCsvError(t.sharedError);
        };
        if (nativeLaunch) {
            handle(nativeLaunch);
            return;
        }
        void consumeSharedCsvLaunch().then(handle);
        subscribeFileHandlerLaunches((payload) => flowRef.current.openCsvText(payload.text));
    }, [ready, t.sharedError, nativeLaunch]);

    const message = flow.csvError ?? flow.csvStatus;

    return (
        <>
            {flow.sheetProps && <CsvImportSheet {...flow.sheetProps} />}
            {message && !flow.sheetProps && (
                <div
                    role={flow.csvError ? 'alert' : 'status'}
                    className="fixed left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[90] mx-auto max-w-md rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 shadow-lg flex items-start gap-3"
                >
                    <p className={`flex-1 text-xs font-bold ${flow.csvError ? 'text-red-500' : 'text-emerald-500'}`}>{message}</p>
                    <button
                        type="button"
                        onClick={() => flowRef.current.clearMessages()}
                        className="text-xs font-bold text-muted"
                    >
                        {t.dismiss}
                    </button>
                </div>
            )}
        </>
    );
};
