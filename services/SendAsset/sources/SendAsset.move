/// # SendMove - Code-Based Transfer System
///
/// This module implements a secure, code-based transfer system for both MOVE tokens
/// and Fungible Assets (FA) on the Movement Network. Users can create transfers that
/// generate unique codes, which recipients use to claim funds.
///
/// ## Key Features
/// - Auto-generated unique claim codes
/// - Time-based expiration with automatic refunds
/// - XOR encryption for code security
/// - Support for both MOVE tokens and Fungible Assets
/// - Resource account escrow for fungible assets
/// - Comprehensive event emission for all operations
///
/// ## Architecture
/// - MOVE tokens are escrowed directly in the GlobalRegistry
/// - Fungible Assets are held in a dedicated resource account
/// - All transfers are indexed by sender for easy lookup
/// - Codes are hashed using Keccak256 for storage keys
module sendasset_system::sendmove {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::bcs;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};
    use aptos_std::aptos_hash;

    // ==================== DATA STRUCTURES ====================

    /// Holds a MOVE token transfer with coins escrowed directly in this struct.
    /// The coins are stored here until claimed or refunded.
    struct TokenTransfer has store {
        sender: address,              // Original sender of the transfer
        coins: Coin<AptosCoin>,       // Escrowed MOVE tokens
        created_at: u64,              // Timestamp when transfer was created (seconds)
        expiration: u64,              // Timestamp when transfer expires (seconds)
    }

    /// Record of a single claimed transfer, stored in recipient's account
    struct ClaimRecord has store, drop {
        sender: address,              // Who sent this transfer
        amount: u64,                  // Amount received
        claimed_at: u64,              // When it was claimed
        code_hash: vector<u8>,        // Hash of the claim code (for reference)
    }

    /// Record of a single claimed FA transfer, stored in recipient's account
    struct FAClaimRecord has store, drop {
        sender: address,              // Who sent this transfer
        asset_metadata: address,      // Which FA was received
        amount: u64,                  // Amount received
        claimed_at: u64,              // When it was claimed
        code_hash: vector<u8>,        // Hash of the claim code (for reference)
    }

    /// Resource stored in each user's account to track their claim history
    struct ClaimHistory has key {
        move_claims: vector<ClaimRecord>,      // History of MOVE token claims
        fa_claims: vector<FAClaimRecord>,      // History of FA claims
    }

    /// Holds metadata for a Fungible Asset transfer.
    /// The actual FA tokens are held in a resource account, not in this struct.
    struct FATransferInfo has store {
        sender: address,              // Original sender of the transfer
        asset_metadata: address,      // Address of the FA metadata object
        amount: u64,                  // Amount of FA tokens transferred
        created_at: u64,              // Timestamp when transfer was created (seconds)
        expiration: u64,              // Timestamp when transfer expires (seconds)
    }

    /// Stores the SignerCapability for the resource account used for FA escrow.
    /// This is created once during module initialization and never changes.
    struct ResourceAccountCap has key {
        signer_cap: account::SignerCapability,
    }

    /// Global registry that manages all transfers in the system.
    /// Stored at the module deployer's address (@sendasset_system).
    struct GlobalRegistry has key {
        transfers: Table<vector<u8>, TokenTransfer>,           // Maps code hash -> MOVE transfer
        fa_transfers: Table<vector<u8>, FATransferInfo>,       // Maps code hash -> FA transfer info
        sender_transfers: Table<address, vector<vector<u8>>>,  // Maps sender -> list of code hashes
        counter: u64,                                          // Monotonic counter for code generation
    }

    // ==================== EVENTS ====================

    /// Emitted when a new MOVE token transfer is created.
    #[event]
    struct TransferCreatedEvent has drop, store {
        sender: address,        // Address that created the transfer
        code: String,          // Encrypted claim code
        amount: u64,           // Amount of MOVE tokens
        created_at: u64,       // Creation timestamp
        expiration: u64,       // Expiration timestamp
    }

    /// Emitted when a MOVE token transfer is successfully claimed.
    #[event]
    struct TransferClaimedEvent has drop, store {
        sender: address,       // Original sender
        recipient: address,    // Address that claimed the transfer
        amount: u64,          // Amount claimed
        claimed_at: u64,      // Claim timestamp
    }

    /// Emitted when an expired MOVE transfer is automatically refunded to sender.
    #[event]
    struct TransferExpiredRefundEvent has drop, store {
        sender: address,       // Address receiving the refund
        amount: u64,          // Amount refunded
        refunded_at: u64,     // Refund timestamp
    }

    /// Emitted when sender manually cancels an unclaimed MOVE transfer.
    #[event]
    struct TransferCancelledEvent has drop, store {
        sender: address,       // Address that cancelled
        amount: u64,          // Amount refunded
        cancelled_at: u64,    // Cancellation timestamp
    }

    /// Emitted when a new Fungible Asset transfer is created.
    #[event]
    struct FATransferCreatedEvent has drop, store {
        sender: address,           // Address that created the transfer
        code: String,             // Encrypted claim code
        asset_metadata: address,  // FA metadata object address
        amount: u64,              // Amount of FA tokens
        created_at: u64,          // Creation timestamp
        expiration: u64,          // Expiration timestamp
    }

    /// Emitted when a Fungible Asset transfer is successfully claimed.
    #[event]
    struct FATransferClaimedEvent has drop, store {
        sender: address,           // Original sender
        recipient: address,        // Address that claimed the transfer
        asset_metadata: address,   // FA metadata object address
        amount: u64,              // Amount claimed
        claimed_at: u64,          // Claim timestamp
    }

    /// Emitted when an expired FA transfer is automatically refunded to sender.
    #[event]
    struct FATransferExpiredRefundEvent has drop, store {
        sender: address,           // Address receiving the refund
        asset_metadata: address,   // FA metadata object address
        amount: u64,              // Amount refunded
        refunded_at: u64,         // Refund timestamp
    }

    /// Emitted when sender manually cancels an unclaimed FA transfer.
    #[event]
    struct FATransferCancelledEvent has drop, store {
        sender: address,           // Address that cancelled
        asset_metadata: address,   // FA metadata object address
        amount: u64,              // Amount refunded
        cancelled_at: u64,        // Cancellation timestamp
    }

    // ==================== ERROR CODES ====================

    /// Registry resource doesn't exist at module address
    const E_REGISTRY_NOT_INITIALIZED: u64 = 1;
    /// The provided claim code doesn't match any transfer
    const E_CODE_NOT_FOUND: u64 = 2;
    /// Transfer has expired (unused, kept for compatibility)
    const E_EXPIRED: u64 = 3;
    /// Caller is not the original sender of the transfer
    const E_NOT_SENDER: u64 = 4;
    /// Transfer amount must be greater than zero
    const E_INVALID_AMOUNT: u64 = 5;
    /// Expiration time must be greater than zero
    const E_INVALID_EXPIRATION: u64 = 6;

    // ==================== INITIALIZATION ====================

    /// Automatically called when the module is first published.
    /// Sets up the resource account for FA escrow and initializes the global registry.
    ///
    /// @param deployer - The account publishing this module (becomes @sendasset_system)
    fun init_module(deployer: &signer) {
        // Create a dedicated resource account for holding Fungible Assets
        // This account is deterministically derived from the seed "fa_escrow"
        let (_resource_signer, signer_cap) = account::create_resource_account(deployer, b"fa_escrow");

        // Store the SignerCapability so we can sign transactions from the resource account later
        move_to(deployer, ResourceAccountCap { signer_cap });

        // Note: Primary stores for FAs will be automatically created when FAs are first deposited

        // Initialize the global registry that will store all transfer data
        let registry = GlobalRegistry {
            transfers: table::new(),          // Empty table for MOVE transfers
            fa_transfers: table::new(),       // Empty table for FA transfers
            sender_transfers: table::new(),   // Empty sender index
            counter: 0,                       // Start counter at zero
        };
        move_to(deployer, registry);
    }

    // ==================== HELPER FUNCTIONS ====================

    /// Hashes a claim code string using Keccak256.
    /// Used to create storage keys while keeping codes private.
    ///
    /// @param code - The claim code to hash
    /// @return - 32-byte Keccak256 hash
    fun hash_code(code: &String): vector<u8> {
        let code_bytes = *string::bytes(code);
        aptos_hash::keccak256(code_bytes)
    }

    /// Encrypts a claim code using XOR cipher with the sender's address.
    /// This provides basic obfuscation so codes aren't transmitted in plaintext.
    ///
    /// @param code - The plaintext code to encrypt
    /// @param sender - Sender's address used as encryption key
    /// @return - Hex-encoded encrypted string
    fun encrypt_code(code: &String, sender: address): String {
        let code_bytes = *string::bytes(code);
        let sender_bytes = bcs::to_bytes(&sender);

        // XOR each byte of the code with the corresponding byte from sender address
        let encrypted = vector::empty<u8>();
        let code_len = vector::length(&code_bytes);
        let sender_len = vector::length(&sender_bytes);

        let i = 0;
        while (i < code_len) {
            let code_byte = *vector::borrow(&code_bytes, i);
            let sender_byte = *vector::borrow(&sender_bytes, i % sender_len);  // Wrap around if needed
            vector::push_back(&mut encrypted, code_byte ^ sender_byte);        // XOR operation
            i = i + 1;
        };

        // Convert encrypted bytes to hex string for clean display
        let hex_chars = b"0123456789abcdef";
        let hex_result = vector::empty<u8>();
        let j = 0;
        while (j < vector::length(&encrypted)) {
            let byte = *vector::borrow(&encrypted, j);
            // Each byte becomes 2 hex characters (high nibble, low nibble)
            vector::push_back(&mut hex_result, *vector::borrow(&hex_chars, ((byte / 16) as u64)));
            vector::push_back(&mut hex_result, *vector::borrow(&hex_chars, ((byte % 16) as u64)));
            j = j + 1;
        };

        string::utf8(hex_result)
    }

    /// Generates a unique claim code by hashing sender + timestamp + counter.
    /// Returns a 12-character hex string that's easy to share.
    ///
    /// @param sender - Address creating the transfer
    /// @param timestamp - Current timestamp in seconds
    /// @param counter - Monotonic counter for uniqueness
    /// @return - 12-character hex string (e.g., "a3f2d8b9c1e4")
    fun generate_unique_code(sender: address, timestamp: u64, counter: u64): String {
        // Combine all inputs into one byte vector for hashing
        let combined = vector::empty<u8>();

        // Append sender address bytes
        let sender_bytes = bcs::to_bytes(&sender);
        vector::append(&mut combined, sender_bytes);

        // Append timestamp bytes
        let timestamp_bytes = bcs::to_bytes(&timestamp);
        vector::append(&mut combined, timestamp_bytes);

        // Append counter bytes for guaranteed uniqueness
        let counter_bytes = bcs::to_bytes(&counter);
        vector::append(&mut combined, counter_bytes);

        // Hash the combined data to get a pseudorandom result
        let hash = aptos_hash::keccak256(combined);

        // Take first 6 bytes (48 bits) and convert to 12 hex characters
        let hex_chars = b"0123456789abcdef";
        let code_str = vector::empty<u8>();

        let i = 0;
        while (i < 6 && i < vector::length(&hash)) {
            let byte = *vector::borrow(&hash, i);
            vector::push_back(&mut code_str, *vector::borrow(&hex_chars, ((byte / 16) as u64)));
            vector::push_back(&mut code_str, *vector::borrow(&hex_chars, ((byte % 16) as u64)));
            i = i + 1;
        };

        string::utf8(code_str)
    }

    // ==================== MOVE TOKEN TRANSFER FUNCTIONS ====================

    /// Creates a new MOVE token transfer with an auto-generated claim code.
    /// Coins are withdrawn from sender and escrowed until claimed or cancelled.
    ///
    /// @param sender - Account creating the transfer (coins withdrawn from here)
    /// @param amount - Amount of MOVE tokens to transfer (in octas, 1 MOVE = 100000000 octas)
    /// @param expiration_seconds - How long until transfer expires (in seconds)
    ///
    /// Emits: TransferCreatedEvent with encrypted claim code
    /// Aborts: E_INVALID_AMOUNT if amount is 0
    /// Aborts: E_INVALID_EXPIRATION if expiration_seconds is 0
    /// Aborts: E_REGISTRY_NOT_INITIALIZED if module not properly initialized
    public entry fun create_transfer(
        sender: &signer,
        amount: u64,
        expiration_seconds: u64,
    ) acquires GlobalRegistry {
        let sender_addr = signer::address_of(sender);
        let now = timestamp::now_seconds();
        let registry_addr = @sendasset_system;

        // Validate inputs - prevent zero amount or expiration
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(expiration_seconds > 0, E_INVALID_EXPIRATION);

        // Ensure the registry was initialized during module deployment
        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global_mut<GlobalRegistry>(registry_addr);

        // Generate a unique 12-character claim code
        let code = generate_unique_code(sender_addr, now, registry.counter);
        registry.counter = registry.counter + 1;  // Increment for next transfer

        // Hash the plaintext code to use as storage key
        let code_hash = hash_code(&code);

        // Withdraw coins from sender's account and hold them in escrow
        let coins = coin::withdraw<AptosCoin>(sender, amount);

        // Create the transfer record with escrowed coins
        let transfer = TokenTransfer {
            sender: sender_addr,
            coins,
            created_at: now,
            expiration: now + expiration_seconds,
        };

        // Store transfer in the global table using code hash as key
        table::add(&mut registry.transfers, code_hash, transfer);

        // Add this transfer to the sender's index for tracking
        if (!table::contains(&registry.sender_transfers, sender_addr)) {
            table::add(&mut registry.sender_transfers, sender_addr, vector::empty<vector<u8>>());
        };
        let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, sender_addr);
        vector::push_back(sender_hashes, code_hash);

        // Encrypt the code before emitting it in the event
        let encrypted_code = encrypt_code(&code, sender_addr);

        // Emit event so frontend can capture the encrypted code
        event::emit(TransferCreatedEvent {
            sender: sender_addr,
            code: encrypted_code,
            amount,
            created_at: now,
            expiration: now + expiration_seconds,
        });
    }

    /// Claims a MOVE token transfer using the unique claim code.
    /// If expired, automatically refunds to original sender instead.
    ///
    /// @param recipient - Account claiming the transfer
    /// @param code - The 12-character claim code (plaintext, not encrypted)
    ///
    /// Emits: TransferClaimedEvent if successful claim
    /// Emits: TransferExpiredRefundEvent if transfer expired
    /// Aborts: E_REGISTRY_NOT_INITIALIZED if module not initialized
    /// Aborts: E_CODE_NOT_FOUND if code doesn't match any transfer
    public entry fun claim_transfer(
        recipient: &signer,
        code: String,
    ) acquires GlobalRegistry {
        let recipient_addr = signer::address_of(recipient);
        let now = timestamp::now_seconds();
        let registry_addr = @sendasset_system;

        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global_mut<GlobalRegistry>(registry_addr);

        // Hash the provided code to find the transfer
        let code_hash = hash_code(&code);

        // Verify this code corresponds to an existing transfer
        assert!(table::contains(&registry.transfers, code_hash), E_CODE_NOT_FOUND);

        // Remove transfer from storage and destructure it
        let TokenTransfer {
            sender: original_sender,
            coins,
            created_at: _created,
            expiration
        } = table::remove(&mut registry.transfers, code_hash);

        let amount = coin::value(&coins);

        // Check if transfer has expired
        if (now > expiration) {
            // EXPIRED: Refund coins back to original sender
            coin::deposit(original_sender, coins);

            // Clean up sender's index
            if (table::contains(&registry.sender_transfers, original_sender)) {
                let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, original_sender);
                let (found, index) = vector::index_of(sender_hashes, &code_hash);
                if (found) {
                    vector::remove(sender_hashes, index);
                };
            };

            event::emit(TransferExpiredRefundEvent {
                sender: original_sender,
                amount,
                refunded_at: now,
            });
        } else {
            // VALID: Transfer coins to recipient
            coin::deposit(recipient_addr, coins);

            // Clean up sender's index
            if (table::contains(&registry.sender_transfers, original_sender)) {
                let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, original_sender);
                let (found, index) = vector::index_of(sender_hashes, &code_hash);
                if (found) {
                    vector::remove(sender_hashes, index);
                };
            };

            event::emit(TransferClaimedEvent {
                sender: original_sender,
                recipient: recipient_addr,
                amount,
                claimed_at: now,
            });
        };
    }

    /// Allows the original sender to cancel an unclaimed transfer and get refund.
    /// Only the sender who created the transfer can cancel it.
    ///
    /// @param sender - Must be the original sender of the transfer
    /// @param code - The 12-character claim code
    ///
    /// Emits: TransferCancelledEvent
    /// Aborts: E_REGISTRY_NOT_INITIALIZED if module not initialized
    /// Aborts: E_CODE_NOT_FOUND if code doesn't match any transfer
    /// Aborts: E_NOT_SENDER if caller is not the original sender
    public entry fun cancel_transfer(
        sender: &signer,
        code: String,
    ) acquires GlobalRegistry {
        let sender_addr = signer::address_of(sender);
        let now = timestamp::now_seconds();
        let registry_addr = @sendasset_system;

        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global_mut<GlobalRegistry>(registry_addr);

        // Hash the code to find the transfer
        let code_hash = hash_code(&code);

        // Verify transfer exists
        assert!(table::contains(&registry.transfers, code_hash), E_CODE_NOT_FOUND);

        // Verify caller is the original sender (only sender can cancel)
        let transfer = table::borrow(&registry.transfers, code_hash);
        assert!(transfer.sender == sender_addr, E_NOT_SENDER);

        // Remove and destructure the transfer
        let TokenTransfer {
            sender: _sender,
            coins,
            created_at: _created,
            expiration: _exp
        } = table::remove(&mut registry.transfers, code_hash);

        let amount = coin::value(&coins);

        // Return coins to the sender
        coin::deposit(sender_addr, coins);

        // Clean up sender's index
        if (table::contains(&registry.sender_transfers, sender_addr)) {
            let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, sender_addr);
            let (found, index) = vector::index_of(sender_hashes, &code_hash);
            if (found) {
                vector::remove(sender_hashes, index);
            };
        };

        event::emit(TransferCancelledEvent {
            sender: sender_addr,
            amount,
            cancelled_at: now,
        });
    }

    // ==================== VIEW FUNCTIONS (MOVE TOKENS) ====================

    /// Retrieves details of a MOVE token transfer without modifying state.
    /// Returns: (sender_address, amount, created_timestamp, expiration_timestamp)
    #[view]
    public fun get_transfer(code: String): (address, u64, u64, u64) acquires GlobalRegistry {
        let registry_addr = @sendasset_system;
        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        let code_hash = hash_code(&code);
        assert!(table::contains(&registry.transfers, code_hash), E_CODE_NOT_FOUND);

        let transfer = table::borrow(&registry.transfers, code_hash);
        let amount = coin::value(&transfer.coins);

        (transfer.sender, amount, transfer.created_at, transfer.expiration)
    }

    /// Checks if a claim code corresponds to an existing MOVE transfer.
    /// Returns false if registry doesn't exist or code not found.
    #[view]
    public fun check_code_exists(code: String): bool acquires GlobalRegistry {
        let registry_addr = @sendasset_system;

        if (!exists<GlobalRegistry>(registry_addr)) {
            return false
        };

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        let code_hash = hash_code(&code);
        table::contains(&registry.transfers, code_hash)
    }

    /// Checks if a MOVE transfer is claimable (exists and not expired).
    /// Returns true only if transfer exists and current time <= expiration.
    #[view]
    public fun is_transfer_claimable(code: String): bool acquires GlobalRegistry {
        let registry_addr = @sendasset_system;

        if (!exists<GlobalRegistry>(registry_addr)) {
            return false
        };

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        let code_hash = hash_code(&code);

        if (!table::contains(&registry.transfers, code_hash)) {
            return false
        };

        let transfer = table::borrow(&registry.transfers, code_hash);
        let now = timestamp::now_seconds();

        now <= transfer.expiration
    }

    /// Returns the total number of transfers created (both MOVE and FA).
    /// This is a monotonically increasing counter.
    #[view]
    public fun get_total_transfers(): u64 acquires GlobalRegistry {
        let registry_addr = @sendasset_system;

        if (!exists<GlobalRegistry>(registry_addr)) {
            return 0
        };

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        registry.counter
    }

    // ==================== FUNGIBLE ASSET (FA) TRANSFER FUNCTIONS ====================

    /// Helper function to compute the resource account address for FA escrow.
    /// The resource account is deterministically derived from module address + seed.
    fun get_resource_account_address(): address {
        account::create_resource_address(&@sendasset_system, b"fa_escrow")
    }

    /// Creates a new Fungible Asset transfer with auto-generated claim code.
    /// FA tokens are transferred to the resource account for escrow.
    ///
    /// @param sender - Account creating the transfer (FA withdrawn from here)
    /// @param asset_metadata - The FA metadata object identifying which asset to transfer
    /// @param amount - Amount of FA tokens to transfer
    /// @param expiration_seconds - How long until transfer expires (in seconds)
    ///
    /// Emits: FATransferCreatedEvent with encrypted claim code
    public entry fun create_fa_transfer(
        sender: &signer,
        asset_metadata: Object<Metadata>,
        amount: u64,
        expiration_seconds: u64,
    ) acquires GlobalRegistry {
        let sender_addr = signer::address_of(sender);
        let now = timestamp::now_seconds();
        let registry_addr = @sendasset_system;

        // Validate inputs
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(expiration_seconds > 0, E_INVALID_EXPIRATION);

        // Registry should already exist from init_module
        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global_mut<GlobalRegistry>(registry_addr);

        // Generate unique code
        let code = generate_unique_code(sender_addr, now, registry.counter);
        registry.counter = registry.counter + 1;

        // Hash the code for storage
        let code_hash = hash_code(&code);

        // Get resource account address
        let resource_addr = get_resource_account_address();

        // Transfer FA from sender to resource account's primary store
        primary_fungible_store::transfer(sender, asset_metadata, resource_addr, amount);

        // Store transfer info
        let transfer_info = FATransferInfo {
            sender: sender_addr,
            asset_metadata: object::object_address(&asset_metadata),
            amount,
            created_at: now,
            expiration: now + expiration_seconds,
        };

        table::add(&mut registry.fa_transfers, code_hash, transfer_info);

        // Add hash to sender's index
        if (!table::contains(&registry.sender_transfers, sender_addr)) {
            table::add(&mut registry.sender_transfers, sender_addr, vector::empty<vector<u8>>());
        };
        let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, sender_addr);
        vector::push_back(sender_hashes, code_hash);

        // Encrypt code before emitting
        let encrypted_code = encrypt_code(&code, sender_addr);

        // Emit event with encrypted code
        event::emit(FATransferCreatedEvent {
            sender: sender_addr,
            code: encrypted_code,
            asset_metadata: object::object_address(&asset_metadata),
            amount,
            created_at: now,
            expiration: now + expiration_seconds,
        });
    }

    /// Claims a Fungible Asset transfer using the unique claim code.
    /// FA tokens are transferred from resource account to recipient.
    /// If expired, automatically refunds to original sender instead.
    ///
    /// Emits: FATransferClaimedEvent or FATransferExpiredRefundEvent
    public entry fun claim_fa_transfer(
        recipient: &signer,
        code: String,
    ) acquires GlobalRegistry, ResourceAccountCap {
        let recipient_addr = signer::address_of(recipient);
        let now = timestamp::now_seconds();
        let registry_addr = @sendasset_system;

        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global_mut<GlobalRegistry>(registry_addr);

        // Hash the code to lookup
        let code_hash = hash_code(&code);

        // Check if code exists in FA transfers
        assert!(table::contains(&registry.fa_transfers, code_hash), E_CODE_NOT_FOUND);

        // Remove transfer info
        let FATransferInfo {
            sender: original_sender,
            asset_metadata,
            amount,
            created_at: _created,
            expiration
        } = table::remove(&mut registry.fa_transfers, code_hash);

        // Get resource account signer
        let resource_cap = borrow_global<ResourceAccountCap>(registry_addr);
        let resource_signer = account::create_signer_with_capability(&resource_cap.signer_cap);

        let metadata_obj = object::address_to_object<Metadata>(asset_metadata);

        // Check if expired - auto-refund to sender
        if (now > expiration) {
            // Refund to original sender
            primary_fungible_store::transfer(&resource_signer, metadata_obj, original_sender, amount);

            // Remove hash from sender's index
            if (table::contains(&registry.sender_transfers, original_sender)) {
                let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, original_sender);
                let (found, index) = vector::index_of(sender_hashes, &code_hash);
                if (found) {
                    vector::remove(sender_hashes, index);
                };
            };

            event::emit(FATransferExpiredRefundEvent {
                sender: original_sender,
                asset_metadata,
                amount,
                refunded_at: now,
            });
        } else {
            // Transfer to recipient
            primary_fungible_store::transfer(&resource_signer, metadata_obj, recipient_addr, amount);

            // Remove hash from sender's index
            if (table::contains(&registry.sender_transfers, original_sender)) {
                let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, original_sender);
                let (found, index) = vector::index_of(sender_hashes, &code_hash);
                if (found) {
                    vector::remove(sender_hashes, index);
                };
            };

            event::emit(FATransferClaimedEvent {
                sender: original_sender,
                recipient: recipient_addr,
                asset_metadata,
                amount,
                claimed_at: now,
            });
        };
    }

    /// Allows the original sender to cancel an unclaimed FA transfer and get refund.
    /// FA tokens are transferred from resource account back to sender.
    ///
    /// Emits: FATransferCancelledEvent
    public entry fun cancel_fa_transfer(
        sender: &signer,
        code: String,
    ) acquires GlobalRegistry, ResourceAccountCap {
        let sender_addr = signer::address_of(sender);
        let now = timestamp::now_seconds();
        let registry_addr = @sendasset_system;

        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global_mut<GlobalRegistry>(registry_addr);

        // Hash the code to lookup
        let code_hash = hash_code(&code);

        // Check if code exists
        assert!(table::contains(&registry.fa_transfers, code_hash), E_CODE_NOT_FOUND);

        // Borrow to check sender
        let transfer = table::borrow(&registry.fa_transfers, code_hash);
        assert!(transfer.sender == sender_addr, E_NOT_SENDER);

        // Remove transfer info
        let FATransferInfo {
            sender: _sender,
            asset_metadata,
            amount,
            created_at: _created,
            expiration: _exp
        } = table::remove(&mut registry.fa_transfers, code_hash);

        // Get resource account signer
        let resource_cap = borrow_global<ResourceAccountCap>(registry_addr);
        let resource_signer = account::create_signer_with_capability(&resource_cap.signer_cap);

        // Refund FA from resource account back to sender
        let metadata_obj = object::address_to_object<Metadata>(asset_metadata);
        primary_fungible_store::transfer(&resource_signer, metadata_obj, sender_addr, amount);

        // Remove hash from sender's index
        if (table::contains(&registry.sender_transfers, sender_addr)) {
            let sender_hashes = table::borrow_mut(&mut registry.sender_transfers, sender_addr);
            let (found, index) = vector::index_of(sender_hashes, &code_hash);
            if (found) {
                vector::remove(sender_hashes, index);
            };
        };

        event::emit(FATransferCancelledEvent {
            sender: sender_addr,
            asset_metadata,
            amount,
            cancelled_at: now,
        });
    }

    // ==================== VIEW FUNCTIONS (FUNGIBLE ASSETS) ====================

    /// Retrieves details of a Fungible Asset transfer without modifying state.
    /// Returns: (sender, asset_metadata_address, amount, created_timestamp, expiration_timestamp)
    #[view]
    public fun get_fa_transfer(code: String): (address, address, u64, u64, u64) acquires GlobalRegistry {
        let registry_addr = @sendasset_system;
        assert!(exists<GlobalRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        let code_hash = hash_code(&code);
        assert!(table::contains(&registry.fa_transfers, code_hash), E_CODE_NOT_FOUND);

        let transfer = table::borrow(&registry.fa_transfers, code_hash);

        (transfer.sender, transfer.asset_metadata, transfer.amount, transfer.created_at, transfer.expiration)
    }

    /// Checks if a claim code corresponds to an existing FA transfer.
    /// Returns false if registry doesn't exist or code not found.
    #[view]
    public fun check_fa_code_exists(code: String): bool acquires GlobalRegistry {
        let registry_addr = @sendasset_system;

        if (!exists<GlobalRegistry>(registry_addr)) {
            return false
        };

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        let code_hash = hash_code(&code);
        table::contains(&registry.fa_transfers, code_hash)
    }

    /// Checks if an FA transfer is claimable (exists and not expired).
    /// Returns true only if transfer exists and current time <= expiration.
    #[view]
    public fun is_fa_transfer_claimable(code: String): bool acquires GlobalRegistry {
        let registry_addr = @sendasset_system;

        if (!exists<GlobalRegistry>(registry_addr)) {
            return false
        };

        let registry = borrow_global<GlobalRegistry>(registry_addr);
        let code_hash = hash_code(&code);

        if (!table::contains(&registry.fa_transfers, code_hash)) {
            return false
        };

        let transfer = table::borrow(&registry.fa_transfers, code_hash);
        let now = timestamp::now_seconds();

        now <= transfer.expiration
    }

    /// Returns the address of the resource account used for FA escrow.
    /// Useful for checking the escrow account's balance or permissions.
    #[view]
    public fun get_resource_escrow_address(): address {
        get_resource_account_address()
    }
}
