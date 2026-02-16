// Aleo Wallet Provider - wraps the app with wallet context
// Supports Leo Wallet and Shield Wallet via @provablehq adapters
// Migrated from @demox-labs to @provablehq for Shield Wallet support (buildathon requirement)

import { useMemo } from "react";
import { AleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";
import { Network } from "@provablehq/aleo-types";

// Import wallet adapter styles
import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";

/**
 * WalletProvider component
 * Wraps the application with Aleo wallet context
 * Provides wallet connection, signing, and transaction capabilities
 * Supports both Leo Wallet and Shield Wallet
 */
export function WalletProvider({ children }) {
  // Initialize wallet adapters
  // Memoized to prevent recreation on every render
  // Shield Wallet added for buildathon requirement
  const wallets = useMemo(() => {
    return [
      new LeoWalletAdapter({
        appName: "Aloe Auctions",
      }),
      new ShieldWalletAdapter({
        appName: "Aloe Auctions",
      }),
    ];
  }, []);

  return (
    <AleoWalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={Network.TESTNET}
      autoConnect={true}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </AleoWalletProvider>
  );
}

export default WalletProvider;
