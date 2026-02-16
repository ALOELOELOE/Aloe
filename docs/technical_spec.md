# Aloe
## Privacy-Preserving Auction Primitive on Aleo

**Technical Specification & Implementation Roadmap**
**Aleo x AKINDO Privacy Buildathon 2026**
**Version 2.0 | February 2026**

---

## Executive Summary

**Aloe** is a composable, privacy-preserving sealed-bid auction primitive built on Aleo. It enables trustless auctions where bid amounts remain hidden until the reveal phase. The same auction contract powers multiple use cases — NFT sales, procurement, token launches — through different frontend skins. This document provides a complete technical specification for building Aloe over the 10-wave Buildathon cycle.

## Why Aloe Wins

| Category | Weight | Description |
| :--- | :--- | :--- |
| **Privacy** | 40% | Sealed-bid auctions are THE canonical ZK use case. Bids must be hidden until reveal. Aleo's Record model enables this perfectly. |
| **Technical** | 20% | Commit-reveal scheme is well-understood. Uses Records for private state, mappings for public state. |
| **UX** | 20% | 3-step flow: Connect → Bid → Reveal. Familiar auction UX with privacy guarantees. |
| **Practicality** | 10% | Real use cases: NFT auctions, domain sales, procurement, freelance bidding, treasury asset sales. |
| **Novelty** | 10% | No sealed-bid auction exists on Aleo. First mover advantage in a critical DeFi primitive. |

---

## Problem Statement

### The Transparency Problem
Traditional blockchain auctions expose critical information that undermines fair price discovery:

*   **Front-running:** Competitors see your bid and outbid by $1
*   **Strategic manipulation:** Bidders adjust based on visible competing bids
*   **Privacy leakage:** Your bidding patterns reveal financial capacity
*   **Collusion:** Visible bids enable bid-rigging cartels

### The Solution: ZK Sealed-Bid Auctions
Aloe uses Aleo's zero-knowledge architecture to implement cryptographically sealed bids:

1.  **Commit Phase:** Bidders submit `hash(bid_amount + secret_salt)` — bid amount is hidden
2.  **Reveal Phase:** Bidders reveal their `bid_amount` and `salt` — contract verifies hash matches
3.  **Settlement:** Highest valid bid wins, all others get refunds

---

## System Architecture

### High-Level Architecture

```ascii
 ┌─────────────────────────────────────────────────────────────────┐
 │                        ALOE SYSTEM                              │
 ├─────────────────────────────────────────────────────────────────┤
 │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
 │  │   Next.js   │────▶│   Wallet    │────▶│    Aleo     │       │
 │  │  Frontend   │     │   Adapter   │     │   Network   │       │
 │  └─────────────┘     └─────────────┘     └─────────────┘       │
 │         │                   │                   │               │
 │         ▼                   ▼                   ▼               │
 │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
 │  │    React    │     │ Leo Wallet  │     │     Aloe    │       │
 │  │    State    │     │   Shield    │     │   Program   │       │
 │  └─────────────┘     └─────────────┘     └─────────────┘       │
 └─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Records (Private State)
Records are encrypted on-chain and only visible to the owner:

```leo
record BidCommitment {
    owner: address,           // Bidder's address
    auction_id: field,        // Which auction this bid is for
    commitment: field,        // hash(bid_amount, salt)
    deposit: u64,             // Locked funds (must be >= bid_amount)
}

record BidReveal {
    owner: address,
    auction_id: field,
    bid_amount: u64,          // Actual bid amount
    salt: field,              // Random salt used in commitment
}

record RefundReceipt {
    owner: address,
    auction_id: field,
    amount: u64,              // Amount to be refunded
}
```

### Mappings (Public State)
Mappings store publicly visible auction metadata:

```leo
mapping auctions: field => Auction;

struct Auction {
    auctioneer: address,      // Creator of the auction
    item_id: field,           // What's being auctioned
    min_bid: u64,             // Minimum acceptable bid
    commit_deadline: u32,     // Block height deadline for commits
    reveal_deadline: u32,     // Block height deadline for reveals
    status: u8,               // 0=active, 1=reveal, 2=settled
    winner: address,          // Winning bidder (after settlement)
    winning_bid: u64,         // Winning amount (after settlement)
}

