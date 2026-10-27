import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Icon } from '../../components/ui/Icon';
import { useApp } from '../../context/AppContext';
import { getTranslated, lastPerformedForTemplate, formatLastPerformed } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { shareFileOrDownload } from '../../utils/shareFile';
import type { GlobalTemplate } from '../../types';
import { useTemplateFolders } from './useTemplateFolders';
import {
    FolderActionsSheet,
    FolderFormSheet,
    TemplateActionsSheet,
    TemplatePreviewSheet,
    resolveTFText,
} from './TemplateFolderSheets';
import {
    ALL,
    ARCHIVED,
    UNFILED,
    buildShareEnvelope,
    createFolder,
    deleteFolder,
    deleteTemplate,
    duplicateTemplate,
    getFolderId,
    isArchived,
    isSharedTemplateEnvelope,
    moveTemplate,
    normalizeImportedTemplate,
    pruneFolderRefs,
    renameFolder,
    renameTemplate,
    slugify,
    sortTemplates,
    withArchived,
    withFolder,
    type OrganizedTemplate,
    type TemplateFolder,
} from './templateOrganization';

interface SectionProps {
    query: string;
    lang: string;
    t: unknown;
    onSelectTemplate: (tpl: GlobalTemplate) => void;
}

const chipCls = (active: boolean): string =>
    `min-h-[44px] shrink-0 rounded-xl border px-3.5 text-xs font-medium ${active ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]'}`;

const readMuscleName = (t: unknown, key: string): string => {
    if (!key || !t || typeof t !== 'object' || !('muscle' in t)) return '';
    const m: unknown = t.muscle;
    if (!m || typeof m !== 'object') return '';
    // Reason: translation muscle map is integrator-owned; the value is validated below.
    const bag: Record<string, unknown> = m as Record<string, unknown>;
    const v: unknown = bag[key];
    return typeof v === 'string' ? v : '';
};

const readMyTemplatesLabel = (t: unknown, fallback: string): string => {
    if (t && typeof t === 'object' && 'templateSelector' in t) {
        const ts = t.templateSelector;
        if (ts && typeof ts === 'object' && 'myTemplates' in ts && typeof ts.myTemplates === 'string') {
            return ts.myTemplates;
        }
    }
    return fallback;
};

/**
 * Provider guard: TemplateSelector renders in provider-less unit tests, so the
 * folders UI only mounts when AppContext exists. Production always provides it.
 */
export const PersonalTemplatesSection: React.FC<SectionProps> = (props) => {
    let hasProvider = true;
    try {
        useApp();
    } catch {
        hasProvider = false;
    }
    if (!hasProvider) return null;
    return <PersonalTemplatesInner {...props} />;
};

