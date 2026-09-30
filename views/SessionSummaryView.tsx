import React, { useMemo } from 'react';
import { Log } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';

interface SessionSummaryViewProps {
    log: Log;
    onClose: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({ log, onClose }) => {
    const { lang, userProfile } = useApp();

    const isDetached = log.mesoId < 0 || log.dayIdx < 0 || log.week < 0;
    const discipline = (log as any).discipline;

    const stats = useMemo(() => {
        let volume = 0;
        let sets = 0;
        const muscles = new Set<string>();
        const logBodyWeight = getLogBodyWeight(log, userProfile?.bodyWeight);

        (log.exercises || []).forEach(ex => {
            if (ex.muscle && ex.muscle !== 'CARDIO') {
                muscles.add(ex.muscle);
            }
            (ex.sets || []).forEach(s => {
                if (s.completed && !s.skipped) {
                    sets++;
                    volume += getSetLoadVolume(s, ex, logBodyWeight);
                }
            });
        });

        return { volume, sets, muscles: Array.from(muscles) };
    }, [log, userProfile?.bodyWeight]);

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getSessionTypeBadge = () => {
        if (discipline === 'crossfit') {
            return {
                label: lang === 'es' ? 'WOD · Funcional' : 'WOD · Functional',
                color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            };
        }
        if (discipline === 'calisthenics') {
            return {
                label: lang === 'es' ? 'Calistenia · Skill' : 'Calisthenics · Skill',
                color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            };
        }
        if (discipline === 'twoblock') {
            return {
                label: 'Two Block Mass',
                color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            };
        }
        if (isDetached) {
            return {
                label: lang === 'es' ? 'Sesión Libre' : 'Freestyle Session',
                color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            };
        }
        return {
            label: lang === 'es' ? `Semana ${log.week}` : `Week ${log.week}`,
            color: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
        };
    };

    const badge = getSessionTypeBadge();

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 overflow-y-auto">
                {/* Header with restrained trophy animation */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/10 text-primary-400 mb-2 border border-primary-500/20 shadow-lg shadow-primary-500/10 animate-in zoom-in-75 duration-300">
                        <Icon name="Trophy" size={36} />
                    </div>
                    <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-2 ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                        {lang === 'en' ? 'Workout Complete!' : '¡Entrenamiento Completado!'}
                    </h1>
                    <p className="text-zinc-400 font-medium text-sm">
                        {log.name}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/60 shadow-sm">
                        <Icon name="Clock" size={18} className="text-blue-400 mb-1.5" />
                        <div className="text-xl font-black">{formatDuration(log.duration)}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            {lang === 'en' ? 'Time' : 'Tiempo'}
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/60 shadow-sm">
                        <Icon name="CheckCircle" size={18} className="text-green-400 mb-1.5" />
                        <div className="text-xl font-black">{stats.sets}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            {lang === 'en' ? 'Sets' : 'Series'}
                        </div>
                    </div>

                    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/60 shadow-sm">
                        <Icon name="Dumbbell" size={18} className="text-amber-400 mb-1.5" />
                        <div className="text-xl font-black">{stats.volume.toLocaleString()} kg</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            {lang === 'en' ? 'Total Volume' : 'Volumen Total'}
                        </div>
                    </div>
                </div>

                {/* Muscles Hit */}
                {stats.muscles.length > 0 && (
                    <div className="w-full max-w-sm">
                        <p className="text-center text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                            {lang === 'en' ? 'Muscles Hit' : 'Músculos Trabajados'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {stats.muscles.map(m => (
                                <span key={m} className="px-2.5 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded-full text-[11px] font-bold text-zinc-300">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
                <Button fullWidth onClick={onClose} className="h-12 text-base font-bold">
                    {lang === 'en' ? 'Finish & Go Home' : 'Finalizar y Volver'}
                </Button>
            </div>
        </div>
    );
};
