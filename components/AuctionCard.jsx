// Auction Card component
// Displays individual auction information with on-chain phase detection and bid indicators

import { useState, useEffect } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuctionStatusBadge } from "@/components/AuctionStatusBadge";
import {
  formatCredits,
  formatBlockDuration,
  truncateAddress,
  fetchAuctionOnChain,
  hasStoredBid,
  isBidRevealed,
} from "@/lib/aleo";
import { AUCTION_STATUS } from "@/lib/constants";
import { Clock, Users, Gavel, ArrowRight, Eye, CheckCircle, AlertTriangle, XCircle, Trophy } from "lucide-react";

/**
 * Determine the actual auction phase from on-chain deadlines + current block
 * The contract uses status 1 for the entire active period (commit + reveal).
 * We differentiate by comparing currentBlock against the deadlines.
 * @returns {"commit" | "reveal" | "ended" | "unknown"}
 */
function getActualPhase(status, currentBlock, commitDeadline, revealDeadline) {
  // Non-active statuses are straightforward
  if (status === AUCTION_STATUS.ENDED) return "ended";
  if (status === AUCTION_STATUS.CANCELLED) return "cancelled";
  if (status === AUCTION_STATUS.CREATED) return "created";

  // Status 1 (COMMIT_PHASE) covers both commit and reveal on-chain
  // Need block height + deadlines to differentiate
  if (!currentBlock || !commitDeadline) return "unknown";

  if (currentBlock <= commitDeadline) return "commit";
  if (revealDeadline && currentBlock <= revealDeadline) return "reveal";
  return "ended"; // Past both deadlines
}

/**
 * AuctionCard component
 * Displays auction preview with on-chain phase detection and bid indicators
 * @param {Object} auction - Auction data from store
 * @param {Function} onSelect - Click handler for "View Details"
 * @param {Function} onBid - Click handler for "Place Bid"
 * @param {number} index - Index for staggered animation
 * @param {number} currentBlock - Current block height from useBlockHeight()
 */
