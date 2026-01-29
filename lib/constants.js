// Aleo network and program configuration

// Program ID - update this after deploying to testnet
export const PROGRAM_ID = "zkauction.aleo";

// Network configuration - must match wallet adapter (WalletAdapterNetwork.TestnetBeta)
export const NETWORK = "testnetbeta";

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

// LocalStorage keys
export const STORAGE_KEYS = {
  BID_PREFIX: "aloe_bid_", // aloe_bid_{auctionId} stores {amount, salt}
  AUCTIONS: "aloe_auctions", // Cache of created auctions
};
