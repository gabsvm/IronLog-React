// U5: toast (was an inner component re-created every render), moved verbatim from components/admin/AdminTemplateManager.tsx.
import React from 'react';
import type { AdminTemplateState } from './useAdminTemplateState';

export const AdminToast: React.FC<{ state: AdminTemplateState }> = ({ state }) => {
    const { toast } = state;
    return (
        toast ? (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
            toast.tone === 'ok' ? 'bg-primary-500/10 border-primary-500/30 text-primary-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
            {toast.msg}
        </div>
    ) : null
    );
};
