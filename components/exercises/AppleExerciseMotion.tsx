import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import type { ExerciseDef, Lang } from '../../types';
import { TRANSLATIONS } from '../../constants';

interface AppleExerciseMotionProps {
    exercise: ExerciseDef;
    lang: Lang;
    youtubeUrl?: string;
}

type MotionPattern = 'press' | 'pull' | 'squat' | 'hinge' | 'arms' | 'isolation';

function getMotionPattern(exercise: ExerciseDef): MotionPattern {
    const raw = typeof exercise.name === 'string'
        ? exercise.name.toLowerCase()
        : `${exercise.name.en} ${exercise.name.es}`.toLowerCase();

    if (raw.includes('press') || raw.includes('push') || raw.includes('empuje') || raw.includes('banca') || raw.includes('flexi')) {
        return 'press';
    }
    if (raw.includes('pull') || raw.includes('chin') || raw.includes('row') || raw.includes('remo') || raw.includes('jal') || raw.includes('dominada')) {
        return 'pull';
    }
    if (raw.includes('squat') || raw.includes('sentadilla') || raw.includes('leg press') || raw.includes('prensa') || raw.includes('hack') || raw.includes('lunge') || raw.includes('zancada')) {
        return 'squat';
    }
    if (raw.includes('deadlift') || raw.includes('peso muerto') || raw.includes('rdl') || raw.includes('hinge') || raw.includes('hip thrust') || raw.includes('puente')) {
        return 'hinge';
    }
    if (exercise.muscle === 'BICEPS' || exercise.muscle === 'TRICEPS' || raw.includes('curl') || raw.includes('extension') || raw.includes('extensi')) {
        return 'arms';
    }
    return 'isolation';
}

function getTechniqueCues(pattern: MotionPattern, copy: any): string[] {
    switch (pattern) {
        case 'press':
            return [copy.cuesPress1, copy.cuesPress2, copy.cuesPress3];
        case 'pull':
            return [copy.cuesPull1, copy.cuesPull2, copy.cuesPull3];
        case 'squat':
            return [copy.cuesSquat1, copy.cuesSquat2, copy.cuesSquat3];
        case 'hinge':
            return [copy.cuesHinge1, copy.cuesHinge2, copy.cuesHinge3];
        case 'arms':
            return [copy.cuesArms1, copy.cuesArms2, copy.cuesArms3];
        default:
            return [copy.cuesIso1, copy.cuesIso2, copy.cuesIso3];
    }
}

