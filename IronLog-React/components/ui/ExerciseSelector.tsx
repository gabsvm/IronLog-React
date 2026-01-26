
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from './Icon';
import { MuscleGroup, ExerciseDef } from '../../types';
import { Button } from './Button';
import { getTranslated } from '../../utils';
import { Virtuoso } from 'react-virtuoso';

interface ExerciseSelectorProps {
    onSelect: (exId: string, exercise?: ExerciseDef) => void;
    onClose: () => void;
    excludeIds?: string[];
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect, onClose, excludeIds = [] }) => {
    const { exercises, setExercises, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [search, setSearch] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
    
    // Creation Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');

    const filtered = useMemo(() => {
        return exercises
            .filter(ex => !excludeIds.includes(ex.id))
            .filter(ex => {
                const name = getTranslated(ex.name, lang);
                const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
                const matchesMuscle = filterMuscle === 'ALL' || ex.muscle === filterMuscle;
                return matchesSearch && matchesMuscle;
            })
            .sort((a, b) => {
                const na = getTranslated(a.name, lang);
                const nb = getTranslated(b.name, lang);
                return na.localeCompare(nb);
            });
    }, [exercises, search, filterMuscle, lang, excludeIds]);

    const handleCreateStart = () => {
        setNewName(search); // Use current search as draft name
        if (filterMuscle !== 'ALL') {
            setNewMuscle(filterMuscle); // Use current filter as draft muscle
        }
        setIsCreating(true);
    };

    const handleCreateSave = () => {
        if (!newName.trim()) return;
        const newId = `custom_${Date.now()}`;
        const newEx: ExerciseDef = {
            id: newId,
            name: newName,
            muscle: newMuscle
        };
        
        setExercises(prev => [...prev, newEx]);
        // Pass newEx directly because local state update might not be reflected in 'exercises' yet in parent
        onSelect(newId, newEx); 
    };

    // Render Row for Virtualization
    const Row = (index: number, ex: ExerciseDef) => (
        <div className="px-2 py-1">
            <button
                onClick={() => onSelect(ex.id, ex)}
                className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all flex items-center justify-between group bg-transparent"
            >
                <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {getTranslated(ex.name, lang)}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                        {TRANSLATIONS[lang].muscle[ex.muscle]}
                    </div>
                </div>
                <div className="text-zinc-300 dark:text-zinc-700 group-hover:text-red-500">
                    <Icon name="Plus" size={20} />
                </div>
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="glass px-4 h-16 shrink-0 flex items-center gap-3 border-b border-zinc-200 dark:border-white/5">
                <button onClick={onClose} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name="X" size={24} />
                </button>
                {isCreating ? (
                    <div className="flex-1 font-bold text-lg dark:text-white">{t.addEx}</div>
                ) : (
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={t.searchPlaceholder}
                                className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-red-500 border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleCreateStart}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 active:scale-95 transition-transform"
                        >
                            <Icon name="Plus" size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Switcher */}
            {isCreating ? (
                <div className="flex-1 overflow-y-auto p-6 scroll-container flex flex-col">
                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.exName}</label>
                            <input 
                                type="text" 
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.selectMuscle}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(MUSCLE_GROUPS).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setNewMuscle(m)}
                                        className={`p-3 rounded-xl text-xs font-bold border transition-all ${newMuscle === m ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                                    >
                                        {TRANSLATIONS[lang].muscle[m]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-auto flex gap-3">
                        <Button variant="secondary" onClick={() => setIsCreating(false)} fullWidth>{t.cancel}</Button>
                        <Button onClick={handleCreateSave} disabled={!newName.trim()} fullWidth>{t.createAndSelect}</Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="p-2 border-b border-zinc-200 dark:border-white/5 overflow-x-auto scroll-container flex gap-2 bg-white dark:bg-zinc-900/50 shrink-0">
                        <button 
                            onClick={() => setFilterMuscle('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterMuscle === 'ALL' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                        >
                            {t.any}
                        </button>
                        {Object.values(MUSCLE_GROUPS).map(m => (
                            <button 
                                key={m}
                                onClick={() => setFilterMuscle(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterMuscle === m ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                            >
                                {TRANSLATIONS[lang].muscle[m]}
                            </button>
                        ))}
                    </div>

                    {/* Virtualized List */}
                    <div className="flex-1 overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-zinc-400 text-sm flex flex-col items-center">
                                <div className="mb-4">{t.noExFound}</div>
                                <Button size="sm" onClick={handleCreateStart}>
                                    <Icon name="Plus" size={14} /> {t.createEx} "{search}"
                                </Button>
                            </div>
                        ) : (
                            <Virtuoso
                                style={{ height: '100%' }}
                                data={filtered}
                                itemContent={Row}
                                components={{
                                    Footer: () => (
                                        <div className="pt-4 pb-12 px-4">
                                            <Button variant="secondary" onClick={handleCreateStart} fullWidth className="border-dashed">
                                                <Icon name="Plus" size={14} /> {t.createEx} {search ? `"${search}"` : ''}
                                            </Button>
                                        </div>
                                    )
                                }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
