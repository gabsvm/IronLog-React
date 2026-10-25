import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import type { ExerciseDef, Lang } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { EXERCISE_ILLUSTRATIONS } from '../../constants/exerciseIllustrationsMap';

interface AppleExerciseMotionProps {
    exercise: ExerciseDef;
    lang: Lang;
    youtubeUrl?: string;
}

const CDN_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export type MotionPattern =
    | 'bench_press'
    | 'overhead_press'
    | 'lateral_raise'
    | 'fly'
    | 'row'
    | 'lat_pulldown'
    | 'pullover'
    | 'biceps_curl'
    | 'triceps_extension'
    | 'dips'
    | 'squat'
    | 'deadlift'
    | 'leg_extension'
    | 'leg_curl'
    | 'calf_raise'
    | 'abs_crunch'
    | 'shrugs'
    | 'cardio'
    | 'isolation';

export function getMotionPattern(exercise: ExerciseDef): MotionPattern {
    const id = (exercise.id || '').toLowerCase();
    const raw = typeof exercise.name === 'string'
        ? exercise.name.toLowerCase()
        : `${exercise.name?.en || ''} ${exercise.name?.es || ''}`.toLowerCase();

    if (
        id.includes('lat_raise') ||
        raw.includes('lateral raise') ||
        raw.includes('elev. lateral') ||
        raw.includes('elevacion lateral') ||
        raw.includes('elevaciones lateral') ||
        raw.includes('vuelos lateral')
    ) {
        return 'lateral_raise';
    }

    if (
        raw.includes('fly') ||
        raw.includes('apertura') ||
        raw.includes('pec dec') ||
        raw.includes('crossover') ||
        raw.includes('cruces') ||
        raw.includes('cruce') ||
        raw.includes('pajaro') ||
        raw.includes('pájaro') ||
        raw.includes('rear delt')
    ) {
        return 'fly';
    }

    if (
        raw.includes('shrug') ||
        raw.includes('encogimiento') ||
        raw.includes('upright row') ||
        raw.includes('remo al menton') ||
        raw.includes('remo al mentón') ||
        raw.includes('farmer') ||
        raw.includes('granjero') ||
        raw.includes('carry')
    ) {
        return 'shrugs';
    }

    if (raw.includes('dip') || raw.includes('fondo') || id.includes('dip')) {
        return 'dips';
    }

    if (
        (exercise.muscle === 'BICEPS' || raw.includes('curl') || id.includes('curl')) &&
        exercise.muscle !== 'HAMSTRINGS' &&
        exercise.muscle !== 'NECK' &&
        !raw.includes('leg curl') &&
        !raw.includes('femoral') &&
        !raw.includes('nordic') &&
        !raw.includes('wrist') &&
        !raw.includes('muñeca') &&
        !raw.includes('neck') &&
        !raw.includes('cuello')
    ) {
        return 'biceps_curl';
    }

    if (
        exercise.muscle === 'TRICEPS' ||
        raw.includes('tricep') ||
        raw.includes('tríceps') ||
        raw.includes('pushdown') ||
        raw.includes('pressdown') ||
        raw.includes('skull crusher') ||
        raw.includes('rompecraneo') ||
        raw.includes('rompecráneo') ||
        raw.includes('french press') ||
        raw.includes('jm press') ||
        id.includes('tri_') ||
        id.includes('tricep')
    ) {
        return 'triceps_extension';
    }

    if (
        raw.includes('overhead') ||
        raw.includes('militar') ||
        raw.includes('ohp') ||
        raw.includes('push press') ||
        raw.includes('tras nuca') ||
        raw.includes('behind neck') ||
        raw.includes('front raise') ||
        raw.includes('elevacion frontal') ||
        raw.includes('elevación frontal') ||
        raw.includes('handstand') ||
        raw.includes('hspu')
    ) {
        return 'overhead_press';
    }

    if (
        raw.includes('bench') ||
        raw.includes('banca') ||
        raw.includes('chest press') ||
        raw.includes('push up') ||
        raw.includes('pushup') ||
        raw.includes('flexion') ||
        raw.includes('flexión') ||
        raw.includes('lagartija') ||
        (raw.includes('press') && (exercise.muscle === 'CHEST' || id.startsWith('bp_')))
    ) {
        return 'bench_press';
    }

    if (
        raw.includes('pullover') ||
        raw.includes('pull over') ||
        raw.includes('prayer') ||
        id.includes('pullover') ||
        id.includes('lat_prayer')
    ) {
        return 'pullover';
    }

    if (
        raw.includes('row') ||
        raw.includes('remo') ||
        id.includes('row') ||
        raw.includes('face pull')
    ) {
        return 'row';
    }

    if (
        raw.includes('pulldown') ||
        raw.includes('jalón') ||
        raw.includes('jalon') ||
        raw.includes('pull up') ||
        raw.includes('pullup') ||
        raw.includes('chin up') ||
        raw.includes('chinup') ||
        raw.includes('dominada') ||
        raw.includes('muscle up') ||
        raw.includes('lat pull') ||
        id.startsWith('lat_pull') ||
        id.includes('pullup') ||
        id.includes('chinup')
    ) {
        return 'lat_pulldown';
    }

    if (
        raw.includes('calf') ||
        raw.includes('talón') ||
        raw.includes('talon') ||
        raw.includes('gemelo') ||
        raw.includes('pantorrilla') ||
        id.includes('calf')
    ) {
        return 'calf_raise';
    }

    if (
        (raw.includes('leg ext') || (raw.includes('extensi') && (exercise.muscle === 'QUADS' || id.includes('leg_ext')))) &&
        !raw.includes('tricep') &&
        !raw.includes('back extension') &&
        !raw.includes('lumbar')
    ) {
        return 'leg_extension';
    }

    if (
        raw.includes('leg curl') ||
        raw.includes('femoral') ||
        raw.includes('isquio') ||
        raw.includes('nordic') ||
        (id.includes('curl') && exercise.muscle === 'HAMSTRINGS')
    ) {
        return 'leg_curl';
    }

    if (
        raw.includes('deadlift') ||
        raw.includes('peso muerto') ||
        raw.includes('rdl') ||
        raw.includes('sldl') ||
        raw.includes('good morning') ||
        raw.includes('buenos d') ||
        raw.includes('rack pull') ||
        raw.includes('glute bridge') ||
        raw.includes('hip thrust') ||
        raw.includes('puente') ||
        raw.includes('back extension') ||
        raw.includes('extension lumbar') ||
        raw.includes('swing') ||
        id.includes('deadlift')
    ) {
        return 'deadlift';
    }

    if (
        raw.includes('squat') ||
        raw.includes('sentadilla') ||
        raw.includes('leg press') ||
        raw.includes('prensa') ||
        raw.includes('hack') ||
        raw.includes('lunge') ||
        raw.includes('zancada') ||
        raw.includes('step up') ||
        raw.includes('cajon') ||
        raw.includes('cajón') ||
        raw.includes('thruster') ||
        raw.includes('wall ball') ||
        id.includes('sq_')
    ) {
        return 'squat';
    }

    if (
        exercise.muscle === 'ABS' ||
        raw.includes('crunch') ||
        raw.includes('sit-up') ||
        raw.includes('situp') ||
        raw.includes('leg raise') ||
        raw.includes('elevacion de pierna') ||
        raw.includes('elevación de pierna') ||
        raw.includes('rodilla') ||
        raw.includes('plank') ||
        raw.includes('plancha') ||
        raw.includes('rollout') ||
        raw.includes('toes to bar') ||
        raw.includes('wiper')
    ) {
        return 'abs_crunch';
    }

    if (
        exercise.muscle === 'CARDIO' ||
        raw.includes('run') ||
        raw.includes('correr') ||
        raw.includes('cycle') ||
        raw.includes('ciclismo') ||
        raw.includes('rowing') ||
        raw.includes('sprint') ||
        raw.includes('burpee') ||
        raw.includes('double under') ||
        raw.includes('jump')
    ) {
        return 'cardio';
    }

    return 'isolation';
}

