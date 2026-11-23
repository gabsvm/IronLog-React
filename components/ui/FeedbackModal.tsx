import React, { useMemo, useState, useEffect } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup, SorenessCheckin } from '../../types';
import { useStore } from '../../lib/store';
import { Icon } from './Icon';
import { pickLang } from '../../utils/i18n';
import {
    computePriorityAwareSetDelta,
    explainPriorityAwareSetDelta,
    recordExerciseSfrFeedback,
} from '../../utils/rpAutoregulation';

interface FeedbackModalProps {
    muscles: (MuscleGroup | string)[];
    exerciseIdsByMuscle?: Record<string, string[]>;
    exercisesByMuscle?: Record<string, { id: string; name: string }[]>;
    sessionWeek?: number;
    prefilledSoreness?: Record<string, SorenessCheckin>;
    prefilledJointPain?: Record<string, number>;
    onConfirm: (feedback: Record<string, { soreness: number; performance: number; adjustment: number }>) => void;
    onCancel: () => void;
}

interface MuscleFeedbackData {
    jointPain?: number; // 0..3
    soreness?: number;  // 0..3
    pump?: number;      // 0..2
    volume?: number;    // 0..3
}

type FeedbackState = Record<string, MuscleFeedbackData>;
type HelpSectionKey = 'joint' | 'soreness' | 'pump' | 'volume';

const isMuscleAnswered = (data?: MuscleFeedbackData): data is Required<MuscleFeedbackData> => {
    if (!data) return false;
    return (
        typeof data.jointPain === 'number' &&
        typeof data.soreness === 'number' &&
        typeof data.pump === 'number' &&
        typeof data.volume === 'number'
    );
};

const computePerformance = (volume: number, jointPain: number): number => {
    if (jointPain === 3) return 3;
    return volume;
};

