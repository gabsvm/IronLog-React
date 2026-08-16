import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
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
    const { lang } = useApp();
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
                title={lang === 'es' ? 'Check-in post-entreno' : 'Post-workout check-in'}
                accent="primary"
                footer={<Button fullWidth onClick={skipAndFinish}>{lang === 'es' ? 'Finalizar' : 'Finish'}</Button>}
            >
                <div className="p-5 text-sm text-[rgb(var(--text-secondary))]">
                    {lang === 'es' ? 'No hay grupos musculares para valorar en esta sesión.' : 'There are no muscle groups to rate in this session.'}
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
            title={lang === 'es' ? 'Check-in post-entreno' : 'Post-workout check-in'}
            description={lang === 'es'
                ? 'Primero registra. Después evalúa cómo respondió el músculo.'
                : 'Log first. Then rate how the muscle responded.'}
            accent="primary"
            footer={
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={skipAndFinish}>
                            {lang === 'es' ? 'Omitir y finalizar' : 'Skip & finish'}
                        </Button>
                        <Button onClick={continueFlow} disabled={!currentComplete}>
                            {isLast
                                ? (lang === 'es' ? 'Guardar y finalizar' : 'Save & finish')
                                : (lang === 'es' ? 'Siguiente' : 'Next')}
                        </Button>
                    </div>
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() => setStep(prev => Math.max(0, prev - 1))}
                            className="min-h-10 w-full text-xs font-bold text-[rgb(var(--text-muted))]"
                        >
                            {lang === 'es' ? 'Volver al músculo anterior' : 'Back to previous muscle'}
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
                                    {lang === 'es' ? '¿Cómo quedó el músculo?' : 'How did the muscle feel?'}
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
                                {lang === 'es' ? '¿Cómo respondió tu rendimiento?' : 'How did your performance respond?'}
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
                                    ? (lang === 'es'
                                        ? 'Se guardará como feedback de la sesión. Un programa estructurado como KONG conserva su prescripción oficial.'
                                        : 'This is stored as session feedback. A structured program such as KONG keeps its official prescription.')
                                    : adjustment == null || adjustment === 0
                                        ? (lang === 'es' ? 'Volumen recomendado: mantener.' : 'Recommended volume: keep current level.')
                                        : adjustment > 0
                                            ? (lang === 'es' ? `Respuesta positiva: +${adjustment} serie(s) de ajuste futuro.` : `Positive response: +${adjustment} future adjustment set(s).`)
                                            : (lang === 'es' ? `Recuperación comprometida: ${adjustment} serie(s) de ajuste futuro.` : `Recovery limited: ${adjustment} future adjustment set(s).`)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Sheet>
    );
};