# Aloe
### Privacy-Preserving Auction Primitive on Aleo

**Status:** Alpha / Active Development
**Hackathon:** Aleo x AKINDO Privacy Buildathon 2026

![Aleo](https://img.shields.io/badge/Aleo-Zero%20Knowledge-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

**Aloe** is a composable, privacy-preserving sealed-bid auction primitive built on the Aleo blockchain. It leverages Zero-Knowledge Proofs (ZKPs) to enable trustless auctions where bid amounts remain cryptographic secrets until a designated reveal phase.

Unlike traditional blockchain auctions where all bids are public (enabling front-running and strategic manipulation), Aloe uses a commit-reveal scheme with BHP256 hash commitments to ensure fairness and privacy. The same auction contract powers multiple use cases — NFT sales, procurement, token launches — through different frontend skins.

### The Problem it Solves
- **Prevents Front-Running:** Competitors cannot see your bid and outbid you by $1.
- **Stops Strategic Manipulation:** Bidders cannot adjust their strategy based on visible competing bids.
- **Protects Financial Privacy:** Your bidding capacity and patterns remain private.
- **Composable Primitive:** Other Leo programs can import and call Aloe's auction transitions directly.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Sealed Bids** | Bids are committed as BHP256 hashes on-chain. Even the auctioneer cannot see them until the reveal phase. |
| **Commit-Reveal** | A 2-step process: **Commit** `BHP256(bid + salt + auction_id)` then **Reveal** `(bid, salt)` to prove validity. |
| **Private Credits** | Deposits use `credits.aleo/transfer_private_to_public` — bidder address stays hidden during commit phase. |
| **5 Auction Types** | First-Price, Vickrey (2nd price), Dutch (descending), Reverse (procurement), Batch (uniform clearing). |
| **Composable** | Other Leo programs can `import aloe_auction_v3.aleo` and embed private auctions in their own dApps. |
| **Instant Refunds** | Losing bidders can claim refunds immediately after the auction settles. |

---

## Architecture

Aloe is a hybrid dApp combining Leo smart contracts with a modern Next.js frontend.

```ascii
 ┌─────────────────────────────────────────────────────────────────┐
 │                        ALOE SYSTEM                              │
 ├─────────────────────────────────────────────────────────────────┤
 │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
 │  │   Next.js   │────▶│ Wallet App  │────▶│    Aleo     │       │
 │  │  Frontend   │     │(Leo/Shield) │     │   Network   │       │
 │  └─────────────┘     └─────────────┘     └─────────────┘       │
 │         │                   │                   │               │
 │         ▼                   ▼                   ▼               │
 │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
 │  │    React    │     │   User      │     │  Aloe       │       │
 │  │    State    │     │  Key Pair   │     │  Programs   │       │
 │  └─────────────┘     └─────────────┘     └─────────────┘       │
 └─────────────────────────────────────────────────────────────────┘
```

### Programs (3 total)
| Program | Purpose |
| :--- | :--- |
| `aloe_auction_v2.aleo` | First-price sealed-bid with privacy-fixed credits flow |
| `aloe_auction_v3.aleo` | Multi-type auctions: Vickrey, Dutch, Reverse, Batch |
| `aloe_nft_auction_v1.aleo` | Demo wrapper — shows how to import and extend the auction primitive |

### Tech Stack
- **Smart Contract:** [Leo Language](https://leo-lang.org/)
- **Frontend:** Next.js, React, TailwindCSS, shadcn/ui
- **State Management:** Zustand
- **Wallets:** Leo Wallet, Shield Wallet (via @provablehq wallet adapters)
- **ZK Generation:** @provablehq/sdk

---

## Getting Started

### Prerequisites
1. **Aleo Wallet:** Install [Leo Wallet](https://www.leo.app/) or Shield Wallet.
2. **Node.js:** v18 or later.

### Installation

```bash
git clone https://github.com/your-username/aloe.git
cd aloe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Buildathon Requirements

### Shield Wallet Integration
Aloe supports **Shield Wallet** via `@provablehq/aleo-wallet-adaptor-shield`, fulfilling the buildathon's wallet integration requirement. The wallet adapter stack uses `@provablehq` packages for both Leo and Shield wallet support.

### credits.aleo Escrow
The `place_bid` transition integrates with Aleo's native `credits.aleo` program to transfer **real credits** into escrow. Bidder deposits use `credits.aleo/transfer_private_to_public` — this hides the bidder's address during the commit phase, preserving privacy. Only the winning address is revealed at settlement.

### Deployed Program
- **Program ID:** `aloe_auction_v2.aleo`
- **Network:** Aleo Testnet
- **Deployment TX:** `at14gxf5urs5dy53llj8vz8f3j7ay4qkdustpea7vy7yn43fxxrmcxqwa0j6t`

---

## User Flow

1. **Connect Wallet:** User connects Leo Wallet or Shield Wallet.
2. **Create Auction:** Auctioneer sets item details, auction type, minimum bid, and durations.
3. **Place Bid:**
   - Bidder enters amount.
   - App generates a random `salt`.
   - App computes `commitment = BHP256(amount, salt, auction_id)`.
   - Deposit is locked via private credits transfer.
   - **Note:** The `salt` is saved locally. Do not lose it!
4. **Reveal Bid:**
   - After commit phase ends, reveal phase starts.
   - Bidder submits original `amount` and `salt`.
   - Contract verifies hash matches the commitment.
5. **Settlement:** Highest verified bid wins. Winner gets the item, seller gets the funds, others get refunds.

---

## Roadmap

- [x] **Wave 1:** Core Leo program (create, bid) & basic UI
- [ ] **Wave 2:** Privacy fix (`transfer_private_to_public`) + reveal/settle/refund lifecycle
- [ ] **Wave 3:** Vickrey (second-price) auctions
- [ ] **Wave 4:** Dutch (descending-price) auctions + on-chain reader
- [ ] **Wave 5:** Composability — importable primitive + demo wrapper
- [ ] **Wave 6:** Multi-use-case frontend skins (NFT, Procurement)
- [ ] **Wave 7:** Reverse + Batch auction types
- [ ] **Wave 8:** Advanced privacy features + JS SDK (`aloe-sdk`)
- [ ] **Wave 9:** Security audit + production hardening
- [ ] **Wave 10:** Mainnet deployment + analytics

---

## Disclaimer
This project is currently in **Alpha**. The smart contracts have not been audited. Use at your own risk.

---

*Built for the Aleo x AKINDO Privacy Buildathon 2026*
