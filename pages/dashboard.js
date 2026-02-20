// Aloe - Dashboard
// Main app interface for viewing and managing auctions

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AppHeader } from "@/components/AppHeader";
import { AuctionList } from "@/components/AuctionList";
import { AuctionDetailDialog } from "@/components/AuctionDetailDialog";
import { ImportAuctionDialog } from "@/components/ImportAuctionDialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Gavel, Clock, Download } from "lucide-react";
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
  const router = useRouter();
  const { address } = useWallet();
  const { auctions, purgeOldContracts, purgeIncomplete } = useAuctionStore();
  const { currentBlock } = useBlockHeight();

  // Purge stale data on mount: old contract versions + incomplete imports
  useEffect(() => {
    purgeOldContracts();
    purgeIncomplete();
  }, [purgeOldContracts, purgeIncomplete]);

  // Detail dialog state (replaces old bid-only dialog)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPrefillId, setImportPrefillId] = useState("");

  // Auto-import from URL param: ?import=<auctionId>
  useEffect(() => {
    const importId = router.query.import;
    if (importId && typeof importId === "string") {
      // Pre-fill and open import dialog
      setImportPrefillId(importId);
      setImportDialogOpen(true);
      // Clear the URL param without a full navigation
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [router.query.import, router]);

  // Helper: determine if an auction is still live (commit or reveal phase)
  // Status 1 (COMMIT_PHASE) covers both commit and reveal on-chain,
  // so we use block height + deadlines to differentiate
  const isLiveAuction = (auction) => {
    if (auction.status === AUCTION_STATUS.ENDED || auction.status === AUCTION_STATUS.CANCELLED) return false;
    if (auction.status === AUCTION_STATUS.CREATED) return true;
    // Status 1 — check block heights to see if we're past both deadlines
    if (currentBlock && auction.revealDeadline && currentBlock > auction.revealDeadline) return false;
    if (currentBlock && auction.commitDeadline && currentBlock > auction.commitDeadline) {
      // Past commit deadline — still live if within reveal window
      if (auction.revealDeadline && currentBlock <= auction.revealDeadline) return true;
      return false;
    }
    return true; // In commit phase or block height unknown
  };

  const isEndedAuction = (auction) => !isLiveAuction(auction);

  // Calculate stats
  const activeAuctions = auctions?.filter(isLiveAuction)?.length || 0;
  const endedAuctions = auctions?.filter(isEndedAuction)?.length || 0;

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
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black font-sans relative overflow-hidden`}
    >
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-emerald-900/40 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Shared App Header */}
        <AppHeader />

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
          {/* Page Header */}
          <motion.div
            className="mb-10 sm:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 mb-6 text-sm text-emerald-400 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Testnet Aleo
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Dashboard
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl">
              Browse and participate in private sealed-bid auctions securely on the Aleo network.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="mb-12 grid gap-6 sm:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {[
              {
                title: "Active Auctions",
                value: activeAuctions,
                icon: Gavel,
                color: "emerald",
                valueClass: "text-white"
              },
              {
                title: "Ended",
                value: endedAuctions,
                icon: LayoutDashboard,
                color: "emerald",
                valueClass: "text-white"
              },
              {
                title: "Status",
                value: address ? "Connected" : "Disconnected",
                icon: Clock,
                color: address ? "emerald" : "neutral",
                valueClass: address ? "text-white" : "text-neutral-500"
              }
            ].map((stat, i) => {
              const Icon = stat.icon;
              const isEmerald = stat.color === "emerald";
              
              return (
                <motion.div
                  key={stat.title}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-black/40 p-6 backdrop-blur-xl group hover:border-emerald-500/30 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-400 mb-1">{stat.title}</p>
                      <p className={`text-3xl font-bold tracking-tight ${stat.valueClass}`}>
                        {stat.value}
                      </p>
                    </div>
                    
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                      isEmerald 
                        ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:ring-emerald-500/40" 
                        : "bg-neutral-500/10 text-neutral-500 ring-1 ring-neutral-500/20 group-hover:bg-neutral-500/20 group-hover:ring-neutral-500/40"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Live Auctions Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-3xl border border-neutral-800/50 bg-neutral-950/30 p-4 sm:p-8 backdrop-blur-sm"
          >
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white mb-1">Live Auctions</h2>
                  <p className="text-sm text-neutral-400">Active auctions accepting bids or in reveal phase</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-neutral-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-neutral-300 hover:text-emerald-400 h-11 px-5 rounded-xl transition-all"
                  onClick={() => {
                    setImportPrefillId("");
                    setImportDialogOpen(true);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Import
                </Button>
                <Link href="/create">
                  <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
                    <Plus className="h-4 w-4" />
                    New Auction
                  </Button>
                </Link>
              </div>
            </div>

            <AuctionList
              onSelect={handleSelectAuction}
              onBid={handleBidClick}
              filter={isLiveAuction}
              currentBlock={currentBlock}
              emptyTitle="No Live Auctions"
              emptyDescription="All auctions have ended. Create a new one to get started!"
            />
          </motion.section>

          {/* Ended Auctions Section */}
          {endedAuctions > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-8 rounded-3xl border border-neutral-800/30 bg-neutral-950/20 p-4 sm:p-8 backdrop-blur-sm"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-400 mb-1">Ended Auctions</h2>
                <p className="text-sm text-neutral-500">Settled, cancelled, or expired auctions</p>
              </div>

              <AuctionList
                onSelect={handleSelectAuction}
                onBid={handleBidClick}
                filter={isEndedAuction}
                currentBlock={currentBlock}
              />
            </motion.section>
          )}
        </main>
      </div>

      {/* Auction Detail Dialog */}
      <AuctionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        auction={selectedAuction}
        currentBlock={currentBlock}
      />

      {/* Import Auction Dialog */}
      <ImportAuctionDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        prefillId={importPrefillId}
      />
    </div>
  );
}
