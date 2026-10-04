import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Sheet } from '../ui/Sheet';
import { AccountSection } from './sections/AccountSection';
import { BodySection } from './sections/BodySection';
import { TrainingSection } from './sections/TrainingSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { DataSection } from './sections/DataSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { DangerSection } from './sections/DangerSection';
import { useSyncStatusText } from './sections/useSyncStatusText';

export type ProfileSection = 'account' | 'body' | 'training' | 'appearance' | 'data' | 'advanced' | 'danger';

interface ProfileSheetProps {
    open: boolean;
    onClose: () => void;
    initialSection?: ProfileSection | null;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogin: () => void;
    isSyncing: boolean;
}

/**
 * Unified "You" sheet: the former profile sheet and the Settings modal
 * merged into a single surface (N6). Sections: Cuenta, Tu cuerpo,
 * Entrenamiento, Apariencia, Datos, Avanzado (collapsible), Zona peligrosa.
 * Every label comes from TRANSLATIONS (t.* shared, ty.* = you.* local).
 *
 * Q18: orchestrator only — each section lives in sections/ with its own
 * state and dialogs; behavior is unchanged.
 */
export const ProfileSheet: React.FC<ProfileSheetProps> = ({
    open, onClose, initialSection, onOpenProgram, onOpenExercises,
    onReset, onExport, onForceSync, onImportFile, onLogin, isSyncing,
}) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const ty = t.you;
    const syncStatusText = useSyncStatusText();

    // External entry points can request a section (e.g. back from the
    // exercises library lands on training); scroll there once per opening.
    useEffect(() => {
        if (!open || !initialSection) return;
        const timer = window.setTimeout(() => {
            document.getElementById(`profile-section-${initialSection}`)?.scrollIntoView?.({ block: 'start' });
        }, 350);
        return () => window.clearTimeout(timer);
    }, [open, initialSection]);

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => { if (!next) onClose(); }}
            variant="full"
            title={ty.title}
            accent="primary"
        >
            <div className="mx-auto w-full max-w-md px-4 pb-24 pt-2 space-y-4">
                {/* 1. Cuenta */}
                <AccountSection onClose={onClose} onLogin={onLogin} />

                {/* 2. Tu cuerpo */}
                <BodySection />

                {/* 3. Entrenamiento */}
                <TrainingSection onClose={onClose} onOpenProgram={onOpenProgram} onOpenExercises={onOpenExercises} />

                {/* 4. Apariencia */}
                <AppearanceSection />

                {/* 5. Datos */}
                <DataSection
                    onExport={onExport}
                    onImportFile={onImportFile}
                    onForceSync={onForceSync}
                    isSyncing={isSyncing}
                    syncStatusText={syncStatusText}
                />

                {/* 6. Avanzado (plegable) */}
                <AdvancedSection syncStatusText={syncStatusText} />

                {/* 7. Zona peligrosa */}
                <DangerSection onReset={onReset} />
            </div>
        </Sheet>
    );
};
