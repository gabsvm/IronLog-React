
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES } from '../../data/disciplineExercises';
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

// Curated Calisthenics skill sessions
const CAL_SKILLS = [
    { id: 'push_basics', name: 'Push Day (Beginner)', exercises: ['cal_pu_std', 'cal_diamond_pu', 'cal_pike_pu', 'cal_dip_std'], icon: 'ChevronUp' },
    { id: 'pull_basics', name: 'Pull Day (Beginner)', exercises: ['cal_au_pullup', 'cal_neg_pullup', 'cal_pullup', 'cal_scap_pull'], icon: 'ChevronDown' },
    { id: 'core', name: 'Core Session', exercises: ['cal_plank', 'cal_tuck_lsit', 'cal_dragon_flag', 'cal_hanging_lraise'], icon: 'Circle' },
    { id: 'handstand', name: 'Handstand Practice', exercises: ['cal_pike_pu', 'cal_handstand', 'cf_hspu', 'cal_freestand_hs'], icon: 'ArrowUp' },
    { id: 'planche', name: 'Planche Progression', exercises: ['cal_planche_lean', 'cal_tuck_planche', 'cal_adv_tuck_planche', 'cal_straddle_planche'], icon: 'Maximize2' },
    { id: 'front_lever', name: 'Front Lever Progression', exercises: ['cal_scap_pull', 'cal_tuck_fl', 'cal_straddle_fl', 'cal_full_fl'], icon: 'Minus' },
    { id: 'muscle_up', name: 'Muscle Up Progression', exercises: ['cal_pullup', 'cal_au_pullup', 'cal_neg_pullup', 'cal_bar_mu'], icon: 'Award' },
    { id: 'lower_cal', name: 'Leg Day (Calisthenics)', exercises: ['cal_squat_bw', 'cal_bulgariansq', 'cal_nordic_curl', 'cal_pistol'], icon: 'Footprints' },
];

const makeSessionExercise = (ex: ExerciseDef, reps = 10, sets = 3): SessionExercise => {
    const setArr: WorkoutSet[] = Array.from({ length: sets }, (_, i) => ({
        id: i + 1,
        weight: '0',
        reps: String(reps),
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
            return makeSessionExercise(ex, 8, 4);
        });
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: skill.name,
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
        (discipline === 'calisthenics' && !!selectedSkillId);

    const handleStart = () => {
        if (discipline === 'gym') handleStartFreeGym();
        else if (discipline === 'crossfit') handleStartWod();
        else handleStartSkill();
    };

    const startLabel = (() => {
        if (discipline === 'gym') return lang === 'es' ? '🏋️ Iniciar Sesión Libre' : '🏋️ Start Free Session';
        if (discipline === 'crossfit') {
            const w = CF_WODS.find(w => w.id === selectedWodId);
            return w ? `⚡ WOD: ${w.name}` : (lang === 'es' ? 'Selecciona un WOD' : 'Select a WOD');
        }
        const s = CAL_SKILLS.find(s => s.id === selectedSkillId);
        return s ? `🤸 ${s.name}` : (lang === 'es' ? 'Selecciona una sesión' : 'Select a session');
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

            {/* CALISTHENICS: Skill sessions */}
            {discipline === 'calisthenics' && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {lang === 'es' ? 'Sesiones por Habilidad' : 'Skill Sessions'}
                    </p>
                    {CAL_SKILLS.map(skill => (
                        <button
                            key={skill.id}
                            onClick={() => setSelectedSkillId(skill.id === selectedSkillId ? null : skill.id)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                                selectedSkillId === skill.id
                                    ? 'border-violet-500 bg-violet-500/5'
                                    : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    selectedSkillId === skill.id ? 'bg-violet-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                }`}>
                                    <Icon name={skill.icon as any} size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-black text-sm ${selectedSkillId === skill.id ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-900 dark:text-white'}`}>
                                        {skill.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5">
                                        {skill.exercises.length} {lang === 'es' ? 'ejercicios' : 'exercises'}
                                    </div>
                                </div>
                                {selectedSkillId === skill.id && (
                                    <Icon name="Check" size={16} className="text-violet-500 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Modal>
    );
};
