# Wave 10: Mainnet Launch

**Timeline:** May 26 - June 9, 2026
**Theme:** Production Deployment
**Status:** Planned

---

## Overview

Wave 10 is the final wave: **deploy all 7 programs to Aleo Mainnet**, switch the frontend to mainnet, add platform analytics, and launch the bug bounty program. This transitions Aloe from a testnet buildathon project to a production privacy exchange.

---

## Contract Deployment

### Programs to Deploy

All 7 programs deployed to Aleo Mainnet in dependency order:

| # | Program | Module | Dependencies |
|---|---------|--------|--------------|
| 1 | `aloe_reputation_v1.aleo` | ZK Reputation | `credits.aleo` |
| 2 | `aloe_auction_v2.aleo` | Auctions (first-price) | `credits.aleo`, `aloe_reputation_v1.aleo` |
| 3 | `aloe_auction_v3.aleo` | Auctions (Vickrey + Dutch) | `credits.aleo`, `aloe_reputation_v1.aleo` |
| 4 | `aloe_otc_v1.aleo` | OTC Trading | `credits.aleo`, `aloe_reputation_v1.aleo` |
| 5 | `aloe_launches_v1.aleo` | Token Launches | `credits.aleo`, `aloe_reputation_v1.aleo` |
| 6 | `aloe_nft_v1.aleo` | NFT Marketplace | `credits.aleo`, `aloe_reputation_v1.aleo` |
| 7 | `aloe_rwa_v1.aleo` | RWA Exchange | `credits.aleo`, `aloe_reputation_v1.aleo` |

### Deployment Checklist

**Pre-Launch (T-7 days)**
- [ ] Final security audit sign-off (Wave 9 complete, 0 critical/high)
- [ ] Contract code freeze — no changes after this point
- [ ] Mainnet RPC endpoints configured (primary + fallback)
- [ ] Monitoring dashboards live
- [ ] Incident response plan documented and team assigned
- [ ] All deployment transactions prepared and tested on testnet

**Launch Day (T-0)**
- [ ] Deploy all 7 programs to Aleo Mainnet in order
- [ ] Verify each deployment transaction is confirmed
- [ ] Update frontend constants to mainnet program IDs
- [ ] Switch network configuration from testnet to mainnet
- [ ] DNS confirmed, CDN warm, load balancer healthy
- [ ] Smoke test all 5 modules on mainnet

**Post-Launch (T+1 to T+7)**
- [ ] 24/7 monitoring active for first week
- [ ] Bug bounty program announced
- [ ] Community support channels staffed
- [ ] Performance metrics tracked daily
- [ ] User feedback collected and triaged

---

## Frontend Updates

### Network Switch

Update `lib/constants.js` to switch all program IDs and network configuration from testnet to mainnet. Add mainnet RPC endpoint URLs and fallback endpoints.

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| AnalyticsDashboard | `components/AnalyticsDashboard.jsx` | Platform-wide metrics display: total auctions, deals, volume, users |
| OnboardingWizard | `components/OnboardingWizard.jsx` | Step-by-step guide for first-time users: connect wallet → explore modules → create first item |
| FooterLinks | `components/FooterLinks.jsx` | Footer with links to docs, support, bug bounty, and social channels |
| NetworkBadge | `components/NetworkBadge.jsx` | Shows current network (Mainnet / Testnet) with color indicator |

### New Page (`pages/analytics.js`)

Platform-wide analytics page showing:
- Total auctions created (all types)
- Total OTC deals completed
- Total launch participants
- Total NFT listings
- Total RWA assets registered
- Platform volume in credits
- Unique connected wallets
- Module-by-module breakdown charts

---

## Infrastructure

### Deployment Stack

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js hosting with edge functions |
| CDN | Vercel Edge Network | Static asset distribution |
| RPC | Aleo Mainnet nodes | Primary + fallback blockchain access |
| Monitoring | Vercel Analytics + custom | Performance and error tracking |
| Error Tracking | Sentry (or similar) | Runtime error capture and alerting |

### Monitoring Alerts

| Metric | Alert Threshold |
|--------|-----------------|
| Transaction failure rate | > 5% over 15 minutes |
| RPC response latency | > 2 seconds average |
| Frontend error rate | > 1% of page loads |
| Uptime | Any downtime triggers immediate alert |

---

## Bug Bounty Program

