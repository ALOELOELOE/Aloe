// Auction List component
// Displays grid of auction cards

import { useAuctionStore } from "@/store/auctionStore";
import { AuctionCard } from "./AuctionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

/**
 * AuctionList component
 * Renders a grid of auction cards with loading and empty states
 * @param {number} currentBlock - Current block height for phase detection
 */
export function AuctionList({ onSelect, onBid, filter = null, currentBlock = null, emptyTitle = "No Auctions Yet", emptyDescription = null }) {
  const { auctions, isLoading } = useAuctionStore();

  // Apply filter if provided
  const filteredAuctions = filter
    ? auctions.filter(filter)
    : auctions;

  // Sort by creation time (newest first)
  const sortedAuctions = [...filteredAuctions].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state — uses customizable title and description
  if (sortedAuctions.length === 0) {
    const defaultDesc = "Be the first to create an auction! Connect your wallet and click \"Create Auction\" to get started.";
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800/50 py-12">
        <Package className="mb-4 h-10 w-10 text-neutral-500" />
        <h3 className="mb-2 text-base font-semibold text-neutral-300">{emptyTitle}</h3>
        <p className="text-center text-sm text-neutral-500 max-w-sm">
          {emptyDescription || defaultDesc}
        </p>
      </div>
    );
  }

  // Render auction grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedAuctions.map((auction, index) => (
        <AuctionCard
          key={auction.id}
          auction={auction}
          onSelect={onSelect}
          onBid={onBid}
          index={index}
          currentBlock={currentBlock}
        />
      ))}
    </div>
  );
}

export default AuctionList;
