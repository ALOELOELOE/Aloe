# Aloe
### Private Sealed-Bid Auction Platform on Aleo

**Status:** 🚧 Alpha / Active Development  
**Hackathon:** Aleo x AKINDO Privacy Buildathon 2026

![Aleo](https://img.shields.io/badge/Aleo-Zero%20Knowledge-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Overview

**Aloe** is a privacy-first sealed-bid auction platform built on the Aleo blockchain. It leverages Zero-Knowledge Proofs (ZKPs) to enable trustless auctions where bid amounts remain cryptographic secrets until a designated reveal phase.

Unlike traditional blockchain auctions where all bids are public (enabling front-running and deeper pockets to game the system), Aloe uses the "Commit-Reveal" scheme to ensure fairness and privacy.

### The Problem it Solves
- **Prevents Front-Running:** Competitors cannot see your bid and outbid you by $1.
- **Stops Strategic Manipulation:** Bidders cannot adjust their strategy based on visible competing bids.
- **Protects Financial Privacy:** Your bidding capacity and patterns remain private.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🔒 Sealed Bids** | Bids are encrypted on-chain using Aleo Records. Even the auctioneer cannot see them until the reveal phase. |
| **🛡️ Commit-Reveal** | A 2-step process: **Commit** `hash(bid + salt)` → **Reveal** `(bid, salt)` to prove validity. |
| **💸 Trustless Settlement** | Smart contracts automatically determine the winner and handle fund transfers/refunds. |
| **⚡ Instant Refunds** | Losing bidders can claim refunds immediately after the auction settles. |
| **👤 User Privacy** | Built on Aleo, preserving the privacy of the bidder's identity and activity where possible. |

---

## 🏗️ Architecture

Aloe is a hybrid dApp combining a Leo-based smart contract with a modern Next.js frontend.

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
 │  │    React    │     │   User      │     │     Aloe    │       │
 │  │    State    │     │  Key Pair   │     │   Program   │       │
 │  └─────────────┘     └─────────────┘     └─────────────┘       │
 └─────────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Smart Contract:** [Leo Language](https://leo-lang.org/)
- **Frontend:** Next.js 14, React, TailwindCSS, shadcn/ui
- **State Management:** Zustand
- **Wallets:** Leo Wallet, Shield Wallet
- **ZK Generation:** @provablehq/sdk

---

## 🚀 Getting Started

### Prerequisites
1.  **Aleo Wallet:** Install [Leo Wallet](https://www.leo.app/) or Shield Wallet (required for buildathon).
2.  **Node.js:** v18 or later.
3.  **Rust/Cargo:** Required for installing Leo CLI (optional if just running frontend).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/aloe.git
    cd aloe
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Buildathon Requirements

### Shield Wallet Integration
Aloe supports **Shield Wallet** via `@provablehq/aleo-wallet-adaptor-shield`, fulfilling the buildathon's wallet integration requirement. The wallet adapter stack has been migrated from `@demox-labs` to `@provablehq` to enable Shield support.

### credits.aleo Escrow
The `place_bid` transition integrates with Aleo's native `credits.aleo` program to transfer **real credits** into escrow. When a bidder places a bid, their deposit is transferred to the program's on-chain address via `credits.aleo/transfer_public_as_signer`, locking funds until the auction settles.

### Deployed Program
- **Program ID:** `aloe_auction_v2.aleo`
- **Network:** Aleo Testnet
- **Deployment TX:** `at14gxf5urs5dy53llj8vz8f3j7ay4qkdustpea7vy7yn43fxxrmcxqwa0j6t`

---

## 🔄 User Flow

1.  **Connect Wallet:** User connects their Aleo wallet.
2.  **Create Auction:** Auctioneer sets item details, minimum bid, and durations for commit/reveal phases.
3.  **Place Bid:**
    - Bidder enters amount.
    - App generates a random `salt`.
    - App submits `Commitment = Hash(amount, salt)`.
    - **Note:** The `salt` is saved locally. Do not lose it!
4.  **Reveal Bid:**
    - After the commit phase ends, the reveal phase starts.
    - Bidder submits the original `amount` and `salt`.
    - Contract verifies the hash matches the commitment.
5.  **Settlement:** Highest verified bid wins. Winner gets the item, seller gets the funds, others get refunds.

---

## 🛣️ Roadmap

- [ ] **Wave 1:** Core Leo program (create, bid) & Basic UI
- [ ] **Wave 2:** Reveal & Settle logic, localStorage salt management
- [ ] **Wave 3-4:** Multi-bidder support, Refunds, Edge cases
- [ ] **Wave 5-6:** Token & NFT Integration
- [ ] **Wave 7-8:** Advanced auction types (Reverse, Vickrey)
- [ ] **Wave 9-10:** Mainnet Launch, Audits, Analytics

---

## ⚠️ Disclaimer
This project is currently in **Alpha**. The smart contracts have not been audited. Use at your own risk.

---

*_Built for the Aleo x AKINDO Privacy Buildathon 2026_*
