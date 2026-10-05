import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import type { Discipline } from './freestyle/freestyleData';
import { useFreestyleSessionState, type FreestyleSessionModalProps } from './freestyle/useFreestyleSessionState';
import { FreestyleGymPanel } from './freestyle/FreestyleGymPanel';
import { FreestyleWodPanel } from './freestyle/FreestyleWodPanel';
import { FreestyleSkillPanel } from './freestyle/FreestyleSkillPanel';

// T2: state lives in components/workout/freestyle/useFreestyleSessionState; render blocks in components/workout/freestyle/.
export type { FreestyleSessionModalProps } from './freestyle/useFreestyleSessionState';



export const FreestyleSessionModal: React.FC<FreestyleSessionModalProps> = (props) => {
    const state = useFreestyleSessionState(props);
    const { isOpen, onClose, discipline, setDiscipline, f, tabStyle, canStart, handleStart, startLabel } = state;

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(o) => { if (!o) onClose(); }}
            title={f.title}
            accent="primary"
            footer={
                <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className="w-full py-4 rounded-2xl font-black text-sm text-black bg-primary-500 hover:bg-primary-400 transition-all duration-fast ease-natural active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                >
                    {startLabel}
                </button>
            }
        >
            <div className="p-5">
            {/* Discipline Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-5 gap-1">
                <button
                    className={tabStyle(discipline === 'gym', 'bg-primary-500 shadow-primary-500/30 text-black')}
                    onClick={() => setDiscipline('gym')}
                >
                    <span className="flex items-center justify-center gap-1">
                        <Icon name="Dumbbell" size={12} />
                        Gym
                    </span>
                </button>
                <button
                    className={tabStyle(discipline === 'crossfit', 'bg-primary-500 shadow-primary-500/30 text-black')}
                    onClick={() => setDiscipline('crossfit')}
                >
                    <span className="flex items-center justify-center gap-1">
                        <Icon name="Zap" size={12} />
                        CrossFit
                    </span>
                </button>
                <button
                    className={tabStyle(discipline === 'calisthenics', 'bg-primary-500 shadow-primary-500/30 text-black')}
                    onClick={() => setDiscipline('calisthenics')}
                >
                    <span className="flex items-center justify-center gap-1">
                        <Icon name="User" size={12} />
                        Calistenia
                    </span>
                </button>
            </div>

            {/* GYM: Free-form */}
            <FreestyleGymPanel state={state} />

            {/* CROSSFIT: WOD picker */}
            <FreestyleWodPanel state={state} />

            {/* CALISTHENICS: Skill Builder */}
            <FreestyleSkillPanel state={state} />
            </div>
        </Sheet>
    );
};
