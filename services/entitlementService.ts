import { SubscriptionTier, UserSubscription } from '../types';

export const DEFAULT_FREE_SUBSCRIPTION: UserSubscription = {
  isPro: false,
  tier: 'free',
  expiryDate: null,
};

export const createDefaultFreeSubscription = (): UserSubscription => ({
  ...DEFAULT_FREE_SUBSCRIPTION,
});

export const createLocalDemoSubscription = (days = 7, now = Date.now()): UserSubscription => ({
  isPro: true,
  tier: 'demo',
  expiryDate: now + days * 86400000,
});

export const parseExpiryTimestamp = (expiryDate: number | string | null | undefined): number | null => {
  if (expiryDate === null || expiryDate === undefined) return null;
  if (typeof expiryDate === 'number') {
    return Number.isFinite(expiryDate) ? expiryDate : null;
  }
  const parsed = new Date(expiryDate).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

export const isProUser = (subscription?: UserSubscription | null, now = Date.now()): boolean => {
  if (!subscription) return false;
  if (!subscription.isPro) return false;
  if (subscription.tier === 'free') return false;

  const expiry = parseExpiryTimestamp(subscription.expiryDate);
  // Lifetime subscriptions have no expiry date (null)
  if (expiry === null) {
    return true;
  }

  return expiry > now;
};

export const isDemoUser = (subscription?: UserSubscription | null, now = Date.now()): boolean => {
  if (!subscription) return false;
  if (subscription.tier !== 'demo') return false;
  return isProUser(subscription, now);
};

export const getEntitlementTier = (subscription?: UserSubscription | null, now = Date.now()): SubscriptionTier => {
  if (!isProUser(subscription, now)) return 'free';
  return subscription?.tier || 'free';
};
