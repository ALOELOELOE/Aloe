// Import Auction Dialog
// Allows users to import auctions by ID from the on-chain mapping
// Solves cross-browser discovery: auctions created on Browser A can be
// imported by Browser B via auction ID

import { useState } from "react";
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
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { fetchAuctionOnChain, fetchBidCount } from "@/lib/aleo";
import { PROGRAM_ID } from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Dialog to import an auction by its on-chain ID
 * Fetches auction data from the blockchain and adds it to the local store
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Dialog open state handler
 * @param {string} [props.prefillId] - Pre-fill the auction ID input (e.g. from URL param)
 * @param {Function} [props.onSuccess] - Callback after successful import
 */
export function ImportAuctionDialog({ open, onOpenChange, prefillId, onSuccess }) {
  const [auctionId, setAuctionId] = useState(prefillId || "");
  const [isImporting, setIsImporting] = useState(false);
  const { auctions, addAuction } = useAuctionStore();

  // Reset the input when the dialog opens with a new prefillId
  const displayId = auctionId || prefillId || "";

  const handleImport = async () => {
    const id = displayId.trim();
    if (!id) {
      toast.error("Please enter an auction ID");
      return;
    }

    // Validate that the ID is a numeric string (Aleo field values are integers)
    if (!/^\d+$/.test(id)) {
      toast.error("Invalid auction ID", {
        description: "Auction IDs are numeric values (e.g., 1708425600123456)",
      });
      return;
    }

    // Check if auction already exists in local store
    const existing = auctions.find((a) => a.id === id);
    if (existing) {
      toast.info("Auction already imported", {
        description: `"${existing.itemName}" is already in your dashboard.`,
      });
      onOpenChange(false);
      return;
    }

    setIsImporting(true);
    console.log("[Aloe:ImportAuction] Fetching auction", id, "from chain...");

    try {
      // Fetch auction data and bid count from chain in parallel
      const [onChain, bidCount] = await Promise.all([
        fetchAuctionOnChain(id),
        fetchBidCount(id),
      ]);

      if (!onChain) {
        toast.error("Auction not found", {
          description: "No auction with this ID exists on-chain. It may not be confirmed yet.",
        });
        return;
      }

      // Reject auctions with unparseable data (e.g., not yet confirmed)
      if (onChain.status === null || onChain.status === undefined) {
        toast.error("Auction data incomplete", {
          description: "The auction exists but its data couldn't be read. It may still be confirming.",
        });
        return;
      }

      console.log("[Aloe:ImportAuction] On-chain data:", onChain);
      console.log("[Aloe:ImportAuction] Bid count:", bidCount);

      // Build the auction object for the local store
      // Item name defaults to "Auction #<id>" since the contract stores item_id, not a name
      const imported = {
        id,
        itemId: onChain.itemId || id,
        itemName: `Auction #${id.slice(-6)}`, // Last 6 digits for readability
        auctioneer: onChain.auctioneer,
        minBid: onChain.minBid || 0,
        status: onChain.status,
        commitDeadline: onChain.commitDeadline,
        revealDeadline: onChain.revealDeadline,
        winner: onChain.winner,
        winningBid: onChain.winningBid,
        bidCount: bidCount,
        programId: PROGRAM_ID, // Tag with current contract version
        imported: true, // Flag to distinguish from locally created auctions
      };

      addAuction(imported);
      console.log("[Aloe:ImportAuction] Auction imported to local store:", imported);

      toast.success("Auction imported!", {
        description: `Auction #${id.slice(-6)} has been added to your dashboard.`,
      });

      // Reset and close
      setAuctionId("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("[Aloe:ImportAuction] Import failed:", error);
      toast.error("Failed to import auction", {
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-500" />
            Import Auction
          </DialogTitle>
          <DialogDescription>
            Enter an auction ID to import it from the Aleo blockchain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Explanation */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm space-y-2">
            <p>
              Auctions created on other browsers aren&apos;t automatically visible.
              Paste the <strong>auction ID</strong> shared by the creator to import
              it and start bidding.
            </p>
          </div>

          {/* Auction ID Input */}
          <div className="space-y-2">
            <Label htmlFor="importAuctionId">Auction ID</Label>
            <Input
              id="importAuctionId"
              type="text"
              placeholder="e.g. 1708425600123456"
              value={displayId}
              onChange={(e) => setAuctionId(e.target.value)}
              disabled={isImporting}
              className="font-mono text-sm"
              onKeyDown={(e) => {
                // Allow submitting with Enter
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleImport();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !displayId.trim()}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Import Auction
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportAuctionDialog;
