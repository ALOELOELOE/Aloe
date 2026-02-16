# Wave 10: Mainnet Launch

**Timeline:** May 26 - June 9, 2026
**Theme:** Go Live
**Status:** Planned

---

## Overview

Wave 10 is the final wave: **deploy all Aloe programs to Aleo Mainnet**, switch the frontend to mainnet, add platform analytics, onboard first users, and launch the bug bounty program. This transitions Aloe from a testnet auction primitive into a **production privacy-preserving auction protocol**.

---

## Contract Deployment

### Programs to Deploy

All 3 Aloe programs deployed to Aleo Mainnet in dependency order:

| # | Program | Description | Dependencies |
|---|---------|-------------|--------------|
| 1 | `aloe_auction_v2.aleo` | First-price sealed-bid auction (privacy-fixed) | `credits.aleo` |
| 2 | `aloe_auction_v3.aleo` | Multi-type auction primitive (first-price, Vickrey, Dutch, reverse, batch, gated) | `credits.aleo` |
| 3 | `aloe_nft_auction_v1.aleo` | Composability demo — imports v3 + NFT metadata | `aloe_auction_v3.aleo`, `credits.aleo` |

### Deployment Checklist

**Pre-Launch (T-7 days)**
- [ ] Final security audit sign-off (Wave 9 complete, 0 critical/high findings)
- [ ] Contract code freeze — no changes after this point
- [ ] Mainnet RPC endpoints configured (primary + fallback)
- [ ] Monitoring dashboards live
- [ ] Incident response plan documented
- [ ] All deployment transactions prepared and tested on testnet
- [ ] SDK (`aloe-sdk`) tested against mainnet RPC
- [ ] Integration guide verified with mainnet program IDs

**Launch Day (T-0)**
- [ ] Deploy `aloe_auction_v2.aleo` to Aleo Mainnet
- [ ] Deploy `aloe_auction_v3.aleo` to Aleo Mainnet
- [ ] Deploy `aloe_nft_auction_v1.aleo` to Aleo Mainnet
- [ ] Verify each deployment transaction is confirmed
- [ ] Update frontend constants to mainnet program IDs
- [ ] Switch network configuration from testnet to mainnet
- [ ] DNS confirmed, CDN warm
- [ ] Smoke test all 5 auction types on mainnet
- [ ] Smoke test NFT wrapper flow on mainnet

**Post-Launch (T+1 to T+7)**
- [ ] 24/7 monitoring active for first week
- [ ] Bug bounty program announced
- [ ] Community support channels staffed
- [ ] Performance metrics tracked daily
- [ ] User feedback collected and triaged

---

## Frontend Updates

### Network Switch

Update `lib/constants.js` to switch from testnet to mainnet:

```js
// Network configuration
export const NETWORK = 'mainnet';
export const RPC_ENDPOINT = 'https://api.explorer.provable.com/v1';
export const RPC_FALLBACK = 'https://mainnet.aleo.network';

// Mainnet program IDs (updated after deployment)
export const PROGRAMS = {
  AUCTION_V2: 'aloe_auction_v2.aleo',
  AUCTION_V3: 'aloe_auction_v3.aleo',
  NFT_AUCTION: 'aloe_nft_auction_v1.aleo',
};
```

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| OnboardingWizard | `components/OnboardingWizard.jsx` | Step-by-step guide for first-time users: (1) Connect wallet, (2) Explore auction types, (3) Create your first auction or place a bid. Shown once on first visit, dismissible. |
| AnalyticsDashboard | `components/AnalyticsDashboard.jsx` | Platform-wide metrics display: total auctions created, bids placed, credits volume, active auctions by type |
| NetworkBadge | `components/NetworkBadge.jsx` | Shows current network (Mainnet / Testnet) with color indicator in the header. Green = Mainnet, Yellow = Testnet. |
| FooterLinks | `components/FooterLinks.jsx` | Footer with links: Docs, Integration Guide, SDK, Bug Bounty, GitHub |

### New Page: `/analytics`

Platform-wide analytics page showing:

