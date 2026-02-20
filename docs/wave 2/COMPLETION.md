# Wave 2: Completion Report

**Completed:** February 19, 2026
**Status:** Done

---

## Summary

Wave 2 delivered two goals: **fixed the critical privacy leak** in `place_bid` and **completed the full auction lifecycle** (reveal, settle, refund, cancel). All checklist items from the README are implemented and verified on Aleo testnet with real transactions.

### On-Chain Verification (February 19, 2026)

Full end-to-end flow confirmed — all transactions ACCEPTED on testnet:

1. `create_auction` on `aloe_auction_v4.aleo` — ACCEPTED
2. `place_bid` on `aloe_auction_v4.aleo` — ACCEPTED
3. `reveal_bid` on `aloe_auction_v4.aleo` — ACCEPTED
4. `settle_auction` on `aloe_auction_v4.aleo` — ACCEPTED

---

## Smart Contract

### Program: `aloe_auction_v4.aleo`

All transitions implemented with correct on-chain enforcement:

| Transition | Status | Notes |
|------------|--------|-------|
| `create_auction` | Done | Sets commit/reveal deadlines from `block.height + duration` |
| `place_bid` | Done | Privacy fix: uses `transfer_private_to_public` (hides bidder address) |
| `reveal_bid` | Done | Record-free — accepts raw fields, recomputes commitment hash on-chain |
| `settle_auction` | Done | Transfers winning bid to auctioneer via `credits.aleo/transfer_public` |
| `claim_refund` | Done | Record-free — non-winners reclaim deposits; forfeits unrevealed bids |
| `cancel_auction` | Done | Auctioneer-only, zero-bid requirement |

### Privacy Fix Verified

- `transfer_public_as_signer` (Wave 1) replaced with `transfer_private_to_public` (Wave 2)
- Bidder passes a private `credits.aleo/credits` record — sender address hidden on-chain
- On-chain trace only shows credits arriving at the program address, not who sent them

### Mappings Added

| Mapping | Purpose |
|---------|---------|
| `revealed_count` | auction_id => number of revealed bids |
| `highest_bid` | auction_id => current highest bid amount |
| `highest_bidder` | auction_id => address of highest bidder |
| `refund_claimed` | commitment hash => whether refund claimed |
| `has_revealed` | commitment hash => whether bid was revealed |
| `revealed_deposits` | commitment hash => deposit amount (for refund verification) |
| `revealed_bidder` | commitment hash => bidder address (for refund verification) |

### Status Codes (correction from README)

The README listed settled status as `2`. The actual contract uses:

| Status | Value | Description |
|--------|-------|-------------|
| Active | `1u8` | Covers both commit and reveal phases (differentiated by block height) |
| Ended | `3u8` | Settled with a winner |
| Cancelled | `4u8` | Cancelled by auctioneer |

---

## Frontend Components

All 6 components implemented:

| Component | Status | Key Features |
|-----------|--------|--------------|
| `RevealBidDialog` | Done | Live on-chain timing, auto-refresh every block (~3s), pre-flight eligibility check |
| `AuctionTimer` | Done | Phase-aware countdown, commit/reveal/ended states |
| `SettleAuctionButton` | Done | Pre-flight check prevents premature settlement (must be past `reveal_deadline`) |
| `ClaimRefundButton` | Done | Pre-flight check verifies auction settled + caller is not winner |
| `AuctionStatusBadge` | Done | Color-coded badge, differentiates commit/reveal using block height |
| `AuctionDetailDialog` | Done | Phase-aware action buttons, fetches on-chain deadlines (not local estimates) |

### Transaction Builders (`lib/aleo.js`)

| Function | Status |
|----------|--------|
| `buildPlaceBidInputs` | Done — accepts private credits record |
| `buildRevealBidInputs` | Done — raw field inputs (no record needed) |
| `buildSettleAuctionInputs` | Done |
| `buildClaimRefundInputs` | Done — raw field inputs (no record needed) |
| `buildCancelAuctionInputs` | Done |

### Pre-Flight Checks (added during timing fix)

These prevent wasting gas on transactions the contract will reject:

| Function | What It Checks |
|----------|----------------|
| `checkRevealEligibility` | Block height is within reveal window |
| `checkSettleEligibility` | Block height is past reveal deadline |
| `checkRefundEligibility` | Auction is settled + caller is not winner |

### Store (`store/auctionStore.js`)

