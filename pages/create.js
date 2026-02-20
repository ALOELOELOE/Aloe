// Aloe - Create Auction Page
// Form for creating new sealed-bid auctions

import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { CreateAuctionForm } from "@/components/CreateAuctionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Eye, Trophy } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Auction lifecycle steps shown in the sidebar
const LIFECYCLE_STEPS = [
  {
    num: "1",
    icon: Lock,
    title: "Commit",
    desc: "Bidders submit cryptographic commitments. Amounts stay hidden.",
  },
  {
    num: "2",
    icon: Eye,
    title: "Reveal",
    desc: "Bidders reveal original bids. ZK proofs verify authenticity.",
  },
  {
    num: "3",
    icon: Trophy,
    title: "Settle",
    desc: "Highest bid wins. Losers reclaim deposits. Winner pays exact bid.",
  },
];

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
      className={`${geistSans.variable} ${geistMono.variable} h-screen bg-black font-sans relative overflow-hidden`}
    >
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-emerald-900/40 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Full-height flex layout */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Shared App Header */}
        <AppHeader />

        {/* Main Content — centered vertically in remaining space */}
        <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center py-4">
          {/* Page Header */}
          <motion.div
            className="flex items-center gap-3 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-none">Create New Auction</h1>
              <p className="text-xs text-neutral-500 mt-1">Sealed-bid auction with cryptographic privacy on Aleo</p>
            </div>
          </motion.div>

          {/* Unified content panel — auto height, not stretched */}
          <motion.div
            className="rounded-2xl border border-neutral-800/60 bg-neutral-950/60 backdrop-blur-xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left — Form */}
              <div className="flex-1 p-5 sm:p-6">
                <CreateAuctionForm onSuccess={handleSuccess} />
              </div>

              {/* Right — Info sidebar (hidden below lg) */}
              <div className="hidden lg:block w-[320px] shrink-0 border-l border-neutral-800/40 bg-black/20 p-5">
                {/* How it works */}
                <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">How it works</h3>
                <div className="space-y-3">
                  {LIFECYCLE_STEPS.map((step, i) => (
                    <motion.div
                      key={step.num}
                      className="flex gap-2.5"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        <step.icon className="h-3 w-3 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white leading-none mb-0.5">{step.title}</p>
                        <p className="text-[11px] text-neutral-500 leading-snug">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-800/40 my-4" />

                {/* Tips */}
                <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2.5">Quick tips</h3>
                <ul className="space-y-1.5 text-[11px] text-neutral-500 leading-snug">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-px shrink-0">&#8226;</span>
                    <span>Commit: ~1 hr minimum for bidder discovery</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-px shrink-0">&#8226;</span>
                    <span>Reveal: ~30 min is healthy for settlement</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-px shrink-0">&#8226;</span>
                    <span>Min bid covers gas and acts as reserve price</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-px shrink-0">&#8226;</span>
                    <span>~10s/block, so 360 blocks ≈ 1 hour</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Footer — pinned at bottom */}
        <footer className="shrink-0 border-t border-neutral-800/50 bg-black/40 backdrop-blur-md py-2">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-neutral-600">
            Built on{" "}
            <a
              href="https://aleo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-600 hover:text-emerald-400 transition-colors"
            >
              Aleo
            </a>{" "}
            — Privacy by default
          </div>
        </footer>
      </div>
    </div>
  );
}
