import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import type { GlobalTemplate } from '../../types';
import { getFolderId, isArchived, type TemplateFolder } from './templateOrganization';

/* Contract-compatible strings. Shared `t.templateFolders` entries override
   these key-by-key when present; the local copy keeps both languages working
   standalone without touching shared translation files. */
export interface TemplateFolderText {
    foldersTitle: string; newFolder: string; renameFolder: string; deleteFolder: string;
    folderNamePh: string; create: string; save: string; cancel: string;
    rename: string; duplicate: string; archive: string; unarchive: string;
    share: string; del: string; moveTo: string; noFolder: string; archived: string;
    preview: string; days: string; sets: string; useTemplate: string;
    confirmDeleteTitle: string; confirmDeleteBody: string;
    confirmDeleteFolderBody: string; deleteFolderHint: string;
    emptyFolder: string; unfiled: string; allTemplates: string;
    nameTaken: string; nameEmpty: string; sharedTitle: string;
    moveUp: string; moveDown: string;
    importTpl: string; importError: string; importOk: string; importUntitled: string;
}

const ES: TemplateFolderText = {
    foldersTitle: 'Carpetas', newFolder: 'Nueva carpeta', renameFolder: 'Renombrar carpeta',
    deleteFolder: 'Eliminar carpeta', folderNamePh: 'Nombre de la carpeta', create: 'Crear',
    save: 'Guardar', cancel: 'Cancelar', rename: 'Renombrar', duplicate: 'Duplicar',
    archive: 'Archivar', unarchive: 'Desarchivar', share: 'Compartir', del: 'Eliminar',
    moveTo: 'Mover a', noFolder: 'Sin carpeta', archived: 'Archivadas', preview: 'Vista previa',
    days: 'días', sets: 'series', useTemplate: 'Usar plantilla',
    confirmDeleteTitle: '¿Eliminar plantilla?',
    confirmDeleteBody: 'Se eliminará «{name}» de tus plantillas. Esta acción no se puede deshacer.',
    confirmDeleteFolderBody: 'La carpeta «{name}» se eliminará; sus plantillas pasan a «Sin carpeta».',
    deleteFolderHint: 'Sus plantillas se conservan.',
    emptyFolder: 'Carpeta vacía', unfiled: 'Sin carpeta', allTemplates: 'Todas',
    nameTaken: 'Ya existe ese nombre.', nameEmpty: 'Escribe un nombre.',
    sharedTitle: 'Plantilla GainsLab', moveUp: 'Subir', moveDown: 'Bajar',
    importTpl: 'Importar', importError: 'Archivo no válido: no es una plantilla de GainsLab.',
    importOk: 'Plantilla «{name}» importada.', importUntitled: 'Plantilla importada',
};

const EN: TemplateFolderText = {
    foldersTitle: 'Folders', newFolder: 'New folder', renameFolder: 'Rename folder',
    deleteFolder: 'Delete folder', folderNamePh: 'Folder name', create: 'Create',
    save: 'Save', cancel: 'Cancel', rename: 'Rename', duplicate: 'Duplicate',
    archive: 'Archive', unarchive: 'Unarchive', share: 'Share', del: 'Delete',
    moveTo: 'Move to', noFolder: 'No folder', archived: 'Archived', preview: 'Preview',
    days: 'days', sets: 'sets', useTemplate: 'Use template',
    confirmDeleteTitle: 'Delete template?',
    confirmDeleteBody: '«{name}» will be removed from your templates. This cannot be undone.',
    confirmDeleteFolderBody: 'The folder «{name}» will be removed; its templates move to «No folder».',
    deleteFolderHint: 'Its templates are kept.',
    emptyFolder: 'Empty folder', unfiled: 'No folder', allTemplates: 'All',
    nameTaken: 'That name is already taken.', nameEmpty: 'Enter a name.',
    sharedTitle: 'GainsLab template', moveUp: 'Move up', moveDown: 'Move down',
    importTpl: 'Import', importError: 'Invalid file: not a GainsLab template.',
    importOk: 'Template «{name}» imported.', importUntitled: 'Imported template',
};

