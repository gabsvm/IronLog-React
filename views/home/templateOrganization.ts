import type { GlobalTemplate, TemplateFolder } from '../../types';

/**
 * Template folders (Strong parity): ALL pure organization logic so the UI
 * stays thin. Canonical shapes (`TemplateFolder`, `folderId`/`archivedAt`)
 * live in the shared contract (types.ts). No React, no storage, no side
 * effects — fully unit-testable.
 */

export type { TemplateFolder };

/** Personal template carrying organization fields from the shared contract. */
export type OrganizedTemplate = GlobalTemplate;

export const UNFILED = '__unfiled__';
export const ALL = '__all__';
export const ARCHIVED = '__archived__';

export const MAX_FOLDER_NAME = 60;

export const makeFolderId = (): string =>
    `folder_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const normalizeFolderName = (raw: string): string =>
    raw.trim().replace(/\s+/g, ' ').slice(0, MAX_FOLDER_NAME);

export const isOrganizedPersonal = (tpl: GlobalTemplate): tpl is OrganizedTemplate =>
    tpl.scope === 'personal';

export const getFolderId = (tpl: GlobalTemplate): string | null => {
    const v = tpl.folderId;
    return typeof v === 'string' && v.length > 0 ? v : null;
};

export const isArchived = (tpl: GlobalTemplate): boolean =>
    typeof tpl.archivedAt === 'number' && tpl.archivedAt > 0;

export const sortFolders = (folders: TemplateFolder[]): TemplateFolder[] =>
    [...folders].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

/** Personal templates sorted by canonical `order` (stable for equal orders). */
export const sortTemplates = <T extends GlobalTemplate>(templates: T[]): T[] =>
    [...templates].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const createFolder = (folders: TemplateFolder[], name: string): { folders: TemplateFolder[]; folder: TemplateFolder | null } => {
    const clean = normalizeFolderName(name);
    if (!clean) return { folders, folder: null };
    const dupe = folders.some((f) => f.name.toLowerCase() === clean.toLowerCase());
    if (dupe) return { folders, folder: null };
    const now = Date.now();
    const maxOrder = folders.reduce((m, f) => Math.max(m, f.order ?? 0), -1);
    const folder: TemplateFolder = { id: makeFolderId(), name: clean, order: maxOrder + 1, createdAt: now, updatedAt: now };
    return { folders: [...folders, folder], folder };
};

export const renameFolder = (folders: TemplateFolder[], id: string, name: string): TemplateFolder[] => {
    const clean = normalizeFolderName(name);
    if (!clean) return folders;
    const dupe = folders.some((f) => f.id !== id && f.name.toLowerCase() === clean.toLowerCase());
    if (dupe) return folders;
    return folders.map((f) => (f.id === id ? { ...f, name: clean, updatedAt: Date.now() } : f));
};

export const deleteFolder = (folders: TemplateFolder[], id: string): TemplateFolder[] =>
    folders.filter((f) => f.id !== id);

/** Move a folder up/down in folder order; returns reordered list (orders renormalized). */
export const moveFolder = (folders: TemplateFolder[], id: string, dir: -1 | 1): TemplateFolder[] => {
    const sorted = sortFolders(folders);
    const idx = sorted.findIndex((f) => f.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= sorted.length) return folders;
    const [item] = sorted.splice(idx, 1);
    sorted.splice(next, 0, item);
    return sorted.map((f, order) => ({ ...f, order }));
};

/* ── Template operations (return new personal-template arrays) ─────────── */

export const withFolder = (templates: GlobalTemplate[], id: string, folderId: string | null): GlobalTemplate[] =>
    templates.map((t) => {
        if (t.id !== id) return t;
        const next: OrganizedTemplate = { ...t, folderId };
        return next;
    });

export const withArchived = (templates: GlobalTemplate[], id: string, archived: boolean): GlobalTemplate[] =>
    templates.map((t) => {
        if (t.id !== id) return t;
        const next: OrganizedTemplate = { ...t, archivedAt: archived ? Date.now() : null };
        return next;
    });

export const renameTemplate = (templates: GlobalTemplate[], id: string, title: string): GlobalTemplate[] => {
    const clean = title.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!clean) return templates;
    return templates.map((t) =>
        t.id === id ? { ...t, name: t.name || clean, title: { en: clean, es: clean } } : t,
    );
};

export const duplicateTemplate = (templates: GlobalTemplate[], id: string): { templates: GlobalTemplate[]; copy: GlobalTemplate | null } => {
    const src = templates.find((t) => t.id === id);
    if (!src || src.scope !== 'personal') return { templates, copy: null };
    const now = Date.now();
    const base = typeof src.title === 'object'
        ? (src.title.en || src.title.es || src.name || 'Template')
        : String(src.name || 'Template');
    const copyTitle = base.length > 70 ? `${base.slice(0, 70)} (2)` : `${base} (2)`;
    const maxOrder = templates.reduce((m, t) => Math.max(m, t.order ?? 0), -1);
    const raw: unknown = JSON.parse(JSON.stringify(src));
    const baseCopy: GlobalTemplate = raw as GlobalTemplate;
    const copy: OrganizedTemplate = {
        ...baseCopy,
        id: `personal_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: `personal_${now}`,
        title: { en: copyTitle, es: copyTitle },
        order: maxOrder + 1,
    };
    return { templates: [...templates, copy], copy };
};