| Metric | Source | Display |
|--------|--------|---------|
| Total auctions created | Query `auctions` mapping size via RPC | Counter card |
| Auctions by type | Aggregate from on-chain data | Pie chart (First-Price / Vickrey / Dutch / Reverse / Batch) |
| Total credits volume | Sum of all winning_bid values from settled auctions | Counter card with credits symbol |
| Active auctions | Count of auctions with status=1 (CommitPhase) or status=2 (RevealPhase) | Counter card |
| Unique participants | Estimated from bid counts and settlement data | Counter card |
| Auction type popularity | Count by auction_type across all auctions | Bar chart |

**Data source:** All metrics derived from on-chain mapping queries via `lib/aleoReader.js`. No centralized backend or database — fully decentralized analytics.

---

## SDK Publication

### `aloe-sdk` npm Release

| Item | Detail |
|------|--------|
| Package name | `aloe-sdk` |
| Version | `1.0.0` |
| Registry | npm public registry |
| TypeScript | Full type definitions included |
| Documentation | README + API reference + example integrations |
| License | MIT |

### SDK Mainnet Configuration

```typescript
import { AloeClient } from 'aloe-sdk';

const aloe = new AloeClient({
  wallet: walletAdapter,
  network: 'mainnet',  // Switches to mainnet RPC and program IDs
});
```

---

## Infrastructure

### Deployment Stack

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js hosting with edge functions |
| CDN | Vercel Edge Network | Static asset distribution |
| RPC (primary) | Aleo Mainnet node | Primary blockchain access |
| RPC (fallback) | Secondary node | Failover if primary is down |
| Error Tracking | Sentry | Runtime error capture and alerting |
| Uptime Monitoring | Vercel / UptimeRobot | Ping-based uptime checks |

### Monitoring Alerts

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| RPC response latency | > 3 seconds average over 5 minutes | Switch to fallback RPC |
| Frontend error rate | > 1% of page loads | Investigate in Sentry |
| Transaction failure rate | > 5% over 15 minutes | Check contract state, alert team |
| Uptime | Any downtime > 1 minute | Immediate alert to team |

---

## Bug Bounty Program

| Severity | Reward | Examples |
|----------|--------|----------|
| Critical | Up to 10,000 credits | Value extraction, unauthorized credit transfers, commitment forgery, bypass of sealed-bid privacy |
| High | Up to 5,000 credits | Access control bypass, double-claim, timing manipulation, deposit theft |
| Medium | Up to 1,000 credits | Information leakage (bid amount inference), griefing attacks, UI spoofing |
| Low | Up to 250 credits | Minor UX issues, non-critical edge cases, documentation errors |

**Scope:** All 3 deployed programs + frontend application + `aloe-sdk` package.

**Out of scope:** Social engineering, physical attacks, issues in third-party dependencies (credits.aleo, wallet adapters).

**Reporting:** Dedicated channel with 48-hour response SLA and 7-day remediation SLA for critical findings.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Production privacy | All privacy guarantees validated on mainnet with real credits at stake |
| No data collection | Frontend collects zero PII — wallet address only used client-side for transaction signing |
| Open source | All contract code published on GitHub for community verification |
| Privacy model documentation | User-facing page explaining what's private and what's public for each auction type |
| Bug bounty privacy focus | Specific rewards for privacy-breaking vulnerabilities (bid amount inference, address linkage) |

**Privacy Score:** Complete — All privacy features live on mainnet. The bug bounty specifically incentivizes finding privacy weaknesses.

---

## Testing Checklist

### Mainnet Verification
- [ ] All 3 programs deploy successfully to Aleo Mainnet
- [ ] Each program responds correctly to transition calls on mainnet
- [ ] Transactions confirm in expected time (< 30 seconds)
- [ ] Fee estimates accurate for all transition types
- [ ] Explorer shows correct program data for all 3 programs

### Mainnet Smoke Tests (All Auction Types)
- [ ] First-Price: Create → Bid (private credits) → Reveal → Settle → Refund
- [ ] Vickrey: Create → Bid → Reveal → Settle (2nd-highest price) → Winner refunded excess → Losers refunded
- [ ] Dutch: Create → Price decreases → Buy at current price → Immediate settlement
- [ ] Reverse: Create (max budget) → Sellers bid → Reveal → Lowest wins → Payment
- [ ] Batch: Create (total units) → Bids with quantity+price → Reveal → Clearing price → Uniform payment
- [ ] NFT Wrapper: Create via wrapper → Bid → Reveal → Settle → Metadata on-chain

