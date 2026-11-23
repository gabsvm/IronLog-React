import React from 'react';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { pickLang } from '../../utils/i18n';
import type { DeloadStage } from '../../types';

interface StageDef {
    id: DeloadStage;
    icon: 'Zap' | 'Moon' | 'Activity' | 'CheckCircle';
    label: { es: string; en: string };
    desc: { es: string; en: string };
}

const DELOAD_STAGES: StageDef[] = [
    {
        id: 'wired',
        icon: 'Zap',
        label: { es: '1. Wired', en: '1. Wired' },
        desc: {
            es: 'Energía acelerada inicial tras cortar volumen: NO añadas series ni bajes RIR (mantén 5 RIR).',
            en: 'Wired/amped start after cutting volume: do NOT add sets or drop RIR (hold 5 RIR).',
        },
    },
    {
        id: 'tired',
        icon: 'Moon',
        label: { es: '2. Tired', en: '2. Tired' },
        desc: {
            es: 'Cansancio profundo normal a mitad del deload: priorizá 8+ h de sueño, comida y caminatas suaves.',
            en: 'Deep mid-deload fatigue is normal as CNS disengages: prioritize 8+ h sleep and light walks.',
        },
    },
    {
        id: 'restless',
        icon: 'Activity',
        label: { es: '3. Restless', en: '3. Restless' },
        desc: {
            es: 'Ganas fuertes de cargar pesado otra vez: aguantá los días finales ligeros para limpiar fatiga tendinosa.',
            en: 'Itchy to push heavy weights again: finish the light days so connective tissue fully recovers.',
        },
    },
    {
        id: 'ready',
        icon: 'CheckCircle',
        label: { es: '4. Ready', en: '4. Ready' },
        desc: {
            es: 'Articulaciones frescas y potencia intacta: listo para arrancar Semana 1 de tu próximo mesociclo.',
            en: 'Fresh joints and snappy bar speed: cleared to start Week 1 of your next mesocycle.',
        },
    },
];

interface DeloadRecoveryCardProps {
    stage?: DeloadStage;
    lang: 'en' | 'es';
    onSelectStage: (stage: DeloadStage) => void;
    onOpenBadSession?: () => void;
}

/**
 * Interactive 4-stage RP Deload tracker ("Wired -> Tired -> Restless -> Ready")
 * surfaced inside active deload workouts to prevent lifters from cutting deloads short.
 */
export const DeloadRecoveryCard: React.FC<DeloadRecoveryCardProps> = ({
    stage = 'wired',
    lang,
    onSelectStage,
    onOpenBadSession,
}) => {
    const activeStage = DELOAD_STAGES.find((s) => s.id === stage) || DELOAD_STAGES[0];

    return (
        <div
            data-testid="deload-recovery-card"
            className="rounded-[8px] border border-amber-500/35 bg-surface-raised p-3 space-y-2.5"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-amber-500/15 text-amber-400">
                        <Icon name="Shield" size={14} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 truncate">
                            {pickLang(lang, { es: 'Deload RP · 4 Etapas de Recuperación', en: 'RP Deload · 4 Stages of Recovery' })}
                        </h3>
                    </div>
                </div>
                {onOpenBadSession && (
                    <button
                        type="button"
                        onClick={onOpenBadSession}
                        className="shrink-0 text-xs font-bold text-zinc-300 hover:text-white underline underline-offset-2"
                    >
                        {pickLang(lang, { es: 'Triage', en: 'Triage' })}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="group" aria-label={pickLang(lang, { es: 'Etapa de descarga', en: 'Deload recovery stage' })}>
                {DELOAD_STAGES.map((item) => {
                    const isSelected = item.id === activeStage.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={isSelected}
                            data-testid={`deload-stage-${item.id}`}
                            onClick={() => onSelectStage(item.id)}
                            className={`flex min-h-9 items-center justify-center gap-1.5 rounded-[6px] border px-2 py-1.5 text-xs font-bold transition-colors ${
                                isSelected
                                    ? 'border-amber-400 bg-amber-400 text-zinc-950 font-black'
                                    : 'border-border-subtle bg-surface-base text-zinc-300 hover:text-white'
                            }`}
                        >
                            <Icon name={item.icon} size={13} />
                            <span>{item.label[lang]}</span>
                        </button>
                    );
                })}
            </div>

            <p className="text-xs leading-relaxed text-zinc-200 bg-surface-base/70 rounded-[6px] px-2.5 py-2 border border-border-subtle/70">
                {activeStage.desc[lang]}
            </p>
        </div>
    );
};

interface BadSessionTriageSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lang: 'en' | 'es';
    onTriggerDeload?: () => void;
}

