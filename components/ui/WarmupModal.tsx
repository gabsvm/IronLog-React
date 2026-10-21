import React, { useState } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { roundWeight } from '../../utils';
import { toDisplay, unitLabel } from '../../utils/units';
import type { WeightUnit } from '../../types';

interface WarmupModalProps {
    targetWeight: number;
    exerciseName: string;
    onClose: () => void;
    /** Display unit (stored values are kg). */
    unit?: WeightUnit;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({ targetWeight, exerciseName, onClose, unit = 'kg' }) => {
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];
    const weightSuffix = unitLabel(unit);
    const [checked, setChecked] = useState<number[]>([]);

    const toggleCheck = (idx: number) => {
        if (checked.includes(idx)) setChecked(checked.filter(i => i !== idx));
        else setChecked([...checked, idx]);
    };

    // RP Style Warmup Logic (Chapter 3 of PDF)
    // 1. Light: ~50% for 10-12 reps (or 20RM)
    // 2. Moderate: ~75% for 4-6 reps
    // 3. Potentiation: ~90% for 1-2 reps
    const steps = [
        { pct: 0.5, reps: "10-12", label: t.warmupSets.light },
        { pct: 0.75, reps: "4-6", label: t.warmupSets.moderate },
        { pct: 0.90, reps: "1", label: t.warmupSets.potentiation }
    ];

    if (!targetWeight || targetWeight <= 0) {
        return (
            <Sheet
                open={true}
                onOpenChange={(o) => { if (!o) onClose(); }}
                title={t.warmupTitle}
                accent="primary"
            >
                <div className="space-y-4 p-6 text-center">
                    <Icon name="CloudOff" size={48} className="mx-auto text-muted" />
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                        {t.warmupRequiresWeight}
                    </p>
                    <Button onClick={onClose} fullWidth>{t.close}</Button>
                </div>
            </Sheet>
        );
    }

    return (
        <Sheet
            open={true}
            onOpenChange={(o) => { if (!o) onClose(); }}
            title={exerciseName}
            description={`${t.warmupTitle} for ${exerciseName}`}
            accent="primary"
            footer={
                <Button onClick={onClose} fullWidth size="lg">
                    {t.close}
                </Button>
            }
        >
            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="text-xs font-semibold text-primary-500 flex items-center gap-1">
                        <Icon name="Zap" size={10} /> {t.warmupTitle}
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-semibold text-muted">{t.workingWeight}</div>
                        <div className="gl-num text-xl font-bold text-[rgb(var(--text-primary))]">{toDisplay(targetWeight, unit)}</div>
                    </div>
                </div>

                <div className="space-y-3">
                    {steps.map((step, idx) => {
                        const weight = toDisplay(roundWeight(targetWeight * step.pct), unit);
                        const isChecked = checked.includes(idx);

                        return (
                            <button
                                key={idx}
                                onClick={() => toggleCheck(idx)}
                                aria-pressed={isChecked}
                                aria-label={`${step.label} — ${weight} ${weightSuffix.toLowerCase()}, ${step.reps} reps`}
                                className={`flex min-h-[56px] w-full items-center rounded-2xl border border-[rgb(var(--border-subtle))] p-3 text-left transition-colors
                                    ${isChecked
                                        ? 'bg-primary-500/10'
                                        : 'bg-[rgb(var(--surface-elevated)/0.5)]'
                                    }
                                `}
                            >
                            <div className={`mr-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isChecked ? 'border-primary-500 bg-primary-500 text-black' : 'border-[rgb(var(--border-strong))]'}`}>
                                    {isChecked && <Icon name="Check" size={14} strokeWidth={3} />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-sm font-bold ${isChecked ? 'text-primary-500' : 'text-[rgb(var(--text-secondary))]'}`}>
                                            {weight} <span className="text-xs text-muted">{weightSuffix}</span>
                                        </span>
                                        <span className={`gl-num text-sm font-bold ${isChecked ? 'text-primary-500' : 'text-[rgb(var(--text-primary))]'}`}>
                                            {step.reps} <span className="text-xs text-muted">REPS</span>
                                        </span>
                                    </div>
                                    <div className="text-xs font-semibold text-muted">{step.label}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="px-4 text-center text-xs italic leading-relaxed text-muted">
                    {TRANSLATIONS[lang].copy.warmupModal.performTheseSetsTo}
                </p>
            </div>
        </Sheet>
    );
};
