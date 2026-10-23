import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { consumeModalHistory } from '../ui/useModalLayer';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';

interface Props {
    open: boolean;
    onClose: () => void;
    lang: 'en' | 'es';
    onResume: () => void;
    onToday: () => void;
    onFreestyle: () => void;
    onEditProgram: () => void;
}

const Row = ({ icon, title, description, badge, primary, onClick }: {
    icon: string;
    title: string;
    description?: string;
    badge?: string;
    primary?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex w-full min-h-[52px] items-center gap-3 rounded-2xl border p-3.5 text-left transition-transform active:scale-[0.985] ${primary ? 'border-primary-500/20 bg-primary-500/[0.07]' : 'border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-raised)/0.72)]'}`}
    >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-primary-500 text-black' : 'bg-primary-500/10 text-primary-500'}`}>
            <Icon name={icon} size={19} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
                <span className="truncate text-sm font-black text-zinc-950 dark:text-white">{title}</span>
                {badge && <span className="shrink-0 rounded-full bg-primary-500/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">{badge}</span>}
            </span>
            {description && <span className="mt-0.5 block truncate text-xs text-muted">{description}</span>}
        </span>
        <Icon name="ChevronRight" size={17} className="shrink-0 text-zinc-400" />
    </button>
);

export const QuickStartSheet: React.FC<Props> = ({ open, onClose, lang, onResume, onToday, onFreestyle, onEditProgram }) => {
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const run = (fn: () => void) => {
        onClose();
        consumeModalHistory(fn);
    };
    const q = TRANSLATIONS[lang].quickStart;

    return (
        <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }} title={q.title} accent="primary">
            <div className="space-y-2.5 px-4 pb-8 pt-1">
                {activeSession ? (
                    <>
                        <Row
                            icon="Play"
                            primary
                            badge={q.live}
                            title={q.resume}
                            description={activeSession.name}
                            onClick={() => run(onResume)}
                        />
                    </>
                ) : (
                    <>
                        {activeMeso && (
                            <Row
                                icon="Calendar"
                                primary
                                title={q.scheduled}
                                description={`${activeMeso.name} · ${q.week} ${activeMeso.week}`}
                                onClick={() => run(onToday)}
                            />
                        )}
                        <Row
                            icon="Dumbbell"
                            title={q.freestyle}
                            onClick={() => run(onFreestyle)}
                        />
                        <Row
                            icon="Edit"
                            title={q.editRoutine}
                            onClick={() => run(onEditProgram)}
                        />
                    </>
                )}
            </div>
        </Sheet>
    );
};
