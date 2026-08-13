import React, { useMemo } from 'react';
import { Log } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { formatDate, formatHoursMinutes, getTranslated } from '../../utils';

interface Props {
    log: Log;
    lang: 'en' | 'es';
    onBack: () => void;
    onRepeat: () => void;
    onDelete: () => void;
    repeatBlocked?: boolean;
}

const displayDuration = (val: string | number | undefined) => {
    if (val == null || val === '') return '—';
    if (typeof val === 'string' && val.includes(':')) return val;
    return `${val}s`;
};

export const HistoryDetailView: React.FC<Props> = ({ log, lang, onBack, onRepeat, onDelete, repeatBlocked = false }) => {
    const summary = useMemo(() => {
        let sets = 0;
        let volume = 0;
        (log.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(set => {
                if (!set.completed || set.skipped) return;
                sets += 1;
                const weight = Number(set.weight || 0);
                const reps = Number(set.reps || 0);
                if (weight > 0 && reps > 0) volume += weight * reps;
            });
        });
        return {
            sets,
            exercises: (log.exercises || []).length,
            volume: Math.round(volume),
        };
    }, [log]);

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-base)/0.97)] pt-safe">
                <div className="flex h-14 items-center gap-3 px-3">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label={lang === 'es' ? 'Volver' : 'Back'}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-200 dark:active:bg-white/5"
                    >
                        <Icon name="ArrowLeft" size={21} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
                            {formatDate(log.endTime, lang)}
                        </div>
                        <h1 className="truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">{log.name}</h1>
                    </div>
                    <button
                        type="button"
                        onClick={onDelete}
                        aria-label={lang === 'es' ? 'Eliminar entrenamiento' : 'Delete workout'}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-red-500/10 active:text-red-500"
                    >
                        <Icon name="Trash2" size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scroll-container px-4 pb-32 pt-4">
                <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <SummaryCell icon="Clock" label={lang === 'es' ? 'Duración' : 'Duration'} value={formatHoursMinutes(log.duration)} />
                    <SummaryCell icon="Dumbbell" label={lang === 'es' ? 'Ejercicios' : 'Exercises'} value={String(summary.exercises)} />
                    <SummaryCell icon="CheckCircle" label={lang === 'es' ? 'Series' : 'Sets'} value={String(summary.sets)} />
                    <SummaryCell icon="TrendingUp" label={lang === 'es' ? 'Volumen' : 'Volume'} value={summary.volume > 0 ? `${summary.volume.toLocaleString()} kg` : '—'} />
                </section>

                {(log as any).note && (
                    <section className="mt-4 rounded-2xl border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.75)] p-4">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{lang === 'es' ? 'Nota' : 'Note'}</div>
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{(log as any).note}</p>
                    </section>
                )}

                <section className="mt-5 space-y-3">
                    {(log.exercises || []).map((ex, exIndex) => {
                        const completed = (ex.sets || []).filter(set => set.completed && !set.skipped);
                        return (
                            <article key={ex.instanceId ?? ex.id ?? exIndex} className="overflow-hidden rounded-[1.35rem] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.72)]">
                                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-black text-zinc-950 dark:text-white">{getTranslated(ex.name, lang)}</h2>
                                        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-500">
                                            {completed.length} {lang === 'es' ? 'series completadas' : 'completed sets'}
                                        </div>
                                    </div>
                                    {ex.note && <span className="max-w-[42%] truncate text-[10px] italic text-zinc-500">{ex.note}</span>}
                                </div>

                                <div className="border-t border-[rgb(var(--border-subtle)/0.55)] px-3 py-2">
                                    {completed.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-zinc-500">{lang === 'es' ? 'Sin series completadas' : 'No completed sets'}</div>
                                    ) : completed.map((set, index) => {
                                        const isCardio = ex.muscle === 'CARDIO';
                                        return (
                                            <div key={`${set.id}-${index}`} className="flex min-h-10 items-center gap-3 border-b border-[rgb(var(--border-subtle)/0.35)] px-1 last:border-0">
                                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${set.type === 'warmup' ? 'bg-amber-500/12 text-amber-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                                    {set.type === 'warmup' ? 'W' : index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                    {isCardio ? (
                                                        <>
                                                            <span>{displayDuration(set.duration)}</span>
                                                            {set.distance ? <span className="ml-3 text-zinc-500">{set.distance} km</span> : null}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-zinc-950 dark:text-white">{set.weight || 0} kg</span>
                                                            <span className="mx-2 text-zinc-500">×</span>
                                                            <span className="text-zinc-950 dark:text-white">{set.reps || 0}</span>
                                                            <span className="ml-1 text-[9px] text-zinc-500">REPS</span>
                                                        </>
                                                    )}
                                                </div>
                                                {set.rpe !== '' && set.rpe != null && (
                                                    <div className="text-[10px] font-bold text-zinc-500">RIR {set.rpe}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        );
                    })}
                </section>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-[72] bg-gradient-to-t from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.98)] to-transparent px-4 pb-safe pt-6">
                <button
                    type="button"
                    onClick={onRepeat}
                    disabled={repeatBlocked}
                    className="mx-auto flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 py-4 text-sm font-black text-black shadow-lg shadow-primary-500/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                >
                    <Icon name={repeatBlocked ? 'Lock' : 'Repeat'} size={18} />
                    {repeatBlocked
                        ? (lang === 'es' ? 'Finaliza la sesión activa para repetir' : 'Finish active session to repeat')
                        : (lang === 'es' ? 'Repetir entrenamiento' : 'Repeat workout')}
                </button>
            </div>
        </div>
    );
};

const SummaryCell = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div className="rounded-2xl border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.72)] p-3">
        <div className="flex items-center gap-1.5 text-zinc-500">
            <Icon name={icon} size={12} />
            <span className="text-[9px] font-black uppercase tracking-[0.14em]">{label}</span>
        </div>
        <div className="mt-1.5 truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">{value}</div>
    </div>
);