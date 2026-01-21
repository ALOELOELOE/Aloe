
zkAuction
Private Sealed-Bid Auction Platform on Aleo
Technical Specification & Implementation Roadmap
Aleo x AKINDO Privacy Buildathon 2026
Version 1.0 | January 2026
 
Executive Summary
zkAuction is a zero-knowledge sealed-bid auction platform built on Aleo that enables trustless, private auctions where bid amounts remain hidden until the reveal phase. This document provides a complete technical specification for building zkAuction over the 10-wave Buildathon cycle.
Why zkAuction Wins
Privacy (40%)	Sealed-bid auctions are THE canonical ZK use case. Bids must be hidden until reveal. Aleo's Record model enables this perfectly.
Technical (20%)	Commit-reveal scheme is well-understood. Uses Records for private state, mappings for public state.
UX (20%)	3-step flow: Connect → Bid → Reveal. Familiar auction UX with privacy guarantees.
Practicality (10%)	Real use cases: NFT auctions, domain sales, procurement, freelance bidding, treasury asset sales.
Novelty (10%)	No sealed-bid auction exists on Aleo. First mover advantage in a critical DeFi primitive.
 
Problem Statement
The Transparency Problem
Traditional blockchain auctions expose critical information that undermines fair price discovery:
•	Front-running: Competitors see your bid and outbid by $1
•	Strategic manipulation: Bidders adjust based on visible competing bids
•	Privacy leakage: Your bidding patterns reveal financial capacity
•	Collusion: Visible bids enable bid-rigging cartels
The Solution: ZK Sealed-Bid Auctions
zkAuction uses Aleo's zero-knowledge architecture to implement cryptographically sealed bids:
1.	Commit Phase: Bidders submit hash(bid_amount + secret_salt) — bid amount is hidden
2.	Reveal Phase: Bidders reveal their bid_amount and salt — contract verifies hash matches
3.	Settlement: Highest valid bid wins, all others get refunds
 
System Architecture
High-Level Architecture
 ┌─────────────────────────────────────────────────────────────────┐ │                        ZKAUCTION SYSTEM                         │ ├─────────────────────────────────────────────────────────────────┤ │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │ │  │   Next.js   │────▶│   Wallet    │────▶│    Aleo     │       │ │  │  Frontend   │     │   Adapter   │     │   Network   │       │ │  └─────────────┘     └─────────────┘     └─────────────┘       │ │         │                   │                   │               │ │         ▼                   ▼                   ▼               │ │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │ │  │    React    │     │ Leo Wallet  │     │  zkAuction  │       │ │  │    State    │     │   Puzzle    │     │   Program   │       │ │  └─────────────┘     └─────────────┘     └─────────────┘       │ └─────────────────────────────────────────────────────────────────┘ 
