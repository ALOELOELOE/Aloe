// Zustand store for auction state management

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AUCTION_STATUS, STORAGE_KEYS } from "@/lib/constants";

/**
 * Auction store using Zustand
 * Manages auction list, loading states, and user's bids
 */
export const useAuctionStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================

      // List of auctions (cached locally for demo purposes)
      auctions: [],

      // Loading states
      isLoading: false,
      isCreating: false,
      isBidding: false,
      isRevealing: false,
      isSettling: false,
      isClaiming: false,
      isCancelling: false,

      // Error state
      error: null,

      // Current selected auction (for detail view)
      selectedAuction: null,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Add a new auction to the list
       * Called after successful create_auction transaction
       */
      addAuction: (auction) =>
        set((state) => ({
          auctions: [
            {
              ...auction,
              createdAt: Date.now(),
            },
            ...state.auctions,
          ],
        })),

      /**
       * Update an existing auction
       */
      updateAuction: (auctionId, updates) =>
        set((state) => ({
          auctions: state.auctions.map((a) =>
            a.id === auctionId ? { ...a, ...updates } : a
          ),
        })),

      /**
       * Remove an auction from the list
       */
      removeAuction: (auctionId) =>
        set((state) => ({
          auctions: state.auctions.filter((a) => a.id !== auctionId),
        })),

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Set creating state (for create auction form)
       */
      setCreating: (isCreating) => set({ isCreating }),

      /**
       * Set bidding state
       */
      setBidding: (isBidding) => set({ isBidding }),

      /** Set revealing state (for reveal bid) */
      setRevealing: (isRevealing) => set({ isRevealing }),

      /** Set settling state (for settle auction) */
      setSettling: (isSettling) => set({ isSettling }),

      /** Set claiming state (for claim refund) */
      setClaiming: (isClaiming) => set({ isClaiming }),

      /** Set cancelling state (for cancel auction) */
      setCancelling: (isCancelling) => set({ isCancelling }),

      /**
       * Set error state
       */
      setError: (error) => set({ error }),

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Set selected auction for detail view
       */
      selectAuction: (auction) => set({ selectedAuction: auction }),

      /**
       * Clear selected auction
       */
      clearSelection: () => set({ selectedAuction: null }),

      /**
       * Get auctions by status
       */
      getAuctionsByStatus: (status) => {
        return get().auctions.filter((a) => a.status === status);
      },

      /**
       * Get active auctions (in commit or reveal phase)
       */
      getActiveAuctions: () => {
        const auctions = get().auctions;
        return auctions.filter(
          (a) =>
            a.status === AUCTION_STATUS.COMMIT_PHASE ||
            a.status === AUCTION_STATUS.REVEAL_PHASE
        );
      },

      /**
       * Get auctions created by a specific address
       */
      getAuctionsByCreator: (address) => {
        return get().auctions.filter((a) => a.auctioneer === address);
      },

      /**
       * Reset store (for testing)
       */
      reset: () =>
        set({
          auctions: [],
          isLoading: false,
          isCreating: false,
          isBidding: false,
          isRevealing: false,
          isSettling: false,
          isClaiming: false,
          isCancelling: false,
          error: null,
          selectedAuction: null,
        }),
    }),
    {
      // Persist configuration
      name: STORAGE_KEYS.AUCTIONS,
      // Only persist auctions array
      partialize: (state) => ({ auctions: state.auctions }),
    }
  )
);

export default useAuctionStore;
