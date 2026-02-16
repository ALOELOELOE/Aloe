// OTC Deal Card component
// Displays individual deal information — mirrors AuctionCard pattern

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/aleo";
import {
  DEAL_STATUS,
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
} from "@/lib/constants";
import { ArrowLeftRight, User, Coins, ArrowRight } from "lucide-react";

/**
 * DealCard component
 * Displays OTC deal preview with key information
 * @param {Object} deal - Deal data object
 * @param {Function} onSelect - Callback when card is clicked (view details)
 * @param {Function} onAccept - Callback for accepting a deal
 * @param {number} index - Index for staggered animation
 */
export function DealCard({ deal, onSelect, onAccept, index = 0 }) {
  const {
    id,
    asset,
    amount,
    price,
    maker,
    status,
    createdAt,
  } = deal;

  // Get status display properties
  const statusLabel = DEAL_STATUS_LABELS[status] || "Unknown";
  const statusColor = DEAL_STATUS_COLORS[status] || "secondary";

  // Can this deal be accepted?
  const canAccept = status === DEAL_STATUS.OPEN;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200">
        <CardHeader className="p-4 md:p-6 pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">
              {asset || "Aleo Credits"}
            </CardTitle>
            <Badge variant={statusColor}>{statusLabel}</Badge>
          </div>
          <CardDescription className="line-clamp-1">
            by {truncateAddress(maker || "unknown")}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 px-4 md:px-6">
          {/* Amount */}
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">{amount || "—"}</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 text-sm">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Price:</span>
            <span className="font-medium">{price || "—"}</span>
          </div>

          {/* Maker */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Maker:</span>
            <span className="font-mono text-xs">
              {truncateAddress(maker || "unknown")}
            </span>
          </div>
        </CardContent>

        <CardFooter className="gap-2 p-4 md:p-6 pt-4">
          {canAccept && onAccept && (
            <Button className="flex-1" onClick={() => onAccept(deal)}>
              Accept Deal
            </Button>
          )}
          {onSelect && (
            <Button
              variant={canAccept ? "outline" : "default"}
              className={canAccept ? "" : "flex-1"}
              onClick={() => onSelect(deal)}
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default DealCard;