/**
 * Apple Fitness+ Inspired Vector Exercise Motion Component.
 * - Minimalist biological silhouette
 * - Active agonist muscles highlighted with energetic theme glow
 * - Real-time tempo phase indicators (Eccentric / Isometric Stretch / Concentric)
 * - Motion/bar path with tracking beacon
 * - 0.5x slow-motion inspection and freeze frame
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
    const [progress, setProgress] = useState(0); // 0.0 to 1.0 cycle
    const animRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    const pattern = useMemo(() => getMotionPattern(exercise), [exercise]);
    const cues = useMemo(() => getTechniqueCues(pattern, copy), [pattern, copy]);

    // Biological cadence cycle: 3.6s total at 1.0x (2.0s eccentric, 0.6s stretch pause, 1.0s concentric)
    const cycleDuration = 3600 / speed;

    useEffect(() => {
        if (isPaused) {
            lastTimeRef.current = null;
            return;
        }

        const step = (time: number) => {
            if (lastTimeRef.current !== null) {
                const delta = time - lastTimeRef.current;
                setProgress(prev => (prev + delta / cycleDuration) % 1);
            }
            lastTimeRef.current = time;
            animRef.current = requestAnimationFrame(step);
        };

        animRef.current = requestAnimationFrame(step);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isPaused, cycleDuration]);

    // Biomechanical phases
    let phaseName = copy.eccentricPhase;
    let phaseInstruction = copy.eccentricInstruction;
    let phaseColor = 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    let pos = 0; // 0 = start, 1 = maximum stretch/bottom

    if (progress < 0.55) {
        // Lowering: ease in-out from 0 to 1
        const p = progress / 0.55;
        pos = Math.sin((p * Math.PI) / 2);
        phaseName = copy.eccentricPhase;
        phaseInstruction = copy.eccentricInstruction;
        phaseColor = 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    } else if (progress < 0.70) {
        // Maximum stretch hold
        pos = 1;
        phaseName = copy.stretchPhase;
        phaseInstruction = copy.stretchInstruction;
        phaseColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    } else {
        // Concentric: drive up from 1 to 0
        const p = (progress - 0.70) / 0.30;
        pos = 1 - Math.sin((p * Math.PI) / 2);
        phaseName = copy.concentricPhase;
        phaseInstruction = copy.concentricInstruction;
        phaseColor = 'text-primary-400 bg-primary-500/15 border-primary-500/30';
    }

    const renderVectorFigure = () => {
        if (pattern === 'press') {
            const barY = 90 + pos * 50;
            const elbowX1 = 150 - pos * 15;
            const elbowX2 = 250 + pos * 15;
            const elbowY = 135 + pos * 15;

            return (
                <g>
                    {/* Bench */}
                    <rect x="130" y="160" width="140" height="12" rx="4" fill="#182230" stroke="#243447" strokeWidth="1.5" />
                    <line x1="150" y1="172" x2="150" y2="210" stroke="#243447" strokeWidth="3" strokeLinecap="round" />
                    <line x1="250" y1="172" x2="250" y2="210" stroke="#243447" strokeWidth="3" strokeLinecap="round" />

                    {/* Athlete Torso */}
                    <rect x="160" y="145" width="80" height="16" rx="6" fill="#1f2c3d" />
                    {/* Head on bench */}
                    <circle cx="140" cy="152" r="10" fill="#2d3d52" />

                    {/* Target Muscle: Pectoral major (active EMG glow) */}
                    <path
                        d="M 185 145 Q 200 138 215 145 Q 200 155 185 145 Z"
                        fill="rgb(var(--primary-500))"
                        className="transition-opacity duration-150"
                        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.85 + (1 - pos) * 0.15 }}
                    />

                    {/* Arms (Shoulder -> Elbow -> Hands on bar) */}
                    <path d={`M 175 148 L ${elbowX1} ${elbowY} L 165 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={`M 225 148 L ${elbowX2} ${elbowY} L 235 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Barbell & Plates */}
                    <line x1="120" y1={barY} x2="280" y2={barY} stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                    <rect x="110" y={barY - 18} width="10" height="36" rx="2" fill="rgb(var(--primary-500))" opacity="0.9" />
                    <rect x="280" y={barY - 18} width="10" height="36" rx="2" fill="rgb(var(--primary-500))" opacity="0.9" />

                    {/* Bar path guide line (vertical dotted trajectory) */}
                    <line x1="200" y1="85" x2="200" y2="145" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="200" cy={barY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        if (pattern === 'pull') {
            const barY = 70 + pos * 50;
            const elbowY = 95 + pos * 45;

            return (
                <g>
                    <circle cx="200" cy="115" r="11" fill="#2d3d52" />
                    <path d="M 185 130 L 215 130 L 208 195 L 192 195 Z" fill="#1f2c3d" />

                    {/* Target Muscle: Latissimus Dorsi */}
                    <path
                        d="M 185 132 Q 170 150 192 175 Q 183 148 185 132 Z"
                        fill="rgb(var(--primary-500))"
                        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.75 + pos * 0.25 }}
                    />
                    <path
                        d="M 215 132 Q 230 150 208 175 Q 217 148 215 132 Z"
                        fill="rgb(var(--primary-500))"
                        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.75 + pos * 0.25 }}
                    />

                    {/* Arms pulling bar down */}
                    <path d={`M 185 130 L 160 ${elbowY} L 150 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={`M 215 130 L 240 ${elbowY} L 250 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Lat Pulldown Bar */}
                    <path d={`M 125 ${barY - 6} Q 200 ${barY} 275 ${barY - 6}`} fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

                    {/* Cable */}
                    <line x1="200" y1="20" x2="200" y2={barY} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <circle cx="200" cy={barY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        if (pattern === 'squat') {
            const hipY = 120 + pos * 45;
            const kneeX = 220 + pos * 15;
            const kneeY = 160 + pos * 10;
            const torsoY = 75 + pos * 45;

            return (
                <g>
                    <line x1="110" y1="225" x2="290" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />

                    <circle cx="188" cy={torsoY - 14} r="10" fill="#2d3d52" />
                    <line x1="190" y1={torsoY} x2="180" y2={hipY} stroke="#1f2c3d" strokeWidth="16" strokeLinecap="round" />

                    {/* Target Muscle: Quadriceps & Glute */}
                    <circle cx="176" cy={hipY + 4} r="12" fill="rgb(var(--primary-500))" opacity={0.6 + pos * 0.4} style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))' }} />
                    <line x1="180" y1={hipY} x2={kneeX} y2={kneeY} stroke="rgb(var(--primary-500))" strokeWidth="12" strokeLinecap="round" opacity={0.7 + pos * 0.3} style={{ filter: 'drop-shadow(0 0 5px rgb(var(--primary-500)))' }} />

                    <line x1={kneeX} y1={kneeY} x2="205" y2="224" stroke="#6b7c96" strokeWidth="8" strokeLinecap="round" />
                    <line x1="195" y1="224" x2="225" y2="224" stroke="#2d3d52" strokeWidth="6" strokeLinecap="round" />

                    <circle cx="188" cy={torsoY + 2} r="6" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    <line x1="205" y1="50" x2="205" y2="224" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="188" cy={torsoY + 2} r="3" fill="#00E5DB" />
                </g>
            );
        }

        return (
            <g>
                <circle cx="200" cy="85" r="14" fill="#2d3d52" />
                <path d="M 185 105 L 215 105 L 208 170 L 192 170 Z" fill="#1f2c3d" />
                <circle cx="200" cy="135" r="22" fill="rgb(var(--primary-500))" opacity={0.75} style={{ filter: 'drop-shadow(0 0 10px rgb(var(--primary-500)))' }} />
                <circle cx="200" cy="135" r={26 + pos * 15} fill="none" stroke="#00E5DB" strokeWidth="1.5" opacity={1 - pos} />
            </g>
        );
    };

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-[rgb(var(--border-subtle))] bg-[#071424] shadow-md transition-all">
            {/* ── Apple Fitness+ Vector Stage ───────────────────────────────── */}
            <div className="relative w-full aspect-[16/10] sm:aspect-video flex items-center justify-center overflow-hidden select-none">
                <div
                    className="absolute inset-0 pointer-events-none transition-colors duration-500"
                    style={{
                        background: 'radial-gradient(circle at 50% 50%, rgb(var(--primary-500) / 0.12) 0%, rgba(7, 20, 36, 0.95) 75%)',
                    }}
                />

                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <svg viewBox="0 0 400 250" className="w-full h-full relative z-10">
                    <defs>
                        <filter id="muscle-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    {renderVectorFigure()}
                </svg>

                {/* Top Badge: Exercise Muscle Target */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-accent border border-white/10 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                        {exercise.muscle || 'CHEST'}
                    </span>
                    <span className="hidden sm:inline-flex px-2 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-medium text-zinc-300 border border-white/5">
                        {copy.tempoBadge}
                    </span>
                </div>

                {/* Top Right: Live Phase Pill */}
                <div className="absolute top-3 right-3 z-20">
                    <div className={`px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] font-bold tracking-tight transition-all duration-200 flex items-center gap-1.5 shadow-sm ${phaseColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{phaseName}</span>
                    </div>
                </div>

                {/* Bottom Left: Tempo cue status */}
                <div className="absolute bottom-3 left-3 z-20">
                    <div className="text-[11px] font-semibold text-zinc-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                        {phaseInstruction}
                    </div>
                </div>

                {/* Bottom Right: Apple-style Glass Controls */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setSpeed(s => (s === 1 ? 0.5 : 1))}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg backdrop-blur-md text-xs font-bold transition-all border active:scale-95 ${
                            speed === 0.5
                                ? 'bg-primary-500 text-zinc-950 border-primary-400 shadow-sm'
                                : 'bg-black/60 text-zinc-200 border-white/10 hover:bg-black/80'
                        }`}
                        title={copy.slowMotion}
                    >
                        {speed === 1 ? copy.normalSpeed : copy.slowMotion}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPaused(p => !p)}
                        className="min-h-[34px] min-w-[34px] rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 active:scale-95 flex items-center justify-center transition-all"
                        title={isPaused ? copy.resume : copy.pause}
                    >
                        <Icon name={isPaused ? 'Play' : 'Pause'} size={14} />
                    </button>
                </div>
            </div>

            {/* ── Technique Cues & YouTube Fallback Strip ──────────────────── */}
            <div className="p-3.5 bg-[rgb(var(--surface-raised))] border-t border-[rgb(var(--border-subtle))]">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <Icon name="Activity" size={12} className="text-accent" />
                        {copy.motionCuesTitle}
                    </span>
                    {youtubeUrl && (
                        <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-red-400 transition-colors"
                        >
                            <Icon name="ExternalLink" size={11} />
                            <span>YouTube</span>
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {cues.map((cue: string, idx: number) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 p-2 rounded-xl bg-[rgb(var(--surface-base))] border border-[rgb(var(--border-subtle))]"
                        >
                            <span className="flex shrink-0 w-4 h-4 rounded-full bg-primary-500/15 text-primary-500 font-extrabold text-[10px] items-center justify-center mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="text-[11px] font-medium text-[rgb(var(--text-secondary))] leading-snug">
                                {cue}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
