# Wave 7: Reverse + Batch Auction Types

**Timeline:** April 14 - April 28, 2026
**Theme:** Covering All Auction Formats
**Status:** Planned

---

## Overview

Wave 7 completes the auction type library by adding **reverse auctions** and **batch auctions** — the final two formats that round out the Aloe primitive.

**Reverse auctions (auction_type=3):** A buyer posts what they want and a maximum budget. Sellers submit sealed bids — the **lowest** bid wins. Use cases: procurement, freelance bidding, service sourcing, supply chain. Wave 6's procurement skin used a UI-level bid inversion to simulate reverse auctions; Wave 7 makes it a first-class on-chain type with proper lowest-bid-wins logic.

**Batch auctions (auction_type=4):** Multiple identical items sold simultaneously at a **uniform clearing price**. All bids above the clearing price win; all winners pay the same price. Use cases: token sales, treasury auctions, fair price discovery, IPO-style distributions. This is the same mechanism used by the US Treasury for bond auctions and by many token launch platforms.

After this wave, Aloe supports **5 auction types** — the most comprehensive auction primitive on any blockchain:
1. First-Price (sealed-bid)
2. Vickrey (second-price)
3. Dutch (descending-price)
4. Reverse (lowest-bid-wins)
5. Batch (uniform clearing price)

---

## Smart Contract

### Program: `aloe_auction_v3.aleo` (extended)

**Location:** `contracts/zkauction_v3/src/main.leo`

### Complete Auction Type Constants

| Value | Type | Bidding Model | Winner Determination | Use Case |
|-------|------|---------------|---------------------|----------|
| `0u8` | First-Price | Sealed commit-reveal | Highest bid wins, pays own bid | Standard auctions |
| `1u8` | Vickrey | Sealed commit-reveal | Highest bid wins, pays 2nd-highest | Truthful bidding |
| `2u8` | Dutch | Open descending price | First buyer wins at current price | Speed sales |
| `3u8` | Reverse | Sealed commit-reveal | Lowest bid wins | Procurement, sourcing |
| `4u8` | Batch | Sealed commit-reveal | All bids above clearing price win, pay uniform price | Token sales, fair distribution |

### Reverse Auction Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_reverse_auction` | Public | Buyer specifies auction_id, item_id (description hash), max_budget, commit_duration, and reveal_duration. Sets `auction_type` to 3. The `min_bid` field is repurposed as `max_budget` — bids above this are rejected. |
| `place_reverse_bid` | Private + Public | Seller submits a sealed bid representing their asking price. Accepts a private `credits.aleo/credits` record for deposit (guarantees seller commitment). Deposit = bid amount. Commitment hash uses same BHP256 scheme. |
| `reveal_reverse_bid` | Private → Public | Seller reveals their asking price. Finalize tracks the **lowest** bid and lowest bidder (opposite of first-price). If a new bid is lower than the current lowest, it becomes the new leader. |
| `settle_reverse` | Public | Buyer pays the winning (lowest) bid amount to the winning seller via `credits.aleo/transfer_public`. Losing sellers' deposits are refunded. |

### Reverse-Specific Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `lowest_bid` | `field => u64` | auction_id → lowest revealed bid |
| `lowest_bidder` | `field => address` | auction_id → lowest bidder (winning seller) |

### Batch Auction Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_batch_auction` | Public | Seller specifies auction_id, item_id, total_units (number of items for sale), min_price_per_unit, commit_duration, and reveal_duration. Sets `auction_type` to 4. |
| `place_batch_bid` | Private + Public | Bidder submits a sealed bid specifying quantity and price_per_unit. Deposit = quantity * price_per_unit. Same BHP256 commitment scheme, but commitment includes both quantity and price. |
| `reveal_batch_bid` | Private → Public | Bidder reveals quantity and price_per_unit. Finalize adds the bid to an ordered list for clearing price calculation. |
| `settle_batch` | Public | Calculates the clearing price: bids are sorted by price (descending), units allocated until total_units exhausted. The clearing price = the lowest winning bid's price. All winners pay this uniform price. Excess deposits (bid_price - clearing_price) * quantity are refundable. Auctioneer receives clearing_price * total_units via `credits.aleo/transfer_public`. |

