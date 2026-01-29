# Wave 8: Private Auctions

**Timeline:** April 28 - May 12, 2026
**Theme:** Exclusive & Gated Access
**Status:** Planned

---

## Overview

Wave 8 introduces private and gated auctions that restrict participation based on various criteria: invite-only access, token-gated entry, reputation requirements, and allowlist-based participation. This enables exclusive sales, VIP auctions, and community-specific events.

---

## Smart Contract

### Access Control Structs

```leo
struct AuctionAccess {
    access_type: u8,              // Type of access control
    gate_token: field,            // Token ID for token-gating (if applicable)
    gate_amount: u64,             // Minimum token balance required
    reputation_badge: u8,         // Required badge type (if applicable)
    allowlist_root: field,        // Merkle root of allowed addresses
    max_participants: u32,        // Maximum number of bidders
}

// Access type constants
const ACCESS_PUBLIC: u8 = 0u8;           // Anyone can bid
const ACCESS_INVITE: u8 = 1u8;           // Invite code required
const ACCESS_TOKEN_GATE: u8 = 2u8;       // Must hold token
const ACCESS_REPUTATION: u8 = 3u8;       // Must have badge
const ACCESS_ALLOWLIST: u8 = 4u8;        // Must be on list
const ACCESS_COMBINED: u8 = 5u8;         // Multiple requirements
```

### Invite Records

```leo
record AuctionInvite {
    owner: address,
    auction_id: field,
    invite_code: field,           // Unique invite code
    uses_remaining: u8,           // How many times can be used
    expires_at: u32,              // Block height expiration
}

record InviteUsed {
    owner: address,
    auction_id: field,
    invite_code: field,
    used_at: u32,
}
```

### New Mappings

```leo
mapping auction_access: field => AuctionAccess;
mapping invite_codes: field => bool;              // invite_code => valid
mapping participant_count: field => u32;          // auction_id => count
mapping allowlist_proofs: field => bool;          // proof_hash => verified
```

### New Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_private_auction` | Private | Create auction with access controls |
| `generate_invites` | Private | Generate invite codes for auction |
| `redeem_invite` | Private | Use invite to gain auction access |
| `verify_token_gate` | Private | Prove token ownership for access |
| `verify_allowlist` | Private | Prove membership via Merkle proof |
| `place_gated_bid` | Private | Bid with access proof |

### Invite System

```leo
async transition generate_invites(
    public auction_id: field,
    private count: u8,
    private uses_per_invite: u8,
    private expires_in_blocks: u32,
) -> [AuctionInvite; 10] {
    // Verify caller is auctioneer
    // Generate unique invite codes
    let invites: [AuctionInvite; 10] = [];
    for i: u8 in 0u8..count {
        let code: field = BHP256::hash_to_field((auction_id, self.caller, i, block.height));
        invites[i] = AuctionInvite {
            owner: self.caller,  // Auctioneer distributes these
            auction_id: auction_id,
            invite_code: code,
            uses_remaining: uses_per_invite,
            expires_at: block.height + expires_in_blocks,
        };
    }
    return invites;
}
```

### Token Gate Verification

```leo
async transition verify_token_gate(
    public auction_id: field,
    private token_record: Token,
) -> Future {
    let access: AuctionAccess = Mapping::get(auction_access, auction_id);
    assert(access.access_type == 2u8 || access.access_type == 5u8);

    // Verify token matches gate requirements
    assert(token_record.token_id == access.gate_token);
    assert(token_record.amount >= access.gate_amount);

    // Record access (without revealing holder)
    return finalize_token_gate_access(auction_id, self.caller);
}
```

### Merkle Allowlist

```leo
async transition verify_allowlist(
    public auction_id: field,
    private merkle_proof: [field; 20],
    private leaf_index: u32,
) -> Future {
    let access: AuctionAccess = Mapping::get(auction_access, auction_id);

    // Verify Merkle proof
    let leaf: field = BHP256::hash_to_field(self.caller);
    let computed_root: field = compute_merkle_root(leaf, merkle_proof, leaf_index);
    assert(computed_root == access.allowlist_root);

    return finalize_allowlist_access(auction_id, self.caller);
}
```

---

## Frontend

### New Components

