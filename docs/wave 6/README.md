# Wave 6: Auction Variants

**Timeline:** March 31 - April 14, 2026
**Theme:** Advanced Auction Mechanisms
**Status:** Planned

---

## Overview

Wave 6 introduces alternative auction formats beyond first-price sealed-bid: Vickrey (second-price), Dutch (descending price), and reverse auctions. Each variant serves different use cases while maintaining Aleo's privacy guarantees.

---

## Smart Contract

### Auction Types Enum

```leo
// Auction type constants
const FIRST_PRICE: u8 = 0u8;      // Highest bid wins, pays bid amount
const VICKREY: u8 = 1u8;          // Highest bid wins, pays second-highest
const DUTCH: u8 = 2u8;            // Descending price, first taker wins
const REVERSE: u8 = 3u8;          // Lowest bid wins (procurement)
```

### Extended Auction Struct

```leo
struct AuctionV2 {
    auction_id: field,
    auctioneer: address,
    item_id: field,
    auction_type: u8,             // NEW: Type of auction
    starting_price: u64,          // For Dutch auctions
    reserve_price: u64,           // Hidden minimum (optional)
    price_decrement: u64,         // Dutch: amount to decrease per block
    min_bid: u64,
    commit_deadline: u32,
    reveal_deadline: u32,
    status: u8,
    winner: address,
    winning_bid: u64,
    payment_amount: u64,          // NEW: Actual payment (may differ from winning_bid)
}
```

### New Mappings

```leo
mapping second_highest_bid: field => u64;     // For Vickrey auctions
mapping second_highest_bidder: field => address;
mapping dutch_current_price: field => u64;    // Current Dutch auction price
mapping reserve_met: field => bool;           // Whether reserve price was met
```

### Vickrey Auction Transitions

```leo
// Settlement calculates second-highest bid
async function finalize_settle_vickrey(auction_id: field) {
    let auction: AuctionV2 = Mapping::get(auctions_v2, auction_id);
    let winner: address = Mapping::get(highest_bidder, auction_id);
    let winning_bid: u64 = Mapping::get(highest_bid, auction_id);
    let second_bid: u64 = Mapping::get(second_highest_bid, auction_id);

    // Winner pays second-highest price (or min_bid if only one bidder)
    let payment: u64 = second_bid > 0u64 ? second_bid : auction.min_bid;

    let settled: AuctionV2 = AuctionV2 {
        ...auction,
        status: 2u8,
        winner: winner,
        winning_bid: winning_bid,
        payment_amount: payment,  // Pay second price
    };
    Mapping::set(auctions_v2, auction_id, settled);
}
```

### Dutch Auction Transitions

```leo
async transition dutch_buy(
    public auction_id: field,
) -> Future {
    return finalize_dutch_buy(auction_id, self.caller);
}

async function finalize_dutch_buy(auction_id: field, buyer: address) {
    let auction: AuctionV2 = Mapping::get(auctions_v2, auction_id);
    assert(auction.auction_type == 2u8); // Dutch
    assert(auction.status == 0u8);       // Still active

    // Calculate current price based on block height
    let elapsed: u32 = block.height - auction.commit_deadline; // Start block
    let decrement: u64 = auction.price_decrement * (elapsed as u64);
    let current_price: u64 = auction.starting_price - decrement;

    // Ensure price hasn't dropped below minimum
    assert(current_price >= auction.min_bid);

    // Immediate settlement
    let settled: AuctionV2 = AuctionV2 {
        ...auction,
        status: 2u8,
        winner: buyer,
        winning_bid: current_price,
        payment_amount: current_price,
    };
    Mapping::set(auctions_v2, auction_id, settled);
}
```

### Reverse Auction Transitions

```leo
// Lowest bid wins for procurement scenarios
async function finalize_settle_reverse(auction_id: field) {
    let auction: AuctionV2 = Mapping::get(auctions_v2, auction_id);
    let winner: address = Mapping::get(lowest_bidder, auction_id);
    let winning_bid: u64 = Mapping::get(lowest_bid, auction_id);

    let settled: AuctionV2 = AuctionV2 {
        ...auction,
        status: 2u8,
        winner: winner,
        winning_bid: winning_bid,
        payment_amount: winning_bid,
    };
    Mapping::set(auctions_v2, auction_id, settled);
}
```