| Severity | Reward | Examples |
|----------|--------|----------|
| Critical | Up to 10,000 credits | Value extraction, unauthorized transfers, commitment forgery |
| High | Up to 5,000 credits | Access control bypass, double-claim, timing manipulation |
| Medium | Up to 1,000 credits | Information leakage, griefing attacks, UI spoofing |
| Low | Up to 250 credits | Minor UX issues, non-critical edge cases |

**Scope:** All 7 deployed programs + frontend application. Reports submitted via dedicated channel.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Production privacy | All privacy guarantees validated on real mainnet with real stakes |
| No data collection | Frontend collects no PII — wallet address only used client-side |
| Open source | All contract code published for community verification |
| Privacy documentation | User-facing explanations for each module's privacy model |
| Mainnet validation | Privacy properties proven at scale with real users |

**Privacy Score:** Complete — All privacy features live on mainnet.

---

## Testing Checklist

### Mainnet Verification
- [ ] All 7 programs respond correctly on mainnet
- [ ] Transactions confirm in expected time
- [ ] Fee estimates accurate for all transition types
- [ ] Explorer integration shows correct program data
- [ ] Wallet connections stable (Leo + Shield)

### User Journeys (Mainnet Smoke Tests)
- [ ] Auction: Create → Bid → Reveal → Settle → Refund
- [ ] OTC: Create Deal → Accept Deal
- [ ] Launch: Create → Commit → Settle → Claim
- [ ] NFT: Create Listing → Bid → Reveal → Settle (and Buy Now)
- [ ] RWA: Register Asset → Purchase Units → Transfer Units
- [ ] Reputation: Complete activity → Claim Badge → Access Gated Item

### Analytics
- [ ] Analytics page loads with correct data
- [ ] Metrics update after new transactions
- [ ] Module breakdown accurate

---

## Success Metrics

### Launch Day Targets

| Metric | Target |
|--------|--------|
| Programs deployed | 7/7 |
| Smoke tests passing | All 6 user journeys |
| Uptime | 99.9% |
| Critical bugs | 0 |

### 30-Day Targets

| Metric | Target |
|--------|--------|
| Auctions created | 500 |
| OTC deals completed | 200 |
| Unique connected wallets | 1,000 |
| Platform volume | 500,000 credits |
| Uptime | 99.9% |
| Critical bugs | 0 |

---

## Post-Launch Roadmap

### Q3 2026
- Mobile-responsive optimization
- Additional auction types (reverse, combinatorial)
- Cross-chain bridge exploration
- Advanced analytics and reporting

### Q4 2026
- Governance token consideration
- Partner integrations and SDK
- Enterprise features
- White-label solution exploration

### 2027+
- Multi-chain expansion
- Institutional partnerships
- Advanced privacy features (recursive proofs, private governance)
- Ecosystem grants program

---

## Final Architecture (Post Wave 10)

**Smart Contracts (7 programs):**
- `contracts/zkauction/` → `aloe_auction_v2.aleo` (first-price sealed-bid)
- `contracts/zkauction_v3/` → `aloe_auction_v3.aleo` (Vickrey + Dutch)
- `contracts/zkotc/` → `aloe_otc_v1.aleo` (OTC trading)
- `contracts/zklaunches/` → `aloe_launches_v1.aleo` (token launches)
- `contracts/zknft/` → `aloe_nft_v1.aleo` (NFT marketplace)
- `contracts/zkrwa/` → `aloe_rwa_v1.aleo` (RWA exchange)
- `contracts/zkreputation/` → `aloe_reputation_v1.aleo` (ZK reputation)

**Stores (7 stores):**
- `store/auctionStore.js` | `store/dealStore.js` | `store/launchStore.js`
- `store/nftStore.js` | `store/rwaStore.js` | `store/reputationStore.js` | `store/activityStore.js`

**Lib (7 files):**
- `lib/aleo.js` | `lib/otc.js` | `lib/launches.js` | `lib/nft.js`
- `lib/rwa.js` | `lib/reputation.js` | `lib/constants.js`

**Pages (10 pages):**
- `pages/index.js` | `pages/dashboard.js` | `pages/create.js`
- `pages/otc.js` | `pages/launches.js` | `pages/nft.js` | `pages/rwa.js`
- `pages/reputation.js` | `pages/my-activity.js` | `pages/analytics.js`

---

*Wave 10 Target Completion: June 9, 2026*
