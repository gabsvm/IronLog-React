import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { WorkoutFinishSheet } from '../../views/workout/WorkoutFinishSheet';
import { TRANSLATIONS } from '../../constants';
import { calculateVolumeAdjustment } from '../../utils';
import * as AppContext from '../../context/AppContext';
import { useStore } from '../../lib/store';

// Task 3 (RP restructure 3.2): al terminar, el feedback por musculo
// (pump/soreness/workload, FeedbackModal con el mismo payload de hoy)
// es el paso final antes del resumen de sesion.

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');
const t = TRANSLATIONS.es;

describe('Task 3: finish flow chain (source order)', () => {
    it('finish sheet announces feedback as the final step and confirms through handleConfirmFinish', () => {
        const sheet = read('views/workout/WorkoutFinishSheet.tsx');
        expect(sheet).toContain('finish-feedback-step');
        expect(sheet).toContain('handleConfirmFinish');
        expect(sheet.indexOf('finish-feedback-step')).toBeLessThan(sheet.indexOf('finish-confirm-btn'));
    });

    it('confirm opens feedback, feedback saves via handleSaveFeedback, and only then onFinish reaches summary', () => {
        const ctrl = read('hooks/useWorkoutController.ts');
        expect(ctrl).toContain('setShowFeedbackModal(true)');
        expect(ctrl).toContain('setRpFeedback');
        // handleSaveFeedback closes the modal before invoking the finish callback.
        const save = ctrl.slice(ctrl.indexOf('const handleSaveFeedback'));
        expect(save.indexOf('setShowFeedbackModal(false)')).toBeLessThan(save.indexOf('onFinishCallback()'));

        const impl = read('views/WorkoutViewImpl.tsx');
        expect(impl).toContain('onConfirm={handleSaveFeedback}');
        expect(impl).toContain('muscles={sessionExercises.map');

        const appViews = read('components/app/AppViews.tsx');
        expect(appViews).toContain("setView('summary'");
    });
});

describe('Task 3: FeedbackModal payload (unchanged)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useStore.setState({ activeMeso: null } as any);
        vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({ lang: 'es' } as any);
    });

    it('renders one worked muscle and saves soreness/performance/adjustment exactly as today', () => {
        const onConfirm = vi.fn();
        render(React.createElement(FeedbackModal, { muscles: ['CHEST'], onConfirm, onCancel: vi.fn() } as any));

        expect(screen.getByTestId('feedback-modal')).toBeTruthy();
        expect(screen.getByTestId('feedback-muscle')).toBeTruthy();

        fireEvent.click(screen.getByText(String(t.fb.soreness[2])));
        fireEvent.click(screen.getByText(String(t.fb.performance[2])));
        fireEvent.click(screen.getByText(t.copy.feedbackModal.saveFinish));

        expect(onConfirm).toHaveBeenCalledWith({
            CHEST: { soreness: 2, performance: 2, adjustment: calculateVolumeAdjustment(2, 2) },
        });
    });

    it('skip finishes with the same empty payload as today', () => {
        const onConfirm = vi.fn();
        render(React.createElement(FeedbackModal, { muscles: ['CHEST'], onConfirm, onCancel: vi.fn() } as any));

        fireEvent.click(screen.getByText(t.copy.feedbackModal.skipFinish));
        expect(onConfirm).toHaveBeenCalledWith({});
    });
});

describe('Task 3: WorkoutFinishSheet render', () => {
    it('shows the feedback step before the confirm action', () => {
        const state = {
            showFinishModal: true,
            setShowFinishModal: vi.fn(),
            handleConfirmFinish: vi.fn(),
            setShowDiscardConfirm: vi.fn(),
            updateSession: vi.fn(),
            updateTemplate: false,
            setUpdateTemplate: vi.fn(),
            activeSession: { startTime: Date.now() - 60000, note: '' },
            activeMeso: null,
            t,
            completedWorkingSets: 3,
            totalWorkingSets: 4,
        };
        render(React.createElement(WorkoutFinishSheet, { state } as any));

        const step = screen.getByTestId('finish-feedback-step');
        const confirm = screen.getByTestId('finish-confirm-btn');
        expect(step.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        fireEvent.click(confirm);
        expect(state.handleConfirmFinish).toHaveBeenCalledTimes(1);
    });
});
