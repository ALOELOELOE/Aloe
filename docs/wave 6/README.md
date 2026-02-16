# Wave 6: Multi-Use-Case Frontend Skins

**Timeline:** March 31 - April 14, 2026
**Theme:** One Primitive, Many Faces
**Status:** Planned

---

## Overview

Wave 6 proves the "auction primitive" thesis by building **different frontend skins** on top of the same `aloe_auction_v3.aleo` contract. Each skin reframes the auction for a specific use case — without writing any new smart contract code.

**The point:** Aloe isn't a product for one audience. It's infrastructure. The same sealed-bid, Vickrey, or Dutch auction transition serves an art collector, a procurement officer, and a token issuer. The only thing that changes is the UI framing.

**Three skins:**
1. **Classic Auction** (`/dashboard`) — The existing generic auction interface. Already built in Waves 1-4.
2. **NFT Auction** (`/nft`) — Art-focused UI with collection display, image previews, and art-market language.
3. **Procurement / RFQ** (`/procurement`) — Reverse auction skin where lowest bid wins. Framed as "Request for Quote" for buyers sourcing goods/services.

All three skins call the same `aloe_auction_v3.aleo` transitions. Zero new contract code.

---

## Skin 1: Classic Auction (Existing)

**Page:** `/dashboard`
**Status:** Already built (Waves 1-4)

The default auction interface — generic sealed-bid, Vickrey, and Dutch auctions. No changes needed. This skin serves as the baseline.

---

## Skin 2: NFT Auction

**Page:** `/nft` (repurposed from placeholder)

An art-focused UI for auctioning NFTs. Uses the same first-price and Vickrey auction types from `aloe_auction_v3.aleo`, but the UI is designed around visual assets.

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| NFTAuctionCard | `components/NFTAuctionCard.jsx` | Card showing NFT image preview, collection name, current bid count, auction type badge, and time remaining |
| NFTBidDialog | `components/NFTBidDialog.jsx` | Bid modal with NFT image prominently displayed, collection/token info, and sealed-bid form |
| NFTImagePreview | `components/NFTImagePreview.jsx` | Image/media preview component — loads from metadata_hash or IPFS gateway |
| NFTCollectionFilter | `components/NFTCollectionFilter.jsx` | Filter auctions by collection_id — dropdown with collection names |

### Page Structure (`pages/nft.js`)

```
┌─────────────────────────────────────────────┐
│  NFT Auctions          [Filter by Collection]│
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ [Image]  │ │ [Image]  │ │ [Image]  │     │
│ │ CoolNFT  │ │ RareApe  │ │ PixelArt │     │
│ │ #1234    │ │ #0042    │ │ #7777    │     │
│ │ 3 bids   │ │ Vickrey  │ │ Dutch    │     │
│ │ 12h left │ │ 6h left  │ │ 150 cred │     │
│ └──────────┘ └──────────┘ └──────────┘     │
├─────────────────────────────────────────────┤
│ Same sealed-bid privacy. Beautiful display.  │
└─────────────────────────────────────────────┘
```

### How It Maps to the Contract

| NFT UI Action | Contract Call | Notes |
|---------------|---------------|-------|
| List an NFT for auction | `create_first_price_auction` or `create_vickrey_auction` | `item_id` = hash(collection_id, token_id) |
| Place sealed bid on NFT | `place_bid_v3` | Same commit-reveal as generic auctions |
| Reveal bid | `reveal_bid_v3` | Same reveal flow |
| Settle NFT auction | `settle_first_price` or `settle_vickrey` | Winner receives NFT (off-chain transfer) |
| Buy NFT at Dutch price | `dutch_buy` | Instant purchase at current price |

### NFT Metadata Handling

NFT metadata (image URL, collection name, description) is stored off-chain and referenced by `item_id`. The frontend maintains a metadata lookup:

```js
// lib/nftMetadata.js
// Maps item_id (hash of collection + token) to off-chain metadata
const NFT_METADATA = {
  // Populated from IPFS, Arweave, or a metadata API
  [itemId]: { imageUrl, collectionName, tokenName, description }
};
```

---

## Skin 3: Procurement / RFQ

**Page:** `/procurement` (new page)

A reverse auction skin where the **buyer** posts a request and **suppliers** submit sealed bids. The lowest bid wins (best price for the buyer). This reframes the auction primitive for B2B procurement, freelance bidding, and service sourcing.

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| ProcurementCard | `components/ProcurementCard.jsx` | Card showing RFQ title, budget, bid count, and deadline. Uses corporate/business styling. |
| SupplierBidDialog | `components/SupplierBidDialog.jsx` | Bid modal framed as "Submit Quote" — supplier enters their price to fulfill the request |
| RFQForm | `components/RFQForm.jsx` | Form for creating a Request for Quote — buyer specifies what they need, max budget, and timeline |
| ProcurementDetailDialog | `components/ProcurementDetailDialog.jsx` | Full RFQ detail view with supplier quote submission and status tracking |

### Page Structure (`pages/procurement.js`)

```
┌──────────────────────────────────────────────┐
│  Procurement Board        [+ Create RFQ]      │
├──────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐      │
│ │ Website Redesign │ │ Logo Design     │      │
│ │ Budget: 5000 cr  │ │ Budget: 500 cr  │      │
│ │ 4 quotes         │ │ 7 quotes        │      │
│ │ 2 days left      │ │ 12h left        │      │
│ │ [Submit Quote]   │ │ [Submit Quote]  │      │
│ └─────────────────┘ └─────────────────┘      │
├──────────────────────────────────────────────┤
│ Sealed quotes. Lowest wins. No bid sniping.   │
└──────────────────────────────────────────────┘
```

### How It Maps to the Contract

