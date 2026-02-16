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
  @provablehq/aleo-wallet-adaptor-core \
  @provablehq/aleo-wallet-adaptor-react \
  @provablehq/aleo-wallet-adaptor-react-ui \
  @provablehq/aleo-wallet-adaptor-leo \
  @provablehq/aleo-wallet-adaptor-shield \
  @provablehq/aleo-types \
  zustand
```

### Wallet Setup (src/providers/WalletProvider.tsx)

```tsx
"use client";

import { useMemo } from "react";
import { AleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";
import { Network } from "@provablehq/aleo-types";
import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Shield Wallet is required for the buildathon
  const wallets = useMemo(() => [
    new LeoWalletAdapter({ appName: "Aloe Auctions" }),
    new ShieldWalletAdapter({ appName: "Aloe Auctions" }),
  ], []);

  return (
    <AleoWalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={Network.TESTNET}
      autoConnect
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </AleoWalletProvider>
  );
}
```

### Place Bid Hook (src/hooks/usePlaceBid.ts)

```tsx
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";

export function usePlaceBid() {
  const { address, executeTransaction } = useWallet();

  const placeBid = async (
    auctionId: string,
    bidAmount: number,
    deposit: number
  ) => {
    if (!address) throw new Error("Wallet not connected");

    // Generate random salt
    const salt = Math.floor(Math.random() * 1000000000).toString() + "field";

    // CRITICAL: Store salt in localStorage for reveal phase
    localStorage.setItem(`bid_salt_${auctionId}`, salt);

    // place_bid now transfers real credits via credits.aleo/transfer_public_as_signer
    // The deposit amount is escrowed on-chain in the program's public account
    const txId = await executeTransaction({
      program: "aloe_auction_v2.aleo",
      function: "place_bid",
      inputs: [
        auctionId + "field",           // auction_id (public)
        bidAmount.toString() + "u64",   // bid_amount (private)
        salt,                           // salt (private)
        deposit.toString() + "u64",     // deposit (public)
      ],
      fee: deposit * 1000000,           // fee in microcredits
    });

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
  - [ ] Wallet connection (Leo or Shield)
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
| Wallet Adapter | https://github.com/ProvableHQ/aleo-wallet-adapter |
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
