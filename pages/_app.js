// Main App component with providers
// Geist font variables are applied to <html> so portaled content (Radix dialogs,
// popovers) inherits the correct font — portals render under <body>, not page wrappers

import { useEffect } from "react";
import "@/styles/globals.css";
import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "@/providers/WalletProvider";
import { Toaster } from "@/components/ui/sonner";

// Load fonts once at the app level
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * App wrapper component
 * Provides wallet context, fonts, and toast notifications to all pages
 */
export default function App({ Component, pageProps }) {
  // Apply font variable classes to <html> so Radix portals (dialogs, popovers)
  // inherit Geist fonts — they render under <body>, outside page-level wrappers
  useEffect(() => {
    document.documentElement.classList.add(geistSans.variable, geistMono.variable);
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/logo-removebg-preview.png" />
        <title>Aloe | Privacy-Preserving Auction Primitive</title>
      </Head>
      <WalletProvider>
        <Component {...pageProps} />
        <Toaster richColors position="bottom-right" />
      </WalletProvider>
    </>
  );
}
