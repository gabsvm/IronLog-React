import React, { Suspense, useMemo, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MuscleTag } from '../ui/MuscleTag';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { resolveMuscleLabel } from '../../utils/muscle';
import type { GlobalTemplate, Lang, ProgramDay } from '../../types';

const GuidelinesModal = React.lazy(() =>
    import('../../views/home/GuidelinesModal').then(m => ({ default: m.GuidelinesModal }))
);

interface TemplateDayPreviewSheetProps {
    template: GlobalTemplate;
    lang: Lang;
    onClose: () => void;
    onStartNow: (template: GlobalTemplate) => void;
    onCustomize: (template: GlobalTemplate) => void;
}

export const TemplateDayPreviewSheet: React.FC<TemplateDayPreviewSheetProps> = ({
    template,
    lang,
    onClose,
    onStartNow,
    onCustomize,
}) => {
    const stages = template.stages && template.stages.length > 0 ? template.stages : null;
    const [selectedStageId, setSelectedStageId] = useState<string>(
        template.defaultStageId || stages?.[0]?.id || ''
    );
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [showRpGuide, setShowRpGuide] = useState(false);

    const activeProgram: ProgramDay[] = useMemo(() => {
        if (stages) {
            const st = stages.find((s) => s.id === selectedStageId) || stages[0];
            if (st?.program) return st.program;
        }
        return template.program || [];
    }, [stages, selectedStageId, template.program]);

    const safeDayIdx = Math.min(activeDayIdx, Math.max(0, activeProgram.length - 1));
    const currentDay = activeProgram[safeDayIdx];
    const resolvedTemplate: GlobalTemplate = useMemo(() => {
        if (!stages) return template;
        return {
            ...template,
            defaultStageId: selectedStageId,
            program: activeProgram,
        };
    }, [stages, selectedStageId, activeProgram, template]);

    return (
        <>
            <Sheet
                open={true}
                onOpenChange={(o) => { if (!o) onClose(); }}
                title={String(getTranslated(template.title, lang))}
                description={
                    template.description
                        ? String(getTranslated(template.description, lang))
                        : pickLang(lang, { es: 'Vista previa por día', en: 'Day-by-day preview' })
                }
                accent="primary"
                footer={
                    <div className="flex gap-2.5">
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => onCustomize(resolvedTemplate)}
                        >
                            {pickLang(lang, { es: 'Personalizar', en: 'Customize' })}
                        </Button>
                        <Button
                            fullWidth
                            data-testid="template-preview-start-btn"
                            onClick={() => onStartNow(resolvedTemplate)}
                        >
                            {pickLang(lang, { es: 'Iniciar plantilla', en: 'Start template' })}
                        </Button>
                    </div>
                }
            >
                <div className="p-4 space-y-4" data-testid="template-day-preview-sheet">
                    {template.guideId === 'rp_mpt' && (
                        <button
                            type="button"
                            onClick={() => setShowRpGuide(true)}
                            className="flex w-full items-center justify-between rounded-[8px] border border-primary-500/30 bg-primary-500/10 px-3.5 py-2.5 text-left transition-colors hover:bg-primary-500/15"
                        >
                            <div className="flex items-center gap-2.5">
                                <Icon name="BookOpen" size={16} className="text-primary-400 shrink-0" />
                                <span className="text-xs font-bold text-primary-300">
                                    {pickLang(lang, { es: 'Guía Nativa RP Periodization + Principios', en: 'Native RP Periodization + Principles Guide' })}
                                </span>
                            </div>
                            <Icon name="ChevronRight" size={15} className="text-primary-400" />
                        </button>
                    )}

                    {/* Optional multi-stage selector */}
                    {stages && stages.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                            {stages.map((st) => (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedStageId(st.id);
                                        setActiveDayIdx(0);
                                    }}
                                    className={`shrink-0 rounded-[6px] px-3 py-1.5 text-xs font-bold border transition-colors ${
                                        st.id === selectedStageId
                                            ? 'bg-primary-500 text-zinc-950 border-primary-500'
                                            : 'bg-surface-raised border-border-subtle text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {getTranslated(st.label, lang)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* RP Day Tabs (Mon / Tue / Thu / Fri / Day 1..N) */}
                    {activeProgram.length > 0 && (
                        <div className="flex gap-1.5 rounded-[8px] border border-border-subtle bg-surface-raised p-1 overflow-x-auto no-scrollbar">
                            {activeProgram.map((day, idx) => {
                                const isSel = idx === safeDayIdx;
                                const label = String(getTranslated(day.dayName, lang) || `${pickLang(lang, { es: 'Día', en: 'Day' })} ${idx + 1}`);
                                return (
                                    <button
                                        key={day.id || idx}
                                        type="button"
                                        onClick={() => setActiveDayIdx(idx)}
                                        className={`shrink-0 flex-1 min-w-[74px] rounded-[6px] px-3 py-1.5 text-xs font-bold transition-colors truncate ${
                                            isSel
                                                ? 'bg-white text-zinc-950 shadow-sm font-black'
                                                : 'text-zinc-400 hover:text-white hover:bg-surface-elevated'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Numbered Muscle Slots List for Selected Day */}
                    <div className="space-y-2">
                        {!currentDay || (currentDay.slots || []).length === 0 ? (
                            <p className="py-8 text-center text-xs text-zinc-500">
                                {pickLang(lang, { es: 'Día de descanso / sin slots configurados.', en: 'Rest day / no muscle slots configured.' })}
                            </p>
                        ) : (
                            (currentDay.slots || []).map((slot, sIdx) => (
                                <div
                                    key={sIdx}
                                    className="flex items-center justify-between gap-2.5 rounded-[8px] border border-border-subtle bg-surface-raised px-3 py-2.5"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-surface-base border border-border-subtle font-mono text-xs font-bold text-zinc-300">
                                            {sIdx + 1}
                                        </span>
                                        <MuscleTag
                                            label={resolveMuscleLabel(slot.muscle, lang)}
                                            muscle={slot.muscle}
                                            priority={sIdx === 0 ? 'emphasize' : 'grow'}
                                        />
                                        {slot.notes && (
                                            <span className="text-xs text-zinc-400 truncate">
                                                {slot.notes}
                                            </span>
                                        )}
                                    </div>
                                    <span className="shrink-0 rounded-[4px] border border-border-subtle bg-surface-base px-2 py-0.5 font-mono text-xs font-bold text-zinc-200 tabular-nums">
                                        {slot.setTarget || 3}{slot.reps ? ` × ${slot.reps}` : ''}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Sheet>

            {showRpGuide && (
                <Suspense fallback={null}>
                    <GuidelinesModal
                        isOpen={showRpGuide}
                        onClose={() => setShowRpGuide(false)}
                        guideId="rp_mpt"
                        lang={lang}
                    />
                </Suspense>
            )}
        </>
    );
};
