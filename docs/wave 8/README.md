# Wave 8: Advanced Privacy Features + JS SDK

**Timeline:** April 28 - May 12, 2026
**Theme:** Developer Experience
**Status:** Planned

---

## Overview

Wave 8 has two deliverables: a **JavaScript SDK** (`aloe-sdk`) that makes it easy for developers to interact with Aloe from any frontend, and **advanced privacy features** that push the auction primitive's privacy guarantees further.

**JS SDK:** A wrapper library that handles the complexity of credits record management, salt generation, commitment hashing, and transaction building. A developer should be able to create an auction, place a bid, and settle — all in 5 lines of code.

**Advanced privacy features:**
- **Bid amount range proofs** — Prove your bid is within [min, max] without revealing the exact amount
- **Gated auctions with badge verification** — Require a private credential to participate (e.g., KYC-verified, whitelisted)
- **Anonymous bidder sets** — Prove you're one of N authorized bidders without revealing which one

These features directly target the buildathon privacy scoring category (40% of total score).

---

## JS SDK: `aloe-sdk`

### Package Overview

**Name:** `aloe-sdk` (npm package)
**Language:** TypeScript with JavaScript compatibility
**Dependencies:** Aleo wallet adapter packages

### Core Class: `AloeClient`

```typescript
import { AloeClient } from 'aloe-sdk';

// Initialize with a wallet adapter instance
const aloe = new AloeClient({
  wallet: walletAdapter,       // Any Aleo wallet adapter (Leo, Shield, Puzzle, etc.)
  network: 'testnet',          // 'testnet' or 'mainnet'
  programId: 'aloe_auction_v3.aleo',
});

// Create a first-price auction
const auctionId = await aloe.createAuction({
  type: 'first-price',
  itemId: '12345field',
  minBid: 100_000,              // microcredits
  commitDuration: 100,          // blocks
  revealDuration: 50,           // blocks
});

// Place a sealed bid (handles salt generation, commitment hashing, credits record selection)
const bidRecord = await aloe.placeBid({
  auctionId,
  bidAmount: 500_000,           // microcredits
  deposit: 500_000,
});
// Salt is auto-generated and stored in the SDK's local state

// Reveal bid (auto-retrieves salt from local state)
await aloe.revealBid({ auctionId, bidRecord });

// Settle auction
await aloe.settleAuction({ auctionId });

// Claim refund (for non-winners)
await aloe.claimRefund({ bidRecord });
```

### SDK Methods

| Method | Description |
|--------|-------------|
| `createAuction(params)` | Create any auction type (first-price, vickrey, dutch, reverse, batch) |
| `placeBid(params)` | Place a sealed bid — auto-generates salt, computes BHP256 commitment, selects credits record |
| `revealBid(params)` | Reveal a bid — auto-retrieves stored salt |
| `settleAuction(params)` | Settle an auction after reveal phase |
| `claimRefund(params)` | Claim deposit refund for non-winners |
| `cancelAuction(params)` | Cancel an auction with zero bids |
| `dutchBuy(params)` | Purchase at current Dutch price |
| `getAuction(auctionId)` | Query auction state from on-chain mappings |
| `getBidCount(auctionId)` | Query bid count |
| `getCurrentDutchPrice(auctionId)` | Calculate live Dutch price |
| `getBlockHeight()` | Get current block height |

### TypeScript Types

```typescript
// Auction type enum
enum AuctionType {
  FirstPrice = 0,
  Vickrey = 1,
  Dutch = 2,
  Reverse = 3,
  Batch = 4,
}

// Auction struct (parsed from on-chain data)
interface Auction {
  auctionId: string;
  auctioneer: string;
  itemId: string;
  auctionType: AuctionType;
  minBid: bigint;
  commitDeadline: number;
  revealDeadline: number;
  status: AuctionStatus;
  winner: string;
  winningBid: bigint;
  paymentAmount: bigint;
}

// Bid record (private, client-side)
interface BidRecord {
  owner: string;
  auctionId: string;
  commitment: string;
  bidAmount: bigint;
  salt: string;
  deposit: bigint;
}

// Create auction params
interface CreateAuctionParams {
  type: 'first-price' | 'vickrey' | 'dutch' | 'reverse' | 'batch';
  itemId: string;
  minBid: number;
  commitDuration?: number;      // not used for Dutch
  revealDuration?: number;      // not used for Dutch
  startingPrice?: number;       // Dutch only
  priceDecrement?: number;      // Dutch only
  minPrice?: number;            // Dutch only
  maxBudget?: number;           // Reverse only
  totalUnits?: number;          // Batch only
  minPricePerUnit?: number;     // Batch only
}
```

