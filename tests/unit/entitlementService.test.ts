import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FREE_SUBSCRIPTION,
  createDefaultFreeSubscription,
  createLocalDemoSubscription,
  isProUser,
  isDemoUser,
  getEntitlementTier,
  canGrantDemo,
  resolveAuthoritativeSubscription,
} from '../../services/entitlementService';
import { UserSubscription } from '../../types';

describe('entitlementService', () => {
  const FIXED_NOW = 1700000000000; // Deterministic timestamp

  it('correctly evaluates default free subscription', () => {
    const freeSub = createDefaultFreeSubscription();
    expect(freeSub.isPro).toBe(false);
    expect(freeSub.tier).toBe('free');
    expect(isProUser(freeSub, FIXED_NOW)).toBe(false);
    expect(isDemoUser(freeSub, FIXED_NOW)).toBe(false);
    expect(getEntitlementTier(freeSub, FIXED_NOW)).toBe('free');
  });

  it('correctly evaluates null or undefined subscription', () => {
    expect(isProUser(null, FIXED_NOW)).toBe(false);
    expect(isProUser(undefined, FIXED_NOW)).toBe(false);
    expect(isDemoUser(null, FIXED_NOW)).toBe(false);
    expect(getEntitlementTier(null, FIXED_NOW)).toBe('free');
  });

  it('identifies lifetime subscription without expiry as active pro', () => {
    const lifetimeSub: UserSubscription = {
      isPro: true,
      tier: 'lifetime',
      expiryDate: null,
    };
    expect(isProUser(lifetimeSub, FIXED_NOW)).toBe(true);
    expect(isDemoUser(lifetimeSub, FIXED_NOW)).toBe(false);
    expect(getEntitlementTier(lifetimeSub, FIXED_NOW)).toBe('lifetime');
  });

  it('identifies unexpired active subscription as pro', () => {
    const activeSub: UserSubscription = {
      isPro: true,
      tier: 'monthly',
      expiryDate: FIXED_NOW + 100000,
    };
    expect(isProUser(activeSub, FIXED_NOW)).toBe(true);
    expect(getEntitlementTier(activeSub, FIXED_NOW)).toBe('monthly');
  });

  it('identifies expired subscription as free', () => {
    const expiredSub: UserSubscription = {
      isPro: true,
      tier: 'yearly',
      expiryDate: FIXED_NOW - 1000,
    };
    expect(isProUser(expiredSub, FIXED_NOW)).toBe(false);
    expect(getEntitlementTier(expiredSub, FIXED_NOW)).toBe('free');
  });

  it('handles string ISO dates for expiry correctly', () => {
    const activeIsoSub: any = {
      isPro: true,
      tier: 'monthly',
      expiryDate: new Date(FIXED_NOW + 100000).toISOString(),
    };
    expect(isProUser(activeIsoSub, FIXED_NOW)).toBe(true);

    const expiredIsoSub: any = {
      isPro: true,
      tier: 'monthly',
      expiryDate: new Date(FIXED_NOW - 1000).toISOString(),
    };
    expect(isProUser(expiredIsoSub, FIXED_NOW)).toBe(false);
  });

  it('correctly handles local demo subscriptions', () => {
    const demoSub = createLocalDemoSubscription(7, FIXED_NOW);
    expect(demoSub.isPro).toBe(true);
    expect(demoSub.tier).toBe('demo');
    expect(demoSub.expiryDate).toBe(FIXED_NOW + 7 * 86400000);

    expect(isProUser(demoSub, FIXED_NOW)).toBe(true);
    expect(isDemoUser(demoSub, FIXED_NOW)).toBe(true);
    expect(getEntitlementTier(demoSub, FIXED_NOW)).toBe('demo');

    // After 8 days (expired)
    const futureTime = FIXED_NOW + 8 * 86400000;
    expect(isProUser(demoSub, futureTime)).toBe(false);
    expect(isDemoUser(demoSub, futureTime)).toBe(false);
    expect(getEntitlementTier(demoSub, futureTime)).toBe('free');
  });

  it('rejects subscription with isPro false even if tier is not free', () => {
    const mismatchedSub: UserSubscription = {
      isPro: false,
      tier: 'monthly',
      expiryDate: FIXED_NOW + 100000,
    };
    expect(isProUser(mismatchedSub, FIXED_NOW)).toBe(false);
    expect(getEntitlementTier(mismatchedSub, FIXED_NOW)).toBe('free');
  });

  describe('server-authoritative subscription enforcement', () => {
    it('disallows local demo creation in production environment', () => {
      expect(canGrantDemo(false)).toBe(false); // In production (DEV=false)
      expect(canGrantDemo(true)).toBe(true);   // In development (DEV=true)
    });

    it('resolveAuthoritativeSubscription returns default free for null, undefined, or empty server data', () => {
      expect(resolveAuthoritativeSubscription(null, FIXED_NOW)).toEqual(DEFAULT_FREE_SUBSCRIPTION);
      expect(resolveAuthoritativeSubscription(undefined, FIXED_NOW)).toEqual(DEFAULT_FREE_SUBSCRIPTION);
      expect(resolveAuthoritativeSubscription({}, FIXED_NOW)).toEqual(DEFAULT_FREE_SUBSCRIPTION);
      expect(resolveAuthoritativeSubscription({ isPro: false }, FIXED_NOW)).toEqual(DEFAULT_FREE_SUBSCRIPTION);
    });

    it('resolveAuthoritativeSubscription rejects expired server documents', () => {
      const expiredDoc = {
        isPro: true,
        tier: 'monthly',
        expiryDate: FIXED_NOW - 5000,
      };
      expect(resolveAuthoritativeSubscription(expiredDoc, FIXED_NOW)).toEqual(DEFAULT_FREE_SUBSCRIPTION);
    });

    it('resolveAuthoritativeSubscription rejects unauthorized or forged tier strings', () => {
      const forgedDoc = {
        isPro: true,
        tier: 'super_admin_bypass',
        expiryDate: FIXED_NOW + 100000,
      };
      expect(resolveAuthoritativeSubscription(forgedDoc, FIXED_NOW)).toEqual(DEFAULT_FREE_SUBSCRIPTION);
    });

    it('resolveAuthoritativeSubscription accepts valid authoritative active subscriptions', () => {
      const validMonthlyDoc = {
        isPro: true,
        tier: 'monthly',
        expiryDate: FIXED_NOW + 100000,
      };
      const resolvedMonthly = resolveAuthoritativeSubscription(validMonthlyDoc, FIXED_NOW);
      expect(resolvedMonthly.isPro).toBe(true);
      expect(resolvedMonthly.tier).toBe('monthly');
      expect(resolvedMonthly.expiryDate).toBe(FIXED_NOW + 100000);

      const validLifetimeDoc = {
        isPro: true,
        tier: 'lifetime',
        expiryDate: null,
      };
      const resolvedLifetime = resolveAuthoritativeSubscription(validLifetimeDoc, FIXED_NOW);
      expect(resolvedLifetime.isPro).toBe(true);
      expect(resolvedLifetime.tier).toBe('lifetime');
      expect(resolvedLifetime.expiryDate).toBeNull();
    });
  });
});
