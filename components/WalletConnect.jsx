// Wallet connection button component
// Uses Aleo wallet adapter for connection management
// Connected state shows a popover with balances and wallet details

import { useState, useCallback } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { truncateAddress, formatCredits } from "@/lib/aleo";
import { ALEO_API_URL, NETWORK } from "@/lib/constants";
import {
  Wallet,
  LogOut,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Eye,
} from "lucide-react";

/**
 * WalletConnect component
 * Displays connect button or connected wallet address with a popover dropdown
 * showing balances, wallet details, and disconnect action.
 */
export function WalletConnect() {
  const { address, wallet, connecting, connected, disconnect, requestRecords, decrypt } =
    useWallet();
  const { setVisible } = useWalletModal();

  // Popover open state — used to trigger balance fetch on open
  const [open, setOpen] = useState(false);

  // Balance state
  const [publicBalance, setPublicBalance] = useState(null);
  const [privateBalance, setPrivateBalance] = useState(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);

  // Copy-to-clipboard feedback
  const [copied, setCopied] = useState(false);

  // Log wallet state changes
  console.log("[Aloe:Wallet] State:", {
    connected,
    connecting,
    address: address ? `${address.slice(0, 12)}...` : null,
    wallet: wallet?.adapter?.name || null,
  });

  // Handle connect button click
  const handleConnect = () => {
    console.log("[Aloe:Wallet] Opening wallet modal...");
    setVisible(true);
  };

  // Handle disconnect button click
  const handleDisconnect = async () => {
    console.log("[Aloe:Wallet] Disconnecting...");
    setOpen(false);
    try {
      await disconnect();
      // Reset balances on disconnect
      setPublicBalance(null);
      setPrivateBalance(null);
      console.log("[Aloe:Wallet] Disconnected successfully");
    } catch (error) {
      console.error("[Aloe:Wallet] Failed to disconnect:", error);
    }
  };

  // Copy full address to clipboard
  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      // Reset the check icon after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[Aloe:Wallet] Failed to copy address:", error);
    }
  }, [address]);

  /**
   * Fetch public credits balance from the Aleo REST API
   * Reads the credits.aleo/account mapping for this address
   */
  const fetchPublicBalance = useCallback(async () => {
    if (!address) return;
    setLoadingPublic(true);
    try {
      const url = `${ALEO_API_URL}/${NETWORK}/program/credits.aleo/mapping/account/${address}`;
      const res = await fetch(url);
      if (!res.ok) {
        // 404 means no public balance entry — default to 0
        setPublicBalance(0);
        return;
      }
      const text = await res.text();
      // Response format: "181137084u64" — strip quotes and u64 type suffix
      // IMPORTANT: can't just strip non-digits because "64" in "u64" would be kept
      const cleaned = text.replace(/"/g, "").replace(/u\d+$/, "");
      const microcredits = parseInt(cleaned, 10);
      setPublicBalance(isNaN(microcredits) ? 0 : microcredits);
    } catch (error) {
      console.error("[Aloe:Wallet] Failed to fetch public balance:", error);
      setPublicBalance(0);
    } finally {
      setLoadingPublic(false);
    }
  }, [address]);

  /**
   * Fetch private credits balance by requesting records from the wallet
   * Sums up all microcredits fields from unspent credits.aleo records
   */
  const fetchPrivateBalance = useCallback(async () => {
    if (!requestRecords) return;
    setLoadingPrivate(true);
    try {
      const records = await requestRecords("credits.aleo");
      if (!records || records.length === 0) {
        setPrivateBalance(0);
        return;
      }

      // Sum microcredits from all unspent records
      let total = 0;
      let decryptedAny = false;
      for (const record of records) {
        // Skip spent records
        if (record.spent) continue;

        // Get plaintext — either already decrypted or needs decryption from ciphertext
        let plaintext =
          typeof record === "string"
            ? record
            : record?.plaintext || record?.data;

        // If no plaintext but we have ciphertext, decrypt it via the wallet
        if (!plaintext && record?.recordCiphertext && decrypt) {
          try {
            plaintext = await decrypt(record.recordCiphertext);
          } catch (e) {
            // User likely cancelled the signature — abort without setting balance
            console.warn("[Aloe:Wallet] Decrypt cancelled or failed:", e);
            return;
          }
        }

        if (!plaintext) continue;

        decryptedAny = true;
        // Extract microcredits value — format: "microcredits: 10000u64"
        const match = String(plaintext).match(/microcredits:\s*(\d+)u64/);
        if (match) {
          total += parseInt(match[1], 10);
        }
      }

      // Only set balance if we successfully decrypted at least one record
      setPrivateBalance(decryptedAny ? total : null);
    } catch (error) {
      // Don't set to 0 on error/cancel — keep as null so the Reveal button stays
      console.error("[Aloe:Wallet] Failed to fetch private balance:", error);
    } finally {
      setLoadingPrivate(false);
    }
  }, [requestRecords, decrypt]);

  /**
   * Refresh public balance — called when popover opens or refresh is clicked
   * Private balance is NOT auto-fetched because it requires a wallet signature.
   * Users click "Reveal" on the private row to trigger it explicitly.
   */
  const refreshPublicBalance = useCallback(() => {
    fetchPublicBalance();
  }, [fetchPublicBalance]);

  /**
   * Handle popover open/close — only fetch public balance on open
   */
  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      refreshPublicBalance();
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

  // Show connected state with popover dropdown
  if (connected && address) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        {/* Trigger — clickable address area */}
        <PopoverTrigger asChild>
          <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 transition-colors hover:bg-muted">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">
              {truncateAddress(address)}
            </span>
            {wallet && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                ({wallet.adapter.name})
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        {/* Dropdown content — wallet details and balances */}
        <PopoverContent align="end" className="w-80">
          <div className="space-y-4">
            {/* Header — wallet name + network badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">
                  {wallet?.adapter?.name || "Wallet"}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {NETWORK}
              </Badge>
            </div>

            {/* Full address with copy button */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                {address}
              </span>
              <button
                onClick={handleCopyAddress}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                title="Copy address"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Credit balances */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Balances
                </span>
                {/* Refresh button — refreshes public balance only */}
                <button
                  onClick={refreshPublicBalance}
                  disabled={loadingPublic}
                  className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  title="Refresh balances"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${loadingPublic ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Public balance */}
              <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Public</span>
                {loadingPublic ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="text-sm font-medium">
                    {publicBalance !== null
                      ? formatCredits(publicBalance)
                      : "—"}
                  </span>
                )}
              </div>

              {/* Private balance — requires wallet signature to decrypt, so it's opt-in */}
              <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Private</span>
                {loadingPrivate ? (
                  <Skeleton className="h-4 w-24" />
                ) : privateBalance !== null ? (
                  <span className="text-sm font-medium">
                    {formatCredits(privateBalance)}
                  </span>
                ) : (
                  <button
                    onClick={fetchPrivateBalance}
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    title="Requires wallet signature to decrypt"
                  >
                    <Eye className="h-3 w-3" />
                    Reveal
                  </button>
                )}
              </div>
            </div>

            {/* Disconnect button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleDisconnect}
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        </PopoverContent>
      </Popover>
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
