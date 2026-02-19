// Aleo blockchain utilities for transaction building and cryptography

import { PROGRAM_ID, STORAGE_KEYS, BLOCK_TIME_SECONDS } from "./constants";

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
 * Store bid data locally for later reveal and refund
 * Stores all raw fields needed to reconstruct commitment on-chain
 * @param {string} auctionId - Auction identifier
 * @param {string} bidAmount - Bid amount as string
 * @param {string} salt - Salt used in commitment
 * @param {string|number} deposit - Deposit amount in microcredits
 */
export function storeBidLocally(auctionId, bidAmount, salt, deposit) {
  const key = `${STORAGE_KEYS.BID_PREFIX}${auctionId}`;
  const data = {
    bidAmount,
    salt,
    deposit: deposit || bidAmount, // Default deposit to bidAmount if not provided
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
 * Build reveal_bid transaction inputs (record-free — uses raw field data)
 * Wallets don't reliably index custom program records, so we pass raw fields
 * and the contract recomputes the commitment hash on-chain
 * @param {Object} params
 * @param {string} params.auctionId - Auction ID
 * @param {string|number} params.bidAmount - Bid amount in microcredits
 * @param {string} params.salt - Salt used in original commitment
 * @param {string|number} params.deposit - Deposit amount in microcredits
 * @returns {Object} Transaction input object
 */
export function buildRevealBidInputs({ auctionId, bidAmount, salt, deposit }) {
  console.log("[Aloe:buildRevealBidInputs] Building transaction...");
  console.log("[Aloe:buildRevealBidInputs] Parameters:", {
    auctionId, bidAmount, deposit,
  });

  // Deposit defaults to bid amount if not specified
  const depositAmount = deposit || bidAmount;

  const inputs = [
    `${auctionId}field`,     // [0] auction_id (public)
    `${bidAmount}u64`,       // [1] bid_amount (private)
    salt,                    // [2] salt (private) — already has "field" suffix
    `${depositAmount}u64`,   // [3] deposit (public)
  ];

  console.log("[Aloe:buildRevealBidInputs] Formatted inputs:");
  console.log("  [0] auction_id (public):", inputs[0]);
  console.log("  [1] bid_amount (private):", inputs[1]);
  console.log("  [2] salt (private):", inputs[2]);
  console.log("  [3] deposit (public):", inputs[3]);

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
 * Build claim_refund transaction inputs (record-free — uses raw field data)
 * Recomputes commitment hash on-chain from the same locally stored bid data
 * Contract verifies caller matches revealed_bidder mapping entry
 * @param {Object} params
 * @param {string} params.auctionId - Auction ID
 * @param {string|number} params.bidAmount - Bid amount in microcredits
 * @param {string} params.salt - Salt used in original commitment
 * @param {string|number} params.deposit - Deposit amount to refund
 * @returns {Object} Transaction input object
 */
export function buildClaimRefundInputs({ auctionId, bidAmount, salt, deposit }) {
  console.log("[Aloe:buildClaimRefundInputs] Building transaction...");
  console.log("[Aloe:buildClaimRefundInputs] Parameters:", {
    auctionId, bidAmount, deposit,
  });

  // Deposit defaults to bid amount if not specified
  const depositAmount = deposit || bidAmount;

  const inputs = [
    `${auctionId}field`,     // [0] auction_id (public)
    `${bidAmount}u64`,       // [1] bid_amount (private)
    salt,                    // [2] salt (private) — already has "field" suffix
    `${depositAmount}u64`,   // [3] deposit (public)
  ];

  console.log("[Aloe:buildClaimRefundInputs] Formatted inputs:");
  console.log("  [0] auction_id (public):", inputs[0]);
  console.log("  [1] bid_amount (private):", inputs[1]);
  console.log("  [2] salt (private):", inputs[2]);
  console.log("  [3] deposit (public):", inputs[3]);

  return {
    programId: PROGRAM_ID,
    functionName: "claim_refund",
    inputs,
    fee: 500_000, // 0.5 credits fee (cross-program call to credits.aleo)
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

// Note: findRecord() for custom program records (BidCommitment, RevealedBid) was removed
// in v4 because wallets don't reliably index records from custom programs.
// reveal_bid and claim_refund now use raw field inputs from local storage instead.

/**
 * Find a credits.aleo record with sufficient balance
 * @param {Function} requestRecords - Wallet adapter's requestRecords function
 * @param {number} requiredAmount - Minimum microcredits needed
 * @returns {Promise<string|null>} Credits record plaintext or null
 */
export async function findCreditsRecord(requestRecords, requiredAmount) {
  console.log(`[Aloe:findCreditsRecord] Searching for credits record with >= ${requiredAmount} microcredits`);

  try {
    // Pass includePlaintext=true so the wallet returns decrypted record data
    const records = await requestRecords("credits.aleo", true);
    console.log(`[Aloe:findCreditsRecord] Got ${records?.length || 0} credits records`);

    if (!records || records.length === 0) return null;

    // Log all records for debugging — helps identify stale/spent records
    records.forEach((r, i) => {
      const pt = typeof r === "string" ? r : r.recordPlaintext || r.plaintext || r.data || JSON.stringify(r);
      console.log(`[Aloe:findCreditsRecord] Record[${i}]:`, pt?.slice(0, 200));
    });

    // Reverse to prefer newest records — wallets append new records at the end,
    // and older records may be stale/spent (Shield Wallet doesn't always prune spent records)
    const reversed = [...records].reverse();

    // Find a record with sufficient balance (newest first)
    const match = reversed.find((r) => {
      // Handle different wallet adapter return formats
      // Shield Wallet uses 'recordPlaintext', other adapters may use 'plaintext' or 'data'
      const plaintext = typeof r === "string" ? r : r.recordPlaintext || r.plaintext || r.data || JSON.stringify(r);
      if (!plaintext) return false;

      // Extract microcredits amount — try multiple patterns for different wallet formats
      // Pattern 1: "microcredits: 1000000u64" (Leo record format)
      // Pattern 2: "microcredits": "1000000u64" (JSON format)
      // Pattern 3: just a number field called microcredits
      const amountMatch = plaintext.match(/microcredits[:\s"]*(\d+)/);
      if (!amountMatch) {
        console.log(`[Aloe:findCreditsRecord] No microcredits match in:`, plaintext.slice(0, 200));
        return false;
      }

      const amount = parseInt(amountMatch[1], 10);
      console.log(`[Aloe:findCreditsRecord] Found record with ${amount} microcredits (need ${requiredAmount})`);
      return amount >= requiredAmount;
    });

    if (match) {
      // Shield Wallet uses 'recordPlaintext', other adapters may use 'plaintext' or 'data'
      const plaintext = typeof match === "string" ? match : match.recordPlaintext || match.plaintext || match.data;
      console.log(`[Aloe:findCreditsRecord] Found credits record with sufficient balance`);
      console.log(`[Aloe:findCreditsRecord] Plaintext:`, plaintext?.slice(0, 100));
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
// ON-CHAIN MAPPING READERS
// ============================================

/**
 * Fetch a value from an on-chain program mapping via the Aleo REST API
 * @param {string} programId - Program ID (e.g., "aloe_auction_v4.aleo")
 * @param {string} mappingName - Mapping name (e.g., "highest_bid")
 * @param {string} key - Mapping key (e.g., "123field")
 * @returns {Promise<string|null>} Raw value string or null if not found
 */
export async function fetchMapping(programId, mappingName, key) {
  const { ALEO_API_URL, NETWORK } = await import("./constants");
  const url = `${ALEO_API_URL}/${NETWORK}/program/${programId}/mapping/${mappingName}/${key}`;
  console.log(`[Aloe:fetchMapping] GET ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[Aloe:fetchMapping] Not found (${res.status})`);
      return null;
    }
    const raw = await res.text();
    // API returns JSON-encoded strings like "123u64" or "true"
    const value = raw.replace(/^"|"$/g, "");
    console.log(`[Aloe:fetchMapping] ${mappingName}[${key}] = ${value}`);
    return value;
  } catch (error) {
    console.error(`[Aloe:fetchMapping] Error:`, error);
    return null;
  }
}

/**
 * Fetch the highest bid for an auction from the on-chain mapping
 * @param {string} auctionId - Auction ID (without "field" suffix)
 * @returns {Promise<number>} Highest bid in microcredits (0 if none)
 */
export async function fetchHighestBid(auctionId) {
  const value = await fetchMapping(PROGRAM_ID, "highest_bid", `${auctionId}field`);
  if (!value) return 0;
  // Strip type suffix (e.g., "5000000u64" -> 5000000)
  const amount = parseInt(value.replace(/u64$/, ""), 10);
  return isNaN(amount) ? 0 : amount;
}

/**
 * Fetch the highest bidder address for an auction from the on-chain mapping
 * @param {string} auctionId - Auction ID (without "field" suffix)
 * @returns {Promise<string|null>} Bidder address or null
 */
export async function fetchHighestBidder(auctionId) {
  return fetchMapping(PROGRAM_ID, "highest_bidder", `${auctionId}field`);
}

/**
 * Fetch auction data from on-chain mapping and parse into usable fields.
 * Returns the actual commit_deadline and reveal_deadline set by the contract,
 * which are the source of truth for phase detection.
 * @param {string} auctionId - Auction ID
 * @returns {Promise<Object|null>} Parsed auction data or null if not found
 */
export async function fetchAuctionOnChain(auctionId) {
  try {
    const raw = await fetchMapping(PROGRAM_ID, "auctions", `${auctionId}field`);
    if (!raw) return null;

    // Parse the Aleo struct string into fields
    const commitMatch = raw.match(/commit_deadline:\s*(\d+)u32/);
    const revealMatch = raw.match(/reveal_deadline:\s*(\d+)u32/);
    const statusMatch = raw.match(/status:\s*(\d+)u8/);
    const winnerMatch = raw.match(/winner:\s*(aleo1[a-z0-9]+)/);
    const winningBidMatch = raw.match(/winning_bid:\s*(\d+)u64/);

    return {
      commitDeadline: commitMatch ? parseInt(commitMatch[1], 10) : null,
      revealDeadline: revealMatch ? parseInt(revealMatch[1], 10) : null,
      status: statusMatch ? parseInt(statusMatch[1], 10) : null,
      winner: winnerMatch ? winnerMatch[1] : null,
      winningBid: winningBidMatch ? parseInt(winningBidMatch[1], 10) : null,
    };
  } catch (error) {
    console.error("[Aloe:fetchAuctionOnChain] Error:", error);
    return null;
  }
}

// ============================================
// TRANSACTION VALIDATION
// ============================================

/**
 * Check if a transaction ID looks like a real wallet-submitted transaction
 * Different wallets return different ID formats:
 *   - Leo Wallet: "at1..." (on-chain transaction ID)
 *   - Shield Wallet: "shield_..." (internal tracking ID, tx is still broadcast on-chain)
 * A missing or empty ID indicates the wallet rejected or failed the transaction.
 * @param {string} txId - Transaction ID returned by the wallet
 * @returns {boolean} True if the wallet returned a valid transaction ID
 */
export function isRealTransaction(txId) {
  return typeof txId === "string" && txId.length > 0;
}

// ============================================
// PRE-FLIGHT CHECKS
// ============================================

/**
 * Fetch the current block height from the Aleo network
 * @returns {Promise<number|null>} Current block height or null on error
 */
export async function fetchCurrentBlockHeight() {
  const { ALEO_API_URL, NETWORK } = await import("./constants");
  const url = `${ALEO_API_URL}/${NETWORK}/block/height/latest`;
  console.log(`[Aloe:fetchCurrentBlockHeight] GET ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const height = parseInt(await res.text(), 10);
    console.log(`[Aloe:fetchCurrentBlockHeight] Current block height: ${height}`);
    return isNaN(height) ? null : height;
  } catch (error) {
    console.error(`[Aloe:fetchCurrentBlockHeight] Error:`, error);
    return null;
  }
}

/**
 * Check if an auction is currently in the reveal phase on-chain
 * Queries the real block height and auction deadlines to prevent submitting
 * transactions that will definitely be rejected
 * @param {string} auctionId - Auction ID (without "field" suffix)
 * @returns {Promise<{ok: boolean, reason?: string, blockHeight?: number, commitDeadline?: number, revealDeadline?: number}>}
 */
export async function checkRevealEligibility(auctionId) {
  try {
    // Fetch current block height and auction data in parallel
    const [blockHeight, auctionRaw] = await Promise.all([
      fetchCurrentBlockHeight(),
      fetchMapping(PROGRAM_ID, "auctions", `${auctionId}field`),
    ]);

    if (blockHeight === null) {
      // Can't verify — let the user try anyway
      console.log("[Aloe:checkRevealEligibility] Could not fetch block height, skipping check");
      return { ok: true };
    }

    if (!auctionRaw) {
      return { ok: false, reason: "Auction not found on-chain. It may not be confirmed yet." };
    }

    // Parse the auction struct — Aleo returns it as a string like:
    // "{ auctioneer: aleo1..., item_id: 123field, ..., commit_deadline: 100u32, reveal_deadline: 200u32, ... }"
    const commitMatch = auctionRaw.match(/commit_deadline:\s*(\d+)u32/);
    const revealMatch = auctionRaw.match(/reveal_deadline:\s*(\d+)u32/);
    const statusMatch = auctionRaw.match(/status:\s*(\d+)u8/);

    if (!commitMatch || !revealMatch) {
      console.log("[Aloe:checkRevealEligibility] Could not parse deadlines from:", auctionRaw);
      return { ok: true }; // Can't verify — let user try
    }

    const commitDeadline = parseInt(commitMatch[1], 10);
    const revealDeadline = parseInt(revealMatch[1], 10);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;

    console.log(`[Aloe:checkRevealEligibility] Block: ${blockHeight}, Commit deadline: ${commitDeadline}, Reveal deadline: ${revealDeadline}, Status: ${status}`);

    // Check auction is still active
    if (status !== null && status !== 1) {
      return { ok: false, reason: `Auction is no longer active (status: ${status}).`, blockHeight, commitDeadline, revealDeadline };
    }

    // Check if still in commit phase
    if (blockHeight <= commitDeadline) {
      const blocksLeft = commitDeadline - blockHeight;
      const secondsLeft = blocksLeft * BLOCK_TIME_SECONDS;
      return {
        ok: false,
        reason: `Still in commit phase. ${blocksLeft} blocks (~${secondsLeft}s) until reveal opens.`,
        blockHeight, commitDeadline, revealDeadline,
      };
    }

    // Check if past reveal deadline
    if (blockHeight > revealDeadline) {
      const blocksPast = blockHeight - revealDeadline;
      return {
        ok: false,
        reason: `Reveal phase ended ${blocksPast} blocks ago. The reveal window has closed.`,
        blockHeight, commitDeadline, revealDeadline,
      };
    }

    // In the reveal window
    const blocksLeft = revealDeadline - blockHeight;
    console.log(`[Aloe:checkRevealEligibility] In reveal phase, ${blocksLeft} blocks remaining`);
    return { ok: true, blockHeight, commitDeadline, revealDeadline };
  } catch (error) {
    console.error("[Aloe:checkRevealEligibility] Error:", error);
    return { ok: true }; // On error, let user try anyway
  }
}

/**
 * Pre-flight check: verify the auction can be settled (reveal phase is over).
 * Prevents wasting gas on transactions the contract will reject.
 * @param {string} auctionId - Auction ID
 * @returns {Promise<Object>} { ok, reason?, blockHeight?, revealDeadline? }
 */
export async function checkSettleEligibility(auctionId) {
  try {
    // Fetch current block height and auction data in parallel
    const [blockHeight, auctionRaw] = await Promise.all([
      fetchCurrentBlockHeight(),
      fetchMapping(PROGRAM_ID, "auctions", `${auctionId}field`),
    ]);

    if (blockHeight === null) {
      console.log("[Aloe:checkSettleEligibility] Could not fetch block height, skipping check");
      return { ok: true };
    }

    if (!auctionRaw) {
      return { ok: false, reason: "Auction not found on-chain. It may not be confirmed yet." };
    }

    // Parse auction struct fields
    const revealMatch = auctionRaw.match(/reveal_deadline:\s*(\d+)u32/);
    const statusMatch = auctionRaw.match(/status:\s*(\d+)u8/);

    if (!revealMatch) {
      console.log("[Aloe:checkSettleEligibility] Could not parse reveal_deadline from:", auctionRaw);
      return { ok: true }; // Can't verify — let user try
    }

    const revealDeadline = parseInt(revealMatch[1], 10);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;

    console.log(`[Aloe:checkSettleEligibility] Block: ${blockHeight}, Reveal deadline: ${revealDeadline}, Status: ${status}`);

    // Check auction is still active (not already settled or cancelled)
    if (status !== null && status !== 1) {
      return { ok: false, reason: `Auction is no longer active (status: ${status}).`, blockHeight, revealDeadline };
    }

    // Contract requires block.height > reveal_deadline
    if (blockHeight <= revealDeadline) {
      const blocksLeft = revealDeadline - blockHeight;
      const secondsLeft = blocksLeft * BLOCK_TIME_SECONDS;
      return {
        ok: false,
        reason: `Reveal phase still open. ${blocksLeft} blocks (~${secondsLeft}s) until settlement is allowed.`,
        blockHeight, revealDeadline,
      };
    }

    // Past reveal deadline — settlement is allowed
    console.log(`[Aloe:checkSettleEligibility] Past reveal deadline, settlement allowed`);
    return { ok: true, blockHeight, revealDeadline };
  } catch (error) {
    console.error("[Aloe:checkSettleEligibility] Error:", error);
    return { ok: true }; // On error, let user try anyway
  }
}

/**
 * Pre-flight check: verify a refund can be claimed for this auction.
 * Checks that auction is settled (status 3) and that the caller is not the winner.
 * @param {string} auctionId - Auction ID
 * @param {string} callerAddress - Address of the wallet claiming refund
 * @returns {Promise<Object>} { ok, reason? }
 */
export async function checkRefundEligibility(auctionId, callerAddress) {
  try {
    const auctionRaw = await fetchMapping(PROGRAM_ID, "auctions", `${auctionId}field`);

    if (!auctionRaw) {
      return { ok: false, reason: "Auction not found on-chain. It may not be confirmed yet." };
    }

    // Parse auction struct fields
    const statusMatch = auctionRaw.match(/status:\s*(\d+)u8/);
    const winnerMatch = auctionRaw.match(/winner:\s*(aleo1[a-z0-9]+)/);

    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
    const winner = winnerMatch ? winnerMatch[1] : null;

    console.log(`[Aloe:checkRefundEligibility] Status: ${status}, Winner: ${winner}, Caller: ${callerAddress}`);

    // Contract requires status == 3 (Ended/settled)
    if (status !== 3) {
      if (status === 1) {
        return { ok: false, reason: "Auction has not been settled yet. The auctioneer must settle first." };
      }
      return { ok: false, reason: `Auction is not in a settled state (status: ${status}).` };
    }

    // Contract requires caller != winner
    if (callerAddress && winner && callerAddress === winner) {
      return { ok: false, reason: "You are the auction winner. Winners cannot claim refunds — your deposit was applied to your winning bid." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[Aloe:checkRefundEligibility] Error:", error);
    return { ok: true }; // On error, let user try anyway
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
  // Convert blocks to minutes using the actual block time constant
  const minutes = Math.round((blocks * BLOCK_TIME_SECONDS) / 60);

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
