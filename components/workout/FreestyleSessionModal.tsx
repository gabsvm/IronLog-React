
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES } from '../../data/disciplineExercises';
import { SKILL_PROGRESSION_MAP } from '../../data/SkillProgressionMap';
import { ExerciseDef, ActiveSession, SessionExercise, WorkoutSet } from '../../types';

interface FreestyleSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (session: ActiveSession) => void;
}

type Discipline = 'gym' | 'crossfit' | 'calisthenics';

// Curated WOD templates (CrossFit benchmark / hero workouts)
const CF_WODS = [
    {
        id: 'fran',
        name: 'Fran',
        description: '21-15-9: Thrusters + Pull-Ups',
        schema: '21-15-9 reps for time',
        exercises: ['cf_thruster', 'cal_pullup'],
        sets: [21, 15, 9],
        type: 'for_time' as const,
    },
    {
        id: 'cindy',
        name: 'Cindy',
        description: '20 min AMRAP: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats',
        schema: '20 min AMRAP',
        exercises: ['cal_pullup', 'cal_pu_std', 'cal_squat_bw'],
        sets: [5, 10, 15],
        type: 'amrap' as const,
    },
    {
        id: 'helen',
        name: 'Helen',
        description: '3 rounds: 400m Run, 21 KB Swings, 12 Pull-Ups',
        schema: '3 rounds for time',
        exercises: ['cardio_run', 'cf_kb_swing', 'cal_pullup'],
        sets: [1, 21, 12],
        type: 'for_time' as const,
    },
    {
        id: 'dt',
        name: 'DT',
        description: '5 rounds: 12 Deadlifts, 9 Hang PC, 6 Push Jerks',
        schema: '5 rounds for time',
        exercises: ['cf_deadlift', 'cf_hang_clean', 'cf_clean_jerk'],
        sets: [12, 9, 6],
        type: 'for_time' as const,
    },
    {
        id: 'angie',
        name: 'Angie',
        description: '100 Pull-Ups, 100 Push-Ups, 100 Sit-Ups, 100 Squats',
        schema: 'For time (in order)',
        exercises: ['cal_pullup', 'cal_pu_std', 'cf_ghd', 'cal_squat_bw'],
        sets: [100, 100, 100, 100],
        type: 'for_time' as const,
    },
    {
        id: 'grace',
        name: 'Grace',
        description: '30 Clean & Jerks for time',
        schema: '30 reps for time',
        exercises: ['cf_clean_jerk'],
        sets: [30],
        type: 'for_time' as const,
    },
    {
        id: 'jackie',
        name: 'Jackie',
        description: '1000m Row, 50 Thrusters (45lb), 30 Pull-Ups',
        schema: 'For time',
        exercises: ['cf_row_cal', 'cf_thruster', 'cal_pullup'],
        sets: [1, 50, 30],
        type: 'for_time' as const,
    },
    {
        id: 'murph',
        name: 'Murph',
        description: '1mi Run, 100 Pull-Ups, 200 Push-Ups, 300 Squats, 1mi Run',
        schema: 'For time (with vest optional)',
        exercises: ['cardio_run', 'cal_pullup', 'cal_pu_std', 'cal_squat_bw', 'cardio_run'],
        sets: [1, 100, 200, 300, 1],
        type: 'for_time' as const,
    },
];

