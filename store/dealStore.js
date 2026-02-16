// Zustand store for OTC deal state management
// Mirrors the auctionStore pattern for consistency

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEAL_STATUS, STORAGE_KEYS } from "@/lib/constants";

/**
 * Deal store using Zustand
 * Manages OTC deal list, loading states, and user's deals
 * Will be wired to zkotc.aleo contract once built
 */
export const useDealStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================

      // List of OTC deals (cached locally for demo)
      deals: [],

      // Loading states
      isLoading: false,
      isCreating: false,

      // Error state
      error: null,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Add a new deal to the list
       * Called after successful create_deal transaction
       */
      addDeal: (deal) =>
        set((state) => ({
          deals: [
            {
              ...deal,
              createdAt: Date.now(),
            },
            ...state.deals,
          ],
        })),

      /**
       * Update an existing deal
       */
      updateDeal: (dealId, updates) =>
        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === dealId ? { ...d, ...updates } : d
          ),
        })),

      /**
       * Remove a deal from the list
       */
      removeDeal: (dealId) =>
        set((state) => ({
          deals: state.deals.filter((d) => d.id !== dealId),
        })),

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Set creating state
       */
      setCreating: (isCreating) => set({ isCreating }),

      /**
       * Set error state
       */
      setError: (error) => set({ error }),

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Get deals by status
       */
      getDealsByStatus: (status) => {
        return get().deals.filter((d) => d.status === status);
      },

      /**
       * Get active deals (open or accepted)
       */
      getActiveDeals: () => {
        const deals = get().deals;
        return deals.filter(
          (d) =>
            d.status === DEAL_STATUS.OPEN ||
            d.status === DEAL_STATUS.ACCEPTED
        );
      },

      /**
       * Get deals created by a specific address
       */
      getDealsByMaker: (address) => {
        return get().deals.filter((d) => d.maker === address);
      },

      /**
       * Reset store
       */
      reset: () =>
        set({
          deals: [],
          isLoading: false,
          isCreating: false,
          error: null,
        }),
    }),
    {
      // Persist configuration
      name: STORAGE_KEYS.DEALS,
      // Only persist deals array
      partialize: (state) => ({ deals: state.deals }),
    }
  )
);

export default useDealStore;