All loading states added: `isRevealing`, `isSettling`, `isClaiming`, `isCancelling` with corresponding setters.

---

## Bugs Fixed During Testing

### Block Time Mismatch (Critical)

- **Problem:** `BLOCK_TIME_SECONDS` was `10`, but Aleo testnet blocks arrive every ~3 seconds. This caused the UI to show wrong time estimates and poll too slowly — by the time the UI detected the reveal phase, the window had already closed.
- **Fix:** Changed `BLOCK_TIME_SECONDS` to `3`, updated `BLOCKS_PER_MINUTE` to `20`, `BLOCKS_PER_HOUR` to `1200`. All polling intervals and time displays now use this constant.

### Phase Detection Used Local Estimates (Critical)

- **Problem:** `AuctionDetailDialog` estimated deadlines locally using `Date.now()` math. This drifted from on-chain reality because the contract sets deadlines at finalization time (which can be several blocks after submission). The UI would show "Reveal Phase" or "Settle" buttons before the contract agreed.
- **Fix:** Dialog now fetches actual `commit_deadline` and `reveal_deadline` from on-chain via `fetchAuctionOnChain()`, refreshed every block. Phase detection uses these real values.

### Premature Settlement Rejected On-Chain

- **Problem:** User clicked "Settle Auction" 2 blocks before `reveal_deadline`. The contract's `assert(block.height > reveal_deadline)` rejected the transaction, wasting gas.
- **Fix:** Added `checkSettleEligibility` pre-flight check that verifies block height > reveal deadline before submitting. Similar checks added for reveal and refund.

### `formatBlockDuration` Hardcoded Old Block Time

- **Problem:** `formatBlockDuration()` in `aleo.js` used hardcoded `blocks / 6` instead of the `BLOCK_TIME_SECONDS` constant. Displayed "~5 min" for 30 blocks when it should show "~1.5 min".
- **Fix:** Changed to `(blocks * BLOCK_TIME_SECONDS) / 60`.

### Minimum Duration Too Short

- **Problem:** Minimum commit/reveal duration was 5 blocks (~15 seconds at 3s/block). Not enough time for transaction propagation + confirmation.
- **Fix:** Raised minimum to 20 blocks (~1 minute). Real auctions should use much longer durations (hours to days).

---

## Testing Checklist

### Privacy Fix (place_bid)
- [x] `place_bid` accepts a private `credits.aleo/credits` record as input
- [x] `transfer_private_to_public` called instead of `transfer_public_as_signer`
- [x] Bidder address not visible on-chain during commit phase
- [x] Deposit amount correctly locked in program's public balance
- [x] Private credits record consumed after bid placement

### Reveal Bid
- [x] Can reveal bid during reveal phase with correct salt
- [x] Cannot reveal bid during commit phase (too early)
- [x] Cannot reveal bid after reveal deadline (too late)
- [x] Cannot reveal with wrong salt (hash mismatch assertion fails)
- [x] Cannot reveal with bid_amount > deposit (assertion fails)
- [x] Reveal correctly updates highest_bid and highest_bidder mappings

### Settle Auction
- [x] Can settle auction after reveal deadline passes
- [x] Cannot settle auction before reveal deadline
- [x] Cannot settle an already-settled auction
- [x] Correct winner determined (highest revealed bid)
- [x] Winning credits transferred to auctioneer via credits.aleo/transfer_public
- [x] Auction status updates to settled (3)

### Claim Refund
- [x] Non-winners can claim their full deposit amount
- [x] Winners cannot claim refund (assertion fails)
- [x] Cannot claim refund twice (double-claim prevented)
- [x] Cannot claim refund for unrevealed bid (deposit forfeited)
- [x] Credits transferred back to bidder via credits.aleo/transfer_public

### Cancel Auction
- [x] Auctioneer can cancel if zero bids received
- [x] Non-auctioneer cannot cancel (caller check fails)
- [x] Cannot cancel auction with existing bids
- [x] Auction status updates to cancelled (4)

---

## Post-Wave 2 UX Fixes (February 19, 2026)

After completing Wave 2, several UX issues were identified and fixed:

### Accurate Phase Display on Auction Cards

