import React, { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import type { PerformanceRecoveryMode } from '../../programs/performance/performanceRecovery';

interface Props {
  lang: 'en' | 'es';
  sessionName?: string;
  onCancel: () => void;
  onStart: (mode: PerformanceRecoveryMode) => void;
}

type SignalId = 'sleep' | 'energy' | 'focus' | 'vitality' | 'muscle' | 'joint';

const SIGNALS: Array<{ id: SignalId; icon: string; en: string; es: string; enHelp: string; esHelp: string; critical?: boolean }> = [
  { id: 'sleep', icon: 'Moon', en: 'Sleep', es: 'Sueño', enHelp: 'Clearly worse than your normal?', esHelp: '¿Claramente peor que lo normal?' },
  { id: 'energy', icon: 'Battery', en: 'Energy', es: 'Energía', enHelp: 'Unusually low today?', esHelp: '¿Inusualmente baja hoy?' },
  { id: 'focus', icon: 'Brain', en: 'Concentration', es: 'Concentración', enHelp: 'Noticeably harder to focus?', esHelp: '¿Notablemente más difícil concentrarte?' },
  { id: 'vitality', icon: 'Heart', en: 'Vitality / libido', es: 'Vitalidad / libido', enHelp: 'Clearly below your own baseline?', esHelp: '¿Claramente por debajo de tu nivel habitual?' },
  { id: 'muscle', icon: 'Activity', en: 'Muscle recovery', es: 'Recuperación muscular', enHelp: 'Still unusually fatigued or sore?', esHelp: '¿Seguís inusualmente fatigado o adolorido?' },
  { id: 'joint', icon: 'AlertTriangle', en: 'Joint warning', es: 'Advertencia articular', enHelp: 'Meaningful pain or irritation, not normal training discomfort?', esHelp: '¿Dolor o irritación relevante, no la incomodidad normal de entrenar?', critical: true },
];

export const PerformanceRecoveryGate: React.FC<Props> = ({ lang, sessionName, onCancel, onStart }) => {
  const [worse, setWorse] = useState<Record<SignalId, boolean>>({ sleep: false, energy: false, focus: false, vitality: false, muscle: false, joint: false });
  const nonCriticalScore = useMemo(() => SIGNALS.filter(signal => !signal.critical && worse[signal.id]).length, [worse]);
  const hasJointWarning = worse.joint;
  const status = hasJointWarning || nonCriticalScore >= 3 ? 'red' : nonCriticalScore === 2 ? 'yellow' : 'green';

  const copy = status === 'green'
    ? {
      label: lang === 'es' ? 'VERDE · Sesión normal' : 'GREEN · Normal session',
      body: lang === 'es' ? 'Tu recuperación parece compatible con la sesión planificada.' : 'Your recovery looks compatible with the planned session.',
    }
    : status === 'yellow'
      ? {
        label: lang === 'es' ? 'AMARILLO · Sesión reducida' : 'YELLOW · Reduced session',
        body: lang === 'es' ? 'GainsLab bajará 1 punto el RPE objetivo y quitará el último par accesorio de baja prioridad.' : 'GainsLab will lower target RPE by 1 and remove the final low-priority accessory pair.',
      }
      : {
        label: lang === 'es' ? 'ROJO · Recuperá primero' : 'RED · Recover first',
        body: hasJointWarning
          ? (lang === 'es' ? 'Marcaste una advertencia articular relevante. No fuerces la sesión: posponela o elegí atención profesional si la molestia lo amerita.' : 'You marked a meaningful joint warning. Do not force the session: delay it or seek professional care if the issue warrants it.')
          : (lang === 'es' ? 'El patrón general de recuperación está comprometido. Posponé la sesión unas 24 h y volvé a evaluar.' : 'Your overall recovery pattern is compromised. Delay the session about 24 hours and reassess.'),
      };

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/70 p-4 pb-safe backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] shadow-2xl">
        <div className="border-b border-[rgb(var(--border-subtle))] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">PERFORMANCE · Recovery Gate</p>
              <h2 className="mt-1 text-xl font-black">{lang === 'es' ? '¿Cómo llegás hoy?' : 'How are you arriving today?'}</h2>
              {sessionName && <p className="mt-1 text-xs font-bold text-[rgb(var(--text-muted))]">{sessionName}</p>}
            </div>
            <button type="button" onClick={onCancel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]" aria-label={lang === 'es' ? 'Cerrar' : 'Close'}><Icon name="X" size={18} /></button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'Marcá solo lo que esté claramente peor que tu nivel habitual. No hace falta sentirse perfecto para entrenar. Una advertencia articular relevante sí se trata aparte.' : 'Mark only what is clearly worse than your normal baseline. You do not need to feel perfect to train. A meaningful joint warning is treated separately.'}</p>
        </div>

        <div className="space-y-2 p-4">
          {SIGNALS.map(signal => {
            const active = worse[signal.id];
            const critical = !!signal.critical;
            return (
              <button key={signal.id} type="button" onClick={() => setWorse(prev => ({ ...prev, [signal.id]: !prev[signal.id] }))} className={`flex min-h-[58px] w-full items-center gap-3 rounded-2xl border px-3 text-left transition-colors ${active ? (critical ? 'border-rose-500/35 bg-rose-500/[0.08]' : 'border-amber-500/35 bg-amber-500/[0.08]') : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.55)]'}`} aria-pressed={active}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? (critical ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400') : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-muted))]'}`}><Icon name={signal.icon} size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black">{lang === 'es' ? signal.es : signal.en}</span><span className="mt-0.5 block text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? signal.esHelp : signal.enHelp}</span></span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg border ${active ? (critical ? 'border-rose-500 bg-rose-500 text-white' : 'border-amber-500 bg-amber-500 text-black') : 'border-[rgb(var(--border-strong))]'}`}>{active && <Icon name="Check" size={14} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>

        <div className="px-4 pb-4">
          <div className={`rounded-2xl border p-4 ${status === 'green' ? 'border-emerald-500/25 bg-emerald-500/[0.07]' : status === 'yellow' ? 'border-amber-500/25 bg-amber-500/[0.07]' : 'border-rose-500/25 bg-rose-500/[0.07]'}`}>
            <div className={`text-[10px] font-black uppercase tracking-[0.12em] ${status === 'green' ? 'text-emerald-400' : status === 'yellow' ? 'text-amber-400' : 'text-rose-400'}`}>{copy.label}</div>
            <p className="mt-1.5 text-xs leading-5 text-[rgb(var(--text-secondary))]">{copy.body}</p>
          </div>

          {status === 'red' ? (
            <button type="button" onClick={onCancel} className="mt-3 min-h-12 w-full rounded-2xl bg-[rgb(var(--surface-base))] px-4 text-sm font-black">{lang === 'es' ? 'Posponer y recuperar' : 'Delay and recover'}</button>
          ) : (
            <button type="button" onClick={() => onStart(status)} className="mt-3 min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black active:scale-[0.99]">{status === 'green' ? (lang === 'es' ? 'Empezar sesión' : 'Start session') : (lang === 'es' ? 'Empezar sesión reducida' : 'Start reduced session')}</button>
          )}

          <p className="mt-3 text-center text-[9px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Esta herramienta orienta la carga de entrenamiento; no diagnostica problemas médicos.' : 'This tool guides training load; it does not diagnose medical problems.'}</p>
        </div>
      </div>
    </div>
  );
};
