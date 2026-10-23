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
                            <button type="button" aria-label={t.cancel} onClick={() => setShowMesoSettings(false)} className="gl-quiet flex h-11 w-11 items-center justify-center">
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Target Weeks */}
                            <div id="tut-meso-duration">
                                <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-2 px-1">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-2">
                                    <button
                                        type="button"
                                        aria-label={`${t.targetWeeks} −`}
                                        onClick={() => setEditWeeks(Math.max(1, editWeeks - 1))}
                                        className="gl-quiet flex h-11 w-11 items-center justify-center"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="flex-1 text-center tabular-nums text-2xl font-bold text-[rgb(var(--text-primary))]">{editWeeks}</span>
                                    <button
                                        type="button"
                                        aria-label={`${t.targetWeeks} +`}
                                        onClick={() => setEditWeeks(editWeeks + 1)}
                                        className="gl-quiet flex h-11 w-11 items-center justify-center"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Deload Toggle */}
                            <div id="tut-meso-deload" className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
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
                                    className={`relative h-11 w-14 shrink-0 rounded-xl border transition-colors ${editDeload ? 'border-primary-500 bg-primary-500/15' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))]'}`}
                                >
                                    <span className={`absolute left-1 top-2 h-6 w-6 rounded-lg bg-[rgb(var(--text-primary))] transition-transform ${editDeload ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Edit Template Link */}
                            <button
                                id="tut-meso-edit"
                                onClick={() => { setShowMesoSettings(false); onEditProgram(); }}
                                className="gl-quiet flex min-h-[48px] w-full items-center justify-center gap-2 px-3 text-sm"
                            >
                                <Icon name="Layout" size={16} /> {t.editTemplate}
                            </button>

                            {/* Notes */}
                            <div id="tut-meso-notes">
                                <label htmlFor="home-meso-note" className="mb-2 block px-1 text-xs font-medium text-muted">{t.mesoNotes}</label>
                                <textarea
                                    id="home-meso-note"
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder={t.mesoNotesPlaceholder}
                                    className="premium-form-input min-h-[80px] w-full p-3 text-base focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button onClick={handleSaveSettings} fullWidth size="lg">
                                {t.save}
                            </Button>

                            <button
                                onClick={() => { setShowMesoSettings(false); setShowCompleteModal('meso'); }}
                                className="gl-textbtn min-h-[44px] w-full text-sm"
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
