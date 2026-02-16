// Main App component with providers

import "@/styles/globals.css";
import Head from "next/head";
import { WalletProvider } from "@/providers/WalletProvider";
import { Toaster } from "@/components/ui/sonner";

/**
 * App wrapper component
 * Provides wallet context and toast notifications to all pages
 */
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/logo-removebg-preview.png" />
        <title>Aloe | Private Exchange Protocol</title>
      </Head>
      <WalletProvider>
        <Component {...pageProps} />
        <Toaster richColors position="bottom-right" />
      </WalletProvider>
    </>
  );
}