const PersonalTemplatesInner: React.FC<SectionProps> = ({ query, lang, t, onSelectTemplate }) => {
    const { personalTemplates, setPersonalTemplates, exercises, logs } = useApp();
    const { folders, setFolders } = useTemplateFolders();
    const normLang = pickLang(lang, { es: 'es', en: 'en' } as const);
    const txt = resolveTFText(t, normLang);

    const [lane, setLane] = useState<string>(ALL);
    const [folderForm, setFolderForm] = useState<{ id?: string } | null>(null);
    const [menuTpl, setMenuTpl] = useState<GlobalTemplate | null>(null);
    const [menuFolder, setMenuFolder] = useState<TemplateFolder | null>(null);
    const [previewTpl, setPreviewTpl] = useState<GlobalTemplate | null>(null);
    const [confirmTpl, setConfirmTpl] = useState<GlobalTemplate | null>(null);
    const [confirmFolder, setConfirmFolder] = useState<TemplateFolder | null>(null);
    const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const updatePersonal = (fn: (prev: GlobalTemplate[]) => GlobalTemplate[]): void => {
        setPersonalTemplates((prev) => fn(Array.isArray(prev) ? prev : []));
    };
    const updateFolders = (fn: (prev: TemplateFolder[]) => TemplateFolder[]): void => {
        setFolders((prev) => fn(Array.isArray(prev) ? prev : []));
    };

    const personal = useMemo(
        () => sortTemplates((Array.isArray(personalTemplates) ? personalTemplates : []).filter((p) => p.scope === 'personal')),
        [personalTemplates],
    );

    // Orphan safety: a template whose folderId matches no existing folder is
    // treated as unfiled everywhere, so nothing ever disappears when the
    // folder list is empty or a folder vanished without cleanup.
    const folderIds = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);
    const isOrphanFolder = (tpl: GlobalTemplate): boolean => {
        const fid = getFolderId(tpl);
        return fid != null && !folderIds.has(fid);
    };

    // Repair persisted refs only once folders are known to be loaded
    // (folders.length > 0): never wipe assignments while the list may still
    // be hydrating, and never while it is legitimately empty.
    useEffect(() => {
        if (folders.length === 0 || personal.length === 0) return;
        if (personal.some((p) => isOrphanFolder(p))) {
            updatePersonal((prev) => pruneFolderRefs(prev, folders));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot repair, not a sync loop
    }, [folders, personal]);

    // Fall back to ALL when the selected folder disappears.
    useEffect(() => {
        if (lane !== ALL && lane !== UNFILED && lane !== ARCHIVED && !folders.some((f) => f.id === lane)) {
            setLane(ALL);
        }
    }, [folders, lane]);

    const q = query.trim().toLowerCase();
    const matching = useMemo(() => {
        if (!q) return personal;
        return personal.filter((tpl) => {
            const hay = `${getTranslated(tpl.title, normLang)} ${getTranslated(tpl.description, normLang)}`.toLowerCase();
            return hay.includes(q);
        });
    }, [personal, q, normLang]);

    const activeList = useMemo(() => matching.filter((tpl) => !isArchived(tpl)), [matching]);
    const archivedList = useMemo(() => matching.filter((tpl) => isArchived(tpl)), [matching]);
    const unfiledList = useMemo(() => activeList.filter((tpl) => {
        const folderId = getFolderId(tpl);
        return folderId == null || !folderIds.has(folderId);
    }), [activeList, folderIds]);

    const laneTemplates = useMemo(() => {
        if (lane === ARCHIVED) return archivedList;
        if (lane === UNFILED) return unfiledList;
        if (lane === ALL) return activeList;
        return activeList.filter((tpl) => getFolderId(tpl) === lane);
    }, [lane, activeList, archivedList, unfiledList]);

    // ALL lane groups rows by folder (unfiled first, then folders in order).
    const groups = useMemo(() => {
        if (lane !== ALL) return null;
        const list: { key: string; title: string; folder: TemplateFolder | null; items: GlobalTemplate[] }[] = [];
        if (unfiledList.length > 0) list.push({ key: UNFILED, title: txt.unfiled, folder: null, items: unfiledList });
        folders.forEach((f) => {
            const items = activeList.filter((tpl) => getFolderId(tpl) === f.id);
            if (items.length > 0 || q === '') list.push({ key: f.id, title: f.name, folder: f, items });
        });
        return list;
    }, [lane, unfiledList, folders, activeList, txt.unfiled, q]);

    const resolveSlotName = (slot: { exerciseId?: string; muscle?: string }): string => {
        const list = Array.isArray(exercises) ? exercises : [];
        const def = slot.exerciseId ? list.find((e) => e.id === slot.exerciseId) : undefined;
        if (def) return String(getTranslated(def.name, normLang));
        return String(readMuscleName(t, slot.muscle || '') || slot.exerciseId || slot.muscle || '');
    };
    const slotSets = (slot: { setTarget?: number }): number =>
        typeof slot.setTarget === 'number' && slot.setTarget > 0 ? slot.setTarget : 3;

    const titleOf = (tpl: GlobalTemplate): string => String(getTranslated(tpl.title, normLang));

    const handleShare = (tpl: GlobalTemplate): void => {
        const json = JSON.stringify(buildShareEnvelope(tpl), null, 2);
        void shareFileOrDownload(json, `${slugify(titleOf(tpl))}-template.json`, 'application/json', txt.sharedTitle);
        setMenuTpl(null);
    };

    const handleImportFile = (file: File): void => {
        setImportMsg(null);
        void (async () => {
            try {
                const data: unknown = JSON.parse(await file.text());
                if (!isSharedTemplateEnvelope(data)) {
                    setImportMsg({ ok: false, text: txt.importError });
                    return;
                }
                const maxOrder = personal.reduce((m, tpl) => Math.max(m, tpl.order ?? 0), -1);
                const now = Date.now();
                const imported = normalizeImportedTemplate(data.template, {
                    id: `personal_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
                    name: `personal_${now}`,
                    order: maxOrder + 1,
                    untitled: txt.importUntitled,
                });
                if (!imported) {
                    setImportMsg({ ok: false, text: txt.importError });
                    return;
                }
                updatePersonal((prev) => [...prev, imported]);
                setImportMsg({ ok: true, text: txt.importOk.replace('{name}', titleOf(imported)) });
            } catch {
                setImportMsg({ ok: false, text: txt.importError });
            }
        })();
    };

    const renderRow = (tpl: GlobalTemplate, index: number, laneArr: GlobalTemplate[]): React.ReactNode => {
        const program = Array.isArray(tpl.program) ? tpl.program : [];
        return (
            <li
                key={tpl.id}
                className="flex items-stretch gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]"
            >
                <button
                    type="button"
                    onClick={() => setPreviewTpl(tpl)}
                    aria-label={`${txt.preview}: ${titleOf(tpl)}`}
                    className="min-w-0 flex-1 p-4 text-left"
                >
                    <span className="block truncate text-base font-semibold text-[rgb(var(--text-primary))]">{titleOf(tpl)}</span>
                    {(() => {
                        const last = lastPerformedForTemplate(tpl.id, logs);
                        if (!last) return null;
                        return <span className="mt-1 block text-xs text-[rgb(var(--text-secondary))]">{formatLastPerformed(last, normLang)}</span>;
                    })()}
                    <span className="mt-1 block text-xs text-[rgb(var(--text-secondary))]">
                        {program.length} {txt.days}
                    </span>
                </button>
                <div className="flex shrink-0 items-center">
                    <button
                        type="button"
                        onClick={() => updatePersonal((prev) => moveTemplate(prev, tpl.id, -1))}
                        disabled={index === 0}
                        aria-label={txt.moveUp}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[rgb(var(--text-secondary))] disabled:opacity-30"
                    >
                        <Icon name="ChevronUp" size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => updatePersonal((prev) => moveTemplate(prev, tpl.id, 1))}
                        disabled={index === laneArr.length - 1}
                        aria-label={txt.moveDown}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[rgb(var(--text-secondary))] disabled:opacity-30"
                    >
                        <Icon name="ChevronDown" size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setMenuTpl(tpl)}
                        aria-label={titleOf(tpl)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[rgb(var(--text-secondary))]"
                    >
                        <Icon name="MoreVertical" size={18} />
                    </button>
                </div>
            </li>
        );
    };

    const myTemplatesLabel = readMyTemplatesLabel(t, txt.foldersTitle);

    return (
        <section aria-label={`${txt.foldersTitle} · ${myTemplatesLabel}`}>
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    {myTemplatesLabel}{' '}
                    <span className="font-normal text-[rgb(var(--text-secondary))]">({personal.length})</span>
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 text-xs font-medium text-[rgb(var(--text-secondary))]"
                    >
                        <Icon name="Upload" size={15} />
                        {txt.importTpl}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFolderForm({})}
                        className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 text-xs font-medium text-[rgb(var(--text-secondary))]"
                    >
                        <Icon name="FilePlus" size={15} />
                        {txt.newFolder}
                    </button>
                </div>
            </div>
            <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                aria-label={txt.importTpl}
                className="hidden"
                onChange={(e) => {
                    const picked = e.target.files?.[0];
                    e.target.value = '';
                    if (picked) handleImportFile(picked);
                }}
            />
            {importMsg && (
                <p role={importMsg.ok ? 'status' : 'alert'} className={`mt-2 text-xs font-medium ${importMsg.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                    {importMsg.text}
                </p>
            )}

            {(personal.length > 0 || folders.length > 0) && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto scroll-container px-0.5 py-0.5" role="group" aria-label={txt.foldersTitle}>
                    <button type="button" aria-pressed={lane === ALL} onClick={() => setLane(ALL)} className={chipCls(lane === ALL)}>
                        {txt.allTemplates} ({activeList.length})
                    </button>
                    {folders.map((f) => (
                        <button key={f.id} type="button" aria-pressed={lane === f.id} onClick={() => setLane(f.id)} className={`${chipCls(lane === f.id)} max-w-44 truncate`}>
                            {f.name} ({activeList.filter((tpl) => getFolderId(tpl) === f.id).length})
                        </button>
                    ))}
                    <button type="button" aria-pressed={lane === UNFILED} onClick={() => setLane(UNFILED)} className={chipCls(lane === UNFILED)}>
                        {txt.unfiled} ({unfiledList.length})
                    </button>
                    <button type="button" aria-pressed={lane === ARCHIVED} onClick={() => setLane(ARCHIVED)} className={chipCls(lane === ARCHIVED)}>
                        {txt.archived} ({archivedList.length})
                    </button>
                </div>
            )}

            <div className="mt-3 space-y-3">
                {groups ? (
                    groups.map((g) => (
                        <div key={g.key} className="overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
                            <div className="flex min-h-[56px] items-center justify-between gap-2 px-4">
                                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                                    {g.title} <span className="font-normal text-[rgb(var(--text-secondary))]">({g.items.length})</span>
                                </p>
                                {g.folder && (
                                    <button
                                        type="button"
                                        onClick={() => setMenuFolder(g.folder)}
                                        aria-label={g.title}
                                        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[rgb(var(--text-secondary))]"
                                    >
                                        <Icon name="MoreVertical" size={17} />
                                    </button>
                                )}
                            </div>
                            {g.items.length > 0 ? (
                                <ul className="grid gap-2 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.55)] p-2">
                                    {g.items.map((tpl, i) => renderRow(tpl, i, g.items))}
                                </ul>
                            ) : (
                                <p className="border-t border-[rgb(var(--border-subtle))] px-4 py-3 text-xs text-[rgb(var(--text-secondary))]">{txt.emptyFolder}</p>
                            )}
                        </div>
                    ))
                ) : laneTemplates.length > 0 ? (
                    <ul className="grid gap-2">
                        {laneTemplates.map((tpl, i) => renderRow(tpl, i, laneTemplates))}
                    </ul>
                ) : (
                    <p className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-6 text-center text-sm text-[rgb(var(--text-secondary))]">
                        {txt.emptyFolder}
                    </p>
                )}
            </div>

            <FolderFormSheet
                open={folderForm !== null}
                initialName={folderForm?.id ? folders.find((f) => f.id === folderForm.id)?.name ?? '' : ''}
                title={folderForm?.id ? txt.renameFolder : txt.newFolder}
                taken={(name) => folders.some((f) => f.id !== folderForm?.id && f.name.toLowerCase() === name.toLowerCase())}
                txt={txt}
                onOpenChange={(open) => {
                    if (!open) setFolderForm(null);
                }}
                onSubmit={(name) => {
                    const editingId = folderForm?.id;
                    if (editingId) {
                        updateFolders((prev) => renameFolder(prev, editingId, name));
                    } else {
                        updateFolders((prev) => createFolder(prev, name).folders);
                    }
                    setFolderForm(null);
                }}
            />

            <FolderActionsSheet
                open={menuFolder !== null}
                folder={menuFolder}
                txt={txt}
                onOpenChange={(open) => {
                    if (!open) setMenuFolder(null);
                }}
                onRename={() => {
                    if (!menuFolder) return;
                    setFolderForm({ id: menuFolder.id });
                    setMenuFolder(null);
                }}
                onDelete={() => {
                    if (!menuFolder) return;
                    setConfirmFolder(menuFolder);
                    setMenuFolder(null);
                }}
            />

            <TemplateActionsSheet
                open={menuTpl !== null}
                template={menuTpl}
                folders={folders}
                lang={normLang}
                txt={txt}
                onOpenChange={(open) => {
                    if (!open) setMenuTpl(null);
                }}
                onPreview={() => {
                    setPreviewTpl(menuTpl);
                    setMenuTpl(null);
                }}
                onRename={(title) => {
                    if (!menuTpl) return;
                    updatePersonal((prev) => renameTemplate(prev, menuTpl.id, title));
                    setMenuTpl(null);
                }}
                onDuplicate={() => {
                    if (!menuTpl) return;
                    updatePersonal((prev) => duplicateTemplate(prev, menuTpl.id).templates);
                    setMenuTpl(null);
                }}
                onMove={(folderId) => {
                    if (!menuTpl) return;
                    updatePersonal((prev) => withFolder(prev, menuTpl.id, folderId));
                    setMenuTpl(null);
                }}
                onArchive={(archived) => {
                    if (!menuTpl) return;
                    updatePersonal((prev) => withArchived(prev, menuTpl.id, archived));
                    setMenuTpl(null);
                }}
                onShare={() => {
                    if (menuTpl) handleShare(menuTpl);
                }}
                onDelete={() => {
                    setConfirmTpl(menuTpl);
                    setMenuTpl(null);
                }}
            />

            <TemplatePreviewSheet
                open={previewTpl !== null}
                template={previewTpl}
                lang={normLang}
                txt={txt}
                resolveSlotName={resolveSlotName}
                slotSets={slotSets}
                onOpenChange={(open) => {
                    if (!open) setPreviewTpl(null);
                }}
                onUse={() => {
                    if (!previewTpl) return;
                    const tpl = previewTpl;
                    setPreviewTpl(null);
                    onSelectTemplate(tpl);
                }}
            />

            <ConfirmModal
                isOpen={confirmTpl !== null}
                title={txt.confirmDeleteTitle}
                description={confirmTpl ? txt.confirmDeleteBody.replace('{name}', titleOf(confirmTpl)) : ''}
                confirmText={txt.del}
                cancelText={txt.cancel}
                variant="danger"
                onCancel={() => setConfirmTpl(null)}
                onConfirm={() => {
                    if (!confirmTpl) return;
                    const id = confirmTpl.id;
                    updatePersonal((prev) => deleteTemplate(prev, id));
                    setConfirmTpl(null);
                }}
            />

            <ConfirmModal
                isOpen={confirmFolder !== null}
                title={txt.deleteFolder}
                description={confirmFolder ? txt.confirmDeleteFolderBody.replace('{name}', confirmFolder.name) : ''}
                confirmText={txt.del}
                cancelText={txt.cancel}
                variant="danger"
                onCancel={() => setConfirmFolder(null)}
                onConfirm={() => {
                    if (!confirmFolder) return;
                    const id = confirmFolder.id;
                    updatePersonal((prev) => prev.map((p) => {
                        if (getFolderId(p) !== id) return p;
                        const next: OrganizedTemplate = { ...p, folderId: null };
                        return next;
                    }));
                    updateFolders((prev) => deleteFolder(prev, id));
                    setConfirmFolder(null);
                }}
            />
        </section>
    );
};
