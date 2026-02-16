# Wave 5: Composability — Importable Auction Primitive

**Timeline:** March 17 - March 31, 2026
**Theme:** Build Once, Use Everywhere
**Status:** Planned

---

## Overview

Wave 5 transforms Aloe from an *application* into a *primitive*. Other Leo programs can `import aloe_auction_v3.aleo` and call its transitions directly — embedding private auctions into any dApp without writing auction logic from scratch.

**The big idea:** Aloe is to auctions what Uniswap is to swaps. Uniswap doesn't try to be an NFT marketplace, a lending platform, and a token launchpad. It does one thing — swaps — and other protocols compose on top of it. Aloe does one thing — private auctions — and other programs import it.

**Demo wrapper:** To prove composability, this wave builds a demo program `aloe_nft_auction_v1.aleo` that imports the v3 auction contract and adds NFT-specific metadata (collection_id, token_id). This demonstrates how *any* dApp can embed private auctions without reimplementing the commit-reveal scheme, credits handling, or settlement logic.

**No major UI changes.** The focus is contract composability and developer documentation. A "For Developers" section is added to the landing page.

---

## Smart Contract

### Refactoring `aloe_auction_v3.aleo` for Import-Friendliness

Before building the wrapper, the v3 contract needs clean-up to be a good import target:

| Change | Reason |
|--------|--------|
| Consistent transition naming | All transitions follow `verb_noun` pattern: `create_auction`, `place_bid`, `reveal_bid`, `settle_auction`, `claim_refund` |
| Documented inputs/outputs | Every transition has inline comments explaining each parameter |
| Clean record signatures | `BidCommitmentV3` fields are ordered logically: owner → auction_id → commitment → amounts |
| Minimal public surface | Only transitions needed by importers are public. Internal helpers are private functions. |

### Demo Wrapper: `aloe_nft_auction_v1.aleo`

**Location:** `contracts/demo_nft_auction/src/main.leo`

This program imports `aloe_auction_v3.aleo` and wraps it with NFT-specific logic.

```leo
import aloe_auction_v3.aleo;
import credits.aleo;

program aloe_nft_auction_v1.aleo {

    // NFT metadata stored alongside the auction
    struct NFTAuctionMeta {
        auction_id: field,
        collection_id: field,       // NFT collection identifier
        token_id: field,            // Specific token within the collection
        metadata_hash: field,       // BHP256 hash of off-chain metadata (image, description, etc.)
    }

    // Mapping: auction_id => NFT metadata
    mapping nft_auction_meta: field => NFTAuctionMeta;

    // Create an NFT auction — wraps aloe_auction_v3.aleo/create_first_price_auction
    // and stores NFT metadata alongside it
    async transition create_nft_auction(
        public auction_id: field,
        public collection_id: field,
        public token_id: field,
        public metadata_hash: field,
        public min_bid: u64,
        public commit_duration: u32,
        public reveal_duration: u32
    ) -> Future {
        // Delegate auction creation to the base primitive
        let auction_future: Future = aloe_auction_v3.aleo/create_first_price_auction(
            auction_id, collection_id, min_bid, commit_duration, reveal_duration
        );

        return finalize_create_nft_auction(
            auction_future, auction_id, collection_id, token_id, metadata_hash
        );
    }

    async function finalize_create_nft_auction(
        auction_future: Future,
        auction_id: field,
        collection_id: field,
        token_id: field,
        metadata_hash: field
    ) {
        // Finalize the base auction first
        auction_future.await();

        // Store NFT-specific metadata
        let meta: NFTAuctionMeta = NFTAuctionMeta {
            auction_id: auction_id,
            collection_id: collection_id,
            token_id: token_id,
            metadata_hash: metadata_hash,
        };
        Mapping::set(nft_auction_meta, auction_id, meta);
    }

    // Bidding, revealing, settling, and refunding all delegate directly
    // to aloe_auction_v3.aleo transitions — no need to reimplement
}
```

### What the Wrapper Demonstrates

| Concept | How It's Shown |
|---------|----------------|
| Import pattern | `import aloe_auction_v3.aleo` at the top of the program |
| Cross-program calls | `aloe_auction_v3.aleo/create_first_price_auction(...)` called from wrapper transition |
| Future chaining | Wrapper's finalize awaits the base auction's future before storing metadata |
| Metadata extension | Wrapper adds NFT-specific fields without modifying the base auction contract |
| Privacy inheritance | Wrapper inherits all privacy guarantees (sealed bids, hidden addresses) from the base contract |

---

## Documentation

### New File: `docs/integration_guide.md`

A developer guide explaining how to import and use `aloe_auction_v3.aleo` in your own Leo program.

