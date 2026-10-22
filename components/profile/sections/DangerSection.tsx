import React from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';

interface DangerSectionProps {
    onClose?: () => void;
    onReset: () => void;
}

/** Q18: "Zona peligrosa" section, moved verbatim from ProfileSheet. */
export const DangerSection: React.FC<DangerSectionProps> = ({ onClose, onReset }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    return (
        <div id="profile-section-danger">
            <div className="label-reference px-1 mb-1.5 !text-red-700 dark:!text-red-400">{t.dangerZone}</div>
            <button
                type="button"
                onClick={() => {
                    onClose?.();
                    onReset();
                }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-xs font-semibold text-red-700 dark:text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                aria-label={t.factoryReset}
            >
                <Icon name="Trash2" size={16} /> {t.factoryReset}
            </button>
        </div>
    );
};
