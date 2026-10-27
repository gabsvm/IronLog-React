import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { pruneFolderRefs, sortFolders } from './templateOrganization';

/**
 * Folders from the shared AppContext (`templateFolders/setTemplateFolders`,
 * persisted + synced + backed up by the integration owner). Sorted for display.
 */
export const useTemplateFolders = () => {
    const { templateFolders, setTemplateFolders } = useApp();
    const folders = useMemo(
        () => sortFolders(Array.isArray(templateFolders) ? templateFolders : []),
        [templateFolders],
    );
    return { folders, setFolders: setTemplateFolders, pruneRefs: pruneFolderRefs };
};
