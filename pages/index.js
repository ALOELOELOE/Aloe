// Aloe - Landing Page
// Marketing hero page with 3D visuals, module showcase, and privacy value props

import { useState, useCallback } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ArrowRight,
  Gavel,
  ArrowLeftRight,
  Rocket,
  ImageIcon,
  Building2,
  ShieldCheck,
  EyeOff,
  Scale,
} from "lucide-react";
import { MODULES } from "@/lib/constants";

// Dynamically import the 3D scene to avoid SSR issues
const HeroScene = dynamic(
  () => import("@/components/HeroScene").then((mod) => mod.HeroScene),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Module card data — icon, description, and privacy value for each module
const MODULE_CARDS = [
  {
    key: "AUCTIONS",
    icon: Gavel,
    title: "Sealed-Bid Auctions",
    description: "Bid without revealing your hand. ZK-committed bids prevent sniping.",
    privacy: "Eliminates bid sniping & information leakage",
  },
  {
    key: "OTC",
    icon: ArrowLeftRight,
    title: "OTC Trading",
    description: "Private peer-to-peer trades with atomic escrow settlement.",
    privacy: "Prevents front-running & order flow exposure",
  },
  {
    key: "LAUNCHES",
    icon: Rocket,
    title: "Token Launches",
    description: "Fair token distribution with hidden allocation sizes.",
    privacy: "Stops whale sniping & unfair allocation",
  },
  {
    key: "NFT",
    icon: ImageIcon,
    title: "NFT Marketplace",
    description: "Trade NFTs without exposing your portfolio or bid history.",
    privacy: "Protects portfolio exposure & bid tracking",
  },
  {
    key: "RWA",
    icon: Building2,
    title: "RWA Exchange",
    description: "Private ownership transfer for real-world assets.",
    privacy: "Secures valuation privacy & ownership data",
  },
];

// Why privacy section — three value pillars
const PRIVACY_PILLARS = [
  {
    icon: ShieldCheck,
    title: "No Front-Running",
    description:
      "Your orders are hidden until execution. No one can see your trades and race ahead.",
  },
  {
    icon: EyeOff,
    title: "No Information Leakage",
    description:
      "Trade size, intent, and strategy stay private. Only you know your position.",
  },
  {
    icon: Scale,
    title: "Fair by Design",
    description:
      "ZK proofs ensure honest settlement. Cryptographic guarantees replace trust.",
  },
];

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black font-sans text-white`}
    >
      {/* Loading Screen */}
      <LoadingScreen isLoaded={isLoaded} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-removebg-preview.png"
              alt="Aloe"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold">Aloe</span>
          </Link>

          {/* Nav Links + Launch App */}
          <nav className="flex items-center gap-4">
            <Link
              href="#modules"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Modules
            </Link>
            <Link
              href="#privacy"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Why Privacy
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
              >
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================ */}
      {/* Hero Section - Full Screen with 3D background */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* 3D Scene Background */}
        <div className="absolute inset-0">
          <HeroScene onLoaded={handleLoaded} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 w-full">
          <div className="max-w-2xl">
            <motion.h1
              className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Private Exchange
              <br />
              Protocol
            </motion.h1>

            <motion.p
              className="mb-8 text-lg text-gray-400 md:text-xl max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              Trade without revealing your hand. Auctions, OTC, launches — all
              protected by zero-knowledge proofs.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 bg-emerald-500 px-8 py-6 text-base text-black hover:bg-emerald-400"
                >
                  Launch App
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#modules">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-base border-gray-700 text-white hover:bg-white/10"
                >
                  Explore Modules
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Modules Section - Cards grid */}
      {/* ============================================ */}
      <section id="modules" className="relative z-10 bg-black py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Exchange Modules
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Every trade type has a privacy problem. Aloe solves each one with
              purpose-built ZK circuits on Aleo.
            </p>
          </motion.div>

          {/* Module Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULE_CARDS.map((card, index) => {
              const mod = MODULES[card.key];
              const Icon = card.icon;
              const isLive = mod?.status === "live";

              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link href={mod?.path || "#"}>
                    <Card className="group h-full border-gray-800 bg-gray-950 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 cursor-pointer">
                      <CardContent className="p-6">
                        {/* Icon + Status */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge
                            variant={isLive ? "default" : "outline"}
                            className={
                              isLive
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "border-gray-700 text-gray-500"
                            }
                          >
                            {isLive ? "Live" : "Coming Soon"}
                          </Badge>
                        </div>

                        {/* Title + Description */}
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {card.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3">
                          {card.description}
                        </p>

                        {/* Privacy value */}
                        <p className="text-xs text-emerald-400/80">
                          {card.privacy}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Why Privacy Section - 3 columns */}
      {/* ============================================ */}
      <section id="privacy" className="relative z-10 bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Why Privacy Matters
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Public blockchains expose everything. Aloe uses Aleo&apos;s
              zero-knowledge proofs to keep your trading activity private.
            </p>
          </motion.div>

          {/* Privacy Pillars */}
          <div className="grid gap-8 md:grid-cols-3">
            {PRIVACY_PILLARS.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.15 }}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-gray-400">{pillar.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 bg-black py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo-removebg-preview.png"
                alt="Aloe"
                width={24}
                height={24}
              />
              <span className="text-sm font-medium text-gray-400">
                Aloe — Private Exchange Protocol
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                Launch App
              </Link>
              <a
                href="https://aleo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Built on Aleo
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
