// Create Auction Form component
// Allows users to create new sealed-bid auctions

import { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
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
} from "@/lib/aleo";
import {
  PROGRAM_ID,
  NETWORK,
  DEFAULT_COMMIT_DURATION,
  DEFAULT_REVEAL_DURATION,
  AUCTION_STATUS,
} from "@/lib/constants";
import { useAuctionStore } from "@/store/auctionStore";

/**
 * CreateAuctionForm component
 * Form for creating new auctions on the Aleo blockchain
 */
export function CreateAuctionForm({ onSuccess }) {
  const { publicKey, requestTransaction } = useWallet();
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
    if (!publicKey) {
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

    if (isNaN(commitBlocks) || commitBlocks < 10) {
      toast.error("Commit duration must be at least 10 blocks");
      return;
    }

    if (isNaN(revealBlocks) || revealBlocks < 10) {
      toast.error("Reveal duration must be at least 10 blocks");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Generate unique auction and item IDs
      const auctionId = generateAuctionId();
      const itemId = generateAuctionId(); // Could also hash the item name

      // Convert credits to microcredits
      const minBidMicro = parseCreditsToMicro(minBid);

      // Build transaction inputs
      const txInputs = buildCreateAuctionInputs({
        auctionId,
        itemId,
        minBid: minBidMicro,
        commitDuration: commitBlocks,
        revealDuration: revealBlocks,
      });

      toast.info("Please approve the transaction in your wallet...");

      // Request transaction from wallet
      // AleoTransaction interface requires: address, chainId, transitions, fee, feePrivate
      const txId = await requestTransaction({
        address: publicKey,
        chainId: NETWORK,
        transitions: [
          {
            program: txInputs.programId,
            functionName: txInputs.functionName,
            inputs: txInputs.inputs,
          },
        ],
        fee: txInputs.fee,
        feePrivate: false,
      });

      // Add auction to local store for display
      // In production, this would be fetched from chain
      addAuction({
        id: auctionId,
        itemId: itemId,
        itemName: itemName.trim(),
        auctioneer: publicKey,
        minBid: minBidMicro,
        commitDuration: commitBlocks,
        revealDuration: revealBlocks,
        status: AUCTION_STATUS.COMMIT_PHASE,
        bidCount: 0,
        txId: txId,
      });

      toast.success("Auction created successfully!", {
        description: `Transaction ID: ${txId?.slice(0, 16)}...`,
      });

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
      console.error("Failed to create auction:", error);
      setError(error.message);
      toast.error("Failed to create auction", {
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Auction
        </CardTitle>
        <CardDescription>
          Create a new sealed-bid auction. Bidders will submit encrypted bids
          that are revealed after the commit phase ends.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              placeholder="Enter item name or description"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              disabled={isCreating}
              required
            />
          </div>

          {/* Minimum Bid */}
          <div className="space-y-2">
            <Label htmlFor="minBid">Minimum Bid (credits)</Label>
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
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount bidders must bid
            </p>
          </div>

          {/* Commit Duration */}
          <div className="space-y-2">
            <Label htmlFor="commitDuration">
              Commit Phase Duration (blocks)
            </Label>
            <Input
              id="commitDuration"
              type="number"
              min="10"
              placeholder="360"
              value={commitDuration}
              onChange={(e) => setCommitDuration(e.target.value)}
              disabled={isCreating}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formatBlockDuration(parseInt(commitDuration) || 0)} - Time for
              bidders to submit sealed bids
            </p>
          </div>

          {/* Reveal Duration */}
          <div className="space-y-2">
            <Label htmlFor="revealDuration">
              Reveal Phase Duration (blocks)
            </Label>
            <Input
              id="revealDuration"
              type="number"
              min="10"
              placeholder="180"
              value={revealDuration}
              onChange={(e) => setRevealDuration(e.target.value)}
              disabled={isCreating}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formatBlockDuration(parseInt(revealDuration) || 0)} - Time for
              bidders to reveal their bids
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isCreating || !publicKey}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Auction...
              </>
            ) : !publicKey ? (
              "Connect Wallet to Create"
            ) : (
              "Create Auction"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default CreateAuctionForm;