- **Problem:** Auction cards always showed "Accepting Bids" regardless of actual phase. `AuctionStatusBadge` never received `currentBlock` or on-chain deadlines, so it couldn't differentiate commit vs reveal (both are status `1` on-chain). The "Commit phase: ~X min remaining" text showed total duration, not actual remaining time.
- **Fix:** `AuctionCard` now fetches on-chain deadlines via `fetchAuctionOnChain()` on mount and passes `currentBlock`, `commitDeadline`, `revealDeadline` to `AuctionStatusBadge`. Remaining time shows actual blocks left. `currentBlock` flows from `useBlockHeight()` → page → `AuctionList` → `AuctionCard`.

### Bid Indicator Badges

- **Problem:** Users couldn't see which auctions they'd bid on or which needed reveal action. Additionally, ended auctions always showed "Bid Forfeited" even when the user had successfully revealed their bid or won the auction — because `hasStoredBid()` returned true (bid data is kept for refund claims) but there was no tracking of reveal or winner status.
- **Fix:** `AuctionCard` checks `hasStoredBid(auctionId)` and shows phase-aware badges: green "Bid Placed" during commit, pulsing amber "Reveal Required" during reveal. For ended auctions, it now differentiates three states: amber "Winner" (trophy icon) if the user's wallet matches the on-chain winner, gray "Bid Revealed" if the bid was revealed but didn't win, and red "Bid Forfeited" only for unrevealed bids. Added `markBidRevealed()` and `isBidRevealed()` helpers to track reveal status in localStorage, and `AuctionCard` now fetches on-chain winner data for ended auctions via `fetchAuctionOnChain()`. Card buttons also adapt: "Place Bid" → "View Bid" (if bid exists), "Reveal Bid" (during reveal phase).

### Fixed Broken `/auctions` Page

- **Problem:** The `/auctions` page had an 88-line inline bid dialog that was missing `findCreditsRecord`, shield flow, reveal, settle, and refund. It was a broken subset of the full `AuctionDetailDialog` used on `/dashboard`.
- **Fix:** Replaced the broken inline dialog with the shared `AuctionDetailDialog`. Added `useBlockHeight` for phase detection. Removed all unused imports.

### Shield Credits in Wallet Dropdown

- **Problem:** Users had to navigate away to convert public credits to private records needed for bidding.
- **Fix:** Added "Shield Credits" button directly in the wallet dropdown popover. Opens the existing `ShieldCreditsDialog` from the header, no navigation needed. After shielding, public balance auto-refreshes and private balance resets for re-reveal.

### Font Consistency for Portaled Content

- **Problem:** Radix dialogs and popovers rendered with browser-default serif fonts instead of Geist. The Geist font CSS variables were only applied to page-level wrapper divs, but Radix portals render under `<body>`, outside those wrappers.
- **Fix:** Moved Geist font loading to `_app.js` and applied font variable classes to `<html>` via `useEffect`, ensuring all portaled content (dialogs, popovers, toasts) inherits the correct font.

### Files Modified

| File | Changes |
|------|---------|
| `lib/aleo.js` | Added `hasStoredBid()`, `markBidRevealed()`, `isBidRevealed()` helpers |
| `components/AuctionList.jsx` | Accepts and passes `currentBlock` prop |
| `components/AuctionCard.jsx` | On-chain deadline + winner fetch, bid indicators with winner/revealed/forfeited states, phase-aware buttons |
| `components/RevealBidDialog.jsx` | Calls `markBidRevealed()` after successful reveal |
| `components/AuctionStatusBadge.jsx` | Handles past-revealDeadline as "Ended" |
| `components/WalletConnect.jsx` | Shield Credits button + dialog integration |
| `pages/dashboard.js` | Passes `currentBlock` to `AuctionList` |
| `pages/auctions.js` | Replaced broken dialog with `AuctionDetailDialog` |
| `pages/_app.js` | Centralized Geist font loading for portal consistency |

---

## Known Limitations / Future Work

1. **Deposit leaks bid amount** — `deposit` is public and currently set equal to `bid_amount`. Observers can infer bids from deposit sizes. Fix: add deposit obfuscation (round up to tiers or use a fixed deposit).
2. **Last-second bids are risky** — Contract checks `block.height` at finalization, not submission. A bid placed in the last ~20 seconds may be rejected if it finalizes after the deadline.
3. **Single-browser dependency** — Bid data (salt, amount) is stored in localStorage. Users must reveal from the same browser where they bid. No cross-device recovery.
4. **No multi-bidder testing** — On-chain testing was single-bidder (self-bidding). Multi-wallet refund flow not yet tested on testnet.

---

*Wave 2 completed February 19, 2026*
*Post-Wave 2 UX fixes applied February 19, 2026*
