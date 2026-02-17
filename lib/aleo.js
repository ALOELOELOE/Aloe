// Aleo blockchain utilities for transaction building and cryptography

import { PROGRAM_ID, STORAGE_KEYS } from "./constants";

// ============================================
// SALT GENERATION
// ============================================

/**
 * Generate a cryptographically secure random salt
 * Uses Web Crypto API for 128-bit entropy
 * @returns {string} Salt as a field string (e.g., "12345field")
 */
export function generateSalt() {
  // Generate 16 bytes (128 bits) of random data
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  // Convert to BigInt for field representation
  let saltBigInt = BigInt(0);
  for (let i = 0; i < randomBytes.length; i++) {
    saltBigInt = (saltBigInt << BigInt(8)) | BigInt(randomBytes[i]);
  }

  // Return as Aleo field string
  return `${saltBigInt}field`;
}

/**
 * Store bid data locally for later reveal
 * @param {string} auctionId - Auction identifier
 * @param {string} bidAmount - Bid amount as string
 * @param {string} salt - Salt used in commitment
 */
export function storeBidLocally(auctionId, bidAmount, salt) {
  const key = `${STORAGE_KEYS.BID_PREFIX}${auctionId}`;
  const data = {
    bidAmount,
    salt,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Retrieve stored bid data for reveal
 * @param {string} auctionId - Auction identifier
 * @returns {Object|null} Bid data or null if not found
 */
export function getStoredBid(auctionId) {
  const key = `${STORAGE_KEYS.BID_PREFIX}${auctionId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Remove stored bid after successful reveal or refund
 * @param {string} auctionId - Auction identifier
 */
export function clearStoredBid(auctionId) {
  const key = `${STORAGE_KEYS.BID_PREFIX}${auctionId}`;
  localStorage.removeItem(key);
}

// ============================================
// TRANSACTION BUILDERS
// ============================================

/**
 * Build create_auction transaction inputs
 * @param {Object} params - Auction parameters
 * @param {string} params.auctionId - Unique auction ID
 * @param {string} params.itemId - Item being auctioned
 * @param {number} params.minBid - Minimum bid in microcredits
 * @param {number} params.commitDuration - Commit phase duration in blocks
 * @param {number} params.revealDuration - Reveal phase duration in blocks
 * @returns {Object} Transaction input object
 */
export function buildCreateAuctionInputs({
  auctionId,
  itemId,
  minBid,
  commitDuration,
  revealDuration,
}) {
  console.log("[Aloe:buildCreateAuctionInputs] Building transaction...");
  console.log("[Aloe:buildCreateAuctionInputs] Parameters:", {
    auctionId,
    itemId,
    minBid,
    commitDuration,
    revealDuration,
  });

  const inputs = [
    `${auctionId}field`, // auction_id: field
    `${itemId}field`, // item_id: field
    `${minBid}u64`, // min_bid: u64
    `${commitDuration}u32`, // commit_duration: u32
    `${revealDuration}u32`, // reveal_duration: u32
  ];

  console.log("[Aloe:buildCreateAuctionInputs] Formatted inputs:");
  console.log("  [0] auction_id:", inputs[0]);
  console.log("  [1] item_id:", inputs[1]);
  console.log("  [2] min_bid:", inputs[2]);
  console.log("  [3] commit_duration:", inputs[3]);
  console.log("  [4] reveal_duration:", inputs[4]);

  return {
    programId: PROGRAM_ID,
    functionName: "create_auction",
    inputs,
    fee: 100000, // 0.1 credits fee
  };
}

/**
 * Build place_bid transaction inputs
 * @param {Object} params - Bid parameters
 * @param {string} params.auctionId - Auction to bid on
 * @param {number} params.bidAmount - Bid amount in microcredits
 * @param {string} params.salt - Random salt for commitment (auto-generated if not provided)
 * @param {number} params.deposit - Deposit amount (defaults to bidAmount)
 * @returns {Object} Transaction input object with salt
 */
export function buildPlaceBidInputs({
  auctionId,
  bidAmount,
  salt = null,
  deposit = null,
  creditsRecord, // NEW: private credits record JSON string from wallet
}) {
  console.log("[Aloe:buildPlaceBidInputs] Building transaction...");
  console.log("[Aloe:buildPlaceBidInputs] Parameters:", {
    auctionId,
    bidAmount,
    salt: salt ? "[provided]" : "[will generate]",
    deposit,
  });

  // Generate salt if not provided
  const bidSalt = salt || generateSalt();
  console.log("[Aloe:buildPlaceBidInputs] Salt:", bidSalt);

  // Deposit must be >= bid amount
  const depositAmount = deposit || bidAmount;
  console.log("[Aloe:buildPlaceBidInputs] Deposit amount:", depositAmount);

  const inputs = [
    `${auctionId}field`,     // [0] auction_id (public)
    `${bidAmount}u64`,       // [1] bid_amount (private)
    bidSalt,                 // [2] salt (private)
    `${depositAmount}u64`,   // [3] deposit (public)
    creditsRecord,           // [4] payment: private credits record (hides sender)
  ];

  console.log("[Aloe:buildPlaceBidInputs] Formatted inputs:");
  console.log("  [0] auction_id (public):", inputs[0]);
  console.log("  [1] bid_amount (private):", inputs[1]);
  console.log("  [2] salt (private):", inputs[2]);
  console.log("  [3] deposit (public):", inputs[3]);
  console.log("  [4] payment (private record):", creditsRecord ? "[provided]" : "[missing]");

  return {
    programId: PROGRAM_ID,
    functionName: "place_bid",
    inputs,
    fee: 500000, // 0.5 credits fee (higher due to credits.aleo cross-program call)
    // Return the salt so caller can store it
    metadata: {
      salt: bidSalt,
      bidAmount,
      auctionId,
    },
  };
}

/**
 * Build reveal_bid transaction inputs
 * @param {Object} params
 * @param {string} params.bidCommitmentRecord - BidCommitment record plaintext from wallet
 * @returns {Object} Transaction input object
 */
export function buildRevealBidInputs({ bidCommitmentRecord }) {
  console.log("[Aloe:buildRevealBidInputs] Building transaction...");

  const inputs = [
    bidCommitmentRecord, // [0] bid_record: BidCommitment (private, consumed)
  ];

  console.log("[Aloe:buildRevealBidInputs] Input: BidCommitment record provided");

  return {
    programId: PROGRAM_ID,
    functionName: "reveal_bid",
    inputs,
    fee: 500_000, // 0.5 credits fee
  };
}

/**
 * Build settle_auction transaction inputs
 * @param {Object} params
 * @param {string} params.auctionId - Auction to settle
 * @param {string} params.auctioneer - Auctioneer address
 * @param {number} params.winningAmount - Winning bid amount in microcredits
 * @returns {Object} Transaction input object
 */
export function buildSettleAuctionInputs({ auctionId, auctioneer, winningAmount }) {
  console.log("[Aloe:buildSettleAuctionInputs] Building transaction...");
  console.log("[Aloe:buildSettleAuctionInputs] Parameters:", {
    auctionId, auctioneer, winningAmount,
  });

  const inputs = [
    `${auctionId}field`,       // [0] auction_id (public)
    auctioneer,                // [1] auctioneer address (public)
    `${winningAmount}u64`,     // [2] winning_amount (public)
  ];

  console.log("[Aloe:buildSettleAuctionInputs] Formatted inputs:");
  console.log("  [0] auction_id:", inputs[0]);
  console.log("  [1] auctioneer:", inputs[1]);
  console.log("  [2] winning_amount:", inputs[2]);

  return {
    programId: PROGRAM_ID,
    functionName: "settle_auction",
    inputs,
    fee: 500_000,
  };
}

/**
 * Build claim_refund transaction inputs
 * @param {Object} params
 * @param {string} params.revealedBidRecord - RevealedBid record plaintext from wallet
 * @returns {Object} Transaction input object
 */
export function buildClaimRefundInputs({ revealedBidRecord }) {
  console.log("[Aloe:buildClaimRefundInputs] Building transaction...");

  const inputs = [
    revealedBidRecord, // [0] bid_record: RevealedBid (private, consumed)
  ];

  console.log("[Aloe:buildClaimRefundInputs] Input: RevealedBid record provided");

  return {
    programId: PROGRAM_ID,
    functionName: "claim_refund",
    inputs,
    fee: 500_000,
  };
}

/**
 * Build cancel_auction transaction inputs
 * @param {Object} params
 * @param {string} params.auctionId - Auction to cancel
 * @returns {Object} Transaction input object
 */
export function buildCancelAuctionInputs({ auctionId }) {
  console.log("[Aloe:buildCancelAuctionInputs] Building transaction...");

  const inputs = [
    `${auctionId}field`, // [0] auction_id (public)
  ];

  console.log("[Aloe:buildCancelAuctionInputs] Input: auction_id:", inputs[0]);

  return {
    programId: PROGRAM_ID,
    functionName: "cancel_auction",
    inputs,
    fee: 100_000, // Lower fee — no cross-program call
  };
}

// ============================================
// CREDITS UTILITIES
// ============================================

/**
 * Build transfer_public_to_private transaction inputs
 * Converts public credits to a private record (needed for private bidding)
 * @param {Object} params
 * @param {string} params.recipientAddress - Address to receive the private record
 * @param {number} params.amount - Amount in microcredits to shield
 * @returns {Object} Transaction input object
 */
export function buildShieldCreditsInputs({ recipientAddress, amount }) {
  console.log("[Aloe:buildShieldCreditsInputs] Building transaction...");
  console.log("[Aloe:buildShieldCreditsInputs] Parameters:", {
    recipientAddress,
    amount,
  });

  const inputs = [
    recipientAddress,     // [0] recipient address
    `${amount}u64`,       // [1] amount in microcredits
  ];

  console.log("[Aloe:buildShieldCreditsInputs] Formatted inputs:");
  console.log("  [0] recipient:", inputs[0]);
  console.log("  [1] amount:", inputs[1]);

  return {
    programId: "credits.aleo",
    functionName: "transfer_public_to_private",
    inputs,
    fee: 100_000, // 0.1 credits fee
  };
}

// ============================================
// RECORD RETRIEVAL HELPERS
// ============================================

/**
 * Find a specific record from wallet by type and auction_id
 * @param {Function} requestRecords - Wallet adapter's requestRecords function
 * @param {string} recordType - Record type name (e.g., "BidCommitment", "RevealedBid")
 * @param {string} auctionId - Auction ID to match
 * @returns {Promise<string|null>} Record plaintext string or null
 */
export async function findRecord(requestRecords, recordType, auctionId) {
  console.log(`[Aloe:findRecord] Searching for ${recordType} with auction_id=${auctionId}`);

  try {
    const records = await requestRecords(PROGRAM_ID);
    console.log(`[Aloe:findRecord] Got ${records?.length || 0} records from wallet`);

    if (!records || records.length === 0) return null;

    // Find matching record by type and auction_id
    const match = records.find((r) => {
      const plaintext = typeof r === "string" ? r : r.plaintext || r.data;
      if (!plaintext) return false;
      // Check record type and auction_id field
      return (
        plaintext.includes(recordType) &&
        plaintext.includes(`auction_id: ${auctionId}field`)
      );
    });

    if (match) {
      console.log(`[Aloe:findRecord] Found matching ${recordType} record`);
      return typeof match === "string" ? match : match.plaintext || match.data;
    }

    console.log(`[Aloe:findRecord] No matching ${recordType} found`);
    return null;
  } catch (error) {
    console.error(`[Aloe:findRecord] Error searching records:`, error);
    return null;
  }
}

/**
 * Find a credits.aleo record with sufficient balance
 * @param {Function} requestRecords - Wallet adapter's requestRecords function
 * @param {number} requiredAmount - Minimum microcredits needed
 * @returns {Promise<string|null>} Credits record plaintext or null
 */
export async function findCreditsRecord(requestRecords, requiredAmount) {
  console.log(`[Aloe:findCreditsRecord] Searching for credits record with >= ${requiredAmount} microcredits`);

  try {
    const records = await requestRecords("credits.aleo");
    console.log(`[Aloe:findCreditsRecord] Got ${records?.length || 0} credits records`);

    if (!records || records.length === 0) return null;

    // Find a record with sufficient balance
    const match = records.find((r) => {
      const plaintext = typeof r === "string" ? r : r.plaintext || r.data;
      if (!plaintext) return false;

      // Extract microcredits amount from record plaintext
      // Format: "microcredits: 1000000u64"
      const amountMatch = plaintext.match(/microcredits:\s*(\d+)u64/);
      if (!amountMatch) return false;

      const amount = parseInt(amountMatch[1], 10);
      return amount >= requiredAmount;
    });

    if (match) {
      const plaintext = typeof match === "string" ? match : match.plaintext || match.data;
      console.log(`[Aloe:findCreditsRecord] Found credits record with sufficient balance`);
      return plaintext;
    }

    console.log(`[Aloe:findCreditsRecord] No credits record with sufficient balance found`);
    return null;
  } catch (error) {
    console.error(`[Aloe:findCreditsRecord] Error searching credits records:`, error);
    return null;
  }
}

// ============================================
// FORMAT HELPERS
// ============================================

/**
 * Format microcredits to human-readable credits
 * @param {number|string} microcredits - Amount in microcredits
 * @returns {string} Formatted string (e.g., "1.5 credits")
 */
export function formatCredits(microcredits) {
  const credits = Number(microcredits) / 1_000_000;
  return `${credits.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })} credits`;
}

/**
 * Parse credits string to microcredits
 * @param {string} credits - Credits amount as string (e.g., "1.5")
 * @returns {number} Microcredits as integer
 */
export function parseCreditsToMicro(credits) {
  return Math.floor(parseFloat(credits) * 1_000_000);
}

/**
 * Format block count to approximate time
 * @param {number} blocks - Number of blocks
 * @returns {string} Human-readable duration (e.g., "~1 hour")
 */
export function formatBlockDuration(blocks) {
  const minutes = Math.round(blocks / 6);

  if (minutes < 60) {
    return `~${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `~${hours} hour${hours !== 1 ? "s" : ""}`;
  }

  const days = Math.round(hours / 24);
  return `~${days} day${days !== 1 ? "s" : ""}`;
}

/**
 * Truncate Aleo address for display
 * @param {string} address - Full Aleo address
 * @param {number} chars - Characters to show on each end
 * @returns {string} Truncated address (e.g., "aleo1abc...xyz")
 */
export function truncateAddress(address, chars = 6) {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars + 5)}...${address.slice(-chars)}`;
}

/**
 * Generate a unique auction ID based on timestamp and random bytes
 * @returns {string} Unique ID as field string
 */
export function generateAuctionId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1_000_000);
  const id = BigInt(timestamp) * BigInt(1_000_000) + BigInt(random);
  return id.toString();
}