### Frontend on Mainnet
- [ ] Network switch works (testnet → mainnet)
- [ ] NetworkBadge shows "Mainnet" in green
- [ ] OnboardingWizard displays for first-time visitors
- [ ] Analytics page loads with real mainnet data
- [ ] All forms submit transactions to mainnet programs
- [ ] SDK works with mainnet configuration

### Infrastructure
- [ ] CDN serving frontend correctly
- [ ] RPC primary and fallback both responsive
- [ ] Sentry capturing errors (test with intentional error)
- [ ] Uptime monitoring active and alerting

---

## Success Metrics

### Launch Day Targets

| Metric | Target |
|--------|--------|
| Programs deployed | 3/3 |
| Smoke tests passing | All 6 auction type flows + NFT wrapper |
| Uptime | 99.9% |
| Critical bugs | 0 |

### 30-Day Targets

| Metric | Target |
|--------|--------|
| Auctions created (all types) | 500 |
| Unique connected wallets | 1,000 |
| Platform credits volume | 500,000 credits |
| SDK npm downloads | 100 |
| Uptime | 99.9% |
| Critical bugs | 0 |

---

## Post-Launch Roadmap

### Q3 2026
- Additional auction types exploration (combinatorial, multi-attribute)
- Mobile-responsive optimization
- SDK v2 with React hooks (`useAloeAuction`, `useAloeBid`)
- Additional wrapper programs (procurement, real estate, token launch)

### Q4 2026
- Cross-chain bridge exploration (bridge auctions to other L1s)
- Advanced analytics and reporting
- Partner integrations (other Aleo dApps importing the primitive)
- White-label solution for enterprise auction platforms

### 2027+
- Governance token consideration
- Multi-chain expansion
- Recursive proof optimizations for faster settlement
- Institutional partnerships for regulated auction markets

---

## Final Architecture (Post Wave 10)

```
contracts/
  zkauction/           → aloe_auction_v2.aleo  (first-price, privacy-fixed)
  zkauction_v3/        → aloe_auction_v3.aleo  (vickrey, dutch, reverse, batch, gated)
  demo_nft_auction/    → aloe_nft_auction_v1.aleo  (composability demo)

lib/
  aleo.js              → Transaction builders for v2 (create, bid, reveal, settle, refund, cancel)
  auctionV3.js         → Transaction builders for v3 (all 5 types + gated)
  aleoReader.js        → On-chain state reader (query mappings via REST API)
  constants.js         → Auction types, status enums, network config, use cases
  nftMetadata.js       → NFT metadata lookup (off-chain)

store/
  auctionStore.js      → Zustand store for all auction state

pages/
  index.js             → Landing page: "Auction primitive" + use-case showcase + dev section
  dashboard.js         → Classic auction interface (all types)
  create.js            → Create auction (all types via AuctionTypeSelector)
  nft.js               → NFT auction skin
  procurement.js       → Procurement/RFQ skin
  analytics.js         → Platform metrics

components/
  AuctionCard, AuctionList, BidDialog          → Core auction UI
  RevealBidDialog, AuctionTimer                → Lifecycle components
  AuctionTypeSelector                          → Type picker (5 types)
  VickreyBadge, VickreyExplainer              → Vickrey-specific
  DutchPriceTicker, DutchBuyButton            → Dutch-specific
  ReverseAuctionForm, ReverseAuctionCard      → Reverse-specific
  BatchAuctionForm, BatchBidDialog            → Batch-specific
  NFTAuctionCard, NFTBidDialog                → NFT skin
  ProcurementCard, SupplierBidDialog          → Procurement skin
  GatedAuctionBadge, BadgeRequirementSelector → Gated auctions
  ErrorBoundary, TransactionStatus            → Error handling
  OnboardingWizard, AnalyticsDashboard        → Mainnet features
  NetworkBadge, FooterLinks                   → Infrastructure UI

packages/
  aloe-sdk/            → npm package for developers
```

---

*Wave 10 Target Completion: June 9, 2026*