export const resolveTFText = (t: unknown, lang: string): TemplateFolderText => {
    const base = pickLang(lang, { es: ES, en: EN });
    if (t && typeof t === 'object' && 'templateFolders' in t) {
        const over = t.templateFolders;
        if (over && typeof over === 'object') {
            // Reason: translation bag is integrator-owned; every key is validated below.
            const bag: Record<string, unknown> = over as Record<string, unknown>;
            const patch: Partial<TemplateFolderText> = {};
            (Object.keys(base) as (keyof TemplateFolderText)[]).forEach((k) => {
                const v: unknown = bag[k];
                if (typeof v === 'string') patch[k] = v;
            });
            return { ...base, ...patch };
        }
    }
    return base;
};

const rowCls =
    'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[rgb(var(--text-primary))] active:bg-white/[0.03]';

/* ── Folder create/rename ─────────────────────────────────────────────── */

export const FolderFormSheet: React.FC<{
    open: boolean;
    initialName: string;
    title: string;
    taken: (name: string) => boolean;
    txt: TemplateFolderText;
    onOpenChange: (open: boolean) => void;
    onSubmit: (name: string) => void;
}> = ({ open, initialName, title, taken, txt, onOpenChange, onSubmit }) => {
    const [value, setValue] = useState(initialName);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (open) {
            setValue(initialName);
            setError(null);
        }
    }, [open, initialName]);
    const submit = () => {
        const clean = value.trim().replace(/\s+/g, ' ');
        if (!clean) {
            setError(txt.nameEmpty);
            return;
        }
        if (clean.toLowerCase() !== initialName.trim().toLowerCase() && taken(clean)) {
            setError(txt.nameTaken);
            return;
        }
        onSubmit(clean);
    };
    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            footer={
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>{txt.cancel}</Button>
                    <Button onClick={submit}>{initialName ? txt.save : txt.create}</Button>
                </div>
            }
        >
            <label className="block text-xs font-semibold text-[rgb(var(--text-secondary))]" htmlFor="tf-folder-name">
                {txt.folderNamePh}
            </label>
            <input
                id="tf-folder-name"
                type="text"
                value={value}
                maxLength={60}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                }}
                placeholder={txt.folderNamePh}
                aria-invalid={error ? true : undefined}
                className="mt-2 min-h-[48px] w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 text-base text-[rgb(var(--text-primary))]"
            />
            {error && <p role="alert" className="mt-2 text-xs font-medium text-red-500">{error}</p>}
        </Sheet>
    );
};

/* ── Personal template actions (rename inline + move picker + ops) ────── */

export const TemplateActionsSheet: React.FC<{
    open: boolean;
    template: GlobalTemplate | null;
    folders: TemplateFolder[];
    lang: 'en' | 'es';
    txt: TemplateFolderText;
    onOpenChange: (open: boolean) => void;
    onPreview: () => void;
    onRename: (title: string) => void;
    onDuplicate: () => void;
    onMove: (folderId: string | null) => void;
    onArchive: (archived: boolean) => void;
    onShare: () => void;
    onDelete: () => void;
}> = ({ open, template, folders, lang, txt, onOpenChange, onPreview, onRename, onDuplicate, onMove, onArchive, onShare, onDelete }) => {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState('');
    useEffect(() => {
        if (open && template) {
            setRenaming(false);
            setName(String(getTranslated(template.title, lang)));
        }
    }, [open, template, lang]);
    if (!template) return null;
    const archived = isArchived(template);
    const current = getFolderId(template);
    const submitRename = () => {
        const clean = name.trim();
        if (clean) onRename(clean);
        setRenaming(false);
    };
    return (
        <Sheet open={open} onOpenChange={onOpenChange} title={String(getTranslated(template.title, lang))}>
            {renaming ? (
                <div className="px-1 py-2">
                    <input
                        type="text"
                        value={name}
                        maxLength={80}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename();
                        }}
                        aria-label={txt.rename}
                        className="min-h-[48px] w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 text-base text-[rgb(var(--text-primary))]"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="secondary" onClick={() => setRenaming(false)}>{txt.cancel}</Button>
                        <Button onClick={submitRename}>{txt.save}</Button>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-[rgb(var(--border-subtle))] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))]">
                    <li>
                        <button type="button" className={rowCls} onClick={onPreview}>
                            <Icon name="Eye" size={18} className="shrink-0 text-muted" />
                            <span className="flex-1">{txt.preview}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className={rowCls} onClick={() => setRenaming(true)}>
                            <Icon name="Pencil" size={18} className="shrink-0 text-muted" />
                            <span className="flex-1">{txt.rename}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className={rowCls} onClick={onDuplicate}>
                            <Icon name="Copy" size={18} className="shrink-0 text-muted" />
                            <span className="flex-1">{txt.duplicate}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className={rowCls} onClick={() => onArchive(!archived)}>
                            <Icon name={archived ? 'ArchiveRestore' : 'Archive'} size={18} className="shrink-0 text-muted" />
                            <span className="flex-1">{archived ? txt.unarchive : txt.archive}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className={rowCls} onClick={onShare}>
                            <Icon name="Share2" size={18} className="shrink-0 text-muted" />
                            <span className="flex-1">{txt.share}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className={`${rowCls} text-red-500`} onClick={onDelete}>
                            <Icon name="Trash2" size={18} className="shrink-0" />
                            <span className="flex-1">{txt.del}</span>
                        </button>
                    </li>
                </ul>
            )}
            {!renaming && (
                <div className="mt-4">
                    <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">{txt.moveTo}</p>
                    <div className="mt-2 grid gap-2">
                        <button
                            type="button"
                            aria-pressed={current === null}
                            onClick={() => onMove(null)}
                            className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-4 text-left text-sm font-medium ${current === null ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'border-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))]'}`}
                        >
                            <Icon name="Layers" size={17} className="shrink-0" />
                            <span className="flex-1">{txt.noFolder}</span>
                            {current === null && <Icon name="Check" size={16} className="shrink-0 text-primary-500" />}
                        </button>
                        {folders.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                aria-pressed={current === f.id}
                                onClick={() => onMove(f.id)}
                                className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-4 text-left text-sm font-medium ${current === f.id ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'border-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))]'}`}
                            >
                                <Icon name="Layers" size={17} className="shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                                {current === f.id && <Icon name="Check" size={16} className="shrink-0 text-primary-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Sheet>
    );
};

