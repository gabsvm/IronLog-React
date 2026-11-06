import React, { useState } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { roundWeight } from '../../utils';
import { toDisplay, unitLabel } from '../../utils/units';
import type { WeightUnit } from '../../types';

export interface WarmupModalProps {
    targetWeight: number;
    exerciseName: string;
    onClose: () => void;
    /** Display unit (stored values are kg). */
    unit?: WeightUnit;
    onInjectWarmup?: () => void;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({
    targetWeight,
    exerciseName,
    onClose,
    unit = 'kg',
    onInjectWarmup,
}) => {
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
        { pct: 0.5, reps: "10-12", label: t.warmupSets.light, pctBadge: "50%" },
        { pct: 0.75, reps: "4-6", label: t.warmupSets.moderate, pctBadge: "75%" },
        { pct: 0.90, reps: "1", label: t.warmupSets.potentiation, pctBadge: "90%" }
    ];

    if (!targetWeight || targetWeight <= 0) {
        return (
            <Sheet
                open={true}
                onOpenChange={(o) => { if (!o) onClose(); }}
                title={t.warmupTitle}
                accent="primary"
            >
                <div className="p-6 text-center space-y-4">
                    <Icon name="CloudOff" size={48} className="mx-auto text-zinc-300" />
                    <p className="text-sm text-zinc-500">
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
                <div className="space-y-2 w-full">
                    {onInjectWarmup && (
                        <button
                            type="button"
                            onClick={() => {
                                onInjectWarmup();
                                onClose();
                            }}
                            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-blue-500/30 bg-blue-500/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-300 transition-colors hover:bg-blue-500/30 active:bg-blue-500/40"
                        >
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border border-blue-500/40 bg-blue-500/30 text-[9px] font-black text-blue-200">
                                W
                            </span>
                            <span>{t.cardMenu?.addWarmup || 'Añadir series al ejercicio'}</span>
                        </button>
                    )}
                    <Button onClick={onClose} fullWidth size="lg">
                        {t.close}
                    </Button>
                </div>
            }
        >
            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-blue-500/30 bg-blue-500/20 text-[10px] font-extrabold text-blue-300">
                            W
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">
                            {t.warmupTitle}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-semibold text-muted">{t.workingWeight}</div>
                        <div className="text-xl font-mono font-bold text-zinc-900 dark:text-white">{toDisplay(targetWeight, unit)}</div>
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
                                className={`expressive-press flex w-full min-h-14 items-center rounded-[8px] border p-3.5 text-left transition-colors ${
                                    isChecked
                                        ? 'bg-primary-500/10 border-primary-500/40'
                                        : 'bg-[rgb(var(--surface-raised))] border-[rgb(var(--border-subtle))] hover:bg-[rgb(var(--surface-elevated))]'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-[4px] border-2 flex items-center justify-center mr-3.5 shrink-0 transition-colors duration-fast ease-natural ${isChecked ? 'bg-primary-500 border-primary-500 text-black' : 'border-zinc-500/50'}`}>
                                    {isChecked && <Icon name="Check" size={14} strokeWidth={3} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm font-bold ${isChecked ? 'text-primary-400' : 'text-zinc-200'}`}>
                                            {weight} <span className="text-[10px] text-zinc-400">{weightSuffix}</span>
                                        </span>
                                        <span className={`font-mono font-bold text-sm ${isChecked ? 'text-primary-400' : 'text-white'}`}>
                                            {step.reps} <span className="text-[10px] text-zinc-400">REPS</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                                        <span className="rounded-[4px] border border-blue-500/30 bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                                            {step.pctBadge}
                                        </span>
                                        <span>{step.label}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="text-xs text-zinc-400 italic text-center px-4 leading-relaxed">
                    {TRANSLATIONS[lang].copy.warmupModal.performTheseSetsTo}
                </p>
            </div>
        </Sheet>
    );
};
