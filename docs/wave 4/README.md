# Wave 4: OTC Trading Module

**Timeline:** March 3 - March 17, 2026
**Theme:** Private Peer-to-Peer Trades
**Status:** Planned

---

## Overview

Wave 4 introduces Aloe's second core module: **OTC (Over-the-Counter) Trading**. This module enables private peer-to-peer deals where a maker creates an offer with locked escrow, and a specific taker can accept it for an atomic swap. All deal amounts are kept private using Aleo's record-based architecture.

The OTC module solves **front-running** — a critical problem in public DeFi where bots intercept trades by observing the mempool. With Aloe OTC, deal terms are only visible to the maker and designated taker.

**Current State:** The OTC page (`pages/otc.js`) has a live UI with DealCard, DealList, and CreateDealForm components connected to `store/dealStore.js`. This wave adds the smart contract and wires real transactions.

---

## Smart Contract

### Program: `aloe_otc_v1.aleo`

**Location:** `contracts/zkotc/src/main.leo`

Imports `credits.aleo` for all value transfers.

### Data Structures

| Type | Name | Fields | Purpose |
|------|------|--------|---------|
| Struct | `Deal` | `deal_id`, `maker`, `taker`, `offer_amount`, `ask_amount`, `expiry_block`, `status` | On-chain deal metadata. Status values: 0=open, 1=accepted, 2=cancelled, 3=expired |
| Record | `MakerEscrow` | `owner`, `deal_id`, `amount` | Private record proving maker's escrow deposit. Required to cancel the deal. |
| Record | `DealReceipt` | `owner`, `deal_id`, `counterparty`, `amount_sent`, `amount_received` | Private receipt given to both parties after deal completion |

### Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_deal` | Private + Public | Maker specifies deal_id, taker address (or zero for open deals), offer_amount, ask_amount, and expiry_block. Calls `credits.aleo/transfer_public_as_signer` to lock the offer_amount into the program's public balance. Returns a `MakerEscrow` record to the maker. Finalize stores the `Deal` struct in the `deals` mapping. |
| `accept_deal` | Private + Public | Taker calls with deal_id, ask_amount, and maker address. Calls `credits.aleo/transfer_public_as_signer` to pay the ask_amount to the maker, then `credits.aleo/transfer_public` to release the escrowed offer_amount to the taker. Returns `DealReceipt` records to both parties. Finalize checks deal is open, not expired, and taker matches (if designated). Updates status to accepted (1). |
| `cancel_deal` | Private | Maker consumes their `MakerEscrow` record. Calls `credits.aleo/transfer_public` to return the escrowed amount to the maker. Finalize checks deal is still open and updates status to cancelled (2). |

### Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `deals` | `field => Deal` | deal_id → Deal struct with all metadata |
| `maker_deal_count` | `address => u32` | Track active deal count per maker for UX queries |

---

## Frontend

### Updated Components

| Component | File Path | Change |
|-----------|-----------|--------|
| CreateDealForm | `components/CreateDealForm.jsx` | Wire to `aloe_otc_v1.aleo/create_deal` transaction |
| DealCard | `components/DealCard.jsx` | Add Accept and Cancel action buttons |
| DealList | `components/DealList.jsx` | Fetch real deals from on-chain mappings |

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| DealDetailDialog | `components/DealDetailDialog.jsx` | Full deal detail view with terms, status, and action buttons |
| AcceptDealButton | `components/AcceptDealButton.jsx` | Button to accept a deal — pays ask_amount, receives offer_amount |
| CancelDealButton | `components/CancelDealButton.jsx` | Button for maker to cancel and reclaim escrow |
| DealStatusBadge | `components/DealStatusBadge.jsx` | Visual badge: Open / Accepted / Cancelled / Expired |

### Transaction Builders (`lib/otc.js`)

