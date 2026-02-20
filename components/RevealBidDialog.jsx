// Reveal Bid Dialog
// Allows bidders to reveal their sealed bids during the reveal phase
// Includes live on-chain timing status and auto-refresh to prevent missed windows

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredBid,
  markBidRevealed,
  formatCredits,
  buildRevealBidInputs,
  isRealTransaction,
  checkRevealEligibility,
} from "@/lib/aleo";
import { BLOCK_TIME_SECONDS } from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Dialog for revealing a sealed bid during the reveal phase
 * Shows live on-chain timing and auto-refreshes every block (~3 seconds)
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Dialog open state handler
 * @param {Object} props.auction - Auction object
 */
export function RevealBidDialog({ open, onOpenChange, auction }) {
  const { address, executeTransaction } = useWallet();
  const { isRevealing, setRevealing, updateAuction } = useAuctionStore();
  const [storedBid, setStoredBid] = useState(null);

  // On-chain timing state — fetched from Aleo API
  const [timing, setTiming] = useState(null); // { ok, reason, blockHeight, commitDeadline, revealDeadline }
  const [timingLoading, setTimingLoading] = useState(false);

  // Load stored bid data when dialog opens
  useEffect(() => {
    if (open && auction?.id) {
      const bid = getStoredBid(auction.id);
      setStoredBid(bid);
      console.log("[Aloe:RevealBidDialog] Stored bid for auction", auction.id, bid ? "found" : "not found");
    }
  }, [open, auction?.id]);

  // Fetch on-chain timing status
  const refreshTiming = useCallback(async () => {
    if (!auction?.id) return;
    setTimingLoading(true);
    try {
      const result = await checkRevealEligibility(auction.id);
      setTiming(result);
      console.log("[Aloe:RevealBidDialog] Timing check:", result);
    } catch (error) {
      console.error("[Aloe:RevealBidDialog] Timing check error:", error);
    } finally {
      setTimingLoading(false);
    }
  }, [auction?.id]);

  // Auto-check timing on open and every block while dialog is visible
  useEffect(() => {
    if (!open || !auction?.id) {
      setTiming(null);
      return;
    }

    // Initial fetch
    refreshTiming();

    // Auto-refresh every block (~3 seconds) to keep timing status current
    const interval = setInterval(refreshTiming, BLOCK_TIME_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [open, auction?.id, refreshTiming]);

  /**
   * Compute a human-readable timing description from on-chain data
   * Shows exactly where we are relative to commit/reveal deadlines
   */
  const getTimingDisplay = () => {
    if (!timing) return null;
    if (!timing.blockHeight || !timing.commitDeadline || !timing.revealDeadline) return null;

    const { blockHeight, commitDeadline, revealDeadline } = timing;

    // Still in commit phase — show countdown to reveal window opening
    if (blockHeight <= commitDeadline) {
      const blocksLeft = commitDeadline - blockHeight;
      const seconds = blocksLeft * BLOCK_TIME_SECONDS;
      const minutes = Math.ceil(seconds / 60);
      return {
        phase: "commit",
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        label: "Commit phase",
        detail: `Reveal opens in ~${minutes} min (${blocksLeft} blocks)`,
        color: "border-amber-500/30 bg-amber-500/5",
      };
    }

    // In reveal phase — show countdown to deadline
    if (blockHeight <= revealDeadline) {
      const blocksLeft = revealDeadline - blockHeight;
      const seconds = blocksLeft * BLOCK_TIME_SECONDS;
      const minutes = Math.ceil(seconds / 60);
      return {
        phase: "reveal",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        label: "Reveal phase OPEN",
        detail: `${minutes} min remaining (${blocksLeft} blocks)`,
        color: "border-emerald-500/30 bg-emerald-500/5",
      };
    }

    // Past reveal deadline
    const blocksPast = blockHeight - revealDeadline;
    return {
      phase: "expired",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      label: "Reveal window closed",
      detail: `Ended ${blocksPast} blocks ago`,
      color: "border-red-500/30 bg-red-500/5",
    };
  };

  // Whether the reveal button should be enabled based on on-chain timing
  const canReveal = timing?.ok && storedBid && address && !isRevealing;

  // Handle reveal submission
  const handleReveal = async () => {
    if (!address || !auction) return;

    setRevealing(true);
    console.log("[Aloe:RevealBidDialog] Starting reveal for auction", auction.id);

    try {
      // Use locally stored bid data instead of wallet record lookup
      // (Wallets don't reliably index custom program records like BidCommitment)
      if (!storedBid) {
        toast.error("Bid data not found locally", {
          description: "Your bid data must be stored in this browser to reveal.",
        });
        return;
      }

      // Pre-flight check: verify we're actually in the reveal phase on-chain
      // Prevents wasting gas on transactions that will definitely be rejected
      const eligibility = await checkRevealEligibility(auction.id);
      if (!eligibility.ok) {
        toast.error("Cannot reveal yet", {
          description: eligibility.reason,
          duration: 8000,
        });
        console.log("[Aloe:RevealBidDialog] Pre-flight check failed:", eligibility);
        return;
      }

      // Build the reveal transaction from raw fields — contract recomputes commitment on-chain
      const txInputs = buildRevealBidInputs({
        auctionId: auction.id,
        bidAmount: storedBid.bidAmount,
        salt: storedBid.salt,
        deposit: storedBid.deposit || storedBid.bidAmount,
      });

      toast.info("Please approve the reveal transaction in your wallet...");

      // Execute transaction via wallet adapter
      const result = await executeTransaction({
        program: txInputs.programId,
        function: txInputs.functionName,
        inputs: txInputs.inputs,
        fee: txInputs.fee,
        privateFee: false,
      });
      const txId = result?.transactionId;

      // Warn if the wallet returned a simulated (non-on-chain) transaction ID
      if (!isRealTransaction(txId)) {
        toast.warning("Transaction may not be on-chain", {
          description: "Your wallet may be in simulation mode. Switch Proving Mode to 'Local' in wallet settings.",
          duration: 8000,
        });
      }

      // Mark bid as revealed so AuctionCard shows correct status instead of "Bid Forfeited"
      // Bid data is kept (not cleared) because it's still needed for claim_refund
      markBidRevealed(auction.id);

      console.log("[Aloe:RevealBidDialog] Reveal successful, tx:", txId);

      toast.success("Bid revealed successfully!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("[Aloe:RevealBidDialog] Reveal failed:", error);
      toast.error("Failed to reveal bid", {
        description: error.message,
      });
    } finally {
      setRevealing(false);
    }
  };

  const timingDisplay = getTimingDisplay();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Reveal Your Bid
          </DialogTitle>
          <DialogDescription>
            Reveal your sealed bid for {auction?.itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Live on-chain timing status — auto-refreshes every ~3s (each block) */}
          {timingDisplay && (
            <div className={`rounded-lg border p-3 space-y-1 ${timingDisplay.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {timingDisplay.icon}
                  <span className="text-sm font-medium">{timingDisplay.label}</span>
                </div>
                {timingLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground pl-6">{timingDisplay.detail}</p>
              {timing?.blockHeight && (
                <p className="text-xs text-muted-foreground/60 pl-6">
                  Block {timing.blockHeight.toLocaleString()} · Updates every {BLOCK_TIME_SECONDS}s
                </p>
              )}
            </div>
          )}

          {/* Show stored bid info if available */}
          {storedBid ? (
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Bid:</span>
                <span className="font-medium">
                  {formatCredits(storedBid.bidAmount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your bid data was stored locally. The reveal transaction will
                prove your commitment matches.
              </p>
            </div>
          ) : (
            /* Warning if no stored bid found — cannot reveal without local data */
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Bid data not found locally</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your bid data was not found in this browser. You can only reveal from
                the same browser where you placed the bid.
              </p>
            </div>
          )}

          {/* Explanation */}
          <p className="text-xs text-muted-foreground">
            Revealing your bid proves your commitment was genuine. Your reveal is
            tracked on-chain so you can claim a refund if you don&apos;t win.
            Unrevealed bids forfeit their deposit.
          </p>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRevealing}
          >
            Cancel
          </Button>
          <Button onClick={handleReveal} disabled={!canReveal}>
            {isRevealing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revealing...
              </>
            ) : !address ? (
              "Connect Wallet"
            ) : timingDisplay?.phase === "commit" ? (
              "Waiting for Reveal Phase..."
            ) : timingDisplay?.phase === "expired" ? (
              "Reveal Window Closed"
            ) : (
              "Reveal Bid"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RevealBidDialog;