### Batch-Specific Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Record | `BatchBid` | `owner`, `auction_id`, `commitment`, `quantity` (u64), `price_per_unit` (u64), `salt`, `deposit` | Extended bid record with quantity field |
| Struct | `BatchBidData` | `quantity`, `price_per_unit`, `salt`, `auction_id` | Helper struct for BHP256 batch commitment hashing |

### Batch-Specific Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `batch_clearing_price` | `field => u64` | auction_id → uniform clearing price |
| `batch_total_units` | `field => u64` | auction_id → total units available |
| `batch_units_allocated` | `field => u64` | auction_id → total units allocated to winners |
| `batch_bid_prices` | `field => u64` | hash(auction_id, bid_index) → revealed bid price (for clearing calculation) |
| `batch_bid_quantities` | `field => u64` | hash(auction_id, bid_index) → revealed bid quantity |

### Batch Settlement Algorithm (Finalize)

```
// Pseudocode for settle_batch finalize

// Step 1: Sort revealed bids by price (descending)
// (In practice, reveal_batch_bid inserts bids in sorted order using
// a counter + comparison approach since Leo doesn't have dynamic arrays)

// Step 2: Allocate units starting from highest-priced bids
let remaining_units = total_units;
let clearing_price = 0;
for each bid in sorted_bids (descending price):
    if remaining_units >= bid.quantity:
        remaining_units -= bid.quantity;
        clearing_price = bid.price_per_unit; // Last allocated bid sets clearing price
    else:
        // Partial fill: this bid gets remaining_units at their price
        clearing_price = bid.price_per_unit;
        remaining_units = 0;
        break;

// Step 3: All winners pay clearing_price * their_quantity
// Step 4: Excess = (bid_price - clearing_price) * quantity → refundable
```

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| ReverseAuctionForm | `components/ReverseAuctionForm.jsx` | Form for creating a reverse auction — max budget, description, duration |
| ReverseAuctionCard | `components/ReverseAuctionCard.jsx` | Card showing RFQ details, quote count, budget, and "Submit Quote" action |
| BatchAuctionForm | `components/BatchAuctionForm.jsx` | Form for creating a batch auction — total units, min price per unit, duration |
| BatchAuctionCard | `components/BatchAuctionCard.jsx` | Card showing units available, current bid count, min price |
| BatchBidDialog | `components/BatchBidDialog.jsx` | Modal for batch bidding — quantity and price_per_unit inputs with cost calculator |
| BatchResultsView | `components/BatchResultsView.jsx` | Post-settlement view showing clearing price, winning bids, and unit allocation |

### Updated Components

| Component | Change |
|-----------|--------|
| `AuctionTypeSelector.jsx` | Updated with all 5 types: First-Price, Vickrey, Dutch, Reverse, Batch |
| `CreateAuctionForm.jsx` | Conditional fields for each type. Reverse: max_budget. Batch: total_units, min_price_per_unit. |
| `AuctionList.jsx` | Filter includes all 5 types. Type-specific card rendering. |
| `AuctionDetailDialog.jsx` | Type-aware detail view for reverse (shows lowest bid) and batch (shows clearing price). |

### Transaction Builders (`lib/auctionV3.js` — extended)

