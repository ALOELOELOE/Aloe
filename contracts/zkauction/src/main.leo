// Aloe: Privacy-first sealed-bid auction platform
// Wave 1: Core auction creation and bid placement with commit-reveal scheme
// Wave 2: Bid reveal, auction settlement, refund claims, and cancellation

// Import credits.aleo for real credit transfers (escrow deposits)
import credits.aleo;

program aloe_auction_v3.aleo {

    // ============================================
    // CONSTRUCTOR (required for deployment)
    // ============================================

    // Simple constructor for initial deployment
    // Using @noupgrade to make this a non-upgradable program
    @noupgrade
    async constructor() {}

    // ============================================
    // DATA STRUCTURES
    // ============================================

    // Auction status constants (stored as u8)
    // 0 = Created
    // 1 = Active (covers both commit and reveal phases, differentiated by block height)
    // 3 = Ended (settled with a winner)
    // 4 = Cancelled

    // Struct for public auction data (stored in mapping)
    struct Auction {
        auctioneer: address,      // Creator of the auction
        item_id: field,           // Unique identifier for the item
        min_bid: u64,             // Minimum bid amount in microcredits
        commit_deadline: u32,     // Block height when commit phase ends
        reveal_deadline: u32,     // Block height when reveal phase ends
        status: u8,               // Auction status (see constants above)
        winner: address,          // Winner address (set after settlement)
        winning_bid: u64,         // Winning bid amount (set after settlement)
    }

    // Private record for bid commitment - only the bidder knows the contents
    record BidCommitment {
        owner: address,           // Bidder's address
        auction_id: field,        // Which auction this bid is for
        commitment: field,        // Hash of (bid_amount, salt, auction_id)
        bid_amount: u64,          // Actual bid amount (private)
        salt: field,              // Random salt for commitment
        deposit: u64,             // Deposit amount (must be >= bid_amount)
    }

    // Private record for a revealed bid - proves the bidder revealed (needed for refund)
    // Created during the reveal phase when a bidder opens their sealed bid
    record RevealedBid {
        owner: address,           // Bidder's address
        auction_id: field,        // Which auction this bid is for
        commitment: field,        // The original commitment hash
        bid_amount: u64,          // The revealed bid amount
        deposit: u64,             // The deposit amount held in escrow
    }

    // ============================================
    // MAPPINGS (Public on-chain state)
    // ============================================

    // auction_id => Auction struct
    mapping auctions: field => Auction;

    // auction_id => number of bids
    mapping bid_count: field => u64;

    // commitment hash => true (to prevent duplicate commitments)
    mapping commitments: field => bool;

    // auction_id => total deposited
    mapping auction_deposits: field => u64;

    // auction_id => number of revealed bids
    mapping revealed_count: field => u32;

    // auction_id => highest bid amount
    mapping highest_bid: field => u64;

    // auction_id => highest bidder address
    mapping highest_bidder: field => address;

    // commitment hash => whether refund has been claimed
    mapping refund_claimed: field => bool;

    // ============================================
    // TRANSITIONS
    // ============================================

    // Create a new auction
    // Returns a Future to update the mapping
    async transition create_auction(
        public auction_id: field,         // Unique auction identifier
        public item_id: field,            // Item being auctioned
        public min_bid: u64,              // Minimum bid in microcredits
        public commit_duration: u32,      // Blocks for commit phase
        public reveal_duration: u32       // Blocks for reveal phase
    ) -> Future {
        // Validate inputs
        assert(commit_duration > 0u32);
        assert(reveal_duration > 0u32);
        assert(min_bid > 0u64);

        // Return the future to finalize state
        return finalize_create_auction(
            auction_id,
            self.caller,
            item_id,
            min_bid,
            commit_duration,
            reveal_duration
        );
    }

    // Finalize auction creation - updates on-chain state
    async function finalize_create_auction(
        auction_id: field,
        auctioneer: address,
        item_id: field,
        min_bid: u64,
        commit_duration: u32,
        reveal_duration: u32
    ) {
        // Ensure auction doesn't already exist
        let exists: bool = Mapping::contains(auctions, auction_id);
        assert(!exists);

        // Calculate deadlines based on current block height
        let commit_deadline: u32 = block.height + commit_duration;
        let reveal_deadline: u32 = commit_deadline + reveal_duration;

        // Create the auction struct
        let auction: Auction = Auction {
            auctioneer: auctioneer,
            item_id: item_id,
            min_bid: min_bid,
            commit_deadline: commit_deadline,
            reveal_deadline: reveal_deadline,
            status: 1u8, // Active (commit phase starts immediately)
            winner: auctioneer, // Default to auctioneer (no winner yet)
            winning_bid: 0u64,
        };

        // Store auction in mapping
        Mapping::set(auctions, auction_id, auction);

        // Initialize bid count
        Mapping::set(bid_count, auction_id, 0u64);

        // Initialize deposits
        Mapping::set(auction_deposits, auction_id, 0u64);

        // Initialize reveal tracking
        Mapping::set(revealed_count, auction_id, 0u32);
        Mapping::set(highest_bid, auction_id, 0u64);
        Mapping::set(highest_bidder, auction_id, auctioneer);
    }

    // Place a sealed bid on an auction
    // Creates a private BidCommitment record for the bidder
    // Accepts a private credits record to hide the sender's identity on-chain
    // Transfers credits from private record to program's public balance (escrow)
    async transition place_bid(
        public auction_id: field,         // Auction to bid on
        bid_amount: u64,                  // Private bid amount
        salt: field,                      // Private random salt for commitment
        public deposit: u64,              // Public deposit amount (must be >= bid)
        payment: credits.aleo/credits     // Private credits record (hides sender)
    ) -> (BidCommitment, Future) {
        // Deposit must cover the bid
        assert(deposit >= bid_amount);

        // Compute commitment hash: BHP256(bid_amount, salt, auction_id)
        // This hides the bid_amount while allowing verification during reveal
        let commitment: field = BHP256::hash_to_field(
            CommitmentData {
                bid_amount: bid_amount,
                salt: salt,
                auction_id: auction_id,
            }
        );

        // Create private bid commitment record for the bidder
        let bid_record: BidCommitment = BidCommitment {
            owner: self.caller,
            auction_id: auction_id,
            commitment: commitment,
            bid_amount: bid_amount,
            salt: salt,
            deposit: deposit,
        };

        // Transfer from private credits record to program's public balance (escrow)
        // Uses transfer_private_to_public to hide the sender's address on-chain
        // (unlike transfer_public_as_signer which exposes the signer publicly)
        // self.address is the program's on-chain address, acting as escrow
        // Returns (change_record, future) — change record goes back to caller automatically
        let (change_record, transfer_future): (credits.aleo/credits, Future) = credits.aleo/transfer_private_to_public(
            payment,
            self.address,
            deposit
        );

        // Return the record and future to finalize
        return (bid_record, finalize_place_bid(auction_id, commitment, deposit, transfer_future));
    }

    // Helper struct for commitment hashing
    struct CommitmentData {
        bid_amount: u64,
        salt: field,
        auction_id: field,
    }

    // Finalize bid placement - updates on-chain state
    // Awaits the credit transfer future to ensure atomic execution
    async function finalize_place_bid(
        auction_id: field,
        commitment: field,
        deposit: u64,
        transfer_future: Future   // Future from credits.aleo transfer
    ) {
        // Finalize the credit transfer first (atomic with bid placement)
        transfer_future.await();

        // Get auction and verify it exists
        let auction: Auction = Mapping::get(auctions, auction_id);

        // Verify auction is in active state
        assert_eq(auction.status, 1u8);

        // Verify we're before the commit deadline (still in commit phase)
        assert(block.height <= auction.commit_deadline);

        // Ensure this commitment hasn't been submitted before
        let commitment_exists: bool = Mapping::contains(commitments, commitment);
        assert(!commitment_exists);

        // Record the commitment
        Mapping::set(commitments, commitment, true);

        // Increment bid count
        let current_count: u64 = Mapping::get(bid_count, auction_id);
        Mapping::set(bid_count, auction_id, current_count + 1u64);

        // Track total deposits
        let current_deposits: u64 = Mapping::get(auction_deposits, auction_id);
        Mapping::set(auction_deposits, auction_id, current_deposits + deposit);
    }

    // ============================================
    // REVEAL PHASE
    // ============================================

    // Reveal a previously committed bid
    // Consumes the BidCommitment record and returns a RevealedBid record
    // Only callable during the reveal phase (after commit_deadline, before reveal_deadline)
    async transition reveal_bid(
        private bid_record: BidCommitment
    ) -> (RevealedBid, Future) {
        // Re-compute commitment hash to verify it matches
        let computed_commitment: field = BHP256::hash_to_field(
            CommitmentData {
                bid_amount: bid_record.bid_amount,
                salt: bid_record.salt,
                auction_id: bid_record.auction_id,
            }
        );

        // Assert the commitment matches (proves the bid data is genuine)
        assert_eq(computed_commitment, bid_record.commitment);

        // Deposit must cover bid (should already be true from place_bid, but verify)
        assert(bid_record.deposit >= bid_record.bid_amount);

        // Create RevealedBid record — proves this bidder revealed (needed for refund)
        let revealed: RevealedBid = RevealedBid {
            owner: bid_record.owner,
            auction_id: bid_record.auction_id,
            commitment: bid_record.commitment,
            bid_amount: bid_record.bid_amount,
            deposit: bid_record.deposit,
        };

        return (revealed, finalize_reveal_bid(
            bid_record.auction_id,
            bid_record.commitment,
            bid_record.bid_amount,
            bid_record.owner
        ));
    }

    // Finalize reveal - checks timing and updates highest bid tracking
    async function finalize_reveal_bid(
        auction_id: field,
        commitment: field,
        bid_amount: u64,
        bidder: address
    ) {
        // Get auction and verify state
        let auction: Auction = Mapping::get(auctions, auction_id);
        assert_eq(auction.status, 1u8);

        // Must be in reveal phase (after commit deadline, before reveal deadline)
        assert(block.height > auction.commit_deadline);
        assert(block.height <= auction.reveal_deadline);

        // Verify this commitment exists (was actually placed)
        let commitment_exists: bool = Mapping::get(commitments, commitment);
        assert(commitment_exists);

        // Update highest bid if this is the new leader
        let current_highest: u64 = Mapping::get(highest_bid, auction_id);
        if (bid_amount > current_highest) {
            Mapping::set(highest_bid, auction_id, bid_amount);
            Mapping::set(highest_bidder, auction_id, bidder);
        }

        // Increment revealed count
        let current_count: u32 = Mapping::get(revealed_count, auction_id);
        Mapping::set(revealed_count, auction_id, current_count + 1u32);
    }

    // ============================================
    // SETTLEMENT & REFUNDS
    // ============================================

    // Settle an auction after the reveal phase ends
    // Transfers the winning bid amount to the auctioneer
    // Can only be called after reveal_deadline with at least one revealed bid
    async transition settle_auction(
        public auction_id: field,
        public auctioneer: address,
        public winning_amount: u64
    ) -> Future {
        // Transfer winning bid to auctioneer from program's public balance
        let transfer_future: Future = credits.aleo/transfer_public(
            auctioneer,
            winning_amount
        );

        return finalize_settle_auction(
            auction_id,
            auctioneer,
            winning_amount,
            transfer_future
        );
    }

    // Finalize settlement - verifies timing, winner, and updates auction status
    async function finalize_settle_auction(
        auction_id: field,
        auctioneer: address,
        winning_amount: u64,
        transfer_future: Future
    ) {
        // Await the credit transfer
        transfer_future.await();

        // Get auction and verify state
        let auction: Auction = Mapping::get(auctions, auction_id);
        assert_eq(auction.status, 1u8);

        // Must be past reveal deadline
        assert(block.height > auction.reveal_deadline);

        // Verify auctioneer matches
        assert_eq(auctioneer, auction.auctioneer);

        // Verify winning amount matches on-chain highest bid
        let on_chain_highest: u64 = Mapping::get(highest_bid, auction_id);
        assert_eq(winning_amount, on_chain_highest);

        // Must have at least one reveal (otherwise use cancel)
        assert(winning_amount > 0u64);

        // Get winner address
        let winner: address = Mapping::get(highest_bidder, auction_id);

        // Update auction to Ended with winner info
        let settled_auction: Auction = Auction {
            auctioneer: auction.auctioneer,
            item_id: auction.item_id,
            min_bid: auction.min_bid,
            commit_deadline: auction.commit_deadline,
            reveal_deadline: auction.reveal_deadline,
            status: 3u8, // Ended
            winner: winner,
            winning_bid: winning_amount,
        };
        Mapping::set(auctions, auction_id, settled_auction);
    }

    // Claim a refund for a non-winning revealed bid
    // Only revealed bidders can claim (unrevealed bids forfeit their deposit)
    // Only non-winners can claim (winner's deposit goes to auctioneer)
    async transition claim_refund(
        private bid_record: RevealedBid
    ) -> Future {
        // Transfer deposit back to bidder from program's public balance
        let transfer_future: Future = credits.aleo/transfer_public(
            bid_record.owner,
            bid_record.deposit
        );

        return finalize_claim_refund(
            bid_record.auction_id,
            bid_record.commitment,
            bid_record.owner,
            transfer_future
        );
    }

    // Finalize refund - verifies auction is settled and bidder is not the winner
    async function finalize_claim_refund(
        auction_id: field,
        commitment: field,
        bidder: address,
        transfer_future: Future
    ) {
        // Await the credit transfer
        transfer_future.await();

        // Get auction and verify it's settled
        let auction: Auction = Mapping::get(auctions, auction_id);
        assert_eq(auction.status, 3u8); // Must be Ended

        // Only non-winners can claim refund
        assert_neq(bidder, auction.winner);

        // Check refund hasn't already been claimed for this commitment
        let already_claimed: bool = Mapping::contains(refund_claimed, commitment);
        assert(!already_claimed);

        // Mark as claimed
        Mapping::set(refund_claimed, commitment, true);
    }

    // ============================================
    // CANCELLATION
    // ============================================

    // Cancel an auction with zero bids
    // Only the auctioneer can cancel, and only if no bids have been placed
    async transition cancel_auction(
        public auction_id: field
    ) -> Future {
        return finalize_cancel_auction(auction_id, self.caller);
    }

    // Finalize cancellation - verifies auctioneer and no bids placed
    async function finalize_cancel_auction(
        auction_id: field,
        caller: address
    ) {
        // Get auction
        let auction: Auction = Mapping::get(auctions, auction_id);

        // Only auctioneer can cancel
        assert_eq(caller, auction.auctioneer);

        // Can only cancel if no bids placed
        let count: u64 = Mapping::get(bid_count, auction_id);
        assert_eq(count, 0u64);

        // Must still be active
        assert_eq(auction.status, 1u8);

        // Update to Cancelled
        let cancelled_auction: Auction = Auction {
            auctioneer: auction.auctioneer,
            item_id: auction.item_id,
            min_bid: auction.min_bid,
            commit_deadline: auction.commit_deadline,
            reveal_deadline: auction.reveal_deadline,
            status: 4u8, // Cancelled
            winner: auction.winner,
            winning_bid: auction.winning_bid,
        };
        Mapping::set(auctions, auction_id, cancelled_auction);
    }

}
