import React, { useState, useMemo, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MuscleTag } from '../ui/MuscleTag';
import { TRANSLATIONS } from '../../constants';
import type { Lang, MuscleGroup, MusclePriorityLevel } from '../../types';
import { pickLang } from '../../utils/i18n';
import { resolveMuscleLabel } from '../../utils/muscle';

const PRIORITY_ORDER: MusclePriorityLevel[] = ['maintain', 'grow', 'emphasize'];

const PRIORITY_LABELS: Record<MusclePriorityLevel, { es: string; en: string }> = {
    emphasize: { es: 'Enfatizar', en: 'Emphasize' },
    grow: { es: 'Crecer', en: 'Grow' },
    maintain: { es: 'Mantener', en: 'Maintain' },
};

interface MusclePrioritiesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    muscles: MuscleGroup[];
    initialPriorities?: Partial<Record<MuscleGroup, MusclePriorityLevel>>;
    onSave: (priorities: Partial<Record<MuscleGroup, MusclePriorityLevel>>) => void;
    lang: Lang;
}

export const MusclePrioritiesSheet: React.FC<MusclePrioritiesSheetProps> = ({
    open,
    onOpenChange,
    muscles,
    initialPriorities,
    onSave,
    lang,
}) => {
    const t = TRANSLATIONS[lang];
    const uniqueMuscles = useMemo(() => {
        const list = Array.from(new Set(muscles.filter((m) => m && m !== 'CARDIO')));
        return list;
    }, [muscles]);

    const [draft, setDraft] = useState<Partial<Record<MuscleGroup, MusclePriorityLevel>>>(() => ({
        ...(initialPriorities || {}),
    }));

    useEffect(() => {
        if (open) {
            setDraft({ ...(initialPriorities || {}) });
        }
    }, [open, initialPriorities]);

    const stepPriority = (muscle: MuscleGroup, delta: -1 | 1) => {
        setDraft((prev) => {
            const current: MusclePriorityLevel = prev[muscle] || 'grow';
            const idx = PRIORITY_ORDER.indexOf(current);
            const nextIdx = Math.max(0, Math.min(PRIORITY_ORDER.length - 1, idx + delta));
            return { ...prev, [muscle]: PRIORITY_ORDER[nextIdx] };
        });
    };

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={pickLang(lang, { es: 'Prioridades musculares', en: 'Muscle priorities' })}
            description={pickLang(lang, {
                es: 'Ajusta el foco de volumen para cada grupo muscular en este mesociclo',
                en: 'Adjust volume focus for each muscle group in this mesocycle',
            })}
            accent="primary"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => onOpenChange(false)}>
                        {t.cancel}
                    </Button>
                    <Button
                        fullWidth
                        onClick={() => {
                            onSave(draft);
                            onOpenChange(false);
                        }}
                    >
                        {pickLang(lang, { es: 'Guardar', en: 'Save' })}
                    </Button>
                </div>
            }
        >
            <div className="p-4 space-y-2.5" data-testid="muscle-priorities-sheet">
                {uniqueMuscles.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-400">
                        {pickLang(lang, { es: 'Sin grupos musculares activos.', en: 'No active muscle groups.' })}
                    </p>
                ) : (
                    uniqueMuscles.map((muscle) => {
                        const level: MusclePriorityLevel = draft[muscle] || 'grow';
                        const idx = PRIORITY_ORDER.indexOf(level);
                        return (
                            <div
                                key={muscle}
                                data-testid={`priority-row-${muscle}`}
                                className="flex items-center justify-between gap-3 rounded-[8px] border border-border-subtle bg-surface-raised px-3.5 py-3"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="text-sm font-bold text-white truncate">
                                        {resolveMuscleLabel(muscle, lang)}
                                    </div>
                                    <MuscleTag
                                        label={pickLang(lang, PRIORITY_LABELS[level])}
                                        muscle={muscle}
                                        priority={level}
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        disabled={idx <= 0}
                                        onClick={() => stepPriority(muscle, -1)}
                                        aria-label={pickLang(lang, {
                                            es: `Reducir prioridad de ${resolveMuscleLabel(muscle, lang)}`,
                                            en: `Decrease priority for ${resolveMuscleLabel(muscle, lang)}`,
                                        })}
                                        className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-border-subtle bg-surface-base text-zinc-300 hover:text-white disabled:opacity-30 active:scale-95 transition-all"
                                    >
                                        <Icon name="ArrowDown" size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={idx >= PRIORITY_ORDER.length - 1}
                                        onClick={() => stepPriority(muscle, 1)}
                                        aria-label={pickLang(lang, {
                                            es: `Subir prioridad de ${resolveMuscleLabel(muscle, lang)}`,
                                            en: `Increase priority for ${resolveMuscleLabel(muscle, lang)}`,
                                        })}
                                        className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-border-subtle bg-surface-base text-zinc-300 hover:text-white disabled:opacity-30 active:scale-95 transition-all"
                                    >
                                        <Icon name="ArrowUp" size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Sheet>
    );
};
