import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { useStore } from '../../lib/store';

interface Props {
    open: boolean;
    onClose: () => void;
    lang: 'en' | 'es';
    onResume: () => void;
    onToday: () => void;
    onFreestyle: () => void;
    onTwoBlock: () => void;
    onEditProgram: () => void;
}

const Row = ({ icon, title, description, badge, primary, onClick }: {
    icon: string;
    title: string;
    description: string;
    badge?: string;
    primary?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-transform active:scale-[0.985] ${primary ? 'border-primary-500/20 bg-primary-500/[0.07]' : 'border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-raised)/0.72)]'}`}
    >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-primary-500 text-black' : 'bg-primary-500/10 text-primary-500'}`}>
            <Icon name={icon} size={19} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
                <span className="truncate text-sm font-black text-zinc-950 dark:text-white">{title}</span>
                {badge && <span className="shrink-0 rounded-full bg-primary-500/12 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">{badge}</span>}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-zinc-500">{description}</span>
        </span>
        <Icon name="ChevronRight" size={17} className="shrink-0 text-zinc-400" />
    </button>
);

export const QuickStartSheet: React.FC<Props> = ({ open, onClose, lang, onResume, onToday, onFreestyle, onTwoBlock, onEditProgram }) => {
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const run = (fn: () => void) => { onClose(); window.setTimeout(fn, 80); };

    return (
        <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }} title={lang === 'es' ? 'Iniciar entrenamiento' : 'Start training'} accent="primary">
            <div className="space-y-2.5 px-4 pb-8 pt-1">
                {activeSession && (
                    <Row
                        icon="Play"
                        primary
                        badge={lang === 'es' ? 'EN CURSO' : 'LIVE'}
                        title={lang === 'es' ? 'Reanudar sesión' : 'Resume session'}
                        description={activeSession.name}
                        onClick={() => run(onResume)}
                    />
                )}

                {activeMeso && !activeSession && (
                    <Row
                        icon="Calendar"
                        primary
                        title={lang === 'es' ? 'Entreno programado' : 'Scheduled workout'}
                        description={`${activeMeso.name} · ${lang === 'es' ? 'Semana' : 'Week'} ${activeMeso.week}`}
                        onClick={() => run(onToday)}
                    />
                )}

                <div className="pt-1 text-[9px] font-black uppercase tracking-[0.17em] text-zinc-500">
                    {lang === 'es' ? 'Entrenar sin plan fijo' : 'Train without a fixed plan'}
                </div>

                <Row
                    icon="Dumbbell"
                    title={lang === 'es' ? 'Sesión libre / WOD / Skill' : 'Freestyle / WOD / Skill'}
                    description={lang === 'es' ? 'Gym libre, CrossFit o progresiones de calistenia.' : 'Free gym, CrossFit or calisthenics progressions.'}
                    onClick={() => run(onFreestyle)}
                />
                <Row
                    icon="Layers"
                    title="Two Block Mass"
                    description={lang === 'es' ? 'Protocolos de Nick Nilsson y sesiones por bloque.' : 'Nick Nilsson protocols and block-based sessions.'}
                    onClick={() => run(onTwoBlock)}
                />

                <div className="pt-1 text-[9px] font-black uppercase tracking-[0.17em] text-zinc-500">
                    {lang === 'es' ? 'Gestionar' : 'Manage'}
                </div>
                <Row
                    icon="Edit"
                    title={lang === 'es' ? 'Editar rutina' : 'Edit routine'}
                    description={lang === 'es' ? 'Días, ejercicios, series y estructura del plan.' : 'Days, exercises, sets and plan structure.'}
                    onClick={() => run(onEditProgram)}
                />
            </div>
        </Sheet>
    );
};