New file with three builder functions: `buildCreateDealInputs`, `buildAcceptDealInputs`, and `buildCancelDealInputs`. Each constructs the programId, functionName, and inputs array following the same pattern as `lib/aleo.js`.

### Store Updates (`store/dealStore.js`)

| Field / Action | Description |
|----------------|-------------|
| `isCreating` | Loading state for deal creation |
| `isAccepting` | Loading state for deal acceptance |
| `isCancelling` | Loading state for deal cancellation |
| `getOpenDeals()` | Fetch all deals with status=0 (open) |
| `getDealsByMaker(address)` | Fetch deals created by a specific maker |
| `getDealsByTaker(address)` | Fetch deals where user is the designated taker |
| `createDeal(params)` | Execute create_deal transaction |
| `acceptDeal(dealId)` | Execute accept_deal transaction |
| `cancelDeal(escrowRecord)` | Execute cancel_deal transaction |

### Page Update (`pages/otc.js`)

Replace the placeholder OTC page with full deal browsing and creation:
- Deal list with filters (Open / My Deals / Completed)
- Create Deal form accessible via "Create Deal" button
- Deal detail dialog on card click
- Accept/Cancel actions based on user role (maker vs taker)

### Dashboard Integration

Add OTC activity data to the `activityStore.js` (created in Wave 3). The activity dashboard (`/my-activity`) now shows both auction and OTC activity in its feed and summary cards.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Private escrow records | MakerEscrow record is encrypted — only maker sees their locked amount |
| Front-running prevention | Deal terms not visible in mempool; taker designation prevents interception |
| Private deal receipts | DealReceipt records are private — trade history only visible to participants |
| No order book exposure | Unlike DEXes, deal amounts are not publicly displayed |
| Selective counterparty | Maker can restrict deals to a specific taker address |

**Privacy Score:** High — OTC trades are invisible to third parties. Only maker and taker see deal terms.

---

## Testing Checklist

### Create Deal
- [ ] Maker can create a deal with valid parameters
- [ ] Credits correctly escrowed via credits.aleo/transfer_public_as_signer
- [ ] MakerEscrow record returned to maker
- [ ] Deal stored in on-chain `deals` mapping
- [ ] Cannot create deal with insufficient balance

### Accept Deal
- [ ] Designated taker can accept an open deal
- [ ] Taker's ask_amount transferred to maker via credits.aleo
- [ ] Escrowed offer_amount transferred to taker via credits.aleo
- [ ] Deal status updated to accepted (1)
- [ ] Non-designated taker cannot accept (if taker != 0)
- [ ] Cannot accept expired deal
- [ ] Cannot accept already-accepted or cancelled deal

### Cancel Deal
- [ ] Maker can cancel their own open deal
- [ ] Escrowed credits returned to maker
- [ ] Deal status updated to cancelled (2)
- [ ] Non-maker cannot cancel (requires MakerEscrow record)
- [ ] Cannot cancel already-accepted deal

### Edge Cases
- [ ] Deal with taker=0 (open to anyone) works correctly
- [ ] Expired deals cannot be accepted
- [ ] Atomic swap: both transfers succeed or both fail

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Deal creation | Full create → accept flow working |
| Escrow accuracy | 100% of escrowed credits properly locked and released |
| Atomic swaps | Zero partial executions (both sides always complete) |
| Cancel reliability | 100% of cancelled deals return full escrow |
| Frontend integration | OTC page fully wired to on-chain transactions |

---

## Demo Scenarios

1. **Happy Path**: Maker creates deal (100 credits for 50 credits) → Taker accepts → Both receive DealReceipt → Credits swapped
2. **Cancelled Deal**: Maker creates deal → No taker → Maker cancels → Escrow returned
3. **Expired Deal**: Maker creates deal with short expiry → Expiry passes → Deal cannot be accepted
4. **Open Deal**: Maker creates deal with taker=0 → Any user can accept

---

*Wave 4 Target Completion: March 17, 2026*
