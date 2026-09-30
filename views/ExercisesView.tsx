import React, { useState, useMemo, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useStore } from '../lib/store';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup, ExerciseDef, VolumeCountingMode } from '../types';
import { getTranslated } from '../utils';
import { Virtuoso } from 'react-virtuoso';
import { ExerciseDetailModal } from '../components/ui/ExerciseDetailModal';
import { triggerHaptic } from '../utils/audio';
import {
    analyzeExerciseReferences,
    archiveExercise,
    unarchiveExercise,
    deleteCustomExercise,
    isBuiltInExercise,
    ExerciseReferenceReport,
} from '../services/exerciseReferenceService';

const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface ExercisesViewProps {
    onBack: () => void;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({ onBack }) => {
    const { exercises, setExercises, lang, program, personalTemplates } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];

    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
    const [filterCategory, setFilterCategory] = useState<'all' | 'custom' | 'archived'>('all');

    // Detail Modal State
    const [detailEx, setDetailEx] = useState<ExerciseDef | null>(null);

    // Delete / Archive Modal State
    const [pendingDeleteReport, setPendingDeleteReport] = useState<ExerciseReferenceReport | null>(null);
    const [unreferencedDeleteId, setUnreferencedDeleteId] = useState<string | null>(null);

    // Create State
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');
    const [newVolumeCountingMode, setNewVolumeCountingMode] = useState<VolumeCountingMode>('total');

    const handleCreate = () => {
        if (!newName.trim()) return;
        const newEx: ExerciseDef = {
            id: `custom_${Date.now()}`,
            name: newName.trim(),
            muscle: newMuscle,
            volumeCountingMode: newVolumeCountingMode,
            isCustom: true,
        };
        setExercises(prev => [...prev, newEx]);
        setMode('list');
        setNewName('');
        triggerHaptic('success');
    };

    const handleInitiateDelete = (ex: ExerciseDef) => {
        if (isBuiltInExercise(ex.id, exercises)) {
            return;
        }

        const report = analyzeExerciseReferences(ex.id, {
            exercises,
            program,
            activeMeso,
            personalTemplates,
        });

        if (report.totalReferences > 0) {
            setPendingDeleteReport(report);
        } else {
            setUnreferencedDeleteId(ex.id);
        }
    };

    const handleConfirmPermanentDelete = () => {
        if (!unreferencedDeleteId) return;
        const result = deleteCustomExercise(exercises, unreferencedDeleteId);
        if (result.success) {
            setExercises(result.updatedExercises);
            triggerHaptic('medium');
        }
        setUnreferencedDeleteId(null);
    };

    const handleArchiveFromReport = (exId: string) => {
        setExercises(prev => archiveExercise(prev, exId));
        setPendingDeleteReport(null);
        triggerHaptic('medium');
    };

    const handleUnarchive = (exId: string) => {
        setExercises(prev => unarchiveExercise(prev, exId));
        triggerHaptic('success');
    };

    const filteredExercises = useMemo(() => {
        return exercises
            .filter(ex => {
                if (filterCategory === 'custom') {
                    return !isBuiltInExercise(ex.id, exercises);
                }
                if (filterCategory === 'archived') {
                    return !!ex.archived;
                }
                // 'all' includes active exercises (not archived by default, unless searching)
                if (!searchQuery.trim() && ex.archived) {
                    return false;
                }
                return true;
            })
            .filter(ex => {
                if (selectedMuscle !== 'ALL' && ex.muscle !== selectedMuscle) {
                    return false;
                }
                if (searchQuery.trim()) {
                    const name = getTranslated(ex.name, lang).toLowerCase();
                    return name.includes(searchQuery.toLowerCase().trim());
                }
                return true;
            })
            .sort((a, b) => {
                const na = getTranslated(a.name, lang);
                const nb = getTranslated(b.name, lang);
                return na.localeCompare(nb);
            });
    }, [exercises, filterCategory, selectedMuscle, searchQuery, lang]);

    const Row = (index: number, ex: ExerciseDef) => {
        const isBuiltIn = isBuiltInExercise(ex.id, exercises);
        const isArchived = !!ex.archived;

        return (
            <div className="px-4 py-1.5" key={ex.id}>
                <div className="w-full glass-card p-3 rounded-2xl flex items-center justify-between shadow-sm border border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-zinc-900/70 hover:border-primary-500/30 transition-all">
                    {/* Main card button (no nested buttons inside!) */}
                    <button
                        type="button"
                        onClick={() => setDetailEx(ex)}
                        className="flex-1 min-w-0 text-left py-1 pr-2 flex flex-col justify-center focus:outline-none"
                        aria-label={`Detalles de ${getTranslated(ex.name, lang)}`}
                    >
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                                {getTranslated(ex.name, lang)}
                            </span>
                            {isArchived && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                    {lang === 'es' ? 'Archivado' : 'Archived'}
                                </span>
                            )}
                            {!isBuiltIn && !isArchived && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                    {lang === 'es' ? 'Personalizado' : 'Custom'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                                {TRANSLATIONS[lang].muscle[ex.muscle]}
                            </span>
                            {ex.volumeCountingMode === 'per_side' && (
                                <span className="text-[10px] text-zinc-400 font-medium">×2</span>
                            )}
                        </div>
                    </button>

                    {/* Action buttons (Cleanly adjacent, NOT nested) */}
                    <div className="flex items-center gap-1 shrink-0">
                        {isArchived ? (
                            <button
                                type="button"
                                onClick={() => handleUnarchive(ex.id)}
                                className="p-2 text-zinc-400 hover:text-primary-400 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title={lang === 'es' ? 'Desarchivar' : 'Unarchive'}
                                aria-label={lang === 'es' ? 'Desarchivar' : 'Unarchive'}
                            >
                                <Icon name="ArchiveRestore" size={18} />
                            </button>
                        ) : null}

                        {!isBuiltIn ? (
                            <button
                                type="button"
                                onClick={() => handleInitiateDelete(ex)}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                                title={lang === 'es' ? 'Eliminar / Archivar' : 'Delete / Archive'}
                                aria-label={lang === 'es' ? 'Eliminar ejercicio' : 'Delete exercise'}
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        ) : (
                            <div className="p-2 text-zinc-300 dark:text-zinc-600" title={lang === 'es' ? 'Catálogo oficial' : 'Official catalog'}>
                                <Icon name="Lock" size={16} />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setDetailEx(ex)}
                            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            aria-label="Ver detalles"
                        >
                            <Icon name="ChevronRight" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="glass px-4 h-14 shrink-0 flex items-center justify-between z-10 border-b border-zinc-200 dark:border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    aria-label="Volver"
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <h1 className="font-bold text-zinc-900 dark:text-white">{t.manageEx}</h1>
                <div className="w-8"></div>
            </div>

            {mode === 'list' ? (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Controls: Search and Filter Chips */}
                    <div className="p-4 space-y-3 shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-200 dark:border-white/5">
                        {/* Search input */}
                        <div className="relative">
                            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={lang === 'es' ? 'Buscar ejercicio...' : 'Search exercise...'}
                                className="w-full pl-9 pr-8 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white border border-transparent focus:border-primary-500 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            )}
                        </div>

                        {/* Category filter tabs */}
                        <div className="flex gap-2">
                            {(['all', 'custom', 'archived'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        filterCategory === cat
                                            ? 'bg-primary-500 text-black shadow-sm'
                                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {cat === 'all'
                                        ? (lang === 'es' ? 'Todos' : 'All')
                                        : cat === 'custom'
                                        ? (lang === 'es' ? 'Personalizados' : 'Custom')
                                        : (lang === 'es' ? 'Archivados' : 'Archived')}
                                </button>
                            ))}
                        </div>

                        {/* Muscle filter horizontal scroll */}
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            <button
                                onClick={() => setSelectedMuscle('ALL')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                                    selectedMuscle === 'ALL'
                                        ? 'bg-zinc-800 dark:bg-white text-white dark:text-black'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                {lang === 'es' ? 'Todos los músculos' : 'All muscles'}
                            </button>
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMuscle(m)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                                        selectedMuscle === m
                                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-hidden relative">
                        {filteredExercises.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                                <Icon name="Dumbbell" size={32} className="mb-2 opacity-40" />
                                <p className="text-sm font-medium">
                                    {lang === 'es' ? 'No se encontraron ejercicios' : 'No exercises found'}
                                </p>
                            </div>
                        ) : (
                            <Virtuoso
                                style={{ height: '100%' }}
                                data={filteredExercises}
                                itemContent={Row}
                                components={{
                                    Footer: () => <div className="h-24" /> // Padding for FAB
                                }}
                            />
                        )}

                        <div className="fixed bottom-6 right-6 z-10">
                            <button
                                onClick={() => setMode('create')}
                                className="w-14 h-14 bg-primary-500 rounded-full text-black shadow-xl shadow-primary-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                aria-label={lang === 'es' ? 'Crear ejercicio' : 'Create exercise'}
                            >
                                <Icon name="Plus" size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.exName}</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 font-medium text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
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
                                    className={`p-3 rounded-xl text-xs font-bold border transition-all duration-fast active:scale-95 ${
                                        newMuscle === m
                                            ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                                    }`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">
                            {lang === 'es' ? 'Cálculo de tonelaje' : 'Tonnage calculation'}
                        </label>
                        <select
                            value={newVolumeCountingMode}
                            onChange={e => setNewVolumeCountingMode(e.target.value as VolumeCountingMode)}
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 font-medium text-white outline-none"
                        >
                            <option value="total">{lang === 'es' ? 'Total registrado · ×1' : 'Recorded total · ×1'}</option>
                            <option value="per_side">{lang === 'es' ? 'Por lado · ×2' : 'Per side · ×2'}</option>
                        </select>
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

            {/* Unreferenced Exercise Permanent Delete Confirmation */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={!!unreferencedDeleteId}
                    title={lang === 'es' ? '¿Eliminar ejercicio personalizado?' : 'Delete custom exercise?'}
                    description={
                        lang === 'es'
                            ? 'Este ejercicio no está en uso en ninguna rutina activa ni plantilla. La acción es permanente.'
                            : 'This exercise is not currently referenced in any active routine or template. This action is permanent.'
                    }
                    onConfirm={handleConfirmPermanentDelete}
                    onCancel={() => setUnreferencedDeleteId(null)}
                    variant="danger"
                />
            </Suspense>

            {/* Referenced Exercise Action Dialog (Archive vs In-Use Warning) */}
            {pendingDeleteReport && (
                <div
                    className="fixed inset-0 z-confirm bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-fast"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ref-modal-title"
                >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-amber-500">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={22} />
                            </div>
                            <div>
                                <h3 id="ref-modal-title" className="text-base font-bold text-zinc-900 dark:text-white">
                                    {lang === 'es' ? 'Ejercicio en uso' : 'Exercise in use'}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {lang === 'es'
                                        ? `Referenciado en ${pendingDeleteReport.totalReferences} lugar(es)`
                                        : `Referenced in ${pendingDeleteReport.totalReferences} location(s)`}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {lang === 'es'
                                ? 'No se puede eliminar de forma destructiva porque causaría sustituciones accidentales en tus rutinas. Puedes archivarlo para ocultarlo de nuevas selecciones manteniendo intactas tus rutinas actuales.'
                                : 'Cannot be destructively deleted because it would cause unintended substitutions in your routines. You can archive it to hide it from new selections while preserving current routines.'}
                        </p>

                        {/* List of references */}
                        <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 text-xs">
                            {pendingDeleteReport.locations.map((loc, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                    <Icon name="Check" size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="font-semibold">{loc.containerName}</strong>: {loc.detail}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                onClick={() => handleArchiveFromReport(pendingDeleteReport.exerciseId)}
                                fullWidth
                                variant="primary"
                            >
                                <Icon name="Archive" size={16} className="mr-2" />
                                {lang === 'es' ? 'Archivar Ejercicio' : 'Archive Exercise'}
                            </Button>
                            <Button
                                onClick={() => setPendingDeleteReport(null)}
                                fullWidth
                                variant="secondary"
                            >
                                {t.cancel}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
