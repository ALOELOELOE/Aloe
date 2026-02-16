// Aloe - Auctions Page
// Displays auction list and bidding functionality

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AppHeader } from "@/components/AppHeader";
import { AuctionList } from "@/components/AuctionList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  buildPlaceBidInputs,
  storeBidLocally,
  formatCredits,
  parseCreditsToMicro,
} from "@/lib/aleo";
import { AUCTION_STATUS } from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Auctions() {
  const { address, executeTransaction } = useWallet();
  const { updateAuction } = useAuctionStore();

  // Dialog state for bidding
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isBidMode, setIsBidMode] = useState(false); // true = Place Bid, false = View Details

  // Handle auction selection (view details only)
  const handleSelectAuction = (auction) => {
    console.log("[Aloe] Auction selected (view details):", {
      id: auction.id,
      itemName: auction.itemName,
      status: auction.status,
      minBid: auction.minBid,
    });
    setSelectedAuction(auction);
    setIsBidMode(false); // View-only mode
    setBidDialogOpen(true);
  };

  // Handle bid button click (opens dialog in bid mode)
  const handleBidClick = (auction) => {
    console.log("[Aloe] Bid initiated for auction:", auction.id);
    setSelectedAuction(auction);
    setIsBidMode(true); // Bid mode
    setBidDialogOpen(true);
  };

  // Handle bid submission
  const handlePlaceBid = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedAuction) {
      toast.error("No auction selected");
      return;
    }

    const bidValue = parseFloat(bidAmount);
    const minBidCredits = selectedAuction.minBid / 1_000_000;

    if (isNaN(bidValue) || bidValue < minBidCredits) {
      toast.error(`Bid must be at least ${minBidCredits} credits`);
      return;
    }

    setIsPlacingBid(true);

    try {
      const bidMicro = parseCreditsToMicro(bidAmount);

      console.log("[Aloe] ====== PLACE BID START ======");
      console.log("[Aloe] Auction ID:", selectedAuction.id);
      console.log("[Aloe] Bid Amount:", bidAmount, "credits (", bidMicro, "microcredits)");
      console.log("[Aloe] Wallet Address:", address);

      // Build transaction inputs
      const txInputs = buildPlaceBidInputs({
        auctionId: selectedAuction.id,
        bidAmount: bidMicro,
        deposit: bidMicro, // deposit equals bid for simplicity
      });

      console.log("[Aloe] Transaction inputs built:");
      console.log("[Aloe]   Program:", txInputs.programId);
      console.log("[Aloe]   Function:", txInputs.functionName);
      console.log("[Aloe]   Inputs:", txInputs.inputs);
      console.log("[Aloe]   Fee:", txInputs.fee, "microcredits");
      console.log("[Aloe]   Salt generated:", txInputs.metadata.salt);

      toast.info("Please approve the transaction in your wallet...");

      console.log("[Aloe] Requesting transaction from wallet...");

      // Execute transaction via @provablehq wallet adapter
      const result = await executeTransaction({
        program: txInputs.programId,
        function: txInputs.functionName,
        inputs: txInputs.inputs,
        fee: txInputs.fee,
        privateFee: false,
      });
      const txId = result?.transactionId;

      console.log("[Aloe] Transaction submitted!");
      console.log("[Aloe] Transaction ID:", txId);

      // Store bid locally for later reveal
      storeBidLocally(
        selectedAuction.id,
        bidMicro.toString(),
        txInputs.metadata.salt
      );
      console.log("[Aloe] Bid stored locally for reveal phase");

      // Update auction bid count in store
      updateAuction(selectedAuction.id, {
        bidCount: (selectedAuction.bidCount || 0) + 1,
      });

      toast.success("Bid placed successfully!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      console.log("[Aloe] ====== PLACE BID COMPLETE ======");

      // Close dialog and reset
      setBidDialogOpen(false);
      setBidAmount("");
      setSelectedAuction(null);
      setIsBidMode(false);
    } catch (error) {
      console.error("[Aloe] Failed to place bid:", error);
      console.error("[Aloe] Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      toast.error("Failed to place bid", {
        description: error.message,
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans`}
    >
      {/* Shared App Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold">Active Auctions</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and bid on sealed-bid auctions with cryptographic privacy.
          </p>
        </motion.div>

        {/* Auctions Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-8 flex items-center justify-end">
            <Link href="/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Auction
              </Button>
            </Link>
          </div>

          <AuctionList
            onSelect={handleSelectAuction}
            onBid={handleBidClick}
          />
        </motion.section>
      </main>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isBidMode && selectedAuction?.status === AUCTION_STATUS.COMMIT_PHASE
                ? "Place Sealed Bid"
                : "Auction Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedAuction?.itemName}
            </DialogDescription>
          </DialogHeader>

          {selectedAuction && (
            <div className="space-y-6 py-2">
              {/* Auction Info */}
              <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Bid:</span>
                  <span className="font-medium">
                    {formatCredits(selectedAuction.minBid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Bids:</span>
                  <span className="font-medium">
                    {selectedAuction.bidCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auction ID:</span>
                  <span className="font-mono text-xs">
                    {selectedAuction.id?.slice(0, 12)}...
                  </span>
                </div>
              </div>

              {/* Bid Input (only in bid mode during commit phase) */}
              {isBidMode && selectedAuction.status === AUCTION_STATUS.COMMIT_PHASE && (
                <div className="space-y-2">
                  <Label htmlFor="bidAmount">Your Bid (credits)</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    step="0.000001"
                    min={selectedAuction.minBid / 1_000_000}
                    placeholder={`Min: ${selectedAuction.minBid / 1_000_000}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={isPlacingBid}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your bid is encrypted and hidden until the reveal phase.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setBidDialogOpen(false)}
              disabled={isPlacingBid}
            >
              Cancel
            </Button>
            {isBidMode && selectedAuction?.status === AUCTION_STATUS.COMMIT_PHASE && (
              <Button
                onClick={handlePlaceBid}
                disabled={isPlacingBid || !address || !bidAmount}
              >
                {isPlacingBid ? (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>
            Built on{" "}
            <a
              href="https://aleo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Aleo
            </a>{" "}
            - Privacy by default
          </p>
        </div>
      </footer>
    </div>
  );
}