function getTechniqueCues(pattern: MotionPattern, copy: any): string[] {
    switch (pattern) {
        case 'bench_press':
            return [copy.cuesPress1, copy.cuesPress2, copy.cuesPress3];
        case 'overhead_press':
            return [copy.cuesPress1, copy.cuesArms2, copy.cuesPress3];
        case 'lateral_raise':
            return [copy.cuesLatRaise1, copy.cuesLatRaise2, copy.cuesLatRaise3];
        case 'fly':
            return [copy.cuesFly1, copy.cuesFly2, copy.cuesFly3];
        case 'row':
            return [copy.cuesPull1, copy.cuesPull2, copy.cuesPull3];
        case 'lat_pulldown':
            return [copy.cuesPull1, copy.cuesPull2, copy.cuesPull3];
        case 'pullover':
            return [copy.cuesPullover1, copy.cuesPullover2, copy.cuesPullover3];
        case 'biceps_curl':
            return [copy.cuesBiceps1, copy.cuesBiceps2, copy.cuesBiceps3];
        case 'triceps_extension':
            return [copy.cuesTriceps1, copy.cuesTriceps2, copy.cuesTriceps3];
        case 'dips':
            return [copy.cuesDips1, copy.cuesDips2, copy.cuesDips3];
        case 'squat':
            return [copy.cuesSquat1, copy.cuesSquat2, copy.cuesSquat3];
        case 'deadlift':
            return [copy.cuesHinge1, copy.cuesHinge2, copy.cuesHinge3];
        case 'leg_extension':
            return [copy.cuesLegExt1, copy.cuesLegExt2, copy.cuesLegExt3];
        case 'leg_curl':
            return [copy.cuesLegCurl1, copy.cuesLegCurl2, copy.cuesLegCurl3];
        case 'calf_raise':
            return [copy.cuesCalf1, copy.cuesCalf2, copy.cuesCalf3];
        case 'abs_crunch':
            return [copy.cuesAbs1, copy.cuesAbs2, copy.cuesAbs3];
        case 'shrugs':
            return [copy.cuesShrugs1, copy.cuesShrugs2, copy.cuesShrugs3];
        case 'cardio':
            return [copy.cuesCardio1, copy.cuesCardio2, copy.cuesCardio3];
        default:
            return [copy.cuesIso1, copy.cuesIso2, copy.cuesIso3];
    }
}

