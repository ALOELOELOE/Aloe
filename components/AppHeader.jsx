// Aloe - Shared App Header
// Navigation header for auction pages — logo, nav links, create button, wallet connect

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Gavel,
  LayoutDashboard,
} from "lucide-react";

// Navigation links — auction-focused
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create", icon: Plus },
];

/**
 * AppHeader - Shared navigation header for all app pages
 * Shows logo, auction nav links, and wallet connect
 */
export function AppHeader() {
  const router = useRouter();
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

        {/* Navigation — auction-focused links */}
        <nav className="hidden md:flex items-center gap-1 mx-4">
          {NAV_LINKS.map((link) => {
            const isActive =
              currentPath === link.href ||
              (link.href === "/dashboard" && currentPath === "/auctions");
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-sm"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side — Create Auction + Wallet */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Create Auction Button */}
          <Link href="/create">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Gavel className="h-4 w-4" />
              <span className="hidden sm:inline">Create Auction</span>
            </Button>
          </Link>

          {/* Wallet Connect */}
          <WalletConnect />
        </div>
      </div>

      {/* Mobile Navigation — horizontal scroll */}
      <div className="md:hidden border-t border-border">
        <div className="px-6 flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {NAV_LINKS.map((link) => {
            const isActive =
              currentPath === link.href ||
              (link.href === "/dashboard" && currentPath === "/auctions");

            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap text-xs"
                >
                  {link.label}
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
