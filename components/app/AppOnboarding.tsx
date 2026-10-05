import React, { Suspense, useState, type MutableRefObject } from 'react';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { LoadingSpinner } from './AppLoading';
import { TRANSLATIONS } from '../../constants/translations';

const SetupWizard = React.lazy(() => import('../onboarding/SetupWizard').then(m => ({ default: m.SetupWizard })));
const Landing = React.lazy(() => import('../onboarding/Landing').then(m => ({ default: m.Landing })));

interface AppOnboardingProps {
    targetViewRef: MutableRefObject<string>;
    setViewState: (view: any) => void;
    setShowAuthModal: (show: boolean) => void;
}

/** Q18: setup-wizard/landing flow, moved verbatim from App. */
export const AppOnboarding: React.FC<AppOnboardingProps> = ({ targetViewRef, setViewState, setShowAuthModal }) => {
    const { lang, hasSeenOnboarding, setHasSeenOnboarding } = useApp();
    const setActiveSession = useStore(state => state.setActiveSession);
    const [showLanding, setShowLanding] = useState(!hasSeenOnboarding);

    if (hasSeenOnboarding) return null;

    return (
        <Suspense fallback={<LoadingSpinner />}>
            {showLanding ? (
                <Landing
                    onStart={() => setShowLanding(false)}
                    onLogin={() => setShowAuthModal(true)}
                />
            ) : (
                <SetupWizard
                    onComplete={(outcome) => {
                        setHasSeenOnboarding(true);
                        if (outcome.mode === 'custom') {
                            targetViewRef.current = 'program'; setViewState('program');
                        } else if (outcome.mode === 'freestyle') {
                            const freeSession = {
                                id: Date.now(),
                                dayIdx: -1,
                                name: TRANSLATIONS[lang].copy.appOnboarding.freestyleSession,
                                startTime: Date.now(),
                                mesoId: -1,
                                week: -1,
                                exercises: [],
                            };
                            setActiveSession(freeSession);
                            targetViewRef.current = 'workout'; setViewState('workout');
                        } else {
                            targetViewRef.current = 'home'; setViewState('home');
                        }
                    }}
                />
            )}
        </Suspense>
    );
};
