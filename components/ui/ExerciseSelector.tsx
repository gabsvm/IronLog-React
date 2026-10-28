import React, { useState, useMemo, useDeferredValue } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from './Icon';
import { MuscleTag } from './MuscleTag';
import { resolveMuscleLabel } from '../../utils/muscle';
import { MuscleGroup, ExerciseDef, VolumeCountingMode } from '../../types';
import { Button } from './Button';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { isSelectorVisible, matchesExerciseQuery } from '../../utils/exerciseLibrary';
import { Virtuoso } from 'react-virtuoso';
import { Sheet } from './Sheet';
import { getFirebaseFirestoreServices } from '../../lib/firebaseLoader';

interface ExerciseSelectorProps {
    onSelect: (exId: string, exercise?: ExerciseDef) => void;
    onClose: () => void;
    excludeIds?: string[];
    persistToGlobal?: boolean; // New Prop for Admin Mode
    presetMuscle?: MuscleGroup;            // Open with this muscle filter
    sourceFilter?: 'nilsson_bw';           // Restrict list to a source tag (e.g. Nilsson BW)
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect, onClose, excludeIds = [], persistToGlobal = false, presetMuscle, sourceFilter }) => {
    const { exercises, setExercises } = useApp();
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>(presetMuscle || 'ALL');
    
    // Creation Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');
    const [isBodyweight, setIsBodyweight] = useState(false);
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>('total');

    const filtered = useMemo(() => {
        return exercises
            .filter(ex => !excludeIds.includes(ex.id))
            .filter(ex => !ex.archived)
            // Merged-away duplicates stay hidden: their history reads through
            // the surviving exercise.
            .filter(isSelectorVisible)
            .filter(ex => {
                if (sourceFilter) {
                    return (ex as any).source === sourceFilter;
                }

                const isNilsson = (ex as any).source === 'nilsson_bw';
                const isSpecialCatalog = ex.id.startsWith('cf_') || ex.id.startsWith('cal_');
                return !isNilsson && !isSpecialCatalog;
            })
            .filter(ex => {
                // Accent-insensitive search across names in both languages plus
                // library aliases (Q14).
                const matchesSearch = matchesExerciseQuery(ex, deferredSearch);
                const matchesMuscle = filterMuscle === 'ALL' || ex.muscle === filterMuscle;
                return matchesSearch && matchesMuscle;
            })
            .sort((a, b) => {
                const na = getTranslated(a.name, lang);
                const nb = getTranslated(b.name, lang);
                return na.localeCompare(nb);
            });
    }, [exercises, deferredSearch, filterMuscle, lang, excludeIds, sourceFilter]);

    const handleCreateStart = () => {
        setNewName(search); // Use current search as draft name
        if (filterMuscle !== 'ALL') {
            setNewMuscle(filterMuscle); // Use current filter as draft muscle
        }
        setIsCreating(true);
    };

    const handleCreateSave = async () => {
        if (!newName.trim()) return;
        
        let newId: string;
        
        if (persistToGlobal) {
            // Generate nice slug ID for Global DB: e.g., "chest_incline_press"
            // Remove special chars, replace spaces with underscores, lowercase
            const slug = newName.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '_');
            newId = `${newMuscle.toLowerCase()}_${slug}`;
        } else {
            // Standard user custom ID
            newId = `custom_${Date.now()}`;
        }

        const newEx: ExerciseDef = {
            id: newId,
            name: { en: newName, es: newName }, // Store as bilingual object for consistency
            muscle: newMuscle,
            isBodyweight: isBodyweight,
            volumeCountingMode
        };
        
        // 1. Update Local State (Immediate Feedback)
        setExercises(prev => [...prev, newEx]);
        
        // 2. If Admin Mode, Save to Firestore Global Collection
        if (persistToGlobal) {
            try {
                const { db, firestoreApi } = await getFirebaseFirestoreServices();
                if (db) {
                    await firestoreApi.setDoc(firestoreApi.doc(db, "global_exercises", newId), newEx);
                    console.log(`Saved global exercise: ${newId}`);
                }
            } catch (e) {
                console.error("Failed to save global exercise:", e);
            }
        }

        // Pass newEx directly because local state update might not be reflected in 'exercises' yet in parent
        onSelect(newId, newEx); 
    };

    // Render Row for Virtualization
    const Row = (_index: number, ex: ExerciseDef) => (
        <div className="px-3 py-1">
            <button
                type="button"
                onClick={() => onSelect(ex.id, ex)}
                className="group flex w-full items-center justify-between rounded-[6px] border border-border-subtle bg-surface-raised hover:border-primary-500/50 p-3 text-left transition-colors mb-1.5"
            >
                <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <MuscleTag label={resolveMuscleLabel(ex.muscle, lang)} />
                        {ex.isBodyweight && (
                            <span className="inline-flex items-center rounded-[4px] border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-300">
                                BW
                            </span>
                        )}
                    </div>
                    <div className="font-bold text-white text-[15px] truncate mt-1">
                        {getTranslated(ex.name, lang)}
                    </div>
                    {ex.volumeCountingMode === 'per_side' && (
                        <div className="text-[11px] font-medium text-zinc-400 mt-0.5">
                            {TRANSLATIONS[lang].copy.exerciseSelector.perSide2} (×2)
                        </div>
                    )}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-border-subtle bg-surface-base text-zinc-400 group-hover:border-primary-500 group-hover:bg-primary-500 group-hover:text-zinc-950 transition-colors">
                    <Icon name="Plus" size={16} />
                </div>
            </button>
        </div>
    );

    return (
        <Sheet
            open={true}
            onOpenChange={(o) => { if (!o) onClose(); }}
            variant="full"
            hideCloseButton
            description={persistToGlobal ? pickLang(lang, { es: 'Administrador de biblioteca global de ejercicios', en: 'Global exercise library admin' }) : pickLang(lang, { es: 'Selector de ejercicios', en: 'Exercise picker' })}
            accent="primary"
        >
            {/* The Sheet body is a plain `overflow-y-auto` block, so we must re-establish
                a full-height flex column here — otherwise the `flex-1` Virtuoso list
                below collapses to 0px and the exercise list renders empty. */}
            <div className="flex flex-col h-full bg-surface-app">
            {/* Custom Header (search input replaces the default Sheet title slot) */}
            <div className={`px-4 h-16 shrink-0 flex items-center gap-3 border-b border-border-subtle bg-surface-base/95 backdrop-blur-md ${persistToGlobal ? 'bg-primary-500/10' : ''}`}>
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-[6px] text-zinc-400 hover:text-white hover:bg-surface-raised transition-colors"
                    aria-label={pickLang(lang, { es: 'Cerrar', en: 'Close' })}
                >
                    <Icon name="X" size={22} />
                </button>
                {isCreating ? (
                    <div className="flex-1 font-black text-base uppercase tracking-tight text-white flex items-center">
                        {t.addEx} {persistToGlobal && <span className="text-[10px] bg-primary-500 text-zinc-950 font-bold px-2 py-0.5 rounded-[4px] ml-2">GLOBAL</span>}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder={t.searchPlaceholder}
                                aria-label={pickLang(lang, { es: 'Buscar ejercicios', en: 'Search exercises' })}
                                className="w-full rounded-[6px] bg-surface-raised border border-border-subtle py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-primary-500 outline-none font-medium transition-colors"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCreateStart}
                            aria-label={pickLang(lang, { es: 'Añadir nuevo ejercicio', en: 'Add new exercise' })}
                            className="w-10 h-10 flex shrink-0 items-center justify-center rounded-[6px] bg-primary-500 text-zinc-950 shadow-md hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Icon name="Plus" size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Switcher */}
            {isCreating ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1.5rem+var(--safe-area-bottom))] scroll-container flex flex-col">
                    <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-4 sm:p-5 space-y-5 flex-1">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">{t.exName}</label>
                            <input 
                                type="text" 
                                className="w-full rounded-[6px] bg-surface-base border border-border-subtle p-3 text-sm text-white placeholder-zinc-500 focus:border-primary-500 outline-none font-medium transition-colors"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">{t.selectMuscle}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(MUSCLE_GROUPS).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setNewMuscle(m)}
                                        className={`p-2.5 rounded-[4px] text-xs font-bold uppercase tracking-wider border transition-colors ${
                                            newMuscle === m
                                                ? 'bg-primary-500 border-primary-500 text-zinc-950'
                                                : 'bg-surface-base border-border-subtle text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {TRANSLATIONS[lang].muscle[m]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-surface-base border border-border-subtle p-3.5 rounded-[6px]">
                            <input 
                                type="checkbox" 
                                id="isBW"
                                checked={isBodyweight}
                                onChange={e => setIsBodyweight(e.target.checked)}
                                className="w-4 h-4 accent-primary-500 rounded-[2px]"
                            />
                            <label htmlFor="isBW" className="font-bold text-xs uppercase tracking-wider text-white cursor-pointer">
                                {t.profile.isBW}
                            </label>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                                {TRANSLATIONS[lang].copy.exerciseSelector.tonnageCalculation}
                            </label>
                            <div className="grid gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVolumeCountingMode('total')}
                                    className={`text-left rounded-[6px] border p-3 transition-colors ${
                                        volumeCountingMode === 'total'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-border-subtle bg-surface-base hover:border-zinc-600'
                                    }`}
                                >
                                    <span className="block text-sm font-bold text-white">{TRANSLATIONS[lang].copy.exerciseSelector.recordedTotal1}</span>
                                    <span className="block mt-1 text-xs text-zinc-400">{TRANSLATIONS[lang].copy.exerciseSelector.barsBilateralMachinesOr}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVolumeCountingMode('per_side')}
                                    className={`text-left rounded-[6px] border p-3 transition-colors ${
                                        volumeCountingMode === 'per_side'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-border-subtle bg-surface-base hover:border-zinc-600'
                                    }`}
                                >
                                    <span className="block text-sm font-bold text-white">{TRANSLATIONS[lang].copy.exerciseSelector.perSide2}</span>
                                    <span className="block mt-1 text-xs text-zinc-400">{TRANSLATIONS[lang].copy.exerciseSelector.whenLoadAndReps}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-auto flex gap-3">
                        <Button variant="secondary" onClick={() => setIsCreating(false)} fullWidth className="rounded-[6px]">{t.cancel}</Button>
                        <Button onClick={handleCreateSave} disabled={!newName.trim()} fullWidth className="rounded-[6px]">{t.createAndSelect}</Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface-base p-2.5 no-scrollbar">
                        <button 
                            onClick={() => setFilterMuscle('ALL')}
                            className={`shrink-0 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                filterMuscle === 'ALL'
                                    ? 'bg-primary-500 text-zinc-950'
                                    : 'bg-surface-raised border border-border-subtle text-zinc-400 hover:text-white'
                            }`}
                        >
                            {t.any}
                        </button>
                        {Object.values(MUSCLE_GROUPS).map(m => (
                            <button 
                                key={m}
                                onClick={() => setFilterMuscle(m)}
                                className={`shrink-0 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                    filterMuscle === m
                                        ? 'bg-primary-500 text-zinc-950'
                                        : 'bg-surface-raised border border-border-subtle text-zinc-400 hover:text-white'
                                }`}
                            >
                                {TRANSLATIONS[lang].muscle[m]}
                            </button>
                        ))}
                    </div>

                    {/* Virtualized List */}
                    <div className="flex-1 overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
                                <div className="w-14 h-14 rounded-[8px] bg-surface-raised border border-border-subtle flex items-center justify-center text-zinc-500">
                                    <Icon name="Dumbbell" size={28} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-base mb-1">
                                        {search ? pickLang(lang, { es: `Sin resultados para "${search}"`, en: `No results for "${search}"` }) : (t.noExFound || pickLang(lang, { es: 'Sin ejercicios', en: 'No exercises' }))}
                                    </p>
                                    <p className="text-zinc-400 text-xs">
                                        {TRANSLATIONS[lang].copy.exerciseSelector.searchByNameOr}
                                    </p>
                                </div>
                                <Button onClick={handleCreateStart} className="rounded-[6px]">
                                    <Icon name="Plus" size={14} />
                                    {search ? `${t.createEx} "${search}"` : (TRANSLATIONS[lang].copy.exerciseSelector.createExercise)}
                                </Button>
                            </div>
                        ) : (
                            <Virtuoso
                                style={{ height: '100%' }}
                                data={filtered}
                                itemContent={Row}
                                components={{
                                    Footer: () => (
                                        <div className="pt-4 pb-[calc(3rem+var(--safe-area-bottom))] px-4">
                                            <Button variant="secondary" onClick={handleCreateStart} fullWidth className="rounded-[6px] border-dashed border-border-subtle hover:border-primary-500 text-zinc-300">
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
        </Sheet>
    );
};