/* ── Folder actions ───────────────────────────────────────────────────── */

export const FolderActionsSheet: React.FC<{
    open: boolean;
    folder: TemplateFolder | null;
    txt: TemplateFolderText;
    onOpenChange: (open: boolean) => void;
    onRename: () => void;
    onDelete: () => void;
}> = ({ open, folder, txt, onOpenChange, onRename, onDelete }) => {
    if (!folder) return null;
    return (
        <Sheet open={open} onOpenChange={onOpenChange} title={folder.name} description={txt.deleteFolderHint}>
            <ul className="divide-y divide-[rgb(var(--border-subtle))] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))]">
                <li>
                    <button type="button" className={rowCls} onClick={onRename}>
                        <Icon name="Pencil" size={18} className="shrink-0 text-muted" />
                        <span className="flex-1">{txt.renameFolder}</span>
                    </button>
                </li>
                <li>
                    <button type="button" className={`${rowCls} text-red-500`} onClick={onDelete}>
                        <Icon name="Trash2" size={18} className="shrink-0" />
                        <span className="flex-1">{txt.deleteFolder}</span>
                    </button>
                </li>
            </ul>
        </Sheet>
    );
};

/* ── Template preview (Strong parity: days + exercises before applying) ── */

export const TemplatePreviewSheet: React.FC<{
    open: boolean;
    template: GlobalTemplate | null;
    lang: 'en' | 'es';
    txt: TemplateFolderText;
    resolveSlotName: (slot: { exerciseId?: string; muscle?: string }) => string;
    slotSets: (slot: { setTarget?: number }) => number;
    onOpenChange: (open: boolean) => void;
    onUse: () => void;
}> = ({ open, template, lang, txt, resolveSlotName, slotSets, onOpenChange, onUse }) => {
    if (!template) return null;
    const program = Array.isArray(template.program) ? template.program : [];
    const totalSets = program.reduce(
        (sum, day) => sum + (day.slots || []).reduce((s: number, slot) => s + slotSets(slot), 0),
        0,
    );
    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={String(getTranslated(template.title, lang))}
            description={String(getTranslated(template.description, lang))}
            footer={<Button fullWidth onClick={onUse}>{txt.useTemplate}</Button>}
        >
            <div className="mb-3 flex gap-2">
                <span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                    {program.length} {txt.days}
                </span>
                <span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                    {totalSets} {txt.sets}
                </span>
            </div>
            <ul className="space-y-2">
                {program.map((day, idx) => (
                    <li key={day.id ?? idx} className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3">
                        <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                            {idx + 1}. {String(getTranslated(day.dayName, lang))}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                            {(day.slots || []).map(resolveSlotName).filter(Boolean).join(' · ') || '—'}
                        </p>
                    </li>
                ))}
            </ul>
        </Sheet>
    );
};
