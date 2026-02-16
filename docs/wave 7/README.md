# Wave 7: RWA Exchange Module

**Timeline:** April 14 - April 28, 2026
**Theme:** Real-World Asset Trading
**Status:** Planned

---

## Overview

Wave 7 introduces Aloe's fifth and final core module: **RWA (Real-World Asset) Exchange** — a marketplace for tokenized real-world assets including real estate, commodities, securities, and other off-chain assets. This module brings private ownership and trading of fractional asset units to Aleo.

The key privacy innovations: ownership records are fully private (only the holder sees their units), purchase amounts are hidden, and secondary market transfers are invisible to third parties. Only the aggregate holder count is public — individual holdings remain encrypted.

This completes Aloe's 5-module suite: Auctions + OTC + Launches + NFT + **RWA**.

**Current State:** The RWA page (`pages/rwa.js`) has a "Coming Soon" placeholder. This wave replaces it with a full exchange UI and smart contract.

---

## Smart Contract

### Program: `aloe_rwa_v1.aleo`

**Location:** `contracts/zkrwa/src/main.leo`

Imports `credits.aleo` for all value transfers.

### Data Structures

| Type | Name | Key Fields | Purpose |
|------|------|------------|---------|
| Struct | `RWAAsset` | `asset_id`, `issuer`, `asset_type` (u8), `asset_hash`, `total_units`, `price_per_unit`, `units_sold`, `holder_count`, `attestation_hash`, `status` | On-chain asset metadata. `units_sold` and `holder_count` are the only publicly-updating fields. Status: 0=active, 1=delisted |
| Record | `RWAOwnership` | `owner`, `asset_id`, `asset_type`, `units` | Private ownership record — only the holder sees their units |
| Record | `PurchaseOrder` | `owner`, `asset_id`, `units`, `total_cost`, `issuer` | Private purchase receipt |

### Asset Type Constants

| Value | Asset Type | Examples |
|-------|-----------|----------|
| `0u8` | Real Estate | Tokenized property, REITs |
| `1u8` | Commodity | Gold, silver, oil fractions |
| `2u8` | Security | Bonds, equity tokens |
| `3u8` | Other | Carbon credits, collectibles |

### Transitions

| Transition | Visibility | Description |
|------------|------------|-------------|
| `register_asset` | Public | Issuer specifies asset_id, asset_type (must be 0-3), asset_hash (BHP256 hash of off-chain metadata), total_units, price_per_unit, and attestation_hash (reference to legal compliance docs). Finalize checks no duplicate asset_id exists and stores the `RWAAsset` struct in the `assets` mapping. |
| `purchase_units` | Private + Public | Buyer specifies asset_id, private units amount, and issuer address. Calls `credits.aleo/transfer_public_as_signer` to pay the issuer directly (no escrow — immediate transfer). Returns an `RWAOwnership` record and `PurchaseOrder` receipt to the buyer. Finalize checks asset is active, enough units remain, and increments `units_sold` and `holder_count`. |
| `transfer_units` | Private | Fully private secondary market transfer. Owner consumes their `RWAOwnership` record, specifies a recipient and amount. Returns two new `RWAOwnership` records: one with remaining units for sender, one with transferred units for recipient. No on-chain mapping updates — entirely private. |
| `delist_asset` | Public | Issuer removes their asset from the exchange. Finalize checks caller is the issuer and sets status to delisted (1). Existing `RWAOwnership` records remain valid — only prevents new purchases. |

### Mappings

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `assets` | `field => RWAAsset` | asset_id → RWAAsset struct |

---

## Frontend

### New Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| RWAAssetCard | `components/RWAAssetCard.jsx` | Card showing asset name, type icon, units available, price, attestation badge |
| RWAAssetList | `components/RWAAssetList.jsx` | Grid of available RWA assets with type and price filters |
| RegisterAssetForm | `components/RegisterAssetForm.jsx` | Form for issuers to register a new RWA — type selector, units, price, attestation reference |
| PurchaseUnitsDialog | `components/PurchaseUnitsDialog.jsx` | Modal for purchasing fractional units — amount input, cost calculator |
| RWAPortfolio | `components/RWAPortfolio.jsx` | User's private portfolio view showing owned RWA units across all assets |
| AttestationBadge | `components/AttestationBadge.jsx` | Visual indicator showing asset has a verified attestation hash |
| AssetTypeIcon | `components/AssetTypeIcon.jsx` | Icon component for asset types: building (real estate), gem (commodity), shield (security), box (other) |
| TransferUnitsDialog | `components/TransferUnitsDialog.jsx` | Modal for transferring owned units to another address |