| Component | Description |
|-----------|-------------|
| `PrivateAuctionForm.jsx` | Create auction with access settings |
| `AccessTypeSelector.jsx` | Choose access control method |
| `InviteManager.jsx` | Generate and distribute invites |
| `InviteRedemption.jsx` | Enter invite code to gain access |
| `TokenGateChecker.jsx` | Verify token holdings |
| `AllowlistUploader.jsx` | Upload CSV of allowed addresses |
| `AccessBadge.jsx` | Shows access type on auction cards |
| `GatedBidForm.jsx` | Bid form with access verification |

### Access Control UI

1. **Create Private Auction**
   - Access type selection
   - Type-specific configuration:
     - Invite: Number of invites, uses per invite
     - Token Gate: Token selection, minimum amount
     - Reputation: Required badge type
     - Allowlist: CSV upload or manual entry

2. **Invite Management**
   - Generate invite links/codes
   - Track invite usage
   - Revoke unused invites
   - Invite expiration settings

3. **Bidder Experience**
   - Clear indication of access requirements
   - Step-by-step verification flow
   - Access status indicator
   - "Request Access" for invite-only

### Auction Discovery

- Filter by access type (Public / Gated)
- "Auctions I Can Access" view
- Token-gated section (shows required holdings)
- Community auctions (allowlist-based)

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Private invites | Invite codes are private records |
| Anonymous token verification | Prove holdings without revealing balance |
| ZK allowlist proofs | Prove membership without revealing position |
| Hidden participant list | Cannot see who has access |
| Private access verification | Access checks done via ZK proofs |

**Privacy Score Contribution:** Very High — Enables private communities and exclusive sales without exposing membership.

---

## Testing Checklist

### Invite System
- [ ] Auctioneer can generate invites
- [ ] Invites are transferable records
- [ ] Invite redemption grants access
- [ ] Used invites cannot be reused
- [ ] Expired invites rejected
- [ ] Max uses enforced

### Token Gating
- [ ] Can verify token ownership
- [ ] Minimum balance enforced
- [ ] Works with multiple token types
- [ ] Access persists for auction duration
- [ ] Cannot fake token ownership

### Allowlist
- [ ] Merkle root correctly stored
- [ ] Valid proofs accepted
- [ ] Invalid proofs rejected
- [ ] Large allowlists supported (10k+)
- [ ] Cannot brute-force membership

### Reputation Gating
- [ ] Required badges enforced
- [ ] Multiple badge types work
- [ ] Badge verification is private

### Combined Access
- [ ] Multiple requirements enforced
- [ ] All conditions must be met
- [ ] Clear error messages

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Access types | 5 types fully functional |
| Invite generation | Up to 100 invites per auction |
| Allowlist size | Support 10,000+ addresses |
| Token gate tokens | All ARC-20 tokens supported |
| Access verification | < 3 seconds |

---

## Use Cases

### Invite-Only: VIP Art Sale
> "Exclusive NFT drop for collectors. Generate 50 invites, distribute to top collectors."

### Token-Gated: Community Auction
> "Only ALOE token holders (min 100 tokens) can participate in governance asset auction."

### Reputation-Gated: Trusted Sellers Only
> "This procurement auction is limited to vendors with 'Trusted Seller' badge."

### Allowlist: Team Allocation
> "Internal token sale. Only team addresses on the allowlist can bid."

### Combined: Exclusive + Verified
> "Must hold 1000 ALOE tokens AND have 'Verified Bidder' badge to participate."

---

## Invite Distribution Channels

### Direct Transfer
- Send invite record directly to address

### Shareable Links
- Generate link with encrypted invite code
- Recipient claims invite via link

### QR Codes
- Generate QR for in-person events
- Scan to claim access

### Social Integration
- Share via Discord/Telegram
- Integration with community tools

---

## Security Considerations

### Invite Security
- Cryptographic invite codes (not guessable)
- Use limits prevent abuse
- Expiration for time-sensitive access

### Sybil Resistance
- Max participants limit
- Reputation requirements
- Token staking option

### Privacy Protection
- Access verification via ZK proofs
- Participant list never exposed
- Cannot enumerate who has access

---

*Wave 8 Target Completion: May 12, 2026*