export const deleteTemplate = (templates: GlobalTemplate[], id: string): GlobalTemplate[] =>
    templates.filter((t) => t.id !== id);

/**
 * Move a template up/down within its visible lane (same folder + same archived
 * state). Renormalizes `order` across ALL personal templates so the canonical
 * field stays the single source of truth for sync/backup.
 */
export const moveTemplate = (templates: GlobalTemplate[], id: string, dir: -1 | 1): GlobalTemplate[] => {
    const target = templates.find((t) => t.id === id);
    if (!target || target.scope !== 'personal') return templates;
    const laneKey = (t: GlobalTemplate) => `${getFolderId(t) ?? UNFILED}|${isArchived(t) ? 1 : 0}`;
    const lane = sortTemplates(templates.filter((t) => t.scope === 'personal' && laneKey(t) === laneKey(target)));
    const idx = lane.findIndex((t) => t.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= lane.length) return templates;
    const ids = lane.map((t) => t.id);
    const swapped = ids[idx];
    ids[idx] = ids[next];
    ids[next] = swapped;
    // Renormalize: lane members take their lane rank; outsiders keep relative order after.
    const outsiders = sortTemplates(templates.filter((t) => !(t.scope === 'personal' && laneKey(t) === laneKey(target))));
    const withOrder = new Map<string, number>();
    ids.forEach((tid, i) => withOrder.set(tid, i));
    outsiders.forEach((t, i) => withOrder.set(t.id, ids.length + i));
    return templates.map((t) => {
        const o = withOrder.get(t.id);
        return o == null || t.order === o ? t : { ...t, order: o };
    });
};

/** Drop folder references pointing at deleted folders (idempotent repair). */
export const pruneFolderRefs = (templates: GlobalTemplate[], folders: TemplateFolder[]): GlobalTemplate[] => {
    const folderIds = new Set(folders.map((f) => f.id));
    let changed = false;
    const pruned = templates.map((t) => {
        const fid = getFolderId(t);
        if (fid != null && !folderIds.has(fid)) {
            changed = true;
            const next: OrganizedTemplate = { ...t, folderId: null };
            return next;
        }
        return t;
    });
    return changed ? pruned : templates;
};

/* ── Share payload (Strong parity: template file another user can preview) ── */

export interface SharedTemplateEnvelope {
    kind: 'gainslab-template';
    version: 1;
    exportedAt: number;
    template: GlobalTemplate;
}

export const buildShareEnvelope = (tpl: GlobalTemplate): SharedTemplateEnvelope => {
    // Reason: deep clone of our own typed value for the share payload.
    const template = JSON.parse(JSON.stringify(tpl)) as GlobalTemplate;
    return { kind: 'gainslab-template', version: 1, exportedAt: Date.now(), template };
};

export const isSharedTemplateEnvelope = (v: unknown): v is SharedTemplateEnvelope => {
    if (!v || typeof v !== 'object') return false;
    if (!('kind' in v) || !('version' in v) || !('template' in v)) return false;
    if (v.kind !== 'gainslab-template' || v.version !== 1) return false;
    const inner: unknown = v.template;
    if (!inner || typeof inner !== 'object') return false;
    if (!('id' in inner) || !('program' in inner)) return false;
    return typeof inner.id === 'string' && Array.isArray(inner.program);
};

export const slugify = (s: string): string =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'template';

export interface ImportedTemplateSeed {
    id: string;
    name: string;
    order: number;
    untitled: string;
}

/**
 * Adopt a shared template as a personal one. The full program is preserved
 * verbatim (no truncation); only identity, ownership and placement are reset.
 * Returns null when the payload is not a usable template.
 */
export const normalizeImportedTemplate = (tpl: GlobalTemplate, seed: ImportedTemplateSeed): GlobalTemplate | null => {
    if (!tpl || typeof tpl !== 'object' || !Array.isArray(tpl.program)) return null;
    // Reason: deep clone of a validated share payload; shape checked above.
    const clone = JSON.parse(JSON.stringify(tpl)) as GlobalTemplate;
    const rawTitle = clone.title;
    const text = rawTitle && typeof rawTitle === 'object'
        ? (typeof rawTitle.en === 'string' && rawTitle.en.trim()
            ? rawTitle.en
            : (typeof rawTitle.es === 'string' ? rawTitle.es : ''))
        : '';
    const clean = text.trim().slice(0, 80) || seed.untitled;
    return {
        ...clone,
        id: seed.id,
        name: seed.name,
        title: { en: clean, es: clean },
        program: Array.isArray(clone.program) ? clone.program : [],
        order: seed.order,
        scope: 'personal',
        folderId: null,
        archivedAt: null,
    };
};
