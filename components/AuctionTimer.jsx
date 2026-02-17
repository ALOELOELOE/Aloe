// Auction Timer component
// Shows countdown to next phase deadline based on block height

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { BLOCK_TIME_SECONDS, AUCTION_STATUS } from "@/lib/constants";

/**
 * Countdown timer for auction phases
 * Estimates time remaining based on block height difference
 * @param {Object} props
 * @param {number} props.status - Auction status code
 * @param {number} props.commitDeadline - Block height when commit phase ends
 * @param {number} props.revealDeadline - Block height when reveal phase ends
 * @param {number} [props.currentBlock] - Current estimated block height
 */
export function AuctionTimer({ status, commitDeadline, revealDeadline, currentBlock }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [phaseLabel, setPhaseLabel] = useState("");

  useEffect(() => {
    // Only show timer for active auctions (status 1)
    if (status !== AUCTION_STATUS.COMMIT_PHASE) {
      setTimeLeft("");
      setPhaseLabel("");
      return;
    }

    // Determine which deadline applies
    const isRevealPhase = currentBlock && currentBlock > commitDeadline;
    const targetBlock = isRevealPhase ? revealDeadline : commitDeadline;
    const label = isRevealPhase ? "Reveal ends in" : "Bidding ends in";
    setPhaseLabel(label);

    // Calculate remaining blocks and time
    const updateTimer = () => {
      if (!currentBlock || !targetBlock) {
        setTimeLeft("--:--");
        return;
      }

      const blocksRemaining = targetBlock - currentBlock;
      if (blocksRemaining <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const secondsRemaining = blocksRemaining * BLOCK_TIME_SECONDS;
      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();

    // Update every BLOCK_TIME_SECONDS (approximate block tick)
    const interval = setInterval(updateTimer, BLOCK_TIME_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [status, commitDeadline, revealDeadline, currentBlock]);

  // Don't render for inactive auctions
  if (!timeLeft || !phaseLabel) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{phaseLabel}:</span>
      <span className="font-mono font-medium text-foreground">{timeLeft}</span>
    </div>
  );
}

export default AuctionTimer;
