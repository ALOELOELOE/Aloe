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
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-16">
          {/* Back Link */}
          <motion.div
            className="mb-10 sm:mb-12"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Page Title */}
          <motion.div
            className="mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Create New Auction</h1>
            <p className="text-lg text-neutral-400 max-w-2xl">
              Set up a sealed-bid auction with cryptographic privacy on Aleo.
            </p>
          </motion.div>

          {/* Form and Info Grid */}
          <div className="grid gap-12 lg:gap-16 lg:grid-cols-[1fr_400px]">
            {/* Form Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <CreateAuctionForm onSuccess={handleSuccess} />
            </motion.div>

            {/* Info Sidebar Area */}
            <div className="space-y-8">
              {/* How Commit-Reveal Works - Glassmorphism */}
              <motion.div
                className="rounded-3xl border border-neutral-800/60 bg-black/40 backdrop-blur-xl p-8 transition-colors hover:border-emerald-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="mb-6 text-xl font-semibold text-white tracking-tight">How Sealed Bids Work</h3>
                <div className="space-y-6 text-sm text-neutral-400">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-500 ring-1 ring-emerald-500/20">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">Commit Phase</p>
                      <p className="leading-relaxed">
                        Bidders submit cryptographic commitments of their bids.
                        The actual bid amounts are completely hidden.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-500 ring-1 ring-emerald-500/20">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">Reveal Phase</p>
                      <p className="leading-relaxed">
                        After the commit deadline passes, bidders reveal their original bids.
                        ZK proofs mathematically verify their authenticity.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-500 ring-1 ring-emerald-500/20">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">Settlement</p>
                      <p className="leading-relaxed">
                        The highest valid bid wins. Losers get their deposits back. The winner
                        pays their exact bid amount.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tips - Glassmorphism */}
              <motion.div
                className="rounded-3xl border border-neutral-800/60 bg-black/40 backdrop-blur-xl p-8 transition-colors hover:border-emerald-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className="mb-6 text-xl font-semibold text-white tracking-tight">Tips for Auctioneers</h3>
                <ul className="space-y-4 text-sm text-neutral-400 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>
                      Set the commit duration long enough for bidders to discover and
                      participate (~1 hour minimum timeframe).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>
                      The reveal duration should give bidders comfortable time to come back and reveal, but not
                      so long that settlement stalls (~30 mins is healthy).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>
                      The minimum bid should comfortably cover your gas costs and effectively act as your reserve
                      price.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>
                      Aleo testnet averages ≈ 10 seconds per block. Therefore, 360 blocks roughly equals 1 hour of real time.
                    </span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800/50 bg-black/40 backdrop-blur-md py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500">
          <p>
            Built on{" "}
            <a
              href="https://aleo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Aleo
            </a>{" "}
            - Privacy purely by default
          </p>
        </div>
      </footer>
    </div>
  );
}
