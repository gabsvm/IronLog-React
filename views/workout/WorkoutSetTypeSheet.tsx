// S6: set-type sheet, moved verbatim from views/WorkoutViewImpl.tsx.
import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import type { WorkoutViewState } from './useWorkoutViewState';
import { SET_TYPE_COLORS, SET_TYPE_ICONS, CORE_SET_TYPES, ADVANCED_SET_TYPES } from './workoutConstants';

export const WorkoutSetTypeSheet: React.FC<{ state: WorkoutViewState }> = ({ state }) => {
    const { sessionExercises, changingSetType, setChangingSetType, handleSetUpdate, handleSetTypeAll, t, w, showAdvancedSetTypes, setShowAdvancedSetTypes, applyToAll, setApplyToAll } = state;
    return (
        <>
            {changingSetType && (() => {
                const colors = SET_TYPE_COLORS;
                const icons = SET_TYPE_ICONS;
                const exForModal = sessionExercises.find(e => e.instanceId === changingSetType.exId);
                const pendingSets = (exForModal?.sets || []).filter(s => !s.completed);
                const hasMultipleSets = pendingSets.length > 1;
                return (
                    <Sheet
                        open={!!changingSetType}
                        onOpenChange={(open) => !open && setChangingSetType(null)}
                        title={t.setType}
                        accent="primary"
                    >
                        {hasMultipleSets && (
                            <button
                                type="button"
                                role="switch"
                                aria-checked={applyToAll}
                                onClick={() => setApplyToAll(v => !v)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setApplyToAll(v => !v);
                                    }
                                }}
                                className="w-full flex items-center justify-between border-b border-white/5 bg-zinc-950 px-5 py-3 hover:bg-zinc-900 transition-colors"
                            >
                                <span className="text-xs font-bold text-zinc-300">
                                    {t.applyToAllSets}
                                </span>
                                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${applyToAll ? 'bg-primary-500 shadow-[0_2px_8px] shadow-primary-500/30' : 'bg-zinc-600'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${applyToAll ? 'left-4' : 'left-0.5'}`} />
                                </div>
                            </button>
                        )}
                        <div className="p-4 grid grid-cols-1 gap-1.5 max-h-[60vh] overflow-y-auto">
                            {CORE_SET_TYPES.map(type => {
                                const isSelected = changingSetType?.currentType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (applyToAll && hasMultipleSets) {
                                                handleSetTypeAll(changingSetType.exId, type);
                                            } else {
                                                handleSetUpdate(changingSetType.exId, changingSetType.setId, 'type', type);
                                            }
                                            setChangingSetType(null);
                                        }}
                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-98 ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'}`}
                                    >
                                        <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg ${colors[type] || 'bg-zinc-800 text-zinc-400'}`}>
                                            <Icon name={icons[type] as any || 'Circle'} size={18} />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{t.types[type]}</div>
                                            <div className="text-xs text-muted leading-tight mt-0.5">{t.typeDesc[type]}</div>
                                        </div>
                                        {isSelected && <Icon name="CheckCircle" size={16} className="text-primary-500 shrink-0" />}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setShowAdvancedSetTypes(v => !v)}
                                className="mt-1 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                            >
                                <span>{t.advancedProtocols}</span>
                                <Icon name={showAdvancedSetTypes ? 'ChevronUp' : 'ChevronDown'} size={16} />
                            </button>

                            {showAdvancedSetTypes && ADVANCED_SET_TYPES.map(type => {
                                const isSelected = changingSetType?.currentType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (applyToAll && hasMultipleSets) {
                                                handleSetTypeAll(changingSetType.exId, type);
                                            } else {
                                                handleSetUpdate(changingSetType.exId, changingSetType.setId, 'type', type);
                                            }
                                            setChangingSetType(null);
                                        }}
                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-98 ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'}`}
                                    >
                                        <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg ${colors[type] || 'bg-zinc-800 text-zinc-400'}`}>
                                            <Icon name={icons[type] as any || 'Circle'} size={18} />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{t.types[type]}</div>
                                            <div className="text-xs text-muted leading-tight mt-0.5">{t.typeDesc[type]}</div>
                                        </div>
                                        {isSelected && <Icon name="CheckCircle" size={16} className="text-primary-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Sheet>
                );
            })()}
        </>
    );
};
