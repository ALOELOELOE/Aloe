// Aloe - Auctions Page
// Displays auction list using the shared AuctionDetailDialog (same as dashboard)

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { AuctionList } from "@/components/AuctionList";
import { AuctionDetailDialog } from "@/components/AuctionDetailDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useBlockHeight } from "@/hooks/useBlockHeight";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Auctions() {
  const { currentBlock } = useBlockHeight();

  // Detail dialog state — uses the full-featured AuctionDetailDialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);

  // Handle auction selection (view details)
  const handleSelectAuction = (auction) => {
    setSelectedAuction(auction);
    setDetailDialogOpen(true);
  };

  // Handle bid button click (opens detail dialog — bidding is handled inside)
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
            currentBlock={currentBlock}
          />
        </motion.section>
      </main>

      {/* Auction Detail Dialog — full-featured: bid, reveal, settle, refund */}
      <AuctionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        auction={selectedAuction}
        currentBlock={currentBlock}
      />

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
