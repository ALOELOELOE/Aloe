# zkAuction Quick Start Guide

## 🚀 Day 1 Checklist

### Environment Setup (1-2 hours)

```bash
# 1. Install Leo CLI
curl -sSL https://install.leo.app | sh
source ~/.bashrc

# 2. Verify installation
leo --version

# 3. Create new Leo project
leo new zkauction
cd zkauction

# 4. Replace src/main.leo with the provided zkauction.leo
```

### Test Locally (30 min)

```bash
# Build the program
leo build

# Test create_auction
leo run create_auction 1field 100field 1000u64 100u32 50u32

# Test place_bid (amount=500, salt=12345, deposit=600)
leo run place_bid 1field 500u64 12345field 600u64
```

---

## 📁 Project Structure

```
zkauction/
├── program.json          # Project config
├── src/
│   └── main.leo          # Smart contract (rename to zkauction.leo)
├── build/                # Compiled artifacts
├── inputs/               # Test inputs
└── outputs/              # Execution outputs
```

---

## 🔑 Core Concepts

### Records vs Mappings

| Feature | Records | Mappings |
|---------|---------|----------|
| Visibility | Private (encrypted) | Public |
| Use case | User-owned data | Global state |
| Example | BidCommitment | Auction details |

### Commit-Reveal Flow

```
COMMIT PHASE                          REVEAL PHASE
─────────────                         ────────────
User knows:                           User reveals:
  - bid_amount (500)                    - bid_amount (500)
  - salt (random)                       - salt (same random)

Chain sees:                           Chain verifies:
  - commitment hash                     hash(500, salt) == commitment ✓
  - deposit amount                    
                                      Chain records:
                                        - 500 as valid bid
```

---

## 🛠 Frontend Integration

### Install Dependencies

```bash
npx create-next-app@latest zkauction-frontend --typescript --tailwind
cd zkauction-frontend

npm install \
  @demox-labs/aleo-wallet-adapter-base \
  @demox-labs/aleo-wallet-adapter-react \
  @demox-labs/aleo-wallet-adapter-reactui \
  aleo-adapters \
  zustand
```

### Wallet Setup (src/providers/WalletProvider.tsx)

```tsx
"use client";

import { WalletProvider, WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletAdapterNetwork, DecryptPermission } from "@demox-labs/aleo-wallet-adapter-base";
import { LeoWalletAdapter, PuzzleWalletAdapter } from "aleo-adapters";
import { useMemo } from "react";

export function AleoWalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new LeoWalletAdapter({ appName: "zkAuction" }),
    new PuzzleWalletAdapter({ appName: "zkAuction" }),
  ], []);

  return (
    <WalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.TestnetBeta}
      autoConnect
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </WalletProvider>
  );
}
```

### Place Bid Hook (src/hooks/usePlaceBid.ts)

```tsx
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";

export function usePlaceBid() {
  const { publicKey, requestTransaction } = useWallet();

  const placeBid = async (
    auctionId: string,
    bidAmount: number,
    deposit: number
  ) => {
    if (!publicKey) throw new Error("Wallet not connected");

    // Generate random salt
    const salt = Math.floor(Math.random() * 1000000000).toString() + "field";
    
    // CRITICAL: Store salt in localStorage for reveal phase
    localStorage.setItem(`bid_salt_${auctionId}`, salt);

    const transaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      "zkauction.aleo",
      "place_bid",
      [
        auctionId + "field",           // auction_id (public)
        bidAmount.toString() + "u64",   // bid_amount (private)
        salt,                           // salt (private)
        deposit.toString() + "u64",     // deposit (public)
      ],
      deposit * 1000000,                // fee in microcredits
    );

    const txId = await requestTransaction(transaction);
    return { txId, salt };
  };

  return { placeBid };
}
```

---

## ✅ Wave 1 Submission Checklist

### Required Deliverables

- [ ] **Leo Program**
  - [ ] `create_auction` transition working
  - [ ] `place_bid` transition working
  - [ ] Deployed to testnet

- [ ] **Frontend**
  - [ ] Wallet connection (Leo or Puzzle)
  - [ ] Create auction form
  - [ ] Basic auction list

- [ ] **Documentation**
  - [ ] GitHub repo with README
  - [ ] Demo video (2-3 min Loom)
  - [ ] Architecture diagram

### Submission Format

```markdown
# zkAuction - Wave 1 Submission

## Project Overview
zkAuction is a privacy-preserving sealed-bid auction platform built on Aleo.

## Problem
Traditional blockchain auctions expose bid amounts, enabling front-running 
and strategic manipulation.

## Solution
Commit-reveal scheme using Aleo's zero-knowledge proofs to hide bids until 
the reveal phase.

## Demo
- Video: [Loom link]
- Testnet: [Program ID]

## GitHub
https://github.com/[username]/zkauction

## Team
- Name: [Your name]
- Discord: [Your handle]
- Wallet: aleo1...

## Next Wave Goals
- Implement reveal_bid and settle_auction
- Add countdown timer UI
- Multi-bidder support
```

---

## 📚 Resources

| Resource | URL |
|----------|-----|
| Leo Docs | https://leo-lang.org |
| Leo Playground | https://play.leo-lang.org |
| Aleo Developer Docs | https://developer.aleo.org |
| Wallet Adapter | https://github.com/demox-labs/aleo-wallet-adapter |
| Awesome Aleo | https://github.com/howardwu/awesome-aleo |
| Testnet Faucet | https://faucet.aleo.org |
| Buildathon Discord | https://t.me/akindo_io/5725 |

---

## ⚠️ Common Pitfalls

### 1. Lost Salt = Lost Bid
```tsx
// ALWAYS store salt before transaction
localStorage.setItem(`bid_salt_${auctionId}`, salt);
// Consider also prompting user to download backup
```

### 2. Proof Generation Time
```
Leo Wallet generates proofs locally → can take 30-60 seconds
Show loading indicator and don't let users navigate away
```

### 3. Record Consumption
```
Records are consumed when used in transitions
BidCommitment record is consumed during reveal_bid
You get a BidReceipt record in return
```

### 4. Block Height vs Timestamps
```
Aleo uses block.height for timing, not timestamps
~1 block per 10 seconds on testnet
100 blocks ≈ 16 minutes
```

---

## 🎯 Success Metrics by Wave

| Wave | Metric | Target |
|------|--------|--------|
| 1 | Core transitions | create + place_bid working |
| 2 | Full flow | End-to-end demo |
| 3-4 | Multi-user | 5+ bidders per auction |
| 5-6 | Token support | Auction ALEO/custom tokens |
| 7-8 | Variants | Reverse + Vickrey auctions |
| 9-10 | Mainnet | Production deployment |

---

**Good luck! Ship fast, iterate often. 🚀**
