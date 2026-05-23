import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { TWO_BLOCK_PROTOCOLS, TWO_BLOCK_PHILOSOPHY, TwoBlockProtocol } from '../../data/twoBlockMass';
import { ActiveSession, SessionExercise, WorkoutSet, MuscleGroup, ExerciseDef } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onStart: (session: ActiveSession) => void;
}

const PHASE_COLORS: Record<string, string> = {
    accumulation: 'from-amber-500/20 to-rose-500/10 border-amber-500/30',
    intensification: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
    deload: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    one_week: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
};

const PHASE_LABELS: Record<string, { en: string; es: string }> = {
    accumulation: { en: 'Accumulation', es: 'Acumulación' },
    intensification: { en: 'Intensification', es: 'Intensificación' },
    deload: { en: 'Deload', es: 'Deload' },
    one_week: { en: 'One-Week Mass', es: 'One-Week Mass' },
};

// Build a session from a chosen protocol + day
const buildSession = (protocol: TwoBlockProtocol, weekIdx: number, dayIdx: number, exercises: ExerciseDef[], lang: 'en' | 'es'): ActiveSession => {
    const week = protocol.schedule[weekIdx];
    const day = week?.days[dayIdx];
    if (!day || day.muscles.length === 0) {
        return {
            id: Date.now(),
            dayIdx: -1,
            name: `${lang === 'es' ? protocol.name.es : protocol.name.en} — ${day?.label?.[lang] || 'Rest'}`,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: [],
        };
    }

    // For each muscle slot, drop a placeholder session exercise the user can pick from
    const sessionExs: SessionExercise[] = day.muscles.flatMap((m, mIdx) => {
        // Pick a sensible default exercise per muscle group from the user's library
        const candidate = exercises.find(e => e.muscle === m.group && !(e as any).isBodyweight)
                          || exercises.find(e => e.muscle === m.group);
        const defaultEx: ExerciseDef = candidate || {
            id: `placeholder_${m.group}_${mIdx}`,
            name: { en: `Pick ${m.group}`, es: `Elegir ${m.group}` },
            muscle: m.group as MuscleGroup,
        };

        // Determine reps target from rep range or default
        const repTarget = (() => {
            const rr = week.repRange || '';
            if (rr.includes('5-3-1')) return '5';
            if (rr.includes('3-2-1')) return '3';
            if (rr.startsWith('10-12')) return '1';   // singles for cluster
            if (rr.includes('12-15')) return '12';
            if (rr.includes('10-12')) return '10';
            if (rr.includes('8-10')) return '8';
            if (rr.includes('6-8')) return '6';
            if (rr === '3') return '3';
            if (rr.includes('TA')) return '8';        // moderate fiber portion as default
            return '10';
        })();

        const sets: WorkoutSet[] = Array.from({ length: m.sets }, (_, i) => ({
            id: i + 1,
            weight: '',
            reps: repTarget,
            rpe: '',
            completed: false,
            type: protocol.primarySetType,
            restSeconds: week.restSeconds,
        }));

        return [{
            ...defaultEx,
            instanceId: Date.now() + Math.random() + mIdx,
            slotLabel: m.group,
            sets,
            note: day.label ? (lang === 'es' ? day.label.es : day.label.en) : undefined,
            defaultRestSeconds: week.restSeconds,
        } as SessionExercise];
    });

    return {
        id: Date.now(),
        dayIdx: -1,
        name: `${lang === 'es' ? protocol.name.es : protocol.name.en} — W${weekIdx + 1} D${day.day}`,
        startTime: Date.now(),
        mesoId: -1,
        week: -1,
        exercises: sessionExs,
    };
};

