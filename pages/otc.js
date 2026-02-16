// Aloe - OTC Trading Page
// Private peer-to-peer trades with atomic escrow
// Will be wired to zkotc.aleo contract once built

import { Geist, Geist_Mono } from "next/font/google";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AppHeader } from "@/components/AppHeader";
import { DealList } from "@/components/DealList";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  TrendingUp,
  User,
  Plus,
} from "lucide-react";
import { useDealStore } from "@/store/dealStore";
import { DEAL_STATUS } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function OTC() {
  const { address } = useWallet();
  const { deals } = useDealStore();

  // Calculate stats
  const activeDeals = deals?.filter((d) => d.status === DEAL_STATUS.OPEN)?.length || 0;
  const totalDeals = deals?.length || 0;
  const myDeals = deals?.filter((d) => d.maker === address)?.length || 0;

  // Handle deal selection (view details)
  const handleSelectDeal = (deal) => {
    // TODO: open detail dialog (same pattern as auction bid dialog)
    console.log("[Aloe] Deal selected:", deal.id);
  };

  // Handle deal acceptance
  const handleAcceptDeal = (deal) => {
    // TODO: wire to zkotc.aleo contract
    console.log("[Aloe] Accept deal:", deal.id);
  };

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans`}
    >
      {/* Shared App Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">OTC Trading</h1>
          <p className="mt-1 text-muted-foreground">
            Private peer-to-peer trades with atomic escrow settlement
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="mb-8 grid gap-4 sm:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Active Deals */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{activeDeals}</p>
              </div>
            </div>
          </div>

          {/* Total Volume */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold">{totalDeals}</p>
              </div>
            </div>
          </div>

          {/* Your Deals */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Deals</p>
                <p className="text-2xl font-bold">{myDeals}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Deals Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Deals</h2>
            <Button className="gap-2" disabled>
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </div>

          <DealList
            onSelect={handleSelectDeal}
            onAccept={handleAcceptDeal}
          />
        </motion.section>

        {/* How OTC Works — info section */}
        <motion.section
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="rounded-lg border border-border p-6">
            <h3 className="mb-4 font-semibold">How Private OTC Trading Works</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-500">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Create Deal</p>
                  <p className="text-xs text-muted-foreground">
                    Maker posts a private trade offer with asset, amount, and price.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-500">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Atomic Escrow</p>
                  <p className="text-xs text-muted-foreground">
                    Credits are locked in ZK escrow. Neither party can cheat.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-500">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Private Settlement</p>
                  <p className="text-xs text-muted-foreground">
                    Trade settles privately. No one knows the terms but the parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
