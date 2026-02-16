# Wave 3: Advanced Auction Types + Auction Dashboard

**Timeline:** February 17 - March 3, 2026
**Theme:** Auction Variants & Activity Tracking
**Status:** Planned

---

## Overview

Wave 3 has two goals: **expand auction capabilities** with Vickrey (second-price) and Dutch (descending-price) auction types, and **build an activity dashboard** that tracks all auction activity across types.

With Wave 2 completing the first-price sealed-bid lifecycle, Wave 3 adds two new auction mechanisms that serve different use cases. The dashboard provides a single view of all auction activity and is architecturally designed to expand into a cross-module activity feed as OTC, Launches, NFT, and RWA modules come online in later waves.

**Auction Types Added:**
- **Vickrey (Second-Price):** Winner pays the second-highest bid. Incentivizes truthful bidding because overbidding doesn't cost more and underbidding risks losing.
- **Dutch (Descending-Price):** Price starts high and decreases each block. First buyer wins at the current price. No commit-reveal needed.

---

## Smart Contract

### Program: `aloe_auction_v3.aleo`

**Location:** `contracts/zkauction_v3/src/main.leo`

Imports `credits.aleo` for all value transfers.

### Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Struct | `AuctionV3` | `auction_id`, `auctioneer`, `item_id`, `auction_type` (u8), `min_bid`, `starting_price`, `price_decrement`, `commit_deadline`, `reveal_deadline`, `status`, `winner`, `winning_bid`, `payment_amount` | Extended auction struct supporting all types. `payment_amount` differs from `winning_bid` in Vickrey (2nd-highest) and Dutch (current price). |

### Auction Type Constants

| Value | Type | Bidding Model | Winner Pays | Use Case |
|-------|------|---------------|-------------|----------|
| `0u8` | First-Price | Sealed commit-reveal | Highest bid | Standard auctions (Wave 2) |
| `1u8` | Vickrey | Sealed commit-reveal | 2nd-highest bid | Truthful bidding incentive |
| `2u8` | Dutch | Open descending price | Current price at purchase | Speed sales, liquidations |

### Vickrey Transitions

| Transition | Description |
|------------|-------------|
| `create_vickrey_auction` | Same as first-price creation but sets `auction_type` to 1. Commit-reveal flow is identical. |
| `reveal_vickrey_bid` | Same reveal logic but finalize tracks **both** the highest and second-highest bids. If a new bid exceeds the current highest, the old highest becomes the second-highest. If a bid is between first and second, it replaces only the second-highest. |
| `settle_vickrey` | Calls `credits.aleo/transfer_public` to send the **second-highest** bid amount (not the highest) to the auctioneer. Finalize sets `payment_amount` to the second-highest. With only 1 bidder, winner pays their own bid. |

### Vickrey Additional Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `second_highest_bid` | `field => u64` | auction_id → second-highest revealed bid |
| `second_highest_bidder` | `field => address` | auction_id → second-highest bidder |

### Dutch Transitions

| Transition | Description |
|------------|-------------|
| `create_dutch_auction` | Creator specifies starting_price, price_decrement (per block), min_bid (price floor), and duration. Sets `auction_type` to 2. No commit-reveal needed. |
| `dutch_buy` | First buyer wins. Caller specifies auction_id, auctioneer, and current_price. Calls `credits.aleo/transfer_public_as_signer` to pay the auctioneer. Finalize calculates the expected price as `starting_price - (price_decrement * elapsed_blocks)`, floors it at `min_bid`, and asserts the submitted price matches. Marks auction as settled immediately. |

---

## Auction Dashboard

### New Page: `/my-activity`

An activity page that initially tracks all **auction** activity across types (first-price, Vickrey, Dutch). Shows auction summary cards (active count + action-required count per auction type) and a chronological activity feed of recent auction actions.

This page is architecturally designed to expand into a **cross-module activity feed** as OTC (Wave 4), Launches (Wave 5), NFT (Wave 6), and RWA (Wave 7) modules come online. Each new wave will add its module data to this dashboard.

**Auction Summary Cards:**
- First-Price: active bids, reveals needed
- Vickrey: active bids, reveals needed
- Dutch: active auctions, buy opportunities

