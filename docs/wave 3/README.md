# Wave 3: Multi-Bidder UX

**Timeline:** February 17 - March 3, 2026
**Theme:** Dashboard & Discovery
**Status:** Planned

---

## Overview

Wave 3 focuses on user experience for multi-bidder auctions. This wave delivers a comprehensive dashboard for bidders to manage their bids, auction discovery features, and notifications for phase transitions.

---

## Smart Contract

### Enhancements

No new transitions required. Focus on frontend improvements using existing contract capabilities.

### Query Optimizations

- Efficient bid count retrieval per auction
- Batch auction status queries
- Revealed bid count tracking

---

## Frontend

### New Pages

| Page | Route | Description |
|------|-------|-------------|
| My Bids Dashboard | `/my-bids` | All user's bids with status and actions |
| Auction Discovery | `/explore` | Browse auctions with filters and search |
| Auction History | `/history` | Past auctions with results |

### New Components

| Component | Description |
|-----------|-------------|
| `BidDashboard.jsx` | Main dashboard showing all user bids |
| `BidCard.jsx` | Individual bid card with status and actions |
| `AuctionFilters.jsx` | Filter by status, price range, category |
| `AuctionSearch.jsx` | Search auctions by item name or ID |
| `NotificationBanner.jsx` | Alert for phase transitions |
| `BidCountBadge.jsx` | Shows number of bids (without amounts) |
| `PhaseCountdown.jsx` | Time remaining in current phase |

### Dashboard Features

1. **Bid Overview**
   - Total active bids
   - Pending reveals (action required)
   - Won auctions
   - Available refunds

2. **Bid List**
   - Sortable by auction end time, bid amount, status
   - Quick actions: Reveal, Claim Refund
   - Visual status indicators

3. **Notifications**
   - "Reveal phase starting" alerts
   - "Auction ending soon" warnings
   - "You won!" announcements
   - "Refund available" reminders

### Auction Discovery

1. **Filters**
   - Status: Commit Phase, Reveal Phase, Ended
   - Min bid range slider
   - Time remaining filter
   - Category tags (future)

2. **Sort Options**
   - Ending soonest
   - Most bids
   - Lowest minimum
   - Newest first

3. **Search**
   - By auction ID
   - By item name/description
   - By auctioneer address

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Bid count display | Shows engagement without revealing bid amounts |
| Private bid tracking | User's bid amounts only visible to themselves |
| Anonymous participation | Cannot determine which addresses have bid until reveal |
| Local storage encryption | Salt and bid data encrypted in browser |

**Privacy Score Contribution:** Medium — Enhances UX while preserving bid privacy until reveal phase.

---

## Testing Checklist

### Dashboard
- [ ] Displays all user's active bids correctly
- [ ] Shows correct bid status for each auction phase
- [ ] Quick actions work (Reveal, Claim Refund)
- [ ] Responsive on mobile devices
- [ ] Updates when new bids placed

### Auction Discovery
- [ ] Filters work correctly (status, price, time)
- [ ] Search returns relevant results
- [ ] Sort options function properly
- [ ] Pagination handles large auction lists
- [ ] Empty states display appropriately

### Notifications
- [ ] Phase transition alerts appear
- [ ] Alerts link to correct auction
- [ ] Dismissable and don't reappear
- [ ] Browser notifications work (if enabled)

### Multi-Bidder Scenarios
- [ ] 5+ bidders on single auction displays correctly
- [ ] Bid count updates in real-time
- [ ] Multiple reveals process without conflicts
- [ ] Settlement handles ties correctly (first reveal wins)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2 seconds |
| Filter response time | < 500ms |
| Search accuracy | Relevant results in top 5 |
| Mobile usability | Full functionality on mobile |
| Notification delivery | 100% of phase transitions alerted |

---

## User Stories

1. **As a bidder**, I want to see all my active bids in one place so I don't miss any reveal deadlines.
2. **As a bidder**, I want to filter auctions by status so I can find auctions in commit phase.
3. **As a bidder**, I want to be notified when reveal phase starts so I can reveal my bid on time.
4. **As an auctioneer**, I want to see how many bids my auction has received (without seeing amounts).
5. **As a user**, I want to search for specific auctions by name or ID.

---

## Wireframes

### My Bids Dashboard
```
┌────────────────────────────────────────────────────┐
│  My Bids                              [+ New Bid]  │
├────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ Active   │ │ Pending  │ │ Won      │ │Refunds ││
│  │    3     │ │ Reveal 1 │ │    2     │ │   1    ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
├────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐│
│  │ 🔒 Auction: Rare NFT #123                      ││
│  │ Your Bid: ••••• | Deposit: 100 credits        ││
│  │ Status: Reveal Phase | Ends in: 2h 15m        ││
│  │                              [Reveal Bid →]   ││
│  └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

---

*Wave 3 Target Completion: March 3, 2026*
