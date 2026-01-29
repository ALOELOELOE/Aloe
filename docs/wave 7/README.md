# Wave 7: Private Identity & Reputation

**Timeline:** April 14 - April 28, 2026
**Theme:** Zero-Knowledge Reputation
**Status:** Planned

---

## Overview

Wave 7 introduces a privacy-preserving reputation system using zero-knowledge proofs. Users can prove their auction history (successful bids, payments, reliability) without revealing their full transaction history or wallet address.

---

## Smart Contract

### Reputation Records

```leo
record ReputationBadge {
    owner: address,
    badge_type: u8,               // Type of achievement
    earned_at: u32,               // Block height when earned
    auction_count: u32,           // Anonymized count
    proof_hash: field,            // ZK proof of eligibility
}

// Badge types
const BADGE_VERIFIED_BIDDER: u8 = 1u8;    // Completed 5+ auctions
const BADGE_TRUSTED_SELLER: u8 = 2u8;     // 10+ successful sales
const BADGE_WHALE: u8 = 3u8;              // Total volume > threshold
const BADGE_EARLY_ADOPTER: u8 = 4u8;      // First 100 users
const BADGE_RELIABLE: u8 = 5u8;           // 100% reveal rate
```

### Reputation Structs

```leo
struct ReputationProof {
    badge_type: u8,
    threshold_met: bool,
    proof_commitment: field,
}

struct AnonStats {
    auctions_participated: u32,
    auctions_won: u32,
    reveal_rate_percent: u8,      // 0-100
    volume_tier: u8,              // 0-5 scale
}
```

### New Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `claim_badge` | Private | Claim reputation badge with ZK proof |
| `verify_badge` | Public | Verify badge validity without revealing owner |
| `attach_badge` | Private | Attach badge to auction for credibility |
| `prove_reputation` | Private | Generate proof of reputation threshold |

### Badge Claim Flow

```leo
async transition claim_badge(
    private activity_records: [AuctionRecord; 10],
    public badge_type: u8,
) -> (ReputationBadge, Future) {
    // Verify activity meets badge requirements
    let count: u32 = count_valid_records(activity_records);
    let threshold: u32 = get_threshold(badge_type);
    assert(count >= threshold);

    // Generate proof hash
    let proof_hash: field = BHP256::hash_to_field((self.caller, badge_type, count));

    let badge: ReputationBadge = ReputationBadge {
        owner: self.caller,
        badge_type: badge_type,
        earned_at: block.height,
        auction_count: count,
        proof_hash: proof_hash,
    };

    return (badge, finalize_claim_badge(proof_hash, badge_type));
}
```

### Reputation Verification

```leo
// Verify reputation without revealing identity
async transition verify_reputation(
    private badge: ReputationBadge,
    public required_type: u8,
    public required_count: u32,
) -> bool {
    // Check badge meets requirements
    assert(badge.badge_type >= required_type);
    assert(badge.auction_count >= required_count);
    return true;
}
```

---

## Frontend

### New Components

| Component | Description |
|-----------|-------------|
| `ReputationDashboard.jsx` | View earned badges and stats |
| `BadgeDisplay.jsx` | Visual badge with tooltip |
| `ClaimBadgeButton.jsx` | Claim earned badges |
| `ReputationProof.jsx` | Generate/verify reputation proofs |
| `TrustIndicator.jsx` | Show seller/bidder trustworthiness |
| `AnonStatsCard.jsx` | Display anonymized statistics |
| `BadgeRequirements.jsx` | Show requirements for each badge |

### Badge System UI

1. **Badge Gallery**
   - All available badges with requirements
   - Progress toward unclaimed badges
   - Claimed badges with earn date

2. **Profile Reputation**
   - Badge display on user profile
   - Anonymized stats (tier-based, not exact)
   - Trust score indicator

3. **Auction Integration**
   - Seller badges on auction cards
   - "Verified Seller" indicator
   - Bidder reputation requirements (optional)

### Trust Indicators

```
Reputation Tiers:
⭐         New user (< 5 auctions)
⭐⭐       Established (5-20 auctions)
⭐⭐⭐     Trusted (20-50 auctions)
⭐⭐⭐⭐   Expert (50-100 auctions)
⭐⭐⭐⭐⭐  Elite (100+ auctions)
```

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Anonymous badges | Prove reputation without revealing identity |
| ZK proofs | Verify thresholds without exposing exact counts |
| Unlinkable history | Past auctions not connected to current activity |
| Tiered disclosure | Show tier (e.g., "50+") not exact number |
| Selective proving | Choose which reputation aspects to reveal |

**Privacy Score Contribution:** Very High — This is a flagship privacy feature demonstrating Aleo's ZK capabilities.

---

## Testing Checklist

### Badge Claiming
- [ ] Can claim badge when threshold met
- [ ] Cannot claim badge below threshold
- [ ] Badge records correct count
- [ ] Proof hash generated correctly
- [ ] Cannot claim same badge twice

### Badge Verification
- [ ] Valid badges verify successfully
- [ ] Invalid badges rejected
- [ ] Verification doesn't reveal owner
- [ ] Works across different badge types

### Auction Integration
- [ ] Seller badges display on auctions
- [ ] Can require minimum reputation to bid
- [ ] Reputation filters work
- [ ] Trust indicators accurate

### Privacy Tests
- [ ] Cannot link badges to transaction history
- [ ] Tier display (not exact counts)
- [ ] Proofs don't leak information
- [ ] Multiple badges unlinkable

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Badge types | 5+ badge types available |
| Claim success | 100% eligible users can claim |
| Verification speed | < 2 seconds |
| Privacy preservation | Zero information leakage |
| User adoption | 50%+ active users have 1+ badge |

---

## Badge Catalog

| Badge | Requirement | Display |
|-------|-------------|---------|
| 🌱 First Auction | Complete first auction | "New Member" |
| ✅ Verified Bidder | 5+ successful bids | "Verified" |
| 🏆 Winner | 10+ auctions won | "Frequent Winner" |
| 💎 Trusted Seller | 10+ successful sales | "Trusted Seller" |
| 🐋 High Volume | > 10,000 credits volume | "Whale" |
| ⚡ Reliable | 100% reveal rate (20+ bids) | "Always Reveals" |
| 🌟 Early Adopter | First 100 users | "Pioneer" |
| 🔒 Privacy Advocate | Used private features | "Privacy Pro" |

---

## ZK Reputation Proofs

### Proof Types

1. **Threshold Proof**
   - "I have completed at least N auctions"
   - Doesn't reveal exact count

2. **Range Proof**
   - "My total volume is between X and Y"
   - Reveals tier, not amount

3. **Rate Proof**
   - "My reveal rate is above 95%"
   - Binary yes/no

4. **Recency Proof**
   - "I was active in the last 30 days"
   - Doesn't reveal specific activity

### Use Cases

- **Gated Auctions**: "Only users with 10+ completed auctions can bid"
- **Trust Display**: "This seller has Trusted Seller badge"
- **Whale Rooms**: "Minimum 10,000 credit volume to enter"
- **Reliability Filter**: "Only show sellers with 95%+ completion rate"

---

## Future Extensions

- Cross-platform reputation (other Aleo apps)
- Reputation delegation (vouch for others)
- Time-decaying reputation
- Dispute resolution integration
- Reputation NFTs (tradeable?)

---

*Wave 7 Target Completion: April 28, 2026*