### Salt Management

The SDK handles salt generation and storage automatically:

```typescript
// Internal: Salt stored in localStorage keyed by auctionId
class SaltManager {
  generateSalt(): string;                    // Crypto-secure random field element
  storeSalt(auctionId: string, salt: string): void;
  retrieveSalt(auctionId: string): string | null;
  exportSalts(): Record<string, string>;     // For backup
  importSalts(salts: Record<string, string>): void;
}
```

### Credits Record Selection

The SDK automatically selects the best private credits record for a bid:

```typescript
// Internal: Selects a credits record with sufficient balance for the deposit
async function selectCreditsRecord(
  wallet: WalletAdapter,
  requiredAmount: bigint
): Promise<CreditsRecord> {
  const records = await wallet.requestRecords('credits.aleo');
  // Find a record with balance >= requiredAmount
  // Prefer exact match, then smallest sufficient record
  return bestRecord;
}
```

---

## Advanced Privacy Features

### Gated Auctions with Badge Verification

**Contract addition to `aloe_auction_v3.aleo`:**

```leo
// New transition: Create an auction that requires a badge to participate
async transition create_gated_auction(
    public auction_id: field,
    public item_id: field,
    public min_bid: u64,
    public commit_duration: u32,
    public reveal_duration: u32,
    public required_badge_type: u8    // Badge type required to bid (0 = no gate)
) -> Future
```

**Badge struct:**

```leo
// Private badge record — issued by a trusted authority or earned through activity
record AuctionBadge {
    owner: address,
    badge_type: u8,        // 1=KYC, 2=Whitelisted, 3=VIP, etc.
    issuer: address,       // Who issued this badge
    issued_at: u32,        // Block height when issued
}
```

**Gated bid transition:**

```leo
// Bidder must present a valid badge to bid on a gated auction
async transition place_gated_bid(
    public auction_id: field,
    bid_amount: u64,
    salt: field,
    public deposit: u64,
    payment: credits.aleo/credits,
    badge: AuctionBadge               // Private badge consumed and re-created
) -> (BidCommitmentV3, AuctionBadge, Future)
```

The badge is consumed and re-created (to prevent double-use in the same transaction) while the finalize function verifies the badge_type matches the auction's requirement. The bidder's identity is NOT linked to the badge — only the badge's *type* is checked.

### Bid Amount Range Proofs

A bidder can prove their bid falls within [min_bid, max_bid] without revealing the exact amount. This enables auctions where bids must be "reasonable" (e.g., within 50-200% of appraised value) without exposing the actual number.

**Implementation:** The `place_bid_v3` transition is extended with an optional range check in the finalize function. If the auction has `range_min` and `range_max` set, the revealed bid must fall within the range.

### Anonymous Bidder Sets

For high-stakes auctions, prove you're one of N authorized addresses without revealing which one. Uses a Merkle tree of authorized addresses:

```leo
// Bidder proves membership in authorized set via Merkle proof
async transition place_authorized_bid(
    public auction_id: field,
    bid_amount: u64,
    salt: field,
    public deposit: u64,
    payment: credits.aleo/credits,
    merkle_path: [field; 8],           // Merkle proof path
    merkle_leaf_index: u32             // Position in the tree
) -> (BidCommitmentV3, Future)
```

---

## Frontend

### SDK Integration

Replace direct transaction builder calls with SDK calls across all pages:

| Before (direct) | After (SDK) |
|------------------|-------------|
| `buildCreateFirstPriceAuctionInputs(...)` → `wallet.requestTransaction(...)` | `aloe.createAuction({ type: 'first-price', ... })` |
| `buildPlaceBidV3Inputs(...)` → manual salt → `wallet.requestTransaction(...)` | `aloe.placeBid({ auctionId, bidAmount, deposit })` |
| Manual salt storage in localStorage | SDK handles automatically |
| Manual credits record selection | SDK handles automatically |

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| GatedAuctionBadge | `components/GatedAuctionBadge.jsx` | Visual indicator showing auction requires a badge to bid |
| BadgeRequirementSelector | `components/BadgeRequirementSelector.jsx` | Dropdown in create form for selecting required badge type (None / KYC / Whitelisted / VIP) |
| RangeProofIndicator | `components/RangeProofIndicator.jsx` | Shows bid range constraints on auction detail view |

