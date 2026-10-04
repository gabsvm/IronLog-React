import React from 'react';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { TRANSLATIONS } from '../../constants';

interface PlanActionsSheetProps {
    open: boolean;
    onClose: () => void;
    lang: 'en' | 'es';
    planName?: string;
    week?: number;
    totalWeeks?: number;
    onConfigure: () => void;
    onEditProgram: () => void;
}

const ActionRow = ({
    icon,
    title,
    description,
    onClick,
}: {
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-left transition-all active:scale-[0.985] dark:border-white/5 dark:bg-white/[0.025]"
    >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Icon name={icon} size={19} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-zinc-950 dark:text-white">{title}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{description}</span>
        </span>
        <Icon name="ChevronRight" size={17} className="shrink-0 text-zinc-400" />
    </button>
);

export const PlanActionsSheet: React.FC<PlanActionsSheetProps> = ({
    open,
    onClose,
    lang,
    planName,
    week,
    totalWeeks,
    onConfigure,
    onEditProgram,
}) => {
    const t = TRANSLATIONS[lang];
    const p = t.planActions;
    return (
    <Sheet
        open={open}
        onOpenChange={(next) => { if (!next) onClose(); }}
        title={p.title}
        accent="primary"
    >
        <div className="px-5 pb-8 pt-2">
            <div className="mb-5 rounded-2xl border border-primary-500/15 bg-primary-500/[0.06] p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">
                    {t.currentPlan}
                </div>
                <div className="mt-1 truncate text-base font-black text-zinc-950 dark:text-white">
                    {planName || p.activeFallback}
                </div>
                {!!week && (
                    <div className="mt-1 text-xs font-medium text-zinc-500">
                        {`${p.weekOf} ${week}${totalWeeks ? ` ${p.ofWord} ${totalWeeks}` : ''}`}
                    </div>
                )}
            </div>

            <div className="space-y-2.5">
                <ActionRow
                    icon="Settings"
                    title={p.configureTitle}
                    description={p.configureDesc}
                    onClick={onConfigure}
                />
                <ActionRow
                    icon="Edit"
                    title={p.editTitle}
                    description={p.editDesc}
                    onClick={onEditProgram}
                />
            </div>
        </div>
    </Sheet>
    );
};
