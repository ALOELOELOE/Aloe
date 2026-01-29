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
  return {
    programId: PROGRAM_ID,
    functionName: "create_auction",
    inputs: [
      `${auctionId}field`, // auction_id: field
      `${itemId}field`, // item_id: field
      `${minBid}u64`, // min_bid: u64
      `${commitDuration}u32`, // commit_duration: u32
      `${revealDuration}u32`, // reveal_duration: u32
    ],
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
}) {
  // Generate salt if not provided
  const bidSalt = salt || generateSalt();

  // Deposit must be >= bid amount
  const depositAmount = deposit || bidAmount;

  return {
    programId: PROGRAM_ID,
    functionName: "place_bid",
    inputs: [
      `${auctionId}field`, // auction_id: field (public)
      `${bidAmount}u64`, // bid_amount: u64 (private)
      bidSalt, // salt: field (private)
      `${depositAmount}u64`, // deposit: u64 (public)
    ],
    fee: 100000, // 0.1 credits fee
    // Return the salt so caller can store it
    metadata: {
      salt: bidSalt,
      bidAmount,
      auctionId,
    },
  };
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
