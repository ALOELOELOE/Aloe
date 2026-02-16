// OTC Deal List component
// Displays grid of deal cards — mirrors AuctionList pattern

import { useDealStore } from "@/store/dealStore";
import { DealCard } from "./DealCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight } from "lucide-react";

/**
 * DealList component
 * Renders a grid of OTC deal cards with loading and empty states
 */
export function DealList({ onSelect, onAccept, filter = null }) {
  const { deals, isLoading } = useDealStore();

  // Apply filter if provided
  const filteredDeals = filter ? deals.filter(filter) : deals;

  // Sort by creation time (newest first)
  const sortedDeals = [...filteredDeals].sort(
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
  if (sortedDeals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No Deals Yet</h3>
        <p className="text-center text-muted-foreground">
          Be the first to create an OTC deal!
          <br />
          Private peer-to-peer trades with atomic escrow.
        </p>
      </div>
    );
  }

  // Render deal grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedDeals.map((deal, index) => (
        <DealCard
          key={deal.id}
          deal={deal}
          onSelect={onSelect}
          onAccept={onAccept}
          index={index}
        />
      ))}
    </div>
  );
}

export default DealList;
