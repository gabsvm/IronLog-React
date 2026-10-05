import React, { useEffect, useState } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import {
    buildDiagnosticsText,
    clearErrorLog,
    readErrorLog,
} from '../../utils/errorLog';
import { isErrorReportingEnabled, setErrorReportingEnabled } from '../../utils/errorReporting';

interface ErrorLogCardProps {
    lang: keyof typeof TRANSLATIONS;
    syncStatusText: string;
}

const copyText = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Fall through to the legacy path.
    }
    try {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        return ok;
    } catch {
        return false;
    }
};

/**
 * Q5: error-log card for ProfileSheet → Advanced. Shows the stored entry
 * count, copies a diagnostics blob (version, platform, sync state, latest
 * errors) and clears the log. All strings come from TRANSLATIONS.
 */
export const ErrorLogCard: React.FC<ErrorLogCardProps> = ({ lang, syncStatusText }) => {
    const t = TRANSLATIONS[lang].you;
    const [count, setCount] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [reporting, setReporting] = useState(() => isErrorReportingEnabled());

    useEffect(() => {
        let cancelled = false;
        void readErrorLog().then((entries) => {
            if (!cancelled) setCount(entries.length);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleCopy = async () => {
        const entries = await readErrorLog();
        const ok = await copyText(buildDiagnosticsText({ syncStatusText, entries }));
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClear = async () => {
        await clearErrorLog();
        setCount(0);
    };

    return (
        <div className="card-reference p-4 space-y-2">
            <div className="label-reference px-1 mb-1">{t.errorLogTitle}</div>
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-500">
                    {count === null || count === 0
                        ? t.errorLogEmpty
                        : t.errorLogCount.replace('{count}', String(count))}
                </span>
            </div>
            {/* U7: opt-in anonymous remote reports (off by default). */}
            <label className="flex items-start justify-between gap-3 py-1 cursor-pointer">
                <span className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">{t.errorReportsTitle}</span>
                    <span className="text-[10px] text-muted">{t.errorReportsDesc}</span>
                </span>
                <input
                    type="checkbox"
                    role="switch"
                    aria-label={t.errorReportsTitle}
                    checked={reporting}
                    onChange={(e) => {
                        setErrorReportingEnabled(e.target.checked);
                        setReporting(e.target.checked);
                    }}
                    className="mt-1 h-4 w-4 accent-primary-500"
                />
            </label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <Icon name="Copy" size={14} /> {copied ? t.errorLogCopied : t.errorLogCopy}
                </button>
                <button
                    type="button"
                    onClick={() => void handleClear()}
                    disabled={count === null || count === 0}
                    className="py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-45"
                >
                    <Icon name="Trash2" size={14} /> {t.errorLogClear}
                </button>
            </div>
        </div>
    );
};
