import { formatMessage } from '../utils/i18n';
import React, { useMemo, useState } from 'react';
import { Log } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
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

    // U8: share the summary as an image (PNG via canvas; native share sheet in the app).
    const [shareState, setShareState] = useState<'idle' | 'busy' | 'failed'>('idle');
    const volumeText = `${formatInteger(toDisplay(stats.volume, unit), lang)} ${unitLabel(unit).toLowerCase()}`;
    const handleShareImage = async () => {
        setShareState('busy');
        try {
            const { buildSessionCardModel, renderSessionCard } = await import('../utils/sessionCard');
            const c = TRANSLATIONS[lang].copy.sessionSummary;
            const model = buildSessionCardModel({
                log,
                labels: { workoutComplete: c.workoutComplete, time: c.time, sets: c.sets, totalVolume: c.totalVolume, musclesHit: c.musclesHit },
                locale: pickLang(lang, { es: 'es-AR', en: 'en-US' }),
                totals: stats,
                volumeText,
                exerciseName: (ex) => getTranslated(ex.name as any, lang) || String(ex.name ?? ''),
                bestSetText: (ex) => {
                    const done = (ex.sets || []).filter((s) => s.completed && !s.skipped && Number(s.weight) > 0);
                    if (done.length === 0) return null;
                    const best = done.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
                    return `${toDisplay(Number(best.weight), unit)} ${unitLabel(unit).toLowerCase()} × ${best.reps}`;
                },
            });
            const blob = await renderSessionCard(model);
            const day = new Date(log.endTime || Date.now()).toISOString().slice(0, 10);
            await shareFileOrDownload(blob, `gainslab-${day}.png`, 'image/png', model.title);
            setShareState('idle');
        } catch {
            setShareState('failed');
        }
    };

    const getSessionTypeBadge = () => {
        if (discipline === 'crossfit') {
            return {
                label: TRANSLATIONS[lang].copy.sessionSummary.wodFunctional,
                color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            };
        }
        if (discipline === 'calisthenics') {
            return {
                label: TRANSLATIONS[lang].copy.sessionSummary.calisthenicsSkill,
                color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            };
        }
        if (isDetached) {
            return {
                label: TRANSLATIONS[lang].copy.sessionSummary.freestyleSession,
                color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            };
        }
        return {
            label: formatMessage(TRANSLATIONS[lang].copy.sessionSummary.week, { week: log.week }),
            color: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
        };
    };

    const badge = getSessionTypeBadge();

    return (
        <div className="flex h-full flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))] expressive-reveal">
            <div className="flex-1 overflow-y-auto scroll-container px-4 py-5 sm:px-6">
                {/* Closing moment; no fabricated metrics or rewards. */}
                <section className="premium-summary-hero mx-auto w-full max-w-sm p-5 text-center">
                    <div className="premium-summary-medal mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full border border-primary-500/25 bg-primary-500/15 text-primary-500">
                        <Icon name="Trophy" size={36} />
                    </div>
                    <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border mb-2 ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                    <h1 className="text-[clamp(1.65rem,7vw,2.3rem)] font-black tracking-[-0.05em] text-[rgb(var(--text-primary))] leading-[1.08]">
                        {TRANSLATIONS[lang].copy.sessionSummary.workoutComplete}
                    </h1>
                    <p className="mt-2 text-[rgb(var(--text-secondary))] font-medium text-sm">
                        {log.name}
                    </p>
                </section>

                {/* Stats Grid */}
                <div className="mx-auto mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
                    <div className="premium-theme-panel tonal-1 flex min-h-[120px] flex-col items-center justify-center p-4 text-center">
                        <Icon name="Clock" size={18} className="text-blue-500 dark:text-blue-400 mb-1.5" />
                        <div className="text-2xl font-black tabular-nums tracking-tight text-[rgb(var(--text-primary))]">{formatDurationShort(log.duration)}</div>
                        <div className="mt-1 text-xs font-semibold text-muted">
                            {TRANSLATIONS[lang].copy.sessionSummary.time}
                        </div>
                    </div>

                    <div className="premium-theme-panel tonal-2 flex min-h-[120px] flex-col items-center justify-center p-4 text-center">
                        <Icon name="CheckCircle" size={18} className="text-green-500 dark:text-green-400 mb-1.5" />
                        <div className="text-2xl font-black tabular-nums tracking-tight text-[rgb(var(--text-primary))]">{stats.sets}</div>
                        <div className="mt-1 text-xs font-semibold text-muted">
                            {TRANSLATIONS[lang].copy.sessionSummary.sets}
                        </div>
                    </div>

                    <div className="premium-theme-panel tonal-3 col-span-2 flex min-h-[130px] flex-col items-center justify-center p-4 text-center">
                        <Icon name="Dumbbell" size={18} className="text-amber-500 dark:text-amber-400 mb-1.5" />
                        <div className="text-2xl font-black tabular-nums tracking-tight text-[rgb(var(--text-primary))]">{formatInteger(toDisplay(stats.volume, unit), lang)} {unitLabel(unit).toLowerCase()}</div>
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
            <div className="p-4 bg-[rgb(var(--surface-app))] pb-[var(--safe-area-bottom)] border-t border-[rgb(var(--border-subtle)/0.4)]">
                {shareState === 'failed' && (
                    <p role="alert" className="mb-2 text-center text-xs font-bold text-red-500">{TRANSLATIONS[lang].copy.sessionSummary.shareImageFailed}</p>
                )}
                <button
                    type="button"
                    onClick={() => void handleShareImage()}
                    disabled={shareState === 'busy'}
                    className="expressive-press mb-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-sm font-bold text-[rgb(var(--text-primary))] disabled:opacity-60"
                >
                    <Icon name="Share2" size={16} />
                    {shareState === 'busy' ? TRANSLATIONS[lang].copy.sessionSummary.shareImageBusy : TRANSLATIONS[lang].copy.sessionSummary.shareImage}
                </button>
                <Button fullWidth onClick={onClose} className="h-12 text-base font-bold">
                    {TRANSLATIONS[lang].copy.sessionSummary.finishGoHome}
                </Button>
            </div>
        </div>
    );
};
