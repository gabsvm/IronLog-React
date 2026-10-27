/**
 * Measure view (Strong parity): full measurements screen.
 * Mounted by the integrator at the `measure` route (AppViews + navigation).
 * Route-independent: renders from context, never a blank panel.
 */
import React from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18n';
import { Icon } from '../components/ui/Icon';
import { MeasurementsSection } from '../components/measurements/MeasurementsSection';

interface MeasureViewProps {
    onBack: () => void;
}

export const MeasureView: React.FC<MeasureViewProps> = ({ onBack }) => {
    const { lang } = useApp();

    return (
        <div className="space-y-4 px-4 pb-8">
            <button
                type="button"
                onClick={onBack}
                className="gl-textbtn mt-1 flex items-center gap-1.5 px-2"
            >
                <Icon name="ArrowLeft" size={16} />
                {pickLang(lang, { es: 'Atrás', en: 'Back' })}
            </button>
            <MeasurementsSection />
        </div>
    );
};
