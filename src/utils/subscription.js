/**
 * Subscription state helpers — single source of truth for "is this user paid?"
 * Maps the raw Firestore fields to a typed status used across the UI.
 */
import { FREE_TIER_LIMITS } from './manifestProtocol';

export const SUB_STATUS = {
  FREE:      'free',
  ACTIVE:    'active',     // paid + within term
  CANCELLED: 'cancelled',  // paid, won't renew, still within term
  EXPIRED:   'expired',    // payment failed / lapsed
};

/** Read a user doc and return the effective subscription state. */
export function getSubscriptionState(user) {
  if (!user) return { tier: 'free', isPaid: false, status: SUB_STATUS.FREE, expiresAt: null };

  const status = user.subscriptionStatus || SUB_STATUS.FREE;
  const expiresAtRaw = user.subscriptionExpiresAt;
  const expiresAt = parseTs(expiresAtRaw);
  const now = Date.now();

  // "Paid" means we currently honor paid features.
  // ACTIVE always paid; CANCELLED still paid until expiry; EXPIRED falls back to free.
  const isPaid =
    (status === SUB_STATUS.ACTIVE || status === SUB_STATUS.CANCELLED) &&
    (!expiresAt || expiresAt > now);

  return {
    tier: isPaid ? 'annual' : 'free',
    isPaid,
    status,
    expiresAt,
    willCancel: status === SUB_STATUS.CANCELLED,
  };
}

function parseTs(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && raw.seconds) return raw.seconds * 1000;
  if (typeof raw === 'string') return new Date(raw).getTime();
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  return null;
}

/** Return how many of the given lens-level cards a user can still create. */
export function getLensQuota(level, currentCount, isPaid) {
  if (isPaid) return Infinity;
  const max = FREE_TIER_LIMITS[`${level}Lens`];
  return Math.max(0, max - currentCount);
}

/** Whether the free-tier user has hit the lens quota for the given level. */
export function isLensCapped(level, currentCount, isPaid) {
  return getLensQuota(level, currentCount, isPaid) === 0;
}
