// Aloe - Create Auction Page
// Form for creating new sealed-bid auctions

import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { CreateAuctionForm } from "@/components/CreateAuctionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function CreateAuction() {
  const router = useRouter();

  // Handle successful auction creation
  const handleSuccess = (auctionId) => {
    // Redirect to dashboard after short delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans`}
    >
      {/* Shared App Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Back Link */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Page Title */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold">Create New Auction</h1>
          <p className="mt-2 text-muted-foreground">
            Set up a sealed-bid auction with cryptographic privacy on Aleo.
          </p>
        </motion.div>

        {/* Form and Info Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <CreateAuctionForm onSuccess={handleSuccess} />
          </motion.div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* How Commit-Reveal Works */}
            <motion.div
              className="rounded-lg border border-border p-6 hover:border-emerald-500/50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="mb-4 font-semibold">How Sealed Bids Work</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Commit Phase</p>
                    <p>
                      Bidders submit cryptographic commitments of their bids.
                      The actual bid amounts are hidden.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Reveal Phase</p>
                    <p>
                      After commit deadline, bidders reveal their original bids.
                      ZK proofs verify authenticity.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Settlement</p>
                    <p>
                      Highest valid bid wins. Losers get deposits back. Winner
                      pays their bid amount.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              className="rounded-lg border border-border p-6 hover:border-emerald-500/50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="mb-4 font-semibold">Tips for Auctioneers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Set commit duration long enough for bidders to discover and
                    participate (~1 hour minimum).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Reveal duration should give bidders time to reveal, but not
                    too long (~30 min is typical).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Minimum bid should cover your transaction costs and reserve
                    price.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    One block ≈ 10 seconds on Aleo testnet. 360 blocks ≈ 1 hour.
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>

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
