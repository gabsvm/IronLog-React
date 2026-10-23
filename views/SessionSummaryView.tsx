import { formatMessage } from '../utils/i18n';
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Log } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import type { SessionCardVariant } from '../utils/sessionCard';
import { useApp } from '../context/AppContext';
import { getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';
import { resolveWeightUnit, toDisplay, unitLabel } from '../utils/units';
import { TRANSLATIONS } from '../constants/translations';
import { getTranslated, formatDurationShort } from '../utils';
import { shareFileOrDownload } from '../utils/shareFile';
import { pickLang, formatInteger } from '../utils/i18n';

interface SessionSummaryViewProps {
    log: Log;
    onClose: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({ log, onClose }) => {
    const { lang, userProfile, config } = useApp();
    const unit = resolveWeightUnit(config);

    const isDetached = log.mesoId < 0 || log.dayIdx < 0 || log.week < 0;
    const discipline = (log as any).discipline;

    const stats = useMemo(() => {
        let volume = 0;
        let sets = 0;
        const muscles = new Set<string>();
        const logBodyWeight = getLogBodyWeight(log, userProfile?.bodyWeight);

        (log.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(s => {
                if (s.completed && !s.skipped) {
                    sets++;
                    if (ex.muscle && ex.muscle !== 'CARDIO') muscles.add(ex.muscle);
                    volume += getSetLoadVolume(s, ex, logBodyWeight);
                }
            });
        });

        const labels = TRANSLATIONS[lang].muscle as Record<string, string>;
        return { volume, sets, muscles: Array.from(muscles).map(m => labels[m] || m) };
    }, [log, userProfile?.bodyWeight, lang]);

    type PreparedImage = { blob: Blob; filename: string; title: string; mime: string };
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [shareVariant, setShareVariant] = useState<SessionCardVariant>('dark-photo');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);
    const [previewRetry, setPreviewRetry] = useState(0);
    const [shareState, setShareState] = useState<'idle' | 'busy' | 'failed'>('idle');
    const volumeText = `${formatInteger(toDisplay(stats.volume, unit), lang)} ${unitLabel(unit).toLowerCase()}`;
    const key = `${log.id}|${log.endTime}|${log.name}|${lang}|${unit}|${stats.sets}|${stats.volume}`;
    const cardCacheRef = useRef<Map<string, Promise<PreparedImage>>>(new Map());

    const prepareShare = useCallback((variant: SessionCardVariant): Promise<PreparedImage> => {
        const cacheKey = key + '|' + variant;
        const hit = cardCacheRef.current.get(cacheKey);
        if (hit) return hit;
        const promise: Promise<PreparedImage> = (async () => {
            const { buildSessionCardModel, renderSessionCard } = await import('../utils/sessionCard');
            const c = TRANSLATIONS[lang].copy.sessionSummary;
            const model = buildSessionCardModel({
                log,
                labels: {
                    workoutComplete: c.workoutComplete, time: c.time, sets: c.sets,
                    totalVolume: c.totalVolume, musclesHit: c.musclesHit,
                    highlights: pickLang(lang, { es: 'Ejercicios destacados', en: 'Highlights' }),
                    sessionCaption: pickLang(lang, { es: 'RESUMEN DE SESIÓN', en: 'SESSION RECAP' }),
                },
                locale: pickLang(lang, { es: 'es-AR', en: 'en-US' }),
                totals: stats, volumeText,
                exerciseName: (ex) => getTranslated(ex.name as any, lang) || String(ex.name ?? ''),
                bestSetText: (ex) => {
                    const done = (ex.sets || []).filter((s) => s.completed && !s.skipped && Number(s.weight) > 0);
                    if (!done.length) return null;
                    const best = done.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
                    return `${toDisplay(Number(best.weight), unit)} ${unitLabel(unit).toLowerCase()} × ${best.reps}`;
                },
            });
            const native = Capacitor.isNativePlatform();
            const blob = await renderSessionCard(model, { format: native ? 'jpeg' : 'png', variant });
            const day = new Date(log.endTime || Date.now()).toISOString().slice(0, 10);
            return {
                blob, title: model.title, mime: native ? 'image/jpeg' : 'image/png',
                filename: `gainslab-${day}.${native ? 'jpg' : 'png'}`,
            };
        })();
        cardCacheRef.current.set(cacheKey, promise);
        // A transient encoding error must not poison subsequent export attempts.
        void promise.catch(() => {
            if (cardCacheRef.current.get(cacheKey) === promise) cardCacheRef.current.delete(cacheKey);
        });
        return promise;
    }, [key, log, lang, unit, stats, volumeText]);

    // Do not encode a 1080×1350 canvas until the user opens the share flow.

    useEffect(() => {
        if (!showShareSheet) return;
        let active = true;
        let objectUrl: string | null = null;
        setPreviewUrl(null);
        setPreviewFailed(false);
        void prepareShare(shareVariant).then(({ blob }) => {
            if (!active) return;
            objectUrl = URL.createObjectURL(blob);
            setPreviewUrl(objectUrl);
        }).catch(() => { if (active) setPreviewFailed(true); });
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [showShareSheet, shareVariant, prepareShare, previewRetry]);

    useEffect(() => () => {
        cardCacheRef.current.clear();
    }, []);


    const handleShareImage = async () => {
        if (shareState === 'busy') return;
        setShareState('busy');
        try {
            const image = await prepareShare(shareVariant);
            await shareFileOrDownload(image.blob, image.filename, image.mime, image.title);
            setShareState('idle');
        } catch {
            setShareState('failed');
        }
    };

    const getSessionTypeBadge = () => {
        if (discipline === 'crossfit') {
            return {
                label: TRANSLATIONS[lang].copy.sessionSummary.wodFunctional,
                color: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
            };
        }
        if (discipline === 'calisthenics') {
            return {
                label: TRANSLATIONS[lang].copy.sessionSummary.calisthenicsSkill,
                color: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
            };
        }
        if (isDetached) {
            return {
                label: TRANSLATIONS[lang].copy.sessionSummary.freestyleSession,
                color: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/30',
            };
        }
        return {
            label: formatMessage(TRANSLATIONS[lang].copy.sessionSummary.week, { week: log.week }),
            color: 'bg-primary-500/10 text-accent border-primary-500/30',
        };
    };

    const badge = getSessionTypeBadge();

    return (
        <div className="flex h-full flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <div className="flex-1 overflow-y-auto scroll-container px-4 py-5 sm:px-6">
                {/* Closing moment; no fabricated metrics or rewards. */}
                <section className="mx-auto w-full max-w-sm rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5 text-center">
                    <div>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border mb-2 ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))] leading-tight">
                        {TRANSLATIONS[lang].copy.sessionSummary.workoutComplete}
                    </h1>
                    <p className="mt-2 text-[rgb(var(--text-secondary))] font-medium text-sm">
                        {/* The badge already names the week; drop the "4 • " prefix from the session name. */}
                        {String(log.name || '').replace(/^\d+\s*[•·-]\s*/, '')}
                    </p>
                </section>

                {/* Stats Grid */}
                <div className="mx-auto mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] flex flex-col items-center justify-center p-4 text-center">
                        <div className="text-2xl font-semibold tabular-nums tracking-tight text-[rgb(var(--text-primary))]">{formatDurationShort(log.duration)}</div>
                        <div className="mt-1 text-xs font-semibold text-muted">
                            {TRANSLATIONS[lang].copy.sessionSummary.time}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] flex flex-col items-center justify-center p-4 text-center">
                        <div className="text-2xl font-semibold tabular-nums tracking-tight text-[rgb(var(--text-primary))]">{stats.sets}</div>
                        <div className="mt-1 text-xs font-semibold text-muted">
                            {TRANSLATIONS[lang].copy.sessionSummary.sets}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] col-span-2 flex flex-col items-center justify-center p-4 text-center">
                        <div className="text-2xl font-semibold tabular-nums tracking-tight text-[rgb(var(--text-primary))]">{formatInteger(toDisplay(stats.volume, unit), lang)} {unitLabel(unit).toLowerCase()}</div>
                        <div className="mt-1 text-xs font-semibold text-muted">
                            {TRANSLATIONS[lang].copy.sessionSummary.totalVolume}
                        </div>
                    </div>
                </div>

                {/* Muscles Hit */}
                {stats.muscles.length > 0 && (
                    <div className="mx-auto mt-5 w-full max-w-sm">
                        <p className="mb-3 text-center text-sm font-semibold text-[rgb(var(--text-secondary))]">
                            {TRANSLATIONS[lang].copy.sessionSummary.musclesHit}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {stats.muscles.map(m => (
                                <span key={m} className="rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--text-primary))]">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[rgb(var(--surface-app))] pb-safe border-t border-[rgb(var(--border-subtle))]">
                <button
                    type="button"
                    onClick={() => setShowShareSheet(true)}
                    className="mb-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-base font-semibold text-[rgb(var(--text-primary))] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                    <Icon name="Share2" size={16} />
                    {TRANSLATIONS[lang].copy.sessionSummary.shareImage}
                </button>
                <Button fullWidth onClick={onClose} className="h-12 text-base font-semibold">
                    {TRANSLATIONS[lang].copy.sessionSummary.finishGoHome}
                </Button>
            </div>
            <Sheet
                open={showShareSheet}
                onOpenChange={setShowShareSheet}
                title={pickLang(lang, { es: 'Compartir entrenamiento', en: 'Share workout' })}
                description={pickLang(lang, { es: 'Vista previa y estilo de la imagen de tu sesión', en: 'Preview and style of your session image' })}
                accent="primary"
                footer={
                    <button
                        type="button"
                        disabled={shareState === 'busy' || !previewUrl}
                        onClick={() => void handleShareImage()}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-base font-semibold text-zinc-950 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                    >
                        <Icon name="Share2" size={18} />
                        {shareState === 'busy'
                            ? TRANSLATIONS[lang].copy.sessionSummary.shareImageBusy
                            : pickLang(lang, { es: 'Compartir imagen', en: 'Share image' })}
                    </button>
                }
            >
                <div className="space-y-4 px-5 pb-6 pt-1">
                    <div className="mx-auto flex aspect-[4/5] w-full max-w-[232px] items-center justify-center overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))]">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt={pickLang(lang, { es: 'Vista previa de la tarjeta de entrenamiento completado', en: 'Completed workout card preview' })}
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <div role="status" className="flex flex-col items-center gap-3 px-4 text-center text-xs text-muted">
                                <Icon name={previewFailed ? 'AlertCircle' : 'Image'} size={28} />
                                {previewFailed
                                    ? TRANSLATIONS[lang].copy.sessionSummary.shareImageFailed
                                    : pickLang(lang, { es: 'Preparando vista previa…', en: 'Preparing preview…' })}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="mb-2 text-xs font-semibold text-muted">
                            {pickLang(lang, { es: 'ESTILO DE LA TARJETA', en: 'CARD STYLE' })}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { id: 'dark-photo', name: { es: 'Editorial', en: 'Editorial' } },
                                { id: 'minimal-dark', name: { es: 'Minimal', en: 'Minimal' } },
                                { id: 'lime-accent', name: { es: 'Lima', en: 'Lime' } },
                            ] as const).map((variant) => (
                                <button
                                    key={variant.id}
                                    type="button"
                                    aria-pressed={shareVariant === variant.id}
                                    onClick={() => { setShareState('idle'); setShareVariant(variant.id); }}
                                    className={'min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' + (
                                        shareVariant === variant.id
                                            ? 'border-primary-500 bg-primary-500/15 text-[rgb(var(--text-primary))]'
                                            : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-muted'
                                    )}
                                >
                                    {pickLang(lang, variant.name)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {shareState === 'failed' && (
                        <p role="alert" className="text-center text-xs font-semibold text-red-700 dark:text-red-400">
                            {TRANSLATIONS[lang].copy.sessionSummary.shareImageFailed}
                        </p>
                    )}
                    {previewFailed && (
                        <button
                            type="button"
                            onClick={() => setPreviewRetry((attempt) => attempt + 1)}
                            className="mx-auto block min-h-11 rounded-xl border border-[rgb(var(--border-subtle))] px-5 text-sm font-semibold text-[rgb(var(--text-primary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                        >
                            {pickLang(lang, { es: 'Reintentar vista previa', en: 'Retry preview' })}
                        </button>
                    )}
                </div>
            </Sheet>
        </div>
    );
};