/**
 * RP "I Had a Bad Workout" decision protocol sheet:
 * separates acute mental/lifestyle noise (1-miss grace) from multi-session fatigue (Recovery / Deload).
 */
export const BadSessionTriageSheet: React.FC<BadSessionTriageSheetProps> = ({
    open,
    onOpenChange,
    lang,
    onTriggerDeload,
}) => {
    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={pickLang(lang, { es: 'Tuve una mala sesión (Protocolo RP)', en: 'Had a Bad Workout (RP Protocol)' })}
            accent="amber"
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" fullWidth onClick={() => onOpenChange(false)}>
                        {pickLang(lang, { es: 'Mantener plan hoy', en: 'Stick to plan' })}
                    </Button>
                    {onTriggerDeload && (
                        <Button
                            fullWidth
                            data-testid="bad-session-trigger-deload"
                            onClick={() => {
                                onTriggerDeload();
                                onOpenChange(false);
                            }}
                        >
                            {pickLang(lang, { es: 'Activar Deload hoy', en: 'Start Early Deload' })}
                        </Button>
                    )}
                </div>
            }
        >
            <div data-testid="bad-session-triage-sheet" className="p-4 space-y-3">
                <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary-300">
                        <Icon name="Activity" size={14} />
                        <span>{pickLang(lang, { es: '1. ¿Física o Mental?', en: '1. Physical vs. Mental Triage' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-300">
                        {pickLang(lang, {
                            es: 'Estrés agudo, mal sueño aislado, ayuno o deshidratación bajan tu rendimiento hoy sin significar que superaste tu MRV.',
                            en: 'Acute stress, a single short night, under-eating, or poor hydration can sink one session without exceeding MRV.',
                        })}
                    </p>
                </div>

                <div className="rounded-[8px] border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300">
                        <Icon name="CheckCircle" size={14} />
                        <span>{pickLang(lang, { es: '2. Regla RP de 1 fallo (Gracia)', en: '2. RP 1-Miss Grace Rule' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-200">
                        {pickLang(lang, {
                            es: 'Si es la primera sesión floja, NO cambies tus cargas ni termines el mesociclo. Terminá con ~2 RIR, priorizá sueño/comida y reevalúa la próxima.',
                            en: 'On an isolated off day, do NOT slash loads or abort the meso. Finish around ~2 RIR, recover with food and sleep, and re-test next session.',
                        })}
                    </p>
                </div>

                <div className="rounded-[8px] border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                        <Icon name="AlertTriangle" size={14} />
                        <span>{pickLang(lang, { es: '3. Regla de 2 fallos consecutivos', en: '3. 2 Consecutive Misses Rule' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-200">
                        {pickLang(lang, {
                            es: 'Si rendís por debajo del objetivo en 2 sesiones seguidas (o acumulás dolor + agujetas persistentes), activá una Recovery Session (2 × 50% carga @ 5 RIR) o iniciá el Deload hoy.',
                            en: 'If performance drops below target 2 sessions in a row (or joints/soreness linger), run a Recovery Session (2 x 50% load @ 5 RIR) or trigger an Early Deload.',
                        })}
                    </p>
                </div>
            </div>
        </Sheet>
    );
};