**Sections:**
1. **Quick Start** — Minimal example: import, create auction, place bid
2. **Available Transitions** — Full reference for every transition with parameter types and return values
3. **Record Types** — `BidCommitmentV3` fields and how to handle them in wrapper programs
4. **Credits Handling** — How `transfer_private_to_public` works in cross-program calls
5. **Auction Types** — When to use first-price vs Vickrey vs Dutch
6. **Example Wrappers** — NFT auction (this wave), procurement RFQ (Wave 6), token sale (future)
7. **Privacy Guarantees** — What's private, what's public, and what the wrapper inherits

### Code Examples in the Guide

```leo
// Example: Import Aloe and create a procurement auction
import aloe_auction_v3.aleo;

program my_procurement.aleo {
    // Create a reverse auction where lowest bid wins
    // (using first-price with custom settlement logic)
    async transition create_rfq(
        public rfq_id: field,
        public max_budget: u64,
        public commit_duration: u32,
        public reveal_duration: u32
    ) -> Future {
        return aloe_auction_v3.aleo/create_first_price_auction(
            rfq_id, rfq_id, max_budget, commit_duration, reveal_duration
        );
    }
}
```

---

## Frontend

### Landing Page Update (`pages/index.js`)

Add a "For Developers" section below the existing auction UI content:

| Element | Description |
|---------|-------------|
| Section heading | "Build With Aloe — The Auction Primitive" |
| Composability diagram | Visual showing: `Your Program → imports → aloe_auction_v3.aleo → uses → credits.aleo` |
| Code snippet | Leo import example showing 3-line integration |
| Use case cards | NFT Sales, Procurement, Token Launches, RWA Trading — each card links to integration guide |
| CTA button | "Read the Integration Guide →" linking to `docs/integration_guide.md` |

### No New Pages or Major Components

This wave is contract + documentation focused. The frontend changes are limited to the landing page "For Developers" section.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Privacy inheritance | Any program importing `aloe_auction_v3.aleo` inherits sealed-bid privacy — no need to reimplement |
| Wrapper transparency | The wrapper's NFT metadata is public, but the *bids on those NFTs* remain private |
| Composable privacy | Privacy properties compose: base contract guarantees hold regardless of wrapper logic |
| Cross-program isolation | Wrapper's finalize logic runs after base auction's finalize — no state leakage between programs |

**Privacy Score:** High — Composability preserves all privacy guarantees. The wrapper adds metadata without weakening the base contract's sealed-bid properties.

---

## Testing Checklist

### Contract Composability
- [ ] `aloe_nft_auction_v1.aleo` compiles successfully with `aloe_auction_v3.aleo` import
- [ ] `create_nft_auction` creates an auction via cross-program call and stores NFT metadata
- [ ] Bidding on wrapper-created auctions works via `aloe_auction_v3.aleo/place_bid_v3`
- [ ] Revealing, settling, and refunding all work through the base contract's transitions
- [ ] NFT metadata correctly stored in `nft_auction_meta` mapping
- [ ] Future chaining works — wrapper finalize runs only after base auction finalize succeeds

### Privacy Inheritance
- [ ] Bids on NFT auctions are sealed (same privacy as regular auctions)
- [ ] Bidder addresses invisible during commit phase (same guarantee)
- [ ] Wrapper metadata (collection_id, token_id) is public, bid amounts are private
- [ ] Settlement transfers credits correctly via the base contract

### Integration Guide
- [ ] All code examples compile and run correctly
- [ ] Transition signatures match the actual contract interface
- [ ] Record types documented accurately
- [ ] Credits handling instructions are correct

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Wrapper compiles | `aloe_nft_auction_v1.aleo` builds with zero errors |
| Full flow through wrapper | Create NFT auction → Bid → Reveal → Settle via cross-program calls |
| Integration guide | Complete with 7 sections, compilable code examples |
| Privacy maintained | Wrapper-created auctions have identical privacy to direct v3 auctions |
| Developer experience | New developer can import and use `aloe_auction_v3.aleo` in < 30 minutes using the guide |

---

## Demo Scenarios

1. **NFT Auction via Wrapper**: Deploy `aloe_nft_auction_v1.aleo` → Create NFT auction with collection/token IDs → 2 bidders place sealed bids → Reveal → Settle → NFT metadata and auction result both on-chain
2. **Direct vs Wrapper**: Show same auction flow running through `aloe_auction_v3.aleo` directly and through the wrapper — identical privacy, identical credits handling
3. **Developer Walkthrough**: Start from empty Leo project → `import aloe_auction_v3.aleo` → Create a custom wrapper program → Run a test auction — all using the integration guide

---

*Wave 5 Target Completion: March 31, 2026*
