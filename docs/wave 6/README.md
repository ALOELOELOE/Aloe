# Wave 6: NFT Marketplace Module

**Timeline:** March 31 - April 14, 2026
**Theme:** Private NFT Trading
**Status:** Planned

---

## Overview

Wave 6 introduces Aloe's fourth core module: **NFT Marketplace** — a private trading venue for non-fungible tokens using sealed-bid auctions and instant buy-now purchases. The module reuses the commit-reveal pattern from auctions (Wave 2-3) for NFT bidding, while adding a direct purchase path for fixed-price listings.

The privacy advantage over existing NFT marketplaces: bid amounts on NFTs remain sealed until the reveal phase, preventing last-second bid sniping. Sellers also benefit — their portfolio holdings remain private since listing/ownership records are encrypted.

**Current State:** The NFT page (`pages/nft.js`) has a "Coming Soon" placeholder. This wave replaces it with a full marketplace UI and smart contract.

---

## Smart Contract

### Program: `aloe_nft_v1.aleo`

**Location:** `contracts/zknft/src/main.leo`

Imports `credits.aleo` for all value transfers.

### Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Struct | `Listing` | `listing_id`, `seller`, `collection_id`, `token_id`, `min_price`, `buy_now_price` (0 if none), `commit_deadline`, `reveal_deadline`, `status`, `winner`, `winning_bid` | On-chain listing metadata. Status: 0=active, 1=settled, 2=cancelled |
| Struct | `NFTCommitmentData` | `bid_amount`, `salt`, `listing_id` | Helper struct for generating BHP256 commitment hashes on NFT bids |
| Record | `NFTBid` | `owner`, `listing_id`, `commitment`, `bid_amount`, `salt`, `deposit` | Private sealed bid record. Same commit-reveal pattern as auction BidCommitment. |

### Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_listing` | Public | Seller specifies listing_id, collection_id, token_id, min_price, buy_now_price (0 to disable), and commit/reveal durations. Finalize stores the `Listing` struct in the `listings` mapping. |
| `place_nft_bid` | Private + Public | Sealed bid on a listing. Generates a BHP256 commitment hash from (bid_amount, salt, listing_id). Calls `credits.aleo/transfer_public_as_signer` to lock the deposit. Returns an `NFTBid` record. Finalize checks listing is active and in commit phase, stores the commitment, and increments bid count. |
| `reveal_nft_bid` | Private → Public | Same pattern as auction reveal. Bidder provides the `NFTBid` record, bid_amount, and salt. Contract re-hashes and verifies against the stored commitment. Finalize checks timing, updates `nft_highest_bid` / `nft_highest_bidder` if this is the new leader. |
| `settle_listing` | Public | Callable after reveal deadline. Calls `credits.aleo/transfer_public` to send the winning bid to the seller. Finalize updates listing status to settled (1) with the winner. |
| `claim_nft_refund` | Private | Non-winners consume their `NFTBid` record. Calls `credits.aleo/transfer_public` to return the deposit. Finalize checks listing is settled, caller is not winner, and refund hasn't been claimed. |
| `buy_now` | Public | Instant purchase at the buy_now_price. Calls `credits.aleo/transfer_public_as_signer` to pay the seller directly. Finalize checks listing is active, buy_now_price > 0, submitted price matches exactly, and marks listing as settled with buyer as winner. |

### Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `listings` | `field => Listing` | listing_id → Listing struct |
| `nft_bid_count` | `field => u32` | listing_id → number of bids |
| `nft_commitments` | `field => bool` | commitment hash → exists (prevents duplicates) |
| `nft_highest_bid` | `field => u64` | listing_id → highest revealed bid |
| `nft_highest_bidder` | `field => address` | listing_id → highest bidder address |
| `nft_refund_claimed` | `field => bool` | commitment hash → refund claimed |

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| NFTCard | `components/NFTCard.jsx` | Card showing NFT preview, collection name, current price, bid count, status |
| NFTList | `components/NFTList.jsx` | Grid of listed NFTs with collection and price filters |
| CreateListingForm | `components/CreateListingForm.jsx` | Form for listing an NFT — collection ID, token ID, min price, buy-now price |
| NFTBidDialog | `components/NFTBidDialog.jsx` | Modal for placing sealed bid on an NFT listing |
| NFTDetailDialog | `components/NFTDetailDialog.jsx` | Full listing detail with NFT preview, bid info, and action buttons |
| BuyNowButton | `components/BuyNowButton.jsx` | One-click instant purchase at buy-now price |
| NFTImagePreview | `components/NFTImagePreview.jsx` | Image/media preview component for NFT listings |
| NFTRevealBidDialog | `components/NFTRevealBidDialog.jsx` | Modal for revealing NFT bids (same pattern as auction reveal) |

