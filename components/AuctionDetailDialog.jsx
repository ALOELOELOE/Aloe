// Auction Detail Dialog
// Full-featured auction detail view with phase-aware action buttons

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Gavel, XCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  buildPlaceBidInputs,
  buildCancelAuctionInputs,
  storeBidLocally,
  formatCredits,
  parseCreditsToMicro,
  findCreditsRecord,
  truncateAddress,
  isRealTransaction,
  fetchAuctionOnChain,
} from "@/lib/aleo";
import { AUCTION_STATUS, BLOCK_TIME_SECONDS } from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";
import { AuctionStatusBadge } from "@/components/AuctionStatusBadge";
import { AuctionTimer } from "@/components/AuctionTimer";
import { RevealBidDialog } from "@/components/RevealBidDialog";
import { ShieldCreditsDialog } from "@/components/ShieldCreditsDialog";
import { SettleAuctionButton } from "@/components/SettleAuctionButton";
import { ClaimRefundButton } from "@/components/ClaimRefundButton";

/**
 * Full auction detail dialog with phase-aware actions
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Dialog open state handler
 * @param {Object} props.auction - Auction object
 * @param {number} [props.currentBlock] - Current block height estimate
 * @param {boolean} [props.startInBidMode] - Whether to open in bid mode
 */