---

## Frontend

### New Components

| Component | Description |
|-----------|-------------|
| `AuctionTypeSelector.jsx` | Choose auction format when creating |
| `VickreyExplainer.jsx` | Explains second-price mechanism |
| `DutchPriceDisplay.jsx` | Real-time descending price ticker |
| `DutchBuyButton.jsx` | One-click buy at current price |
| `ReverseAuctionCard.jsx` | Card styled for procurement auctions |
| `ReservePriceInput.jsx` | Optional hidden reserve price |
| `AuctionTypeFilter.jsx` | Filter auctions by type |

### Auction Type UX

#### First-Price (Default)
- Standard sealed-bid flow
- Highest bid wins, pays bid amount
- Best for: Most general auctions

#### Vickrey (Second-Price)
- Sealed-bid with twist
- Highest bid wins, pays second-highest amount
- Encourages truthful bidding
- Best for: Art, collectibles, unique items

#### Dutch (Descending)
- Price starts high, decreases over time
- First person to buy wins at current price
- No sealed bids needed
- Best for: Quick sales, perishable items, liquidations

#### Reverse (Procurement)
- Lowest bid wins
- For buyers seeking service providers
- Best for: Freelance work, contracts, procurement

### UI Updates

1. **Create Auction Page**
   - Auction type selection with explanations
   - Type-specific parameters (starting price, decrement rate)
   - Reserve price option

2. **Auction Cards**
   - Visual differentiation by type
   - Type-specific action buttons
   - Dutch: Live price ticker

3. **Auction Detail**
   - Type-specific flows
   - Vickrey: "You pay second-highest price" notice
   - Dutch: Countdown with price display
   - Reverse: "Lowest bid wins" indicator

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Vickrey privacy | Bids sealed; winner only sees second price |
| Dutch timing privacy | No one knows who's watching the price |
| Reverse bid privacy | Vendors' pricing strategies stay hidden |
| Reserve price hidden | Minimum acceptable price not revealed |

**Privacy Score Contribution:** High — Different auction types enable privacy-preserving mechanisms for various market structures.

---

## Testing Checklist

### Vickrey Auction
- [ ] Winner determined by highest bid
- [ ] Winner pays second-highest amount
- [ ] Single bidder pays minimum bid
- [ ] Refund difference to winner (bid - payment)
- [ ] Privacy maintained until reveal

### Dutch Auction
- [ ] Price decreases correctly over time
- [ ] First buyer wins at current price
- [ ] Cannot buy below minimum price
- [ ] Immediate settlement on purchase
- [ ] Price display updates in real-time

### Reverse Auction
- [ ] Lowest bid wins
- [ ] Bids sealed until reveal
- [ ] Auctioneer pays winner
- [ ] Multiple bidders handled correctly

### Reserve Price
- [ ] Reserve price hidden from bidders
- [ ] Auction fails if reserve not met
- [ ] Items returned if no valid bids
- [ ] Reserve revealed after auction ends

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Auction types available | 4 types fully functional |
| Vickrey accuracy | Correct second-price calculation |
| Dutch price updates | Real-time (< 1s latency) |
| Type-specific UX | Clear differentiation |
| Reserve price privacy | 100% hidden until settlement |

---

## Use Case Examples

### Vickrey: Art Auction
> "I'm auctioning a rare digital artwork. Vickrey encourages bidders to bid their true value since they'll only pay the second price."

### Dutch: Flash Sale
> "I want to sell 100 tokens quickly. Start at 10 credits, drop 0.1 credits per block until someone buys."

### Reverse: Freelance Bidding
> "I need a smart contract audit. Vendors submit sealed bids, lowest qualified bid wins the contract."

### First-Price with Reserve
> "Auctioning my NFT with a hidden reserve of 500 credits. If no one bids above that, I keep the NFT."

---

## Educational Content

### In-App Explanations
- Tooltip explaining each auction type
- "How Vickrey works" modal
- "Why bid truthfully?" explainer
- Dutch auction tutorial animation

### Documentation
- Detailed mechanism descriptions
- When to use each type
- Strategy guides for bidders

---

*Wave 6 Target Completion: April 14, 2026*