export function AuctionCard({ auction, onSelect, onBid, index = 0, currentBlock = null }) {
  const { address } = useWallet();
  const {
    id,
    itemName,
    auctioneer,
    minBid,
    status,
    bidCount = 0,
  } = auction;

  // On-chain deadline state — fetched once on mount
  const [commitDeadline, setCommitDeadline] = useState(null);
  const [revealDeadline, setRevealDeadline] = useState(null);
  // Winner address from on-chain data — used to show "Winner" badge
  const [winner, setWinner] = useState(null);

  // Check if user has a stored bid for this auction
  const userHasBid = hasStoredBid(id);

  // Fetch on-chain data once when the card mounts
  // For active auctions: fetch deadlines for phase detection
  // For ended auctions with a user bid: fetch winner to show correct badge
  useEffect(() => {
    if (!id || status === AUCTION_STATUS.CANCELLED) return;

    // Skip fetch for ended auctions where user has no bid (no badge needed)
    const isEnded = status === AUCTION_STATUS.ENDED;
    if (isEnded && !userHasBid) return;

    let cancelled = false;
    fetchAuctionOnChain(id).then((data) => {
      if (cancelled || !data) return;
      setCommitDeadline(data.commitDeadline);
      setRevealDeadline(data.revealDeadline);
      if (data.winner) setWinner(data.winner);
    });

    return () => { cancelled = true; };
  }, [id, status, userHasBid]);

  // Determine actual phase from on-chain data
  const phase = getActualPhase(status, currentBlock, commitDeadline, revealDeadline);

  // Calculate remaining blocks for the current phase
  const getRemainingText = () => {
    if (!currentBlock) return null;

    if (phase === "commit" && commitDeadline) {
      const remaining = commitDeadline - currentBlock;
      return `Commit phase: ${formatBlockDuration(remaining)} left`;
    }
    if (phase === "reveal" && revealDeadline) {
      const remaining = revealDeadline - currentBlock;
      return `Reveal phase: ${formatBlockDuration(remaining)} left`;
    }
    if (phase === "ended") {
      return "Auction ended";
    }
    return null;
  };

  // Bid indicator badge — key UX signal for user's own auctions
  const getBidIndicator = () => {
    if (!userHasBid) return null;

    if (phase === "commit") {
      return (
        <Badge variant="default" className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-600">
          <CheckCircle className="h-3 w-3" />
          Bid Placed
        </Badge>
      );
    }
    if (phase === "reveal") {
      // Pulsing amber badge — this is the key UX win, tells user to act NOW
      return (
        <Badge variant="warning" className="gap-1 text-xs animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          Reveal Required
        </Badge>
      );
    }
    // Ended auction — show winner, revealed, or forfeited badge
    if (phase === "ended") {
      // Check if user won the auction
      if (address && winner && address === winner) {
        return (
          <Badge variant="default" className="gap-1 text-xs bg-amber-600 hover:bg-amber-600">
            <Trophy className="h-3 w-3" />
            Winner
          </Badge>
        );
      }
      if (isBidRevealed(id)) {
        // Bid was revealed but didn't win — can claim refund
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <CheckCircle className="h-3 w-3" />
            Bid Revealed
          </Badge>
        );
      }
      // Unrevealed bid — deposit is forfeited
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <XCircle className="h-3 w-3" />
          Bid Forfeited
        </Badge>
      );
    }
    return null;
  };

  const remainingText = getRemainingText();
  const bidIndicator = getBidIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200">
        <CardHeader className="p-4 md:p-6 pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">{itemName}</CardTitle>
            <AuctionStatusBadge
              status={status}
              currentBlock={currentBlock}
              commitDeadline={commitDeadline}
              revealDeadline={revealDeadline}
            />
          </div>
          <CardDescription className="line-clamp-1">
            by {truncateAddress(auctioneer)}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 px-4 md:px-6">
          {/* Minimum Bid */}
          <div className="flex items-center gap-2 text-sm">
            <Gavel className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Min bid:</span>
            <span className="font-medium">{formatCredits(minBid)}</span>
          </div>

          {/* Phase Timing — actual remaining blocks, not total duration */}
          {remainingText && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{remainingText}</span>
            </div>
          )}

          {/* Bid Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Bids:</span>
            <span className="font-medium">
              {bidCount} {bidCount === 1 ? "bid" : "bids"}
            </span>
          </div>

          {/* Bid Indicator — shows user's bid status for this auction */}
          {bidIndicator && (
            <div className="pt-1">
              {bidIndicator}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2 p-4 md:p-6 pt-4">
          {/* Phase-aware action buttons */}
          {phase === "commit" && !userHasBid && onBid && (
            <Button className="flex-1" onClick={() => onBid(auction)}>
              Place Bid
            </Button>
          )}
          {phase === "commit" && userHasBid && onSelect && (
            <Button className="flex-1" variant="outline" onClick={() => onSelect(auction)}>
              <Eye className="mr-2 h-4 w-4" />
              View Bid
            </Button>
          )}
          {phase === "reveal" && userHasBid && onSelect && (
            <Button className="flex-1" onClick={() => onSelect(auction)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reveal Bid
            </Button>
          )}
          {phase === "reveal" && !userHasBid && onSelect && (
            <Button className="flex-1" variant="outline" onClick={() => onSelect(auction)}>
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {(phase === "ended" || phase === "cancelled") && onSelect && (
            <Button className="flex-1" variant="outline" onClick={() => onSelect(auction)}>
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {/* Fallback: unknown phase or no deadlines yet — always show View Details */}
          {phase === "unknown" && onSelect && (
            <>
              {onBid && (
                <Button className="flex-1" onClick={() => onBid(auction)}>
                  Place Bid
                </Button>
              )}
              <Button
                variant={onBid ? "outline" : "default"}
                className={onBid ? "" : "flex-1"}
                onClick={() => onSelect(auction)}
              >
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default AuctionCard;
