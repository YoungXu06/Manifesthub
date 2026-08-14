import useStore from '../store';
import { getSubscriptionState } from '../utils/subscription';

/**
 * Reactive subscription state. Reads from the user doc in zustand store.
 * Returns: { isPaid, tier, status, expiresAt, willCancel, openCheckout, openPortal }
 */
export default function useSubscription() {
  const { user, openCheckout, openCustomerPortal } = useStore();
  const state = getSubscriptionState(user);
  return {
    ...state,
    openCheckout,
    openPortal: openCustomerPortal,
  };
}
