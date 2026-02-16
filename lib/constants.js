// Aleo network and program configuration

// Program ID - deployed to testnet as aloe_auction_v2.aleo
export const PROGRAM_ID = "aloe_auction_v2.aleo";

// Credits program ID - system program for credit transfers
export const CREDITS_PROGRAM_ID = "credits.aleo";

// Network configuration - must match wallet adapter (Network.TESTNET from @provablehq/aleo-types)
export const NETWORK = "testnet";

// API endpoints
export const ALEO_API_URL = "https://api.explorer.provable.com/v1";

// Block timing (approximate)
export const BLOCK_TIME_SECONDS = 10;
export const BLOCKS_PER_MINUTE = 6;
export const BLOCKS_PER_HOUR = 360;

// Default auction durations (in blocks)
export const DEFAULT_COMMIT_DURATION = 360; // ~1 hour
export const DEFAULT_REVEAL_DURATION = 180; // ~30 minutes

// Minimum bid amount (in microcredits)
export const MIN_BID_AMOUNT = 1000; // 0.001 credits

// Auction status constants (must match Leo contract)
export const AUCTION_STATUS = {
  CREATED: 0,
  COMMIT_PHASE: 1,
  REVEAL_PHASE: 2,
  ENDED: 3,
  CANCELLED: 4,
};

// Status labels for display
export const AUCTION_STATUS_LABELS = {
  [AUCTION_STATUS.CREATED]: "Created",
  [AUCTION_STATUS.COMMIT_PHASE]: "Accepting Bids",
  [AUCTION_STATUS.REVEAL_PHASE]: "Reveal Phase",
  [AUCTION_STATUS.ENDED]: "Ended",
  [AUCTION_STATUS.CANCELLED]: "Cancelled",
};

// Status colors for badges
export const AUCTION_STATUS_COLORS = {
  [AUCTION_STATUS.CREATED]: "secondary",
  [AUCTION_STATUS.COMMIT_PHASE]: "default",
  [AUCTION_STATUS.REVEAL_PHASE]: "warning",
  [AUCTION_STATUS.ENDED]: "success",
  [AUCTION_STATUS.CANCELLED]: "destructive",
};

// ============================================
// EXCHANGE MODULES
// ============================================

// All platform modules — auction is live, others are in progress or coming soon
export const MODULES = {
  AUCTIONS: { id: "auctions", name: "Auctions", path: "/dashboard", status: "live" },
  OTC: { id: "otc", name: "OTC", path: "/otc", status: "live" },
  LAUNCHES: { id: "launches", name: "Launches", path: "/launches", status: "coming_soon" },
  NFT: { id: "nft", name: "NFTs", path: "/nft", status: "coming_soon" },
  RWA: { id: "rwa", name: "RWAs", path: "/rwa", status: "coming_soon" },
};

// ============================================
// OTC DEAL STATUSES
// ============================================

// Status codes for OTC deals (will match future zkotc.aleo contract)
export const DEAL_STATUS = {
  OPEN: 0,
  ACCEPTED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
  DISPUTED: 4,
};

// Display labels for OTC deal statuses
export const DEAL_STATUS_LABELS = {
  [DEAL_STATUS.OPEN]: "Open",
  [DEAL_STATUS.ACCEPTED]: "Accepted",
  [DEAL_STATUS.COMPLETED]: "Completed",
  [DEAL_STATUS.CANCELLED]: "Cancelled",
  [DEAL_STATUS.DISPUTED]: "Disputed",
};

// Colors for OTC deal status badges
export const DEAL_STATUS_COLORS = {
  [DEAL_STATUS.OPEN]: "default",
  [DEAL_STATUS.ACCEPTED]: "warning",
  [DEAL_STATUS.COMPLETED]: "success",
  [DEAL_STATUS.CANCELLED]: "destructive",
  [DEAL_STATUS.DISPUTED]: "destructive",
};

// LocalStorage keys
export const STORAGE_KEYS = {
  BID_PREFIX: "aloe_bid_", // aloe_bid_{auctionId} stores {amount, salt}
  AUCTIONS: "aloe_auctions", // Cache of created auctions
  DEALS: "aloe_deals", // Cache of OTC deals
};
