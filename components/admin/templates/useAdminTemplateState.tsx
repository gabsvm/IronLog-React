// U5: AdminTemplateManager state and handlers, moved verbatim from components/admin/AdminTemplateManager.tsx.
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { GlobalTemplate, ProgramDay, ProgramSlot } from '../../../types';
import { TRANSLATIONS } from '../../../constants';
import { INITIAL_TEMPLATES } from '../../../data/defaultTemplates';
import { getFirebaseFirestoreServices } from '../../../lib/firebaseLoader';
import { SUPERSET_COLORS, HARDCODED_IDS, TemplateStatus } from './templateConstants';

export const useAdminTemplateState = ({ onClose }: { onClose: () => void }) => {
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
            const { db, firestoreApi } = await getFirebaseFirestoreServices();
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
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
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
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
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
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
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

    // ─── EDITOR VIEW ───────────────────────────────────────────────────
    const status = editingTemplate ? statusOf(editingTemplate) : 'default';


    return {
        onClose,
        globalTemplates,
        setGlobalTemplates,
        lang,
        exercises,
        t,
        view,
        setView,
        editingTemplate,
        setEditingTemplate,
        pickingFor,
        setPickingFor,
        saveStatus,
        setSaveStatus,
        toast,
        setToast,
        firestoreIds,
        setFirestoreIds,
        linkingSlot,
        setLinkingSlot,
        deleteTarget,
        setDeleteTarget,
        resetTarget,
        setResetTarget,
        statusOf,
        flashToast,
        getSupersetStyle,
        handleCreate,
        handleEdit,
        confirmDelete,
        confirmReset,
        handleSave,
        updateMetadata,
        updateDay,
        addDay,
        removeDay,
        updateSlot,
        addSlot,
        removeSlot,
        moveSlot,
        handleSupersetAction,
        handleSelectEx,
        StatusBadge,
        status,
    };
};

export type AdminTemplateState = ReturnType<typeof useAdminTemplateState>;
