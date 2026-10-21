
import React, { useState, useMemo, useDeferredValue } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from './Icon';
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
    const [isBodyweight, setIsBodyweight] = useState(false); // NEW
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
    const Row = (index: number, ex: ExerciseDef) => (
        <div className="px-2 py-1">
            <button
                onClick={() => onSelect(ex.id, ex)}
                className="group flex min-h-[56px] w-full items-center justify-between rounded-2xl p-3 text-left transition-colors hover:bg-[rgb(var(--surface-elevated)/0.5)]"
            >
                <div>
                    <div className="text-sm font-bold text-[rgb(var(--text-primary))]">
                        {getTranslated(ex.name, lang)}
                    </div>
                    <div className="mt-0.5 flex gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                        <span>{TRANSLATIONS[lang].muscle[ex.muscle]}</span>
                        {ex.isBodyweight && <span className="text-blue-500">BW</span>}
                    </div>
                </div>
                <div className="text-muted transition-colors group-hover:text-primary-500">
                    <Icon name="Plus" size={20} />
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
            <div className="flex flex-col h-full">
            {/* Custom Header (search input replaces the default Sheet title slot) */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.95)] px-4 backdrop-blur-md">
                <button onClick={onClose} className="flex min-h-[44px] min-w-[44px] -ml-2 items-center justify-center rounded-xl text-muted hover:text-[rgb(var(--text-primary))]" aria-label={pickLang(lang, { es: 'Cerrar', en: 'Close' })}>
                    <Icon name="X" size={24} />
                </button>
                {isCreating ? (
                    <div className="flex-1 text-lg font-bold text-[rgb(var(--text-primary))]">
                        {t.addEx} {persistToGlobal && <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded ml-2">GLOBAL</span>}
                    </div>
                ) : (
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                autoFocus
                                enterKeyHint="search"
                                type="text"
                                placeholder={t.searchPlaceholder}
                                aria-label={pickLang(lang, { es: 'Buscar ejercicios', en: 'Search exercises' })}
                                className="gl-input py-2 pl-9 pr-4 font-medium"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCreateStart}
                            aria-label={pickLang(lang, { es: 'Añadir nuevo ejercicio', en: 'Add new exercise' })}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-black shadow-md shadow-primary-500/20 transition-transform duration-fast active:scale-95"
                        >
                            <Icon name="Plus" size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Switcher */}
            {isCreating ? (
                <div className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+var(--safe-area-bottom))] scroll-container flex flex-col">
                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-muted">{t.exName}</label>
                            <input
                                autoFocus
                                enterKeyHint="next"
                                type="text"
                                className="gl-input font-medium"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-muted">{t.selectMuscle}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(MUSCLE_GROUPS).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setNewMuscle(m)}
                                    className={`min-h-[44px] rounded-xl border p-3 text-xs font-bold transition-all ${newMuscle === m ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'}`}
                                    >
                                        {TRANSLATIONS[lang].muscle[m]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-4">
                            <input 
                                type="checkbox" 
                                id="isBW"
                                checked={isBodyweight}
                                onChange={e => setIsBodyweight(e.target.checked)}
                                className="w-5 h-5 accent-primary-500"
                            />
                            <label htmlFor="isBW" className="cursor-pointer text-sm font-bold text-[rgb(var(--text-secondary))]">{t.profile.isBW}</label>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-muted mb-2 block">
                                {TRANSLATIONS[lang].copy.exerciseSelector.tonnageCalculation}
                            </label>
                            <div className="grid gap-2">
                                <button type="button" onClick={() => setVolumeCountingMode('total')} aria-pressed={volumeCountingMode === 'total'} className={`min-h-[56px] rounded-xl border p-3 text-left ${volumeCountingMode === 'total' ? 'border-primary-500 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))]'}`}>
                                    <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{TRANSLATIONS[lang].copy.exerciseSelector.recordedTotal1}</span>
                                    <span className="mt-1 block text-xs text-muted">{TRANSLATIONS[lang].copy.exerciseSelector.barsBilateralMachinesOr}</span>

                                </button>
                                <button type="button" onClick={() => setVolumeCountingMode('per_side')} aria-pressed={volumeCountingMode === 'per_side'} className={`min-h-[56px] rounded-xl border p-3 text-left ${volumeCountingMode === 'per_side' ? 'border-primary-500 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))]'}`}>
                                    <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{TRANSLATIONS[lang].copy.exerciseSelector.perSide2}</span>
                                    <span className="mt-1 block text-xs text-muted">{TRANSLATIONS[lang].copy.exerciseSelector.whenLoadAndReps}</span>

                                </button>
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
                    <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-2 scroll-container">
                        <button
                            onClick={() => setFilterMuscle('ALL')}
                            aria-pressed={filterMuscle === 'ALL'}
                            className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${filterMuscle === 'ALL' ? 'bg-primary-500 text-black shadow-sm' : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'}`}
                        >
                            {t.any}
                        </button>
                        {Object.values(MUSCLE_GROUPS).map(m => (
                            <button
                                key={m}
                                onClick={() => setFilterMuscle(m)}
                                aria-pressed={filterMuscle === m}
                                className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${filterMuscle === m ? 'border border-primary-500/40 bg-primary-500/20 text-primary-500' : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))]'}`}
                            >
                                {TRANSLATIONS[lang].muscle[m]}
                            </button>
                        ))}
                    </div>

                    {/* Virtualized List */}
                    <div className="flex-1 overflow-hidden" data-vaul-no-drag>
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface-elevated))]">
                                    <Icon name="Dumbbell" size={28} className="text-muted" />

                                </div>
                                <div>
                                    <p className="mb-1 text-base font-bold text-[rgb(var(--text-primary))]">
                                        {search ? pickLang(lang, { es: `Sin resultados para "${search}"`, en: `No results for "${search}"` }) : (t.noExFound || pickLang(lang, { es: 'Sin ejercicios', en: 'No exercises' }))}
                                    </p>
                                    <p className="text-sm text-muted">
                                        {TRANSLATIONS[lang].copy.exerciseSelector.searchByNameOr}
                                    </p>
                                </div>
                                <Button onClick={handleCreateStart}>
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
        </Sheet>
    );
};
