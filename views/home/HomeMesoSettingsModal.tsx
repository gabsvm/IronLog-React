// S6: meso settings modal, moved verbatim from views/HomeViewImpl.tsx.
import React, { Suspense } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import type { HomeViewState } from './useHomeViewState';

const TutorialOverlay = React.lazy(() => import('../../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));

export const HomeMesoSettingsModal: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { onEditProgram, tutorialProgress, markTutorialSeen, t, h, setShowCompleteModal, showMesoSettings, setShowMesoSettings, editWeeks, setEditWeeks, editDeload, setEditDeload, editNote, setEditNote, handleSaveSettings, mesoSettingsTutorialSteps } = state;
    return (
        <>
            {showMesoSettings && (
                <div className="fixed inset-0 z-modal bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in pointer-events-auto" onClick={() => setShowMesoSettings(false)}>
                    <div className="premium-theme-panel w-full max-w-sm p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[rgb(var(--text-primary))] font-bold text-xl">{t.mesoConfig}</h3>
                            <button onClick={() => setShowMesoSettings(false)} className="text-muted hover:text-[rgb(var(--text-primary))]">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Target Weeks */}
                            <div id="tut-meso-duration">
                                <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-2 px-1">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4 bg-[rgb(var(--surface-elevated))] p-2 rounded-[20px] border border-[rgb(var(--border-subtle))]">
                                    <button
                                        onClick={() => setEditWeeks(Math.max(1, editWeeks - 1))}
                                        className="w-10 h-10 rounded-full bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] flex items-center justify-center text-muted hover:text-[rgb(var(--text-primary))]"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="flex-1 text-center font-mono text-2xl font-bold text-[rgb(var(--text-primary))]">{editWeeks}</span>
                                    <button
                                        onClick={() => setEditWeeks(editWeeks + 1)}
                                        className="w-10 h-10 rounded-full bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] flex items-center justify-center text-muted hover:text-[rgb(var(--text-primary))]"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Deload Toggle */}
                            <div id="tut-meso-deload" className="flex items-center justify-between bg-primary-500/10 border border-primary-500/20 p-4 rounded-[20px]">
                                <div>
                                    <span className="text-sm font-bold text-[rgb(var(--text-primary))] block mb-1">{t.deloadMode}</span>
                                    <span className="text-xs text-[rgb(var(--text-secondary))] block leading-tight">{t.deloadDesc}</span>
                                </div>
                                <button
                                    onClick={() => setEditDeload(!editDeload)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${editDeload ? 'bg-primary-500 shadow-[0_2px_8px] shadow-primary-500/30' : 'bg-[rgb(var(--surface-elevated))]'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${editDeload ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Edit Template Link */}
                            <button
                                id="tut-meso-edit"
                                onClick={() => { setShowMesoSettings(false); onEditProgram(); }}
                                className="w-full py-3 bg-[rgb(var(--surface-elevated))] border border-[rgb(var(--border-subtle))] rounded-[20px] flex items-center justify-center gap-2 text-sm font-bold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-primary-500/10 transition-colors"
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
                                className="w-full py-3 text-xs font-bold text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-[20px] transition-colors"
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
