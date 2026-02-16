# Wave 4: Dutch (Descending-Price) Auctions + On-Chain Reader

**Timeline:** March 3 - March 17, 2026
**Theme:** Price Discovery
**Status:** Planned

---

## Overview

Wave 4 adds **Dutch (descending-price) auctions** — the third auction type in the Aloe primitive — and builds an **on-chain state reader** for querying auction data from Aleo mappings.

**Why Dutch auctions:** The price starts high and drops every block. The first buyer to commit wins at the current price. Dutch auctions are used by flower markets, US Treasury bond sales, and Google's IPO. On Aleo, the privacy advantage is unique: observers can't see *when* a buyer commits, hiding demand signals that would otherwise reveal market sentiment.

**Key difference from sealed-bid:** Dutch auctions skip the commit-reveal cycle entirely. It's a single atomic purchase — the buyer locks credits at the current price and the auction settles immediately. This makes Dutch auctions faster and simpler than first-price or Vickrey.

**On-chain reader:** A new utility (`lib/aleoReader.js`) for querying on-chain mappings via the Aleo REST API. Used by the frontend to display real-time auction state (current Dutch price, bid counts, auction status) without relying on a centralized backend.

---

## Smart Contract

### Program: `aloe_auction_v3.aleo` (extended)

**Location:** `contracts/zkauction_v3/src/main.leo`

Dutch auction transitions are added to the existing v3 contract alongside first-price and Vickrey.

### Updated Auction Type Constants

| Value | Type | Bidding Model | Winner Pays | Use Case |
|-------|------|---------------|-------------|----------|
| `0u8` | First-Price | Sealed commit-reveal | Highest bid | Standard auctions (Wave 2-3) |
| `1u8` | Vickrey | Sealed commit-reveal | 2nd-highest bid | Truthful bidding (Wave 3) |
| `2u8` | Dutch | Open descending price | Current price at purchase | Speed sales, liquidations, price discovery |

### Extended AuctionV3 Struct

New fields for Dutch auctions:

| Field | Type | Purpose |
|-------|------|---------|
| `starting_price` | `u64` | Initial price at auction start (Dutch only) |
| `price_decrement` | `u64` | Amount price decreases per block (Dutch only) |
| `min_price` | `u64` | Price floor — price won't drop below this (Dutch only) |

### Dutch Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_dutch_auction` | Public | Creator specifies auction_id, item_id, starting_price, price_decrement, min_price (price floor), and duration (in blocks). Sets `auction_type` to 2. No commit-reveal deadlines needed — uses a single `end_block` deadline. Finalize stores the AuctionV3 struct with Dutch-specific fields. |
| `dutch_buy` | Private + Public | First buyer wins. Accepts a private `credits.aleo/credits` record. Buyer specifies auction_id, auctioneer, and the current_price they're willing to pay. Calls `credits.aleo/transfer_private_to_public` to lock the price amount, then `credits.aleo/transfer_public` to immediately pay the auctioneer. **Single atomic transaction — no reveal step.** Finalize calculates the expected price as `starting_price - (price_decrement * blocks_elapsed)`, floors it at `min_price`, asserts the submitted price matches, and marks the auction as settled immediately with the buyer as winner. |

### Dutch Price Calculation (on-chain)

```leo
// Finalize logic for dutch_buy
let elapsed: u32 = block.height - auction.start_block;
let decrement: u64 = (auction.price_decrement as u64) * (elapsed as u64);
let expected_price: u64 = auction.starting_price.saturating_sub(decrement);
// Floor at min_price
let current_price: u64 = expected_price > auction.min_price ? expected_price : auction.min_price;
// Buyer must pay exactly the current price
assert_eq(submitted_price, current_price);
```

---

## On-Chain State Reader

### New File: `lib/aleoReader.js`

Utility for querying Aleo on-chain mappings via the REST API. Replaces mock data with real blockchain state.

| Function | Description |
|----------|-------------|
| `getAuction(programId, auctionId)` | Fetch an auction struct from the `auctions` mapping |
| `getBidCount(programId, auctionId)` | Fetch the bid count for an auction |
| `getHighestBid(programId, auctionId)` | Fetch the current highest revealed bid |
| `getCurrentDutchPrice(programId, auctionId)` | Calculate the live Dutch price from `starting_price`, `price_decrement`, and current block height |
| `getBlockHeight()` | Fetch the current Aleo block height |
| `getMappingValue(programId, mappingName, key)` | Generic mapping query (used by all above functions) |

### REST API Pattern

