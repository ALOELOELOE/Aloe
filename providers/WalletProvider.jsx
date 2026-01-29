// Aleo Wallet Provider - wraps the app with wallet context
// Supports Leo Wallet (primary adapter for Aleo)

import { useMemo } from "react";
import { WalletProvider as AleoWalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import { DecryptPermission, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";

// Import wallet adapter styles
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";

/**
 * WalletProvider component
 * Wraps the application with Aleo wallet context
 * Provides wallet connection, signing, and transaction capabilities
 */
export function WalletProvider({ children }) {
  // Initialize wallet adapters
  // Memoized to prevent recreation on every render
  const wallets = useMemo(() => {
    return [
      new LeoWalletAdapter({
        appName: "Aloe Auctions",
      }),
    ];
  }, []);

  return (
    <AleoWalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.TestnetBeta}
      autoConnect={true}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </AleoWalletProvider>
  );
}

export default WalletProvider;
