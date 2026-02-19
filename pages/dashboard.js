// Aloe - Dashboard
// Main app interface for viewing and managing auctions

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AppHeader } from "@/components/AppHeader";
import { AuctionList } from "@/components/AuctionList";
import { AuctionDetailDialog } from "@/components/AuctionDetailDialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Gavel, Clock } from "lucide-react";
import { AUCTION_STATUS } from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";
import { useBlockHeight } from "@/hooks/useBlockHeight";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Dashboard() {
  const { address } = useWallet();
  const { auctions } = useAuctionStore();
  const { currentBlock } = useBlockHeight();

  // Detail dialog state (replaces old bid-only dialog)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);

  // Calculate stats
  const activeAuctions = auctions?.filter(a => a.status === AUCTION_STATUS.COMMIT_PHASE)?.length || 0;
  const totalAuctions = auctions?.length || 0;

  // Handle auction selection (view details)
  const handleSelectAuction = (auction) => {
    setSelectedAuction(auction);
    setDetailDialogOpen(true);
  };

  // Handle bid button click (opens detail dialog in bid mode)
  const handleBidClick = (auction) => {
    setSelectedAuction(auction);
    setDetailDialogOpen(true);
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
            currentBlock={currentBlock}
          />
        </motion.section>
      </main>

      {/* Auction Detail Dialog */}
      <AuctionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        auction={selectedAuction}
        currentBlock={currentBlock}
      />
    </div>
  );
}
