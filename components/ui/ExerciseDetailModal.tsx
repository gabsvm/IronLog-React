import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MUSCLE_GROUPS, TRANSLATIONS } from '../../constants';
import { EquipmentType, ExerciseDef, GlobalTemplate, Log, MuscleGroup, ProgramDay, SessionExercise, VolumeCountingMode } from '../../types';
import { Icon } from './Icon';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { ALL_EQUIPMENT_TYPES, getEquipmentLabel, inferExerciseEquipment } from '../../utils/equipment';
import { resolveWeightUnit, toDisplay, unitLabel } from '../../utils/units';
import { exerciseIdGroup } from '../../utils/exerciseLibrary';
import { statsCache } from '../../services/statsCache';
import { triggerHaptic } from '../../utils/audio';
import { Button } from './Button';
import { ProgressChart } from '../stats/ProgressChart';
import { Sheet } from './Sheet';
import { useStatsWorker } from '../../hooks/useStatsWorker';
import { resolveMuscleLabel } from '../../utils/muscle';
import { useStore } from '../../lib/store';
import { getExerciseSfrCue } from '../../utils/rpExerciseCues';
import { getExerciseSfrScore, hasJointPainWarning, loadExerciseSfrHistory } from '../../utils/rpAutoregulation';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export type ExerciseDetailTab = 'guide' | 'edit' | 'history';

export function extractYouTubeVideoId(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const directMatch = trimmed.match(/^([A-Za-z0-9_-]{11})$/);
    if (directMatch) return directMatch[1];
    const urlMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    return undefined;
}

interface ExerciseDetailModalProps {
    exercise: ExerciseDef;
    onClose: () => void;
    initialTab?: ExerciseDetailTab;
}

// Muscle → color map for the visual hint card
const MUSCLE_COLORS: Record<string, string> = {
    CHEST: 'from-red-900/40 to-zinc-900',
    BACK: 'from-blue-900/40 to-zinc-900',
    SHOULDERS: 'from-yellow-900/40 to-zinc-900',
    BICEPS: 'from-purple-900/40 to-zinc-900',
    TRICEPS: 'from-orange-900/40 to-zinc-900',
    QUADS: 'from-green-900/40 to-zinc-900',
    HAMSTRINGS: 'from-teal-900/40 to-zinc-900',
    GLUTES: 'from-pink-900/40 to-zinc-900',
    CALVES: 'from-lime-900/40 to-zinc-900',
    TRAPS: 'from-sky-900/40 to-zinc-900',
    ABS: 'from-amber-900/40 to-zinc-900',
    CARDIO: 'from-cyan-900/40 to-zinc-900',
};

const MUSCLE_ICONS: Record<string, string> = {
    CHEST: 'Layers', BACK: 'Layout', SHOULDERS: 'Zap', BICEPS: 'TrendingUp',
    TRICEPS: 'TrendingDown', QUADS: 'ChevronsDown', HAMSTRINGS: 'CornerRightDown',
    GLUTES: 'CircleDot', CALVES: 'ArrowDown', TRAPS: 'Triangle', ABS: 'Crosshair',
    CARDIO: 'Activity',
};