### Transaction Builders (`lib/rwa.js`)

New file with four builder functions: `buildRegisterAssetInputs`, `buildPurchaseUnitsInputs`, `buildTransferUnitsInputs`, and `buildDelistAssetInputs`. Same pattern as other lib files.

### New Store (`store/rwaStore.js`)

Zustand store with state fields (`assets`, `portfolio`, `isRegistering`, `isPurchasing`, `isTransferring`) and actions (`fetchAssets`, `getAssetsByType`, `getActiveAssets`, `registerAsset`, `purchaseUnits`, `transferUnits`, `fetchPortfolio`).

### Page Update (`pages/rwa.js`)

Replace the "Coming Soon" placeholder with full exchange UI:
- Asset grid with type filters (Real Estate / Commodity / Security / Other)
- Register Asset button (for issuers)
- Asset detail view on card click with purchase action
- "My Portfolio" tab showing private ownership records
- Transfer dialog for secondary market transfers

### Constants Update (`lib/constants.js`)

Add `RWA: "aloe_rwa_v1.aleo"` to the `PROGRAMS` object. Add `ASSET_TYPE` enum (REAL_ESTATE=0, COMMODITY=1, SECURITY=2, OTHER=3), `ASSET_TYPE_LABELS` for display, and `ASSET_STATUS` enum (ACTIVE=0, DELISTED=1).

### Dashboard Integration

Add RWA activity data to the `activityStore.js` (created in Wave 3). The activity dashboard (`/my-activity`) now shows all 5 modules' activity — completing the cross-module activity feed originally scaffolded in Wave 3.

---

## Privacy Deliverables

| Feature | Privacy Impact |
|---------|----------------|
| Private ownership records | RWAOwnership records are encrypted — only the holder sees their units |
| Hidden purchase amounts | Individual purchase sizes are private; only units_sold updates publicly |
| Anonymous secondary transfers | transfer_units is fully private — no on-chain trace of who transferred to whom |
| Aggregate-only public data | Only units_sold and holder_count are public — individual holdings invisible |
| Portfolio concealment | No way to determine what assets an address holds by scanning the chain |

**Privacy Score:** Very High — Ownership privacy is critical for real-world assets where revealing holdings could invite targeted attacks or regulatory arbitrage.

---

## Testing Checklist

### Register Asset
- [ ] Issuer can register an asset with valid parameters
- [ ] Asset stored in `assets` mapping with correct metadata
- [ ] Cannot register with invalid asset_type (>3)
- [ ] Cannot register duplicate asset_id
- [ ] Attestation hash stored correctly

### Purchase Units
- [ ] Buyer can purchase units from an active asset
- [ ] Credits transferred to issuer via credits.aleo
- [ ] RWAOwnership record returned with correct units
- [ ] PurchaseOrder receipt returned
- [ ] Cannot purchase more units than available (total_units - units_sold)
- [ ] Cannot purchase from delisted asset
- [ ] units_sold and holder_count update correctly

### Transfer Units
- [ ] Owner can transfer units to another address
- [ ] Sender's remaining units calculated correctly
- [ ] Recipient receives new RWAOwnership record
- [ ] Cannot transfer more units than owned
- [ ] Transfer is fully private (no public mapping updates)

### Delist Asset
- [ ] Issuer can delist their own asset
- [ ] Non-issuer cannot delist
- [ ] Delisted asset cannot receive new purchases
- [ ] Existing ownership records remain valid after delisting

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Asset registration | Full register → purchase → transfer flow working |
| Ownership privacy | Individual holdings not visible on-chain |
| Transfer privacy | Secondary market transfers leave no public trace |
| Payment accuracy | 100% of purchase credits correctly transferred to issuers |
| Portfolio display | User's private portfolio renders correctly from records |

---

## Demo Scenarios

1. **Property Purchase**: Issuer registers 1000 units of tokenized property → 5 buyers purchase varying amounts → Each sees only their own holdings
2. **Secondary Transfer**: Owner transfers 50 units to another address → Transfer is invisible on-chain → Recipient sees units in their portfolio
3. **Commodity Investment**: Issuer registers gold-backed tokens → Buyers purchase fractional units → Portfolio shows gold allocation
4. **Delisting**: Issuer delists an asset → Existing holders retain their records → No new purchases allowed

---

*Wave 7 Target Completion: April 28, 2026*
