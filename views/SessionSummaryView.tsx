import { formatMessage } from '../utils/i18n';
import React, { useMemo, useState } from 'react';
import { Log } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';
import { resolveWeightUnit, toDisplay, unitLabel } from '../utils/units';
import { TRANSLATIONS } from '../constants/translations';
import { getTranslated } from '../utils';
import { shareFileOrDownload } from '../utils/shareFile';
import { pickLang } from '../utils/i18n';

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
            if (ex.muscle && ex.muscle !== 'CARDIO') {
                muscles.add(ex.muscle);
            }
            (ex.sets || []).forEach(s => {
                if (s.completed && !s.skipped) {
                    sets++;
                    volume += getSetLoadVolume(s, ex, logBodyWeight);
                }
            });
        });

        return { volume, sets, muscles: Array.from(muscles) };
    }, [log, userProfile?.bodyWeight]);

    // U8: share the summary as an image (PNG via canvas; native share sheet in the app).
    const [shareState, setShareState] = useState<'idle' | 'busy' | 'failed'>('idle');
    const volumeText = `${toDisplay(stats.volume, unit).toLocaleString()} ${unitLabel(unit).toLowerCase()}`;
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

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
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
        if (discipline === 'twoblock') {
            return {
                label: 'Two Block Mass',
                color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
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
        <div className="flex flex-col h-full bg-[rgb(var(--surface-app))] text-zinc-900 dark:text-white animate-in fade-in duration-200">
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 overflow-y-auto">
                {/* Header with restrained trophy animation */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/10 text-primary-400 mb-2 border border-primary-500/20 shadow-lg shadow-primary-500/10 animate-in zoom-in-75 duration-300">
                        <Icon name="Trophy" size={36} />
                    </div>
                    <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border mb-2 ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 dark:text-white leading-tight">
                        {TRANSLATIONS[lang].copy.sessionSummary.workoutComplete}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
                        {log.name}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-[rgb(var(--surface-raised))] shadow-sm">
                        <Icon name="Clock" size={18} className="text-blue-500 dark:text-blue-400 mb-1.5" />
                        <div className="text-xl font-black">{formatDuration(log.duration)}</div>
                        <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            {TRANSLATIONS[lang].copy.sessionSummary.time}
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-[rgb(var(--surface-raised))] shadow-sm">
                        <Icon name="CheckCircle" size={18} className="text-green-500 dark:text-green-400 mb-1.5" />
                        <div className="text-xl font-black">{stats.sets}</div>
                        <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            {TRANSLATIONS[lang].copy.sessionSummary.sets}
                        </div>
                    </div>

                    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-[rgb(var(--surface-raised))] shadow-sm">
                        <Icon name="Dumbbell" size={18} className="text-amber-500 dark:text-amber-400 mb-1.5" />
                        <div className="text-xl font-black">{toDisplay(stats.volume, unit).toLocaleString()} {unitLabel(unit).toLowerCase()}</div>
                        <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            {TRANSLATIONS[lang].copy.sessionSummary.totalVolume}
                        </div>
                    </div>
                </div>

                {/* Muscles Hit */}
                {stats.muscles.length > 0 && (
                    <div className="w-full max-w-sm">
                        <p className="text-center text-[11px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                            {TRANSLATIONS[lang].copy.sessionSummary.musclesHit}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {stats.muscles.map(m => (
                                <span key={m} className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 rounded-full text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
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
                    className="mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border-subtle))] text-sm font-bold text-[rgb(var(--text-secondary))] disabled:opacity-60"
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
