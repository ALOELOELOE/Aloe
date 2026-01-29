// Aloe - Home Page
// Displays auction list and navigation

import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { AuctionList } from "@/components/AuctionList";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans`}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Aloe</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link href="/create">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Auction
              </Button>
            </Link>
            <WalletConnect />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Private Sealed-Bid Auctions
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Aloe enables trustless auctions with cryptographic privacy. Bids are
            sealed using zero-knowledge proofs on the Aleo blockchain - no one
            knows your bid until reveal time.
          </p>
        </section>

        {/* How it Works */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                1
              </div>
              <h3 className="mb-2 font-semibold">Create Auction</h3>
              <p className="text-sm text-muted-foreground">
                Set your item, minimum bid, and timing for commit and reveal
                phases.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                2
              </div>
              <h3 className="mb-2 font-semibold">Place Sealed Bids</h3>
              <p className="text-sm text-muted-foreground">
                Bidders submit encrypted commitments. Nobody can see bid
                amounts.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                3
              </div>
              <h3 className="mb-2 font-semibold">Reveal & Winner</h3>
              <p className="text-sm text-muted-foreground">
                Bidders reveal their bids. Highest bid wins. ZK proofs ensure
                fairness.
              </p>
            </div>
          </div>
        </section>

        {/* Auctions Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Active Auctions</h2>
            <Link href="/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Auction
              </Button>
            </Link>
          </div>

          <AuctionList />
        </section>
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
