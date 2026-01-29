# Wave 5: NFT Auctions

**Timeline:** March 17 - March 31, 2026
**Theme:** Digital Collectibles
**Status:** Planned

---

## Overview

Wave 5 enables auctions for non-fungible tokens (NFTs) following the ARC-721 standard on Aleo. This wave implements NFT escrow, metadata display, and seamless transfer to auction winners.

---

## Smart Contract

### New Records

```leo
record NFTEscrow {
    owner: address,               // Contract address during auction
    auction_id: field,
    collection_id: field,         // NFT collection identifier
    token_id: field,              // Unique NFT ID within collection
    original_owner: address,      // Auctioneer (for return on cancel)
}
```

### New Structs

```leo
struct NFTAuction {
    auction_id: field,
    auctioneer: address,
    collection_id: field,
    token_id: field,
    payment_token: field,         // Token accepted for payment
    min_bid: u64,
    commit_deadline: u32,
    reveal_deadline: u32,
    status: u8,
    winner: address,
    winning_bid: u64,
}

struct NFTMetadata {
    collection_id: field,
    token_id: field,
    name_hash: field,             // Hash of NFT name
    image_uri_hash: field,        // Hash of image URI
    attributes_hash: field,       // Hash of attributes JSON
}
```

### New Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_nft_auction` | Private → Public | Escrow NFT and create auction |
| `place_nft_bid` | Private | Place sealed bid on NFT auction |
| `reveal_nft_bid` | Private → Public | Reveal bid for NFT auction |
| `settle_nft_auction` | Public | Transfer NFT to winner |
| `cancel_nft_auction` | Public | Return NFT to auctioneer |

### NFT Escrow Flow

```leo
async transition create_nft_auction(
    private nft_record: NFT,           // ARC-721 NFT record
    public min_bid: u64,
    public payment_token: field,
    public commit_duration: u32,
    public reveal_duration: u32,
) -> (NFTEscrow, Future) {
    // Generate unique auction ID
    let auction_id: field = BHP256::hash_to_field((nft_record.collection_id, nft_record.token_id, self.caller));

    // Create escrow record (NFT held by contract)
    let escrow: NFTEscrow = NFTEscrow {
        owner: ESCROW_ADDRESS,
        auction_id: auction_id,
        collection_id: nft_record.collection_id,
        token_id: nft_record.token_id,
        original_owner: self.caller,
    };

    return (escrow, finalize_create_nft_auction(...));
}
```

---

## Frontend

### New Components

| Component | Description |
|-----------|-------------|
| `NFTCard.jsx` | Display NFT with image, name, collection |
| `NFTAuctionForm.jsx` | Create auction for NFT |
| `NFTPreview.jsx` | Large NFT preview with metadata |
| `NFTGallery.jsx` | Grid view of user's NFTs |
| `CollectionBadge.jsx` | Collection name and verification |
| `NFTAttributes.jsx` | Display NFT traits/attributes |

### NFT Display Features

1. **Image Rendering**
   - Support IPFS, Arweave, HTTP URIs
   - Lazy loading with placeholders
   - Zoom/fullscreen view
   - Fallback for broken images

2. **Metadata Display**
   - NFT name and description
   - Collection name and verification status
   - Rarity attributes and traits
   - Creator/artist information

3. **Collection Pages**
   - Browse NFTs by collection
   - Collection statistics (floor, volume)
   - Collection verification badges

### UI Updates

1. **Create Auction Flow**
   - NFT selector from user's wallet
   - Preview selected NFT
   - Set minimum bid and payment token
   - Confirm escrow transaction

2. **Auction Detail Page**
   - Large NFT image/media display
   - Trait rarity indicators
   - Collection link
   - Provenance history (if available)

3. **Won NFTs**
   - Display in My Bids dashboard
   - Link to view in wallet
   - Transfer/re-auction options

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Private NFT ownership | NFT ownership hidden until auction creation |
| Sealed NFT bids | Bid amounts for NFTs remain private until reveal |
| Anonymous bidding | Cannot link bidders to bids during commit phase |
| Private collections | Support for private NFT collections |

**Privacy Score Contribution:** High — NFT auctions are a prime use case for privacy (no front-running on rare items).

---

## Testing Checklist

### NFT Auction Creation
- [ ] Can create auction from owned NFT
- [ ] NFT correctly escrowed on creation
- [ ] Cannot auction NFT you don't own
- [ ] Metadata displays correctly
- [ ] Collection info appears

### NFT Bidding
- [ ] Can place sealed bid on NFT auction
- [ ] Multiple bidders work correctly
- [ ] Bid amounts stay hidden

### NFT Settlement
- [ ] Winner receives NFT on settlement
- [ ] NFT ownership transfers correctly
- [ ] Auctioneer receives payment
- [ ] Losers receive refunds

### NFT Cancellation
- [ ] Auctioneer can cancel with no bids
- [ ] NFT returns to original owner
- [ ] Cannot cancel with existing bids

### Edge Cases
- [ ] NFT with no image/broken URI handled
- [ ] Large image files load properly
- [ ] NFT from unverified collection works
- [ ] Multiple NFTs from same collection

---

## Success Metrics

| Metric | Target |
|--------|--------|
| NFT display quality | Images render correctly |
| Metadata accuracy | 100% correct trait display |
| Escrow security | Zero NFT loss incidents |
| Transfer success | 100% winner transfers complete |
| Collection support | 10+ collections integrated |

---

## Supported NFT Standards

| Standard | Support Level |
|----------|---------------|
| ARC-721 | Full support |
| Custom NFTs | Via adapter pattern |
| Multi-edition | Partial (single token per auction) |

---

## Metadata Storage

### On-Chain
- Collection ID and token ID
- Ownership records
- Auction history

### Off-Chain (IPFS/Arweave)
- Image files
- Full metadata JSON
- Animation files (if applicable)

### Indexer Requirements
- Fetch NFT metadata from URI
- Cache images for fast loading
- Track collection statistics

---

## Integration Points

### NFT Marketplaces
- Import NFTs from existing Aleo marketplaces
- Export auction results for marketplace display

### Wallets
- Display won NFTs in wallet
- NFT transfer from wallet to auction

### Collections
- Verified collection registry
- Creator royalty support (future)

---

*Wave 5 Target Completion: March 31, 2026*