Data Model
Records (Private State)
Records are encrypted on-chain and only visible to the owner:
 record BidCommitment {     owner: address,           // Bidder's address     auction_id: field,        // Which auction this bid is for     commitment: field,        // hash(bid_amount, salt)     deposit: u64,             // Locked funds (must be >= bid_amount) }  record BidReveal {     owner: address,     auction_id: field,     bid_amount: u64,          // Actual bid amount     salt: field,              // Random salt used in commitment }  record RefundReceipt {     owner: address,     auction_id: field,     amount: u64,              // Amount to be refunded } 
Mappings (Public State)
Mappings store publicly visible auction metadata:
 mapping auctions: field => Auction; struct Auction {     auctioneer: address,      // Creator of the auction     item_id: field,           // What's being auctioned     min_bid: u64,             // Minimum acceptable bid     commit_deadline: u32,     // Block height deadline for commits     reveal_deadline: u32,     // Block height deadline for reveals     status: u8,               // 0=active, 1=reveal, 2=settled     winner: address,          // Winning bidder (after settlement)     winning_bid: u64,         // Winning amount (after settlement) }  mapping bid_count: field => u32;           // auction_id => number of bids mapping revealed_count: field => u32;      // auction_id => number of reveals mapping commitments: field => bool;        // commitment_hash => exists 
 
Smart Contract Specification
Core Transitions
Transition	Visibility	Description
create_auction	Public	Create new auction with item, min bid, deadlines
place_bid	Private → Record	Submit commitment hash, lock deposit, receive BidCommitment record
reveal_bid	Private → Public	Reveal bid amount + salt, contract verifies hash match
settle_auction	Public	Determine winner, initiate transfers
claim_refund	Private	Non-winners claim their deposit back
Leo Program Structure
 program zkauction.aleo {      // ========== RECORDS ==========     record BidCommitment {         owner: address,         auction_id: field,         commitment: field,         deposit: u64,     }      // ========== STRUCTS ==========     struct Auction {         auctioneer: address,         item_id: field,         min_bid: u64,         commit_deadline: u32,         reveal_deadline: u32,         status: u8,         winner: address,         winning_bid: u64,     }      // ========== MAPPINGS ==========     mapping auctions: field => Auction;     mapping bid_count: field => u32;     mapping highest_bid: field => u64;     mapping highest_bidder: field => address;     mapping commitments: field => bool;      // ========== TRANSITIONS ==========          // Create a new auction (public)     async transition create_auction(         public auction_id: field,         public item_id: field,         public min_bid: u64,         public commit_duration: u32,         public reveal_duration: u32,     ) -> Future {         return finalize_create_auction(             auction_id,              self.caller,              item_id,              min_bid,              commit_duration,              reveal_duration         );     }      async function finalize_create_auction(         auction_id: field,         auctioneer: address,         item_id: field,         min_bid: u64,         commit_duration: u32,         reveal_duration: u32,     ) {         // Ensure auction doesn't exist         assert(!Mapping::contains(auctions, auction_id));                  let commit_deadline: u32 = block.height + commit_duration;         let reveal_deadline: u32 = commit_deadline + reveal_duration;                  let auction: Auction = Auction {             auctioneer: auctioneer,             item_id: item_id,             min_bid: min_bid,             commit_deadline: commit_deadline,             reveal_deadline: reveal_deadline,             status: 0u8,             winner: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,             winning_bid: 0u64,         };                  Mapping::set(auctions, auction_id, auction);         Mapping::set(bid_count, auction_id, 0u32);         Mapping::set(highest_bid, auction_id, 0u64);     }      // Place a sealed bid (private)     async transition place_bid(         public auction_id: field,         private bid_amount: u64,         private salt: field,         public deposit: u64,     ) -> (BidCommitment, Future) {         // Commitment = hash(bid_amount || salt || auction_id)         let commitment: field = BHP256::hash_to_field(             (bid_amount, salt, auction_id)         );                  // Create private record for bidder         let bid_record: BidCommitment = BidCommitment {             owner: self.caller,             auction_id: auction_id,             commitment: commitment,             deposit: deposit,         };                  return (bid_record, finalize_place_bid(auction_id, commitment, deposit));     }      async function finalize_place_bid(         auction_id: field,         commitment: field,         deposit: u64,     ) {         // Get auction and verify it's in commit phase         let auction: Auction = Mapping::get(auctions, auction_id);         assert(auction.status == 0u8);         assert(block.height <= auction.commit_deadline);         assert(deposit >= auction.min_bid);                  // Ensure commitment is unique         assert(!Mapping::contains(commitments, commitment));         Mapping::set(commitments, commitment, true);                  // Increment bid count         let count: u32 = Mapping::get(bid_count, auction_id);         Mapping::set(bid_count, auction_id, count + 1u32);     }      // Reveal bid (consumes BidCommitment record)     async transition reveal_bid(         private bid_record: BidCommitment,         private bid_amount: u64,         private salt: field,     ) -> Future {         // Verify commitment matches         let expected_commitment: field = BHP256::hash_to_field(             (bid_amount, salt, bid_record.auction_id)         );         assert_eq(expected_commitment, bid_record.commitment);                  // Verify deposit covers bid         assert(bid_record.deposit >= bid_amount);                  return finalize_reveal_bid(             bid_record.auction_id,              self.caller,              bid_amount         );     }      async function finalize_reveal_bid(         auction_id: field,         bidder: address,         bid_amount: u64,     ) {         let auction: Auction = Mapping::get(auctions, auction_id);                  // Auto-transition to reveal phase if needed         if (auction.status == 0u8 && block.height > auction.commit_deadline) {             let updated: Auction = Auction {                 auctioneer: auction.auctioneer,                 item_id: auction.item_id,                 min_bid: auction.min_bid,                 commit_deadline: auction.commit_deadline,                 reveal_deadline: auction.reveal_deadline,                 status: 1u8,                 winner: auction.winner,                 winning_bid: auction.winning_bid,             };             Mapping::set(auctions, auction_id, updated);         }                  // Verify in reveal phase         let current: Auction = Mapping::get(auctions, auction_id);         assert(current.status == 1u8 ||                 (current.status == 0u8 && block.height > current.commit_deadline));         assert(block.height <= current.reveal_deadline);                  // Update highest bid if this is higher         let current_highest: u64 = Mapping::get(highest_bid, auction_id);         if (bid_amount > current_highest) {             Mapping::set(highest_bid, auction_id, bid_amount);             Mapping::set(highest_bidder, auction_id, bidder);         }     }      // Settle the auction     async transition settle_auction(         public auction_id: field,     ) -> Future {         return finalize_settle_auction(auction_id);     }      async function finalize_settle_auction(auction_id: field) {         let auction: Auction = Mapping::get(auctions, auction_id);         assert(block.height > auction.reveal_deadline);         assert(auction.status != 2u8);                  let winner: address = Mapping::get(highest_bidder, auction_id);         let winning_bid: u64 = Mapping::get(highest_bid, auction_id);                  let settled: Auction = Auction {             auctioneer: auction.auctioneer,             item_id: auction.item_id,             min_bid: auction.min_bid,             commit_deadline: auction.commit_deadline,             reveal_deadline: auction.reveal_deadline,             status: 2u8,             winner: winner,             winning_bid: winning_bid,         };                  Mapping::set(auctions, auction_id, settled);     } } 
 
Frontend Architecture
Tech Stack
Layer	Technology
Framework	Next.js 14 (App Router)
Styling	TailwindCSS + shadcn/ui
State	Zustand (lightweight, no boilerplate)
Wallet	aleo-adapters (Leo, Puzzle, Fox support)
Aleo SDK	@provablehq/sdk for proof generation
Key Components
 src/ ├── app/ │   ├── page.tsx                    # Home - active auctions list │   ├── auction/[id]/page.tsx       # Single auction view │   ├── create/page.tsx             # Create auction form │   └── my-bids/page.tsx            # User's bid history ├── components/ │   ├── AuctionCard.tsx             # Auction preview card │   ├── BidForm.tsx                 # Place sealed bid │   ├── RevealForm.tsx              # Reveal bid with salt │   ├── AuctionTimer.tsx            # Countdown to phase change │   └── WalletConnect.tsx           # Multi-wallet connection ├── hooks/ │   ├── useAuction.ts               # Fetch auction state │   ├── useBid.ts                   # Place/reveal bid logic │   └── useWallet.ts                # Wallet connection wrapper ├── lib/ │   ├── aleo.ts                     # SDK initialization │   ├── zkauction.ts                # Program interaction helpers │   └── utils.ts                    # Helpers (salt generation, etc.) └── store/     └── auctionStore.ts             # Zustand global state 
 
User Flows
Flow 1: Create Auction
4.	Auctioneer connects wallet (Leo/Puzzle)
5.	Fills form: item description, minimum bid, commit duration, reveal duration
6.	Signs transaction → create_auction transition executes
7.	Auction appears in public list with countdown timer
Flow 2: Place Sealed Bid
8.	Bidder navigates to auction page
9.	Enters bid amount (hidden from chain)
10.	Frontend generates random salt locally
11.	Frontend computes commitment = hash(amount, salt, auction_id)
12.	Bidder enters deposit amount (≥ bid amount, visible on-chain)
13.	Signs transaction → receives encrypted BidCommitment record
14.	CRITICAL: Frontend stores salt in localStorage (needed for reveal)
Flow 3: Reveal Bid
15.	After commit deadline passes, reveal phase begins
16.	Bidder returns to auction page
17.	Frontend retrieves salt from localStorage
18.	Signs reveal_bid transition with original amount + salt
19.	Contract verifies hash matches, records bid publicly
Flow 4: Settlement & Refunds
20.	After reveal deadline, anyone can call settle_auction
21.	Contract determines highest bidder
22.	Winner's deposit transfers to auctioneer
23.	Losing bidders can claim refunds
 
10-Wave Implementation Roadmap
Waves 1-2: Core MVP (Jan 20 - Feb 17)
Goal: Working 2-party auction on testnet with basic UI
Wave 1 Deliverables
•	Leo program: create_auction, place_bid transitions
•	Deploy to Aleo testnet
•	Next.js scaffold with wallet connection
•	Basic create auction form
•	GitHub repo with README
Wave 2 Deliverables
•	Leo program: reveal_bid, settle_auction transitions
•	Bid placement UI with salt generation
•	Reveal UI with localStorage salt retrieval
•	Auction state display (phase, countdown)
•	Demo video showing full flow
Waves 3-4: Multi-Bidder & Refunds (Feb 17 - Mar 17)
Goal: Production-ready multi-bidder auctions with refund system
Wave 3 Deliverables
•	Support N bidders per auction
•	Bid count display (without revealing amounts)
•	Auction list page with filters
•	"My Bids" dashboard
Wave 4 Deliverables
•	claim_refund transition for losing bidders
•	Automatic refund UI after settlement
•	Handle no-reveal penalty (forfeit deposit)
•	Error handling & edge cases
Waves 5-6: Token/NFT Integration (Mar 17 - Apr 14)
Goal: Auction arbitrary Aleo tokens and NFTs
•	Integrate with token_registry.aleo
•	Support ARC-721 NFT standard (if available)
•	Escrow item in contract during auction
•	Automatic item transfer to winner
•	Item preview in auction UI
Waves 7-8: Advanced Features (Apr 14 - May 12)
Goal: Reverse auctions & auction variants
•	Reverse auction mode (lowest bid wins - for procurement)
•	Second-price (Vickrey) auction variant
•	Reserve price with hidden minimum
•	Auction templates for common use cases
•	Mobile-responsive UI
Waves 9-10: Mainnet & Polish (May 12 - Jun 9)
Goal: Production deployment with professional UX
•	Security audit of Leo contracts
•	Mainnet deployment
•	Email/push notifications for phase changes
•	Analytics dashboard for auctioneers
•	Documentation & API for integrations
•	ETHDenver/EthCC demo preparation
 
Risk Mitigation
Risk	Impact	Mitigation
User loses salt	Cannot reveal bid, loses deposit	Encrypt salt backup to user's wallet pubkey; prompt download
No bidders reveal	Auction fails, auctioneer unhappy	Return escrowed item if no reveals; deposits go to auctioneer
Gas price spikes	Users can't reveal in time	Longer reveal windows; gas estimation in UI
Front-running reveals	Others see reveal txs and adjust	Once committed, bid is fixed—reveals don't help competitors
Testnet instability	Development blocked	Local dev environment; mock Aleo for UI testing
 
Quick Start Guide
Prerequisites
 # Install Leo curl -sSL https://install.leo.app | sh  # Install Aleo CLI cargo install snarkos  # Install Node.js 18+ nvm install 18  # Clone starter template (mikenike360's template) git clone https://github.com/mikenike360/aleo-starter-template 
Day 1 Tasks
24.	Set up Leo development environment
25.	Complete Leo playground tutorial
26.	Write BidCommitment record and Auction struct
27.	Implement create_auction transition
28.	Test locally with leo run
Key Resources
•	Aleo Developer Docs: developer.aleo.org
•	Leo Language Docs: leo-lang.org
•	Leo Playground: play.leo-lang.org
•	Wallet Adapter: github.com/demox-labs/aleo-wallet-adapter
•	Awesome Aleo: github.com/howardwu/awesome-aleo
•	Buildathon Discord: t.me/akindo_io/5725
 
Wave Submission Checklist
Use this checklist for each wave submission:
•	Project Overview
○	Name, description, problem being solved
○	Why privacy matters for auctions
○	PMF: NFT marketplaces, domain sales, procurement
•	Working Demo
○	Deployed on Aleo Testnet
○	Functional Leo smart contracts
○	Basic UI demonstrating core flow
•	Technical Documentation
○	GitHub repository with README
○	Architecture overview
○	Privacy model explanation
•	Team Information
○	Your name and Discord handle
○	Aleo wallet address for grant distribution
•	Progress Changelog (Wave 2+)
○	What you built since last submission
○	Feedback incorporated
○	Next wave goals
 
Conclusion
zkAuction represents the ideal intersection of Aleo's technical capabilities and real-world demand for private auctions. The commit-reveal pattern is a well-understood cryptographic primitive that translates perfectly to Aleo's Record-based privacy model.
With 35 hours/week over 10 waves, you have ample time to build a production-ready platform that could become critical infrastructure for the Aleo ecosystem—powering NFT marketplaces, domain auctions, and decentralized procurement.
Start with Wave 1. Ship the MVP. Iterate relentlessly. Good luck!
—— End of Specification ——
