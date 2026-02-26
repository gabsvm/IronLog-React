
import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePro = () => {
    const { subscription } = useAuth();
    const [showPaywall, setShowPaywall] = useState(false);
    const [featureAttempted, setFeatureAttempted] = useState<string>('');

    const isCurrentlyPro = useMemo(() => {
        if (!subscription.isPro) return false;
        // If expiryDate is null, it's a lifetime subscription.
        if (subscription.expiryDate === null) return true;
        // Otherwise, check if the expiry date is in the future.
        return new Date(subscription.expiryDate) > new Date();
    }, [subscription]);

    const checkPro = (featureName: string = "Pro Feature") => {
        if (isCurrentlyPro) return true;
        
        setFeatureAttempted(featureName);
        setShowPaywall(true);
        return false;
    };

    return {
        isPro: isCurrentlyPro,
        tier: subscription.tier,
        expiryDate: subscription.expiryDate, // Expose expiry date
        checkPro,
        showPaywall,
        setShowPaywall,
        featureAttempted
    };
};
