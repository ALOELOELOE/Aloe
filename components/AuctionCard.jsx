// Auction Card component
// Displays individual auction information

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCredits,
  formatBlockDuration,
  truncateAddress,
} from "@/lib/aleo";
import {
  AUCTION_STATUS_LABELS,
  AUCTION_STATUS_COLORS,
  AUCTION_STATUS,
} from "@/lib/constants";
import { Clock, Users, Gavel, ArrowRight } from "lucide-react";

/**
 * AuctionCard component
 * Displays auction preview with key information
 * @param {number} index - Index for staggered animation
 */
export function AuctionCard({ auction, onSelect, onBid, index = 0 }) {
  const {
    id,
    itemName,
    auctioneer,
    minBid,
    commitDuration,
    revealDuration,
    status,
    bidCount = 0,
    createdAt,
  } = auction;

  // Get status display properties
  const statusLabel = AUCTION_STATUS_LABELS[status] || "Unknown";
  const statusColor = AUCTION_STATUS_COLORS[status] || "secondary";

  // Determine if bidding is available
  const canBid = status === AUCTION_STATUS.COMMIT_PHASE;

  // Calculate time remaining (simplified - would need block height from chain)
  const totalBlocks = commitDuration + revealDuration;
  const durationText = formatBlockDuration(totalBlocks);

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
            <Badge variant={statusColor}>{statusLabel}</Badge>
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

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{durationText}</span>
          </div>

          {/* Bid Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Bids:</span>
            <span className="font-medium">
              {bidCount} {bidCount === 1 ? "bid" : "bids"}
            </span>
          </div>

          {/* Phase Info */}
          {status === AUCTION_STATUS.COMMIT_PHASE && (
            <p className="text-xs text-muted-foreground">
              Commit phase: {formatBlockDuration(commitDuration)} remaining
            </p>
          )}
          {status === AUCTION_STATUS.REVEAL_PHASE && (
            <p className="text-xs text-muted-foreground">
              Reveal phase: {formatBlockDuration(revealDuration)} remaining
            </p>
          )}
        </CardContent>

        <CardFooter className="gap-2 p-4 md:p-6 pt-4">
          {canBid && onBid && (
            <Button className="flex-1" onClick={() => onBid(auction)}>
              Place Bid
            </Button>
          )}
          {onSelect && (
            <Button
              variant={canBid ? "outline" : "default"}
              className={canBid ? "" : "flex-1"}
              onClick={() => onSelect(auction)}
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default AuctionCard;