mapping bid_count: field => u32;           // auction_id => number of bids
mapping revealed_count: field => u32;      // auction_id => number of reveals
mapping commitments: field => bool;        // commitment_hash => exists
```

---

## Smart Contract Specification

### Core Transitions

| Transition | Visibility | Description |
| :--- | :--- | :--- |
| `create_auction` | Public | Create new auction with item, min bid, deadlines |
| `place_bid` | Private → Record | Submit commitment hash, lock deposit, receive `BidCommitment` record |
| `reveal_bid` | Private → Public | Reveal bid amount + salt, contract verifies hash match |
| `settle_auction` | Public | Determine winner, initiate transfers |
| `claim_refund` | Private | Non-winners claim their deposit back |

### Leo Program Structure

```leo
// Import credits.aleo for real credit transfers (escrow deposits)
import credits.aleo;

program aloe_auction_v2.aleo {

    // ========== RECORDS ==========
    record BidCommitment {
        owner: address,
        auction_id: field,
        commitment: field,
        deposit: u64,
    }

    // ========== STRUCTS ==========
    struct Auction {
        auctioneer: address,
        item_id: field,
        min_bid: u64,
        commit_deadline: u32,
        reveal_deadline: u32,
        status: u8,
        winner: address,
        winning_bid: u64,
    }

    // ========== MAPPINGS ==========
    mapping auctions: field => Auction;
    mapping bid_count: field => u32;
    mapping highest_bid: field => u64;
    mapping highest_bidder: field => address;
    mapping commitments: field => bool;
    mapping auction_deposits: field => u64;

    // ========== STRUCTS (helpers) ==========
    struct CommitmentData {
        bid_amount: u64,
        salt: field,
        auction_id: field,
    }

    // ========== TRANSITIONS ==========
    
    // Create a new auction (public)
    async transition create_auction(
        public auction_id: field,
        public item_id: field,
        public min_bid: u64,
        public commit_duration: u32,
        public reveal_duration: u32,
    ) -> Future {
        return finalize_create_auction(
            auction_id, 
            self.caller, 
            item_id, 
            min_bid, 
            commit_duration, 
            reveal_duration
        );
    }

    async function finalize_create_auction(
        auction_id: field,
        auctioneer: address,
        item_id: field,
        min_bid: u64,
        commit_duration: u32,
        reveal_duration: u32,
    ) {
        // Ensure auction doesn't exist
        assert(!Mapping::contains(auctions, auction_id));
        
        let commit_deadline: u32 = block.height + commit_duration;
        let reveal_deadline: u32 = commit_deadline + reveal_duration;
        
        let auction: Auction = Auction {
            auctioneer: auctioneer,
            item_id: item_id,
            min_bid: min_bid,
            commit_deadline: commit_deadline,
            reveal_deadline: reveal_deadline,
            status: 0u8,
            winner: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
            winning_bid: 0u64,
        };
        
        Mapping::set(auctions, auction_id, auction);
        Mapping::set(bid_count, auction_id, 0u32);
        Mapping::set(highest_bid, auction_id, 0u64);
    }

    // Place a sealed bid (private)
    // Accepts a private credits record — hides bidder address during commit phase
    async transition place_bid(
        public auction_id: field,
        bid_amount: u64,
        salt: field,
        public deposit: u64,
        payment: credits.aleo/credits,  // Private credits record input
    ) -> (BidCommitment, Future) {
        // Deposit must cover the bid
        assert(deposit >= bid_amount);

        // Commitment = hash(bid_amount || salt || auction_id)
        let commitment: field = BHP256::hash_to_field(
            CommitmentData { bid_amount, salt, auction_id }
        );

        // Create private record for bidder
        let bid_record: BidCommitment = BidCommitment {
            owner: self.caller,
            auction_id: auction_id,
            commitment: commitment,
            bid_amount: bid_amount,
            salt: salt,
            deposit: deposit,
        };

        // Transfer real credits from signer to program address (escrow)
        // Use transfer_private_to_public to hide the bidder's address during commit phase
        let transfer_future: Future = credits.aleo/transfer_private_to_public(
            payment,
            self.address,
            deposit
        );

        return (bid_record, finalize_place_bid(auction_id, commitment, deposit, transfer_future));
    }

    async function finalize_place_bid(
        auction_id: field,
        commitment: field,
        deposit: u64,
        transfer_future: Future,   // Future from credits.aleo transfer
    ) {
        // Finalize the credit transfer first (atomic with bid placement)
        transfer_future.await();

        // Get auction and verify it's in commit phase
        let auction: Auction = Mapping::get(auctions, auction_id);
        assert_eq(auction.status, 1u8);
        assert(block.height <= auction.commit_deadline);

        // Ensure commitment is unique
        assert(!Mapping::contains(commitments, commitment));
        Mapping::set(commitments, commitment, true);

        // Increment bid count
        let count: u64 = Mapping::get(bid_count, auction_id);
        Mapping::set(bid_count, auction_id, count + 1u64);

        // Track total deposits
        let current_deposits: u64 = Mapping::get(auction_deposits, auction_id);
        Mapping::set(auction_deposits, auction_id, current_deposits + deposit);
    }

    // Reveal bid (consumes BidCommitment record)
    async transition reveal_bid(
        private bid_record: BidCommitment,
        private bid_amount: u64,
        private salt: field,
    ) -> Future {
        // Verify commitment matches
        let expected_commitment: field = BHP256::hash_to_field(
            (bid_amount, salt, bid_record.auction_id)
        );
        assert_eq(expected_commitment, bid_record.commitment);
        
        // Verify deposit covers bid
        assert(bid_record.deposit >= bid_amount);
        
        return finalize_reveal_bid(
            bid_record.auction_id, 
            self.caller, 
            bid_amount
        );
    }

    async function finalize_reveal_bid(
        auction_id: field,
        bidder: address,
        bid_amount: u64,
    ) {
        let auction: Auction = Mapping::get(auctions, auction_id);
        
        // Auto-transition to reveal phase if needed
        if (auction.status == 0u8 && block.height > auction.commit_deadline) {
            let updated: Auction = Auction {
                auctioneer: auction.auctioneer,
                item_id: auction.item_id,
                min_bid: auction.min_bid,
                commit_deadline: auction.commit_deadline,
                reveal_deadline: auction.reveal_deadline,
                status: 1u8,
                winner: auction.winner,
                winning_bid: auction.winning_bid,
            };
            Mapping::set(auctions, auction_id, updated);
        }
        
        // Verify in reveal phase
        let current: Auction = Mapping::get(auctions, auction_id);
        assert(current.status == 1u8 || 
               (current.status == 0u8 && block.height > current.commit_deadline));
        assert(block.height <= current.reveal_deadline);
        
        // Update highest bid if this is higher
        let current_highest: u64 = Mapping::get(highest_bid, auction_id);
        if (bid_amount > current_highest) {
            Mapping::set(highest_bid, auction_id, bid_amount);
            Mapping::set(highest_bidder, auction_id, bidder);
        }
    }

    // Settle the auction
    async transition settle_auction(
        public auction_id: field,
    ) -> Future {
        return finalize_settle_auction(auction_id);
    }

    async function finalize_settle_auction(auction_id: field) {
        let auction: Auction = Mapping::get(auctions, auction_id);
        assert(block.height > auction.reveal_deadline);
        assert(auction.status != 2u8);
        
        let winner: address = Mapping::get(highest_bidder, auction_id);
        let winning_bid: u64 = Mapping::get(highest_bid, auction_id);
        
        let settled: Auction = Auction {
            auctioneer: auction.auctioneer,
            item_id: auction.item_id,
            min_bid: auction.min_bid,
            commit_deadline: auction.commit_deadline,
            reveal_deadline: auction.reveal_deadline,
            status: 2u8,
            winner: winner,
            winning_bid: winning_bid,
        };
        
        Mapping::set(auctions, auction_id, settled);
    }
}
```

---

## Frontend Architecture

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Styling** | TailwindCSS + shadcn/ui |
| **State** | Zustand (lightweight, no boilerplate) |
| **Wallet** | @provablehq wallet adapters (Leo, Shield support) |
| **Aleo SDK** | @provablehq/sdk for proof generation |

### Key Components

```text
src/
├── app/
│   ├── page.tsx                    # Home - active auctions list
│   ├── auction/[id]/page.tsx       # Single auction view
│   ├── create/page.tsx             # Create auction form
│   └── my-bids/page.tsx            # User's bid history
├── components/
│   ├── AuctionCard.tsx             # Auction preview card
│   ├── BidForm.tsx                 # Place sealed bid
│   ├── RevealForm.tsx              # Reveal bid with salt
│   ├── AuctionTimer.tsx            # Countdown to phase change
│   └── WalletConnect.tsx           # Multi-wallet connection
├── hooks/
│   ├── useAuction.ts               # Fetch auction state
│   ├── useBid.ts                   # Place/reveal bid logic
│   └── useWallet.ts                # Wallet connection wrapper
├── lib/
│   ├── aleo.ts                     # SDK initialization
│   ├── zkauction.ts                # Program interaction helpers
│   └── utils.ts                    # Helpers (salt generation, etc.)
└── store/
    └── auctionStore.ts             # Zustand global state
