# Wave 8: ZK Reputation & Gated Access

**Timeline:** April 28 - May 12, 2026
**Theme:** Zero-Knowledge Reputation
**Status:** Planned

---

## Overview

Wave 8 introduces a **privacy-preserving reputation system** that works across all 5 Aloe modules. Users earn private badges by reaching activity thresholds, then prove their reputation without revealing their identity or exact history. This enables **gated access** — auctioneers, deal makers, and issuers can require reputation badges for participation.

The core ZK innovation: a user can prove "I have completed 10+ auctions" without revealing which auctions, their bid amounts, or their wallet address. Badges are private records — only the holder sees them.

---

## Smart Contract

### Program: `aloe_reputation_v1.aleo`

**Location:** `contracts/zkreputation/src/main.leo`

### Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Record | `ReputationBadge` | `owner`, `badge_type` (u8), `earned_at` (block height), `activity_count` (u32), `proof_hash` | Private badge record. Only the holder sees it. The `proof_hash` commits to the badge's legitimacy without revealing details. |

### Badge Type Constants

| Value | Badge | Threshold | Description |
|-------|-------|-----------|-------------|
| `1u8` | Verified Bidder | 5+ completed auctions | Basic participation proof |
| `2u8` | Trusted Seller | 10+ successful sales | Seller reliability proof |
| `3u8` | High Volume | 10,000+ credits volume | Volume tier proof |
| `4u8` | Early Adopter | First 100 users | Early participation proof |

### Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `record_activity` | Public | Called by other Aloe programs (auctions, OTC, etc.) after a successful transaction. Increments the activity count for the actor in the `activity_count` mapping. This is a cross-program call invoked automatically during settlement/acceptance. |
| `claim_badge` | Private + Public | User claims a badge when their activity meets the threshold. Takes `badge_type` and `activity_count` as inputs. Finalize verifies the count meets the threshold for the requested badge type, and that the badge hasn't already been claimed. Returns a private `ReputationBadge` record. The `proof_hash` is generated as BHP256(caller, badge_type, count). |
| `create_gated_auction` | Public | Extension to auction programs. When creating an auction/deal/listing, the creator can specify a required badge_type. Finalize stores the gate requirement alongside the item metadata. |
| `verify_badge_for_access` | Private | Participant proves they hold the required badge to participate in a gated item. Consumes and re-creates the badge (to prevent double-use in the same transaction) while proving the badge_type meets the requirement. No identity is revealed. |

### Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `activity_count` | `address => u32` | User address → total activity count across modules |
| `badge_claimed` | `field => bool` | hash(address, badge_type) → whether badge has been claimed |

### Cross-Program Integration

The `record_activity` transition is called by other Aloe programs during their settlement/acceptance finalize functions. For example, `aloe_auction_v2.aleo/finalize_settle_auction` would call `aloe_reputation_v1.aleo/record_activity` for both the winner and auctioneer. This requires importing `aloe_reputation_v1.aleo` in each module's program.

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| ReputationDashboard | `components/ReputationDashboard.jsx` | View earned badges, progress toward unclaimed badges, and activity stats |
| BadgeCard | `components/BadgeCard.jsx` | Visual badge display with type icon, name, earned date, and tier |
| ClaimBadgeButton | `components/ClaimBadgeButton.jsx` | Button to claim a badge when threshold is met — shows progress if not yet eligible |
| TrustIndicator | `components/TrustIndicator.jsx` | Small badge icon shown on auction cards and deal cards indicating seller/maker reputation |
| GatedAuctionForm | `components/GatedAuctionForm.jsx` | Extension to create forms allowing creators to set badge requirements |
| AccessRequirementBadge | `components/AccessRequirementBadge.jsx` | Visual indicator on cards showing what badge is required to participate |

### New Store (`store/reputationStore.js`)

Zustand store with state fields (`badges`, `activityCount`, `isClaiming`) and actions (`fetchBadges`, `fetchActivityCount`, `claimBadge`, `hasBadge(type)`, `getProgress(type)`).

### New Page (`pages/reputation.js`)

Dedicated reputation page showing:
- Badge gallery with all available badge types
- Progress bars for unclaimed badges
- Earned badges with earn date
- Activity count breakdown by module

### Constants Update (`lib/constants.js`)

Add `REPUTATION: "aloe_reputation_v1.aleo"` to `PROGRAMS`. Add `BADGE_TYPES` enum and `BADGE_LABELS` / `BADGE_THRESHOLDS` for display and validation.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Private badges | ReputationBadge records are encrypted — only the holder sees them |
| ZK threshold proofs | Prove "I completed 10+ auctions" without revealing which ones |
| Unlinkable identity | Badge verification doesn't reveal the wallet address |
| Activity aggregation | Only total count is tracked — individual actions not stored |
| Selective disclosure | User chooses which badges to present for access |

**Privacy Score:** Very High — Flagship ZK feature demonstrating Aleo's capability for anonymous reputation.

---

## Testing Checklist

### Activity Recording
- [ ] Activity count increments after auction settlement
- [ ] Activity count increments after OTC deal acceptance
- [ ] Activity count increments after launch claim
- [ ] Cross-program calls work correctly
- [ ] Count is accurate across modules

### Badge Claiming
- [ ] Can claim badge when threshold is met
- [ ] Cannot claim badge below threshold
- [ ] Cannot claim same badge twice
- [ ] Badge record has correct fields
- [ ] proof_hash generated correctly

### Gated Access
- [ ] Can create a gated auction requiring a specific badge
- [ ] Users with the required badge can participate
- [ ] Users without the required badge are rejected
- [ ] Badge verification doesn't reveal identity
- [ ] Works across all module types (auction, OTC, launch, NFT, RWA)

### Privacy Tests
- [ ] Badge records are private (not visible on explorer)
- [ ] Activity count is private
- [ ] Badge verification doesn't link to past transactions
- [ ] Multiple badges from same user are unlinkable

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Badge types | 4 badge types fully functional |
| Cross-program calls | Activity recorded from all 5 modules |
| Claim success | 100% of eligible users can claim badges |
| Gated access | Badge verification working for all module types |
| Privacy preservation | Zero information leakage during verification |

---

## Demo Scenarios

1. **Badge Earning**: User completes 5 auctions → Activity count reaches 5 → Claims "Verified Bidder" badge → Badge appears in reputation dashboard
2. **Gated Auction**: Auctioneer creates auction requiring "Trusted Seller" badge → User with badge can bid → User without badge is rejected
3. **Multi-Badge**: User earns both "Verified Bidder" and "High Volume" → Both displayed on reputation page → Can access gates requiring either

---

*Wave 8 Target Completion: May 12, 2026*
