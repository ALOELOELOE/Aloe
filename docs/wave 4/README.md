# Wave 4: Token Integration

**Timeline:** March 3 - March 17, 2026
**Theme:** Multi-Currency Auctions
**Status:** Planned

---

## Overview

Wave 4 introduces support for custom Aleo tokens (ARC-20 standard) as both payment methods and auction items. This enables auctions for fungible tokens and payments in tokens other than Aleo credits.

---

## Smart Contract

### New Structs

```leo
struct TokenAuction {
    auction_id: field,
    auctioneer: address,
    token_id: field,              // Token being auctioned
    token_amount: u64,            // Amount of tokens for sale
    payment_token: field,         // Token accepted for payment (0 = credits)
    min_bid: u64,
    commit_deadline: u32,
    reveal_deadline: u32,
    status: u8,
    winner: address,
    winning_bid: u64,
}
```

### New Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_token_auction` | Public | Create auction for ARC-20 tokens |
| `place_token_bid` | Private | Place bid using specified payment token |
| `reveal_token_bid` | Private → Public | Reveal token bid |
| `settle_token_auction` | Public | Transfer tokens to winner |
| `claim_token_refund` | Private | Refund losing bids in original token |

### Token Escrow

```leo
// Escrow tokens when creating auction
async transition create_token_auction(
    public auction_id: field,
    private token_record: Token,      // ARC-20 token record
    public min_bid: u64,
    public payment_token: field,      // Which token to accept as payment
    public commit_duration: u32,
    public reveal_duration: u32,
) -> Future {
    // Transfer token ownership to contract for escrow
    // Return escrow receipt record
}
```

### New Mappings

```leo
mapping token_auctions: field => TokenAuction;
mapping escrowed_tokens: field => u64;        // auction_id => escrowed amount
mapping payment_deposits: field => u64;       // commitment => deposit in payment token
```

---

## Frontend

### New Components

| Component | Description |
|-----------|-------------|
| `TokenSelector.jsx` | Dropdown for selecting payment/auction token |
| `TokenBalance.jsx` | Display user's token balances |
| `TokenAuctionForm.jsx` | Create auction for tokens |
| `TokenBidForm.jsx` | Place bid with token selection |
| `TokenPreview.jsx` | Display token info (name, symbol, amount) |

### Token Registry Integration

- Fetch registered tokens from `token_registry.aleo`
- Display token metadata (name, symbol, decimals)
- Show user balances for supported tokens
- Validate sufficient balance before bidding

### UI Updates

1. **Create Auction Page**
   - Token type selector (Credits / Custom Token)
   - Token amount input for token auctions
   - Payment token selector

2. **Auction Card**
   - Display auction token type and amount
   - Show accepted payment token
   - Token icon/logo if available

3. **Bid Form**
   - Payment token selection
   - Balance display for selected token
   - Conversion rate display (if applicable)

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Private token transfers | Token bids use Aleo's private transfer mechanism |
| Hidden token amounts | Bid amounts in tokens remain sealed until reveal |
| Escrow privacy | Escrowed tokens visible but owner privacy maintained |
| Multi-token support | Users can bid with any supported token privately |

**Privacy Score Contribution:** High — Extends privacy guarantees to the entire token ecosystem on Aleo.

---

## Testing Checklist

### Token Auction Creation
- [ ] Can create auction for ARC-20 tokens
- [ ] Token correctly escrowed on creation
- [ ] Cannot create auction without sufficient token balance
- [ ] Payment token correctly specified
- [ ] Auction displays token metadata

### Token Bidding
- [ ] Can place bid with specified payment token
- [ ] Cannot bid without sufficient token balance
- [ ] Commitment includes payment token info
- [ ] Deposit correctly locked in payment token

### Token Settlement
- [ ] Winner receives auctioned tokens
- [ ] Auctioneer receives winning bid in payment token
- [ ] Losing bidders receive refund in original payment token
- [ ] Escrow correctly released

### Edge Cases
- [ ] Auction with same token for item and payment
- [ ] Zero-decimal tokens handled correctly
- [ ] Large token amounts (18 decimals) work
- [ ] Token transfer failures handled gracefully

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Supported tokens | 5+ popular ARC-20 tokens |
| Token auction creation | Fully functional |
| Token bid/reveal/settle | Complete flow working |
| Token display | Correct decimals and formatting |
| Refund accuracy | 100% correct token refunds |

---

## Supported Tokens (Initial)

| Token | Symbol | Use Case |
|-------|--------|----------|
| Aleo Credits | ALEO | Default payment |
| Wrapped ETH | wETH | Cross-chain value |
| Wrapped BTC | wBTC | Cross-chain value |
| Stablecoins | USDC/USDT | Stable value bids |
| Aleo ecosystem tokens | Various | Native tokens |

---

## Technical Considerations

### Token Standard Compatibility
- Follow ARC-20 interface for token interactions
- Handle varying decimal places (0-18)
- Support both public and private token balances

### Escrow Security
- Tokens locked until auction settlement
- Automatic release on cancellation
- No admin key for escrow (trustless)

### Cross-Token Pricing
- Display bids in both tokens if different
- Optional: Oracle integration for conversion rates
- Clear UX showing what's being auctioned vs payment

---

*Wave 4 Target Completion: March 17, 2026*
