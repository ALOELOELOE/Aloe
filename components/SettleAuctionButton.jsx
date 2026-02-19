// Settle Auction Button
// Allows settlement of auctions after the reveal phase

import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { buildSettleAuctionInputs, fetchHighestBid, isRealTransaction, checkSettleEligibility } from "@/lib/aleo";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * Button to settle an auction after the reveal deadline
 * Transfers the winning bid to the auctioneer
 * @param {Object} props
 * @param {Object} props.auction - Auction object
 * @param {string} props.auctioneer - Auctioneer address
 * @param {number} props.winningAmount - Winning bid in microcredits (from on-chain state)
 * @param {Function} [props.onSettled] - Callback after successful settlement
 */
export function SettleAuctionButton({ auction, auctioneer, winningAmount, onSettled }) {
  const { address, executeTransaction } = useWallet();
  const { isSettling, setSettling, updateAuction } = useAuctionStore();

  const handleSettle = async () => {
    if (!address || !auction) return;

    setSettling(true);
    console.log("[Aloe:SettleAuctionButton] Settling auction", auction.id);

    try {
      // Pre-flight check: verify the reveal phase is over before submitting
      // The contract requires block.height > reveal_deadline — this prevents wasting gas
      const eligibility = await checkSettleEligibility(auction.id);
      if (!eligibility.ok) {
        toast.error("Cannot settle yet", {
          description: eligibility.reason,
          duration: 8000,
        });
        console.log("[Aloe:SettleAuctionButton] Pre-flight check failed:", eligibility);
        setSettling(false);
        return;
      }

      // Fetch the actual highest bid from on-chain mapping (local store may be stale/zero)
      const onChainHighest = await fetchHighestBid(auction.id);
      console.log("[Aloe:SettleAuctionButton] On-chain highest bid:", onChainHighest);

      if (onChainHighest <= 0) {
        toast.error("No revealed bids found on-chain", {
          description: "This auction has no revealed bids. Use Cancel Auction instead.",
        });
        return;
      }

      const txInputs = buildSettleAuctionInputs({
        auctionId: auction.id,
        auctioneer,
        winningAmount: onChainHighest,
      });

      toast.info("Please approve the settle transaction in your wallet...");

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

      // Update local state to reflect settlement
      updateAuction(auction.id, { status: 3 }); // Ended

      console.log("[Aloe:SettleAuctionButton] Settlement successful, tx:", txId);

      toast.success("Auction settled!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      onSettled?.();
    } catch (error) {
      console.error("[Aloe:SettleAuctionButton] Settlement failed:", error);
      toast.error("Failed to settle auction", {
        description: error.message,
      });
    } finally {
      setSettling(false);
    }
  };

  return (
    <Button
      onClick={handleSettle}
      disabled={isSettling || !address}
      className="gap-2"
    >
      {isSettling ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Settling...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          Settle Auction
        </>
      )}
    </Button>
  );
}

export default SettleAuctionButton;
