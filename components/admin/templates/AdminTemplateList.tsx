// U5: template list view, moved verbatim from components/admin/AdminTemplateManager.tsx.
import React, { Suspense } from 'react';
import { Icon } from '../../ui/Icon';
import type { AdminTemplateState } from './useAdminTemplateState';
import { AdminToast } from './AdminToast';

const ConfirmModal = React.lazy(() => import('../../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

export const AdminTemplateList: React.FC<{ state: AdminTemplateState }> = ({ state }) => {
    const { onClose, globalTemplates, firestoreIds, deleteTarget, setDeleteTarget, resetTarget, setResetTarget, statusOf, handleCreate, handleEdit, confirmDelete, confirmReset, StatusBadge, status } = state;
    return (
            <div className="fixed inset-0 z-confirm bg-black text-white flex flex-col font-sans">
                <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/95 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                            <Icon name="Crown" size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight">Template Manager</h2>
                            <p className="text-xs text-muted font-medium">{globalTemplates.length} plans · {firestoreIds.size} persisted</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="Close">
                        <Icon name="X" size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 scroll-container">
                    <button
                        onClick={handleCreate}
                        className="w-full py-3.5 bg-primary-500 text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-transform hover:bg-primary-400"
                    >
                        <Icon name="Plus" size={18} strokeWidth={2.5} /> Create New Template
                    </button>

                    {globalTemplates.map(tpl => {
                        const status = statusOf(tpl);
                        return (
                            <div key={tpl.id} className="glass-card rounded-2xl p-4">
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <StatusBadge status={status} />
                                            {tpl.isPro && <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black px-2 py-0.5 rounded uppercase tracking-widest">PRO</span>}
                                        </div>
                                        <div className="font-bold text-sm text-white truncate">{tpl.title.en}</div>
                                        <div className="text-xs text-muted font-mono mt-0.5">{tpl.id} · {tpl.program.length} days</div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            onClick={() => handleEdit(tpl)}
                                            className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 flex items-center justify-center transition-colors"
                                            aria-label={`Edit ${tpl.title.en}`}
                                            title="Edit"
                                        >
                                            <Icon name="Edit" size={15} />
                                        </button>
                                        {status === 'modified' && (
                                            <button
                                                onClick={() => setResetTarget(tpl)}
                                                className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                                                aria-label={`Reset ${tpl.title.en} to default`}
                                                title="Reset to default"
                                            >
                                                <Icon name="RotateCcw" size={15} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDeleteTarget(tpl)}
                                            className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                            aria-label={`Delete ${tpl.title.en}`}
                                            title={status === 'default' ? 'No-op (hardcoded)' : 'Delete'}
                                            disabled={status === 'default'}
                                        >
                                            <Icon name="Trash2" size={15} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{tpl.description.en}</p>
                            </div>
                        );
                    })}
                </div>

                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={!!deleteTarget}
                        title="Delete template"
                        description={deleteTarget ? `Permanently delete "${deleteTarget.title.en}"? This affects ALL users.` : ''}
                        confirmText="Delete"
                        cancelText="Cancel"
                        variant="danger"
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteTarget(null)}
                    />
                    <ConfirmModal
                        isOpen={!!resetTarget}
                        title="Reset to default"
                        description={resetTarget ? `Discard all modifications to "${resetTarget.title.en}" and revert to the built-in version?` : ''}
                        confirmText="Reset"
                        cancelText="Cancel"
                        onConfirm={confirmReset}
                        onCancel={() => setResetTarget(null)}
                    />
                </Suspense>
                <AdminToast state={state} />
            </div>
    );
};