// Visual hint component shown when there's no video
const ExerciseVisualHint: React.FC<{ exercise: ExerciseDef; lang: 'en' | 'es' }> = ({ exercise, lang }) => {
    const name = String(getTranslated(exercise.name, lang));
    const muscle = exercise.muscle || 'CHEST';
    const gradient = MUSCLE_COLORS[muscle] || 'from-zinc-800 to-zinc-900';
    const icon = MUSCLE_ICONS[muscle] || 'Dumbbell';

    // Parse exercise category from name
    const isCompound = ['Squat', 'Deadlift', 'Press', 'Row', 'Pull', 'Sentadilla', 'Peso Muerto', 'Press', 'Remo', 'Jalón']
        .some(k => name.includes(k));
    const isBodyweight = exercise.isBodyweight;
    const isCardio = muscle === 'CARDIO';

    const tags = [
        isCompound ? (TRANSLATIONS[lang].copy.exerciseDetailModal.compound) : (TRANSLATIONS[lang].copy.exerciseDetailModal.isolation),
        isBodyweight ? (TRANSLATIONS[lang].copy.exerciseDetailModal.bodyweight) : (TRANSLATIONS[lang].copy.exerciseDetailModal.weighted),
        isCardio ? 'Cardio' : (TRANSLATIONS[lang].copy.exerciseDetailModal.strength),
    ];

    return (
        <div className={`w-full aspect-video bg-gradient-to-b ${gradient} flex flex-col items-center justify-center relative overflow-hidden`}>
            {/* Background rings */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <div className="w-64 h-64 rounded-full border-2 border-white" />
                <div className="absolute w-48 h-48 rounded-full border-2 border-white" />
                <div className="absolute w-32 h-32 rounded-full border-2 border-white" />
            </div>

            {/* Center icon + muscle */}
            <div className="relative flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-[8px] bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon name={icon as any} size={32} className="text-white opacity-80" />
                </div>
                <div className="text-white font-black text-lg tracking-tight text-center px-4 leading-tight">
                    {name}
                </div>
                <div className="flex gap-2 flex-wrap justify-center px-4">
                    {tags.map((tag, i) => (
                        <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-white/80 px-2 py-0.5 rounded-[4px]">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// YouTube thumbnail card — opens video externally instead of broken embed
const YouTubeCard: React.FC<{ videoId: string; title: string; youtubeUrl: string }> = ({ videoId, title, youtubeUrl }) => {
    const [thumbError, setThumbError] = useState(false);
    // maxresdefault → hqdefault fallback
    const thumbSrc = thumbError
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
        <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full aspect-video relative bg-black overflow-hidden group cursor-pointer"
            title={title}
        >
            {/* Thumbnail */}
            <img
                src={thumbSrc}
                alt={title}
                onError={() => setThumbError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-[8px] bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                    <Icon name="Play" size={26} className="text-white ml-0.5" fill="white" />
                </div>
            </div>

            {/* "Open in YouTube" badge */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-[4px] border border-white/10">
                <Icon name="ExternalLink" size={11} />
                YouTube
            </div>

            {/* YouTube logo top-left */}
            <div className="absolute top-3 left-3">
                <div className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-[4px]">YouTube</div>
            </div>
        </a>
    );
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose, initialTab }) => {
    const appCtx = useApp() as any;
    const { lang, logs, exercises, setExercises, setLogs, setProgram, setPersonalTemplates } = appCtx;
    const config = appCtx?.config || {};
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<ExerciseDetailTab>(initialTab || 'guide');
    const [nameDraft, setNameDraft] = useState<string>(() => String(getTranslated(exercise.name, lang) || ''));
    const [muscleDraft, setMuscleDraft] = useState<MuscleGroup>(exercise.muscle || 'CHEST');
    const [equipmentDraft, setEquipmentDraft] = useState<EquipmentType>(() => inferExerciseEquipment(exercise));
    const [isBodyweightDraft, setIsBodyweightDraft] = useState<boolean>(Boolean(exercise.isBodyweight));
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>(exercise.volumeCountingMode || 'total');
    const [videoInputDraft, setVideoInputDraft] = useState<string>(exercise.videoId || '');
    const exerciseNote = (exercise as any).note || '';
    const [pinnedNoteDraft, setPinnedNoteDraft] = useState<string>(exercise.pinnedNote || exerciseNote);
    const setActiveSession = useStore(state => state.setActiveSession);

    const { isWorkerReady, calculateChartData } = useStatsWorker();
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab, exercise.id]);

    useEffect(() => {
        setNameDraft(String(getTranslated(exercise.name, lang) || ''));
        setMuscleDraft(exercise.muscle || 'CHEST');
        setEquipmentDraft(inferExerciseEquipment({
            id: exercise.id,
            name: exercise.name,
            equipment: exercise.equipment,
            isBodyweight: exercise.isBodyweight,
        }));
        setIsBodyweightDraft(Boolean(exercise.isBodyweight));
        setVolumeCountingMode(exercise.volumeCountingMode || 'total');
        setVideoInputDraft(exercise.videoId || '');
        setPinnedNoteDraft(exercise.pinnedNote || exerciseNote);
    }, [exercise.id, exercise.name, exercise.muscle, exercise.equipment, exercise.isBodyweight, exercise.volumeCountingMode, exercise.videoId, exercise.pinnedNote, exerciseNote, lang]);

    const unit = resolveWeightUnit(config);
    const uLabel = unitLabel(unit);
    const equipLabel = getEquipmentLabel(equipmentDraft, lang);

    const historySessions = useMemo(() => {
        const safeLogs = Array.isArray(logs) ? (logs as Log[]) : [];
        const groupIds = new Set(exerciseIdGroup(exercises || [], String(exercise.id)));
        const entries: Array<{ id: number; dateLabel: string; name: string; note?: string; sets: Array<{ weight: string | number; reps: string | number }> }> = [];

        const sorted = [...safeLogs]
            .filter(l => l && !l.skipped && Array.isArray(l.exercises))
            .sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));

        for (const log of sorted) {
            const matchedEx = (log.exercises || []).find(item => groupIds.has(String(item.id)));
            if (!matchedEx) continue;
            const completedSets = (matchedEx.sets || []).filter(s => s.completed && !s.skipped);
            if (completedSets.length === 0) continue;
            const ts = log.endTime || log.startTime || Date.now();
            entries.push({
                id: log.id,
                dateLabel: new Date(ts).toLocaleDateString(),
                name: log.name || pickLang(lang, { es: 'Entrenamiento', en: 'Workout' }),
                note: matchedEx.note,
                sets: completedSets.map(s => ({ weight: s.weight, reps: s.reps })),
            });
            if (entries.length >= 20) break;
        }
        return entries;
    }, [logs, exercises, exercise.id, lang]);

    useEffect(() => {
        if (activeTab === 'history' && isWorkerReady) {
            setChartLoading(true);
            const metric = muscleDraft === 'CARDIO' ? 'duration' : '1rm';
            const safeLogs = Array.isArray(logs) ? logs : [];
            // Merged duplicates share one history chart (canonical group).
            calculateChartData(safeLogs, exerciseIdGroup(exercises, String(exercise.id)), metric).then(points => {
                setChartData(points);
                setChartLoading(false);
            });
        }
        // `calculateChartData` from useStatsWorker is stable across renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isWorkerReady, exercise.id, logs, muscleDraft, exercises]);

    const translatedName = getTranslated(exercise.name, lang);
    const liveTitle = nameDraft.trim() || String(translatedName);
    const translatedInstructions = getTranslated(exercise.instructions, lang);
    const parsedVideoId = extractYouTubeVideoId(videoInputDraft);
    const activeVideoId = parsedVideoId ?? (videoInputDraft.trim() ? undefined : undefined);

    const youtubeUrl = activeVideoId
        ? `https://www.youtube.com/watch?v=${activeVideoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(liveTitle + ' technique tutorial')}`;

    const resolveUpdatedName = (existingName: ExerciseDef['name'], trimmed: string): ExerciseDef['name'] => {
        if (typeof existingName === 'object' && existingName !== null) {
            const enVal = (existingName.en || '').trim();
            const esVal = (existingName.es || '').trim();
            if (exercise.isCustom || enVal === esVal) {
                return { en: trimmed, es: trimmed };
            }
            return { ...existingName, [lang]: trimmed };
        }
        return trimmed;
    };

    const saveExerciseChanges = () => {
        const trimmedName = nameDraft.trim();
        if (!trimmedName) return;

        const trimmedPin = pinnedNoteDraft.trim() || undefined;
        const nextVideoId = extractYouTubeVideoId(videoInputDraft);
        const nextEquipment: EquipmentType = isBodyweightDraft && equipmentDraft !== 'bodyweight_loadable' && equipmentDraft !== 'bodyweight'
            ? 'bodyweight'
            : equipmentDraft;

        const patchExercise = <T extends ExerciseDef>(item: T): T => (
            item.id === exercise.id
                ? {
                    ...item,
                    name: resolveUpdatedName(item.name, trimmedName),
                    muscle: muscleDraft,
                    equipment: nextEquipment,
                    isBodyweight: isBodyweightDraft,
                    volumeCountingMode,
                    videoId: nextVideoId,
                    pinnedNote: trimmedPin,
                }
                : item
        ) as T;

        setExercises((prev: ExerciseDef[]) => (prev || []).map(patchExercise));
        setLogs((prev: Log[]) => (prev || []).map(log => ({
            ...log,
            exercises: (log.exercises || []).map(patchExercise),
        })));
        setActiveSession(session => session ? {
            ...session,
            exercises: session.exercises.map(item =>
                item.id === exercise.id
                    ? {
                        ...patchExercise(item),
                        note: trimmedPin !== undefined ? trimmedPin : (item.notePinned ? undefined : item.note),
                        notePinned: Boolean(trimmedPin),
                    }
                    : item
            ),
        } : session);

        if (typeof setProgram === 'function') {
            setProgram((prev: ProgramDay[]) => (prev || []).map(day => ({
                ...day,
                slots: (day.slots || []).map(slot =>
                    slot.exerciseId === exercise.id ? { ...slot, muscle: muscleDraft } : slot
                ),
            })));
        }

        if (typeof setPersonalTemplates === 'function') {
            setPersonalTemplates((prev: GlobalTemplate[]) => (prev || []).map(tpl => ({
                ...tpl,
                program: (tpl.program || []).map(day => ({
                    ...day,
                    slots: (day.slots || []).map(slot =>
                        slot.exerciseId === exercise.id ? { ...slot, muscle: muscleDraft } : slot
                    ),
                })),
            })));
        }

        try {
            void statsCache.invalidateChartCache?.();
        } catch {
            // Non-blocking in isolated test environments without IndexedDB
        }
        triggerHaptic('success');
        onClose();
    };

    const previewExercise: ExerciseDef = {
        ...exercise,
        name: liveTitle,
        muscle: muscleDraft,
        equipment: equipmentDraft,
        isBodyweight: isBodyweightDraft,
        volumeCountingMode,
        videoId: activeVideoId,
    };

    return (
        <Sheet
            open={true}
            onOpenChange={(o) => { if (!o) onClose(); }}
            title={liveTitle}
            description={`${resolveMuscleLabel(muscleDraft, lang)} · ${equipLabel}`}
            accent="primary"
            contentId="exercise-detail-scroll"
            dragHandleOnly
            footer={
                <div className="flex gap-3">
                    <Button fullWidth onClick={onClose} variant="secondary" className="rounded-[6px]">{t.close}</Button>
                    {(activeTab === 'guide' || activeTab === 'edit') && (
                        <Button
                            fullWidth
                            onClick={saveExerciseChanges}
                            disabled={!nameDraft.trim()}
                            data-testid="exercise-detail-save"
                            className="rounded-[6px]"
                        >
                            {TRANSLATIONS[lang].copy.exerciseDetailModal.save}
                        </Button>
                    )}
                </div>
            }
        >
            {/* 3-Way Segmented Tabs: Detail | Edit | History */}
            <div role="tablist" className="mx-4 mt-3 flex rounded-[6px] border border-border-subtle bg-surface-raised p-1">
                <button
                    type="button"
                    role="tab"
                    data-testid="exercise-tab-guide"
                    aria-selected={activeTab === 'guide'}
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 rounded-[4px] py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                        activeTab === 'guide'
                            ? 'bg-primary-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    {pickLang(lang, { es: 'Detalle', en: 'Detail' })}
                </button>
                <button
                    type="button"
                    role="tab"
                    data-testid="exercise-tab-edit"
                    aria-selected={activeTab === 'edit'}
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 rounded-[4px] py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                        activeTab === 'edit'
                            ? 'bg-primary-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    {pickLang(lang, { es: 'Editar', en: 'Edit' })}
                </button>
                <button
                    type="button"
                    role="tab"
                    data-testid="exercise-tab-history"
                    aria-selected={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 rounded-[4px] py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                        activeTab === 'history'
                            ? 'bg-primary-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    {t.history || 'History'}
                </button>
            </div>

            {/* The Sheet owns the single scroll container. Nested overflow-y-auto
                intercepted vertical touch gestures on Android, leaving the
                tonnage options trapped beneath the sticky Save footer. */}
            <div data-vaul-no-drag className="min-w-0 pb-8">
                {activeTab === 'guide' ? (
                    <>
                        {/* Video / Visual Section */}
                        <div className="mt-4 mx-4 overflow-hidden rounded-[8px] border border-border-subtle bg-black">
                            {activeVideoId ? (
                                <YouTubeCard
                                    videoId={activeVideoId}
                                    title={liveTitle}
                                    youtubeUrl={youtubeUrl}
                                />
                            ) : (
                                <ExerciseVisualHint exercise={previewExercise} lang={lang} />
                            )}
                        </div>

                        {/* Search on YouTube fallback link */}
                        {!activeVideoId && (
                            <div
                                data-testid="youtube-search-fallback-bar"
                                className="flex items-center justify-between px-4 py-2.5 mx-4 mt-2 rounded-[6px] border border-border-subtle bg-surface-raised"
                            >
                                <div className="text-xs font-semibold text-zinc-400">
                                    {TRANSLATIONS[lang].copy.exerciseDetailModal.searchTutorialOnline}
                                </div>
                                <a
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                                >
                                    <Icon name="ExternalLink" size={12} />
                                    {t.watchVideo || 'Watch Video'}
                                </a>
                            </div>
                        )}

                        {/* Instructions & Tip */}
                        <div className="p-5 space-y-5">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                                    <Icon name="FileText" size={13} /> {t.instructions}
                                </h4>
                                <div className="text-sm text-zinc-300 leading-relaxed">
                                    {translatedInstructions && translatedInstructions !== 'Unknown' ? (
                                        <p>{String(translatedInstructions)}</p>
                                    ) : (
                                        <p className="italic text-zinc-500">{t.noData}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-primary-500/10 rounded-[8px] p-4 border border-primary-500/20">
                                <div className="flex gap-3">
                                    <div className="bg-primary-500/20 p-1.5 rounded-[4px] h-fit shrink-0">
                                        <Icon name="Info" size={16} className="text-primary-400" />
                                    </div>
                                    <div className="text-sm text-primary-100">
                                        <p className="font-bold mb-1 text-primary-300">{t.executionTipTitle}</p>
                                        <p className="opacity-80 text-xs leading-relaxed">{t.executionTipText}</p>
                                    </div>
                                </div>
                            </div>

                            {muscleDraft !== 'CARDIO' && (() => {
                                const sfrCue = getExerciseSfrCue(muscleDraft);
                                const sfrHistory = loadExerciseSfrHistory();
                                const record = sfrHistory[exercise.id];
                                const sfrScore = record ? getExerciseSfrScore(record) : null;
                                const jointWarn = hasJointPainWarning(record);
                                return (
                                    <div
                                        data-testid="exercise-sfr-cue-card"
                                        className="rounded-[8px] border border-border-subtle bg-surface-raised p-4 space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-primary-300 flex items-center gap-1.5">
                                                <Icon name="Target" size={13} />
                                                <span>{pickLang(lang, { es: 'Cues RP & Optimización SFR', en: 'RP Form Cues & SFR Guide' })}</span>
                                            </h4>
                                            {sfrScore !== null && (
                                                <span className="rounded-[4px] border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-black text-emerald-300 tabular-nums">
                                                    {`SFR ${sfrScore}/10`}
                                                </span>
                                            )}
                                        </div>
                                        {jointWarn && (
                                            <div className="rounded-[6px] border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 flex items-center gap-2 text-xs font-bold text-amber-300">
                                                <Icon name="AlertTriangle" size={13} className="shrink-0" />
                                                <span>
                                                    {pickLang(lang, {
                                                        es: 'Dolor articular reciente registrado · Considerá rotar variación.',
                                                        en: 'Recent joint pain logged · Consider rotating variation.',
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="space-y-1.5 text-xs leading-relaxed">
                                            <p className="text-zinc-200">
                                                <span className="font-bold text-emerald-300">{pickLang(lang, { es: 'Cue clave:', en: 'Key cue:' })}</span>{' '}
                                                {sfrCue.cue[lang]}
                                            </p>
                                            <p className="text-zinc-300">
                                                <span className="font-bold text-amber-300">{pickLang(lang, { es: 'Error común:', en: 'Common mistake:' })}</span>{' '}
                                                {sfrCue.commonMistake[lang]}
                                            </p>
                                            <p className="text-zinc-300">
                                                <span className="font-bold text-primary-300">{pickLang(lang, { es: 'Tip articular:', en: 'Joint tip:' })}</span>{' '}
                                                {sfrCue.jointFriendlyTip[lang]}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Pinned Notes (RP Video #10 Technique & Notes) */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                        <Icon name="Edit3" size={13} /> {pickLang(lang, { es: 'Notas fijadas', en: 'Pinned notes' })}
                                    </h4>
                                    {pinnedNoteDraft.trim() && (
                                        <button
                                            type="button"
                                            onClick={() => setPinnedNoteDraft('')}
                                            className="text-xs font-semibold text-zinc-400 hover:text-white"
                                        >
                                            {pickLang(lang, { es: 'Limpiar', en: 'Clear' })}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    rows={2}
                                    value={pinnedNoteDraft}
                                    onChange={(e) => setPinnedNoteDraft(e.target.value)}
                                    placeholder={pickLang(lang, {
                                        es: 'Anota ajustes de máquina, agarre o tips técnicos fijados...',
                                        en: 'Add pinned machine setup, grip, or technique cues...',
                                    })}
                                    className="w-full rounded-[6px] border border-border-subtle bg-surface-raised p-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary-500 resize-none"
                                />
                            </div>

                            {muscleDraft !== 'CARDIO' && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                                        <Icon name="Dumbbell" size={13} /> {TRANSLATIONS[lang].copy.exerciseDetailModal.tonnageCalculation}
                                    </h4>
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            aria-pressed={volumeCountingMode === 'total'}
                                            onClick={() => setVolumeCountingMode('total')}
                                            className={`w-full text-left rounded-[6px] border p-3 transition-colors ${
                                                volumeCountingMode === 'total'
                                                    ? 'border-primary-500 bg-primary-500/10'
                                                    : 'border-border-subtle bg-surface-raised hover:border-zinc-600'
                                            }`}
                                        >
                                            <span className="block text-sm font-bold text-white">{TRANSLATIONS[lang].copy.exerciseDetailModal.recordedTotal1}</span>
                                            <span className="block mt-1 text-xs text-zinc-400">{TRANSLATIONS[lang].copy.exerciseDetailModal.forBarsBilateralMachines}</span>
                                        </button>
                                        <button
                                            type="button"
                                            aria-pressed={volumeCountingMode === 'per_side'}
                                            onClick={() => setVolumeCountingMode('per_side')}
                                            className={`w-full text-left rounded-[6px] border p-3 transition-colors ${
                                                volumeCountingMode === 'per_side'
                                                    ? 'border-primary-500 bg-primary-500/10'
                                                    : 'border-border-subtle bg-surface-raised hover:border-zinc-600'
                                            }`}
                                        >
                                            <span className="block text-sm font-bold text-white">{TRANSLATIONS[lang].copy.exerciseDetailModal.perSide2}</span>
                                            <span className="block mt-1 text-xs text-zinc-400">{TRANSLATIONS[lang].copy.exerciseDetailModal.whenYouRecordLoad}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : activeTab === 'edit' ? (
                    <div className="p-5 space-y-5" data-testid="exercise-edit-tab">
                        {/* Exercise Name */}
                        <div>
                            <label
                                htmlFor="edit-exercise-name-input"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400"
                            >
                                {t.exName}
                            </label>
                            <input
                                id="edit-exercise-name-input"
                                data-testid="edit-exercise-name"
                                type="text"
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                placeholder={pickLang(lang, { es: 'Ej: Curl de Bíceps en Polea', en: 'e.g., Cable Biceps Curl' })}
                                className="w-full min-h-11 rounded-[6px] border border-border-subtle bg-surface-raised px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-zinc-500 outline-none focus:border-primary-500 transition-colors"
                            />
                        </div>

                        {/* Muscle Group */}
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    {t.selectMuscle}
                                </span>
                                <span className="text-xs font-bold text-primary-400">
                                    {resolveMuscleLabel(muscleDraft, lang)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2" data-testid="edit-muscle-grid">
                                {Object.values(MUSCLE_GROUPS).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        data-testid={`edit-muscle-${m}`}
                                        aria-pressed={muscleDraft === m}
                                        onClick={() => setMuscleDraft(m)}
                                        className={`min-h-10 rounded-[6px] border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                            muscleDraft === m
                                                ? 'border-primary-500 bg-primary-500 text-zinc-950'
                                                : 'border-border-subtle bg-surface-raised text-zinc-300 hover:border-zinc-600 hover:text-white'
                                        }`}
                                    >
                                        {TRANSLATIONS[lang].muscle[m]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Equipment Type (9 RP categories) */}
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    {pickLang(lang, { es: 'Equipamiento / Tipo', en: 'Equipment / Type' })}
                                </span>
                                <span className="text-xs font-bold text-zinc-300">{equipLabel}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2" data-testid="edit-equipment-grid">
                                {ALL_EQUIPMENT_TYPES.map((eq) => (
                                    <button
                                        key={eq.id}
                                        type="button"
                                        data-testid={`edit-equipment-${eq.id}`}
                                        aria-pressed={equipmentDraft === eq.id}
                                        onClick={() => {
                                            setEquipmentDraft(eq.id);
                                            setIsBodyweightDraft(eq.id === 'bodyweight' || eq.id === 'bodyweight_loadable');
                                        }}
                                        className={`min-h-10 rounded-[6px] border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                            equipmentDraft === eq.id
                                                ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                                                : 'border-border-subtle bg-surface-raised text-zinc-300 hover:border-zinc-600 hover:text-white'
                                        }`}
                                    >
                                        {pickLang(lang, eq.label)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bodyweight Toggle */}
                        <label
                            htmlFor="edit-exercise-bw-checkbox"
                            className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[6px] border border-border-subtle bg-surface-raised px-3.5 py-2.5"
                        >
                            <div>
                                <span className="block text-sm font-bold text-white">
                                    {pickLang(lang, { es: 'Ejercicio de peso corporal (BW)', en: 'Bodyweight exercise (BW)' })}
                                </span>
                                <span className="block text-xs text-zinc-400">
                                    {pickLang(lang, { es: 'Usa tu peso corporal o lastre añadido', en: 'Uses bodyweight or added external load' })}
                                </span>
                            </div>
                            <input
                                id="edit-exercise-bw-checkbox"
                                data-testid="edit-exercise-bw"
                                type="checkbox"
                                checked={isBodyweightDraft}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsBodyweightDraft(checked);
                                    if (checked && equipmentDraft !== 'bodyweight' && equipmentDraft !== 'bodyweight_loadable') {
                                        setEquipmentDraft('bodyweight');
                                    } else if (!checked && (equipmentDraft === 'bodyweight' || equipmentDraft === 'bodyweight_loadable')) {
                                        setEquipmentDraft('machine');
                                    }
                                }}
                                className="h-5 w-5 accent-primary-500"
                            />
                        </label>

                        {/* Volume Counting Mode */}
                        {muscleDraft !== 'CARDIO' && (
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                                    <Icon name="Dumbbell" size={13} /> {TRANSLATIONS[lang].copy.exerciseDetailModal.tonnageCalculation}
                                </h4>
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        data-testid="edit-volume-total"
                                        aria-pressed={volumeCountingMode === 'total'}
                                        onClick={() => setVolumeCountingMode('total')}
                                        className={`w-full text-left rounded-[6px] border p-3 transition-colors ${
                                            volumeCountingMode === 'total'
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-border-subtle bg-surface-raised hover:border-zinc-600'
                                        }`}
                                    >
                                        <span className="block text-sm font-bold text-white">{TRANSLATIONS[lang].copy.exerciseDetailModal.recordedTotal1}</span>
                                        <span className="block mt-1 text-xs text-zinc-400">{TRANSLATIONS[lang].copy.exerciseDetailModal.forBarsBilateralMachines}</span>
                                    </button>
                                    <button
                                        type="button"
                                        data-testid="edit-volume-per-side"
                                        aria-pressed={volumeCountingMode === 'per_side'}
                                        onClick={() => setVolumeCountingMode('per_side')}
                                        className={`w-full text-left rounded-[6px] border p-3 transition-colors ${
                                            volumeCountingMode === 'per_side'
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-border-subtle bg-surface-raised hover:border-zinc-600'
                                        }`}
                                    >
                                        <span className="block text-sm font-bold text-white">{TRANSLATIONS[lang].copy.exerciseDetailModal.perSide2}</span>
                                        <span className="block mt-1 text-xs text-zinc-400">{TRANSLATIONS[lang].copy.exerciseDetailModal.whenYouRecordLoad}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* YouTube Video URL or ID */}
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label
                                    htmlFor="edit-exercise-video-input"
                                    className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                                >
                                    {pickLang(lang, { es: 'Video YouTube (URL o ID)', en: 'YouTube Video (URL or ID)' })}
                                </label>
                                {parsedVideoId && (
                                    <span className="text-xs font-mono font-bold text-emerald-400">{`ID: ${parsedVideoId}`}</span>
                                )}
                            </div>
                            <input
                                id="edit-exercise-video-input"
                                data-testid="edit-exercise-video"
                                type="text"
                                value={videoInputDraft}
                                onChange={(e) => setVideoInputDraft(e.target.value)}
                                placeholder="https://youtu.be/... o dQw4w9WgXcQ"
                                className="w-full min-h-11 rounded-[6px] border border-border-subtle bg-surface-raised px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary-500 transition-colors"
                            />
                        </div>

                        {/* Pinned Note */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label
                                    htmlFor="edit-exercise-pinned-note"
                                    className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                                >
                                    {pickLang(lang, { es: 'Nota técnica fijada', en: 'Pinned technique note' })}
                                </label>
                                {pinnedNoteDraft.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => setPinnedNoteDraft('')}
                                        className="text-xs font-semibold text-zinc-400 hover:text-white"
                                    >
                                        {pickLang(lang, { es: 'Limpiar', en: 'Clear' })}
                                    </button>
                                )}
                            </div>
                            <textarea
                                id="edit-exercise-pinned-note"
                                data-testid="edit-exercise-pinned-note"
                                rows={2}
                                value={pinnedNoteDraft}
                                onChange={(e) => setPinnedNoteDraft(e.target.value)}
                                placeholder={pickLang(lang, {
                                    es: 'Ajustes de banco/polea, rango 8-12 reps o cues clave...',
                                    en: 'Bench/cable setup, 8-12 rep target, or key cues...',
                                })}
                                className="w-full rounded-[6px] border border-border-subtle bg-surface-raised p-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary-500 resize-none"
                            />
                        </div>

                        {/* Live Propagation Notice */}
                        <div className="flex items-start gap-2.5 rounded-[8px] border border-primary-500/20 bg-primary-500/10 p-3 text-xs text-primary-200 leading-relaxed">
                            <Icon name="Info" size={15} className="mt-0.5 shrink-0 text-primary-400" />
                            <span>
                                {pickLang(lang, {
                                    es: 'Al guardar se actualiza la biblioteca, la sesión activa, tus rutinas/plantillas e historial sin perder tus series registradas.',
                                    en: 'Saving updates your library, active workout, routines/templates, and history without losing logged sets.',
                                })}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 space-y-4">
                        <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-4">
                            <div className="mb-4">
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{t.statsProgress}</h4>
                                <p className="text-xs text-zinc-400">
                                    {pickLang(lang, { es: '1RM Estimado / Mejor Rendimiento', en: 'Estimated 1RM / Max Performance' })}
                                </p>
                            </div>
                            <ProgressChart
                                dataPoints={chartData}
                                metric={muscleDraft === 'CARDIO' ? 'duration' : '1rm'}
                                loading={chartLoading}
                            />
                        </div>

                        {historySessions.length > 0 ? (
                            <div className="space-y-2.5" data-testid="exercise-history-log-list">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-0.5">
                                    {pickLang(lang, { es: 'Historial de sesiones', en: 'Session history' })}
                                </h4>
                                {historySessions.map((entry) => (
                                    <div key={entry.id} className="rounded-[8px] border border-border-subtle bg-surface-raised p-3.5 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-white truncate">{entry.name}</span>
                                            <span className="text-xs font-medium text-zinc-400 shrink-0 tabular-nums">{entry.dateLabel}</span>
                                        </div>
                                        {entry.note && (
                                            <p className="text-xs text-amber-300/90 italic">{entry.note}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1.5">
                                            {entry.sets.map((s, idx) => {
                                                const wNum = Number(s.weight);
                                                const shownW = Number.isFinite(wNum) ? toDisplay(wNum, unit) : s.weight;
                                                return (
                                                    <span
                                                        key={idx}
                                                        className="rounded-[4px] border border-border-subtle bg-surface-base px-2 py-0.5 font-mono text-xs font-semibold text-zinc-200 tabular-nums"
                                                    >
                                                        {shownW}{uLabel} × {s.reps}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !chartLoading && chartData.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-xs italic">
                                {t.statsNoData}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </Sheet>
    );
};