// Curated Calisthenics full-day templates
const CAL_SKILLS = [
    {
        id: 'push_full',
        name: { en: 'Push Day', es: 'Día de Empuje' },
        description: { en: 'Chest · Shoulders · Triceps', es: 'Pecho · Hombros · Tríceps' },
        exercises: ['cal_pu_std', 'cal_archer_pu', 'cal_pike_pu', 'cal_dip_std', 'cal_diamond_pu'],
        icon: 'ChevronUp',
        color: 'bg-red-500'
    },
    {
        id: 'pull_full',
        name: { en: 'Pull Day', es: 'Día de Tracción' },
        description: { en: 'Back · Biceps · Rear Delt', es: 'Espalda · Bíceps · Deltoides Posterior' },
        exercises: ['cal_scap_pull', 'cal_au_pullup', 'cal_pullup', 'cal_chinup', 'cal_comm_pullup'],
        icon: 'ChevronDown',
        color: 'bg-blue-500'
    },
    {
        id: 'core_full',
        name: { en: 'Core Session', es: 'Sesión de Core' },
        description: { en: 'Abs · Anti-extension · Compression', es: 'Abdomen · Anti-extensión · Compresión' },
        exercises: ['cal_plank', 'cal_tuck_lsit', 'cal_hanging_lraise', 'cal_dragon_flag', 'cal_ab_wheel'],
        icon: 'Circle',
        color: 'bg-amber-500'
    },
    {
        id: 'legs_full',
        name: { en: 'Leg Day', es: 'Día de Piernas' },
        description: { en: 'Quads · Hamstrings · Glutes', es: 'Cuádriceps · Isquios · Glúteos' },
        exercises: ['cal_squat_bw', 'cal_bulgariansq', 'cal_pistol', 'cal_nordic_curl', 'cal_glute_bridge_bw'],
        icon: 'Footprints',
        color: 'bg-emerald-500'
    },
    {
        id: 'full_upper',
        name: { en: 'Full Upper Body', es: 'Tren Superior Completo' },
        description: { en: 'Push + Pull + Shoulders', es: 'Empuje + Tracción + Hombros' },
        exercises: ['cal_pullup', 'cal_pu_std', 'cal_dip_std', 'cal_pike_pu', 'cal_l_pullup'],
        icon: 'Award',
        color: 'bg-violet-500'
    },
];

const makeSessionExercise = (ex: ExerciseDef, reps = 10, sets = 3): SessionExercise => {
    const isIsometric = !!(ex as any).isIsometric;
    const setArr: WorkoutSet[] = Array.from({ length: sets }, (_, i) => ({
        id: i + 1,
        weight: '0',
        reps: isIsometric ? '' : String(reps),
        duration: isIsometric ? 0 : undefined,
        rpe: '',
        completed: false,
        type: 'regular' as const,
    }));
    return { ...ex, instanceId: Date.now() + Math.random(), sets: setArr };
};

