// U5: state in templates/useAdminTemplateState; views in templates/.
import React from 'react';
import { useAdminTemplateState } from './templates/useAdminTemplateState';
import { AdminTemplateList } from './templates/AdminTemplateList';
import { AdminTemplateEditor } from './templates/AdminTemplateEditor';

export const AdminTemplateManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const state = useAdminTemplateState({ onClose });
    if (state.view === 'list') return <AdminTemplateList state={state} />;
    return <AdminTemplateEditor state={state} />;
};
