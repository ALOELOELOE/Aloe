// Shield Credits Dialog
// Converts public credits to a private record for private bidding
// Required because place_bid uses transfer_private_to_public to hide bidder identity

import { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { buildShieldCreditsInputs, parseCreditsToMicro, isRealTransaction } from "@/lib/aleo";

/**
 * Dialog to convert public credits into a private credits record
 * This is needed before placing bids, since the privacy-preserving
 * bid flow requires a private credits record as input
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Dialog open state handler
 * @param {number} [props.suggestedAmount] - Pre-fill amount (e.g. from bid attempt)
 * @param {Function} [props.onSuccess] - Callback after successful shielding
 */
export function ShieldCreditsDialog({ open, onOpenChange, suggestedAmount, onSuccess }) {
  const { address, executeTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [isShielding, setIsShielding] = useState(false);

  // Pre-fill suggested amount when dialog opens
  const displayAmount = amount || (suggestedAmount ? (suggestedAmount / 1_000_000).toString() : "");

  const handleShield = async () => {
    if (!address) return;

    const value = parseFloat(displayAmount);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsShielding(true);
    console.log("[Aloe:ShieldCreditsDialog] Shielding", displayAmount, "credits");

    try {
      const microAmount = parseCreditsToMicro(displayAmount);

      const txInputs = buildShieldCreditsInputs({
        recipientAddress: address,
        amount: microAmount,
      });

      toast.info("Please approve the shield transaction in your wallet...");

      // Execute credits.aleo/transfer_public_to_private via wallet adapter
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

      console.log("[Aloe:ShieldCreditsDialog] Shield successful, tx:", txId);

      toast.success("Credits shielded!", {
        description: `You now have a private record with ${displayAmount} credits. You can place bids now.`,
      });

      setAmount("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("[Aloe:ShieldCreditsDialog] Shield failed:", error);
      toast.error("Failed to shield credits", {
        description: error.message,
      });
    } finally {
      setIsShielding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Shield Credits
          </DialogTitle>
          <DialogDescription>
            Convert public credits to a private record for anonymous bidding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Explanation */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm space-y-2">
            <p>
              Aloe uses <strong>private credit records</strong> to hide your identity
              when placing bids. This converts your public balance into a private
              record that only you can see.
            </p>
            <p className="text-xs text-muted-foreground">
              Shield an amount equal to or greater than your intended bid.
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="shieldAmount">Amount (credits)</Label>
            <Input
              id="shieldAmount"
              type="number"
              step="0.000001"
              min="0.000001"
              placeholder="e.g. 1.0"
              value={displayAmount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isShielding}
            />
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isShielding}
          >
            Cancel
          </Button>
          <Button onClick={handleShield} disabled={isShielding || !address || !displayAmount}>
            {isShielding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Shielding...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Shield Credits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShieldCreditsDialog;
