# Wave 3: Vickrey (Second-Price) Auctions

**Timeline:** February 17 - March 3, 2026
**Theme:** Truthful Bidding
**Status:** Planned

---

## Overview

Wave 3 adds the **Vickrey (second-price) auction type** — where the winner pays the *second-highest* bid, not their own. This is the first expansion of the auction primitive beyond first-price sealed-bid.

**Why Vickrey matters for Aleo:** In a Vickrey auction, the dominant strategy is to bid your true valuation — no need to guess what others might bid. But this only works if bidders *can't see* each other's bids. On a transparent chain, Vickrey is just a regular auction with extra steps. On Aleo, the privacy guarantees make Vickrey's theoretical properties *actually hold*.

This is a "true sealed-bid Vickrey auction" — something impossible on Ethereum, Solana, or any transparent chain. Only ZK blockchains can deliver this, and Aloe is the first to implement it.

**Contract:** New program `aloe_auction_v3.aleo` at `contracts/zkauction_v3/src/main.leo`. This program handles both first-price and Vickrey auctions via an `auction_type` field. The same commit-reveal BHP256 scheme from v2 applies.

---

## Smart Contract

### Program: `aloe_auction_v3.aleo`

**Location:** `contracts/zkauction_v3/src/main.leo`

Imports `credits.aleo` for all value transfers. Uses the same `transfer_private_to_public` pattern from Wave 2 for private deposits.

### Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Struct | `AuctionV3` | `auction_id`, `auctioneer`, `item_id`, `auction_type` (u8), `min_bid`, `commit_deadline`, `reveal_deadline`, `status`, `winner`, `winning_bid`, `payment_amount` | Extended auction struct supporting multiple types. `payment_amount` differs from `winning_bid` in Vickrey auctions (winner pays 2nd-highest). |
| Struct | `CommitmentDataV3` | `bid_amount`, `salt`, `auction_id` | Helper struct for BHP256 commitment hashing |
| Record | `BidCommitmentV3` | `owner`, `auction_id`, `commitment`, `bid_amount`, `salt`, `deposit` | Private bid record — same pattern as v2 |

### Auction Type Constants

| Value | Type | Winner Pays | Use Case |
|-------|------|-------------|----------|
| `0u8` | First-Price | Highest bid | Standard sealed-bid auctions |
| `1u8` | Vickrey | 2nd-highest bid | Truthful bidding incentive |

### Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_first_price_auction` | Public | Creates a first-price auction (auction_type=0). Same parameters as v2: auction_id, item_id, min_bid, commit_duration, reveal_duration. |
| `create_vickrey_auction` | Public | Creates a Vickrey auction (auction_type=1). Same parameters as first-price. The only difference is `auction_type` is set to 1 in the stored struct. |
| `place_bid_v3` | Private + Public | Places a sealed bid on any v3 auction. Accepts a private `credits.aleo/credits` record. Calls `credits.aleo/transfer_private_to_public` to lock the deposit (hides sender address). Returns a `BidCommitmentV3` record. Same commit pattern for both auction types. |
| `reveal_bid_v3` | Private → Public | Bidder reveals their bid. For first-price auctions, finalize tracks highest bid/bidder. For Vickrey auctions, finalize tracks **both highest and second-highest** bids. If a new bid exceeds the current highest, the old highest becomes the second-highest. If a bid falls between first and second, it replaces only the second-highest. |
| `settle_first_price` | Public | Settles a first-price auction. Calls `credits.aleo/transfer_public` to send the highest bid amount to the auctioneer. Sets `payment_amount = winning_bid`. |
| `settle_vickrey` | Public | Settles a Vickrey auction. Calls `credits.aleo/transfer_public` to send the **second-highest** bid amount to the auctioneer. Winner's excess (own bid minus second-highest) is refundable. Sets `payment_amount = second_highest_bid`. With only 1 bidder, winner pays their own bid. |
| `claim_refund_v3` | Private | Non-winners reclaim deposits. For Vickrey winners, also refunds the difference between their bid and the second-highest. |
| `cancel_auction_v3` | Public | Auctioneer cancels if zero bids. |

### Vickrey-Specific Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `second_highest_bid` | `field => u64` | auction_id → second-highest revealed bid |
| `second_highest_bidder` | `field => address` | auction_id → second-highest bidder address |

### Vickrey Settlement Logic

```
// Pseudocode for settle_vickrey finalize
let highest: u64 = Mapping::get(highest_bid, auction_id);
let second: u64 = Mapping::get_or_use(second_highest_bid, auction_id, highest);

// Winner pays the SECOND-highest bid
let payment: u64 = second;

// Transfer payment to auctioneer
credits.aleo/transfer_public(auctioneer, payment);

// The winner can later claim refund of (highest - second) via claim_refund_v3
```

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| AuctionTypeSelector | `components/AuctionTypeSelector.jsx` | Radio group for selecting auction type (First-Price / Vickrey) during creation. Includes tooltip explaining each type. |
| VickreyBadge | `components/VickreyBadge.jsx` | Badge indicating "2nd Price" on Vickrey auctions — helps bidders understand the payment rule |
| VickreyExplainer | `components/VickreyExplainer.jsx` | Inline explainer: "You pay the 2nd-highest bid, not your own. Bid your true valuation." |

