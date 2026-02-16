// Aloe - Landing Page
// Marketing hero page with 3D visuals, auction use-case showcase, and privacy value props

import { useState, useCallback } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ArrowRight,
  Gavel,
  ImageIcon,
  Briefcase,
  ShieldCheck,
  EyeOff,
  Scale,
} from "lucide-react";

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

// Use-case cards — same auction primitive, different applications
const USE_CASE_CARDS = [
  {
    icon: Gavel,
    title: "Sealed-Bid Auctions",
    description: "Bid without revealing your hand. ZK-committed bids prevent sniping and information leakage.",
    privacy: "Eliminates bid sniping & front-running",
    href: "/dashboard",
    status: "live",
  },
  {
    icon: ImageIcon,
    title: "NFT Auctions",
    description: "Private NFT sales with sealed bids. Collectors bid without exposing portfolio or bid history.",
    privacy: "Protects portfolio exposure & bid tracking",
    href: "/nft",
    status: "coming_soon",
  },
  {
    icon: Briefcase,
    title: "Procurement / RFQ",
    description: "Reverse auctions for sourcing. Suppliers submit sealed quotes — lowest wins.",
    privacy: "Prevents price collusion & bid-rigging",
    href: "/procurement",
    status: "coming_soon",
  },
];

// Why privacy section — three value pillars
const PRIVACY_PILLARS = [
  {
    icon: ShieldCheck,
    title: "No Front-Running",
    description:
      "Your bids are hidden until the reveal phase. No one can see your bid and outbid you by $1.",
  },
  {
    icon: EyeOff,
    title: "No Information Leakage",
    description:
      "Bid amounts, bidder identity, and strategy stay private. Only you know your position.",
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
  // Unmount LoadingScreen after its exit animation finishes
  // to kill Framer Motion's global requestAnimationFrame loop
  const [loadingDone, setLoadingDone] = useState(false);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
    // LoadingScreen waits 500ms then plays a 600ms exit — unmount after that
    setTimeout(() => setLoadingDone(true), 1500);
  }, []);

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black font-sans text-white`}
    >
      {/* Loading Screen — unmounted after exit animation to free FM's rAF loop */}
      {!loadingDone && <LoadingScreen isLoaded={isLoaded} />}

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
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
              href="#use-cases"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Use Cases
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
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ contain: "layout style paint" }}
      >
        {/* 3D Scene Background */}
        <div className="absolute inset-0">
          <HeroScene onLoaded={handleLoaded} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 w-full">
          <div className="max-w-2xl">
            <h1
              className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(30px)",
                transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
              }}
            >
              Privacy-Preserving
              <br />
              Auction Primitive
            </h1>

            <p
              className="mb-8 text-lg text-gray-400 md:text-xl max-w-lg"
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
              }}
            >
              A composable sealed-bid auction protocol on Aleo. One primitive
              powers NFT sales, procurement, token launches — all protected by
              zero-knowledge proofs.
            </p>

            <div
              className="flex flex-wrap gap-4"
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
              }}
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
              <Link href="#use-cases">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-base border-gray-700 text-white hover:bg-white/10"
                >
                  Explore Use Cases
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Use Cases Section — same primitive, different applications */}
      {/* ============================================ */}
      <section
        id="use-cases"
        className="relative z-10 bg-black py-24"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 600px" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              One Primitive, Many Applications
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              The same composable auction contract powers every use case.
              Different frontends, same privacy guarantees.
            </p>
          </div>

          {/* Use Case Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASE_CARDS.map((card) => {
              const Icon = card.icon;
              const isLive = card.status === "live";

              return (
                <div key={card.title}>
                  <Link href={card.href}>
                    <Card className="group h-full border-gray-800 bg-gray-950 hover:border-emerald-500/50 transition-colors duration-200 cursor-pointer">
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Why Privacy Section - 3 columns */}
      {/* ============================================ */}
      <section
        id="privacy"
        className="relative z-10 bg-gray-950 py-24"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 500px" }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Why Privacy Matters
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Public blockchains expose everything. Aloe uses Aleo&apos;s
              zero-knowledge proofs to keep your auction activity private.
            </p>
          </div>

          {/* Privacy Pillars */}
          <div className="grid gap-8 md:grid-cols-3">
            {PRIVACY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-gray-400">{pillar.description}</p>
                </div>
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
                Aloe — Privacy-Preserving Auction Primitive
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
