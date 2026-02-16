# Wave 5: Token Launches Module

**Timeline:** March 17 - March 31, 2026
**Theme:** Fair Private Launchpad
**Status:** Planned

---

## Overview

Wave 5 introduces Aloe's third core module: **Token Launches** — a fair launchpad where projects can distribute tokens using a private commitment pattern. Individual allocation sizes remain hidden, preventing whale sniping and ensuring fair distribution.

The key privacy innovation: participants commit to allocation amounts privately, so no one can see how much others are buying. Only the total committed amount and participant count are public. This solves the common launchpad problem where whales monitor commitments and front-run smaller participants.

**Current State:** The Launches page (`pages/launches.js`) has a "Coming Soon" placeholder. This wave replaces it with a fully functional launchpad UI and smart contract.

---

## Smart Contract

### Program: `aloe_launches_v1.aleo`

**Location:** `contracts/zklaunches/src/main.leo`

Imports `credits.aleo` for all value transfers.

### Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Struct | `Launch` | `launch_id`, `creator`, `token_name_hash`, `total_supply`, `price_per_token`, `max_per_wallet`, `start_block`, `end_block`, `settle_block`, `status`, `total_committed`, `participant_count` | On-chain launch metadata. Status: 0=pending, 1=active, 2=settled, 3=cancelled. `total_committed` and `participant_count` are the only publicly-updating fields. |
| Record | `LaunchCommitment` | `owner`, `launch_id`, `commit_amount`, `token_allocation`, `salt` | Private record proving a participant's commitment. The `commit_amount` is only visible to the owner. |
| Record | `TokenAllocation` | `owner`, `launch_id`, `token_name_hash`, `amount` | Private record representing the participant's received token allocation after settlement |

### Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `create_launch` | Public | Creator specifies launch_id, token_name_hash (BHP256 hash of name for privacy), total_supply, price_per_token, max_per_wallet, and durations for commit and settle phases. Finalize stores the `Launch` struct in the `launches` mapping with status=pending. |
| `commit_to_launch` | Private + Public | Participant commits credits to buy tokens. Takes launch_id, private commit_amount, and private salt. Calls `credits.aleo/transfer_public_as_signer` to lock the commit_amount into program escrow. Returns a `LaunchCommitment` record. Finalize checks timing (must be in active phase), then increments `total_committed` and `participant_count` — but the individual `commit_amount` stays private. |
| `settle_launch` | Public | Creator settles the launch after commit phase ends. Calculates token allocations based on commitments. For oversubscribed launches, applies pro-rata distribution. |
| `claim_launch_tokens` | Private | Participant consumes their `LaunchCommitment` record to receive a `TokenAllocation` record after settlement. Finalize checks launch is settled and participant hasn't already claimed. |
| `claim_launch_refund` | Private | If launch is cancelled, participant consumes `LaunchCommitment` and receives credits back via `credits.aleo/transfer_public`. Finalize checks launch status is cancelled. |

### Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `launches` | `field => Launch` | launch_id → Launch struct with all metadata |
| `launch_claimed` | `field => bool` | hash(launch_id, participant) → whether allocation was claimed |

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| LaunchCard | `components/LaunchCard.jsx` | Card showing token name, price, supply, progress bar, and status badge |
| LaunchList | `components/LaunchList.jsx` | Grid of active and upcoming launches with filters |
| CreateLaunchForm | `components/CreateLaunchForm.jsx` | Form for creating a new token launch with validation |
| CommitToLaunchDialog | `components/CommitToLaunchDialog.jsx` | Modal for committing credits — amount input, cost preview, allocation estimate |
| LaunchProgressBar | `components/LaunchProgressBar.jsx` | Visual progress showing total_committed vs total_supply * price |
| LaunchDetailDialog | `components/LaunchDetailDialog.jsx` | Full launch detail view with commit action and statistics |
| LaunchStatusBadge | `components/LaunchStatusBadge.jsx` | Badge: Upcoming / Active / Settled / Cancelled |