/**
 * Anatomical Two-Phase Biomechanical Motion Component.
 * - High-fidelity realistic illustrations (Start / Stretch & Peak Contraction)
 * - Smooth tempo loop with 0.5x inspection
 * - Fallback to biological vector silhouette for non-catalog exercises
 */
export const AppleExerciseMotion: React.FC<AppleExerciseMotionProps> = ({
    exercise,
    lang,
    youtubeUrl,
}) => {
    const t = TRANSLATIONS[lang];
    const copy = t.copy.exerciseDetailModal;
    const [speed, setSpeed] = useState<1 | 0.5>(1);
    const [isPaused, setIsPaused] = useState(false);
    const [activePhaseIndex, setActivePhaseIndex] = useState<0 | 1>(0);
    const [imageError, setImageError] = useState(false);

    const pattern = useMemo(() => getMotionPattern(exercise), [exercise]);
    const cues = useMemo(() => getTechniqueCues(pattern, copy), [pattern, copy]);

    // Look up real high-definition anatomical illustrations
    const illustrationPaths = useMemo(() => {
        const key = exercise.id?.toLowerCase();
        if (key && EXERCISE_ILLUSTRATIONS[key]) {
            return EXERCISE_ILLUSTRATIONS[key];
        }
        return null;
    }, [exercise.id]);

    // Biological cadence cycle: 3.2s total at 1.0x
    const phaseDuration = (activePhaseIndex === 0 ? 1800 : 1400) / speed;

    useEffect(() => {
        if (isPaused || !illustrationPaths || illustrationPaths.length < 2 || imageError) {
            return;
        }

        const timer = setTimeout(() => {
            setActivePhaseIndex(prev => (prev === 0 ? 1 : 0));
        }, phaseDuration);

        return () => clearTimeout(timer);
    }, [isPaused, activePhaseIndex, phaseDuration, illustrationPaths, imageError]);

    const isStartPhase = activePhaseIndex === 0;
    const currentPhaseTitle = isStartPhase ? copy.startPosition : copy.endPosition;
    const currentPhaseColor = isStartPhase
        ? 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'
        : 'text-primary-400 bg-primary-500/15 border-primary-500/30';

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-[rgb(var(--border-subtle))] bg-zinc-950 dark:bg-[#071424] shadow-md transition-all">
            {/* ── Stage Canvas ─────────────────────────────────────────────── */}
            <div className="relative w-full aspect-[16/10] sm:aspect-video flex items-center justify-center overflow-hidden select-none bg-[#071424]">
                {/* Radial ambient spotlight */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-700"
                    style={{
                        background: 'radial-gradient(circle at 50% 45%, rgb(var(--primary-500) / 0.28) 0%, transparent 68%)',
                    }}
                />

                {/* ── Realistic Anatomical Photos / Render ───────────────────── */}
                {illustrationPaths && illustrationPaths.length >= 2 && !imageError ? (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                        {illustrationPaths.slice(0, 2).map((path, idx) => (
                            <img
                                key={path}
                                src={`${CDN_BASE}${path}`}
                                alt={`${exercise.name} Phase ${idx + 1}`}
                                onError={() => setImageError(true)}
                                className={`absolute max-h-full max-w-full object-contain rounded-xl transition-opacity duration-500 ${activePhaseIndex === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                                    }`}
                            />
                        ))}
                    </div>
                ) : (
                    /* ── Biological Silhouette Fallback (when offline or uncataloged) ── */
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-3 animate-pulse">
                            <Icon name="Activity" className="w-8 h-8" />
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1">
                            {typeof exercise.name === 'string' ? exercise.name : (exercise.name?.[lang] || exercise.name?.en || '')}
                        </h4>
                        <span className="text-xs text-zinc-400 max-w-xs">
                            {copy.motionCuesTitle}
                        </span>
                    </div>
                )}

                {/* Phase Badge HUD */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md transition-colors ${currentPhaseColor}`}>
                            {currentPhaseTitle}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/50 border border-white/10 px-2.5 py-1 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-300">
                            {copy.tempoBadge}
                        </span>
                    </div>
                </div>

                {/* Controls (Manual Step Switch, Speed, Pause) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
                    {/* Toggle Phase 1 / Phase 2 buttons */}
                    <div className="flex items-center backdrop-blur-md bg-black/60 rounded-full border border-white/10 p-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setIsPaused(true);
                                setActivePhaseIndex(0);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${activePhaseIndex === 0
                                ? 'bg-primary-500 text-black font-bold'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            1
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsPaused(true);
                                setActivePhaseIndex(1);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${activePhaseIndex === 1
                                ? 'bg-primary-500 text-black font-bold'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            2
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSpeed(s => s === 1 ? 0.5 : 1)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md border transition-all ${speed === 0.5
                            ? 'bg-primary-500 text-black border-primary-400 font-bold shadow-sm'
                            : 'bg-black/60 text-zinc-300 border-white/10 hover:bg-black/80'
                            }`}
                        title="0.5x Slow-motion"
                    >
                        {speed === 0.5 ? '0.5x' : copy.slowMotion}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPaused(p => !p)}
                        className="p-1.5 rounded-full backdrop-blur-md bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-200 transition-colors"
                        title={isPaused ? copy.resume : copy.pause}
                    >
                        <Icon name={isPaused ? 'Play' : 'Pause'} className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── Technique Key Cues & External YouTube Fallback ────────────── */}
            <div className="p-3.5 sm:p-4 bg-[rgb(var(--surface-base))] border-t border-[rgb(var(--border-subtle))]">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <Icon name="Activity" className="w-4 h-4 text-primary-400" />
                        <h4 className="text-xs font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
                            {copy.motionCuesTitle}
                        </h4>
                    </div>

                    {youtubeUrl && (
                        <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                        >
                            <span>YouTube</span>
                            <Icon name="ExternalLink" className="w-3 h-3" />
                        </a>
                    )}
                </div>

                {/* 3 Key Scientific Technique Bullets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {cues.map((cue, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 p-2 rounded-xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))]"
                        >
                            <span className="text-[10px] font-bold text-primary-400 mt-0.5 w-4 h-4 rounded-full bg-primary-500/15 flex items-center justify-center shrink-0">
                                {idx + 1}
                            </span>
                            <p className="text-xs text-[rgb(var(--text-secondary))] leading-tight">
                                {cue}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
