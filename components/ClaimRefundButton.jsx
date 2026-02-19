// Claim Refund Button
// Allows non-winning revealed bidders to reclaim their deposit

import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { buildClaimRefundInputs, getStoredBid, clearStoredBid, isRealTransaction, checkRefundEligibility } from "@/lib/aleo";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Button for non-winners to claim their deposit refund
 * Requires a RevealedBid record in the wallet (only revealed bidders can claim)
 * @param {Object} props
 * @param {Object} props.auction - Auction object
 * @param {Function} [props.onClaimed] - Callback after successful claim
 */
export function ClaimRefundButton({ auction, onClaimed }) {
  const { address, executeTransaction } = useWallet();
  const { isClaiming, setClaiming } = useAuctionStore();

  const handleClaim = async () => {
    if (!address || !auction) return;

    setClaiming(true);
    console.log("[Aloe:ClaimRefundButton] Claiming refund for auction", auction.id);

    try {
      // Pre-flight check: verify auction is settled and caller is not the winner
      // Prevents wasting gas on transactions the contract will reject
      const eligibility = await checkRefundEligibility(auction.id, address);
      if (!eligibility.ok) {
        toast.error("Cannot claim refund", {
          description: eligibility.reason,
          duration: 8000,
        });
        console.log("[Aloe:ClaimRefundButton] Pre-flight check failed:", eligibility);
        setClaiming(false);
        return;
      }

      // Use locally stored bid data instead of wallet record lookup
      // (Wallets don't reliably index custom program records like RevealedBid)
      const storedBid = getStoredBid(auction.id);

      if (!storedBid) {
        toast.error("Bid data not found locally", {
          description: "Your bid data must be stored in this browser to claim a refund.",
        });
        return;
      }

      // Build the refund transaction from raw fields — contract recomputes commitment on-chain
      const txInputs = buildClaimRefundInputs({
        auctionId: auction.id,
        bidAmount: storedBid.bidAmount,
        salt: storedBid.salt,
        deposit: storedBid.deposit || storedBid.bidAmount,
      });

      toast.info("Please approve the refund transaction in your wallet...");

      // Execute transaction via wallet adapter
      const result = await executeTransaction({
        program: txInputs.programId,
        function: txInputs.functionName,
        inputs: txInputs.inputs,
        fee: txInputs.fee,
        privateFee: false,
      });
      const txId = result?.transactionId;

      // Warn if the wallet returned a simulated (non-on-chain) transaction ID
      if (!isRealTransaction(txId)) {
        toast.warning("Transaction may not be on-chain", {
          description: "Your wallet may be in simulation mode. Switch Proving Mode to 'Local' in wallet settings.",
          duration: 8000,
        });
      }

      // Clear stored bid data after successful refund claim
      clearStoredBid(auction.id);

      console.log("[Aloe:ClaimRefundButton] Refund claimed, tx:", txId);

      toast.success("Refund claimed!", {
        description: `Your deposit has been returned. TX: ${txId?.slice(0, 16)}...`,
      });

      onClaimed?.();
    } catch (error) {
      console.error("[Aloe:ClaimRefundButton] Claim failed:", error);
      toast.error("Failed to claim refund", {
        description: error.message,
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Button
      onClick={handleClaim}
      disabled={isClaiming || !address}
      variant="outline"
      className="gap-2"
    >
      {isClaiming ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Claiming...
        </>
      ) : (
        <>
          <RefreshCcw className="h-4 w-4" />
          Claim Refund
        </>
      )}
    </Button>
  );
}

export default ClaimRefundButton;
