// Claim Refund Button
// Allows non-winning revealed bidders to reclaim their deposit

import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { buildClaimRefundInputs, findRecord } from "@/lib/aleo";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Button for non-winners to claim their deposit refund
 * Requires a RevealedBid record in the wallet (only revealed bidders can claim)
 * @param {Object} props
 * @param {Object} props.auction - Auction object
 * @param {Function} [props.onClaimed] - Callback after successful claim
 */
export function ClaimRefundButton({ auction, onClaimed }) {
  const { address, executeTransaction, requestRecords } = useWallet();
  const { isClaiming, setClaiming } = useAuctionStore();

  const handleClaim = async () => {
    if (!address || !auction) return;

    setClaiming(true);
    console.log("[Aloe:ClaimRefundButton] Claiming refund for auction", auction.id);

    try {
      // Find RevealedBid record in the wallet
      const revealedRecord = await findRecord(requestRecords, "RevealedBid", auction.id);

      if (!revealedRecord) {
        toast.error("RevealedBid record not found", {
          description: "You need to reveal your bid first before claiming a refund.",
        });
        return;
      }

      const txInputs = buildClaimRefundInputs({
        revealedBidRecord: revealedRecord,
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
