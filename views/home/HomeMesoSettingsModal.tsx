import { pickLang } from '../../utils/i18n';
import React, { Suspense, useEffect } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import type { HomeViewState } from './useHomeViewState';

const TutorialOverlay = React.lazy(() => import('../../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));

export const HomeMesoSettingsModal: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const {
        onEditProgram, tutorialProgress, markTutorialSeen, t, h, lang, availableStages,
        editStageId, setEditStageId, setShowCompleteModal, showMesoSettings, setShowMesoSettings,
        editWeeks, setEditWeeks, editDeload, setEditDeload,
        editMaxSets, setEditMaxSets, editVolumeProfile, setEditVolumeProfile,
        editSkipDeloadAccessories, setEditSkipDeloadAccessories,
        editNote, setEditNote, handleSaveSettings, mesoSettingsTutorialSteps,
    } = state as HomeViewState & {
        editMaxSets?: number | null;
        setEditMaxSets?: (val: number | null) => void;
        editVolumeProfile?: 'conservative' | 'standard' | 'aggressive';
        setEditVolumeProfile?: (val: 'conservative' | 'standard' | 'aggressive') => void;
        editSkipDeloadAccessories?: boolean;
        setEditSkipDeloadAccessories?: (val: boolean) => void;
    };

    useEffect(() => {
        if (!showMesoSettings) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowMesoSettings(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showMesoSettings, setShowMesoSettings]);

    return (
        <>
            {showMesoSettings && (
                <div className="fixed inset-0 z-modal bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowMesoSettings(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t.mesoConfig}
                        className="premium-theme-panel w-full max-w-sm rounded-[8px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[rgb(var(--text-primary))] font-bold text-xl">{t.mesoConfig}</h3>
                            <button
                                type="button"
                                aria-label={pickLang(lang, { es: 'Cerrar', en: 'Close' })}
                                onClick={() => setShowMesoSettings(false)}
                                className="text-muted hover:text-[rgb(var(--text-primary))]"
                            >
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Program Stage Selector */}
                            {availableStages && availableStages.length > 1 && (
                                <div data-testid="meso-stage-selector">
                                    <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-2 px-1">
                                        {pickLang(lang, { es: 'Etapa del programa (Stage)', en: 'Program Stage' })}
                                    </label>
                                    <div className="space-y-1.5">
                                        {availableStages.map((stage) => {
                                            const isSelected = editStageId === stage.id;
                                            return (
                                                <button
                                                    key={stage.id}
                                                    type="button"
                                                    data-testid={`meso-stage-option-${stage.id}`}
                                                    onClick={() => setEditStageId(stage.id)}
                                                    className={`w-full rounded-[6px] border px-3 py-2.5 text-left transition-all flex items-center justify-between gap-2 ${
                                                        isSelected
                                                            ? 'border-primary-500 bg-primary-500/15 text-[rgb(var(--text-primary))]'
                                                            : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <span className="block text-xs font-bold text-[rgb(var(--text-primary))] truncate">
                                                            {stage.label[lang]}
                                                        </span>
                                                        {stage.subtitle?.[lang] && (
                                                            <span className="block text-[11px] text-muted truncate">
                                                                {stage.subtitle[lang]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <Icon name="Check" size={16} className="text-primary-400 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Target Weeks */}
                            <div id="tut-meso-duration">
                                <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-2 px-1">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4 bg-[rgb(var(--surface-elevated))] p-2 rounded-[6px] border border-[rgb(var(--border-subtle))]">
                                    <button
                                        type="button"
                                        aria-label={pickLang(lang, { es: 'Reducir semanas', en: 'Decrease weeks' })}
                                        onClick={() => setEditWeeks(Math.max(1, editWeeks - 1))}
                                        className="w-10 h-10 rounded-[4px] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] flex items-center justify-center text-muted hover:text-[rgb(var(--text-primary))]"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="flex-1 text-center font-mono text-2xl font-bold text-[rgb(var(--text-primary))]">{editWeeks}</span>
                                    <button
                                        type="button"
                                        aria-label={pickLang(lang, { es: 'Aumentar semanas', en: 'Increase weeks' })}
                                        onClick={() => setEditWeeks(Math.min(16, editWeeks + 1))}
                                        className="w-10 h-10 rounded-[4px] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] flex items-center justify-center text-muted hover:text-[rgb(var(--text-primary))]"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Deload Toggle */}
                            <div id="tut-meso-deload" className="flex items-center justify-between bg-primary-500/10 border border-primary-500/20 p-4 rounded-[6px]">
                                <div>
                                    <span className="text-sm font-bold text-[rgb(var(--text-primary))] block mb-1">{t.deloadMode}</span>
                                    <span className="text-xs text-[rgb(var(--text-secondary))] block leading-tight">{t.deloadDesc}</span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={editDeload}
                                    aria-label={t.deloadMode}
                                    onClick={() => setEditDeload(!editDeload)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${editDeload ? 'bg-primary-500 shadow-[0_2px_8px] shadow-primary-500/30' : 'bg-[rgb(var(--surface-elevated))]'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${editDeload ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Guardrails RP (Anti-Volume Trap & Deload Accessories) */}
                            <div
                                data-testid="meso-guardrails-section"
                                className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3.5 space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-primary))]">
                                        {pickLang(lang, { es: 'Tope máx. series / ejercicio', en: 'Max sets / exercise' })}
                                    </span>
                                    <span className="text-xs font-bold text-primary-400">Anti-Volume Trap</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { val: 4, label: '4 sets' },
                                        { val: 5, label: '5 sets' },
                                        { val: 6, label: '6 sets' },
                                        { val: null, label: pickLang(lang, { es: 'Sin tope', en: 'No cap' }) },
                                    ].map((opt) => {
                                        const currentCap = editMaxSets ?? null;
                                        const active = currentCap === opt.val;
                                        return (
                                            <button
                                                key={String(opt.val)}
                                                type="button"
                                                aria-pressed={active}
                                                data-testid={`guardrail-cap-${opt.val ?? 'none'}`}
                                                onClick={() => setEditMaxSets?.(opt.val)}
                                                className={`min-h-8 rounded-[5px] border px-1.5 py-1 text-xs font-bold transition-colors ${
                                                    active
                                                        ? 'border-primary-500 bg-primary-500 text-zinc-950'
                                                        : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-[rgb(var(--text-secondary))] block mb-1.5">
                                        {pickLang(lang, { es: 'Ritmo de incremento semanal', en: 'Weekly set progression speed' })}
                                    </span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {([
                                            { id: 'conservative', label: { es: 'Conservador', en: 'Conservative' } },
                                            { id: 'standard', label: { es: 'Estándar RP', en: 'Standard RP' } },
                                            { id: 'aggressive', label: { es: 'Agresivo', en: 'Aggressive' } },
                                        ] as const).map((prof) => {
                                            const active = (editVolumeProfile || 'standard') === prof.id;
                                            return (
                                                <button
                                                    key={prof.id}
                                                    type="button"
                                                    aria-pressed={active}
                                                    data-testid={`guardrail-profile-${prof.id}`}
                                                    onClick={() => setEditVolumeProfile?.(prof.id)}
                                                    className={`min-h-8 rounded-[5px] border px-1.5 py-1 text-xs font-bold transition-colors ${
                                                        active
                                                            ? 'border-primary-500 bg-primary-500 text-zinc-950'
                                                            : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                                    }`}
                                                >
                                                    {prof.label[lang]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-1 border-t border-[rgb(var(--border-subtle))]">
                                    <span className="text-xs text-[rgb(var(--text-secondary))]">
                                        {pickLang(lang, {
                                            es: 'Omitir accesorios menores (gemelos/abs/antebrazo) en Deload',
                                            en: 'Skip minor accessories (calves/abs/forearms) on Deload',
                                        })}
                                    </span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={Boolean(editSkipDeloadAccessories)}
                                        data-testid="guardrail-skip-deload-acc"
                                        onClick={() => setEditSkipDeloadAccessories?.(!editSkipDeloadAccessories)}
                                        className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${
                                            editSkipDeloadAccessories ? 'bg-primary-500' : 'bg-[rgb(var(--surface-elevated))]'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                                editSkipDeloadAccessories ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Edit Template Link */}
                            <button
                                id="tut-meso-edit"
                                onClick={() => { setShowMesoSettings(false); onEditProgram(); }}
                                className="w-full py-3 bg-[rgb(var(--surface-elevated))] border border-[rgb(var(--border-subtle))] rounded-[6px] flex items-center justify-center gap-2 text-sm font-bold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-primary-500/10 transition-colors"
                            >
                                <Icon name="Layout" size={16} /> {t.editTemplate}
                            </button>

                            {/* Notes */}
                            <div id="tut-meso-notes">
                                <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-2 px-1">{t.mesoNotes}</label>
                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder={t.mesoNotesPlaceholder}
                                    className="premium-form-input w-full p-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none min-h-[80px] transition-all glow-input-neon"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button onClick={handleSaveSettings} fullWidth size="lg">
                                {t.save}
                            </Button>

                            <button
                                onClick={() => { setShowMesoSettings(false); setShowCompleteModal('meso'); }}
                                className="w-full py-3 text-xs font-bold text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-[6px] transition-colors"
                            >
                                {t.finishCycle}
                            </button>
                        </div>

                        {/* INTERNAL TUTORIAL */}
                        <Suspense fallback={null}>
                        <TutorialOverlay
                            steps={mesoSettingsTutorialSteps}
                            isActive={!tutorialProgress.mesoSettings}
                            onComplete={() => markTutorialSeen('mesoSettings')}
                        />
                        </Suspense>
                    </div>
                </div>
            )}
        </>
    );
};
