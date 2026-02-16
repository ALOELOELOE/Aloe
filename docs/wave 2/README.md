# Wave 2: Complete Auction Lifecycle

**Timeline:** February 3 - February 17, 2026
**Theme:** Reveal, Settle, Refund
**Status:** In Progress

---

## Overview

Wave 2 completes the core auction lifecycle by implementing the reveal phase, auction settlement, refund mechanisms, and cancellation. After this wave, Aloe's auction module supports a full end-to-end sealed-bid auction flow — from creation through settlement — with real credits locked and transferred via `credits.aleo`.

This is the first module to reach full lifecycle completion, establishing patterns that OTC, Launches, NFT, and RWA modules will follow in subsequent waves.

---

## Smart Contract

### Program: `aloe_auction_v2.aleo`

> **credits.aleo Integration:** Wave 1's `place_bid` already transfers real credits into escrow via `credits.aleo/transfer_public_as_signer`. Wave 2's `claim_refund` and `settle_auction` must handle **actual credit transfers** back to users — not just mapping updates.

### New Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `reveal_bid` | Private → Public | Bidder reveals bid amount and salt. Contract re-hashes the inputs using `BHP256` and verifies the result matches the commitment stored in the `BidCommitment` record. Also checks that the deposit covers the bid amount. On-chain finalize checks timing (must be between commit and reveal deadlines), updates `highest_bid` / `highest_bidder` if this bid is the new leader, and increments `revealed_count`. |
| `settle_auction` | Public | Callable by anyone after the reveal deadline. Calls `credits.aleo/transfer_public` to send the winning bid amount to the auctioneer. Finalize awaits the transfer, then looks up the winner from `highest_bidder` and updates the auction status to settled (2). |
| `claim_refund` | Private | Non-winners consume their `BidCommitment` record to reclaim deposits. Calls `credits.aleo/transfer_public` to send the deposit amount back to the bidder. Finalize awaits the transfer, then asserts the auction is settled, the caller is not the winner, and the refund hasn't already been claimed. Marks the commitment as claimed in `refund_claimed`. |
| `cancel_auction` | Public | Auctioneer cancels an auction that received zero bids. Finalize checks that the caller is the auctioneer, the bid count is zero, and updates the auction status to cancelled (3). |

### New Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `revealed_count` | `field => u32` | auction_id → number of reveals received |
| `highest_bid` | `field => u64` | auction_id → current highest bid amount |
| `highest_bidder` | `field => address` | auction_id → address of the current highest bidder |
| `refund_claimed` | `field => bool` | commitment hash → whether refund was already claimed |

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| RevealBidDialog | `components/RevealBidDialog.jsx` | Modal for revealing bids — retrieves salt from localStorage, verifies commitment, submits reveal transaction |
| AuctionTimer | `components/AuctionTimer.jsx` | Countdown timer showing time remaining in current phase (commit / reveal / ended) |
| SettleAuctionButton | `components/SettleAuctionButton.jsx` | Button to trigger auction settlement after reveal phase ends |
| ClaimRefundButton | `components/ClaimRefundButton.jsx` | Button for non-winners to reclaim their deposit via credits.aleo |
| AuctionStatusBadge | `components/AuctionStatusBadge.jsx` | Visual badge showing current auction phase with color coding |
| AuctionDetailDialog | `components/AuctionDetailDialog.jsx` | Full auction detail view with phase-aware action buttons |

### Transaction Builders (lib/aleo.js)

| Function | Description |
|----------|-------------|
| `buildRevealBidInputs(bidRecord, bidAmount, salt)` | Constructs inputs for `reveal_bid` transition |
| `buildSettleAuctionInputs(auctionId, auctioneer, winningAmount)` | Constructs inputs for `settle_auction` transition |
| `buildClaimRefundInputs(bidRecord)` | Constructs inputs for `claim_refund` transition |
| `buildCancelAuctionInputs(auctionId)` | Constructs inputs for `cancel_auction` transition |

### Salt Management

