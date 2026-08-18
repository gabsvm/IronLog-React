import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { calculateVolumeAdjustment } from '../../utils';
import { useStore } from '../../lib/store';
import { Icon } from './Icon';

interface FeedbackPayload {
    soreness: number;
    performance: number;
    adjustment: number;
    stimulus?: number;
    recovery?: number;
    jointPain?: boolean;
}

interface FeedbackModalProps {
    muscles: MuscleGroup[];
    onConfirm: (feedback: Record<string, FeedbackPayload>) => void;
    onCancel: () => void;
}

type DraftFeedback = Record<string, {
    recovery: number | null;
    performance: number | null;
    stimulus: number | null;
    jointPain: boolean;
}>;

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ muscles, onConfirm, onCancel }) => {
    const { lang } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const activeSession = useStore(state => state.activeSession);
    const t = TRANSLATIONS[lang];
    const uniqueMuscles = useMemo(() => Array.from(new Set(muscles.filter(m => m && m !== 'CARDIO'))) as MuscleGroup[], [muscles]);
    const [feedback, setFeedback] = useState<DraftFeedback>({});
    const [step, setStep] = useState(0);

    const currentMuscle = uniqueMuscles[Math.min(step, Math.max(0, uniqueMuscles.length - 1))];
    const current = currentMuscle ? feedback[currentMuscle] : undefined;
    const recovery = current?.recovery ?? null;
    const performance = current?.performance ?? null;
    const stimulus = current?.stimulus ?? null;
    const jointPain = current?.jointPain ?? false;
    const currentComplete = recovery !== null && performance !== null && stimulus !== null;
    const isLast = step >= uniqueMuscles.length - 1;
    const remainingMuscles = Math.max(0, uniqueMuscles.length - step - 1);
    // A structured program only owns feedback when the session actually belongs
    // to that active program. Detached/freestyle work while KONG is active must
    // not inherit KONG's "fixed prescription" behavior by accident.
    const isStructuredProgram = !!activeMeso?.programSystem && activeSession?.mesoId === activeMeso.id;

    const updateCurrent = (patch: Partial<DraftFeedback[string]>) => {
        if (!currentMuscle) return;
        setFeedback(prev => ({
            ...prev,
            [currentMuscle]: {
                recovery: prev[currentMuscle]?.recovery ?? null,
                performance: prev[currentMuscle]?.performance ?? null,
                stimulus: prev[currentMuscle]?.stimulus ?? null,
                jointPain: prev[currentMuscle]?.jointPain ?? false,
                ...patch,
            },
        }));
    };

    const rawAdjustment = currentComplete ? calculateVolumeAdjustment(recovery!, performance!) : null;
    const displayedAdjustment = rawAdjustment == null
        ? null
        : isStructuredProgram
            ? 0
            : jointPain
                ? Math.min(rawAdjustment, 0)
                : rawAdjustment;

    const buildResult = (source: DraftFeedback = feedback) => {
        const result: Record<string, FeedbackPayload> = {};
        uniqueMuscles.forEach(muscle => {
            const item = source[muscle];
            if (item?.recovery == null || item?.performance == null || item?.stimulus == null) return;
            const base = calculateVolumeAdjustment(item.recovery, item.performance);
            const adjustment = isStructuredProgram ? 0 : item.jointPain ? Math.min(base, 0) : base;
            result[muscle] = {
                soreness: item.recovery,
                recovery: item.recovery,
                performance: item.performance,
                stimulus: item.stimulus,
                jointPain: item.jointPain,
                adjustment,
            };
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

    const applyToRemainingAndFinish = () => {
        if (!currentComplete || !currentMuscle || isLast) return;
        const seed = {
            recovery,
            performance,
            stimulus,
            jointPain,
        } as DraftFeedback[string];
        const nextDraft: DraftFeedback = { ...feedback, [currentMuscle]: seed };
        uniqueMuscles.slice(step + 1).forEach(muscle => {
            // Pain is deliberately NOT copied to other muscles. The fast path only
            // duplicates the subjective performance/stimulus/recovery ratings.
            nextDraft[muscle] = { ...seed, jointPain: false };
        });
        onConfirm(buildResult(nextDraft));
    };

    const skipAndFinish = () => onConfirm({});

    if (uniqueMuscles.length === 0) {
        return (
            <Sheet open={true} onOpenChange={(open) => { if (!open) onCancel(); }} title={lang === 'es' ? 'Check-in post-entreno' : 'Post-workout check-in'} accent="primary" footer={<Button fullWidth onClick={skipAndFinish}>{lang === 'es' ? 'Finalizar' : 'Finish'}</Button>}>
                <div className="p-5 text-sm text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'No hay grupos musculares para valorar en esta sesión.' : 'There are no muscle groups to rate in this session.'}</div>
            </Sheet>
        );
    }

    const muscleLabel = (t.muscle as Record<string, string>)[currentMuscle] || currentMuscle;
    const progressPct = ((step + 1) / uniqueMuscles.length) * 100;

    const ChoiceRow = ({ value, onChange, items }: {
        value: number | null;
        onChange: (value: number) => void;
        items: Array<{ value: number; label: string; tone?: string }>;
    }) => (
        <div className="grid grid-cols-3 gap-2">
            {items.map(item => (
                <button
                    key={item.value}
                    type="button"
                    onClick={() => onChange(item.value)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-black transition-all active:scale-[0.98] ${value === item.value ? `${item.tone || 'border-primary-500/40 bg-primary-500/10 text-primary-500'}` : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'}`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );

    const explanation = (() => {
        if (!currentComplete) return null;
        if (isStructuredProgram) return lang === 'es'
            ? 'Se registra tu respuesta, pero este programa mantiene su receta oficial. No se modifica KONG ni su progresión.'
            : 'Your response is recorded, but this structured program keeps its official prescription. KONG and its progression are not modified.';
        if (jointPain) return lang === 'es'
            ? 'Marcaste molestia articular: GainsLab no aumentará automáticamente el volumen de este músculo a partir de este check-in.'
            : 'You flagged joint discomfort: GainsLab will not automatically increase volume for this muscle from this check-in.';
        if (displayedAdjustment === 0) return lang === 'es'
            ? 'Mantener volumen: tu recuperación y rendimiento no justifican un cambio automático.'
            : 'Keep volume: recovery and performance do not justify an automatic change.';
        if ((displayedAdjustment || 0) > 0) return lang === 'es'
            ? `Ajuste futuro: +${displayedAdjustment} serie(s). Buena recuperación con rendimiento estable o mejor.`
            : `Future adjustment: +${displayedAdjustment} set(s). Good recovery with stable or improved performance.`;
        return lang === 'es'
            ? `Ajuste futuro: ${displayedAdjustment} serie(s). La recuperación sugiere bajar carga de trabajo.`
            : `Future adjustment: ${displayedAdjustment} set(s). Recovery suggests reducing workload.`;
    })();

    return (
        <Sheet
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={lang === 'es' ? 'Check-in post-entreno' : 'Post-workout check-in'}
            description={lang === 'es' ? 'Rendimiento, estímulo y recuperación. Solo después de entrenar.' : 'Performance, stimulus and recovery. Only after training.'}
            accent="primary"
            footer={
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={skipAndFinish}>{lang === 'es' ? 'Omitir' : 'Skip'}</Button>
                        <Button onClick={continueFlow} disabled={!currentComplete}>{isLast ? (lang === 'es' ? 'Guardar y finalizar' : 'Save & finish') : (lang === 'es' ? 'Siguiente' : 'Next')}</Button>
                    </div>
                    {!isLast && currentComplete && (
                        <button
                            type="button"
                            onClick={applyToRemainingAndFinish}
                            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/[0.06] px-3 text-xs font-black text-primary-500 active:scale-[0.99]"
                        >
                            {lang === 'es' ? `Aplicar al resto (${remainingMuscles}) y finalizar` : `Apply to remaining (${remainingMuscles}) & finish`}
                        </button>
                    )}
                    {step > 0 && <button type="button" onClick={() => setStep(prev => Math.max(0, prev - 1))} className="min-h-10 w-full text-xs font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Volver al músculo anterior' : 'Back to previous muscle'}</button>}
                </div>
            }
        >
            <div className="px-5 pb-6 pt-2">
                <div className="mb-5">
                    <div className="flex items-center justify-between gap-3"><span className="truncate text-lg font-black">{muscleLabel}</span><span className="text-[10px] font-black tabular-nums text-[rgb(var(--text-muted))]">{step + 1}/{uniqueMuscles.length}</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]"><div className="h-full rounded-full bg-primary-500 transition-all duration-200" style={{ width: `${progressPct}%` }} /></div>
                </div>

                <div className="space-y-5">
                    <section>
                        <div className="mb-2"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Rendimiento' : 'Performance'}</p><p className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">{lang === 'es' ? '¿Cómo rendiste frente a lo esperado?' : 'How did you perform versus expectation?'}</p></div>
                        <ChoiceRow value={performance} onChange={value => updateCurrent({ performance: value })} items={[{ value: 1, label: lang === 'es' ? 'Peor' : 'Worse', tone: 'border-rose-500/35 bg-rose-500/10 text-rose-500' }, { value: 2, label: lang === 'es' ? 'Igual' : 'Same' }, { value: 3, label: lang === 'es' ? 'Mejor' : 'Better', tone: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500' }]} />
                    </section>

                    <section>
                        <div className="mb-2"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Estímulo / Pump' : 'Stimulus / Pump'}</p><p className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">{lang === 'es' ? '¿El músculo recibió un estímulo claro?' : 'Did the muscle receive a clear stimulus?'}</p></div>
                        <ChoiceRow value={stimulus} onChange={value => updateCurrent({ stimulus: value })} items={[{ value: 1, label: lang === 'es' ? 'Bajo' : 'Low' }, { value: 2, label: lang === 'es' ? 'Bueno' : 'Good', tone: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500' }, { value: 3, label: lang === 'es' ? 'Excesivo' : 'Excessive', tone: 'border-amber-500/35 bg-amber-500/10 text-amber-500' }]} />
                    </section>

                    <section>
                        <div className="mb-2"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Recuperación' : 'Recovery'}</p><p className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">{lang === 'es' ? '¿Cómo llegó el músculo a esta sesión?' : 'How recovered was the muscle entering this session?'}</p></div>
                        <ChoiceRow value={recovery} onChange={value => updateCurrent({ recovery: value })} items={[{ value: 1, label: lang === 'es' ? 'Fresco' : 'Fresh', tone: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500' }, { value: 2, label: lang === 'es' ? 'Adecuada' : 'Adequate' }, { value: 3, label: lang === 'es' ? 'Muy cargado' : 'Very sore', tone: 'border-rose-500/35 bg-rose-500/10 text-rose-500' }]} />
                    </section>

                    <button type="button" onClick={() => updateCurrent({ jointPain: !jointPain })} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left ${jointPain ? 'border-amber-500/30 bg-amber-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))]'}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${jointPain ? 'bg-amber-500/15 text-amber-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}><Icon name="AlertTriangle" size={16} /></span>
                        <span className="min-w-0 flex-1"><span className="block text-xs font-black">{lang === 'es' ? 'Molestia articular durante el ejercicio' : 'Joint discomfort during the exercise'}</span><span className="mt-0.5 block text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Registra la señal y evita aumentos automáticos de volumen.' : 'Record the signal and prevent automatic volume increases.'}</span></span>
                        <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${jointPain ? 'bg-amber-500' : 'bg-[rgb(var(--surface-elevated))]'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${jointPain ? 'translate-x-4' : ''}`} /></span>
                    </button>

                    {explanation && <div className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 py-3 text-xs leading-relaxed text-[rgb(var(--text-secondary))]"><Icon name={isStructuredProgram ? 'Shield' : displayedAdjustment && displayedAdjustment !== 0 ? 'TrendingUp' : 'CheckCircle'} size={16} className="mt-0.5 shrink-0 text-primary-500" /><span>{explanation}</span></div>}
                </div>
            </div>
        </Sheet>
    );
};
