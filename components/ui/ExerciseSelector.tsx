import React, { Suspense, useState, useMemo, useDeferredValue } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from './Icon';
import { MuscleTag } from './MuscleTag';
import { resolveMuscleLabel } from '../../utils/muscle';
import { MuscleGroup, ExerciseDef, VolumeCountingMode, EquipmentType } from '../../types';
import { Button } from './Button';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { isSelectorVisible, matchesExerciseQuery } from '../../utils/exerciseLibrary';
import { ALL_EQUIPMENT_TYPES, getEquipmentLabel, inferExerciseEquipment, recommendExercisesForMuscle } from '../../utils/equipment';
import { Virtuoso } from 'react-virtuoso';
import { Sheet } from './Sheet';
import { getFirebaseFirestoreServices } from '../../lib/firebaseLoader';

const ExerciseDetailModal = React.lazy(() =>
    import('./ExerciseDetailModal').then(m => ({ default: m.ExerciseDetailModal }))
);

interface ExerciseSelectorProps {
    onSelect: (exId: string, exercise?: ExerciseDef) => void;
    onClose: () => void;
    excludeIds?: string[];
    persistToGlobal?: boolean; // New Prop for Admin Mode
    presetMuscle?: MuscleGroup;            // Open with this muscle filter
    sourceFilter?: 'nilsson_bw';           // Restrict list to a source tag (e.g. Nilsson BW)
    mode?: 'pick' | 'replace';
    onReplaceConfirm?: (exId: string, exercise: ExerciseDef | undefined, repeatForMeso: boolean) => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
    onSelect,
    onClose,
    excludeIds = [],
    persistToGlobal = false,
    presetMuscle,
    sourceFilter,
    mode = 'pick',
    onReplaceConfirm,
}) => {
    const appCtx = useApp() as any;
    const { exercises, setExercises } = appCtx;
    const config = appCtx?.config || {};
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];

    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>(presetMuscle || 'ALL');
    const [filterCustomOnly, setFilterCustomOnly] = useState(false);
    const [showEquipBar, setShowEquipBar] = useState<boolean>(Boolean(config?.useExerciseTypeFilters));
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | 'ALL'>('ALL');
    const [recommendMode, setRecommendMode] = useState(false);

    // Replace mode selection + preview modal
    const [selectedReplaceId, setSelectedReplaceId] = useState<string | null>(null);
    const [repeatForMeso, setRepeatForMeso] = useState<boolean>(true);
    const [previewExercise, setPreviewExercise] = useState<ExerciseDef | null>(null);

    // Creation Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>(presetMuscle || 'CHEST');
    const [newEquipment, setNewEquipment] = useState<EquipmentType>('machine');
    const [isBodyweight, setIsBodyweight] = useState(false);
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>('total');

    const preferredEquipmentList: EquipmentType[] | undefined = config?.useExerciseTypeFilters && Array.isArray(config?.preferredEquipment) && config.preferredEquipment.length > 0
        ? config.preferredEquipment
        : undefined;

    const filtered = useMemo(() => {
        const base = (exercises as ExerciseDef[])
            .filter(ex => !excludeIds.includes(ex.id))
            .filter(ex => !ex.archived)
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
                const matchesSearch = matchesExerciseQuery(ex, deferredSearch);
                const matchesMuscle = filterMuscle === 'ALL' || ex.muscle === filterMuscle;
                const matchesCustom = !filterCustomOnly || Boolean(ex.isCustom);
                const eq = inferExerciseEquipment(ex);
                const matchesEquip = selectedEquipment === 'ALL' ? true : eq === selectedEquipment;
                const matchesPref = !preferredEquipmentList || selectedEquipment !== 'ALL' || preferredEquipmentList.includes(eq) || Boolean(deferredSearch.trim());
                return matchesSearch && matchesMuscle && matchesCustom && matchesEquip && matchesPref;
            });

        if (recommendMode && filterMuscle !== 'ALL') {
            return recommendExercisesForMuscle(base, filterMuscle, preferredEquipmentList, excludeIds, lang);
        }

        return base.sort((a, b) => {
            const na = getTranslated(a.name, lang);
            const nb = getTranslated(b.name, lang);
            return na.localeCompare(nb);
        });
    }, [exercises, deferredSearch, filterMuscle, filterCustomOnly, selectedEquipment, preferredEquipmentList, recommendMode, lang, excludeIds, sourceFilter]);

    const handleCreateStart = () => {
        setNewName(search);
        if (filterMuscle !== 'ALL') {
            setNewMuscle(filterMuscle);
        }
        setIsCreating(true);
    };

    const handleCreateSave = async () => {
        if (!newName.trim()) return;

        let newId: string;
        if (persistToGlobal) {
            const slug = newName.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '_');
            newId = `${newMuscle.toLowerCase()}_${slug}`;
        } else {
            newId = `custom_${Date.now()}`;
        }

        const newEx: ExerciseDef = {
            id: newId,
            name: { en: newName, es: newName },
            muscle: newMuscle,
            equipment: isBodyweight ? 'bodyweight' : newEquipment,
            isCustom: !persistToGlobal,
            isBodyweight,
            volumeCountingMode,
        };

        setExercises((prev: ExerciseDef[]) => [...prev, newEx]);

        if (persistToGlobal) {
            try {
                const { db, firestoreApi } = await getFirebaseFirestoreServices();
                if (db) {
                    await firestoreApi.setDoc(firestoreApi.doc(db, "global_exercises", newId), newEx);
                }
            } catch (e) {
                console.error("Failed to save global exercise:", e);
            }
        }

        if (mode === 'replace') {
            setIsCreating(false);
            setSelectedReplaceId(newId);
        } else {
            onSelect(newId, newEx);
        }
    };

    const handleConfirmReplace = () => {
        if (!selectedReplaceId) return;
        const chosen = (exercises as ExerciseDef[]).find(e => e.id === selectedReplaceId);
        if (onReplaceConfirm) {
            onReplaceConfirm(selectedReplaceId, chosen, repeatForMeso);
        } else {
            onSelect(selectedReplaceId, chosen);
        }
    };

    const Row = (_index: number, ex: ExerciseDef) => {
        const eq = inferExerciseEquipment(ex);
        const eqLabel = getEquipmentLabel(eq, lang);
        const muscleLabel = resolveMuscleLabel(ex.muscle, lang);
        const isSelected = mode === 'replace' && selectedReplaceId === ex.id;

        return (
            <div className="px-3 py-1">
                <div
                    className={`group flex w-full items-center gap-2 rounded-[6px] border p-2.5 transition-colors mb-1 ${
                        isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-border-subtle bg-surface-raised hover:border-primary-500/40'
                    }`}
                >
                    <button
                        type="button"
                        role={mode === 'replace' ? 'radio' : undefined}
                        aria-checked={mode === 'replace' ? isSelected : undefined}
                        onClick={() => {
                            if (mode === 'replace') {
                                setSelectedReplaceId(ex.id);
                            } else {
                                onSelect(ex.id, ex);
                            }
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                        {mode === 'replace' && (
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                    isSelected ? 'border-primary-500' : 'border-zinc-500'
                                }`}
                            >
                                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
                            </span>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <MuscleTag label={muscleLabel} muscle={ex.muscle} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    · {eqLabel}
                                </span>
                                {ex.isBodyweight && (
                                    <span className="inline-flex items-center rounded-[4px] border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-300">
                                        BW
                                    </span>
                                )}
                                {ex.isCustom && (
                                    <span className="inline-flex items-center rounded-[4px] border border-violet-500/30 bg-violet-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-violet-300">
                                        CUSTOM
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
                    </button>

                    {/* Preview Detail/History button (>) — opens without losing selection */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewExercise(ex);
                        }}
                        aria-label={pickLang(lang, {
                            es: `Vista previa de ${getTranslated(ex.name, lang)}`,
                            en: `Preview ${getTranslated(ex.name, lang)}`,
                        })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-zinc-400 hover:bg-surface-base hover:text-white transition-colors"
                    >
                        <Icon name={mode === 'replace' ? 'ChevronRight' : 'Plus'} size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Sheet
                open={true}
                onOpenChange={(o) => { if (!o) onClose(); }}
                variant="full"
                hideCloseButton
                description={
                    persistToGlobal
                        ? pickLang(lang, { es: 'Administrador de biblioteca global de ejercicios', en: 'Global exercise library admin' })
                        : mode === 'replace'
                        ? pickLang(lang, { es: 'Reemplazar ejercicio', en: 'Replace exercise' })
                        : pickLang(lang, { es: 'Selector de ejercicios', en: 'Exercise picker' })
                }
                accent="primary"
            >
                <div className="flex flex-col h-full bg-surface-app">
                    {/* Custom Header */}
                    <div className={`px-4 h-16 shrink-0 flex items-center gap-2.5 border-b border-border-subtle bg-surface-base/95 backdrop-blur-md ${persistToGlobal ? 'bg-primary-500/10' : ''}`}>
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
                                {/* Purple ⚡ Recommend Button (RP Video #9) */}
                                <button
                                    type="button"
                                    data-testid="selector-recommend-btn"
                                    onClick={() => setRecommendMode(prev => !prev)}
                                    aria-pressed={recommendMode}
                                    aria-label={pickLang(lang, { es: 'Recomendar ejercicios', en: 'Recommend exercises' })}
                                    title={pickLang(lang, { es: 'Recomendar ejercicios', en: 'Recommend exercises' })}
                                    className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-[6px] border transition-all active:scale-95 ${
                                        recommendMode
                                            ? 'bg-violet-500 border-violet-400 text-white shadow-sm'
                                            : 'bg-violet-500/15 border-violet-500/40 text-violet-300 hover:bg-violet-500/25'
                                    }`}
                                >
                                    <Icon name="Zap" size={18} />
                                </button>
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
                                                type="button"
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

                                {/* Equipment selector (9 RP types) */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                                        {pickLang(lang, { es: 'Equipamiento / Tipo', en: 'Equipment / Exercise type' })}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ALL_EQUIPMENT_TYPES.map((eq) => (
                                            <button
                                                key={eq.id}
                                                type="button"
                                                onClick={() => {
                                                    setNewEquipment(eq.id);
                                                    setIsBodyweight(eq.id === 'bodyweight' || eq.id === 'bodyweight_loadable');
                                                }}
                                                className={`rounded-[4px] px-2.5 py-1.5 text-xs font-bold border transition-colors ${
                                                    newEquipment === eq.id
                                                        ? 'bg-primary-500 border-primary-500 text-zinc-950'
                                                        : 'bg-surface-base border-border-subtle text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {pickLang(lang, eq.label)}
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
                            {/* Filter Row 1: Muscle + Custom + Equipment Toggle */}
                            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface-base px-2.5 py-2 no-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setFilterCustomOnly(prev => !prev)}
                                    className={`shrink-0 whitespace-nowrap rounded-[4px] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                        filterCustomOnly
                                            ? 'bg-violet-500 text-white'
                                            : 'bg-surface-raised border border-border-subtle text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    CUSTOM
                                </button>
                                <button
                                    type="button"
                                    data-testid="selector-equip-toggle"
                                    onClick={() => setShowEquipBar(prev => !prev)}
                                    className={`shrink-0 whitespace-nowrap rounded-[4px] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                        selectedEquipment !== 'ALL' || showEquipBar
                                            ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                                            : 'bg-surface-raised border border-border-subtle text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {selectedEquipment === 'ALL' ? pickLang(lang, { es: '+9 EQUIPOS', en: '+9 TYPES' }) : getEquipmentLabel(selectedEquipment, lang)}
                                </button>
                                <button
                                    type="button"
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
                                        type="button"
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

                            {/* Collapsible 9-Equipment Filter Bar */}
                            {showEquipBar && (
                                <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface-raised/60 px-2.5 py-2 no-scrollbar" data-testid="selector-equipment-chips">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEquipment('ALL')}
                                        className={`shrink-0 rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                            selectedEquipment === 'ALL'
                                                ? 'bg-white text-zinc-950 font-black'
                                                : 'bg-surface-base border border-border-subtle text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {pickLang(lang, { es: 'Todos', en: 'All types' })}
                                    </button>
                                    {ALL_EQUIPMENT_TYPES.map(eq => (
                                        <button
                                            type="button"
                                            key={eq.id}
                                            onClick={() => setSelectedEquipment(eq.id)}
                                            className={`shrink-0 rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                                selectedEquipment === eq.id
                                                    ? 'bg-primary-500 text-zinc-950 font-black'
                                                    : 'bg-surface-base border border-border-subtle text-zinc-400 hover:text-white'
                                            }`}
                                        >
                                            {pickLang(lang, eq.label)}
                                        </button>
                                    ))}
                                </div>
                            )}

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

                            {/* Replace Mode Sticky Footer: [✓] Repeat + CANCEL + REPLACE */}
                            {mode === 'replace' && (
                                <div
                                    data-testid="selector-replace-footer"
                                    className="shrink-0 border-t border-border-subtle bg-surface-base px-4 py-3 pb-safe flex items-center justify-between gap-3"
                                >
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200">
                                        <input
                                            type="checkbox"
                                            checked={repeatForMeso}
                                            onChange={e => setRepeatForMeso(e.target.checked)}
                                            className="h-4 w-4 accent-emerald-500 rounded"
                                        />
                                        <span>{pickLang(lang, { es: 'Repetir en el ciclo', en: 'Repeat' })}</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" onClick={onClose}>
                                            {t.cancel}
                                        </Button>
                                        <Button
                                            data-testid="selector-replace-confirm-btn"
                                            disabled={!selectedReplaceId}
                                            onClick={handleConfirmReplace}
                                        >
                                            {pickLang(lang, { es: 'Reemplazar', en: 'Replace' })}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Sheet>

            {previewExercise && (
                <Suspense fallback={null}>
                    <ExerciseDetailModal
                        exercise={previewExercise}
                        onClose={() => setPreviewExercise(null)}
                    />
                </Suspense>
            )}
        </>
    );
};
