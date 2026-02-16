# Wave 2: Complete Auction Lifecycle

**Timeline:** February 3 - February 17, 2026
**Theme:** Reveal, Settle, Refund
**Status:** In Progress

---

## Overview

Wave 2 completes the core auction lifecycle by implementing the reveal phase, auction settlement, and refund mechanisms. After this wave, Aloe will support a full end-to-end sealed-bid auction flow from creation to settlement.

---

## Smart Contract

### credits.aleo Impact

> **Important:** As of Wave 1 post-updates, `place_bid` now transfers real credits into escrow via `credits.aleo/transfer_public_as_signer`. This means Wave 2's `claim_refund` and `settle_auction` transitions must handle **actual credit transfers** back to users — not just mapping updates. `claim_refund` should call `credits.aleo/transfer_public` to return deposits to losing bidders, and `settle_auction` should transfer the winning bid to the auctioneer.

### New Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `reveal_bid` | Private → Public | Bidder reveals bid amount and salt, contract verifies commitment hash |
| `settle_auction` | Public | Determines winner, transfers winning bid to auctioneer via `credits.aleo` |
| `claim_refund` | Private | Non-winners reclaim their deposits via `credits.aleo` transfer |
| `cancel_auction` | Public | Auctioneer cancels auction if no bids received |

### New Mappings

```leo
mapping revealed_count: field => u32;      // auction_id => number of reveals
mapping highest_bid: field => u64;         // auction_id => current highest bid
mapping highest_bidder: field => address;  // auction_id => current highest bidder
mapping refund_claimed: field => bool;     // commitment => refund claimed
```

### reveal_bid Implementation

```leo
async transition reveal_bid(
    private bid_record: BidCommitment,
    private bid_amount: u64,
    private salt: field,
) -> Future {
    // Verify commitment matches: hash(bid_amount, salt, auction_id)
    let expected: field = BHP256::hash_to_field((bid_amount, salt, bid_record.auction_id));
    assert_eq(expected, bid_record.commitment);

    // Verify deposit covers bid
    assert(bid_record.deposit >= bid_amount);

    return finalize_reveal_bid(bid_record.auction_id, self.caller, bid_amount);
}
```

### settle_auction Implementation

```leo
async transition settle_auction(public auction_id: field) -> Future {
    return finalize_settle_auction(auction_id);
}

async function finalize_settle_auction(auction_id: field) {
    let auction: Auction = Mapping::get(auctions, auction_id);
    assert(block.height > auction.reveal_deadline);
    assert(auction.status != 2u8); // Not already settled

    let winner: address = Mapping::get(highest_bidder, auction_id);
    let winning_bid: u64 = Mapping::get(highest_bid, auction_id);

    // Update auction to settled status
    let settled: Auction = Auction { ...auction, status: 2u8, winner, winning_bid };
    Mapping::set(auctions, auction_id, settled);
}
```

---

## Frontend

### New Components

| Component | Description |
|-----------|-------------|
| `RevealBidDialog.jsx` | Modal for revealing bids with salt retrieval |
| `AuctionTimer.jsx` | Countdown timer showing phase transitions |
| `SettleAuctionButton.jsx` | Button to trigger auction settlement |
| `ClaimRefundButton.jsx` | Button for non-winners to claim deposits |
| `AuctionStatusBadge.jsx` | Visual indicator for auction phase |

### Salt Management

- Retrieve salt from `localStorage` using `auction_id` as key
- Display warning if salt not found
- Provide manual salt entry as fallback
- Show clear instructions for reveal process

### UI Updates

1. **Auction Detail Page**
   - Phase-aware action buttons (bid → reveal → settle)
   - Real-time countdown timer to phase transitions
   - Winner announcement after settlement

2. **My Bids Page**
   - List of user's active bid commitments
   - Status indicator: Committed / Revealed / Won / Refunded
   - One-click reveal for bids in reveal phase

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Commit-reveal completion | Bids remain hidden until reveal phase begins |
| Private reveal verification | Only bidder can reveal their own bid using their BidCommitment record |
| No bid linkage | Cannot correlate multiple bids from same address during commit phase |
| Selective disclosure | Only revealed bids become public; unrevealed bids remain private forever |

**Privacy Score Contribution:** High — This wave completes the core privacy mechanism that makes sealed-bid auctions trustworthy.

---

## Testing Checklist

### Reveal Bid
- [ ] Can reveal bid during reveal phase with correct salt
- [ ] Cannot reveal bid during commit phase
- [ ] Cannot reveal bid after reveal deadline
- [ ] Cannot reveal with wrong salt (hash mismatch fails)
- [ ] Cannot reveal with bid amount > deposit

### Settle Auction
- [ ] Can settle auction after reveal deadline
- [ ] Cannot settle auction before reveal deadline
- [ ] Correct winner determined (highest bid)
- [ ] Auction status updates to "Settled"
- [ ] Winner and winning bid stored correctly

### Claim Refund
- [ ] Non-winners can claim their full deposit
- [ ] Winners cannot claim refund
- [ ] Cannot claim refund twice
- [ ] Cannot claim refund for unrevealed bid (deposit forfeited)

### Cancel Auction
- [ ] Auctioneer can cancel if no bids received
- [ ] Cannot cancel auction with existing bids
- [ ] Cannot cancel after commit phase ends

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Full auction cycle | Create → Bid → Reveal → Settle working |
| Refund success rate | 100% of valid refund claims processed |
| Phase transitions | Automatic status updates at deadlines |
| Salt recovery | 95%+ users successfully retrieve salt for reveal |

---

## Demo Scenarios

1. **Happy Path**: Create auction → 2 bidders place bids → Both reveal → Higher bid wins → Loser claims refund
2. **No Reveal**: Bidder places bid but doesn't reveal → Deposit forfeited → Auction settles with remaining reveals
3. **Single Bidder**: Only one bid → Single reveal → Wins by default → Settlement completes

---

*Wave 2 Target Completion: February 17, 2026*