| Function | Description |
|----------|-------------|
| `buildCreateReverseAuctionInputs(...)` | Inputs for `create_reverse_auction` |
| `buildPlaceReverseBidInputs(auctionId, bidAmount, salt, deposit, creditsRecord)` | Inputs for `place_reverse_bid` |
| `buildRevealReverseBidInputs(bidRecord, bidAmount, salt)` | Inputs for `reveal_reverse_bid` |
| `buildSettleReverseInputs(auctionId)` | Inputs for `settle_reverse` |
| `buildCreateBatchAuctionInputs(...)` | Inputs for `create_batch_auction` |
| `buildPlaceBatchBidInputs(auctionId, quantity, pricePerUnit, salt, deposit, creditsRecord)` | Inputs for `place_batch_bid` |
| `buildRevealBatchBidInputs(bidRecord, quantity, pricePerUnit, salt)` | Inputs for `reveal_batch_bid` |
| `buildSettleBatchInputs(auctionId)` | Inputs for `settle_batch` |

### Constants Update (`lib/constants.js`)

Update `AUCTION_TYPES` enum:
```js
AUCTION_TYPES: {
  FIRST_PRICE: 0,
  VICKREY: 1,
  DUTCH: 2,
  REVERSE: 3,
  BATCH: 4,
}
```

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Sealed reverse bids | Supplier quotes hidden — no competitor intelligence during commit phase |
| Batch bid privacy | Individual bid prices and quantities hidden until reveal — prevents strategic bidding |
| Uniform clearing price | All winners pay the same price — no price discrimination |
| Private batch quantities | How many units each bidder wants remains hidden during commit phase |

**Privacy Score:** High — Reverse auctions prevent quote leakage in procurement. Batch auctions prevent strategic underbidding by hiding demand.

---

## Testing Checklist

### Reverse Auction
- [ ] Can create a reverse auction with max_budget
- [ ] Sellers can place sealed bids (asking prices)
- [ ] Reveal correctly tracks the lowest bid / lowest bidder
- [ ] Settlement pays the winning (lowest) seller
- [ ] Losing sellers' deposits refunded
- [ ] Cannot bid above max_budget
- [ ] Works with 1 seller (wins by default)
- [ ] Works with 3+ sellers

### Batch Auction
- [ ] Can create a batch auction with total_units and min_price_per_unit
- [ ] Bidders can submit sealed bids with quantity + price_per_unit
- [ ] Deposit correctly calculated as quantity * price_per_unit
- [ ] Reveal correctly records bid for clearing price calculation
- [ ] Settlement calculates correct clearing price
- [ ] All winners pay uniform clearing price
- [ ] Excess deposits (bid_price - clearing_price) * quantity refundable
- [ ] Partial fill: last winning bidder may get fewer units than requested
- [ ] Works with more demand than supply (oversubscribed)
- [ ] Works with less demand than supply (undersubscribed)

### All 5 Auction Types
- [ ] AuctionTypeSelector shows all 5 types
- [ ] Each type creates correct auction on-chain
- [ ] Dashboard correctly renders all 5 types with appropriate cards
- [ ] Type filter works across all types

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Reverse flow | Create → sellers bid → reveal → lowest wins → payment |
| Batch flow | Create → bidders bid → reveal → clearing price → uniform payment |
| 5 types working | All auction types functional in single v3 contract |
| Clearing price accuracy | Batch clearing price matches expected calculation |
| No contract size issues | v3 contract compiles and deploys within Aleo size limits |

---

## Demo Scenarios

1. **Reverse Auction**: Buyer posts RFQ (max 5000 credits) → 3 suppliers quote (200, 350, 500) → Reveal → Lowest quote (200) wins → Buyer pays 200 to winning supplier → Other suppliers refunded
2. **Batch Token Sale**: Seller offers 100 tokens → 5 bidders bid varying quantities and prices → Clearing price calculated at 50 credits/token → All bidders above 50 win → All pay 50 per token → Excess refunded
3. **Oversubscribed Batch**: 100 tokens available → Demand for 300 tokens → Top bidders allocated first → Clearing price higher due to competition
4. **Full Type Showcase**: Dashboard displays one of each type (First-Price, Vickrey, Dutch, Reverse, Batch) side by side — demonstrates the breadth of the Aloe auction primitive

---

*Wave 7 Target Completion: April 28, 2026*