| Procurement UI Action | Contract Call | Notes |
|-----------------------|---------------|-------|
| Create RFQ | `create_first_price_auction` | `min_bid` set to 1 (any quote accepted). `item_id` = hash of RFQ description. |
| Submit quote (sealed) | `place_bid_v3` | Supplier commits their price quote as a sealed bid |
| Reveal quote | `reveal_bid_v3` | Supplier reveals their price |
| Award contract | `settle_first_price` | **UI inverts the logic**: displays "Lowest quote wins" but the on-chain mechanism still picks the highest bid. To make lowest-win work, quotes are submitted as `max_budget - actual_quote`. See note below. |

### Reverse Auction Implementation Note

The v3 contract always picks the **highest** revealed bid as winner. To implement "lowest bid wins" without new contract code:

```
// Supplier wants to quote 200 credits for a 5000-credit budget RFQ
// On-chain bid = max_budget - quote = 5000 - 200 = 4800
// The supplier bidding the LOWEST quote submits the HIGHEST on-chain bid

// At settlement:
// Winner's on-chain bid = 4800
// Actual quote = max_budget - winning_bid = 5000 - 4800 = 200
// Buyer pays 200 credits to the winning supplier
```

This is a **UI-level inversion** — the contract works normally, but the frontend translates between "lowest quote" and "highest on-chain bid."

---

## Deprecated Pages

| Old Page | Action | Redirect |
|----------|--------|----------|
| `/otc` | Deprecated | Redirect to `/dashboard` |
| `/launches` | Deprecated | Redirect to `/dashboard` |
| `/rwa` | Deprecated | Redirect to `/dashboard` |

### Redirect Implementation

```js
// pages/otc.js, pages/launches.js, pages/rwa.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DeprecatedPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, []);
  return null;
}
```

---

## Frontend

### Constants Update (`lib/constants.js`)

Replace the multi-module `MODULES` object with `USE_CASES`:

```js
// Use cases showcase — same primitive, different applications
export const USE_CASES = {
  CLASSIC: { id: 'classic', name: 'Auctions', path: '/dashboard', status: 'live' },
  NFT: { id: 'nft', name: 'NFT Auctions', path: '/nft', status: 'live' },
  PROCUREMENT: { id: 'procurement', name: 'Procurement', path: '/procurement', status: 'live' },
};
```

### Landing Page Update (`pages/index.js`)

Replace any remaining multi-module cards with use-case showcase:

| Section | Content |
|---------|---------|
| Hero | "Privacy-Preserving Auction Primitive" — one contract, infinite use cases |
| Use-case cards | Classic Auctions, NFT Sales, Procurement — each links to its skin page |
| How it works | "Same sealed-bid contract. Different UI for different markets." |
| For Developers | Link to integration guide (Wave 5) |

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Same privacy, different UIs | NFT bidders and procurement suppliers get identical sealed-bid privacy |
| No skin-specific data leakage | Skins only change presentation — no additional on-chain data stored |
| Procurement quote privacy | Supplier quotes remain sealed — no competitor can see your pricing |
| NFT bid privacy | Art market bids hidden until reveal — prevents shill bidding intelligence |

**Privacy Score:** High — Privacy properties are contract-level, not UI-level. Changing the skin doesn't change the privacy guarantees.

---

## Testing Checklist

### NFT Auction Skin
- [ ] `/nft` page loads with NFT-focused UI
- [ ] Can create an auction from NFT page (routes to `create_first_price_auction` or `create_vickrey_auction`)
- [ ] NFT image preview renders from metadata
- [ ] Collection filter works correctly
- [ ] Bid, reveal, settle flow works identically to `/dashboard`
- [ ] Dutch NFT auctions show DutchPriceTicker

### Procurement Skin
- [ ] `/procurement` page loads with RFQ-focused UI
- [ ] Can create an RFQ (routes to `create_first_price_auction`)
- [ ] Supplier can submit a sealed quote
- [ ] Quote inversion works: lowest quote = highest on-chain bid
- [ ] Settlement correctly displays winning quote (inverted from on-chain bid)
- [ ] Reveal flow works with inverted amounts

### Deprecated Pages
- [ ] `/otc` redirects to `/dashboard`
- [ ] `/launches` redirects to `/dashboard`
- [ ] `/rwa` redirects to `/dashboard`
- [ ] No 404 errors on deprecated routes

### Cross-Skin Consistency
- [ ] Auction created on `/dashboard` appears on all skins (if applicable)
- [ ] Same auction_id resolves to same on-chain data regardless of skin
- [ ] Wallet connection persists across skin navigation

---

## Success Metrics

| Metric | Target |
|--------|--------|
| NFT skin | Full auction flow working with NFT-specific UI |
| Procurement skin | RFQ creation + sealed quote + award flow working |
| Zero new contract code | All skins use existing `aloe_auction_v3.aleo` transitions |
| Redirect coverage | All deprecated routes redirect cleanly |
| Use-case breadth | 3 distinct UI presentations of the same primitive |

---

## Demo Scenarios

1. **NFT Auction**: Create sealed-bid NFT auction on `/nft` → 2 bidders place bids → Reveal → Highest bid wins → Art-focused settlement UI
2. **Procurement RFQ**: Buyer creates RFQ on `/procurement` with 5000 credit budget → 3 suppliers submit sealed quotes (200, 350, 500) → Reveal → Lowest quote (200) wins → Buyer pays 200
3. **Cross-Skin**: Create a generic auction on `/dashboard` → Same auction visible on `/nft` with image preview → Demonstrates that skins are just views on the same contract state
4. **Deprecated Redirect**: Navigate to `/otc` → Automatically redirected to `/dashboard`

---

*Wave 6 Target Completion: April 14, 2026*