### Transaction Builders (`lib/launches.js`)

New file with five builder functions: `buildCreateLaunchInputs`, `buildCommitToLaunchInputs`, `buildSettleLaunchInputs`, `buildClaimLaunchTokensInputs`, and `buildClaimLaunchRefundInputs`. Each follows the same pattern as `lib/aleo.js`.

### New Store (`store/launchStore.js`)

Zustand store with state fields (`launches`, `isCreating`, `isCommitting`, `isClaiming`) and actions (`fetchLaunches`, `getActiveLaunches`, `getUpcomingLaunches`, `createLaunch`, `commitToLaunch`, `claimTokens`, `claimRefund`).

### Page Update (`pages/launches.js`)

Replace the "Coming Soon" placeholder with full launchpad UI:
- Launch list with tabs: Active / Upcoming / Completed
- Create Launch button (connected wallet required)
- Launch detail view on card click
- Commit dialog with amount input and cost calculator
- Progress bar showing participation level

### Constants Update (`lib/constants.js`)

Add `LAUNCHES: "aloe_launches_v1.aleo"` to the `PROGRAMS` object. Add `LAUNCH_STATUS` enum (PENDING=0, ACTIVE=1, SETTLED=2, CANCELLED=3).

### Dashboard Integration

Add launch activity data to the `activityStore.js` (created in Wave 3). The activity dashboard (`/my-activity`) now shows auction, OTC, and launch activity in its feed and summary cards.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Hidden allocation sizes | Individual commit amounts are private records — no one sees how much others are buying |
| Anti-whale protection | Whales cannot monitor other commitments and front-run smaller participants |
| Private token receipts | TokenAllocation records are encrypted — only the owner sees their allocation |
| Public aggregate only | Only total_committed and participant_count are public — individual amounts hidden |
| Fair distribution | max_per_wallet enforced without revealing who is near the limit |

**Privacy Score:** Very High — Solves the #1 problem with public launchpads: whale sniping via commitment monitoring.

---

## Testing Checklist

### Create Launch
- [ ] Creator can create a launch with valid parameters
- [ ] Launch stored in on-chain `launches` mapping
- [ ] Status set to pending (0) initially
- [ ] Cannot create launch with zero supply or zero price

### Commit to Launch
- [ ] Participant can commit credits during active phase
- [ ] Credits correctly escrowed via credits.aleo
- [ ] LaunchCommitment record returned with correct amounts
- [ ] total_committed and participant_count update publicly
- [ ] Individual commit_amount remains private
- [ ] Cannot commit more than max_per_wallet
- [ ] Cannot commit after end_block

### Settle Launch
- [ ] Creator can settle after commit phase ends
- [ ] Token allocations calculated correctly
- [ ] Oversubscribed launches: pro-rata distribution
- [ ] Cannot settle before end_block
- [ ] Cannot settle already-settled launch

### Claim / Refund
- [ ] Participants can claim TokenAllocation after settlement
- [ ] Participants can claim refund if launch is cancelled
- [ ] Cannot claim twice
- [ ] Excess credits refunded in oversubscribed launches

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Launch creation | Full create → commit → settle flow working |
| Privacy verification | Individual commit amounts not visible on-chain |
| Escrow accuracy | 100% of committed credits properly locked and distributed |
| Refund reliability | 100% of cancelled launch refunds processed |
| Fair distribution | max_per_wallet correctly enforced |

---

## Demo Scenarios

1. **Happy Path**: Creator launches token (1000 supply, 10 credits each) → 5 participants commit varying amounts → Creator settles → Participants claim tokens
2. **Oversubscribed**: Total commitments exceed supply → Pro-rata distribution → Excess credits refunded
3. **Cancelled Launch**: Creator cancels before settlement → All participants reclaim credits
4. **Max Per Wallet**: Participant tries to commit more than max_per_wallet → Transaction rejected

---

*Wave 5 Target Completion: March 31, 2026*