export const TwoBlockMassModal: React.FC<Props> = ({ isOpen, onClose, onStart }) => {
    const { lang, exercises } = useApp();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [weekIdx, setWeekIdx] = useState(0);

    const selected = useMemo(
        () => TWO_BLOCK_PROTOCOLS.find(p => p.id === selectedId) || null,
        [selectedId]
    );

    const t = (k: { en: string; es: string }) => (lang === 'es' ? k.es : k.en);
    const phil = TWO_BLOCK_PHILOSOPHY[lang];

    return (
        <AnimatePresence>
            {isOpen && (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[80] bg-gray-50 dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <div className="glass px-4 h-16 shrink-0 flex items-center gap-3 border-b border-zinc-200 dark:border-white/5">
                <button onClick={() => selected ? setSelectedId(null) : onClose()} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name={selected ? 'ArrowLeft' : 'X'} size={24} />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-black text-lg dark:text-white truncate">{selected ? t(selected.name) : phil.title}</h2>
                    {selected && <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{PHASE_LABELS[selected.phase][lang]} · Block {selected.blockNumber}</p>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-container p-4 pb-24 space-y-4">
                {!selected ? (
                    <>
                        {/* Philosophy intro */}
                        <div className="bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                            <h3 className="font-black text-zinc-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                                <Icon name="BookOpen" size={16} /> Nick Nilsson · Two Block Mass (2018)
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{phil.body}</p>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
                                {phil.cycle}
                            </div>
                        </div>

                        {/* Block list */}
                        {(['accumulation', 'intensification', 'deload', 'one_week'] as const).map(phase => {
                            const blocks = TWO_BLOCK_PROTOCOLS.filter(p => p.phase === phase);
                            if (blocks.length === 0) return null;
                            return (
                                <div key={phase}>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                                        {PHASE_LABELS[phase][lang]}
                                    </h3>
                                    <div className="space-y-2">
                                        {blocks.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => { setSelectedId(p.id); setWeekIdx(0); }}
                                                className={`w-full text-left p-4 rounded-2xl border bg-gradient-to-br hover:scale-[1.01] active:scale-[0.99] transition-transform ${PHASE_COLORS[phase]}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm text-zinc-900 dark:text-white">
                                                        {p.blockNumber}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black text-sm text-zinc-900 dark:text-white">{t(p.name)}</div>
                                                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-snug">{t(p.short)}</div>
                                                    </div>
                                                    <Icon name="ChevronRight" size={18} className="text-zinc-400 shrink-0 mt-1" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {/* Protocol description */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{t(selected.long)}</p>
                        </div>

                        {/* Key rules */}
                        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                                <Icon name="AlertCircle" size={12} /> {lang === 'es' ? 'Reglas Clave' : 'Key Rules'}
                            </h4>
                            <ul className="space-y-1.5">
                                {selected.keyRules[lang].map((rule, i) => (
                                    <li key={i} className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug flex gap-2">
                                        <span className="text-amber-500 shrink-0">▸</span>
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Week selector */}
                        {selected.schedule.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto scroll-container -mx-1 px-1">
                                {selected.schedule.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setWeekIdx(i)}
                                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${weekIdx === i ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                                    >
                                        {lang === 'es' ? 'Semana' : 'Week'} {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Day list */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                                {lang === 'es' ? `Cronograma Semana ${weekIdx + 1}` : `Week ${weekIdx + 1} Schedule`}
                                {selected.schedule[weekIdx]?.restSeconds && (
                                    <span className="ml-2 text-zinc-500">· {selected.schedule[weekIdx].restSeconds}s rest</span>
                                )}
                            </h4>
                            {selected.schedule[weekIdx]?.days.length === 0 ? (
                                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-500">
                                    {lang === 'es'
                                        ? 'Este bloque sigue el mismo esquema que la Semana 1; la progresión la marca el descanso/reps que ves arriba.'
                                        : 'This week follows the same scheme as Week 1; progression is driven by the rest/rep changes shown above.'}
                                </div>
                            ) : (
                                selected.schedule[weekIdx].days.map((day, dIdx) => (
                                    <div key={dIdx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-700 dark:text-zinc-300">
                                                    D{day.day}
                                                </span>
                                                {day.label && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t(day.label)}</span>
                                                )}
                                            </div>
                                            {day.muscles.length > 0 && (
                                                <Button
                                                    variant="primary"
                                                    onClick={() => { onStart(buildSession(selected, weekIdx, dIdx, exercises, lang)); onClose(); }}
                                                >
                                                    <span className="text-[11px] flex items-center gap-1"><Icon name="Play" size={12} /> Start</span>
                                                </Button>
                                            )}
                                        </div>
                                        {day.muscles.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {day.muscles.map((m, i) => (
                                                    <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                                        {m.group} <span className="text-zinc-400">×{m.sets}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
            )}
        </AnimatePresence>
    );
};
