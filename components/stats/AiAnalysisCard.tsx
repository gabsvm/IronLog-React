import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import type { BodyLog, Log } from '../../types';
import {
    AnalysisError,
    buildAnalysisInput,
    getAnalysisEndpoint,
    hasAnalysisConsent,
    loadLastAnalysis,
    requestAnalysis,
    saveLastAnalysis,
    setAnalysisConsent,
    type AnalysisErrorCode,
    type StoredAnalysis,
} from '../../services/aiAnalysis';
import { getFirebaseAuthServices } from '../../lib/firebaseLoader';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getTranslated } from '../../utils';
import { resolveWeightUnit, toDisplay } from '../../utils/units';

interface AiAnalysisCardProps {
    lang: keyof typeof TRANSLATIONS;
    signedIn: boolean;
    logs: Log[];
    bodyLogs: BodyLog[];
    unit: 'kg' | 'lb';
    exerciseName: (ex: Log['exercises'][number]) => string;
    convert: (kg: number) => number;
    /** Test seams. */
    endpoint?: string | null;
    getIdToken?: () => Promise<string | null>;
    fetchImpl?: typeof fetch;
}

const defaultIdToken = async (): Promise<string | null> => {
    const { auth } = await getFirebaseAuthServices();
    return (await auth?.currentUser?.getIdToken()) ?? null;
};

const ERROR_KEYS: Record<AnalysisErrorCode, 'errUnauthenticated' | 'errRateLimited' | 'errNotConfigured' | 'errRefused' | 'errNetwork' | 'errFailed'> = {
    unauthenticated: 'errUnauthenticated',
    rate_limited: 'errRateLimited',
    not_configured: 'errNotConfigured',
    refused: 'errRefused',
    network: 'errNetwork',
    failed: 'errFailed',
};

/** U11: opt-in training analysis with Claude (server-side key). */
export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({
    lang, signedIn, logs, bodyLogs, unit, exerciseName, convert,
    endpoint = getAnalysisEndpoint(Capacitor.isNativePlatform()),
    getIdToken = defaultIdToken,
    fetchImpl,
}) => {
    const t = TRANSLATIONS[lang].aiAnalysis;
    const [consent, setConsent] = useState(hasAnalysisConsent);
    const [last, setLast] = useState<StoredAnalysis | null>(loadLastAnalysis);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<AnalysisErrorCode | null>(null);
    const [noData, setNoData] = useState(false);

    if (!endpoint) return null;

    const run = async () => {
        setError(null);
        setNoData(false);
        const input = buildAnalysisInput({ logs, bodyLogs, lang, unit, exerciseName, convert });
        if (!input) {
            setNoData(true);
            return;
        }
        setBusy(true);
        try {
            const result = await requestAnalysis(input, { endpoint, getIdToken, fetchImpl });
            const entry = { at: Date.now(), result };
            saveLastAnalysis(entry);
            setLast(entry);
        } catch (e) {
            setError(e instanceof AnalysisError ? e.code : 'failed');
        } finally {
            setBusy(false);
        }
    };

    const accept = () => {
        setAnalysisConsent(true);
        setConsent(true);
        void run();
    };

    const revoke = () => {
        setAnalysisConsent(false);
        setConsent(false);
    };

    const list = (title: string, items: string[]) =>
        items.length > 0 && (
            <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-zinc-500">{title}</div>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-800 dark:text-zinc-200">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        );

    return (
        <section className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md space-y-3" data-testid="ai-analysis-card" aria-label={t.title}>
            <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                    <Icon name="Bot" size={17} />
                </span>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{t.title}</h3>
                    <p className="text-xs text-muted">{t.desc}</p>
                </div>
            </div>

            {!signedIn ? (
                <p className="text-xs text-muted">{t.signIn}</p>
            ) : !consent ? (
                <>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">{t.consent}</p>
                    <button type="button" onClick={accept} className="w-full rounded-xl bg-primary-500 py-2.5 text-xs font-black text-black">
                        {t.accept}
                    </button>
                </>
            ) : (
                <>
                    {last && (
                        <div className="space-y-3" data-testid="ai-analysis-result">
                            <p className="text-sm text-zinc-900 dark:text-white">{last.result.summary}</p>
                            {list(t.strengths, last.result.strengths)}
                            {list(t.issues, last.result.issues)}
                            {list(t.suggestions, last.result.suggestions)}
                            <p className="text-[10px] text-muted">
                                {t.generatedAt.replace('{date}', new Date(last.at).toLocaleString(lang))} · {t.disclaimer}
                            </p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => void run()}
                        disabled={busy}
                        className="w-full rounded-xl bg-primary-500/10 py-2.5 text-xs font-black text-primary-600 disabled:opacity-60 dark:text-primary-400"
                    >
                        {busy ? t.busy : last ? t.rerun : t.run}
                    </button>
                    <button type="button" onClick={revoke} className="w-full text-[11px] font-bold text-muted underline">
                        {t.revoke}
                    </button>
                </>
            )}
            {noData && <p role="status" className="text-xs text-muted">{t.noData}</p>}
            {error && <p role="alert" className="text-xs font-bold text-red-500">{t[ERROR_KEYS[error]]}</p>}
        </section>
    );
};

/** Wires the card to app state (Stats → overview). */
export const AiAnalysisSection: React.FC = () => {
    const { lang, logs, bodyLogs, config } = useApp();
    const { user } = useAuth();
    const unit = resolveWeightUnit(config);
    return (
        <AiAnalysisCard
            lang={lang}
            signedIn={!!user}
            logs={Array.isArray(logs) ? logs : []}
            bodyLogs={Array.isArray(bodyLogs) ? bodyLogs : []}
            unit={unit}
            exerciseName={(ex) => getTranslated(ex.name as never, lang) || String(ex.id ?? '')}
            convert={(kg) => toDisplay(kg, unit)}
        />
    );
};