export const FreestyleSessionModal: React.FC<FreestyleSessionModalProps> = ({ isOpen, onClose, onStart }) => {
    const { lang, exercises: gymExercises } = useApp();
    const [discipline, setDiscipline] = useState<Discipline>('gym');
    const [selectedWodId, setSelectedWodId] = useState<string | null>(null);
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [selectedSkillFamilyId, setSelectedSkillFamilyId] = useState<string | null>(null);
    const [calTab, setCalTab] = useState<'skills' | 'templates'>('skills');
    const [query, setQuery] = useState('');

    const allExercises = useMemo(() => [
        ...gymExercises,
        ...CROSSFIT_EXERCISES,
        ...CALISTHENICS_EXERCISES,
    ], [gymExercises]);

    const handleStartFreeGym = () => {
        const sessionExs: SessionExercise[] = [];
        const session: ActiveSession = {
            id: Date.now(),
            dayIdx: -1,
            name: lang === 'es' ? 'Sesión Libre (Gym)' : 'Freestyle Gym Session',
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: sessionExs,
        };
        onStart(session);
        onClose();
    };

    const handleStartWod = () => {
        const wod = CF_WODS.find(w => w.id === selectedWodId);
        if (!wod) return;
        const exs: SessionExercise[] = wod.exercises.map((id, idx) => {
            const ex = allExercises.find(e => e.id === id) || CROSSFIT_EXERCISES[0];
            const reps = wod.sets[idx] || 10;
            return makeSessionExercise(ex, reps, 1);
        });
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: `WOD: ${wod.name} — ${wod.schema}`,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: exs,
        });
        onClose();
    };

    const handleStartSkill = () => {
        const skill = CAL_SKILLS.find(s => s.id === selectedSkillId);
        if (!skill) return;
        const exs: SessionExercise[] = skill.exercises.map(id => {
            const ex = allExercises.find(e => e.id === id) || CALISTHENICS_EXERCISES[0];
            const isIso = !!(ex as any).isIsometric;
            return makeSessionExercise(ex, isIso ? 0 : 8, isIso ? 5 : 4);
        });
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: lang === 'es' ? skill.name.es : skill.name.en,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: exs,
        });
        onClose();
    };

    const handleStartSkillFamily = () => {
        const family = SKILL_PROGRESSION_MAP[selectedSkillFamilyId || ''];
        if (!family) return;
        // Load all levels of the skill family as exercises for a focused skill session
        const exs: SessionExercise[] = family.levels.map(lvl => {
            const ex = allExercises.find(e => e.id === lvl.exerciseId);
            if (!ex) return null;
            const isIso = !!(ex as any).isIsometric;
            return makeSessionExercise(ex, isIso ? 0 : 6, isIso ? 5 : 4);
        }).filter(Boolean) as SessionExercise[];
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: `🎯 ${lang === 'es' ? family.name.es : family.name.en}`,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: exs,
        });
        onClose();
    };

    const tabStyle = (active: boolean, color: string) =>
        `flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all active:scale-95 ${
            active ? `${color} text-white shadow-lg` : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`;

    const canStart =
        (discipline === 'gym') ||
        (discipline === 'crossfit' && !!selectedWodId) ||
        (discipline === 'calisthenics' && (!!selectedSkillId || !!selectedSkillFamilyId));

    const handleStart = () => {
        if (discipline === 'gym') handleStartFreeGym();
        else if (discipline === 'crossfit') handleStartWod();
        else if (selectedSkillFamilyId) handleStartSkillFamily();
        else handleStartSkill();
    };

    const startLabel = (() => {
        if (discipline === 'gym') return lang === 'es' ? '🏋️ Iniciar Sesión Libre' : '🏋️ Start Free Session';
        if (discipline === 'crossfit') {
            const w = CF_WODS.find(w => w.id === selectedWodId);
            return w ? `⚡ WOD: ${w.name}` : (lang === 'es' ? 'Selecciona un WOD' : 'Select a WOD');
        }
        if (selectedSkillFamilyId) {
            const fam = SKILL_PROGRESSION_MAP[selectedSkillFamilyId];
            return fam ? `🎯 ${lang === 'es' ? fam.name.es : fam.name.en}` : '🤸 Skill Session';
        }
        const s = CAL_SKILLS.find(s => s.id === selectedSkillId);
        return s ? `🤸 ${lang === 'es' ? s.name.es : s.name.en}` : (lang === 'es' ? 'Selecciona una sesión' : 'Select a session');
    })();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={lang === 'es' ? 'Nueva Sesión' : 'New Session'}
            footer={
                <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                    style={{ background: discipline === 'crossfit' ? '#10b981' : discipline === 'calisthenics' ? '#8b5cf6' : '#ef4444' }}
                >
                    {startLabel}
                </button>
            }
        >
            {/* Discipline Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-5 gap-1">
                <button
                    className={tabStyle(discipline === 'gym', 'bg-red-500 shadow-red-500/30')}
                    onClick={() => setDiscipline('gym')}
                >
                    <span className="flex items-center justify-center gap-1">
                        <Icon name="Dumbbell" size={12} />
                        {lang === 'es' ? 'Gym' : 'Gym'}
                    </span>
                </button>
                <button
                    className={tabStyle(discipline === 'crossfit', 'bg-emerald-500 shadow-emerald-500/30')}
                    onClick={() => setDiscipline('crossfit')}
                >
                    <span className="flex items-center justify-center gap-1">
                        <Icon name="Zap" size={12} />
                        CrossFit
                    </span>
                </button>
                <button
                    className={tabStyle(discipline === 'calisthenics', 'bg-violet-500 shadow-violet-500/30')}
                    onClick={() => setDiscipline('calisthenics')}
                >
                    <span className="flex items-center justify-center gap-1">
                        <Icon name="User" size={12} />
                        Calistenia
                    </span>
                </button>
            </div>

            {/* GYM: Free-form */}
            {discipline === 'gym' && (
                <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 p-6 text-center">
                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Icon name="Dumbbell" size={28} className="text-red-500" />
                        </div>
                        <h3 className="font-black text-zinc-900 dark:text-white mb-1">
                            {lang === 'es' ? 'Sesión Libre de Gym' : 'Free Gym Session'}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            {lang === 'es'
                                ? 'Empieza con una sesión en blanco. Agrega los ejercicios que quieras durante el entreno.'
                                : 'Start with a blank session. Add whatever exercises you want during the workout.'}
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                            {lang === 'es' ? '💡 Durante el entreno puedes:' : '💡 During the workout you can:'}
                        </p>
                        {[
                            lang === 'es' ? 'Agregar cualquier ejercicio de la biblioteca' : 'Add any exercise from the library',
                            lang === 'es' ? 'Crear ejercicios personalizados' : 'Create custom exercises',
                            lang === 'es' ? 'Configurar pesos, reps y RPE al instante' : 'Track weights, reps and RPE instantly',
                        ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                <span className="text-xs text-zinc-600 dark:text-zinc-300">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CROSSFIT: WOD picker */}
            {discipline === 'crossfit' && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {lang === 'es' ? 'WODs Benchmark & Hero' : 'Benchmark & Hero WODs'}
                    </p>
                    {CF_WODS.map(wod => (
                        <button
                            key={wod.id}
                            onClick={() => setSelectedWodId(wod.id === selectedWodId ? null : wod.id)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                                selectedWodId === wod.id
                                    ? 'border-emerald-500 bg-emerald-500/5'
                                    : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 font-black ${
                                    selectedWodId === wod.id ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                                }`}>
                                    {wod.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-black text-sm ${selectedWodId === wod.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                                        {wod.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">{wod.description}</div>
                                    <div className={`text-[9px] font-black uppercase tracking-wider mt-1 ${selectedWodId === wod.id ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                        {wod.schema}
                                    </div>
                                </div>
                                {selectedWodId === wod.id && (
                                    <Icon name="Check" size={16} className="text-emerald-500 flex-shrink-0 mt-1" />
                                )}
                            </div>
                        </button>
                    ))}
                    <p className="text-[10px] text-zinc-400 text-center pt-1">
                        {lang === 'es' ? '+ Puedes agregar ejercicios extra durante el WOD' : '+ You can add extra exercises during the WOD'}
                    </p>
                </div>
            )}

            {/* CALISTHENICS: Skill Builder */}
            {discipline === 'calisthenics' && (
                <div className="space-y-4">
                    {/* Sub-tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => { setCalTab('skills'); setSelectedSkillFamilyId(null); }}
                            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                calTab === 'skills' ? 'bg-violet-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {lang === 'es' ? '🎯 Por Habilidad' : '🎯 By Skill'}
                        </button>
                        <button
                            onClick={() => { setCalTab('templates'); setSelectedSkillId(null); setSelectedSkillFamilyId(null); }}
                            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                calTab === 'templates' ? 'bg-violet-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {lang === 'es' ? '📋 Plantillas' : '📋 Templates'}
                        </button>
                    </div>

                    {/* SKILL FAMILIES */}
                    {calTab === 'skills' && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {lang === 'es' ? 'Elige una familia de habilidad para trabajar' : 'Choose a skill family to focus on'}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(SKILL_PROGRESSION_MAP).map(family => {
                                    const isSelected = selectedSkillFamilyId === family.id;
                                    const colorMap: Record<string, string> = {
                                        'bg-violet-500': 'border-violet-500 bg-violet-500/10 text-violet-400',
                                        'bg-blue-500': 'border-blue-500 bg-blue-500/10 text-blue-400',
                                        'bg-amber-500': 'border-amber-500 bg-amber-500/10 text-amber-400',
                                        'bg-emerald-500': 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
                                        'bg-rose-500': 'border-rose-500 bg-rose-500/10 text-rose-400',
                                        'bg-cyan-500': 'border-cyan-500 bg-cyan-500/10 text-cyan-400',
                                    };
                                    const selectedClass = colorMap[family.color] ?? 'border-violet-500 bg-violet-500/10 text-violet-400';
                                    return (
                                        <button
                                            key={family.id}
                                            onClick={() => {
                                                setSelectedSkillFamilyId(isSelected ? null : family.id);
                                                setSelectedSkillId(null);
                                            }}
                                            className={`p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                                                isSelected
                                                    ? selectedClass
                                                    : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Icon name={family.icon as any} size={14} />
                                                <span className="text-[11px] font-black">
                                                    {lang === 'es' ? family.name.es : family.name.en}
                                                </span>
                                            </div>
                                            <div className="text-[9px] text-zinc-500">
                                                {family.levels.length} {lang === 'es' ? 'niveles' : 'levels'}
                                            </div>
                                            {/* Level dots */}
                                            <div className="flex gap-0.5 mt-1.5">
                                                {family.levels.map((_, i) => (
                                                    <div key={i} className={`w-2 h-1.5 rounded-full ${
                                                        isSelected ? family.color : 'bg-zinc-700'
                                                    }`} />
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedSkillFamilyId && (() => {
                                const fam = SKILL_PROGRESSION_MAP[selectedSkillFamilyId];
                                if (!fam) return null;
                                return (
                                    <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-3 space-y-1.5">
                                        <p className="text-[10px] font-black uppercase text-violet-400 tracking-wider">
                                            {lang === 'es' ? 'Ejercicios en esta sesión:' : 'Exercises in this session:'}
                                        </p>
                                        {fam.levels.map((lvl, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                                <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                                                <span className="text-zinc-300">
                                                    {lang === 'es' ? lvl.name.es : lvl.name.en}
                                                </span>
                                                {lvl.unlockAt && (
                                                    <span className="text-zinc-600 ml-auto">
                                                        ({lvl.unlockAt.value}{lvl.unlockAt.unit === 'sec' ? 's' : 'r'})
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* SESSION TEMPLATES */}
                    {calTab === 'templates' && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {lang === 'es' ? 'Sesiones de día completo' : 'Full-day sessions'}
                            </p>
                            {CAL_SKILLS.map(skill => {
                                const isSelected = selectedSkillId === skill.id;
                                return (
                                    <button
                                        key={skill.id}
                                        onClick={() => { setSelectedSkillId(isSelected ? null : skill.id); setSelectedSkillFamilyId(null); }}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                                            isSelected
                                                ? 'border-violet-500 bg-violet-500/5'
                                                : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                isSelected ? skill.color + ' text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                            }`}>
                                                <Icon name={skill.icon as any} size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-black text-sm ${
                                                    isSelected ? 'text-violet-400' : 'text-zinc-900 dark:text-white'
                                                }`}>
                                                    {lang === 'es' ? skill.name.es : skill.name.en}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                                    {lang === 'es' ? skill.description.es : skill.description.en}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 gap-1">
                                                <span className="text-[9px] font-bold text-zinc-500">
                                                    {skill.exercises.length} {lang === 'es' ? 'ej.' : 'ex.'}
                                                </span>
                                                {isSelected && <Icon name="Check" size={14} className="text-violet-500" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
