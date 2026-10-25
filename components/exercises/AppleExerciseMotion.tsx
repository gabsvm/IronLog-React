import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import type { ExerciseDef, Lang } from '../../types';
import { TRANSLATIONS } from '../../constants';

interface AppleExerciseMotionProps {
    exercise: ExerciseDef;
    lang: Lang;
    youtubeUrl?: string;
}

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

    // 1. Shoulders: Lateral Raises
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

    // 2. Chest & Delt: Flyes / Crossovers / Pec Dec / Pájaros
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

    // 3. Shrugs / Traps
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

    // 4. Arms: Biceps vs Triceps vs Dips
    if (
        raw.includes('dip') ||
        raw.includes('fondo') ||
        id.includes('dip')
    ) {
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

    // 5. Overhead Press (Vertical Push)
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

    // 6. Chest Press & Bench Press (Horizontal Push)
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

    // 7. Pullover / Lat Prayer
    if (
        raw.includes('pullover') ||
        raw.includes('pull over') ||
        raw.includes('prayer') ||
        id.includes('pullover') ||
        id.includes('lat_prayer')
    ) {
        return 'pullover';
    }

    // 8. Back: Rows (Horizontal Pull)
    if (
        raw.includes('row') ||
        raw.includes('remo') ||
        id.includes('row') ||
        raw.includes('face pull')
    ) {
        return 'row';
    }

    // 9. Back: Lat Pulldown / Pull-ups / Chin-ups (Vertical Pull)
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

    // 10. Legs: Calves
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

    // 11. Legs: Leg Extension
    if (
        (raw.includes('leg ext') || (raw.includes('extensi') && (exercise.muscle === 'QUADS' || id.includes('leg_ext')))) &&
        !raw.includes('tricep') &&
        !raw.includes('back extension') &&
        !raw.includes('lumbar')
    ) {
        return 'leg_extension';
    }

    // 12. Legs: Leg Curl (Hamstrings)
    if (
        raw.includes('leg curl') ||
        raw.includes('femoral') ||
        raw.includes('isquio') ||
        raw.includes('nordic') ||
        (id.includes('curl') && exercise.muscle === 'HAMSTRINGS')
    ) {
        return 'leg_curl';
    }

    // 13. Legs / Posterior Chain: Deadlift / Hinge / Back Ext
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

    // 14. Legs: Squat / Leg Press / Lunges
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

    // 15. Core / Abs
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

    // 16. Cardio / Conditioning
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
    let pos = 0; // 0 = start/top lockout, 1 = maximum stretch/bottom

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
        // ── 1. BENCH PRESS (Horizontal Push) ─────────────────────────────────
        if (pattern === 'bench_press') {
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

        // ── 2. OVERHEAD PRESS (Vertical Push) ────────────────────────────────
        if (pattern === 'overhead_press') {
            const barY = 65 + pos * 55; // 65 top lockout, 120 at clavicles
            const elbowY = 100 + pos * 35;
            const elbowX1 = 175 - (1 - pos) * 10;
            const elbowX2 = 225 + (1 - pos) * 10;

            return (
                <g>
                    {/* Floor */}
                    <line x1="130" y1="225" x2="270" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />

                    {/* Legs & Torso */}
                    <line x1="190" y1="165" x2="185" y2="224" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="210" y1="165" x2="215" y2="224" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 188 122 L 212 122 L 208 170 L 192 170 Z" fill="#1f2c3d" />
                    <circle cx="200" cy="108" r="9" fill="#2d3d52" />

                    {/* Target Muscle: Deltoids (anterior & lateral) */}
                    <circle cx="184" cy="122" r="7" fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.8 + (1 - pos) * 0.2 }} />
                    <circle cx="216" cy="122" r="7" fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.8 + (1 - pos) * 0.2 }} />

                    {/* Arms (Shoulder -> Elbow -> Hands) */}
                    <path d={`M 184 122 L ${elbowX1} ${elbowY} L 180 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={`M 216 122 L ${elbowX2} ${elbowY} L 220 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Barbell */}
                    <line x1="140" y1={barY} x2="260" y2={barY} stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                    <rect x="132" y={barY - 14} width="8" height="28" rx="2" fill="rgb(var(--primary-500))" opacity="0.9" />
                    <rect x="260" y={barY - 14} width="8" height="28" rx="2" fill="rgb(var(--primary-500))" opacity="0.9" />

                    {/* Trajectory */}
                    <line x1="200" y1="60" x2="200" y2="125" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="200" cy={barY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 3. LATERAL RAISE (Shoulder Abduction) ────────────────────────────
        if (pattern === 'lateral_raise') {
            const armAngle = 20 + (1 - pos) * 65; // 20 deg at bottom, 85 deg at top
            const rad = (armAngle * Math.PI) / 180;
            const armLen = 50;
            const lHandX = 185 - Math.sin(rad) * armLen;
            const lHandY = 125 + Math.cos(rad) * armLen;
            const rHandX = 215 + Math.sin(rad) * armLen;
            const rHandY = 125 + Math.cos(rad) * armLen;

            return (
                <g>
                    {/* Floor & Torso */}
                    <line x1="140" y1="225" x2="260" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />
                    <line x1="192" y1="170" x2="190" y2="224" stroke="#243447" strokeWidth="5" strokeLinecap="round" />
                    <line x1="208" y1="170" x2="210" y2="224" stroke="#243447" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 188 125 L 212 125 L 206 170 L 194 170 Z" fill="#1f2c3d" />
                    <circle cx="200" cy="110" r="9" fill="#2d3d52" />

                    {/* Target Muscle: Lateral Deltoid cap */}
                    <circle cx="184" cy="126" r="6.5" fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />
                    <circle cx="216" cy="126" r="6.5" fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />

                    {/* Arms with dumbbells */}
                    <line x1="185" y1="125" x2={lHandX} y2={lHandY} stroke="#6b7c96" strokeWidth="4" strokeLinecap="round" />
                    <line x1="215" y1="125" x2={rHandX} y2={rHandY} stroke="#6b7c96" strokeWidth="4" strokeLinecap="round" />

                    {/* Dumbbells */}
                    <circle cx={lHandX} cy={lHandY} r="5" fill="#e2e8f0" />
                    <circle cx={rHandX} cy={rHandY} r="5" fill="#e2e8f0" />

                    {/* Motion Arc Trajectory */}
                    <path d="M 170 170 A 45 45 0 0 1 135 130" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 230 170 A 45 45 0 0 0 265 130" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={rHandX} cy={rHandY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 4. FLIES / CROSSOVERS (Horizontal Adduction) ─────────────────────
        if (pattern === 'fly') {
            const spread = 25 + pos * 50; // pos=0 (contracted top), pos=1 (wide open stretch)
            const handY = 120 + pos * 15;

            return (
                <g>
                    {/* Bench */}
                    <rect x="150" y="150" width="100" height="12" rx="4" fill="#182230" stroke="#243447" strokeWidth="1.5" />
                    <circle cx="160" cy="142" r="9" fill="#2d3d52" />
                    <rect x="175" y="136" width="60" height="16" rx="6" fill="#1f2c3d" />

                    {/* Target Muscle: Chest Squeeze */}
                    <path
                        d="M 190 136 Q 200 130 210 136 Q 200 144 190 136 Z"
                        fill="rgb(var(--primary-500))"
                        style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }}
                    />

                    {/* Left & Right Arcs for Flyes */}
                    <path d={`M 185 138 Q ${185 - spread * 0.7} ${handY + 15} ${200 - spread} ${handY}`} fill="none" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />
                    <path d={`M 215 138 Q ${215 + spread * 0.7} ${handY + 15} ${200 + spread} ${handY}`} fill="none" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />

                    {/* Dumbbells */}
                    <circle cx={200 - spread} cy={handY} r="5.5" fill="#e2e8f0" />
                    <circle cx={200 + spread} cy={handY} r="5.5" fill="#e2e8f0" />

                    {/* Arc Guide */}
                    <path d="M 140 135 Q 170 115 200 118 Q 230 115 260 135" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={200 + spread} cy={handY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 5. ROW (Horizontal Pull) ─────────────────────────────────────────
        if (pattern === 'row') {
            const torsoAngle = 45; // bent over
            const handX = 190 - (1 - pos) * 35; // pos=0 (pulled to ribs), pos=1 (hanging stretch)
            const handY = 165 + pos * 30;
            const elbowX = 205 + (1 - pos) * 20;
            const elbowY = 135 - (1 - pos) * 15;

            return (
                <g>
                    {/* Floor */}
                    <line x1="120" y1="225" x2="280" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />

                    {/* Athlete Bent-Over Side View */}
                    <line x1="210" y1="224" x2="215" y2="175" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="215" y1="175" x2="170" y2="135" stroke="#1f2c3d" strokeWidth="14" strokeLinecap="round" />
                    <circle cx="160" cy="125" r="9" fill="#2d3d52" />

                    {/* Target Muscle: Upper Back & Rhomboids / Lats */}
                    <line x1="190" y1="155" x2="175" y2="140" stroke="rgb(var(--primary-500))" strokeWidth="10" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />

                    {/* Pulling Arm */}
                    <path d={`M 172 138 L ${elbowX} ${elbowY} L ${handX} ${handY}`} fill="none" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Barbell / Handle */}
                    <circle cx={handX} cy={handY} r="7" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    {/* Path line */}
                    <line x1="155" y1="195" x2="190" y2="165" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={handX} cy={handY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 6. LAT PULLDOWN / PULL-UPS (Vertical Pull) ────────────────────────
        if (pattern === 'lat_pulldown') {
            const barY = 70 + (1 - pos) * 50; // pos=0 (pulled to chest), pos=1 (extended arms at top)
            const elbowY = 85 + (1 - pos) * 45;

            return (
                <g>
                    {/* Athlete Head & Torso */}
                    <circle cx="200" cy="120" r="10" fill="#2d3d52" />
                    <path d="M 186 135 L 214 135 L 208 195 L 192 195 Z" fill="#1f2c3d" />

                    {/* Target Muscle: Latissimus Dorsi */}
                    <path
                        d="M 186 138 Q 170 155 192 180 Q 183 152 186 138 Z"
                        fill="rgb(var(--primary-500))"
                        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.75 + (1 - pos) * 0.25 }}
                    />
                    <path
                        d="M 214 138 Q 230 155 208 180 Q 217 152 214 138 Z"
                        fill="rgb(var(--primary-500))"
                        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.75 + (1 - pos) * 0.25 }}
                    />

                    {/* Arms pulling bar down */}
                    <path d={`M 186 135 L 160 ${elbowY} L 150 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={`M 214 135 L 240 ${elbowY} L 250 ${barY}`} fill="none" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Lat Pulldown Bar */}
                    <path d={`M 125 ${barY - 6} Q 200 ${barY} 275 ${barY - 6}`} fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

                    {/* Cable */}
                    <line x1="200" y1="20" x2="200" y2={barY} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <circle cx="200" cy={barY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 7. PULLOVER / LAT PRAYER (Long Lever Extension) ──────────────────
        if (pattern === 'pullover') {
            const armAngle = 25 + pos * 65; // pos=0 (arms vertical over chest), pos=1 (deep overhead stretch)
            const rad = (armAngle * Math.PI) / 180;
            const armLen = 58;
            const handX = 180 - Math.sin(rad) * armLen;
            const handY = 140 - Math.cos(rad) * armLen;

            return (
                <g>
                    {/* Bench */}
                    <rect x="140" y="155" width="120" height="12" rx="4" fill="#182230" stroke="#243447" strokeWidth="1.5" />
                    <circle cx="150" cy="148" r="9" fill="#2d3d52" />
                    <rect x="165" y="142" width="70" height="15" rx="5" fill="#1f2c3d" />

                    {/* Target: Lat Serratus & Upper Lats */}
                    <path d="M 172 142 Q 185 136 195 142 Q 185 150 172 142 Z" fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.75 + pos * 0.25 }} />

                    {/* Arms reaching back */}
                    <line x1="175" y1="145" x2={handX} y2={handY} stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx={handX} cy={handY} r="6.5" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    {/* Arc Guide */}
                    <path d="M 175 87 A 58 58 0 0 0 125 135" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={handX} cy={handY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 8. BICEPS CURL (Elbow Flexion) ───────────────────────────────────
        if (pattern === 'biceps_curl') {
            const curlAngle = 20 + (1 - pos) * 115; // 20 deg at bottom, 135 deg at peak curl
            const rad = (curlAngle * Math.PI) / 180;
            const foreArmLen = 38;
            const elbowX = 210;
            const elbowY = 155;
            const handX = elbowX - Math.sin(rad) * foreArmLen;
            const handY = elbowY - Math.cos(rad) * foreArmLen;

            return (
                <g>
                    {/* Floor & Athlete Profile */}
                    <line x1="140" y1="225" x2="260" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />
                    <line x1="195" y1="175" x2="190" y2="224" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="195" y1="125" x2="195" y2="175" stroke="#1f2c3d" strokeWidth="14" strokeLinecap="round" />
                    <circle cx="195" cy="110" r="9" fill="#2d3d52" />

                    {/* Upper Arm (Pinned at side) */}
                    <line x1="198" y1="125" x2={elbowX} y2={elbowY} stroke="#1f2c3d" strokeWidth="6" strokeLinecap="round" />

                    {/* Target Muscle: Biceps Brachii Peak */}
                    <circle cx="203" cy="138" r={5 + (1 - pos) * 3} fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />

                    {/* Forearm & Barbell / Dumbbell */}
                    <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx={handX} cy={handY} r="7" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    {/* Arc Guide */}
                    <path d="M 210 193 A 38 38 0 0 1 178 128" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={handX} cy={handY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 9. TRICEPS EXTENSION / PUSHDOWN (Elbow Extension) ────────────────
        if (pattern === 'triceps_extension') {
            const extAngle = 40 + (1 - pos) * 90; // pos=1 (forearm up 90 deg), pos=0 (locked down)
            const rad = (extAngle * Math.PI) / 180;
            const foreArmLen = 38;
            const elbowX = 205;
            const elbowY = 145;
            const handX = elbowX + Math.cos(rad) * foreArmLen;
            const handY = elbowY + Math.sin(rad) * foreArmLen;

            return (
                <g>
                    {/* Floor & Athlete */}
                    <line x1="130" y1="225" x2="270" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />
                    <line x1="185" y1="170" x2="180" y2="224" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="188" y1="125" x2="185" y2="170" stroke="#1f2c3d" strokeWidth="14" strokeLinecap="round" />
                    <circle cx="188" cy="110" r="9" fill="#2d3d52" />

                    {/* Upper Arm (Locked at side) */}
                    <line x1="190" y1="125" x2={elbowX} y2={elbowY} stroke="#1f2c3d" strokeWidth="6" strokeLinecap="round" />

                    {/* Target Muscle: Triceps Horseshoe / Long Head */}
                    <line x1="192" y1="128" x2="202" y2="142" stroke="rgb(var(--primary-500))" strokeWidth="7" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />

                    {/* Forearm & Bar / Rope */}
                    <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx={handX} cy={handY} r="6" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    {/* Cable coming from top */}
                    <line x1="205" y1="30" x2={handX} y2={handY} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <circle cx={handX} cy={handY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 10. DIPS (Parallel Bars / Bench Dip) ──────────────────────────────
        if (pattern === 'dips') {
            const bodyY = 100 + pos * 35; // pos=0 (locked out at top), pos=1 (deep dip)
            const elbowX = 225 + pos * 15;
            const elbowY = bodyY + 25;

            return (
                <g>
                    {/* Parallel Bars */}
                    <line x1="160" y1="150" x2="240" y2="150" stroke="#33465e" strokeWidth="5" strokeLinecap="round" />
                    <line x1="170" y1="150" x2="170" y2="225" stroke="#243447" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="230" y1="150" x2="230" y2="225" stroke="#243447" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Athlete Torso */}
                    <circle cx="200" cy={bodyY - 14} r="9" fill="#2d3d52" />
                    <line x1="200" y1={bodyY} x2="198" y2={bodyY + 45} stroke="#1f2c3d" strokeWidth="12" strokeLinecap="round" />

                    {/* Bent legs hanging */}
                    <path d={`M 198 ${bodyY + 45} L 195 ${bodyY + 70} L 210 ${bodyY + 75}`} fill="none" stroke="#243447" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Target: Triceps & Lower Chest */}
                    <circle cx="210" cy={bodyY + 18} r="6.5" fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.75 + (1 - pos) * 0.25 }} />

                    {/* Arm: Shoulder -> Elbow -> Hand on bar */}
                    <path d={`M 200 ${bodyY + 8} L ${elbowX} ${elbowY} L 205 150`} fill="none" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Trajectory */}
                    <line x1="200" y1="90" x2="200" y2="140" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="200" cy={bodyY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 11. SQUAT / LEG PRESS (Knee-Hip Compound) ────────────────────────
        if (pattern === 'squat') {
            const hipY = 120 + pos * 45;
            const kneeX = 220 + pos * 15;
            const kneeY = 160 + pos * 10;
            const torsoY = 75 + pos * 45;

            return (
                <g>
                    {/* Floor */}
                    <line x1="110" y1="225" x2="290" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />

                    <circle cx="188" cy={torsoY - 14} r="10" fill="#2d3d52" />
                    <line x1="190" y1={torsoY} x2="180" y2={hipY} stroke="#1f2c3d" strokeWidth="16" strokeLinecap="round" />

                    {/* Target Muscle: Quadriceps & Glutes */}
                    <circle cx="176" cy={hipY + 4} r="12" fill="rgb(var(--primary-500))" opacity={0.6 + pos * 0.4} style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))' }} />
                    <line x1="180" y1={hipY} x2={kneeX} y2={kneeY} stroke="rgb(var(--primary-500))" strokeWidth="12" strokeLinecap="round" opacity={0.7 + pos * 0.3} style={{ filter: 'drop-shadow(0 0 5px rgb(var(--primary-500)))' }} />

                    <line x1={kneeX} y1={kneeY} x2="205" y2="224" stroke="#6b7c96" strokeWidth="8" strokeLinecap="round" />
                    <line x1="195" y1="224" x2="225" y2="224" stroke="#2d3d52" strokeWidth="6" strokeLinecap="round" />

                    {/* Barbell on Traps */}
                    <circle cx="188" cy={torsoY + 2} r="6" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    <line x1="205" y1="50" x2="205" y2="224" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="188" cy={torsoY + 2} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 12. DEADLIFT / RDL / HINGE (Posterior Chain) ─────────────────────
        if (pattern === 'deadlift') {
            const hipX = 180 - pos * 30; // hips travel back
            const hipY = 135 + pos * 15;
            const shoulderX = 205 + pos * 15;
            const shoulderY = 95 + pos * 45;
            const barY = 145 + pos * 60; // pos=0 (lockout at hips), pos=1 (below knees)

            return (
                <g>
                    {/* Floor */}
                    <line x1="120" y1="225" x2="280" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />

                    {/* Legs (Knees slightly soft, hips hinged) */}
                    <line x1="215" y1="224" x2="210" y2="175" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="210" y1="175" x2={hipX} y2={hipY} stroke="rgb(var(--primary-500))" strokeWidth="10" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--primary-500)))', opacity: 0.7 + pos * 0.3 }} />

                    {/* Glutes & Hamstrings */}
                    <circle cx={hipX} cy={hipY} r="10" fill="rgb(var(--primary-500))" opacity={0.75 + pos * 0.25} />

                    {/* Spine / Torso (Flat, neutral angle) */}
                    <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke="#1f2c3d" strokeWidth="14" strokeLinecap="round" />
                    <circle cx={shoulderX + 5} cy={shoulderY - 12} r="9" fill="#2d3d52" />

                    {/* Arms holding barbell close to legs */}
                    <line x1={shoulderX} y1={shoulderY} x2="218" y2={barY} stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />

                    {/* Barbell & Plates */}
                    <circle cx="218" cy={barY} r="9" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2.5" />

                    {/* Vertical Bar Path */}
                    <line x1="218" y1="130" x2="218" y2="215" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="218" cy={barY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 13. LEG EXTENSION (Quadriceps Isolation) ─────────────────────────
        if (pattern === 'leg_extension') {
            const extAngle = 10 + (1 - pos) * 75; // 10 deg bent down, 85 deg fully extended
            const rad = (extAngle * Math.PI) / 180;
            const shinLen = 42;
            const kneeX = 210;
            const kneeY = 160;
            const ankleX = kneeX + Math.sin(rad) * shinLen;
            const ankleY = kneeY + Math.cos(rad) * shinLen;

            return (
                <g>
                    {/* Machine Seat */}
                    <line x1="150" y1="170" x2="210" y2="170" stroke="#33465e" strokeWidth="5" strokeLinecap="round" />
                    <line x1="150" y1="170" x2="140" y2="115" stroke="#33465e" strokeWidth="5" strokeLinecap="round" />

                    {/* Torso sitting back */}
                    <line x1="155" y1="168" x2="150" y2="120" stroke="#1f2c3d" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="150" cy="106" r="9" fill="#2d3d52" />

                    {/* Upper Leg / Thigh on pad */}
                    <line x1="155" y1="168" x2={kneeX} y2={kneeY} stroke="#1f2c3d" strokeWidth="11" strokeLinecap="round" />

                    {/* Target Muscle: Quadriceps teardrop & rectus femoris */}
                    <line x1="165" y1="165" x2={kneeX - 4} y2={kneeY - 2} stroke="rgb(var(--primary-500))" strokeWidth="9" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />

                    {/* Lower Leg extending upwards */}
                    <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" />

                    {/* Roller Pad at ankle */}
                    <circle cx={ankleX} cy={ankleY} r="7" fill="rgb(var(--primary-500))" opacity="0.9" />

                    {/* Arc Guide */}
                    <path d="M 215 200 A 42 42 0 0 0 250 165" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={ankleX} cy={ankleY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 14. LEG CURL (Hamstrings Isolation) ──────────────────────────────
        if (pattern === 'leg_curl') {
            const curlAngle = 10 + (1 - pos) * 75; // pos=0 (flexed to 85 deg), pos=1 (extended)
            const rad = (curlAngle * Math.PI) / 180;
            const shinLen = 40;
            const kneeX = 185;
            const kneeY = 155;
            const ankleX = kneeX - Math.cos(rad) * shinLen;
            const ankleY = kneeY - Math.sin(rad) * shinLen;

            return (
                <g>
                    {/* Machine Bench (Lying Prone) */}
                    <rect x="130" y="158" width="130" height="10" rx="3" fill="#182230" stroke="#243447" strokeWidth="1.5" />

                    {/* Torso lying face down */}
                    <rect x="180" y="146" width="70" height="12" rx="4" fill="#1f2c3d" />
                    <circle cx="260" cy="150" r="8" fill="#2d3d52" />

                    {/* Thigh on bench */}
                    <line x1="185" y1="152" x2="150" y2="152" stroke="#1f2c3d" strokeWidth="10" strokeLinecap="round" />

                    {/* Target Muscle: Hamstrings */}
                    <line x1="180" y1="150" x2="155" y2="150" stroke="rgb(var(--primary-500))" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.7 + (1 - pos) * 0.3 }} />

                    {/* Shin curling up toward glutes */}
                    <line x1="150" y1="152" x2={ankleX} y2={ankleY} stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />

                    {/* Roller pad */}
                    <circle cx={ankleX} cy={ankleY} r="6.5" fill="rgb(var(--primary-500))" opacity="0.9" />

                    {/* Arc Guide */}
                    <path d="M 110 152 A 40 40 0 0 1 145 115" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={ankleX} cy={ankleY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 15. CALF RAISE (Plantarflexion) ──────────────────────────────────
        if (pattern === 'calf_raise') {
            const bodyY = 125 - (1 - pos) * 22; // pos=0 (high on toes), pos=1 (drop in stretch)
            const heelY = 220 - (1 - pos) * 16;

            return (
                <g>
                    {/* Calf Step Block */}
                    <rect x="160" y="222" width="70" height="15" rx="3" fill="#182230" stroke="#243447" strokeWidth="1.5" />

                    {/* Foot on block */}
                    <line x1="200" y1="222" x2="215" y2="222" stroke="#243447" strokeWidth="5" strokeLinecap="round" />
                    <line x1="200" y1="222" x2="190" y2={heelY} stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" />

                    {/* Lower Leg */}
                    <line x1="200" y1={heelY - 2} x2="202" y2={bodyY + 45} stroke="#1f2c3d" strokeWidth="7" strokeLinecap="round" />

                    {/* Target Muscle: Gastrocnemius & Soleus */}
                    <circle cx="198" cy={bodyY + 58} r={6 + (1 - pos) * 2} fill="rgb(var(--primary-500))" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.75 + (1 - pos) * 0.25 }} />

                    {/* Upper Body Standing Tall */}
                    <line x1="202" y1={bodyY + 45} x2="200" y2={bodyY} stroke="#1f2c3d" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="200" cy={bodyY - 14} r="9" fill="#2d3d52" />

                    {/* Trajectory */}
                    <line x1="215" y1="95" x2="215" y2="135" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="215" cy={bodyY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 16. ABS CRUNCH / LEG RAISE (Spinal Flexion) ───────────────────────
        if (pattern === 'abs_crunch') {
            const curlAngle = 10 + (1 - pos) * 35; // pos=0 (curled up crunch), pos=1 (flat stretch)
            const rad = (curlAngle * Math.PI) / 180;
            const torsoX = 180 + Math.cos(rad) * 45;
            const torsoY = 160 - Math.sin(rad) * 45;

            return (
                <g>
                    {/* Floor Mat */}
                    <line x1="120" y1="180" x2="280" y2="180" stroke="#243447" strokeWidth="3" strokeLinecap="round" />

                    {/* Hips & Bent Knees */}
                    <line x1="175" y1="178" x2="150" y2="155" stroke="#243447" strokeWidth="7" strokeLinecap="round" />
                    <line x1="150" y1="155" x2="135" y2="178" stroke="#243447" strokeWidth="6" strokeLinecap="round" />

                    {/* Torso crunching up */}
                    <line x1="175" y1="178" x2={torsoX} y2={torsoY} stroke="#1f2c3d" strokeWidth="14" strokeLinecap="round" />
                    <circle cx={torsoX + 6} cy={torsoY - 8} r="9" fill="#2d3d52" />

                    {/* Target Muscle: Rectus Abdominis Six-Pack */}
                    <line x1="178" y1="174" x2={torsoX - 5} y2={torsoY + 5} stroke="rgb(var(--primary-500))" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.75 + (1 - pos) * 0.25 }} />

                    {/* Hands at temples */}
                    <circle cx={torsoX + 2} cy={torsoY - 8} r="4" fill="#6b7c96" />

                    {/* Arc Guide */}
                    <path d="M 225 178 A 45 45 0 0 1 205 130" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={torsoX} cy={torsoY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 17. SHRUGS (Scapular Elevation) ──────────────────────────────────
        if (pattern === 'shrugs') {
            const shoulderY = 120 - (1 - pos) * 15; // pos=0 (shrugged up high), pos=1 (depressed)

            return (
                <g>
                    {/* Floor & Legs */}
                    <line x1="130" y1="225" x2="270" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />
                    <line x1="190" y1="170" x2="185" y2="224" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="210" y1="170" x2="215" y2="224" stroke="#243447" strokeWidth="6" strokeLinecap="round" />
                    <line x1="200" y1="170" x2="200" y2="128" stroke="#1f2c3d" strokeWidth="16" strokeLinecap="round" />
                    <circle cx="200" cy="106" r="9" fill="#2d3d52" />

                    {/* Target: Upper Trapezius */}
                    <path
                        d={`M 185 ${shoulderY + 6} Q 200 ${shoulderY - 5} 215 ${shoulderY + 6} L 208 140 L 192 140 Z`}
                        fill="rgb(var(--primary-500))"
                        style={{ filter: 'drop-shadow(0 0 7px rgb(var(--primary-500)))', opacity: 0.75 + (1 - pos) * 0.25 }}
                    />

                    {/* Arms hanging with dumbbells */}
                    <line x1="184" y1={shoulderY + 6} x2="180" y2="175" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="216" y1={shoulderY + 6} x2="220" y2="175" stroke="#6b7c96" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx="180" cy="175" r="6" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />
                    <circle cx="220" cy="175" r="6" fill="#e2e8f0" stroke="rgb(var(--primary-500))" strokeWidth="2" />

                    <circle cx="200" cy={shoulderY} r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 18. CARDIO (Dynamic Runner Silhouette) ───────────────────────────
        if (pattern === 'cardio') {
            const runCycle = Math.sin(progress * Math.PI * 4); // fast runner stride
            const leg1X = 200 + runCycle * 25;
            const leg2X = 200 - runCycle * 25;
            const arm1X = 200 - runCycle * 20;
            const arm2X = 200 + runCycle * 20;

            return (
                <g>
                    {/* Moving Ground Track */}
                    <line x1="120" y1="225" x2="280" y2="225" stroke="#243447" strokeWidth="2" strokeLinecap="round" />
                    <line x1={150 + runCycle * 10} y1="228" x2={180 + runCycle * 10} y2="228" stroke="#33465e" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1={220 + runCycle * 10} y1="228" x2={250 + runCycle * 10} y2="228" stroke="#33465e" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Runner Torso tilted forward */}
                    <line x1="195" y1="165" x2="208" y2="120" stroke="#1f2c3d" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="214" cy="108" r="9" fill="#2d3d52" />

                    {/* Cardiovascular Aerobic Core Glow */}
                    <circle cx="202" cy="138" r="14" fill="rgb(var(--primary-500))" opacity="0.8" style={{ filter: 'drop-shadow(0 0 10px rgb(var(--primary-500)))' }} />

                    {/* Striding Legs */}
                    <line x1="195" y1="165" x2={leg1X} y2="222" stroke="#6b7c96" strokeWidth="5" strokeLinecap="round" />
                    <line x1="195" y1="165" x2={leg2X} y2="215" stroke="#243447" strokeWidth="5" strokeLinecap="round" />

                    {/* Pumping Arms */}
                    <line x1="208" y1="125" x2={arm1X} y2="148" stroke="#6b7c96" strokeWidth="4" strokeLinecap="round" />
                    <line x1="208" y1="125" x2={arm2X} y2="148" stroke="#33465e" strokeWidth="4" strokeLinecap="round" />

                    <circle cx="214" cy="108" r="3" fill="#00E5DB" />
                </g>
            );
        }

        // ── 19. DEFAULT ISOLATION / GENERIC ──────────────────────────────────
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
        <div className="w-full rounded-2xl overflow-hidden border border-[rgb(var(--border-subtle))] bg-zinc-950 dark:bg-[#071424] shadow-md transition-all">
            {/* ── Apple Fitness+ Vector Stage ───────────────────────────────── */}
            <div className="relative w-full aspect-[16/10] sm:aspect-video flex items-center justify-center overflow-hidden select-none bg-[#071424]">
                <div
                    className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-700"
                    style={{
                        background: 'radial-gradient(circle at 50% 45%, rgb(var(--primary-500) / 0.28) 0%, transparent 68%)',
                    }}
                />

                {/* Vector SVG Animation Canvas */}
                <svg
                    viewBox="0 0 400 250"
                    className="w-full h-full relative z-10"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#00E5DB" stopOpacity="1" />
                            <stop offset="100%" stopColor="#00E5DB" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {renderVectorFigure()}
                </svg>

                {/* Real-time Biological Tempo & Phase Indicator (Apple-style HUD) */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md transition-colors ${phaseColor}`}>
                            {phaseName}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline-block backdrop-blur-sm bg-black/40 px-2 py-1 rounded-md">
                            {phaseInstruction}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/50 border border-white/10 px-2.5 py-1 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-300">
                            {copy.tempoBadge}
                        </span>
                    </div>
                </div>

                {/* Play/Pause & Slow-Motion Glassmorphic Controls */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
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
