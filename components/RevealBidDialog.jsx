// Reveal Bid Dialog
// Allows bidders to reveal their sealed bids during the reveal phase

import { useState, useEffect } from "react";
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
import { Loader2, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredBid,
  clearStoredBid,
  formatCredits,
  buildRevealBidInputs,
  findRecord,
} from "@/lib/aleo";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Dialog for revealing a sealed bid during the reveal phase
 * Retrieves stored bid data and BidCommitment record from wallet
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Dialog open state handler
 * @param {Object} props.auction - Auction object
 */
export function RevealBidDialog({ open, onOpenChange, auction }) {
  const { address, executeTransaction, requestRecords } = useWallet();
  const { isRevealing, setRevealing, updateAuction } = useAuctionStore();
  const [storedBid, setStoredBid] = useState(null);

  // Load stored bid data when dialog opens
  useEffect(() => {
    if (open && auction?.id) {
      const bid = getStoredBid(auction.id);
      setStoredBid(bid);
      console.log("[Aloe:RevealBidDialog] Stored bid for auction", auction.id, bid ? "found" : "not found");
    }
  }, [open, auction?.id]);

  // Handle reveal submission
  const handleReveal = async () => {
    if (!address || !auction) return;

    setRevealing(true);
    console.log("[Aloe:RevealBidDialog] Starting reveal for auction", auction.id);

    try {
      // Find the BidCommitment record in the wallet
      const bidRecord = await findRecord(requestRecords, "BidCommitment", auction.id);

      if (!bidRecord) {
        toast.error("BidCommitment record not found", {
          description: "Make sure you're using the same wallet that placed the bid.",
        });
        return;
      }

      // Build the reveal transaction
      const txInputs = buildRevealBidInputs({
        bidCommitmentRecord: bidRecord,
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

      // Clear stored bid data after successful reveal
      clearStoredBid(auction.id);
      setStoredBid(null);

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
            /* Warning if no stored bid found */
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Bid data not found locally</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your bid record may still be in your wallet. The reveal will
                proceed using the on-chain BidCommitment record.
              </p>
            </div>
          )}

          {/* Explanation */}
          <p className="text-xs text-muted-foreground">
            Revealing your bid proves your commitment was genuine. You&apos;ll receive a
            RevealedBid record needed to claim a refund if you don&apos;t win.
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
          <Button onClick={handleReveal} disabled={isRevealing || !address}>
            {isRevealing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revealing...
              </>
            ) : !address ? (
              "Connect Wallet"
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
