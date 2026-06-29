
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { GlobalTemplate, ProgramDay, ProgramSlot } from '../../types';
import { TRANSLATIONS, MUSCLE_GROUPS, INITIAL_TEMPLATES } from '../../constants';
import { ExerciseSelector } from '../ui/ExerciseSelector';
import { ConfirmModal } from '../ui/ConfirmModal';
import { getFirebaseServices } from '../../lib/firebaseLoader';

const SUPERSET_COLORS = [
    { border: 'border-l-orange-500', bg: 'bg-orange-500/5', text: 'text-orange-500' },
    { border: 'border-l-blue-500', bg: 'bg-blue-500/5', text: 'text-blue-500' },
    { border: 'border-l-purple-500', bg: 'bg-purple-500/5', text: 'text-purple-500' },
    { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-500' },
    { border: 'border-l-pink-500', bg: 'bg-pink-500/5', text: 'text-pink-500' },
];

const HARDCODED_IDS = new Set(INITIAL_TEMPLATES.map(t => t.id));

type TemplateStatus = 'default' | 'modified' | 'custom';

export const AdminTemplateManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { globalTemplates, setGlobalTemplates, lang, exercises } = useApp();
    const t = TRANSLATIONS[lang];

    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingTemplate, setEditingTemplate] = useState<GlobalTemplate | null>(null);
    const [pickingFor, setPickingFor] = useState<{ dayIdx: number, slotIdx: number } | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'err' } | null>(null);

    // Track which template IDs are persisted in Firestore (vs only-hardcoded).
    // Fetched once on mount; refreshed after save/delete to keep badges accurate.
    const [firestoreIds, setFirestoreIds] = useState<Set<string>>(new Set());

    // Linking state for supersets
    const [linkingSlot, setLinkingSlot] = useState<{ dayIdx: number, slotIdx: number } | null>(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<GlobalTemplate | null>(null);
    const [resetTarget, setResetTarget] = useState<GlobalTemplate | null>(null);

    useEffect(() => {
        let cancelled = false;
        const refreshIds = async () => {
            const { db, firestoreApi } = await getFirebaseServices();
            if (!db) return;
            try {
                const snap = await firestoreApi.getDocs(firestoreApi.collection(db, 'global_templates'));
                if (cancelled) return;
                setFirestoreIds(new Set(snap.docs.map(d => d.id)));
            } catch (e) {
                // Non-fatal: badges just show "default" for everything
                console.warn('[Admin] Could not list global_templates IDs', e);
            }
        };
        refreshIds();
        return () => { cancelled = true; };
    }, []);

    const statusOf = (tpl: GlobalTemplate): TemplateStatus => {
        const isHardcoded = HARDCODED_IDS.has(tpl.id);
        const isInFirestore = firestoreIds.has(tpl.id);
        if (isHardcoded && isInFirestore) return 'modified';
        if (isHardcoded) return 'default';
        return 'custom';
    };

    const flashToast = (msg: string, tone: 'ok' | 'err') => {
        setToast({ msg, tone });
        setTimeout(() => setToast(null), 3500);
    };

    const getSupersetStyle = (ssid?: string) => {
        if (!ssid) return null;
        let hash = 0;
        for (let i = 0; i < ssid.length; i++) hash = ssid.charCodeAt(i) + ((hash << 5) - hash);
        return SUPERSET_COLORS[Math.abs(hash) % SUPERSET_COLORS.length];
    };

    // --- LIST HANDLERS ---
    const handleCreate = () => {
        const newTemplate: GlobalTemplate = {
            id: `tpl_${Date.now()}`,
            name: `custom_template_${Date.now()}`,
            title: { en: 'New Template', es: 'Nueva Plantilla' },
            description: { en: 'Description here', es: 'Descripción aquí' },
            isPro: false,
            order: globalTemplates.length + 1,
            program: [{ id: 'd1', dayName: { en: 'Day 1', es: 'Día 1' }, slots: [] }],
        };
        setEditingTemplate(newTemplate);
        setView('edit');
    };

    const handleEdit = (tpl: GlobalTemplate) => {
        setEditingTemplate(JSON.parse(JSON.stringify(tpl))); // deep clone
        setView('edit');
    };

    const confirmDelete = async () => {
        const { db, firestoreApi } = await getFirebaseServices();
        if (!deleteTarget || !db) return;
        const id = deleteTarget.id;
        setDeleteTarget(null);
        try {
            await firestoreApi.deleteDoc(firestoreApi.doc(db, 'global_templates', id));
            setFirestoreIds(prev => { const next = new Set(prev); next.delete(id); return next; });
            // If it's hardcoded, it'll reappear from INITIAL_TEMPLATES on next merge.
            // If it's custom, remove from local list now.
            if (!HARDCODED_IDS.has(id)) {
                setGlobalTemplates(prev => prev.filter(t => t.id !== id));
            }
            flashToast(HARDCODED_IDS.has(id) ? 'Reverted to default (Firestore doc deleted)' : 'Custom template deleted', 'ok');
        } catch (e: any) {
            console.error(e);
            flashToast(e.code === 'permission-denied' ? 'Permission denied (check Firestore rules)' : `Error: ${e.message}`, 'err');
        }
    };

    const confirmReset = async () => {
        const { db, firestoreApi } = await getFirebaseServices();
        if (!resetTarget || !db) return;
        const id = resetTarget.id;
        setResetTarget(null);
        try {
            await firestoreApi.deleteDoc(firestoreApi.doc(db, 'global_templates', id));
            setFirestoreIds(prev => { const next = new Set(prev); next.delete(id); return next; });
            // Replace local with the hardcoded version
            const hardcoded = INITIAL_TEMPLATES.find(t => t.id === id);
            if (hardcoded) {
                setGlobalTemplates(prev => prev.map(t => t.id === id ? hardcoded : t));
            }
            flashToast('Reverted to default', 'ok');
        } catch (e: any) {
            console.error(e);
            flashToast(e.code === 'permission-denied' ? 'Permission denied' : `Error: ${e.message}`, 'err');
        }
    };

    // --- EDITOR HANDLERS ---
    const handleSave = async () => {
        const { db, firestoreApi } = await getFirebaseServices();
        if (!editingTemplate || !db) return;
        setSaveStatus('saving');
        try {
            const cleanData = JSON.parse(JSON.stringify(editingTemplate));
            await firestoreApi.setDoc(firestoreApi.doc(db, 'global_templates', editingTemplate.id), cleanData);
            setSaveStatus('saved');

            // Update local merged list + mark as Firestore-persisted
            setGlobalTemplates(prev => {
                const idx = prev.findIndex(t => t.id === editingTemplate.id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = editingTemplate;
                    return next;
                }
                return [...prev, editingTemplate];
            });
            setFirestoreIds(prev => new Set(prev).add(editingTemplate.id));

            setTimeout(() => {
                setView('list');
                setSaveStatus('idle');
                flashToast('Saved. Live for all users on next refresh.', 'ok');
            }, 800);
        } catch (e: any) {
            console.error(e);
            setSaveStatus('error');
            flashToast(e.code === 'permission-denied' ? 'Permission denied — check Firestore rules in Admin Panel' : `Error: ${e.message}`, 'err');
        }
    };

    const updateMetadata = (field: keyof GlobalTemplate | 'title_en' | 'title_es' | 'desc_en' | 'desc_es', value: any) => {
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
        setEditingTemplate(prev => prev ? {
            ...prev,
            program: [...prev.program, { id: `d${Date.now()}`, dayName: { en: `Day ${prev.program.length + 1}`, es: `Día ${prev.program.length + 1}` }, slots: [] }],
        } : null);
    };

    const removeDay = (idx: number) => {
        setEditingTemplate(prev => prev ? { ...prev, program: prev.program.filter((_, i) => i !== idx) } : null);
    };

    const updateSlot = (dayIdx: number, slotIdx: number, field: keyof ProgramSlot, value: any) => {
        updateDay(dayIdx, day => {
            const newSlots = [...day.slots];
            newSlots[slotIdx] = { ...newSlots[slotIdx], [field]: value };
            return { ...day, slots: newSlots };
        });
    };

    const addSlot = (dayIdx: number) => updateDay(dayIdx, day => ({ ...day, slots: [...day.slots, { muscle: 'CHEST', setTarget: 3 }] }));
    const removeSlot = (dayIdx: number, slotIdx: number) => updateDay(dayIdx, day => ({ ...day, slots: day.slots.filter((_, i) => i !== slotIdx) }));

    const moveSlot = (dayIdx: number, slotIdx: number, direction: 'up' | 'down') => {
        updateDay(dayIdx, day => {
            const newSlots = [...day.slots];
            if (direction === 'up' && slotIdx > 0) [newSlots[slotIdx], newSlots[slotIdx - 1]] = [newSlots[slotIdx - 1], newSlots[slotIdx]];
            else if (direction === 'down' && slotIdx < newSlots.length - 1) [newSlots[slotIdx], newSlots[slotIdx + 1]] = [newSlots[slotIdx + 1], newSlots[slotIdx]];
            return { ...day, slots: newSlots };
        });
    };

    const handleSupersetAction = (dayIdx: number, slotIdx: number) => {
        const slot = editingTemplate?.program[dayIdx].slots[slotIdx];
        if (!slot) return;

        if (linkingSlot) {
            if (linkingSlot.dayIdx !== dayIdx) {
                flashToast('Cannot link across days', 'err');
                setLinkingSlot(null);
                return;
            }
            if (linkingSlot.slotIdx === slotIdx) { setLinkingSlot(null); return; }

            updateDay(dayIdx, day => {
                const newSlots = [...day.slots];
                const src = newSlots[linkingSlot.slotIdx];
                const tgt = newSlots[slotIdx];
                const ssid = src.supersetId || tgt.supersetId || `ss_${Date.now()}`;
                newSlots[linkingSlot.slotIdx] = { ...src, supersetId: ssid };
                newSlots[slotIdx] = { ...tgt, supersetId: ssid };
                return { ...day, slots: newSlots };
            });
            setLinkingSlot(null);
            return;
        }

        if (slot.supersetId) {
            updateSlot(dayIdx, slotIdx, 'supersetId', undefined);
            return;
        }
        setLinkingSlot({ dayIdx, slotIdx });
    };

    const handleSelectEx = (exId: string) => {
        if (pickingFor && editingTemplate) {
            updateSlot(pickingFor.dayIdx, pickingFor.slotIdx, 'exerciseId', exId);
            setPickingFor(null);
        }
    };

    // ─── Status badge ──────────────────────────────────────────────────
    const StatusBadge: React.FC<{ status: TemplateStatus }> = ({ status }) => {
        const style = {
            default:  { label: 'DEFAULT',  cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
            modified: { label: 'MODIFIED', cls: 'bg-primary-500/10 text-primary-400 border-primary-500/30' },
            custom:   { label: 'CUSTOM',   cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
        }[status];
        return (
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${style.cls}`}>
                {style.label}
            </span>
        );
    };

    // ─── Toast ─────────────────────────────────────────────────────────
    const Toast = () => toast ? (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
            toast.tone === 'ok' ? 'bg-primary-500/10 border-primary-500/30 text-primary-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
            {toast.msg}
        </div>
    ) : null;

    // ─── LIST VIEW ─────────────────────────────────────────────────────
    if (view === 'list') {
        return (
            <div className="fixed inset-0 z-confirm bg-black text-white flex flex-col font-sans">
                <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/95 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                            <Icon name="Crown" size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight">Template Manager</h2>
                            <p className="text-[10px] text-zinc-500 font-medium">{globalTemplates.length} plans · {firestoreIds.size} persisted</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="Close">
                        <Icon name="X" size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 scroll-container">
                    <button
                        onClick={handleCreate}
                        className="w-full py-3.5 bg-primary-500 text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-transform hover:bg-primary-400"
                    >
                        <Icon name="Plus" size={18} strokeWidth={2.5} /> Create New Template
                    </button>

                    {globalTemplates.map(tpl => {
                        const status = statusOf(tpl);
                        return (
                            <div key={tpl.id} className="glass-card rounded-2xl p-4">
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <StatusBadge status={status} />
                                            {tpl.isPro && <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black px-2 py-0.5 rounded uppercase tracking-widest">PRO</span>}
                                        </div>
                                        <div className="font-bold text-sm text-white truncate">{tpl.title.en}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{tpl.id} · {tpl.program.length} days</div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            onClick={() => handleEdit(tpl)}
                                            className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 flex items-center justify-center transition-colors"
                                            aria-label={`Edit ${tpl.title.en}`}
                                            title="Edit"
                                        >
                                            <Icon name="Edit" size={15} />
                                        </button>
                                        {status === 'modified' && (
                                            <button
                                                onClick={() => setResetTarget(tpl)}
                                                className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                                                aria-label={`Reset ${tpl.title.en} to default`}
                                                title="Reset to default"
                                            >
                                                <Icon name="RotateCcw" size={15} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDeleteTarget(tpl)}
                                            className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                            aria-label={`Delete ${tpl.title.en}`}
                                            title={status === 'default' ? 'No-op (hardcoded)' : 'Delete'}
                                            disabled={status === 'default'}
                                        >
                                            <Icon name="Trash2" size={15} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{tpl.description.en}</p>
                            </div>
                        );
                    })}
                </div>

                <ConfirmModal
                    isOpen={!!deleteTarget}
                    title="Delete template"
                    description={deleteTarget ? `Permanently delete "${deleteTarget.title.en}"? This affects ALL users.` : ''}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
                <ConfirmModal
                    isOpen={!!resetTarget}
                    title="Reset to default"
                    description={resetTarget ? `Discard all modifications to "${resetTarget.title.en}" and revert to the built-in version?` : ''}
                    confirmText="Reset"
                    cancelText="Cancel"
                    onConfirm={confirmReset}
                    onCancel={() => setResetTarget(null)}
                />
                <Toast />
            </div>
        );
    }

    // ─── EDITOR VIEW ───────────────────────────────────────────────────
    const status = editingTemplate ? statusOf(editingTemplate) : 'default';

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
            <Toast />
        </div>
    );
};
