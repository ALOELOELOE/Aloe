// Aloe - Landing Page
// Marketing hero page with 3D visuals, auction use-case showcase, and privacy value props

import { useState, useCallback } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { UseCaseShowcase } from "@/components/UseCaseShowcase";
import { PrivacyShowcase } from "@/components/PrivacyShowcase";
import { ArrowRight } from "lucide-react";

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
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black font-sans text-white overflow-x-hidden`}
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
        className="relative min-h-screen flex items-center"
        style={{ contain: "layout style paint" }}
      >
        {/* 3D Scene Background */}
        <div className="absolute inset-0">
          <HeroScene onLoaded={handleLoaded} />
        </div>

        {/* Hero Content — pinned to left side, gem occupies right */}
        <div className="relative z-10 w-full px-6 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            <h1
              className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
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
      {/* Use Cases — interactive tabbed showcase with GSAP */}
      {/* ============================================ */}
      <UseCaseShowcase />

      {/* ============================================ */}
      {/* Why Privacy Section - 3 columns with staggered entrance */}
      {/* ============================================ */}
      <PrivacyShowcase />

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800 bg-black py-12">
        <div className="mx-auto max-w-6xl px-4">
          {/* Top row — logo, nav columns, CTA */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src="/logo-removebg-preview.png"
                  alt="Aloe"
                  width={24}
                  height={24}
                />
                <span className="text-sm font-semibold text-white">Aloe</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-[220px]">
                Privacy-preserving auction infrastructure powered by
                zero-knowledge proofs on Aleo.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Product
              </p>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Sealed-Bid Auctions
                  </Link>
                </li>
                <li>
                  <Link href="/nft" className="hover:text-white transition-colors">
                    NFT Auctions
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="hover:text-white transition-colors">
                    Create Auction
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources links */}
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Resources
              </p>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>
                  <a
                    href="https://aleo.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Aleo Network
                  </a>
                </li>
                <li>
                  <a
                    href="https://developer.aleo.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Aleo Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* CTA column */}
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Get Started
              </p>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  Launch App
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-neutral-600 mt-3">
                No sign-up required. Connect your Aleo wallet to start.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-800 mb-6" />

          {/* Bottom row — copyright + built on */}
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-xs text-neutral-600">
            <span>&copy; {new Date().getFullYear()} Aloe. All rights reserved.</span>
            <span>
              Built on{" "}
              <a
                href="https://aleo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white transition-colors"
              >
                Aleo
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