```

---

## User Flows

### Flow 1: Create Auction
1. Auctioneer connects wallet (Leo/Shield)
2. Fills form: item description, minimum bid, commit duration, reveal duration
3. Signs transaction → `create_auction` transition executes
4. Auction appears in public list with countdown timer

### Flow 2: Place Sealed Bid
1. Bidder navigates to auction page
2. Enters bid amount (hidden from chain)
3. Frontend generates random salt locally
4. Frontend computes `commitment = hash(amount, salt, auction_id)`
5. Bidder enters deposit amount (≥ bid amount, visible on-chain)
6. Signs transaction → receives encrypted `BidCommitment` record
7. **CRITICAL:** Frontend stores salt in `localStorage` (needed for reveal)

### Flow 3: Reveal Bid
1. After commit deadline passes, reveal phase begins
2. Bidder returns to auction page
3. Frontend retrieves salt from `localStorage`
4. Signs `reveal_bid` transition with original `amount` + `salt`
5. Contract verifies hash matches, records bid publicly

### Flow 4: Settlement & Refunds
1. After reveal deadline, anyone can call `settle_auction`
2. Contract determines highest bidder
3. Winner's deposit transfers to auctioneer
4. Losing bidders can claim refunds

---

## 10-Wave Implementation Roadmap

### Waves 1-2: Core MVP (Jan 20 - Feb 17)
**Goal:** Working 2-party auction on testnet with basic UI

*   **Wave 1 Deliverables**
    *   Leo program: `create_auction`, `place_bid` transitions
    *   Deploy to Aleo testnet
    *   Next.js scaffold with wallet connection
    *   Basic create auction form
    *   GitHub repo with README
*   **Wave 2 Deliverables**
    *   Leo program: `reveal_bid`, `settle_auction` transitions
    *   Bid placement UI with salt generation
    *   Reveal UI with `localStorage` salt retrieval
    *   Auction state display (phase, countdown)
    *   Demo video showing full flow

### Waves 3-4: Multi-Bidder & Refunds (Feb 17 - Mar 17)
**Goal:** Production-ready multi-bidder auctions with refund system

*   **Wave 3 Deliverables**
    *   Support N bidders per auction
    *   Bid count display (without revealing amounts)
    *   Auction list page with filters
    *   "My Bids" dashboard
*   **Wave 4 Deliverables**
    *   `claim_refund` transition for losing bidders
    *   Automatic refund UI after settlement
    *   Handle no-reveal penalty (forfeit deposit)
    *   Error handling & edge cases

### Wave 3: Vickrey (Second-Price) Auctions (Feb 17 - Mar 3)
**Goal:** Second-price sealed-bid — winner pays 2nd highest bid

*   New program `aloe_auction_v3.aleo` with `auction_type` field
*   Vickrey settlement: winner pays `second_highest_bid`
*   AuctionTypeSelector component (First-Price vs Vickrey)

### Wave 4: Dutch Auctions + On-Chain Reader (Mar 3-17)
**Goal:** Descending-price auctions + state reader utility

*   Dutch auction: price drops over time, first buyer wins
*   `lib/aleoReader.js` for querying on-chain mappings via REST API
*   DutchPriceTicker, DutchBuyButton components

### Wave 5: Composability — Importable Primitive (Mar 17-31)
**Goal:** Make Aloe importable by other Leo programs

*   Refactor transitions for clean import signatures
*   Demo wrapper: `aloe_nft_auction_v1.aleo`
*   Integration guide documentation

### Wave 6: Multi-Use-Case Frontend Skins (Mar 31 - Apr 14)
**Goal:** Same contract, different UI presentations

*   NFT Auction skin at `/nft`
*   Procurement/RFQ skin at `/procurement`
*   Deprecated pages redirect to `/dashboard`

### Waves 7-8: Reverse + Batch + Advanced Privacy + SDK (Apr 14 - May 12)
**Goal:** Complete all 5 auction types + JS SDK

*   Reverse auction (lowest bid wins) for procurement
*   Batch auction (uniform clearing price) for token sales
*   Gated auctions with badge verification
*   `aloe-sdk` npm package for developer integration

### Waves 9-10: Security Audit + Mainnet (May 12 - Jun 9)
**Goal:** Production deployment with professional UX

*   Security audit of 3 Leo programs
*   Mainnet deployment
*   Analytics dashboard
*   SDK published to npm
*   Bug bounty program

---

## Risk Mitigation

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **User loses salt** | Cannot reveal bid, loses deposit | Encrypt salt backup to user's wallet pubkey; prompt download |
| **No bidders reveal** | Auction fails, auctioneer unhappy | Return escrowed item if no reveals; deposits go to auctioneer |
| **Gas price spikes** | Users can't reveal in time | Longer reveal windows; gas estimation in UI |
| **Front-running reveals** | Others see reveal txs and adjust | Once committed, bid is fixed—reveals don't help competitors |
| **Testnet instability** | Development blocked | Local dev environment; mock Aleo for UI testing |

---

## Quick Start Guide

### Prerequisites

```bash
# Install Leo
curl -sSL https://install.leo.app | sh

