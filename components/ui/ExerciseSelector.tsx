import React, { useDeferredValue, useMemo, useState } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from './Icon';
import { MuscleGroup, ExerciseDef, VolumeCountingMode } from '../../types';
import { Button } from './Button';
import { getTranslated } from '../../utils';
import { Virtuoso } from 'react-virtuoso';
import { Sheet } from './Sheet';
import { getFirebaseFirestoreServices } from '../../lib/firebaseLoader';

interface ExerciseSelectorProps {
    onSelect: (exId: string, exercise?: ExerciseDef) => void;
    onClose: () => void;
    excludeIds?: string[];
    persistToGlobal?: boolean;
    presetMuscle?: MuscleGroup;
    sourceFilter?: 'nilsson_bw';
}

type LibraryMode = 'all' | 'recent' | 'favorites';
const FAVORITES_KEY = 'gainslab.exercise.favorites';
const RECENTS_KEY = 'gainslab.exercise.recents';

const readIds = (key: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const value = JSON.parse(window.localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

const writeIds = (key: string, ids: string[]) => {
    try { window.localStorage.setItem(key, JSON.stringify(ids)); } catch { }
};

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
    onSelect,
    onClose,
    excludeIds = [],
    persistToGlobal = false,
    presetMuscle,
    sourceFilter,
}) => {
    const { exercises, setExercises } = useApp();
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>(presetMuscle || 'ALL');
    const [mode, setMode] = useState<LibraryMode>('all');
    const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readIds(FAVORITES_KEY));
    const [recentIds, setRecentIds] = useState<string[]>(() => readIds(RECENTS_KEY));

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');
    const [isBodyweight, setIsBodyweight] = useState(false);
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>('total');

    const recentRank = useMemo(() => new Map(recentIds.map((id, index) => [id, index])), [recentIds]);
    const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

    const filtered = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase();
        return exercises
            .filter(ex => !excludeIds.includes(ex.id))
            .filter(ex => {
                if (sourceFilter) return (ex as any).source === sourceFilter;
                const isNilsson = (ex as any).source === 'nilsson_bw';
                const isSpecialCatalog = ex.id.startsWith('cf_') || ex.id.startsWith('cal_');
                return !isNilsson && !isSpecialCatalog;
            })
            .filter(ex => mode === 'favorites' ? favoriteSet.has(ex.id) : mode === 'recent' ? recentRank.has(ex.id) : true)
            .filter(ex => filterMuscle === 'ALL' || ex.muscle === filterMuscle)
            .filter(ex => !q || getTranslated(ex.name, lang).toLowerCase().includes(q))
            .sort((a, b) => {
                if (mode === 'recent') return (recentRank.get(a.id) ?? 999) - (recentRank.get(b.id) ?? 999);
                const favDelta = Number(favoriteSet.has(b.id)) - Number(favoriteSet.has(a.id));
                if (favDelta) return favDelta;
                return getTranslated(a.name, lang).localeCompare(getTranslated(b.name, lang));
            });
    }, [deferredSearch, excludeIds, exercises, favoriteSet, filterMuscle, lang, mode, recentRank, sourceFilter]);

    const rememberRecent = (id: string) => {
        setRecentIds(prev => {
            const next = [id, ...prev.filter(item => item !== id)].slice(0, 12);
            writeIds(RECENTS_KEY, next);
            return next;
        });
    };

    const selectExercise = (exercise: ExerciseDef) => {
        rememberRecent(exercise.id);
        onSelect(exercise.id, exercise);
    };

    const toggleFavorite = (id: string) => {
        setFavoriteIds(prev => {
            const next = prev.includes(id) ? prev.filter(item => item !== id) : [id, ...prev];
            writeIds(FAVORITES_KEY, next);
            return next;
        });
    };

    const handleCreateStart = () => {
        setNewName(search);
        if (filterMuscle !== 'ALL') setNewMuscle(filterMuscle);
        setIsCreating(true);
    };

    const handleCreateSave = async () => {
        if (!newName.trim()) return;
        let newId: string;
        if (persistToGlobal) {
            const slug = newName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
            newId = `${newMuscle.toLowerCase()}_${slug}`;
        } else {
            newId = `custom_${Date.now()}`;
        }

        const newEx: ExerciseDef = {
            id: newId,
            name: { en: newName.trim(), es: newName.trim() },
            muscle: newMuscle,
            isBodyweight,
            volumeCountingMode,
        };
        setExercises(prev => [...prev, newEx]);

        if (persistToGlobal) {
            try {
                const { db, firestoreApi } = await getFirebaseFirestoreServices();
                if (db) await firestoreApi.setDoc(firestoreApi.doc(db, 'global_exercises', newId), newEx);
            } catch (error) {
                console.error('Failed to save global exercise:', error);
                window.alert(lang === 'es' ? 'No se pudo guardar el ejercicio global.' : 'Failed to save the global exercise.');
                return;
            }
        }

        rememberRecent(newId);
        onSelect(newId, newEx);
    };

    const Row = (_index: number, ex: ExerciseDef) => {
        const favorite = favoriteSet.has(ex.id);
        const recent = recentRank.has(ex.id);
        return (
            <div className="px-2 py-0.5">
                <div className="flex min-h-[58px] items-center rounded-xl border border-transparent px-2 transition-colors active:bg-[rgb(var(--surface-raised))]">
                    <button type="button" onClick={() => selectExercise(ex)} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]">
                            <Icon name={ex.isBodyweight ? 'User' : 'Dumbbell'} size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-[rgb(var(--text-primary))]">{getTranslated(ex.name, lang)}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-[rgb(var(--text-muted))]">
                                <span>{TRANSLATIONS[lang].muscle[ex.muscle]}</span>
                                {ex.isBodyweight && <><span>·</span><span>BW</span></>}
                                {recent && mode !== 'recent' && <><span>·</span><span>{lang === 'es' ? 'Reciente' : 'Recent'}</span></>}
                            </span>
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); toggleFavorite(ex.id); }}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors active:scale-95 ${favorite ? 'text-amber-500' : 'text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-raised))]'}`}
                        aria-label={favorite ? (lang === 'es' ? 'Quitar de favoritos' : 'Remove favorite') : (lang === 'es' ? 'Agregar a favoritos' : 'Add favorite')}
                    >
                        <Icon name="Star" size={18} fill={favorite ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }} variant="full" hideCloseButton description={persistToGlobal ? 'Global exercise library admin' : 'Exercise picker'} accent="primary">
            <div className="flex h-full flex-col bg-[rgb(var(--surface-app))]">
                <div className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-app)/0.97)] px-4 pt-safe">
                    <div className="flex h-14 items-center gap-2.5">
                        <button type="button" onClick={isCreating ? () => setIsCreating(false) : onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-raised))]" aria-label={isCreating ? (lang === 'es' ? 'Volver' : 'Back') : (lang === 'es' ? 'Cerrar' : 'Close')}>
                            <Icon name={isCreating ? 'ChevronLeft' : 'X'} size={21} />
                        </button>

                        {isCreating ? (
                            <div className="min-w-0 flex-1"><div className="truncate text-base font-black">{lang === 'es' ? 'Crear ejercicio' : 'Create exercise'}</div>{persistToGlobal && <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary-500">GLOBAL</div>}</div>
                        ) : (
                            <>
                                <div className="relative min-w-0 flex-1">
                                    <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                                    <input autoFocus type="search" placeholder={t.searchPlaceholder} aria-label={lang === 'es' ? 'Buscar ejercicios' : 'Search exercises'} className="h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.7)] pl-9 pr-3 text-sm font-medium outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/45 focus:ring-2 focus:ring-primary-500/10" value={search} onChange={event => setSearch(event.target.value)} />
                                </div>
                                <button type="button" onClick={handleCreateStart} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-black active:scale-95" aria-label={lang === 'es' ? 'Crear ejercicio' : 'Create exercise'}><Icon name="Plus" size={19} /></button>
                            </>
                        )}
                    </div>

                    {!isCreating && !sourceFilter && (
                        <div className="flex gap-1 pb-3">
                            {([
                                ['all', lang === 'es' ? 'Todos' : 'All', 'List'],
                                ['recent', lang === 'es' ? 'Recientes' : 'Recent', 'Clock'],
                                ['favorites', lang === 'es' ? 'Favoritos' : 'Favorites', 'Star'],
                            ] as Array<[LibraryMode, string, string]>).map(([id, label, icon]) => (
                                <button key={id} type="button" onClick={() => setMode(id)} className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition-colors ${mode === id ? 'bg-primary-500/12 text-primary-500' : 'text-[rgb(var(--text-muted))]'}`}>
                                    <Icon name={icon as any} size={13} /> {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {isCreating ? (
                    <div className="flex-1 overflow-y-auto p-5 scroll-container">
                        <div className="mx-auto max-w-lg space-y-5">
                            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{t.exName}</label><input type="text" className="h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 text-sm font-semibold outline-none focus:border-primary-500/45 focus:ring-2 focus:ring-primary-500/10" value={newName} onChange={event => setNewName(event.target.value)} autoFocus /></div>

                            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{t.selectMuscle}</label><div className="grid grid-cols-2 gap-2">{(Object.values(MUSCLE_GROUPS) as MuscleGroup[]).map(muscle => <button key={muscle} type="button" onClick={() => setNewMuscle(muscle)} className={`min-h-11 rounded-xl border px-2 text-xs font-bold ${newMuscle === muscle ? 'border-primary-500/30 bg-primary-500/10 text-primary-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)] text-[rgb(var(--text-muted))]'}`}>{TRANSLATIONS[lang].muscle[muscle]}</button>)}</div></div>

                            <button type="button" onClick={() => setIsBodyweight(value => !value)} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)] px-4 text-left"><span><span className="block text-sm font-bold">{t.profile.isBW}</span><span className="mt-0.5 block text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Registra reps y lastre opcional.' : 'Track reps with optional added load.'}</span></span><span className={`h-5 w-9 rounded-full p-0.5 ${isBodyweight ? 'bg-primary-500' : 'bg-[rgb(var(--surface-elevated))]'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${isBodyweight ? 'translate-x-4' : ''}`} /></span></button>

                            <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Cálculo de tonelaje' : 'Tonnage calculation'}</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setVolumeCountingMode('total')} className={`min-h-20 rounded-xl border p-3 text-left ${volumeCountingMode === 'total' ? 'border-primary-500/30 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)]'}`}><span className="block text-sm font-black">×1 Total</span><span className="mt-1 block text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Carga total registrada.' : 'Recorded total load.'}</span></button><button type="button" onClick={() => setVolumeCountingMode('per_side')} className={`min-h-20 rounded-xl border p-3 text-left ${volumeCountingMode === 'per_side' ? 'border-primary-500/30 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)]'}`}><span className="block text-sm font-black">×2 Por lado</span><span className="mt-1 block text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Carga anotada por lado.' : 'Load logged per side.'}</span></button></div></div>

                            <div className="grid grid-cols-2 gap-3 pt-2"><Button variant="secondary" onClick={() => setIsCreating(false)}>{t.cancel}</Button><Button onClick={handleCreateSave} disabled={!newName.trim()}>{t.createAndSelect}</Button></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="shrink-0 overflow-x-auto border-b border-[rgb(var(--border-subtle)/0.65)] px-3 py-2 scroll-container">
                            <div className="flex gap-1.5">
                                <button type="button" onClick={() => setFilterMuscle('ALL')} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${filterMuscle === 'ALL' ? 'bg-[rgb(var(--text-primary))] text-[rgb(var(--surface-app))]' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{t.any}</button>
                                {(Object.values(MUSCLE_GROUPS) as MuscleGroup[]).map(muscle => <button key={muscle} type="button" onClick={() => setFilterMuscle(muscle)} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${filterMuscle === muscle ? 'bg-primary-500 text-black' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{TRANSLATIONS[lang].muscle[muscle]}</button>)}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1">
                            {filtered.length ? (
                                <Virtuoso style={{ height: '100%' }} data={filtered} itemContent={Row} components={{ Footer: () => <div className="px-4 pb-10 pt-4"><Button variant="secondary" onClick={handleCreateStart} fullWidth className="border-dashed"><Icon name="Plus" size={14} /> {t.createEx} {search ? `“${search}”` : ''}</Button></div> }} />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center px-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]"><Icon name={mode === 'favorites' ? 'Star' : mode === 'recent' ? 'Clock' : 'Search'} size={23} /></div><p className="mt-4 text-sm font-black">{mode === 'favorites' ? (lang === 'es' ? 'Aún no tienes favoritos' : 'No favorites yet') : mode === 'recent' ? (lang === 'es' ? 'Aún no hay recientes' : 'No recent exercises yet') : search ? (lang === 'es' ? `Sin resultados para “${search}”` : `No results for “${search}”`) : (t.noExFound || (lang === 'es' ? 'Sin ejercicios' : 'No exercises'))}</p><p className="mt-1 max-w-[250px] text-xs text-[rgb(var(--text-muted))]">{mode === 'favorites' ? (lang === 'es' ? 'Marca la estrella de un ejercicio para fijarlo aquí.' : 'Tap the star on an exercise to pin it here.') : mode === 'recent' ? (lang === 'es' ? 'Los ejercicios que uses aparecerán aquí automáticamente.' : 'Exercises you use will appear here automatically.') : (lang === 'es' ? 'Cambia los filtros o crea un ejercicio nuevo.' : 'Change filters or create a new exercise.')}</p>{mode === 'all' && <Button onClick={handleCreateStart} className="mt-4"><Icon name="Plus" size={14} /> {lang === 'es' ? 'Crear ejercicio' : 'Create exercise'}</Button>}</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Sheet>
    );
};
