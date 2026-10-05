import React, { useState } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { getFirebaseFirestoreServices } from '../../lib/firebaseLoader';
import { ERROR_REPORTS_COLLECTION } from '../../utils/errorReporting';
import { Icon } from '../ui/Icon';

interface ReportRow {
    id: string;
    createdAt: number;
    message: string;
    source: string;
    view: string;
    appVersion: string;
    platform: string;
}

/**
 * U7: admin-only list of the latest anonymous error reports (rules allow
 * reads only for the admin). Loaded on demand, newest first.
 */
export const AdminErrorReports: React.FC = () => {
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang].you;
    const [rows, setRows] = useState<ReportRow[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    const load = async () => {
        setLoading(true);
        setFailed(false);
        try {
            const { db, firestoreApi } = await getFirebaseFirestoreServices();
            if (!db) throw new Error('no db');
            const q = firestoreApi.query(
                firestoreApi.collection(db, ERROR_REPORTS_COLLECTION),
                firestoreApi.orderBy('createdAt', 'desc'),
                firestoreApi.limit(30),
            );
            const snap = await firestoreApi.getDocs(q);
            setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportRow, 'id'>) })));
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.errorReportsAdminTitle}</span>
                <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300 disabled:opacity-50"
                >
                    <Icon name="RefreshCw" size={12} className={loading ? 'animate-spin' : ''} /> {t.errorReportsAdminLoad}
                </button>
            </div>
            {failed && <p role="alert" className="text-[11px] text-red-400">{TRANSLATIONS[lang].syncError}</p>}
            {rows && rows.length === 0 && <p className="text-[11px] text-zinc-500">{t.errorReportsAdminEmpty}</p>}
            {rows && rows.length > 0 && (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                    {rows.map((r) => (
                        <li key={r.id} className="rounded-lg bg-black/30 p-2 text-[11px]">
                            <div className="flex justify-between gap-2 text-zinc-500">
                                <span>{new Date(r.createdAt).toLocaleString()}</span>
                                <span>{r.platform} · {r.appVersion} · {r.view}</span>
                            </div>
                            <p className="mt-1 break-words font-mono text-zinc-200">{r.source}: {r.message}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
