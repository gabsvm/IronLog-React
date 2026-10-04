import React from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';

interface DangerSectionProps {
    onReset: () => void;
}

/** Q18: "Zona peligrosa" section, moved verbatim from ProfileSheet. */
export const DangerSection: React.FC<DangerSectionProps> = ({ onReset }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    return (
        <div id="profile-section-danger">
            <div className="label-reference px-1 mb-1.5 !text-red-400">{t.dangerZone}</div>
            <button
                type="button"
                onClick={onReset}
                className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                aria-label={t.factoryReset}
            >
                <Icon name="Trash2" size={16} /> {t.factoryReset}
            </button>
        </div>
    );
};
