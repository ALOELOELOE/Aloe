// Auction List component
// Displays grid of auction cards

import { useAuctionStore } from "@/store/auctionStore";
import { AuctionCard } from "./AuctionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

/**
 * AuctionList component
 * Renders a grid of auction cards with loading and empty states
 */
export function AuctionList({ onSelect, onBid, filter = null }) {
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

  // Empty state
  if (sortedAuctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No Auctions Yet</h3>
        <p className="text-center text-muted-foreground">
          Be the first to create an auction!
          <br />
          Connect your wallet and click &quot;Create Auction&quot; to get started.
        </p>
      </div>
    );
  }

  // Render auction grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedAuctions.map((auction) => (
        <AuctionCard
          key={auction.id}
          auction={auction}
          onSelect={onSelect}
          onBid={onBid}
        />
      ))}
    </div>
  );
}

export default AuctionList;
