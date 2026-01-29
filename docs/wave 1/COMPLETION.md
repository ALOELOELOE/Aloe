# Wave 1 Completion Document

## Summary

Wave 1 establishes the core foundation of Aloe, a privacy-first sealed-bid auction platform on Aleo. This wave implements the essential auction creation and sealed bid placement functionality using a commit-reveal scheme with zero-knowledge proofs.

---

## Features Implemented

### 1. Create Auction
- Auctioneers can create new auctions with customizable parameters
- Configurable minimum bid amount (in microcredits)
- Configurable commit phase duration (in blocks)
- Configurable reveal phase duration (in blocks)
- Unique auction IDs and item identifiers

### 2. Place Sealed Bid
- Bidders can place private, sealed bids during the commit phase
- Bids are hidden using BHP256 hash commitments
- Each bid requires a deposit that must be >= bid amount
- Private `BidCommitment` records store bid details securely
- Duplicate commitments are prevented on-chain

---

## Smart Contract

### Program Details
| Property | Value |
|----------|-------|
| **Program ID** | `zkauction.aleo` |
| **Network** | Aleo Testnet Beta |
| **Version** | 0.1.0 |
| **License** | MIT |

### Data Structures
- **Auction**: Public struct containing auction metadata (auctioneer, item_id, min_bid, deadlines, status, winner)
- **BidCommitment**: Private record holding bid details (owner, auction_id, commitment hash, bid_amount, salt, deposit)
- **CommitmentData**: Helper struct for generating commitment hashes

### Mappings
- `auctions`: Stores auction data by auction_id
- `bid_count`: Tracks number of bids per auction
- `commitments`: Prevents duplicate bid commitments
- `auction_deposits`: Tracks total deposits per auction

### Transitions
- `create_auction()`: Creates a new auction with specified parameters
- `place_bid()`: Places a sealed bid and returns a private BidCommitment record

---

## Frontend Components

### Core Components
| Component | Description |
|-----------|-------------|
| `WalletConnect.jsx` | Leo Wallet integration with connection management |
| `CreateAuctionForm.jsx` | Form for creating new auctions with validation |
| `AuctionCard.jsx` | Card display for individual auction preview |
| `AuctionList.jsx` | List view of available auctions |

### UI Components (shadcn/ui)
- Button, Card, Input, Label, Dialog, Badge, Skeleton, Sonner (toast)

### Utility Libraries
| File | Purpose |
|------|---------|
| `lib/aleo.js` | Transaction builders, credit formatting, salt generation |
| `lib/constants.js` | Program configuration, auction status constants |
| `lib/utils.js` | General utility functions (cn for classNames) |

---

## Technical Details

### Commit-Reveal Scheme
1. **Commit Phase**: Bidders submit hash commitments of their bids
   - Commitment = BHP256(bid_amount, salt, auction_id)
   - Only the commitment hash is public; bid amount remains private
2. **Reveal Phase**: (Wave 2) Bidders reveal their bids by providing the original values
3. **Settlement**: (Wave 2) Winner determined, refunds processed

### Privacy Guarantees
- Bid amounts are never exposed during the commit phase
- Each bidder receives a private `BidCommitment` record
- Salt ensures commitments are unique even for identical bid amounts

---

## Testing Instructions

### Prerequisites
1. Install Leo Wallet browser extension
2. Create/import a wallet with testnet credits
3. Connect to Aleo Testnet Beta

### Test Create Auction
1. Connect your wallet on the home page
2. Click "Create Auction"
3. Fill in auction details:
   - Item name
   - Minimum bid (in credits)
   - Commit duration (in blocks)
   - Reveal duration (in blocks)
4. Submit and approve the transaction in Leo Wallet
5. Wait for transaction confirmation

### Test Place Bid
1. Find an auction in "Commit Phase" status
2. Click "Place Bid"
3. Enter your bid amount and deposit
4. Submit and approve the transaction
5. Your private BidCommitment record is stored in your wallet

---

## What's Next - Wave 2 Preview

Wave 2 will implement the remaining auction lifecycle:

1. **Reveal Bid** - Bidders reveal their sealed bids
2. **End Auction** - Determine the winner based on revealed bids
3. **Claim Refund** - Non-winners reclaim their deposits
4. **Cancel Auction** - Auctioneers can cancel if no bids received

---

*Document generated: January 30, 2026*
