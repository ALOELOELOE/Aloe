// Wallet connection button component
// Uses Aleo wallet adapter for connection management

import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useWalletModal } from "@demox-labs/aleo-wallet-adapter-reactui";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/aleo";
import { Wallet, LogOut, Loader2 } from "lucide-react";

/**
 * WalletConnect component
 * Displays connect button or connected wallet address
 * Handles wallet connection/disconnection
 */
export function WalletConnect() {
  const { publicKey, wallet, connecting, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  // Handle connect button click
  const handleConnect = () => {
    setVisible(true);
  };

  // Handle disconnect button click
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  // Show loading state while connecting
  if (connecting) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // Show connected state with address and disconnect option
  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">
            {truncateAddress(publicKey)}
          </span>
          {wallet && (
            <span className="text-xs text-muted-foreground">
              ({wallet.adapter.name})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDisconnect}
          title="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show connect button
  return (
    <Button onClick={handleConnect} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}

export default WalletConnect;
