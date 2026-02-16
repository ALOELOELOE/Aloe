// Aloe - Dashboard
// Main app interface for viewing and managing auctions

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
import { Plus, Loader2, LayoutDashboard, Gavel, Clock } from "lucide-react";
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

export default function Dashboard() {
  const { address, executeTransaction } = useWallet();
  const { auctions, updateAuction } = useAuctionStore();

  // Dialog state for bidding
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isBidMode, setIsBidMode] = useState(false);

  // Calculate stats
  const activeAuctions = auctions?.filter(a => a.status === AUCTION_STATUS.COMMIT_PHASE)?.length || 0;
  const totalAuctions = auctions?.length || 0;

  // Handle auction selection (view details)
  const handleSelectAuction = (auction) => {
    setSelectedAuction(auction);
    setIsBidMode(false);
    setBidDialogOpen(true);
  };

  // Handle bid button click
  const handleBidClick = (auction) => {
    setSelectedAuction(auction);
    setIsBidMode(true);
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

      const txInputs = buildPlaceBidInputs({
        auctionId: selectedAuction.id,
        bidAmount: bidMicro,
        deposit: bidMicro,
      });

      toast.info("Please approve the transaction in your wallet...");

      // Execute transaction via @provablehq wallet adapter
      const result = await executeTransaction({
        program: txInputs.programId,
        function: txInputs.functionName,
        inputs: txInputs.inputs,
        fee: txInputs.fee,
        privateFee: false,
      });
      const txId = result?.transactionId;

      storeBidLocally(
        selectedAuction.id,
        bidMicro.toString(),
        txInputs.metadata.salt
      );

      updateAuction(selectedAuction.id, {
        bidCount: (selectedAuction.bidCount || 0) + 1,
      });

      toast.success("Bid placed successfully!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      setBidDialogOpen(false);
      setBidAmount("");
      setSelectedAuction(null);
      setIsBidMode(false);
    } catch (error) {
      console.error("[Aloe] Failed to place bid:", error);
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
      <main className="px-6 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and participate in private sealed-bid auctions
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="mb-8 grid gap-4 sm:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Auctions</p>
                <p className="text-2xl font-bold">{activeAuctions}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Auctions</p>
                <p className="text-2xl font-bold">{totalAuctions}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {address ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Auctions Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Auctions</h2>
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

              {/* Bid Input */}
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
    </div>
  );
}