---

## SDK Documentation

### Package Structure

```
aloe-sdk/
  src/
    index.ts              → Main exports
    client.ts             → AloeClient class
    types.ts              → TypeScript interfaces and enums
    salts.ts              → SaltManager class
    credits.ts            → Credits record selection
    reader.ts             → On-chain state reader (wraps aleoReader.js)
    builders/
      firstPrice.ts       → First-price transaction builders
      vickrey.ts          → Vickrey transaction builders
      dutch.ts            → Dutch transaction builders
      reverse.ts          → Reverse transaction builders
      batch.ts            → Batch transaction builders
  README.md               → Quick start guide
  docs/
    api-reference.md      → Full method reference
    examples/
      react-example.tsx   → React integration example
      node-example.ts     → Node.js integration example
```

### Quick Start (README.md)

```bash
npm install aloe-sdk
```

```typescript
import { AloeClient } from 'aloe-sdk';
import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';

const wallet = new LeoWalletAdapter();
await wallet.connect();

const aloe = new AloeClient({ wallet, network: 'testnet' });

// Create a Vickrey auction
const auctionId = await aloe.createAuction({
  type: 'vickrey',
  itemId: 'my-item-hash',
  minBid: 100_000,
  commitDuration: 100,
  revealDuration: 50,
});

console.log(`Auction created: ${auctionId}`);
```

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Gated auctions | Only credentialed bidders can participate — but their identity is not linked to the credential |
| Badge privacy | AuctionBadge records are private — only the holder sees them. Consumption + re-creation prevents linkage. |
| Range proofs | Prove bid is "reasonable" without revealing exact amount — useful for regulated markets |
| Anonymous bidder sets | Merkle proof membership: prove you're authorized without revealing which address you are |
| SDK salt management | Secure auto-generated salts prevent user error that could leak bid information |

**Privacy Score:** Very High — These features push Aloe's privacy beyond basic sealed-bid into advanced ZK territory. Gated auctions + anonymous bidder sets is a unique combination only possible on Aleo.

---

## Testing Checklist

### JS SDK
- [ ] `AloeClient` initializes with wallet adapter
- [ ] `createAuction` works for all 5 types
- [ ] `placeBid` auto-generates salt and stores it
- [ ] `revealBid` auto-retrieves salt
- [ ] `settleAuction` correctly triggers settlement
- [ ] `claimRefund` returns deposit to non-winners
- [ ] `dutchBuy` purchases at current price
- [ ] `getAuction` returns parsed on-chain data
- [ ] Salt export/import works correctly
- [ ] Credits record selection picks optimal record

### Gated Auctions
- [ ] Can create a gated auction with badge requirement
- [ ] Bidder with correct badge can place bid
- [ ] Bidder without correct badge is rejected
- [ ] Badge is consumed and re-created (not permanently lost)
- [ ] Badge type check works in finalize
- [ ] Bidder identity NOT linked to badge on-chain

### Advanced Privacy
- [ ] Range proof: bid within [min, max] accepted
- [ ] Range proof: bid outside range rejected
- [ ] Anonymous bidder set: valid Merkle proof accepted
- [ ] Anonymous bidder set: invalid proof rejected
- [ ] No information leakage from failed proofs

---

## Success Metrics

| Metric | Target |
|--------|--------|
| SDK coverage | All 5 auction types supported with full lifecycle methods |
| SDK usability | Create + bid + reveal in < 10 lines of code |
| Type safety | 100% TypeScript coverage with exported types |
| Gated auctions | Badge verification working without identity linkage |
| Package size | < 50KB minified (no heavy dependencies) |
| Documentation | README + API reference + 2 example integrations |

---

## Demo Scenarios

1. **SDK Quick Start**: Install `aloe-sdk` → Initialize with wallet → Create Vickrey auction → Place bid → Reveal → Settle — all via SDK methods
2. **Gated Auction**: Create auction requiring KYC badge → User with badge bids successfully → User without badge is rejected → Winner announced, badge still private
3. **Anonymous Bidder Set**: Auctioneer authorizes 10 addresses → Bidders prove membership via Merkle proof → 3 bids placed → None of the 3 can be linked to specific addresses in the authorized set
4. **React Integration**: Embed `aloe-sdk` in a React app → Show create/bid/reveal flow in a custom UI → Demonstrates how any dApp can integrate Aloe auctions

---

*Wave 8 Target Completion: May 12, 2026*
