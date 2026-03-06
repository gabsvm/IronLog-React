import React, { useMemo, useEffect } from 'react';
import { Log } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { TRANSLATIONS } from '../constants';
import { useApp } from '../context/AppContext';

// Simple confetti fallback if utility is missing
const fireConfetti = async () => {
    try {
        const confetti = (await import('canvas-confetti')).default as any;
        const count = 200;
        const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
        function fire(particleRatio: number, opts: any) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (e) {
        console.warn('Confetti failed to load');
    }
};

interface SessionSummaryViewProps {
    log: Log;
    onClose: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({ log, onClose }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    useEffect(() => {
        if (!log.skipped) {
            fireConfetti();
        }
    }, [log.skipped]);

    const stats = useMemo(() => {
        let volume = 0;
        let sets = 0;
        const muscles = new Set<string>();

        log.exercises.forEach(ex => {
            if (ex.muscle && ex.muscle !== 'CARDIO') {
                muscles.add(ex.muscle);
            }
            (ex.sets || []).forEach(s => {
                if (s.completed && !s.skipped) {
                    sets++;
                    const w = Number(s.weight) || 0;
                    const r = Number(s.reps) || 0;
                    if (w > 0 && r > 0 && !ex.isBodyweight) {
                        volume += (w * r);
                    }
                }
            });
        });

        return { volume, sets, muscles: Array.from(muscles) };
    }, [log]);

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 overflow-y-auto">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 text-red-500 mb-4 animate-in zoom-in-50 delay-100 duration-500">
                        <Icon name="Trophy" size={40} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">
                        {lang === 'en' ? 'Workout Complete!' : '¡Entrenamiento Completado!'}
                    </h1>
                    <p className="text-zinc-400 font-medium">
                        {log.name}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 delay-200 fade-in duration-500">
                        <Icon name="Clock" size={20} className="text-blue-400 mb-2" />
                        <div className="text-2xl font-black">{formatDuration(log.duration)}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{lang === 'en' ? 'Time' : 'Tiempo'}</div>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 delay-300 fade-in duration-500">
                        <Icon name="CheckCircle" size={20} className="text-green-400 mb-2" />
                        <div className="text-2xl font-black">{stats.sets}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{lang === 'en' ? 'Sets' : 'Series'}</div>
                    </div>

                    <div className="col-span-2 bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 delay-400 fade-in duration-500">
                        <Icon name="Dumbbell" size={20} className="text-amber-400 mb-2" />
                        <div className="text-2xl font-black">{stats.volume.toLocaleString()} kg</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{lang === 'en' ? 'Total Volume' : 'Volumen Total'}</div>
                    </div>
                </div>

                {/* Muscles Hit */}
                {stats.muscles.length > 0 && (
                    <div className="w-full max-w-sm animate-in slide-in-from-bottom-4 delay-500 fade-in duration-500">
                        <p className="text-center text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">
                            {lang === 'en' ? 'Muscles Hit' : 'Músculos Trabajados'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {stats.muscles.map(m => (
                                <span key={m} className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-300">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-950 pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-10 delay-700 duration-500">
                <Button fullWidth onClick={onClose} className="h-14 text-lg">
                    {lang === 'en' ? 'Finish & Go Home' : 'Finalizar y Volver'}
                </Button>
            </div>
        </div>
    );
};
