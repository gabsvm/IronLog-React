
import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isProUser, getEntitlementTier } from '../services/entitlementService';

export const usePro = () => {
    const { subscription } = useAuth();
    const [showPaywall, setShowPaywall] = useState(false);
    const [featureAttempted, setFeatureAttempted] = useState<string>('');

    const isCurrentlyPro = useMemo(() => {
        return isProUser(subscription);
    }, [subscription]);

    const currentTier = useMemo(() => {
        return getEntitlementTier(subscription);
    }, [subscription]);

    const checkPro = (featureName: string = "Pro Feature") => {
        if (isCurrentlyPro) return true;
        
        setFeatureAttempted(featureName);
        setShowPaywall(true);
        return false;
    };

    return {
        isPro: isCurrentlyPro,
        tier: currentTier,
        expiryDate: subscription.expiryDate, // Expose expiry date
        checkPro,
        showPaywall,
        setShowPaywall,
        featureAttempted
    };
};
