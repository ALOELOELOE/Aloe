// Aloe - Token Launches (Coming Soon)
// Fair token distribution with hidden allocation sizes

import { Geist, Geist_Mono } from "next/font/google";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Launches() {
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
            <Rocket className="h-8 w-8" />
          </div>

          {/* Title + Badge */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <h1 className="text-3xl font-bold">Token Launches</h1>
            <Badge variant="outline" className="text-sm">
              Coming Soon
            </Badge>
          </div>

          {/* Description */}
          <p className="mb-8 text-muted-foreground">
            Fair token distribution with hidden allocation sizes. No more whale
            sniping or unfair advantage — every participant gets a fair shot
            through zero-knowledge proof verified allocations.
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
                <span>Allocation sizes are hidden — whales can&apos;t dominate launches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Participation is private — no wallet tracking or front-running</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>ZK proofs ensure fair distribution without revealing individual amounts</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
