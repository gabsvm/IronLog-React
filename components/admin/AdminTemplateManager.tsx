
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { GlobalTemplate, ProgramDay, MuscleGroup, ProgramSlot } from '../../types';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getTranslated } from '../../utils';
import { ExerciseSelector } from '../ui/ExerciseSelector';

const SUPERSET_COLORS = [
    { border: 'border-l-orange-500', bg: 'bg-orange-500/5', text: 'text-orange-500' },
    { border: 'border-l-blue-500', bg: 'bg-blue-500/5', text: 'text-blue-500' },
    { border: 'border-l-purple-500', bg: 'bg-purple-500/5', text: 'text-purple-500' },
    { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-500' },
    { border: 'border-l-pink-500', bg: 'bg-pink-500/5', text: 'text-pink-500' },
];

export const AdminTemplateManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { globalTemplates, setGlobalTemplates, lang, exercises } = useApp();
    const { user } = useAuth();
    const t = TRANSLATIONS[lang];

    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingTemplate, setEditingTemplate] = useState<GlobalTemplate | null>(null);
    const [pickingFor, setPickingFor] = useState<{ dayIdx: number, slotIdx: number } | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    
    // New Linking State
    const [linkingSlot, setLinkingSlot] = useState<{ dayIdx: number, slotIdx: number } | null>(null);

    // Helper to generate consistent colors for Superset IDs
    const getSupersetStyle = (ssid?: string) => {
        if (!ssid) return null;
        // Simple hash to pick a color index
        let hash = 0;
        for (let i = 0; i < ssid.length; i++) hash = ssid.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % SUPERSET_COLORS.length;
        return SUPERSET_COLORS[index];
    };

    // --- LIST VIEW HANDLERS ---
    
    const handleCreate = () => {
        const newTemplate: GlobalTemplate = {
            id: `tpl_${Date.now()}`,
            name: `custom_template_${Date.now()}`,
            title: { en: "New Template", es: "Nueva Plantilla" },
            description: { en: "Description here", es: "Descripción aquí" },
            isPro: false,
            order: globalTemplates.length + 1,
            program: [
                { id: 'd1', dayName: { en: "Day 1", es: "Día 1" }, slots: [] }
            ]
        };
        setEditingTemplate(newTemplate);
        setView('edit');
    };

    const handleEdit = (tpl: GlobalTemplate) => {
        setEditingTemplate(JSON.parse(JSON.stringify(tpl))); // Deep copy
        setView('edit');
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This deletes the template for ALL USERS.")) return;
        if (!db) return;
        
        try {
            await deleteDoc(doc(db, "global_templates", id));
            setGlobalTemplates(prev => prev.filter(t => t.id !== id));
        } catch (e: any) {
            console.error(e);
            if (e.code === 'permission-denied') {
                alert("Permission Denied: Please check Firestore Rules. See Admin Panel > Copy Rules.");
            } else {
                alert(`Error deleting template: ${e.message}`);
            }
        }
    };

    // --- EDITOR HANDLERS ---

    const handleSave = async () => {
        if (!editingTemplate || !db) return;
        setSaveStatus('saving');
        
        try {
            const cleanData = JSON.parse(JSON.stringify(editingTemplate));
            await setDoc(doc(db, "global_templates", editingTemplate.id), cleanData);
            setSaveStatus('saved');
            
            setGlobalTemplates(prev => {
                const idx = prev.findIndex(t => t.id === editingTemplate.id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = editingTemplate;
                    return next;
                }
                return [...prev, editingTemplate];
            });
            
            setTimeout(() => {
                setView('list');
                setSaveStatus('idle');
            }, 1000);
        } catch (e: any) {
            console.error(e);
            setSaveStatus('error');
            if (e.code === 'permission-denied') {
                alert("Permission Denied: You cannot write to 'global_templates'. Check Firestore Rules in Admin Panel.");
            } else {
                alert(`Error saving: ${e.message}`);
            }
        }
    };

    const updateMetadata = (field: keyof GlobalTemplate | 'title_en' | 'title_es' | 'desc_en' | 'desc_es', value: any) => {
        if (!editingTemplate) return;
        setEditingTemplate(prev => {
            if (!prev) return null;
            const next = { ...prev };
            if (field === 'title_en') next.title = { ...next.title, en: value };
            else if (field === 'title_es') next.title = { ...next.title, es: value };
            else if (field === 'desc_en') next.description = { ...next.description, en: value };
            else if (field === 'desc_es') next.description = { ...next.description, es: value };
            else (next as any)[field] = value;
            return next;
        });
    };

    const updateDay = (dayIdx: number, fn: (d: ProgramDay) => ProgramDay) => {
        setEditingTemplate(prev => {
            if (!prev) return null;
            const newProg = [...prev.program];
            newProg[dayIdx] = fn(newProg[dayIdx]);
            return { ...prev, program: newProg };
        });
    };

    const addDay = () => {
        setEditingTemplate(prev => {
            if (!prev) return null;
            return {
                ...prev,
                program: [...prev.program, { id: `d${Date.now()}`, dayName: { en: `Day ${prev.program.length + 1}`, es: `Día ${prev.program.length + 1}` }, slots: [] }]
            };
        });
    };

    const removeDay = (idx: number) => {
        setEditingTemplate(prev => prev ? { ...prev, program: prev.program.filter((_, i) => i !== idx) } : null);
    };

    const updateSlot = (dayIdx: number, slotIdx: number, field: keyof ProgramSlot, value: any) => {
        updateDay(dayIdx, (day) => {
            const newSlots = [...day.slots];
            newSlots[slotIdx] = { ...newSlots[slotIdx], [field]: value };
            return { ...day, slots: newSlots };
        });
    };

    const addSlot = (dayIdx: number) => {
        updateDay(dayIdx, (day) => ({
            ...day,
            slots: [...day.slots, { muscle: 'CHEST', setTarget: 3 }]
        }));
    };

    const removeSlot = (dayIdx: number, slotIdx: number) => {
        updateDay(dayIdx, (day) => ({
            ...day,
            slots: day.slots.filter((_, i) => i !== slotIdx)
        }));
    };

    // --- SUPERSET LOGIC ---
    const handleSupersetAction = (dayIdx: number, slotIdx: number) => {
        const slot = editingTemplate?.program[dayIdx].slots[slotIdx];
        if (!slot) return;

        // 1. If we are currently linking (Action: Connect Source to Target)
        if (linkingSlot) {
            // Cannot link across different days (UI prevents this mostly, but safety check)
            if (linkingSlot.dayIdx !== dayIdx) {
                alert("Cannot link exercises from different days.");
                setLinkingSlot(null);
                return;
            }

            // Cancel if clicking same slot
            if (linkingSlot.slotIdx === slotIdx) {
                setLinkingSlot(null);
                return;
            }

            // Perform Link
            updateDay(dayIdx, (day) => {
                const newSlots = [...day.slots];
                const sourceSlot = newSlots[linkingSlot.slotIdx];
                const targetSlot = newSlots[slotIdx];

                // Determine ID: Prefer Source ID -> Target ID -> New ID
                const ssid = sourceSlot.supersetId || targetSlot.supersetId || `ss_${Date.now()}`;

                newSlots[linkingSlot.slotIdx] = { ...sourceSlot, supersetId: ssid };
                newSlots[slotIdx] = { ...targetSlot, supersetId: ssid };

                return { ...day, slots: newSlots };
            });
            
            setLinkingSlot(null);
            return;
        }

        // 2. If NOT linking, but slot is already supersetted (Action: Unlink)
        if (slot.supersetId) {
            updateSlot(dayIdx, slotIdx, 'supersetId', undefined);
            return;
        }

        // 3. If NOT linking and NO superset (Action: Start Linking Mode)
        setLinkingSlot({ dayIdx, slotIdx });
    };

    const handleSelectEx = (exId: string) => {
        if (pickingFor && editingTemplate) {
            updateSlot(pickingFor.dayIdx, pickingFor.slotIdx, 'exerciseId', exId);
            setPickingFor(null);
        }
    };

    if (view === 'list') {
        return (
            <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col font-sans">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Icon name="Crown" className="text-yellow-500" /> Admin Template Manager
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><Icon name="X" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <button onClick={handleCreate} className="w-full py-3 bg-green-600 rounded-xl font-bold mb-4">+ Create New Template</button>
                    
                    {globalTemplates.map((tpl) => (
                        <div key={tpl.id} className="bg-zinc-900 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg">{tpl.title.en}</div>
                                <div className="text-xs text-zinc-400">{tpl.name} | {tpl.program.length} Days</div>
                                {tpl.isPro && <span className="inline-block bg-yellow-600 text-black text-[9px] font-black px-1 rounded mt-1">PRO</span>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(tpl)} className="p-2 bg-blue-600 rounded-lg"><Icon name="Edit" size={16} /></button>
                                <button onClick={() => handleDelete(tpl.id)} className="p-2 bg-red-600 rounded-lg"><Icon name="Trash2" size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // EDITOR VIEW
    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col font-sans">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900 shrink-0">
                <button onClick={() => setView('list')} className="text-zinc-400 hover:text-white flex items-center gap-1">
                    <Icon name="ChevronLeft" /> Back
                </button>
                <div className="font-bold">Editing: {editingTemplate?.name}</div>
                <button 
                    onClick={handleSave} 
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-blue-600'}`}
                    disabled={saveStatus === 'saving'}
                >
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
                {/* Linking Mode Banner */}
                {linkingSlot && (
                    <div className="sticky top-0 left-0 right-0 z-10 bg-orange-600 text-white p-3 rounded-xl shadow-lg mb-4 flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="text-sm font-bold flex items-center gap-2">
                            <Icon name="Link" size={16} /> Select an exercise to link...
                        </div>
                        <button onClick={() => setLinkingSlot(null)} className="text-xs bg-white text-orange-600 px-3 py-1 rounded-lg font-bold">Cancel</button>
                    </div>
                )}

                {/* Metadata */}
                <div className="space-y-4 bg-zinc-900 p-4 rounded-xl border border-white/10">
                    <h3 className="font-bold text-zinc-400 uppercase text-xs">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">ID</label>
                            <input className="w-full bg-black border border-white/10 p-2 rounded text-sm" value={editingTemplate?.name} onChange={e => updateMetadata('name', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">Order</label>
                            <input type="number" className="w-full bg-black border border-white/10 p-2 rounded text-sm" value={editingTemplate?.order} onChange={e => updateMetadata('order', Number(e.target.value))} />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPro" checked={editingTemplate?.isPro} onChange={e => updateMetadata('isPro', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
                        <label htmlFor="isPro" className="font-bold text-yellow-500">Is PRO Template?</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">Title (EN)</label>
                            <input className="w-full bg-black border border-white/10 p-2 rounded text-sm" value={editingTemplate?.title.en} onChange={e => updateMetadata('title_en', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">Title (ES)</label>
                            <input className="w-full bg-black border border-white/10 p-2 rounded text-sm" value={editingTemplate?.title.es} onChange={e => updateMetadata('title_es', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">Desc (EN)</label>
                            <textarea className="w-full bg-black border border-white/10 p-2 rounded text-sm" rows={2} value={editingTemplate?.description.en} onChange={e => updateMetadata('desc_en', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 block mb-1">Desc (ES)</label>
                            <textarea className="w-full bg-black border border-white/10 p-2 rounded text-sm" rows={2} value={editingTemplate?.description.es} onChange={e => updateMetadata('desc_es', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Days Editor */}
                <div className="space-y-6">
                    {editingTemplate?.program.map((day, dayIdx) => (
                        <div key={dayIdx} className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${linkingSlot && linkingSlot.dayIdx !== dayIdx ? 'opacity-30 pointer-events-none border-white/5' : 'border-white/10'}`}>
                            {/* Day Header */}
                            <div className="bg-zinc-800 p-3 flex justify-between items-center">
                                <div className="flex gap-2 flex-1">
                                    <input className="bg-black/20 text-white font-bold p-1 rounded w-1/2" value={day.dayName.en} onChange={e => updateDay(dayIdx, d => ({...d, dayName: {...d.dayName, en: e.target.value}}))} placeholder="Day Name (EN)" />
                                    <input className="bg-black/20 text-white font-bold p-1 rounded w-1/2" value={day.dayName.es} onChange={e => updateDay(dayIdx, d => ({...d, dayName: {...d.dayName, es: e.target.value}}))} placeholder="Day Name (ES)" />
                                </div>
                                <button onClick={() => removeDay(dayIdx)} className="text-red-500 hover:bg-white/10 p-2 rounded"><Icon name="Trash2" size={16} /></button>
                            </div>

                            {/* Slots */}
                            <div className="p-3 space-y-2">
                                {day.slots.map((slot, slotIdx) => {
                                    const ssStyle = getSupersetStyle(slot.supersetId);
                                    const isLinkingSource = linkingSlot?.dayIdx === dayIdx && linkingSlot?.slotIdx === slotIdx;
                                    const isLinkable = linkingSlot && !isLinkingSource;

                                    return (
                                        <div key={slotIdx} className={`
                                            flex items-center gap-2 p-2 rounded border transition-all
                                            ${ssStyle 
                                                ? `${ssStyle.border} ${ssStyle.bg} border-l-4` 
                                                : 'border-white/5 bg-black/20'
                                            }
                                            ${isLinkingSource ? 'ring-2 ring-orange-500 bg-orange-500/10' : ''}
                                            ${isLinkable ? 'hover:bg-white/10 cursor-pointer' : ''}
                                        `}
                                        onClick={() => isLinkable && handleSupersetAction(dayIdx, slotIdx)}
                                        >
                                            {/* Superset Control */}
                                            <div className="flex flex-col gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleSupersetAction(dayIdx, slotIdx); }} 
                                                    className={`
                                                        p-2 rounded-lg transition-colors
                                                        ${isLinkingSource ? 'bg-orange-600 text-white' : ''}
                                                        ${slot.supersetId && !isLinkingSource ? 'bg-zinc-800 text-red-400 hover:bg-red-900/50' : ''}
                                                        ${!slot.supersetId && !isLinkingSource ? 'bg-zinc-800 text-zinc-400 hover:text-white' : ''}
                                                    `}
                                                    title={slot.supersetId ? "Unlink" : "Link"}
                                                >
                                                    {isLinkingSource ? <Icon name="X" size={14} /> : (slot.supersetId ? <Icon name="Unlink" size={14} /> : <Icon name="Link" size={14} />)}
                                                </button>
                                            </div>

                                            {/* Muscle */}
                                            <select 
                                                className="bg-zinc-800 text-xs rounded p-1 max-w-[80px]" 
                                                value={slot.muscle}
                                                onChange={e => updateSlot(dayIdx, slotIdx, 'muscle', e.target.value)}
                                            >
                                                {Object.keys(MUSCLE_GROUPS).map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>

                                            {/* Exercise */}
                                            <button 
                                                onClick={() => setPickingFor({ dayIdx, slotIdx })}
                                                className={`flex-1 text-left text-xs truncate font-medium p-1.5 rounded ${slot.exerciseId ? 'text-white bg-zinc-800' : 'text-zinc-500 bg-zinc-900 border border-dashed border-zinc-700'}`}
                                            >
                                                {slot.exerciseId 
                                                    ? (exercises.find(e => e.id === slot.exerciseId)?.name as any)?.en || slot.exerciseId 
                                                    : "Select Exercise..."}
                                            </button>

                                            {/* Sets/Reps */}
                                            <input type="number" className="w-10 bg-zinc-800 text-center text-xs p-1 rounded" value={slot.setTarget} onChange={e => updateSlot(dayIdx, slotIdx, 'setTarget', Number(e.target.value))} placeholder="Sets" />
                                            <input type="text" className="w-14 bg-zinc-800 text-center text-xs p-1 rounded" value={slot.reps || ''} onChange={e => updateSlot(dayIdx, slotIdx, 'reps', e.target.value)} placeholder="Reps" />

                                            <button onClick={() => removeSlot(dayIdx, slotIdx)} className="text-zinc-500 hover:text-red-500"><Icon name="X" size={14} /></button>
                                        </div>
                                    );
                                })}
                                <button onClick={() => addSlot(dayIdx)} className="w-full py-2 bg-zinc-800 text-xs font-bold rounded hover:bg-zinc-700">+ Add Exercise</button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addDay} className="w-full py-4 border-2 border-dashed border-zinc-800 text-zinc-500 font-bold rounded-xl hover:border-zinc-600 hover:text-zinc-300">
                        + Add Workout Day
                    </button>
                </div>
            </div>

            {pickingFor && (
                <ExerciseSelector 
                    onClose={() => setPickingFor(null)} 
                    onSelect={handleSelectEx}
                    persistToGlobal={true} // ENABLE GLOBAL SAVE FOR ADMIN
                />
            )}
        </div>
    );
};
