// Aloe: Privacy-first sealed-bid auction platform
// Wave 1: Core auction creation and bid placement with commit-reveal scheme

// Import credits.aleo for real credit transfers (escrow deposits)
import credits.aleo;

program zkauction.aleo {

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
    // 0 = Created, 1 = CommitPhase, 2 = RevealPhase, 3 = Ended, 4 = Cancelled

    // Struct for public auction data (stored in mapping)
    struct Auction {
        auctioneer: address,      // Creator of the auction
        item_id: field,           // Unique identifier for the item
        min_bid: u64,             // Minimum bid amount in microcredits
        commit_deadline: u32,     // Block height when commit phase ends
        reveal_deadline: u32,     // Block height when reveal phase ends
        status: u8,               // Auction status (0-4)
        winner: address,          // Winner address (set after reveal)
        winning_bid: u64,         // Winning bid amount (set after reveal)
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
            status: 1u8, // CommitPhase
            winner: auctioneer, // Default to auctioneer (no winner yet)
            winning_bid: 0u64,
        };

        // Store auction in mapping
        Mapping::set(auctions, auction_id, auction);

        // Initialize bid count
        Mapping::set(bid_count, auction_id, 0u64);

        // Initialize deposits
        Mapping::set(auction_deposits, auction_id, 0u64);
    }

    // Place a sealed bid on an auction
    // Creates a private BidCommitment record for the bidder
    // Transfers real credits from signer to program address (escrow)
    async transition place_bid(
        public auction_id: field,         // Auction to bid on
        bid_amount: u64,                  // Private bid amount
        salt: field,                      // Private random salt for commitment
        public deposit: u64               // Public deposit amount (must be >= bid)
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

        // Transfer real credits from signer to program address (escrow)
        // Uses transfer_public_as_signer because the signer (user) holds the credits
        // self.address is the program's on-chain address, acting as escrow
        let transfer_future: Future = credits.aleo/transfer_public_as_signer(
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

        // Verify auction is in commit phase
        assert_eq(auction.status, 1u8);

        // Verify we're before the commit deadline
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
    // VIEW FUNCTIONS (for Wave 2+)
    // ============================================

    // Note: reveal_bid, end_auction, claim_refund, and cancel_auction
    // transitions will be implemented in Wave 2

}
