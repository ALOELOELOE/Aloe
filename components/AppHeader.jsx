// Aloe - Shared App Header
// Navigation header used across all app pages (dashboard, auctions, otc, etc.)
// Provides module links, create dropdown, and wallet connect

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronDown,
  Gavel,
  ArrowLeftRight,
  Rocket,
  ImageIcon,
  Building2,
} from "lucide-react";
import { MODULES } from "@/lib/constants";

// Icon map for each module
const MODULE_ICONS = {
  auctions: Gavel,
  otc: ArrowLeftRight,
  launches: Rocket,
  nft: ImageIcon,
  rwa: Building2,
};

/**
 * AppHeader - Shared navigation header for all app pages
 * Shows logo, module nav links, create dropdown, and wallet connect
 */
export function AppHeader() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  // Determine active module from current path
  const currentPath = router.pathname;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo-removebg-preview.png"
            alt="Aloe"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold">Aloe</span>
        </Link>

        {/* Module Navigation — horizontal tabs */}
        <nav className="hidden md:flex items-center gap-1 mx-4">
          {Object.values(MODULES).map((mod) => {
            const isActive =
              currentPath === mod.path ||
              (mod.id === "auctions" && currentPath === "/auctions") ||
              (mod.id === "auctions" && currentPath === "/create");
            const isComingSoon = mod.status === "coming_soon";

            return (
              <Link key={mod.id} href={mod.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-sm"
                >
                  {mod.name}
                  {isComingSoon && (
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0"
                    >
                      Soon
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side — Create Dropdown + Wallet */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Create Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setCreateOpen(!createOpen)}
              onBlur={() => setTimeout(() => setCreateOpen(false), 150)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="h-3 w-3" />
            </Button>

            {/* Dropdown Menu */}
            {createOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg">
                <Link
                  href="/create"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setCreateOpen(false)}
                >
                  <Gavel className="h-4 w-4 text-emerald-500" />
                  Create Auction
                </Link>
                <Link
                  href="/otc"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setCreateOpen(false)}
                >
                  <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
                  Create OTC Deal
                </Link>
                {/* Future: more create options */}
                <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
                  <Rocket className="h-4 w-4" />
                  Launch Token
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] px-1.5 py-0"
                  >
                    Soon
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Connect */}
          <WalletConnect />
        </div>
      </div>

      {/* Mobile Navigation — horizontal scroll */}
      <div className="md:hidden border-t border-border">
        <div className="px-6 flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {Object.values(MODULES).map((mod) => {
            const isActive =
              currentPath === mod.path ||
              (mod.id === "auctions" && currentPath === "/auctions") ||
              (mod.id === "auctions" && currentPath === "/create");

            return (
              <Link key={mod.id} href={mod.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap text-xs"
                >
                  {mod.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
