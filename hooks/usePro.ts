
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePro = () => {
    const { subscription } = useAuth();
    const [showPaywall, setShowPaywall] = useState(false);
    const [featureAttempted, setFeatureAttempted] = useState<string>('');

    const checkPro = (featureName: string = "Pro Feature") => {
        if (subscription.isPro) return true;
        
        setFeatureAttempted(featureName);
        setShowPaywall(true);
        return false;
    };

    return {
        isPro: subscription.isPro,
        tier: subscription.tier,
        checkPro,
        showPaywall,
        setShowPaywall,
        featureAttempted
    };
};
