// Aloe - Home Page
// Displays auction list and navigation

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletConnect } from "@/components/WalletConnect";
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
import { PROGRAM_ID, NETWORK, AUCTION_STATUS } from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { publicKey, requestTransaction } = useWallet();
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
    if (!publicKey) {
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
      console.log("[Aloe] Wallet Address:", publicKey);

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

      // Request transaction from wallet
      const txId = await requestTransaction({
        address: publicKey,
        chainId: NETWORK,
        transitions: [
          {
            program: txInputs.programId,
            functionName: txInputs.functionName,
            inputs: txInputs.inputs,
          },
        ],
        fee: txInputs.fee,
        feePrivate: false,
      });

      console.log("[Aloe] ✅ Transaction submitted!");
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
      console.error("[Aloe] ❌ Failed to place bid:", error);
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-removebg-preview.png" alt="Aloe" width={32} height={32} />
            <span className="text-xl font-bold">Aloe</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link href="/create">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Auction
              </Button>
            </Link>
            <WalletConnect />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
        {/* Hero Section */}
        <motion.section
          className="mb-16 md:mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Private Sealed-Bid Auctions
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            Aloe enables trustless auctions with cryptographic privacy. Bids are
            sealed using zero-knowledge proofs on the Aleo blockchain - no one
            knows your bid until reveal time.
          </p>
        </motion.section>

        {/* How it Works */}
        <motion.section
          className="mb-16 md:mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="mb-8 text-2xl md:text-3xl font-bold">How It Works</h2>
          <div className="grid gap-6 md:gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                title: "Create Auction",
                description: "Set your item, minimum bid, and timing for commit and reveal phases.",
              },
              {
                step: 2,
                title: "Place Sealed Bids",
                description: "Bidders submit encrypted commitments. Nobody can see bid amounts.",
              },
              {
                step: 3,
                title: "Reveal & Winner",
                description: "Bidders reveal their bids. Highest bid wins. ZK proofs ensure fairness.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="rounded-lg border border-border p-6 md:p-8 hover:border-emerald-500/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-lg ring-2 ring-emerald-500/30">
                  {item.step}
                </div>
                <h3 className="mb-3 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Auctions Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold">Active Auctions</h2>
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
                disabled={isPlacingBid || !publicKey || !bidAmount}
              >
                {isPlacingBid ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Bid...
                  </>
                ) : !publicKey ? (
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
