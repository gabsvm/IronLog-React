// U5: template editor view, moved verbatim from components/admin/AdminTemplateManager.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import { MUSCLE_GROUPS } from '../../../constants';
import { ExerciseSelector } from '../../ui/ExerciseSelector';
import type { AdminTemplateState } from './useAdminTemplateState';
import { AdminToast } from './AdminToast';

export const AdminTemplateEditor: React.FC<{ state: AdminTemplateState }> = ({ state }) => {
    const { onClose, exercises, setView, editingTemplate, pickingFor, setPickingFor, saveStatus, linkingSlot, setLinkingSlot, getSupersetStyle, handleSave, updateMetadata, updateDay, addDay, removeDay, updateSlot, addSlot, removeSlot, moveSlot, handleSupersetAction, handleSelectEx, StatusBadge, status } = state;
    return (
        <div className="fixed inset-0 z-confirm bg-black text-white flex flex-col font-sans">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-zinc-950/95 backdrop-blur-xl shrink-0">
                <button onClick={() => setView('list')} className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm font-bold" aria-label="Back to list">
                    <Icon name="ChevronLeft" size={18} /> Back
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <StatusBadge status={status} />
                    <div className="font-bold text-sm truncate max-w-[140px]">{editingTemplate?.name}</div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 ${
                        saveStatus === 'saved' ? 'bg-primary-500 text-black' :
                        saveStatus === 'error' ? 'bg-red-500 text-white' :
                        'bg-primary-500 text-black shadow-lg shadow-primary-500/20 hover:bg-primary-400 disabled:opacity-50'
                    }`}
                >
                    <Icon name={saveStatus === 'saved' ? 'Check' : 'Upload'} size={14} />
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Retry' : 'Save'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 relative scroll-container">
                {/* Linking banner — sticky, primary tone */}
                {linkingSlot && (
                    <div className="sticky top-0 left-0 right-0 z-10 bg-primary-500 text-black p-3 rounded-2xl shadow-lg mb-4 flex justify-between items-center animate-in slide-in-from-top-2 font-bold">
                        <div className="text-xs flex items-center gap-2">
                            <Icon name="Link" size={14} /> Select an exercise to link...
                        </div>
                        <button onClick={() => setLinkingSlot(null)} className="text-[10px] bg-black/20 hover:bg-black/30 px-3 py-1 rounded-lg uppercase tracking-wider">Cancel</button>
                    </div>
                )}

                {/* Metadata card */}
                <div className="glass-card rounded-2xl p-5 space-y-4">
                    <h3 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Icon name="Info" size={12} /> Metadata
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">ID (name)</label>
                            <input className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none transition-colors" value={editingTemplate?.name || ''} onChange={e => updateMetadata('name', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Order</label>
                            <input type="number" className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:border-primary-500 focus:outline-none transition-colors" value={editingTemplate?.order || 0} onChange={e => updateMetadata('order', Number(e.target.value))} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={editingTemplate?.isPro || false} onChange={e => updateMetadata('isPro', e.target.checked)} className="w-4 h-4 accent-primary-500" />
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Icon name="Crown" size={12} /> PRO Template (locks for free users)
                        </span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Title (EN)</label>
                            <input className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:border-primary-500 focus:outline-none transition-colors" value={editingTemplate?.title.en || ''} onChange={e => updateMetadata('title_en', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Title (ES)</label>
                            <input className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:border-primary-500 focus:outline-none transition-colors" value={editingTemplate?.title.es || ''} onChange={e => updateMetadata('title_es', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Description (EN)</label>
                            <textarea rows={2} className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs leading-relaxed focus:border-primary-500 focus:outline-none transition-colors resize-none" value={editingTemplate?.description.en || ''} onChange={e => updateMetadata('desc_en', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Description (ES)</label>
                            <textarea rows={2} className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs leading-relaxed focus:border-primary-500 focus:outline-none transition-colors resize-none" value={editingTemplate?.description.es || ''} onChange={e => updateMetadata('desc_es', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Days */}
                <div className="space-y-4">
                    {editingTemplate?.program.map((day, dayIdx) => (
                        <div key={dayIdx} className={`glass-card rounded-2xl overflow-hidden transition-opacity ${linkingSlot && linkingSlot.dayIdx !== dayIdx ? 'opacity-30 pointer-events-none' : ''}`}>
                            <div className="bg-white/5 px-4 py-3 flex justify-between items-center gap-2 border-b border-white/5">
                                <div className="flex gap-2 flex-1">
                                    <input className="bg-white/5 border border-white/10 text-white font-bold p-2 rounded-lg text-xs flex-1 focus:border-primary-500 focus:outline-none" value={day.dayName.en} onChange={e => updateDay(dayIdx, d => ({...d, dayName: {...d.dayName, en: e.target.value}}))} placeholder="Day name (EN)" />
                                    <input className="bg-white/5 border border-white/10 text-white font-bold p-2 rounded-lg text-xs flex-1 focus:border-primary-500 focus:outline-none" value={day.dayName.es} onChange={e => updateDay(dayIdx, d => ({...d, dayName: {...d.dayName, es: e.target.value}}))} placeholder="Day name (ES)" />
                                </div>
                                <button onClick={() => removeDay(dayIdx)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0" aria-label={`Delete day ${dayIdx + 1}`}>
                                    <Icon name="Trash2" size={14} />
                                </button>
                            </div>

                            <div className="p-3 space-y-2">
                                {day.slots.map((slot, slotIdx) => {
                                    const ssStyle = getSupersetStyle(slot.supersetId);
                                    const isLinkingSource = linkingSlot?.dayIdx === dayIdx && linkingSlot?.slotIdx === slotIdx;
                                    const isLinkable = !!linkingSlot && !isLinkingSource;

                                    return (
                                        <div
                                            key={slotIdx}
                                            onClick={() => isLinkable && handleSupersetAction(dayIdx, slotIdx)}
                                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                                ssStyle ? `${ssStyle.border} ${ssStyle.bg} border-l-4` : 'border-white/5 bg-black/20'
                                            } ${isLinkingSource ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''} ${isLinkable ? 'hover:bg-white/10 cursor-pointer' : ''}`}
                                        >
                                            <button
                                                onClick={e => { e.stopPropagation(); handleSupersetAction(dayIdx, slotIdx); }}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    isLinkingSource ? 'bg-primary-500 text-black' :
                                                    slot.supersetId ? 'bg-white/5 text-amber-400 hover:bg-amber-500/20' :
                                                    'bg-white/5 text-zinc-400 hover:text-white'
                                                }`}
                                                title={isLinkingSource ? 'Cancel linking' : slot.supersetId ? 'Unlink' : 'Link with another slot'}
                                                aria-label={isLinkingSource ? 'Cancel linking' : slot.supersetId ? 'Unlink superset' : 'Start superset link'}
                                            >
                                                {isLinkingSource ? <Icon name="X" size={13} /> : (slot.supersetId ? <Icon name="Unlink" size={13} /> : <Icon name="Link" size={13} />)}
                                            </button>

                                            <select
                                                className="bg-white/5 border border-white/10 text-[10px] rounded-lg p-1.5 max-w-[80px] font-bold focus:border-primary-500 focus:outline-none"
                                                value={slot.muscle}
                                                onChange={e => updateSlot(dayIdx, slotIdx, 'muscle', e.target.value)}
                                            >
                                                {Object.keys(MUSCLE_GROUPS).map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>

                                            <button
                                                onClick={() => setPickingFor({ dayIdx, slotIdx })}
                                                className={`flex-1 text-left text-xs truncate font-medium p-2 rounded-lg transition-colors ${
                                                    slot.exerciseId
                                                        ? 'text-white bg-white/5 hover:bg-white/10'
                                                        : 'text-zinc-500 bg-black/30 border border-dashed border-white/10 hover:border-primary-500/50'
                                                }`}
                                                title={slot.exerciseId || 'No exercise selected'}
                                            >
                                                {slot.exerciseId
                                                    ? (exercises.find(e => e.id === slot.exerciseId)?.name as any)?.en || slot.exerciseId
                                                    : '+ Pick exercise'}
                                            </button>

                                            <input type="number" className="w-11 bg-white/5 border border-white/10 text-center text-xs p-1.5 rounded-lg focus:border-primary-500 focus:outline-none" value={slot.setTarget} onChange={e => updateSlot(dayIdx, slotIdx, 'setTarget', Number(e.target.value))} placeholder="N" title="Sets" />
                                            <input type="text" className="w-14 bg-white/5 border border-white/10 text-center text-xs p-1.5 rounded-lg focus:border-primary-500 focus:outline-none" value={slot.reps || ''} onChange={e => updateSlot(dayIdx, slotIdx, 'reps', e.target.value)} placeholder="reps" title="Rep range" />

                                            <div className="flex flex-col gap-0.5">
                                                <button onClick={() => moveSlot(dayIdx, slotIdx, 'up')} disabled={slotIdx === 0} className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed" aria-label="Move up">
                                                    <Icon name="ChevronUp" size={14} />
                                                </button>
                                                <button onClick={() => moveSlot(dayIdx, slotIdx, 'down')} disabled={slotIdx === day.slots.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed" aria-label="Move down">
                                                    <Icon name="ChevronDown" size={14} />
                                                </button>
                                            </div>

                                            <button onClick={() => removeSlot(dayIdx, slotIdx)} className="text-zinc-500 hover:text-red-400 transition-colors" aria-label="Remove slot">
                                                <Icon name="X" size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button onClick={() => addSlot(dayIdx)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 hover:border-primary-500/40 text-zinc-400 hover:text-primary-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                                    <Icon name="Plus" size={12} /> Add Exercise
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addDay} className="w-full py-4 border-2 border-dashed border-white/10 hover:border-primary-500/40 text-zinc-500 hover:text-primary-400 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm">
                        <Icon name="Plus" size={16} /> Add Workout Day
                    </button>
                </div>
            </div>

            {pickingFor && (
                <ExerciseSelector
                    onClose={() => setPickingFor(null)}
                    onSelect={handleSelectEx}
                    persistToGlobal={true}
                />
            )}
            <AdminToast state={state} />
        </div>
    );
};
