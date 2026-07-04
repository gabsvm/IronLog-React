
import React, { useState, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup, ExerciseDef } from '../types';
import { getTranslated } from '../utils';
import { Virtuoso } from 'react-virtuoso';
import { ExerciseDetailModal } from '../components/ui/ExerciseDetailModal'; 
import { triggerHaptic } from '../utils/audio';

const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface ExercisesViewProps {
    onBack: () => void;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({ onBack }) => {
    const { exercises, setExercises, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [mode, setMode] = useState<'list' | 'create'>('list');
    
    // Detail Modal State
    const [detailEx, setDetailEx] = useState<ExerciseDef | null>(null);
    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Create State
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');

    const handleDelete = () => {
        if (deleteId) {
            setExercises(prev => prev.filter(e => e.id !== deleteId));
            setDeleteId(null);
            triggerHaptic('medium');
        }
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        const newEx = {
            id: `custom_${Date.now()}`,
            name: newName,
            muscle: newMuscle
        };
        setExercises(prev => [...prev, newEx]);
        setMode('list');
        setNewName('');
        triggerHaptic('success');
    };

    const sortedExercises = [...exercises].sort((a,b) => {
         const na = getTranslated(a.name, lang);
         const nb = getTranslated(b.name, lang);
         return na.localeCompare(nb);
    });

    const Row = (index: number, ex: ExerciseDef) => (
        <div className="px-4 py-1">
            <button 
                onClick={() => setDetailEx(ex)} // Open details
                className="w-full glass-card p-4 rounded-xl flex justify-between items-center shadow-md text-left active:scale-[0.99] transition-transform hover:border-white/10"
            >
                <div>
                    <div className="font-bold text-zinc-900 dark:text-white text-sm">
                        {getTranslated(ex.name, lang)}
                    </div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">
                        {TRANSLATIONS[lang].muscle[ex.muscle]}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                     <div className="p-2 text-zinc-300">
                        <Icon name="ChevronRight" size={18} />
                    </div>
                    <div
                        onClick={(e) => { e.stopPropagation(); setDeleteId(ex.id); }}
                        className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                    >
                        <Icon name="Trash2" size={18} />
                    </div>
                </div>
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="glass px-4 h-14 shrink-0 flex items-center justify-between z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" aria-label="Previous"> <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <h1 className="font-bold text-zinc-900 dark:text-white">{t.manageEx}</h1>
                <div className="w-8"></div>
            </div>

            {mode === 'list' ? (
                <div className="flex-1 overflow-hidden relative">
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={sortedExercises}
                        itemContent={Row}
                        components={{
                            Footer: () => <div className="h-24" /> // Padding for FAB
                        }}
                    />
                    
                    <div className="fixed bottom-6 right-6 z-10">
                        <button 
                            onClick={() => setMode('create')}
                            className="w-14 h-14 bg-primary-500 rounded-full text-black shadow-xl shadow-primary-500/25 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-fast"
                        >
                            <Icon name="Plus" size={24} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.exName}</label>
                        <input 
                            type="text" 
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 font-medium text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all glow-input-neon"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g., Incline Machine Press"
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
                                    className={`p-3 rounded-xl text-xs font-bold border transition-all duration-fast active:scale-95 ${newMuscle === m ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'}`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setMode('list')} fullWidth>{t.cancel}</Button>
                        <Button onClick={handleCreate} disabled={!newName.trim()} fullWidth>{t.save}</Button>
                    </div>
                </div>
            )}

            {/* Exercise Detail Modal */}
            {detailEx && (
                <ExerciseDetailModal 
                    exercise={detailEx}
                    onClose={() => setDetailEx(null)}
                />
            )}

            {/* Confirm Delete */}
            <Suspense fallback={null}>
                <ConfirmModal 
                    isOpen={!!deleteId}
                    title={t.delete}
                    description={t.deleteConfirm}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                    variant="danger"
                />
            </Suspense>
        </div>
    );
};
