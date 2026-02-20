// Auction Status Badge component
// Color-coded badge showing auction phase with block-height awareness

import { Badge } from "@/components/ui/badge";
import {
  AUCTION_STATUS,
  AUCTION_STATUS_LABELS,
  BLOCK_TIME_SECONDS,
} from "@/lib/constants";

/**
 * Phase-aware auction status badge
 * Uses block heights to determine actual phase (commit vs reveal)
 * since on-chain status 1 covers both periods
 * @param {Object} props
 * @param {number} props.status - Auction status code (0-4)
 * @param {number} [props.commitDeadline] - Block height when commit phase ends
 * @param {number} [props.revealDeadline] - Block height when reveal phase ends
 * @param {number} [props.currentBlock] - Current block height (estimated if not provided)
 */
export function AuctionStatusBadge({
  status,
  commitDeadline,
  revealDeadline,
  currentBlock,
}) {
  // Determine the display phase based on block height for status 1
  const getPhaseInfo = () => {
    if (status === AUCTION_STATUS.ENDED) {
      return { label: "Ended", variant: "success" };
    }
    if (status === AUCTION_STATUS.CANCELLED) {
      return { label: "Cancelled", variant: "destructive" };
    }
    if (status === AUCTION_STATUS.CREATED) {
      return { label: "Created", variant: "secondary" };
    }

    // Status 1 covers both commit and reveal phases
    // Differentiate by block height if available
    if (status === AUCTION_STATUS.COMMIT_PHASE && currentBlock && commitDeadline) {
      // Past both deadlines — auction is effectively ended even if status hasn't updated
      if (revealDeadline && currentBlock > revealDeadline) {
        return { label: "Ended", variant: "success" };
      }
      if (currentBlock > commitDeadline) {
        // Past commit deadline — we're in reveal phase
        return { label: "Reveal Phase", variant: "warning" };
      }
      return { label: "Accepting Bids", variant: "default" };
    }

    // Fallback: use status labels, or "Pending" if status is unrecognized
    return {
      label: AUCTION_STATUS_LABELS[status] || "Pending",
      variant: "secondary",
    };
  };

  const { label, variant } = getPhaseInfo();

  return <Badge variant={variant}>{label}</Badge>;
}

export default AuctionStatusBadge;