### Updated Components

| Component | Change |
|-----------|--------|
| `CreateAuctionForm.jsx` | Add AuctionTypeSelector toggle. Route to v3 contract for either type. |
| `AuctionCard.jsx` | Show VickreyBadge for auction_type=1. Display "You pay: 2nd highest bid" in Vickrey auctions. |
| `AuctionDetailDialog.jsx` | Updated to show Vickrey-specific information: payment rule, second-highest bid (after settlement). |
| `ClaimRefundButton.jsx` | Updated for Vickrey winners to also claim the excess (bid - 2nd highest). |

### Transaction Builders (`lib/auctionV3.js`)

New file for v3 contract interactions:

| Function | Description |
|----------|-------------|
| `buildCreateFirstPriceAuctionInputs(...)` | Inputs for `create_first_price_auction` |
| `buildCreateVickreyAuctionInputs(...)` | Inputs for `create_vickrey_auction` |
| `buildPlaceBidV3Inputs(auctionId, bidAmount, salt, deposit, creditsRecord)` | Inputs for `place_bid_v3` |
| `buildRevealBidV3Inputs(bidRecord, bidAmount, salt)` | Inputs for `reveal_bid_v3` |
| `buildSettleFirstPriceInputs(auctionId)` | Inputs for `settle_first_price` |
| `buildSettleVickreyInputs(auctionId)` | Inputs for `settle_vickrey` |
| `buildClaimRefundV3Inputs(bidRecord)` | Inputs for `claim_refund_v3` |

### Constants Update (`lib/constants.js`)

Add `AUCTION_V3: "aloe_auction_v3.aleo"` to `PROGRAMS`. Add `AUCTION_TYPES` enum:
```js
// Auction type constants matching on-chain values
AUCTION_TYPES: {
  FIRST_PRICE: 0,
  VICKREY: 1,
}
```

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Vickrey truthful bidding | Second-price mechanism incentivizes honest bids — no information leakage needed to bid optimally |
| Hidden second-highest | Even the winner doesn't know the exact second-highest bid until settlement. True sealed-bid Vickrey is impossible without ZK. |
| Same private deposit pattern | Uses `transfer_private_to_public` from Wave 2 — bidder addresses remain invisible |
| Underbid protection | Losing bidders' exact amounts never need to be revealed publicly |

**Privacy Score:** Very High — Vickrey auctions on Aleo deliver their theoretical guarantees (truthful bidding, no winner's curse) because the privacy is real, not simulated.

---

## Testing Checklist

### Vickrey Auction Creation
- [ ] Can create a Vickrey auction (auction_type = 1)
- [ ] AuctionV3 struct stored with correct auction_type
- [ ] Cannot create auction with invalid type (> 1)

### Vickrey Bid + Reveal
- [ ] Sealed bids use same commit-reveal BHP256 scheme as first-price
- [ ] Private credits record accepted for deposit (transfer_private_to_public)
- [ ] Reveal correctly tracks both highest and second-highest bids
- [ ] New highest bid demotes previous highest to second-highest
- [ ] Bid between first and second only updates second-highest
- [ ] Works correctly with 1 bidder (no second-highest — uses own bid)
- [ ] Works correctly with 2 bidders
- [ ] Works correctly with 3+ bidders

### Vickrey Settlement
- [ ] Settlement transfers 2nd-highest bid amount to auctioneer (not 1st)
- [ ] `payment_amount` set correctly to second-highest bid
- [ ] Winner can claim refund of (own bid - 2nd highest)
- [ ] Non-winners reclaim full deposits
- [ ] 1-bidder case: winner pays own bid (no 2nd-highest exists)

### First-Price Auctions (v3 contract)
- [ ] First-price auctions still work identically to v2 pattern
- [ ] Settlement transfers highest bid to auctioneer
- [ ] `payment_amount = winning_bid` for first-price

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Vickrey flow | Complete create → bid → reveal → settle working with 2nd-price payment |
| First-price compatibility | v3 first-price auctions identical behavior to v2 |
| Payment correctness | Winner pays exactly the 2nd-highest bid in Vickrey |
| Refund correctness | Vickrey winner refunded (bid - 2nd highest), losers refunded full deposit |
| Privacy maintained | Bidder addresses invisible during commit phase for both types |

---

## Demo Scenarios

1. **Vickrey Auction**: Create Vickrey → 3 bidders bid (100, 80, 60) → All reveal → Winner (100) pays 80 (2nd price) → Winner refunded 20 (100-80) → 80 and 60 bidders refunded full deposits
2. **Truthful Bidding Demo**: Show that bidding your true value is optimal — overbidding doesn't cost more, underbidding risks losing
3. **Single Bidder Vickrey**: Create Vickrey → 1 bidder bids 100 → Reveal → Wins and pays 100 (own bid, no 2nd-highest)
4. **First-Price on v3**: Create first-price on v3 contract → Same behavior as v2 — verifies backward compatibility

---

*Wave 3 Target Completion: March 3, 2026*
