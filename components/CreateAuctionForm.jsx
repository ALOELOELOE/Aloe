// Create Auction Form component
// Allows users to create new sealed-bid auctions

import { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  generateAuctionId,
  buildCreateAuctionInputs,
  parseCreditsToMicro,
  formatBlockDuration,
  isRealTransaction,
} from "@/lib/aleo";
import {
  DEFAULT_COMMIT_DURATION,
  DEFAULT_REVEAL_DURATION,
  AUCTION_STATUS,
  PROGRAM_ID,
} from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * CreateAuctionForm component
 * Form for creating new auctions on the Aleo blockchain
 */
export function CreateAuctionForm({ onSuccess }) {
  const { address, executeTransaction } = useWallet();
  const { addAuction, isCreating, setCreating, setError } = useAuctionStore();

  // Form state
  const [itemName, setItemName] = useState("");
  const [minBid, setMinBid] = useState("");
  const [commitDuration, setCommitDuration] = useState(
    DEFAULT_COMMIT_DURATION.toString()
  );
  const [revealDuration, setRevealDuration] = useState(
    DEFAULT_REVEAL_DURATION.toString()
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate wallet connection
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate form inputs
    if (!itemName.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    const minBidValue = parseFloat(minBid);
    if (isNaN(minBidValue) || minBidValue <= 0) {
      toast.error("Please enter a valid minimum bid");
      return;
    }

    const commitBlocks = parseInt(commitDuration);
    const revealBlocks = parseInt(revealDuration);

    // Minimum 20 blocks (~1 minute at 3s/block) gives users enough time
    // to submit transactions before the phase window closes
    if (isNaN(commitBlocks) || commitBlocks < 20) {
      toast.error("Commit duration must be at least 20 blocks (~1 min)");
      return;
    }

    if (isNaN(revealBlocks) || revealBlocks < 20) {
      toast.error("Reveal duration must be at least 20 blocks (~1 min)");
      return;
    }

    setCreating(true);
    setError(null);

    console.log("[Aloe] ====== CREATE AUCTION START ======");
    console.log("[Aloe] Form values:", {
      itemName: itemName.trim(),
      minBid: minBid,
      commitDuration: commitBlocks,
      revealDuration: revealBlocks,
    });
    console.log("[Aloe] Wallet address:", address);

    try {
      // Generate unique auction and item IDs
      const auctionId = generateAuctionId();
      const itemId = generateAuctionId(); // Could also hash the item name

      console.log("[Aloe] Generated IDs:");
      console.log("[Aloe]   Auction ID:", auctionId);
      console.log("[Aloe]   Item ID:", itemId);

      // Convert credits to microcredits
      const minBidMicro = parseCreditsToMicro(minBid);
      console.log("[Aloe] Min bid converted:", minBid, "credits ->", minBidMicro, "microcredits");

      // Build transaction inputs
      const txInputs = buildCreateAuctionInputs({
        auctionId,
        itemId,
        minBid: minBidMicro,
        commitDuration: commitBlocks,
        revealDuration: revealBlocks,
      });

      console.log("[Aloe] Transaction inputs built:");
      console.log("[Aloe]   Program ID:", txInputs.programId);
      console.log("[Aloe]   Function:", txInputs.functionName);
      console.log("[Aloe]   Inputs:", JSON.stringify(txInputs.inputs, null, 2));
      console.log("[Aloe]   Fee:", txInputs.fee, "microcredits");

      toast.info("Please approve the transaction in your wallet...");
      console.log("[Aloe] Requesting wallet approval...");

      // Build the transaction request using @provablehq TransactionOptions format
      const txRequest = {
        program: txInputs.programId,
        function: txInputs.functionName,
        inputs: txInputs.inputs,
        fee: txInputs.fee,
        privateFee: false,
      };

      console.log("[Aloe] Transaction request:", JSON.stringify(txRequest, null, 2));

      // Execute transaction via wallet adapter
      const result = await executeTransaction(txRequest);
      const txId = result?.transactionId;

      console.log("[Aloe] ✅ Transaction submitted successfully!");
      console.log("[Aloe] Transaction ID:", txId);

      // Warn if the wallet returned a simulated (non-on-chain) transaction ID
      if (!isRealTransaction(txId)) {
        toast.warning("Transaction may not be on-chain", {
          description: "Your wallet may be in simulation mode. Switch Proving Mode to 'Local' in wallet settings.",
          duration: 8000,
        });
      }

      // Add auction to local store for display
      // In production, this would be fetched from chain
      const newAuction = {
        id: auctionId,
        itemId: itemId,
        itemName: itemName.trim(),
        auctioneer: address,
        minBid: minBidMicro,
        commitDuration: commitBlocks,
        revealDuration: revealBlocks,
        status: AUCTION_STATUS.COMMIT_PHASE,
        bidCount: 0,
        txId: txId,
        programId: PROGRAM_ID, // Tag with current contract version
      };

      addAuction(newAuction);
      console.log("[Aloe] Auction added to local store:", newAuction);

      toast.success("Auction created successfully!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

      console.log("[Aloe] ====== CREATE AUCTION COMPLETE ======");

      // Reset form
      setItemName("");
      setMinBid("");
      setCommitDuration(DEFAULT_COMMIT_DURATION.toString());
      setRevealDuration(DEFAULT_REVEAL_DURATION.toString());

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(auctionId);
      }
    } catch (error) {
      console.error("[Aloe] ❌ Failed to create auction:", error);
      console.error("[Aloe] Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      setError(error.message);
      toast.error("Failed to create auction", {
        description: error.message,
      });
    } finally {
      setCreating(false);
      console.log("[Aloe] Create auction flow ended");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 sm:p-10 bg-black/40 backdrop-blur-xl border border-neutral-800/60 rounded-[2rem] shadow-2xl">
      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-white tracking-tight">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <Plus className="h-5 w-5" />
          </div>
          Create Auction
        </h2>
        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
          Launch a new sealed-bid auction. Bidders will submit encrypted bids
          that are revealed after the commit phase ends.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Name */}
        <div className="space-y-3">
          <Label htmlFor="itemName" className="text-neutral-300 ml-1">Item Name</Label>
          <Input
            id="itemName"
            placeholder="e.g., Vintage Rolex Submariner"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            disabled={isCreating}
            required
            className="h-12 bg-black/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/50 rounded-xl px-4"
          />
        </div>

        {/* Minimum Bid */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline ml-1">
            <Label htmlFor="minBid" className="text-neutral-300">Minimum Bid</Label>
            <span className="text-xs text-neutral-500 font-mono">CREDITS</span>
          </div>
          <Input
            id="minBid"
            type="number"
            step="0.000001"
            min="0.000001"
            placeholder="0.001"
            value={minBid}
            onChange={(e) => setMinBid(e.target.value)}
            disabled={isCreating}
            required
            className="h-12 bg-black/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/50 rounded-xl px-4 font-mono text-lg"
          />
          <p className="text-xs text-neutral-500 ml-1">
            Minimum required starting floor
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Commit Duration */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline ml-1">
              <Label htmlFor="commitDuration" className="text-neutral-300">Commit Phase</Label>
              <span className="text-xs text-neutral-500 font-mono">BLOCKS</span>
            </div>
            <Input
              id="commitDuration"
              type="number"
              min="20"
              placeholder="1200"
              value={commitDuration}
              onChange={(e) => setCommitDuration(e.target.value)}
              disabled={isCreating}
              required
              className="h-12 bg-black/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/50 rounded-xl px-4 font-mono text-lg"
            />
            <p className="text-[11px] text-emerald-500/70 ml-1 font-medium">
              ≈ {formatBlockDuration(parseInt(commitDuration) || 0)}
            </p>
          </div>

          {/* Reveal Duration */}
          <div className="space-y-3">
             <div className="flex justify-between items-baseline ml-1">
              <Label htmlFor="revealDuration" className="text-neutral-300">Reveal Phase</Label>
              <span className="text-xs text-neutral-500 font-mono">BLOCKS</span>
            </div>
            <Input
              id="revealDuration"
              type="number"
              min="20"
              placeholder="600"
              value={revealDuration}
              onChange={(e) => setRevealDuration(e.target.value)}
              disabled={isCreating}
              required
              className="h-12 bg-black/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/50 rounded-xl px-4 font-mono text-lg"
            />
            <p className="text-[11px] text-emerald-500/70 ml-1 font-medium">
              ≈ {formatBlockDuration(parseInt(revealDuration) || 0)}
            </p>
          </div>
        </div>

        <div className="pt-6">
          <Button
            type="submit"
            disabled={isCreating || !address}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 mt-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Initializing Contract...
              </>
            ) : !address ? (
              "Connect per-wallet"
            ) : (
              "Launch Auction"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateAuctionForm;
