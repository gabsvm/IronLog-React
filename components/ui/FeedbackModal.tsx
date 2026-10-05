import { formatMessage } from '../../utils/i18n';
import React, { useMemo, useState } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { calculateVolumeAdjustment } from '../../utils';
import { useStore } from '../../lib/store';
import { Icon } from './Icon';

interface FeedbackModalProps {
    muscles: MuscleGroup[];
    onConfirm: (feedback: Record<string, { soreness: number, performance: number, adjustment: number }>) => void;
    onCancel: () => void;
}

type DraftFeedback = Record<string, { s: number | null; p: number | null }>;

/**
 * Post-workout RP check-in.
 *
 * Feedback used to be rendered as one large matrix for every trained muscle.
 * Keeping one muscle on screen at a time lowers cognitive load and, more
 * importantly, keeps adaptation feedback outside the set-logging surface.
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({ muscles, onConfirm, onCancel }) => {
    const { lang } = useAppPreferences();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];
    const uniqueMuscles = useMemo(() => Array.from(new Set(muscles.filter(m => m && m !== 'CARDIO'))) as MuscleGroup[], [muscles]);
    const [feedback, setFeedback] = useState<DraftFeedback>({});
    const [step, setStep] = useState(0);

    const currentMuscle = uniqueMuscles[Math.min(step, Math.max(0, uniqueMuscles.length - 1))];
    const current = currentMuscle ? feedback[currentMuscle] : undefined;
    const soreness = current?.s ?? null;
    const performance = current?.p ?? null;
    const currentComplete = soreness !== null && performance !== null;
    const isLast = step >= uniqueMuscles.length - 1;
    const isStructuredProgram = !!activeMeso?.programSystem;
    const adjustment = currentComplete && !isStructuredProgram
        ? calculateVolumeAdjustment(soreness!, performance!)
        : null;

    const handleInput = (type: 's' | 'p', value: number) => {
        if (!currentMuscle) return;
        setFeedback(prev => ({
            ...prev,
            [currentMuscle]: {
                ...(prev[currentMuscle] || { s: null, p: null }),
                [type]: value,
            },
        }));
    };

    const buildResult = () => {
        const result: Record<string, { soreness: number; performance: number; adjustment: number }> = {};
        uniqueMuscles.forEach(muscle => {
            const item = feedback[muscle];
            if (item?.s != null && item?.p != null) {
                result[muscle] = {
                    soreness: item.s,
                    performance: item.p,
                    adjustment: calculateVolumeAdjustment(item.s, item.p),
                };
            }
        });
        return result;
    };

    const continueFlow = () => {
        if (!currentComplete) return;
        if (isLast) {
            onConfirm(buildResult());
            return;
        }
        setStep(prev => Math.min(prev + 1, uniqueMuscles.length - 1));
    };

    const skipAndFinish = () => onConfirm({});

    if (uniqueMuscles.length === 0) {
        return (
            <Sheet
                open={true}
                onOpenChange={(open) => { if (!open) onCancel(); }}
                title={TRANSLATIONS[lang].copy.feedbackModal.postWorkoutCheckIn}
                accent="primary"
                footer={<Button fullWidth onClick={skipAndFinish}>{TRANSLATIONS[lang].copy.feedbackModal.finish}</Button>}
            >
                <div className="p-5 text-sm text-[rgb(var(--text-secondary))]">
                    {TRANSLATIONS[lang].copy.feedbackModal.thereAreNoMuscle}
                </div>
            </Sheet>
        );
    }

    const muscleLabel = (t.muscle as Record<string, string>)[currentMuscle] || currentMuscle;
    const progressPct = ((step + 1) / uniqueMuscles.length) * 100;

    const ChoiceRow = ({
        type,
        selected,
        values,
    }: {
        type: 's' | 'p';
        selected: number | null;
        values: Array<{ value: number; label: string; tone?: string }>;
    }) => (
        <div className="grid grid-cols-3 gap-2">
            {values.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInput(type, option.value)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-black transition-all active:scale-[0.98] ${
                        selected === option.value
                            ? `${option.tone || 'border-primary-500/40 bg-primary-500/12 text-primary-500'} shadow-sm`
                            : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    return (
        <Sheet
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={TRANSLATIONS[lang].copy.feedbackModal.postWorkoutCheckIn}
            description={TRANSLATIONS[lang].copy.feedbackModal.logFirstThenRate}
            accent="primary"
            footer={
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={skipAndFinish}>
                            {TRANSLATIONS[lang].copy.feedbackModal.skipFinish}
                        </Button>
                        <Button onClick={continueFlow} disabled={!currentComplete}>
                            {isLast
                                ? (TRANSLATIONS[lang].copy.feedbackModal.saveFinish)
                                : (TRANSLATIONS[lang].copy.feedbackModal.next)}
                        </Button>
                    </div>
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() => setStep(prev => Math.max(0, prev - 1))}
                            className="min-h-10 w-full text-xs font-bold text-[rgb(var(--text-muted))]"
                        >
                            {TRANSLATIONS[lang].copy.feedbackModal.backToPreviousMuscle}
                        </button>
                    )}
                </div>
            }
        >
            <div className="px-5 pb-6 pt-2">
                <div className="mb-5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-lg font-black text-[rgb(var(--text-primary))]">{muscleLabel}</span>
                            <span className="shrink-0 text-[10px] font-black tabular-nums text-[rgb(var(--text-muted))]">{step + 1}/{uniqueMuscles.length}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]">
                            <div className="h-full rounded-full bg-primary-500 transition-all duration-200" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <section>
                        <div className="mb-2 flex items-end justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-muted))]">{t.fb.sorenessLabel}</p>
                                <p className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">
                                    {TRANSLATIONS[lang].copy.feedbackModal.howDidTheMuscle}
                                </p>
                            </div>
                        </div>
                        <ChoiceRow
                            type="s"
                            selected={soreness}
                            values={[
                                { value: 1, label: String(t.fb.soreness[1]), tone: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500' },
                                { value: 2, label: String(t.fb.soreness[2]) },
                                { value: 3, label: String(t.fb.soreness[3]), tone: 'border-rose-500/35 bg-rose-500/10 text-rose-500' },
                            ]}
                        />
                    </section>

                    <section>
                        <div className="mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-muted))]">{t.fb.performanceLabel}</p>
                            <p className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">
                                {TRANSLATIONS[lang].copy.feedbackModal.howDidYourPerformance}
                            </p>
                        </div>
                        <ChoiceRow
                            type="p"
                            selected={performance}
                            values={[
                                { value: 3, label: String(t.fb.performance[3]), tone: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500' },
                                { value: 2, label: String(t.fb.performance[2]) },
                                { value: 1, label: String(t.fb.performance[1]), tone: 'border-rose-500/35 bg-rose-500/10 text-rose-500' },
                            ]}
                        />
                    </section>

                    {currentComplete && (
                        <div className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 py-3 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                            <Icon name={isStructuredProgram ? 'Info' : adjustment && adjustment !== 0 ? 'TrendingUp' : 'CheckCircle'} size={16} className="mt-0.5 shrink-0 text-primary-500" />
                            <span>
                                {isStructuredProgram
                                    ? (TRANSLATIONS[lang].copy.feedbackModal.thisIsStoredAs)
                                    : adjustment == null || adjustment === 0
                                        ? (TRANSLATIONS[lang].copy.feedbackModal.recommendedVolumeKeepCurrent)
                                        : adjustment > 0
                                            ? (formatMessage(TRANSLATIONS[lang].copy.feedbackModal.positiveResponseFutureAdjustment, { adjustment }))
                                            : (formatMessage(TRANSLATIONS[lang].copy.feedbackModal.recoveryLimitedFutureAdjustment, { adjustment }))}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Sheet>
    );
};