### Transaction Builders (`lib/nft.js`)

New file with six builder functions: `buildCreateListingInputs`, `buildPlaceNFTBidInputs`, `buildRevealNFTBidInputs`, `buildSettleListingInputs`, `buildClaimNFTRefundInputs`, and `buildBuyNowInputs`. Same pattern as `lib/aleo.js`.

### New Store (`store/nftStore.js`)

Zustand store with state fields (`listings`, `isListing`, `isBidding`, `isRevealing`, `isBuying`) and actions (`fetchListings`, `getActiveListings`, `getListingsByCollection`, `createListing`, `placeNFTBid`, `revealNFTBid`, `buyNow`, `claimRefund`).

### Page Update (`pages/nft.js`)

Replace the "Coming Soon" placeholder with full marketplace UI:
- NFT grid with collection filters and price range
- Create Listing button (for sellers)
- NFT detail view on card click with bid/buy actions
- "My Listings" and "My Bids" tabs for user-specific views
- Buy Now button for instant purchases

### Constants Update (`lib/constants.js`)

Add `NFT: "aloe_nft_v1.aleo"` to the `PROGRAMS` object. Add `LISTING_STATUS` enum (ACTIVE=0, SETTLED=1, CANCELLED=2).

### Dashboard Integration

Add NFT activity data to the `activityStore.js` (created in Wave 3). The activity dashboard (`/my-activity`) now shows auction, OTC, launch, and NFT activity in its feed and summary cards.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Sealed NFT bids | Bid amounts hidden during commit phase — prevents last-second sniping |
| Private bid records | NFTBid records encrypted — only bidder knows their bid amount |
| Portfolio privacy | Sellers' NFT holdings not exposed by browsing listings |
| Hidden bid counts (per bidder) | Cannot tell how many NFTs a single address is bidding on |
| Buy-now privacy | Instant purchase reveals price but hides buyer identity until settlement |

**Privacy Score:** High — Solves bid sniping on NFT auctions while maintaining portfolio privacy for sellers.

---

## Testing Checklist

### Create Listing
- [ ] Seller can create a listing with valid parameters
- [ ] Listing stored in `listings` mapping
- [ ] Buy-now price correctly set (or 0 for auction-only)
- [ ] Cannot create listing with min_price = 0

### Place NFT Bid
- [ ] Bidder can place sealed bid during commit phase
- [ ] Commitment hash correctly generated
- [ ] Deposit locked via credits.aleo
- [ ] NFTBid record returned to bidder
- [ ] Cannot bid below min_price (deposit check)

### Reveal NFT Bid
- [ ] Can reveal with correct salt during reveal phase
- [ ] Cannot reveal with wrong salt
- [ ] Highest bid tracked correctly
- [ ] Cannot reveal outside reveal phase

### Buy Now
- [ ] Can buy at exact buy-now price
- [ ] Credits transferred to seller
- [ ] Listing status set to settled
- [ ] Cannot buy-now if no buy-now price set
- [ ] Cannot buy-now on already-settled listing

### Settle / Refund
- [ ] Listing settles with highest bidder as winner
- [ ] Non-winners can claim refund
- [ ] Winner cannot claim refund
- [ ] Cannot claim refund twice

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Listing flow | Full create → bid → reveal → settle working |
| Buy-now flow | Instant purchase fully functional |
| Bid privacy | Bid amounts invisible on-chain during commit phase |
| Escrow accuracy | 100% of deposits locked and released correctly |
| NFT display | Collection and token metadata render correctly |

---

## Demo Scenarios

1. **Sealed-Bid NFT Sale**: Seller lists NFT (min 50 credits) → 3 bidders place sealed bids → Reveal phase → Highest bid wins → Seller receives credits → Losers refunded
2. **Buy Now**: Seller lists NFT with buy-now at 200 credits → Buyer clicks Buy Now → Instant transfer → Listing closed
3. **No Bids**: Seller lists NFT → No bids placed → Seller cancels listing
4. **Mixed**: Listing has both bids and a buy-now price → Someone buys now before reveal → Existing bidders refunded

---

*Wave 6 Target Completion: April 14, 2026*
