// T4: dirty-section tracking as a real hook (was a closure that called
// useEffect, flagged by react-hooks/rules-of-hooks). Same behavior: the first
// run after hydration only arms the section; later changes of the watched
// values mark it dirty (timestamp in sectionSyncMeta + dirtySyncState).
import { useEffect, type DependencyList, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { dirtySyncState } from '../../services/dirtySyncState';
import type { DirtySyncSection, SectionSyncMeta } from '../../types';

export interface DirtyTrackingContext {
    isAppLoading: boolean;
    hasCheckedSync: boolean;
    suppressDirtyRef: MutableRefObject<boolean>;
    dirtyInitRef: MutableRefObject<Set<DirtySyncSection>>;
    setLocalSectionSyncMeta: Dispatch<SetStateAction<SectionSyncMeta>> | ((value: SectionSyncMeta | ((prev: SectionSyncMeta) => SectionSyncMeta)) => void);
}

export const useDirtySection = (section: DirtySyncSection, watched: DependencyList, ctx: DirtyTrackingContext) => {
    const { isAppLoading, hasCheckedSync, suppressDirtyRef, dirtyInitRef, setLocalSectionSyncMeta } = ctx;
    useEffect(() => {
        if (isAppLoading || !hasCheckedSync || suppressDirtyRef.current) return;

        if (!dirtyInitRef.current.has(section)) {
            dirtyInitRef.current.add(section);
            return;
        }

        const now = Date.now();
        setLocalSectionSyncMeta((prev) => ({ ...prev, [section]: now }));
        void dirtySyncState.mark([section]);
        // The caller decides what is watched (the section's data plus
        // isAppLoading/hasCheckedSync); forwarding that list is the point of
        // this hook, so it cannot be a static array literal.
    }, watched); // eslint-disable-line react-hooks/exhaustive-deps
};
