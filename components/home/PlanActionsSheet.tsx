import React from 'react';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { TRANSLATIONS } from '../../constants';

interface PlanActionsSheetProps {
    open: boolean;
    onClose: () => void;
    lang: 'en' | 'es';
    onConfigure: () => void;
    onEditProgram: () => void;
    onChangeTemplate?: () => void;
}

const ActionRow = ({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-sm font-medium text-[rgb(var(--text-primary))]"
    >
        <Icon name={icon} size={18} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1">{title}</span>
        <Icon name="ChevronRight" size={16} className="shrink-0 text-muted" />
    </button>
);

// Opened from Hoy's plan header, which already shows the plan name and week.
export const PlanActionsSheet: React.FC<PlanActionsSheetProps> = ({
    open,
    onClose,
    lang,
    onConfigure,
    onEditProgram,
    onChangeTemplate,
}) => {
    const p = TRANSLATIONS[lang].planActions;
    return (
    <Sheet
        open={open}
        onOpenChange={(next) => { if (!next) onClose(); }}
        title={p.title}
        accent="primary"
    >
        <div className="px-4 pb-8 pt-2">
            <div className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden">
                <ActionRow icon="Settings" title={p.configureTitle} onClick={onConfigure} />
                <ActionRow icon="Edit" title={p.editTitle} onClick={onEditProgram} />
                {onChangeTemplate && <ActionRow icon="Layers" title={p.changeTemplateTitle} onClick={onChangeTemplate} />}
            </div>
        </div>
    </Sheet>
    );
};
