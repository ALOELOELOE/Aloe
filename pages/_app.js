// Main App component with providers

import "@/styles/globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import { Toaster } from "@/components/ui/sonner";

/**
 * App wrapper component
 * Provides wallet context and toast notifications to all pages
 */
export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
      <Toaster richColors position="bottom-right" />
    </WalletProvider>
  );
}