export function AuctionDetailDialog({
  open,
  onOpenChange,
  auction,
  currentBlock,
  startInBidMode = false,
}) {
  const { address, executeTransaction, requestRecords } = useWallet();
  const { updateAuction, isBidding, setBidding, isCancelling, setCancelling } = useAuctionStore();

  // Bid input state
  const [bidAmount, setBidAmount] = useState("");
  const [isBidMode, setIsBidMode] = useState(startInBidMode);

  // Reveal dialog state
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);

  // Shield credits dialog state (shown when no private credits available)
  const [shieldDialogOpen, setShieldDialogOpen] = useState(false);
  const [shieldSuggestedAmount, setShieldSuggestedAmount] = useState(0);

  // On-chain deadline state — fetched from Aleo API (source of truth for phase detection)
  const [onChainData, setOnChainData] = useState(null);

  // Fetch actual deadlines from on-chain when dialog opens and periodically refresh
  const refreshOnChainData = useCallback(async () => {
    if (!auction?.id) return;
    const data = await fetchAuctionOnChain(auction.id);
    if (data) {
      console.log("[Aloe:AuctionDetailDialog] On-chain data:", data);
      setOnChainData(data);
    }
  }, [auction?.id]);

  useEffect(() => {
    if (!open || !auction?.id) {
      setOnChainData(null);
      return;
    }
    // Fetch immediately on open
    refreshOnChainData();
    // Refresh every block to keep phase detection accurate
    const interval = setInterval(refreshOnChainData, BLOCK_TIME_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [open, auction?.id, refreshOnChainData]);

  if (!auction) return null;

  // Use on-chain deadlines (source of truth) — fall back to local estimates only if not fetched yet
  const commitDeadline = onChainData?.commitDeadline ?? auction.commitDeadline ?? null;
  const revealDeadline = onChainData?.revealDeadline ?? auction.revealDeadline ?? null;

  // Determine current phase based on block height and ON-CHAIN deadlines
  // Without on-chain data or block height, default to commit phase (safest — prevents premature actions)
  const isCommitPhase =
    auction.status === AUCTION_STATUS.COMMIT_PHASE &&
    (!currentBlock || !commitDeadline || currentBlock <= commitDeadline);
  const isRevealPhase =
    auction.status === AUCTION_STATUS.COMMIT_PHASE &&
    currentBlock && commitDeadline && revealDeadline &&
    currentBlock > commitDeadline &&
    currentBlock <= revealDeadline;
  const isPastReveal =
    auction.status === AUCTION_STATUS.COMMIT_PHASE &&
    currentBlock && revealDeadline &&
    currentBlock > revealDeadline;
  const isEnded = auction.status === AUCTION_STATUS.ENDED;
  const isAuctioneer = address === auction.auctioneer;

  // Handle bid submission (with private credits record)
  const handlePlaceBid = async () => {
    if (!address || !auction) return;

    const bidValue = parseFloat(bidAmount);
    const minBidCredits = auction.minBid / 1_000_000;

    if (isNaN(bidValue) || bidValue < minBidCredits) {
      toast.error(`Bid must be at least ${minBidCredits} credits`);
      return;
    }

    setBidding(true);
    console.log("[Aloe:AuctionDetailDialog] Placing bid on auction", auction.id);

    try {
      const bidMicro = parseCreditsToMicro(bidAmount);

      // Find a private credits record with enough balance (privacy fix!)
      const creditsRecord = await findCreditsRecord(requestRecords, bidMicro);
      if (!creditsRecord) {
        // No private record — prompt user to shield credits first
        console.log("[Aloe:AuctionDetailDialog] No private credits, opening shield dialog");
        setShieldSuggestedAmount(bidMicro);
        setShieldDialogOpen(true);
        toast.error("No private credits record found", {
          description: "Shield your credits first to enable private bidding.",
        });
        return;
      }

      const txInputs = buildPlaceBidInputs({
        auctionId: auction.id,
        bidAmount: bidMicro,
        deposit: bidMicro,
        creditsRecord,
      });

      toast.info("Please approve the transaction in your wallet...");

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

      // Store bid locally for later reveal and refund (includes deposit for v4 contract)
      storeBidLocally(auction.id, bidMicro.toString(), txInputs.metadata.salt, bidMicro.toString());

      // Update local auction state
      updateAuction(auction.id, {
        bidCount: (auction.bidCount || 0) + 1,
      });

      console.log("[Aloe:AuctionDetailDialog] Bid placed, tx:", txId);

      toast.success("Bid placed successfully!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      setBidAmount("");
      setIsBidMode(false);
      onOpenChange(false);
    } catch (error) {
      console.error("[Aloe:AuctionDetailDialog] Bid failed:", error);
      toast.error("Failed to place bid", { description: error.message });
    } finally {
      setBidding(false);
    }
  };

  // Handle auction cancellation
  const handleCancel = async () => {
    if (!address || !auction) return;

    setCancelling(true);
    console.log("[Aloe:AuctionDetailDialog] Cancelling auction", auction.id);

    try {
      const txInputs = buildCancelAuctionInputs({ auctionId: auction.id });

      toast.info("Please approve the cancellation in your wallet...");

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

      updateAuction(auction.id, { status: AUCTION_STATUS.CANCELLED });

      console.log("[Aloe:AuctionDetailDialog] Auction cancelled, tx:", txId);

      toast.success("Auction cancelled", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("[Aloe:AuctionDetailDialog] Cancel failed:", error);
      toast.error("Failed to cancel auction", { description: error.message });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{auction.itemName}</DialogTitle>
              <AuctionStatusBadge
                status={auction.status}
                commitDeadline={commitDeadline}
                revealDeadline={revealDeadline}
                currentBlock={currentBlock}
              />
            </div>
            <DialogDescription>
              by {truncateAddress(auction.auctioneer)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Auction Info */}
            <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Bid:</span>
                <span className="font-medium">{formatCredits(auction.minBid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Bids:</span>
                <span className="font-medium">{auction.bidCount || 0}</span>
              </div>
              <AuctionIdRow auctionId={auction.id} />

              {/* Timer */}
              <AuctionTimer
                status={auction.status}
                commitDeadline={commitDeadline}
                revealDeadline={revealDeadline}
                currentBlock={currentBlock}
              />
            </div>

            {/* Bid Input — only during commit phase */}
            {isBidMode && isCommitPhase && (
              <div className="space-y-2">
                <Label htmlFor="bidAmount">Your Bid (credits)</Label>
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.000001"
                  min={auction.minBid / 1_000_000}
                  placeholder={`Min: ${auction.minBid / 1_000_000}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={isBidding}
                />
                <p className="text-xs text-muted-foreground">
                  Your bid is sealed using a private credits record — your address
                  stays hidden until you reveal.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 pt-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBidding || isCancelling}
            >
              Close
            </Button>

            {/* Commit phase — Place Bid */}
            {isCommitPhase && !isBidMode && (
              <Button onClick={() => setIsBidMode(true)}>
                <Gavel className="mr-2 h-4 w-4" />
                Place Bid
              </Button>
            )}
            {isCommitPhase && isBidMode && (
              <Button
                onClick={handlePlaceBid}
                disabled={isBidding || !address || !bidAmount}
              >
                {isBidding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Bid...
                  </>
                ) : !address ? (
                  "Connect Wallet"
                ) : (
                  "Place Sealed Bid"
                )}
              </Button>
            )}

            {/* Reveal phase — Reveal Bid */}
            {isRevealPhase && (
              <Button onClick={() => setRevealDialogOpen(true)}>
                Reveal Bid
              </Button>
            )}

            {/* Past reveal deadline — Settle */}
            {isPastReveal && (
              <SettleAuctionButton
                auction={auction}
                auctioneer={auction.auctioneer}
                winningAmount={auction.winningBid || 0}
                onSettled={() => onOpenChange(false)}
              />
            )}

            {/* Ended + non-winner — Claim Refund */}
            {isEnded && address !== auction.winner && (
              <ClaimRefundButton
                auction={auction}
                onClaimed={() => onOpenChange(false)}
              />
            )}

            {/* Cancel — auctioneer only, zero bids */}
            {isAuctioneer && auction.status === AUCTION_STATUS.COMMIT_PHASE && (auction.bidCount || 0) === 0 && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Auction
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shield Credits sub-dialog */}
      <ShieldCreditsDialog
        open={shieldDialogOpen}
        onOpenChange={setShieldDialogOpen}
        suggestedAmount={shieldSuggestedAmount}
      />

      {/* Reveal Bid sub-dialog */}
      <RevealBidDialog
        open={revealDialogOpen}
        onOpenChange={setRevealDialogOpen}
        auction={auction}
      />
    </>
  );
}

/**
 * Inline component for the Auction ID row with copy-to-clipboard
 */
function AuctionIdRow({ auctionId }) {
  const [copied, setCopied] = useState(false);
  const idStr = auctionId?.toString() || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(idStr);
    toast.success("Auction ID copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">Auction ID:</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 font-mono text-xs hover:text-emerald-400 transition-colors cursor-pointer group"
        title="Click to copy full ID"
      >
        <span>{idStr.slice(0, 12)}...</span>
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
        )}
      </button>
    </div>
  );
}

export default AuctionDetailDialog;
