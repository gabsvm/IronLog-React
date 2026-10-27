import { describe, it, expect } from 'vitest';
import type { GlobalTemplate } from '../../types';
import {
    buildShareEnvelope,
    createFolder,
    deleteFolder,
    deleteTemplate,
    duplicateTemplate,
    getFolderId,
    isArchived,
    isSharedTemplateEnvelope,
    moveFolder,
    moveTemplate,
    normalizeImportedTemplate,
    pruneFolderRefs,
    renameFolder,
    renameTemplate,
    slugify,
    withArchived,
    withFolder,
    type TemplateFolder,
} from '../../views/home/templateOrganization';

const tpl = (id: string, order: number, extra: Partial<GlobalTemplate> & Record<string, unknown> = {}): GlobalTemplate => ({
    id,
    name: id,
    title: { en: id, es: id },
    description: { en: '', es: '' },
    isPro: false,
    program: [],
    order,
    scope: 'personal',
    ...extra,
});

const folder = (id: string, order: number, name = id): TemplateFolder => ({
    id,
    name,
    order,
    createdAt: 1,
    updatedAt: 1,
});

describe('template folders (pure organization)', () => {
    it('creates folders trimmed, rejects empty and duplicates', () => {
        const { folders, folder: f } = createFolder([], '  Pierna  ');
        expect(f?.name).toBe('Pierna');
        expect(createFolder(folders, '  ').folder).toBeNull();
        expect(createFolder(folders, 'pIeRnA').folder).toBeNull();
        expect(folders).toHaveLength(1);
    });

    it('renames and deletes folders', () => {
        const base = [folder('a', 0, 'A'), folder('b', 1, 'B')];
        expect(renameFolder(base, 'a', 'Legs')[0].name).toBe('Legs');
        expect(renameFolder(base, 'a', 'b')).toEqual(base);
        expect(renameFolder(base, 'a', '  ')).toEqual(base);
        expect(deleteFolder(base, 'a').map((f) => f.id)).toEqual(['b']);
    });

    it('moves folders and renormalizes order', () => {
        const base = [folder('a', 0), folder('b', 1), folder('c', 2)];
        const next = moveFolder(base, 'c', -1);
        expect(next.map((f) => f.id)).toEqual(['a', 'c', 'b']);
        expect(next.map((f) => f.order)).toEqual([0, 1, 2]);
        expect(moveFolder(base, 'a', -1)).toEqual(base);
    });

    it('assigns folders and archives templates', () => {
        const list = [tpl('t1', 0), tpl('t2', 1)];
        const moved = withFolder(list, 't1', 'f1');
        expect(getFolderId(moved[0])).toBe('f1');
        expect(getFolderId(moved[1])).toBeNull();
        const archived = withArchived(moved, 't1', true);
        expect(isArchived(archived[0])).toBe(true);
        expect(isArchived(archived[1])).toBe(false);
        expect(isArchived(withArchived(archived, 't1', false)[0])).toBe(false);
    });

    it('renames, duplicates and deletes templates', () => {
        const list = [tpl('t1', 0), tpl('t2', 1)];
        const renamed = renameTemplate(list, 't1', '  Nueva  ');
        expect(renamed[0].title.en).toBe('Nueva');
        expect(renameTemplate(list, 't1', '   ')).toEqual(list);
        const { templates: duped, copy } = duplicateTemplate(list, 't1');
        expect(copy).not.toBeNull();
        expect(copy?.id).not.toBe('t1');
        expect(copy?.scope).toBe('personal');
        expect(duped).toHaveLength(3);
        expect(deleteTemplate(duped, 't1').map((t) => t.id)).not.toContain('t1');
    });

    it('moves templates within their lane and renormalizes order', () => {
        const list = [
            tpl('a', 0, { folderId: 'f1' }),
            tpl('b', 1, { folderId: 'f1' }),
            tpl('c', 2, { folderId: 'f2' }),
        ];
        const next = moveTemplate(list, 'b', -1);
        const order = Object.fromEntries(next.map((t) => [t.id, t.order]));
        expect(order.b).toBe(0);
        expect(order.a).toBe(1);
        // Other lanes keep relative order after the lane.
        expect(order.c).toBe(2);
        // Archived templates form their own lane.
        const withArch = withArchived(list, 'a', true);
        expect(moveTemplate(withArch, 'a', 1)).toEqual(withArch);
    });

    it('prunes refs to deleted folders only', () => {
        const list = [
            tpl('a', 0, { folderId: 'gone' }),
            tpl('b', 1, { folderId: 'kept' }),
        ];
        const pruned = pruneFolderRefs(list, [folder('kept', 0)]);
        expect(getFolderId(pruned[0])).toBeNull();
        expect(getFolderId(pruned[1])).toBe('kept');
        expect(pruneFolderRefs(pruned, [folder('kept', 0)])).toBe(pruned);
    });

    it('builds and validates the share envelope', () => {
        const envelope = buildShareEnvelope(tpl('t1', 0));
        expect(envelope.kind).toBe('gainslab-template');
        expect(isSharedTemplateEnvelope(envelope)).toBe(true);
        expect(isSharedTemplateEnvelope({ kind: 'gainslab-template' })).toBe(false);
        expect(isSharedTemplateEnvelope(null)).toBe(false);
        expect(slugify('Pierna 🔥 / Fuerza')).toBe('pierna-fuerza');
    });
    it('adopts a shared template without truncating its program', () => {
        const src = tpl('orig', 3, { folderId: 'f1' });
        src.program = [
            { id: 'd1', dayName: { en: 'Legs', es: 'Pierna' }, slots: [{ muscle: 'QUADS', exerciseId: 'sq', setTarget: 4 }] },
        ];
        const envelope = buildShareEnvelope(src);
        const imported = normalizeImportedTemplate(envelope.template, {
            id: 'personal_new',
            name: 'personal_new',
            order: 9,
            untitled: 'Imported template',
        });
        expect(imported).not.toBeNull();
        if (imported === null) throw new Error('expected an imported template');
        expect(imported.id).toBe('personal_new');
        expect(imported.scope).toBe('personal');
        expect(imported.order).toBe(9);
        expect(getFolderId(imported)).toBeNull();
        expect(isArchived(imported)).toBe(false);
        expect(imported.program).toEqual(src.program);
        expect(imported.title.en).toBe('orig');
    });

    it('rejects unusable share payloads and coerces missing titles', () => {
        // Reason: feeds deliberately-invalid payloads to the runtime guard.
        const asTemplate = (v: unknown): GlobalTemplate => v as GlobalTemplate;
        expect(normalizeImportedTemplate(asTemplate({}), { id: 'a', name: 'a', order: 0, untitled: 'U' })).toBeNull();
        expect(normalizeImportedTemplate(asTemplate(null), { id: 'a', name: 'a', order: 0, untitled: 'U' })).toBeNull();
        const noTitle = { ...tpl('t', 0), title: { en: '  ', es: '' } };
        const coerced = normalizeImportedTemplate(noTitle, { id: 'b', name: 'b', order: 0, untitled: 'U' });
        expect(coerced?.title).toEqual({ en: 'U', es: 'U' });
    });
});