# Install Aleo CLI
cargo install snarkos

# Install Node.js 18+
nvm install 18

# Clone starter template (mikenike360's template)
git clone https://github.com/mikenike360/aleo-starter-template
```

### Day 1 Tasks

1.  Set up Leo development environment
2.  Complete Leo playground tutorial
3.  Write `BidCommitment` record and `Auction` struct
4.  Implement `create_auction` transition
5.  Test locally with `leo run`

### Key Resources

*   **Aleo Developer Docs:** [developer.aleo.org](https://developer.aleo.org)
*   **Leo Language Docs:** [leo-lang.org](https://leo-lang.org)
*   **Leo Playground:** [play.leo-lang.org](https://play.leo-lang.org)
*   **Wallet Adapter:** [github.com/ProvableHQ/aleo-wallet-adapter](https://github.com/ProvableHQ/aleo-wallet-adapter)
*   **Awesome Aleo:** [github.com/howardwu/awesome-aleo](https://github.com/howardwu/awesome-aleo)
*   **Buildathon Discord:** [t.me/akindo_io/5725](https://t.me/akindo_io/5725)

---

## Wave Submission Checklist

Use this checklist for each wave submission:

- **Project Overview**
    - [ ] Name, description, problem being solved
    - [ ] Why privacy matters for auctions
    - [ ] PMF: NFT marketplaces, domain sales, procurement
- **Working Demo**
    - [ ] Deployed on Aleo Testnet
    - [ ] Functional Leo smart contracts
    - [ ] Basic UI demonstrating core flow
- **Technical Documentation**
    - [ ] GitHub repository with README
    - [ ] Architecture overview
    - [ ] Privacy model explanation
- **Team Information**
    - [ ] Your name and Discord handle
    - [ ] Aleo wallet address for grant distribution
- **Progress Changelog (Wave 2+)**
    - [ ] What you built since last submission
    - [ ] Feedback incorporated
    - [ ] Next wave goals

---

## Conclusion

**Aloe** represents the ideal intersection of Aleo's technical capabilities and real-world demand for private auctions. The commit-reveal pattern is a well-understood cryptographic primitive that translates perfectly to Aleo's Record-based privacy model.

With 35 hours/week over 10 waves, you have ample time to build a production-ready platform that could become critical infrastructure for the Aleo ecosystem—powering NFT marketplaces, domain auctions, and decentralized procurement.

**Start with Wave 1. Ship the MVP. Iterate relentlessly. Good luck!**

*_—— End of Specification ——_*