```js
// Generic mapping query via Aleo REST API
async function getMappingValue(programId, mappingName, key) {
  const url = `${RPC_ENDPOINT}/testnet/program/${programId}/mapping/${mappingName}/${key}`;
  const response = await fetch(url);
  return response.json();
}

// Dutch price calculation (client-side, mirrors on-chain logic)
function getCurrentDutchPrice(auction, currentBlockHeight) {
  const elapsed = currentBlockHeight - auction.start_block;
  const decrement = auction.price_decrement * elapsed;
  const price = Math.max(auction.starting_price - decrement, auction.min_price);
  return price;
}
```

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| DutchPriceTicker | `components/DutchPriceTicker.jsx` | Live descending price display. Polls block height and recalculates price every ~15 seconds. Shows current price, time until next decrement, and min price floor. |
| DutchBuyButton | `components/DutchBuyButton.jsx` | One-click purchase at the current Dutch price. Confirms the price with the user before submitting. Disabled if auction has ended or been purchased. |
| DutchAuctionCard | `components/DutchAuctionCard.jsx` | Auction card variant for Dutch auctions showing live price ticker, starting price, and price floor. |

### Updated Components

| Component | Change |
|-----------|--------|
| `AuctionTypeSelector.jsx` | Add Dutch option (3 types: First-Price / Vickrey / Dutch) |
| `CreateAuctionForm.jsx` | Conditional fields for Dutch: starting_price, price_decrement, min_price. Hide commit/reveal durations for Dutch (single duration instead). |
| `AuctionList.jsx` | Filter by auction type. Dutch auctions show live price instead of bid count. |
| `AuctionDetailDialog.jsx` | Dutch variant shows price ticker and buy button instead of bid/reveal UI. |

### Transaction Builders (`lib/auctionV3.js` — extended)

| Function | Description |
|----------|-------------|
| `buildCreateDutchAuctionInputs(auctionId, itemId, startingPrice, priceDecrement, minPrice, duration)` | Inputs for `create_dutch_auction` |
| `buildDutchBuyInputs(auctionId, auctioneer, currentPrice, creditsRecord)` | Inputs for `dutch_buy` — includes private credits record |

### Constants Update (`lib/constants.js`)

Update `AUCTION_TYPES` enum:
```js
AUCTION_TYPES: {
  FIRST_PRICE: 0,
  VICKREY: 1,
  DUTCH: 2,
}
```

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Hidden purchase timing | Observers can't see when a buyer commits to a Dutch auction — hides demand signals |
| Private buyer identity | `transfer_private_to_public` hides buyer address, same as sealed-bid pattern |
| No bid trail | Dutch auctions have no bid history — just a single purchase event |
| Price floor privacy | The min_price is public (set by creator), but the buyer's decision threshold is private |

**Privacy Score:** Medium-High — Dutch auctions inherently reveal the winning price (it's the current price at purchase time). But the buyer's identity remains hidden via `transfer_private_to_public`, and the timing of the purchase decision is obscured.

---

## Testing Checklist

### Dutch Auction Creation
- [ ] Can create a Dutch auction with valid parameters (starting_price, price_decrement, min_price, duration)
- [ ] AuctionV3 struct stored with auction_type=2 and Dutch fields populated
- [ ] Cannot create Dutch auction with price_decrement > starting_price
- [ ] Cannot create with starting_price < min_price

### Dutch Price Calculation
- [ ] Price decreases correctly per block
- [ ] Price floors at min_price and doesn't go below
- [ ] Price calculation identical on-chain (finalize) and client-side (aleoReader.js)
- [ ] Price at block 0 = starting_price
- [ ] Price at final block = min_price (if decrement covers the range)

### Dutch Buy
- [ ] First buyer wins at the current price
- [ ] Private credits record accepted (transfer_private_to_public)
- [ ] Cannot buy after auction duration expires
- [ ] Cannot buy an already-purchased Dutch auction
- [ ] Cannot submit a price that doesn't match the current on-chain price
- [ ] Auctioneer receives payment immediately (atomic settlement)
- [ ] Buyer set as winner and auction status set to settled

### On-Chain Reader
- [ ] `getAuction` correctly parses auction struct from mapping
- [ ] `getCurrentDutchPrice` returns correct price for current block height
- [ ] `getBlockHeight` returns real block height from RPC
- [ ] `getBidCount` works for first-price and Vickrey auctions
- [ ] Handles RPC errors gracefully (timeout, 404, malformed response)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Dutch flow | Create → price decreases → buyer purchases at current price |
| Price accuracy | Client-side price matches on-chain calculated price 100% of time |
| Atomic settlement | Dutch buy is a single transaction — no reveal step needed |
| On-chain reader | All mapping queries return correct, parsed data |
| All 3 auction types | First-Price, Vickrey, and Dutch all functional in v3 contract |

---

## Demo Scenarios

1. **Dutch Auction**: Create Dutch (start: 500, decrement: 5/block, floor: 100) → After 50 blocks price is 250 → Buyer purchases at 250 → Auctioneer receives 250 immediately
2. **Price Floor**: Create Dutch (start: 200, decrement: 10/block, floor: 50) → After 20 blocks price would be 0, but floors at 50 → Buyer purchases at 50
3. **Expired Dutch**: Create Dutch with short duration → No buyer before expiry → Auction expires unsold
4. **Side-by-Side**: Create one of each type (First-Price, Vickrey, Dutch) → Dashboard shows all three with appropriate UI variants

---

*Wave 4 Target Completion: March 17, 2026*
