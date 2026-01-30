// Aloe - Landing Page
// Marketing hero page with 3D visuals and loading screen

import { useState, useCallback } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
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

          {/* Launch App Button */}
          <Link href="/dashboard">
            <Button
              size="sm"
              className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* 3D Scene Background */}
        <div className="absolute inset-0">
          <HeroScene onLoaded={handleLoaded} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 w-full">
          <div className="max-w-xl">
            <motion.h1
              className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Private Sealed-
              <br />
              Bid Auctions
            </motion.h1>

            <motion.p
              className="mb-8 text-lg text-gray-400 md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              Trustless auctions with cryptographic privacy.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-emerald-500 bg-transparent px-6 text-emerald-400 hover:bg-emerald-500/10"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 bg-emerald-500 px-6 text-black hover:bg-emerald-400"
                >
                  Launch App
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>
            Built on{" "}
            <a
              href="https://aleo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400 hover:underline"
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
