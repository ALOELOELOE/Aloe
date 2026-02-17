// Settle Auction Button
// Allows settlement of auctions after the reveal phase

import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { buildSettleAuctionInputs } from "@/lib/aleo";
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
      const txInputs = buildSettleAuctionInputs({
        auctionId: auction.id,
        auctioneer,
        winningAmount,
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