const HELP_COPY: Record<HelpSectionKey, { es: string; en: string }> = {
    joint: {
        es: 'Califica dolor tendinoso o articular por ejercicio (no ardor muscular). "Moderado/Mucho" protege tus articulaciones y marca el ejercicio en tu historial SFR.',
        en: 'Rate tendon/joint irritation per movement (not muscle burn). "Moderate/A lot" protects connective tissue and flags that lift in your SFR history.',
    },
    soreness: {
        es: 'Evalúa si las agujetas de tu sesión previa ya sanaron antes de entrenar hoy. Si siguen altas al repetir músculo, RP reduce series futuras.',
        en: 'Measures whether soreness from the previous session healed before today. Lingering soreness pulls future set targets down.',
    },
    pump: {
        es: 'La congestión local mide qué tan bien estimulaste el músculo con tu técnica y rango actual.',
        en: 'Local pump reflects how cleanly the target muscle received tension during your sets.',
    },
    volume: {
        es: '"Óptimo" permite subir progresivamente; "Al límite" o "Demasiado" frena subidas para evitar pasarte del MRV (Volume Trap).',
        en: '"Just right" permits gradual overload; "Pushed my limits" caps additions near MRV to prevent junk-volume bloat.',
    },
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
    muscles,
    exerciseIdsByMuscle,
    exercisesByMuscle,
    sessionWeek,
    prefilledSoreness,
    prefilledJointPain,
    onConfirm,
    onCancel,
}) => {
    const { lang } = useAppPreferences();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];
    const isStructuredProgram = !!activeMeso?.programSystem;

    const uniqueMuscles = useMemo(() => {
        return Array.from(new Set((muscles || []).filter(m => m && (m as string) !== 'CARDIO'))) as MuscleGroup[];
    }, [muscles]);

    const [step, setStep] = useState(0);
    const [openHelp, setOpenHelp] = useState<HelpSectionKey | null>(null);
    const [expandedSorenessMuscles, setExpandedSorenessMuscles] = useState<Record<string, boolean>>({});
    const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});

    const [jointPainByEx, setJointPainByEx] = useState<Record<string, number>>(() => ({
        ...(prefilledJointPain || {}),
    }));

    const [feedbackState, setFeedbackState] = useState<FeedbackState>(() => {
        const initial: FeedbackState = {};
        uniqueMuscles.forEach(m => {
            const mKey = m as string;
            const exList = exercisesByMuscle?.[mKey] || [];
            const seededPain = exList
                .map(ex => prefilledJointPain?.[ex.id])
                .filter((v): v is number => typeof v === 'number');
            const initialPain = seededPain.length === exList.length && exList.length > 0
                ? Math.max(...seededPain)
                : undefined;

            const preSore = prefilledSoreness?.[mKey]?.soreness;
            const initialSoreness = typeof preSore === 'number'
                ? preSore
                : sessionWeek === 1
                    ? 0
                    : undefined;

            initial[mKey] = {
                ...(typeof initialPain === 'number' ? { jointPain: initialPain } : {}),
                ...(typeof initialSoreness === 'number' ? { soreness: initialSoreness } : {}),
            };
        });
        return initial;
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const activeMuscle = uniqueMuscles[Math.min(step, Math.max(0, uniqueMuscles.length - 1))] as string | undefined;

    const getMuscleName = (muscle?: string) => {
        if (!muscle) return '';
        return (t.muscle as Record<string, string>)[muscle] || muscle;
    };

    const muscleName = activeMuscle ? getMuscleName(activeMuscle) : '';
    const isLast = step >= uniqueMuscles.length - 1;

    const currentExercises = useMemo(() => {
        if (!activeMuscle) return [];
        const raw = exercisesByMuscle?.[activeMuscle] || [];
        const seen = new Set<string>();
        return raw.filter((item) => {
            if (!item?.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [activeMuscle, exercisesByMuscle]);

    const currentData: MuscleFeedbackData = activeMuscle && feedbackState[activeMuscle]
        ? feedbackState[activeMuscle]
        : {};

    const isCurrentAnswered = isMuscleAnswered(currentData);
    const isAllAnswered = uniqueMuscles.every(m => isMuscleAnswered(feedbackState[m as string]));

    const handleSelectOption = (field: keyof MuscleFeedbackData, value: number) => {
        if (!activeMuscle) return;
        setFeedbackState(prev => ({
            ...prev,
            [activeMuscle]: {
                ...(prev[activeMuscle] || {}),
                [field]: value,
            },
        }));
    };

    const handleSelectExerciseJointPain = (exId: string, value: number) => {
        if (!activeMuscle) return;
        const nextByEx = { ...jointPainByEx, [exId]: value };
        setJointPainByEx(nextByEx);

        const exVals = currentExercises
            .map(item => nextByEx[item.id])
            .filter((v): v is number => typeof v === 'number');
        const worstPain = exVals.length > 0 ? Math.max(...exVals) : value;
        handleSelectOption('jointPain', worstPain);
    };

    const buildResult = () => {
        const result: Record<string, { soreness: number; performance: number; adjustment: number }> = {};
        uniqueMuscles.forEach(m => {
            const mKey = m as string;
            const raw = feedbackState[mKey];
            const d = isMuscleAnswered(raw) ? raw : { jointPain: 0, soreness: 1, pump: 1, volume: 1 };
            const perf = computePerformance(d.volume, d.jointPain);
            const priority = activeMeso?.musclePriorities?.[m];
            const autoAdj = computePriorityAwareSetDelta({
                jointPain: d.jointPain,
                soreness: d.soreness,
                pump: d.pump,
                workload: d.volume,
                priority,
                volumeProfile: activeMeso?.volumeProfile,
            });
            const effectiveAdj = typeof manualOverrides[mKey] === 'number' ? manualOverrides[mKey] : autoAdj;

            const detailedEx = exercisesByMuscle?.[mKey] || [];
            if (detailedEx.length > 0) {
                detailedEx.forEach((exItem) => {
                    const exPain = typeof jointPainByEx[exItem.id] === 'number' ? jointPainByEx[exItem.id] : d.jointPain;
                    recordExerciseSfrFeedback(exItem.id, {
                        jointPain: exPain,
                        pump: d.pump,
                        soreness: d.soreness,
                    });
                });
            } else {
                const exIds = exerciseIdsByMuscle?.[mKey] || [];
                exIds.forEach((exId) => {
                    recordExerciseSfrFeedback(exId, {
                        jointPain: d.jointPain,
                        pump: d.pump,
                        soreness: d.soreness,
                    });
                });
            }

            result[mKey] = {
                soreness: d.soreness,
                performance: perf,
                adjustment: effectiveAdj,
            };
        });
        return result;
    };

    const handleSave = () => {
        if (!isAllAnswered) return;
        onConfirm(buildResult());
    };

    const skipAndFinish = () => {
        onConfirm({});
    };

    if (uniqueMuscles.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" data-testid="feedback-modal">
                <div className="w-full max-w-md rounded-[8px] border border-border-subtle bg-surface-base p-6 text-center shadow-2xl">
                    <p className="text-sm text-zinc-300 mb-4">{t.copy.feedbackModal.thereAreNoMuscle}</p>
                    <button
                        type="button"
                        onClick={skipAndFinish}
                        className="w-full py-2.5 rounded-[4px] bg-primary-500 text-zinc-950 font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                        {t.copy.feedbackModal.finish}
                    </button>
                </div>
            </div>
        );
    }

    const activePriority = activeMuscle ? activeMeso?.musclePriorities?.[activeMuscle as MuscleGroup] : undefined;
    const autoAdjustment = isCurrentAnswered && activeMuscle
        ? computePriorityAwareSetDelta({
              jointPain: currentData.jointPain!,
              soreness: currentData.soreness!,
              pump: currentData.pump!,
              workload: currentData.volume!,
              priority: activePriority,
              volumeProfile: activeMeso?.volumeProfile,
          })
        : null;
    const effectiveAdjustment = activeMuscle && typeof manualOverrides[activeMuscle] === 'number'
        ? manualOverrides[activeMuscle]
        : autoAdjustment;

    const deltaExplanation = isCurrentAnswered && autoAdjustment !== null
        ? explainPriorityAwareSetDelta({
              jointPain: currentData.jointPain!,
              soreness: currentData.soreness!,
              pump: currentData.pump!,
              workload: currentData.volume!,
              priority: activePriority,
              volumeProfile: activeMeso?.volumeProfile,
              delta: autoAdjustment,
          })[lang]
        : null;

    const jointPainOptions = [
        { value: 0, label: pickLang(lang, { es: 'Ninguno', en: 'None' }) },
        { value: 1, label: pickLang(lang, { es: 'Bajo', en: 'Low pain' }) },
        { value: 2, label: pickLang(lang, { es: 'Moderado', en: 'Moderate pain' }) },
        { value: 3, label: pickLang(lang, { es: 'Mucho dolor', en: 'A lot of pain' }) },
    ];

    const sorenessOptions = [
        { value: 0, label: pickLang(lang, { es: 'Sin agujetas', en: 'Never got sore' }) },
        { value: 1, label: pickLang(lang, { es: 'Curado hace días', en: 'Healed a while ago' }) },
        { value: 2, label: pickLang(lang, { es: 'Curado a tiempo', en: 'Healed just on time' }) },
        { value: 3, label: pickLang(lang, { es: '¡Sigo con agujetas!', en: "I'm still sore!" }) },
    ];

    const pumpOptions = [
        { value: 0, label: pickLang(lang, { es: 'Bajo bombeo', en: 'Low pump' }) },
        { value: 1, label: pickLang(lang, { es: 'Bombeo moderado', en: 'Moderate pump' }) },
        { value: 2, label: pickLang(lang, { es: 'Gran bombeo', en: 'Amazing pump' }) },
    ];

    const volumeOptions = [
        { value: 0, label: pickLang(lang, { es: 'Poco', en: 'Not enough' }) },
        { value: 1, label: pickLang(lang, { es: 'Óptimo', en: 'Just right' }) },
        { value: 2, label: pickLang(lang, { es: 'Al límite', en: 'Pushed my limits' }) },
        { value: 3, label: pickLang(lang, { es: 'Demasiado', en: 'Too much' }) },
    ];

    const hasPrefilledSorenessForActive = Boolean(
        activeMuscle && typeof prefilledSoreness?.[activeMuscle]?.soreness === 'number',
    );
    const isWeek1SorenessAuto = Boolean(sessionWeek === 1 && !hasPrefilledSorenessForActive);
    const showFullSorenessGrid = Boolean(
        (activeMuscle && expandedSorenessMuscles[activeMuscle]) ||
        (!hasPrefilledSorenessForActive && !isWeek1SorenessAuto),
    );

    const activeSorenessLabel =
        typeof currentData.soreness === 'number'
            ? sorenessOptions.find(o => o.value === currentData.soreness)?.label || ''
            : '';

    const renderHelpButton = (key: HelpSectionKey) => {
        const isOpen = openHelp === key;
        return (
            <button
                type="button"
                data-testid={`help-btn-${key}`}
                aria-expanded={isOpen}
                aria-label={pickLang(lang, { es: 'Ver guía de calificación', en: 'Toggle rating guide' })}
                onClick={() => setOpenHelp(prev => (prev === key ? null : key))}
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-bold leading-none transition-colors cursor-pointer ${
                    isOpen
                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                        : 'border-zinc-500 text-zinc-400 hover:border-zinc-300 hover:text-white'
                }`}
            >
                ?
            </button>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
            data-testid="feedback-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="w-full max-w-md rounded-[8px] border border-border-subtle bg-surface-base shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Top header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border-subtle/60 bg-surface-base shrink-0">
                    <div>
                        <h2 className="text-[18px] font-bold text-white tracking-tight">
                            Feedback
                        </h2>
                        {typeof sessionWeek === 'number' && sessionWeek > 0 && (
                            <p className="text-xs text-zinc-400">
                                {pickLang(lang, { es: `Semana ${sessionWeek}`, en: `Week ${sessionWeek}` })}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close"
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>

                {/* Horizontal muscle selector pill bar (if multiple muscles) */}
                {uniqueMuscles.length > 1 ? (
                    <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto border-b border-border-subtle/40 bg-surface-app no-scrollbar shrink-0">
                        {uniqueMuscles.map((m, idx) => {
                            const isSelected = idx === step;
                            const mName = getMuscleName(m as string);
                            return (
                                <button
                                    key={m as string}
                                    type="button"
                                    onClick={() => setStep(idx)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                                        isSelected
                                            ? 'bg-surface-elevated text-white border border-border-subtle shadow-sm'
                                            : 'bg-surface-raised text-zinc-400 hover:text-zinc-200 border border-transparent'
                                    }`}
                                >
                                    <span className="text-[10px] tracking-tighter opacity-70">|||</span>
                                    {isSelected ? (
                                        <span data-testid="feedback-muscle">{mName}</span>
                                    ) : (
                                        <span>{mName}</span>
                                    )}
                                    <span
                                        className={`w-2 h-2 rounded-full ml-0.5 ${
                                            isMuscleAnswered(feedbackState[m as string])
                                                ? 'bg-emerald-400'
                                                : 'bg-zinc-600'
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-5 pt-3 pb-0 flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] tracking-tighter text-zinc-500">|||</span>
                        <span data-testid="feedback-muscle" className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">
                            {muscleName}
                        </span>
                    </div>
                )}

                {/* Scrollable container */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
                    {/* Section 1: Joint pain (per-exercise when provided, else per-muscle fallback) */}
                    <section>
                        <div className="mb-1 text-[13px] font-bold text-white flex items-center gap-1.5">
                            <span>
                                {currentExercises.length > 0
                                    ? pickLang(lang, { es: `Dolor articular por ejercicio (${muscleName})`, en: `Joint pain per exercise (${muscleName})` })
                                    : pickLang(lang, { es: `Dolor articular (${muscleName})`, en: 'Joint pain' })}
                            </span>
                            {renderHelpButton('joint')}
                        </div>
                        {openHelp === 'joint' && (
                            <div
                                data-testid="help-popover-joint"
                                className="mb-2.5 rounded-[6px] border border-primary-500/35 bg-primary-500/10 px-3 py-2 text-xs text-zinc-200 leading-snug"
                            >
                                {HELP_COPY.joint[lang]}
                            </div>
                        )}
                        <div className="text-[11px] text-zinc-400 mb-2.5 leading-tight">
                            {pickLang(lang, {
                                es: `¿Cómo se sintieron tus tendones y articulaciones en ${muscleName.toLowerCase()}?`,
                                en: `How did your joints feel during ${muscleName.toLowerCase()}?`,
                            })}
                        </div>

                        {currentExercises.length > 0 ? (
                            <div className="space-y-2.5">
                                {currentExercises.map((exItem) => {
                                    const selectedExPain = jointPainByEx[exItem.id];
                                    return (
                                        <div
                                            key={exItem.id}
                                            data-testid={`joint-pain-ex-${exItem.id}`}
                                            className="rounded-[6px] border border-border-subtle/70 bg-surface-raised/60 p-2.5 space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-white truncate">{exItem.name}</span>
                                                {typeof selectedExPain === 'number' && (
                                                    <span className={`text-[11px] font-bold ${selectedExPain >= 2 ? 'text-amber-300' : 'text-emerald-300'}`}>
                                                        {jointPainOptions.find(o => o.value === selectedExPain)?.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {jointPainOptions.map(opt => {
                                                    const isSelected = selectedExPain === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            aria-pressed={isSelected}
                                                            onClick={() => handleSelectExerciseJointPain(exItem.id, opt.value)}
                                                            className={`min-h-[38px] rounded-[4px] border px-1.5 py-1 text-center text-[11px] leading-tight flex items-center justify-center transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? opt.value >= 2
                                                                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
                                                                        : 'bg-primary-500 text-zinc-950 border-primary-500 font-bold shadow-sm'
                                                                    : 'bg-surface-base border-border-subtle/70 text-zinc-200 hover:bg-surface-elevated font-medium'
                                                            }`}
                                                        >
                                                            <span>{opt.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {jointPainOptions.map(opt => {
                                    const isSelected = currentData.jointPain === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelectOption('jointPain', opt.value)}
                                            className={`min-h-[54px] rounded-[4px] border px-2 py-2 text-center text-[12px] leading-tight flex items-center justify-center transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-primary-500 text-zinc-950 border-primary-500 font-bold shadow-sm'
                                                    : 'bg-surface-raised border-border-subtle/70 text-zinc-200 hover:bg-surface-elevated font-medium'
                                            }`}
                                        >
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Section 2: Soreness */}
                    <section>
                        <div className="mb-1 text-[13px] font-bold text-white flex items-center gap-1.5">
                            <span>{pickLang(lang, { es: `Agujetas en ${muscleName.toLowerCase()}`, en: `${muscleName} soreness` })}</span>
                            {renderHelpButton('soreness')}
                        </div>
                        {openHelp === 'soreness' && (
                            <div
                                data-testid="help-popover-soreness"
                                className="mb-2.5 rounded-[6px] border border-primary-500/35 bg-primary-500/10 px-3 py-2 text-xs text-zinc-200 leading-snug"
                            >
                                {HELP_COPY.soreness[lang]}
                            </div>
                        )}

                        {!showFullSorenessGrid && activeMuscle ? (
                            <div
                                data-testid="prefilled-soreness-banner"
                                className="rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 flex items-center justify-between gap-2"
                            >
                                <div className="min-w-0 text-xs text-emerald-100">
                                    {hasPrefilledSorenessForActive ? (
                                        <span>
                                            <strong>{pickLang(lang, { es: 'Pre-cargado Set #1:', en: 'Logged at Set #1:' })}</strong>{' '}
                                            {activeSorenessLabel}
                                        </span>
                                    ) : (
                                        <span>
                                            {pickLang(lang, {
                                                es: 'Semana 1: sin sesión previa del mesociclo que evaluar.',
                                                en: 'Week 1: no prior mesocycle session soreness due.',
                                            })}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    data-testid="edit-prefilled-soreness-btn"
                                    onClick={() =>
                                        setExpandedSorenessMuscles(prev => ({ ...prev, [activeMuscle]: true }))
                                    }
                                    className="shrink-0 text-xs font-extrabold text-primary-300 hover:text-primary-200 cursor-pointer"
                                >
                                    {pickLang(lang, { es: 'Editar', en: 'Edit' })}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-[11px] text-zinc-400 mb-2.5 leading-tight">
                                    {pickLang(lang, {
                                        es: `¿Cuántas agujetas tuviste tras entrenar ${muscleName.toLowerCase()} la última vez?`,
                                        en: `How sore did you get in your ${muscleName.toLowerCase()} AFTER training them LAST TIME?`,
                                    })}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {sorenessOptions.map(opt => {
                                        const isSelected = currentData.soreness === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleSelectOption('soreness', opt.value)}
                                                className={`min-h-[54px] rounded-[4px] border px-2 py-2 text-center text-[12px] leading-tight flex items-center justify-center transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-primary-500 text-zinc-950 border-primary-500 font-bold shadow-sm'
                                                        : 'bg-surface-raised border-border-subtle/70 text-zinc-200 hover:bg-surface-elevated font-medium'
                                                }`}
                                            >
                                                <span>{opt.label}</span>
                                                {opt.value === 2 && (
                                                    <span className="sr-only">{String(t.fb.soreness[2])}</span>
                                                )}
                                                {opt.value === 1 && (
                                                    <span className="sr-only">{String(t.fb.soreness[1])}</span>
                                                )}
                                                {opt.value === 3 && (
                                                    <span className="sr-only">{String(t.fb.soreness[3])}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>

                    {/* Section 3: Pump */}
                    <section>
                        <div className="mb-1 text-[13px] font-bold text-white flex items-center gap-1.5">
                            <span>{pickLang(lang, { es: `Bombeo en ${muscleName.toLowerCase()}`, en: `${muscleName} pump` })}</span>
                            {renderHelpButton('pump')}
                        </div>
                        {openHelp === 'pump' && (
                            <div
                                data-testid="help-popover-pump"
                                className="mb-2.5 rounded-[6px] border border-primary-500/35 bg-primary-500/10 px-3 py-2 text-xs text-zinc-200 leading-snug"
                            >
                                {HELP_COPY.pump[lang]}
                            </div>
                        )}
                        <div className="text-[11px] text-zinc-400 mb-2.5 leading-tight">
                            {pickLang(lang, {
                                es: `¿Qué nivel de congestión conseguiste hoy en ${muscleName.toLowerCase()}?`,
                                en: `How much of a pump did you get today in your ${muscleName.toLowerCase()}?`,
                            })}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {pumpOptions.map(opt => {
                                const isSelected = currentData.pump === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelectOption('pump', opt.value)}
                                        className={`min-h-[54px] rounded-[4px] border px-2 py-2 text-center text-[12px] leading-tight flex items-center justify-center transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary-500 text-zinc-950 border-primary-500 font-bold shadow-sm'
                                                : 'bg-surface-raised border-border-subtle/70 text-zinc-200 hover:bg-surface-elevated font-medium'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Section 4: Volume */}
                    <section>
                        <div className="mb-1 text-[13px] font-bold text-white flex items-center gap-1.5">
                            <span>{pickLang(lang, { es: `Volumen de ${muscleName.toLowerCase()}`, en: `${muscleName} volume` })}</span>
                            {renderHelpButton('volume')}
                        </div>
                        {openHelp === 'volume' && (
                            <div
                                data-testid="help-popover-volume"
                                className="mb-2.5 rounded-[6px] border border-primary-500/35 bg-primary-500/10 px-3 py-2 text-xs text-zinc-200 leading-snug"
                            >
                                {HELP_COPY.volume[lang]}
                            </div>
                        )}
                        <div className="text-[11px] text-zinc-400 mb-2.5 leading-tight">
                            {pickLang(lang, {
                                es: `¿Cómo fue el volumen de series efectivas para ${muscleName.toLowerCase()}?`,
                                en: `How was the volume of work (number of hard sets) for your ${muscleName.toLowerCase()}?`,
                            })}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {volumeOptions.map(opt => {
                                const isSelected = currentData.volume === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelectOption('volume', opt.value)}
                                        className={`min-h-[54px] rounded-[4px] border px-2 py-2 text-center text-[12px] leading-tight flex items-center justify-center transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary-500 text-zinc-950 border-primary-500 font-bold shadow-sm'
                                                : 'bg-surface-raised border-border-subtle/70 text-zinc-200 hover:bg-surface-elevated font-medium'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {opt.value === 2 && (
                                            <span className="sr-only">{String(t.fb.performance[2])}</span>
                                        )}
                                        {opt.value === 0 && (
                                            <span className="sr-only">{String(t.fb.performance[1])}</span>
                                        )}
                                        {opt.value === 3 && (
                                            <span className="sr-only">{String(t.fb.performance[3])}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Progression Feedback Preview + Transparency + Manual Override */}
                    <div
                        data-testid="feedback-rationale-card"
                        className="rounded-[6px] border border-border-subtle/70 bg-surface-raised/60 p-3 space-y-2.5 text-[12px] text-zinc-300"
                    >
                        <div className="flex items-start gap-2.5">
                            <Icon
                                name={isStructuredProgram ? 'Info' : effectiveAdjustment === null ? 'Info' : effectiveAdjustment !== 0 ? 'TrendingUp' : 'CheckCircle'}
                                size={16}
                                className="shrink-0 mt-0.5 text-primary-500"
                            />
                            <span className="leading-snug">
                                {isStructuredProgram
                                    ? t.copy.feedbackModal.thisIsStoredAs
                                    : effectiveAdjustment === null
                                        ? pickLang(lang, {
                                              es: 'Responde dolor articular, agujetas, bombeo y volumen para guardar.',
                                              en: 'Answer joint pain, soreness, pump and workload to continue.',
                                          })
                                        : deltaExplanation}
                            </span>
                        </div>
                        {!isStructuredProgram && effectiveAdjustment !== null && activeMuscle && (
                            <div className="flex items-center justify-between gap-2 border-t border-border-subtle/60 pt-2">
                                <span className="text-xs text-zinc-400">
                                    {pickLang(lang, { es: 'Override manual de series:', en: 'Manual set override:' })}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {[-1, 0, 1].map((val) => {
                                        const isActive = effectiveAdjustment === val || (val === 1 && effectiveAdjustment > 1);
                                        return (
                                            <button
                                                key={val}
                                                type="button"
                                                aria-pressed={isActive}
                                                data-testid={`feedback-override-${val}`}
                                                onClick={() =>
                                                    setManualOverrides(prev => ({ ...prev, [activeMuscle]: val }))
                                                }
                                                className={`min-w-[34px] rounded-[4px] border px-2 py-1 text-xs font-black font-mono transition-colors cursor-pointer ${
                                                    isActive
                                                        ? 'border-primary-500 bg-primary-500 text-zinc-950'
                                                        : 'border-border-subtle bg-surface-base text-zinc-300 hover:text-white'
                                                }`}
                                            >
                                                {val > 0 ? `+${val}` : String(val)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Footer Bar */}
                <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border-subtle/60 bg-surface-base shrink-0">
                    <button
                        type="button"
                        onClick={skipAndFinish}
                        className="px-2 py-2 rounded-[4px] text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        {t.copy.feedbackModal.skipFinish}
                    </button>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3.5 py-2 rounded-[4px] text-[13px] font-semibold text-zinc-300 hover:bg-white/5 active:scale-[0.98] transition-colors cursor-pointer"
                        >
                            {pickLang(lang, { es: 'Cancelar', en: 'Cancel' })}
                        </button>
                        {uniqueMuscles.length > 1 && !isLast && (
                            <button
                                type="button"
                                disabled={!isCurrentAnswered}
                                onClick={() => setStep(prev => Math.min(prev + 1, uniqueMuscles.length - 1))}
                                className="px-4 py-2 rounded-[4px] border border-border-subtle bg-surface-raised text-zinc-200 text-[13px] font-bold hover:bg-surface-elevated active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {pickLang(lang, { es: 'Siguiente', en: 'Next' })}
                            </button>
                        )}
                        <button
                            type="button"
                            data-testid="feedback-save-btn"
                            disabled={!isAllAnswered}
                            onClick={handleSave}
                            className="px-5 py-2 rounded-[4px] bg-primary-500 text-zinc-950 text-[13px] font-bold hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                        >
                            <span>{pickLang(lang, { es: 'Guardar', en: 'Save' })}</span>
                            <span className="sr-only">{t.copy.feedbackModal.saveFinish}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
