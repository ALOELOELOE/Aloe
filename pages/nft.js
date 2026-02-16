// Aloe - NFT Auctions (Coming Soon — Wave 6)
// NFT auction skin using the same aloe_auction_v3.aleo contract
// Different UI presentation, same sealed-bid privacy guarantees

import { Geist, Geist_Mono } from "next/font/google";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, ShieldCheck } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function NFTAuctions() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans`}
    >
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-16">
        <motion.div
          className="mx-auto max-w-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <ImageIcon className="h-8 w-8" />
          </div>

          {/* Title + Badge */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <h1 className="text-3xl font-bold">NFT Auctions</h1>
            <Badge variant="outline" className="text-sm">
              Coming Soon
            </Badge>
          </div>

          {/* Description */}
          <p className="mb-8 text-muted-foreground">
            Private NFT sales powered by the same sealed-bid auction primitive.
            Collectors bid without exposing their portfolio or bid history —
            all verified by zero-knowledge proofs on Aleo.
          </p>

          {/* Privacy Value Card */}
          <div className="rounded-lg border border-border p-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold">Privacy Value</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Same sealed-bid guarantees — bids hidden until reveal phase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Portfolio holdings stay private — no one can track your NFT collection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>One composable contract — NFT auctions are a skin on aloe_auction_v3.aleo</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
