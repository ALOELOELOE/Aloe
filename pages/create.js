// Aloe - Create Auction Page
// Form for creating new sealed-bid auctions

import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { WalletConnect } from "@/components/WalletConnect";
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
    // Redirect to home after short delay
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans`}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-removebg-preview.png" alt="Aloe" width={32} height={32} />
            <span className="text-xl font-bold">Aloe</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <WalletConnect />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Auctions
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Auction</h1>
          <p className="mt-2 text-muted-foreground">
            Set up a sealed-bid auction with cryptographic privacy on Aleo.
          </p>
        </div>

        {/* Form and Info Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div>
            <CreateAuctionForm onSuccess={handleSuccess} />
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* How Commit-Reveal Works */}
            <div className="rounded-lg border border-border p-6">
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
            </div>

            {/* Tips */}
            <div className="rounded-lg border border-border p-6">
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
            </div>
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
