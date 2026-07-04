import { DirtySyncSection } from '../types';
import { db } from '../utils/db';

const DIRTY_SYNC_KEY = 'il_dirty_sync_sections_v1';
const DIRTY_SYNC_EVENT = 'ironlog:dirty-sync-changed';

const unique = (sections: DirtySyncSection[]) => Array.from(new Set(sections));

const writeSections = async (sections: DirtySyncSection[]) => {
    const next = unique(sections);
    await db.set(DIRTY_SYNC_KEY, next);
    window.dispatchEvent(new CustomEvent(DIRTY_SYNC_EVENT, {
        detail: { sections: next }
    }));
};

export const dirtySyncState = {
    async list(): Promise<DirtySyncSection[]> {
        return db.get<DirtySyncSection[]>(DIRTY_SYNC_KEY, []);
    },

    async mark(sections: DirtySyncSection[]) {
        if (sections.length === 0) return;
        const current = await dirtySyncState.list();
        await writeSections([...current, ...sections]);
    },

    async clear(sections?: DirtySyncSection[]) {
        if (!sections || sections.length === 0) {
            await writeSections([]);
            return;
        }

        const current = await dirtySyncState.list();
        const remove = new Set(sections);
        await writeSections(current.filter(section => !remove.has(section)));
    },

    eventName: DIRTY_SYNC_EVENT,
};