- Retrieve salt from `localStorage` using `auction_id` as key (stored during `place_bid`)
- Display warning if salt not found (user must have placed bid from same browser)
- Provide manual salt entry as fallback input
- Show clear step-by-step instructions for the reveal process

### Store Updates (`store/auctionStore.js`)

| Field / Action | Description |
|----------------|-------------|
| `isRevealing` | Loading state for reveal transaction |
| `isSettling` | Loading state for settle transaction |
| `isClaiming` | Loading state for refund claim |
| `revealBid(bidRecord, amount, salt)` | Execute reveal_bid transaction |
| `settleAuction(auctionId)` | Execute settle_auction transaction |
| `claimRefund(bidRecord)` | Execute claim_refund transaction |
| `cancelAuction(auctionId)` | Execute cancel_auction transaction |

### UI Updates

1. **Auction Detail View** — Phase-aware action buttons (Bid → Reveal → Settle), real-time countdown, winner announcement banner, refund claim button for non-winners
2. **Dashboard Enhancements** — Auction cards show current phase, "Action Required" indicator for bids needing reveal, filter by phase

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Commit-reveal completion | Bids remain hidden until reveal phase begins — no early information leakage |
| Private reveal verification | Only the bidder can reveal their own bid using their private BidCommitment record |
| No bid linkage | Cannot correlate multiple bids from same address during commit phase |
| Selective disclosure | Only revealed bids become public; unrevealed bids remain private forever |
| Deposit forfeiture | Unrevealed bids forfeit deposits — creates economic incentive to reveal honestly |

**Privacy Score:** High — Completes the core privacy mechanism that makes sealed-bid auctions trustworthy on-chain.

---

## Testing Checklist

### Reveal Bid
- [ ] Can reveal bid during reveal phase with correct salt
- [ ] Cannot reveal bid during commit phase (too early)
- [ ] Cannot reveal bid after reveal deadline (too late)
- [ ] Cannot reveal with wrong salt (hash mismatch assertion fails)
- [ ] Cannot reveal with bid_amount > deposit (assertion fails)
- [ ] Reveal correctly updates highest_bid and highest_bidder mappings

### Settle Auction
- [ ] Can settle auction after reveal deadline passes
- [ ] Cannot settle auction before reveal deadline
- [ ] Cannot settle an already-settled auction
- [ ] Correct winner determined (highest revealed bid)
- [ ] Winning credits transferred to auctioneer via credits.aleo
- [ ] Auction status updates to settled (2)

### Claim Refund
- [ ] Non-winners can claim their full deposit amount
- [ ] Winners cannot claim refund (assertion fails)
- [ ] Cannot claim refund twice (double-claim prevented)
- [ ] Cannot claim refund for unrevealed bid (deposit forfeited)
- [ ] Credits transferred back to bidder via credits.aleo

### Cancel Auction
- [ ] Auctioneer can cancel if zero bids received
- [ ] Non-auctioneer cannot cancel (caller check fails)
- [ ] Cannot cancel auction with existing bids
- [ ] Auction status updates to cancelled (3)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Full auction cycle | Create → Bid → Reveal → Settle working end-to-end |
| Refund success rate | 100% of valid refund claims processed correctly |
| Credits conservation | Total credits in = total credits out (no value lost) |
| Phase transitions | Correct enforcement of commit/reveal/settle timing |
| Salt recovery | 95%+ users successfully retrieve salt for reveal |

---

## Demo Scenarios

1. **Happy Path**: Create auction → 2 bidders place bids → Both reveal → Higher bid wins → Winner announced → Loser claims refund → Auctioneer receives credits
2. **No Reveal**: Bidder places bid but doesn't reveal → Deposit forfeited → Auction settles with remaining reveals
3. **Single Bidder**: Only one bid → Single reveal → Wins by default → Settlement completes
4. **Cancelled Auction**: Create auction → No bids placed → Auctioneer cancels → Status set to Cancelled

---

*Wave 2 Target Completion: February 17, 2026*
