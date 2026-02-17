// Aleo network and program configuration

// Program IDs — deployed to testnet
export const PROGRAM_ID = "aloe_auction_v3.aleo";
export const PROGRAM_V3_ID = "aloe_auction_v3.aleo"; // Wave 3+: multi-type auctions

// Credits program ID — system program for credit transfers
export const CREDITS_PROGRAM_ID = "credits.aleo";

// Network configuration — must match wallet adapter (Network.TESTNET from @provablehq/aleo-types)
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

// ============================================
// AUCTION TYPES (must match Leo contract auction_type field)
// ============================================

export const AUCTION_TYPES = {
  FIRST_PRICE: 0,  // Standard sealed-bid — highest bid wins, pays own bid
  VICKREY: 1,      // Second-price — highest bid wins, pays second-highest bid
  DUTCH: 2,        // Descending-price — price drops over time, first buyer wins
  REVERSE: 3,      // Lowest bid wins — used for procurement/RFQ
  BATCH: 4,        // Uniform clearing price — multiple winners at same price
};

// Display labels for auction types
export const AUCTION_TYPE_LABELS = {
  [AUCTION_TYPES.FIRST_PRICE]: "First-Price",
  [AUCTION_TYPES.VICKREY]: "Vickrey (2nd Price)",
  [AUCTION_TYPES.DUTCH]: "Dutch",
  [AUCTION_TYPES.REVERSE]: "Reverse",
  [AUCTION_TYPES.BATCH]: "Batch",
};

// Short descriptions for auction type selection
export const AUCTION_TYPE_DESCRIPTIONS = {
  [AUCTION_TYPES.FIRST_PRICE]: "Highest bid wins. Winner pays their bid.",
  [AUCTION_TYPES.VICKREY]: "Highest bid wins. Winner pays the second-highest bid.",
  [AUCTION_TYPES.DUTCH]: "Price drops over time. First buyer wins at current price.",
  [AUCTION_TYPES.REVERSE]: "Lowest bid wins. Used for procurement and RFQs.",
  [AUCTION_TYPES.BATCH]: "Multiple winners at a uniform clearing price.",
};

// ============================================
// AUCTION STATUS (must match Leo contract status field)
// ============================================

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
// USE CASES — different frontend skins for the same auction primitive
// ============================================

export const USE_CASES = {
  CLASSIC: { id: "classic", name: "Auctions", path: "/dashboard", description: "General-purpose sealed-bid auctions" },
  NFT: { id: "nft", name: "NFT Auctions", path: "/nft", description: "Private NFT sales with sealed bids" },
  PROCUREMENT: { id: "procurement", name: "Procurement", path: "/procurement", description: "Reverse auctions for sourcing" },
};

// LocalStorage keys
export const STORAGE_KEYS = {
  BID_PREFIX: "aloe_bid_", // aloe_bid_{auctionId} stores {amount, salt}
  AUCTIONS: "aloe_auctions", // Cache of created auctions
};