**Activity Feed:** Chronological list of recent auction actions (bids placed, reveals submitted, settlements completed, refunds claimed) with timestamps and links to auction detail pages.

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| AuctionTypeSelector | `components/AuctionTypeSelector.jsx` | Radio group for selecting auction type (First-Price / Vickrey / Dutch) during creation |
| VickreyBadge | `components/VickreyBadge.jsx` | Badge indicating "2nd Price" auction type |
| DutchPriceTicker | `components/DutchPriceTicker.jsx` | Live-updating price display that decreases over blocks for Dutch auctions |
| DutchBuyButton | `components/DutchBuyButton.jsx` | Buy at current Dutch price — shows countdown and current price |
| ActivityDashboard | `components/ActivityDashboard.jsx` | Main dashboard component showing all auction activity across types |
| AuctionActivityCard | `components/AuctionActivityCard.jsx` | Summary card per auction type showing active count and recent actions |
| NotificationBanner | `components/NotificationBanner.jsx` | Banner for actions requiring attention (bids needing reveal, auctions to settle) |
| ActivityFeed | `components/ActivityFeed.jsx` | Chronological feed of all user auction actions |

### New Store (`store/activityStore.js`)

Aggregation store that reads from `auctionStore` to compile activity across all auction types. Provides `getRecentActivity()` (merged and sorted by timestamp), `getAuctionSummary()` (active + actionRequired per type), and notification management (`notifications`, `addNotification`, `dismissNotification`).

Designed for extension: as module stores are added in Waves 4-7 (`dealStore`, `launchStore`, `nftStore`, `rwaStore`), this store will import from them and aggregate cross-module data.

### Constants Update (`lib/constants.js`)

Add `AUCTION_V3: "aloe_auction_v3.aleo"` to `PROGRAMS`. Add `AUCTION_TYPES` enum (FIRST_PRICE=0, VICKREY=1, DUTCH=2) and `AUCTION_TYPE_LABELS` for display strings.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Vickrey truthful bidding | Second-price mechanism encourages honest bids without information leakage |
| Dutch instant privacy | No bid history exposed — first buyer wins at current price |
| Dashboard privacy | Activity data loaded from private records — server sees nothing |
| Client-side aggregation | All activity data stays client-side; no centralized activity log |

**Privacy Score:** Medium-High — Vickrey adds economic privacy (you never overpay), Dutch adds speed privacy (no bid trail).

---

## Testing Checklist

### Vickrey Auction
- [ ] Can create a Vickrey auction (auction_type = 1)
- [ ] Sealed bids use same commit-reveal as first-price
- [ ] Reveal correctly tracks both highest and second-highest bids
- [ ] Settlement transfers 2nd-highest bid amount (not 1st)
- [ ] Winner's excess (1st - 2nd) refundable
- [ ] Works correctly with 1 bidder (pays own bid)
- [ ] Works correctly with 2+ bidders

### Dutch Auction
- [ ] Can create a Dutch auction with starting price and decrement
- [ ] Price decreases correctly per block
- [ ] Price floors at min_bid
- [ ] First buyer wins at current price
- [ ] Cannot buy after auction expires
- [ ] Cannot buy already-settled Dutch auction
- [ ] Price calculation correct at various block heights

### Activity Dashboard
- [ ] Shows activity from all auction types (first-price, Vickrey, Dutch)
- [ ] Auction summary cards show correct active counts
- [ ] Activity feed sorted chronologically
- [ ] Notification banner shows pending actions (reveals needed, etc.)
- [ ] Clicking activity item navigates to correct auction detail
- [ ] Empty states display correctly per auction type

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Vickrey flow | Complete create → bid → reveal → settle working with 2nd-price payment |
| Dutch flow | Create → price decreases → buyer purchases at current price |
| Dashboard | All auction types' data rendered correctly |
| Notification accuracy | 100% of pending actions surfaced |
| Page load time | Activity dashboard < 3 seconds |

---

## Demo Scenarios

1. **Vickrey Auction**: Create Vickrey → 3 bidders bid (100, 80, 60) → All reveal → Winner (100) pays 80 (2nd price) → 80 and 60 bidders refunded
2. **Dutch Auction**: Create Dutch (start: 500, decrement: 5/block) → After 50 blocks price is 250 → Buyer purchases at 250
3. **Activity Dashboard**: User has 2 first-price auctions, 1 Vickrey bid, and a Dutch auction watched → Dashboard shows all with correct counts and chronological feed

---

*Wave 3 Target Completion: March 3, 2026*
