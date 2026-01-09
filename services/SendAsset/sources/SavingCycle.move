module sendasset_system::saving_cycle {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::object;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_CYCLE_NOT_FOUND: u64 = 1;
    const E_CYCLE_NOT_EXPIRED: u64 = 2;
    const E_CYCLE_EXPIRED: u64 = 3;
    const E_INSUFFICIENT_FUNDS: u64 = 4;
    const E_INVALID_DURATION: u64 = 5;
    const E_GOAL_NOT_REACHED: u64 = 6;
    const E_INVALID_PENALTY: u64 = 7;
    const E_CONTRACT_PAUSED: u64 = 8;
    const E_NOT_ADMIN: u64 = 9;
    const E_DEPOSIT_TOO_SMALL: u64 = 10;
    const E_DURATION_TOO_SHORT: u64 = 11;
    const E_DURATION_TOO_LONG: u64 = 12;
    const E_TOO_MANY_CYCLES: u64 = 13;
    const E_INVALID_ASSET: u64 = 14;
    const E_ZERO_AMOUNT: u64 = 15;
    const E_OVERFLOW: u64 = 16;
    const E_INVALID_START_TIME: u64 = 17;
    const E_INVALID_END_TIME: u64 = 18;
    const E_INVALID_AMOUNT: u64 = 19;

    /// Default early withdrawal penalty (5%)
    const DEFAULT_PENALTY_PERCENTAGE: u64 = 5;

    /// Minimum deposit to prevent spam (adjust based on FA decimals)
    const MIN_DEPOSIT_AMOUNT: u64 = 100;

    /// Minimum duration (1 day)
    const MIN_DURATION_DAYS: u64 = 1;

    /// Maximum duration (5 years = 1825 days)
    const MAX_DURATION_DAYS: u64 = 1825;

    /// Maximum cycles per user to prevent storage spam
    const MAX_CYCLES_PER_USER: u64 = 100;

    /// Maximum u64 value for overflow checks
    const MAX_U64: u64 = 18446744073709551615;

    /// Creation fee tiers
    const TIER1_THRESHOLD: u64 = 100_000000;  // 100 USDC (6 decimals)
    const TIER1_FLAT_FEE: u64 = 500000;       // 0.5 USDC
    const TIER2_FEE_BPS: u64 = 50;            // 0.5% in basis points
    const BASIS_POINTS: u64 = 10000;

    /// Penalty tier options (user selectable)
    const PENALTY_LOW: u64 = 3;
    const PENALTY_STANDARD: u64 = 5;
    const PENALTY_HIGH: u64 = 10;
    const PENALTY_MAXIMUM: u64 = 20;

    /// Protocol share of penalty (60% to protocol, 40% burned)
    const PENALTY_PROTOCOL_SHARE_BPS: u64 = 6000;

    /// Maximum creation fee (1000 USDC with 6 decimals)
    const MAX_FEE_AMOUNT: u64 = 1000_000000;

    /// Hardcoded allowed asset addresses (FA only)
    const ALLOWED_ASSET_ADDRESSES: vector<address> = vector[
        @0xb89077cfd2a82a0c1450534d49cfd5f2707643155273069bc23a912bcfefdee7,  // USDC
    ];

    /// Current contract version
    const CURRENT_VERSION: u8 = 1;

    /// Struct for a single saving cycle
    struct SavingCycle has store, drop {
        version: u8,  // Contract version for future upgrades
        name: String,
        description: String,
        start_time: u64,
        end_time: u64,
        asset_address: address,
        amount: u64,
        goal_amount: u64,  // Target amount to reach (0 for regular time-based)
        penalty_percentage: u64,  // Early withdrawal penalty (e.g., 5 for 5%)
    }

    /// Each user stores their saving cycles by unique id
    struct UserCycles has key {
        cycles: Table<u64, SavingCycle>,
        next_id: u64,
        active_count: u64,  // Track active cycles without iteration
    }

    /// Pause state for emergency situations
    struct PauseState has key {
        paused: bool,
        admin: address,
    }

    /// Fee accounting for transparency
    struct FeeAccounting has key {
        total_fees_collected: u64,
        fees_withdrawn: u64,
    }
    
    /// Global vault to isolate user savings from protocol fees
    struct VaultControl has key {
        vault_address: address,
        signer_cap: account::SignerCapability,
    }

    // Events
    #[event]
    struct CycleCreated has drop, store {
        user: address,
        cycle_id: u64,
        asset_address: address,
        initial_amount: u64,
        goal_amount: u64,
        duration_days: u64,
    }

    #[event]
    struct CycleTopUp has drop, store {
        user: address,
        cycle_id: u64,
        amount: u64,
        new_total: u64,
    }

    #[event]
    struct CycleClosed has drop, store {
        user: address,
        cycle_id: u64,
        final_amount: u64,
        completed: bool,  // true if goal reached or duration elapsed
    }

    #[event]
    struct EarlyWithdrawal has drop, store {
        user: address,
        cycle_id: u64,
        amount_withdrawn: u64,
        penalty_amount: u64,
        protocol_share: u64,
        burn_amount: u64,
    }

    #[event]
    struct ContractPaused has drop, store {
        admin: address,
        timestamp: u64,
    }

    #[event]
    struct ContractUnpaused has drop, store {
        admin: address,
        timestamp: u64,
    }

    #[event]
    struct CreationFeeCollected has drop, store {
        user: address,
        cycle_id: u64,
        fee_amount: u64,
        penalty_tier: u64,
    }

    #[event]
    struct FeesWithdrawn has drop, store {
        admin: address,
        asset_address: address,
        amount: u64,
        timestamp: u64,
    }

    /// Initialize pause state, fee accounting and vault on module deployment
    fun init_module(deployer: &signer) {
        move_to(deployer, PauseState {
            paused: false,
            admin: signer::address_of(deployer),
        });
        move_to(deployer, FeeAccounting {
            total_fees_collected: 0,
            fees_withdrawn: 0,
        });
        
        // Create a resource account for the vault
        let (vault_signer, vault_cap) = account::create_resource_account(deployer, b"SAVINGS_VAULT");
        move_to(deployer, VaultControl {
            vault_address: signer::address_of(&vault_signer),
            signer_cap: vault_cap,
        });
    }

    /// Check if contract is paused
    fun assert_not_paused() acquires PauseState {
        let pause_state = borrow_global<PauseState>(@sendasset_system);
        assert!(!pause_state.paused, E_CONTRACT_PAUSED);
    }

    /// Initialize UserCycles for a user if not present
    fun init_user(user: &signer) {
        let addr = signer::address_of(user);
        if (!exists<UserCycles>(addr)) {
            move_to(user, UserCycles {
                cycles: table::new<u64, SavingCycle>(),
                next_id: 0,
                active_count: 0,
            });
        }
    }

    /// Check for integer overflow
    fun safe_add(a: u64, b: u64): u64 {
        assert!(a <= MAX_U64 - b, E_OVERFLOW);
        a + b
    }

    /// Calculate creation fee based on deposit amount with max limit
    fun calculate_creation_fee(deposit_amount: u64): u64 {
        let fee = if (deposit_amount <= TIER1_THRESHOLD) {
            TIER1_FLAT_FEE
        } else {
            (deposit_amount * TIER2_FEE_BPS) / BASIS_POINTS
        };
        
        // Cap fee at maximum
        if (fee > MAX_FEE_AMOUNT) {
            MAX_FEE_AMOUNT
        } else {
            fee
        }
    }

    /// Validate penalty percentage
    fun validate_penalty(penalty: u64): bool {
        penalty == PENALTY_LOW || 
        penalty == PENALTY_STANDARD || 
        penalty == PENALTY_HIGH || 
        penalty == PENALTY_MAXIMUM
    }

    /// Create a new saving cycle with an initial deposit
    /// goal_amount: Set to 0 for regular time-based saving, or a target amount for goal-based saving
    public entry fun create_cycle(
        user: &signer,
        name: String,
        description: String,
        start_time: u64,
        end_time: u64,
        asset_address: address,
        deposit_amount: u64,
        goal_amount: u64,
        penalty_percentage: u64
    ) acquires UserCycles, PauseState, FeeAccounting, VaultControl {
        // Security checks
        assert_not_paused();
        assert!(deposit_amount >= MIN_DEPOSIT_AMOUNT, E_DEPOSIT_TOO_SMALL);
        assert!(deposit_amount > 0, E_ZERO_AMOUNT);
        
        // Timestamp validation
        let now = timestamp::now_seconds();
        assert!(start_time >= now, E_INVALID_START_TIME);
        assert!(end_time > start_time, E_INVALID_END_TIME);
        
        let duration_days = (end_time - start_time) / 86400;
        assert!(duration_days >= MIN_DURATION_DAYS, E_DURATION_TOO_SHORT);
        assert!(duration_days <= MAX_DURATION_DAYS, E_DURATION_TOO_LONG);
        assert!(vector::contains(&ALLOWED_ASSET_ADDRESSES, &asset_address), E_INVALID_ASSET);
        assert!(validate_penalty(penalty_percentage), E_INVALID_PENALTY);

        let addr = signer::address_of(user);

        // Initialize user cycles if needed
        if (!exists<UserCycles>(addr)) {
            init_user(user);
        };

        let user_cycles = borrow_global_mut<UserCycles>(addr);

        // Prevent storage spam
        assert!(user_cycles.active_count < MAX_CYCLES_PER_USER, E_TOO_MANY_CYCLES);

        // Calculate and deduct creation fee
        let fee_amount = calculate_creation_fee(deposit_amount);
        assert!(fee_amount <= deposit_amount, E_INVALID_AMOUNT);
        let net_deposit = deposit_amount - fee_amount;
        
        // Transfer FA from user: Split fee and saving
        let fa_metadata = object::address_to_object<Metadata>(asset_address);
        let vault_ctrl = borrow_global<VaultControl>(@sendasset_system);
        
        // Fee goes directly to deployer (contract address)
        primary_fungible_store::transfer(user, fa_metadata, @sendasset_system, fee_amount);
        // Saving goes to vault address
        primary_fungible_store::transfer(user, fa_metadata, vault_ctrl.vault_address, net_deposit);
        
        // Track fees for accounting
        let fee_accounting = borrow_global_mut<FeeAccounting>(@sendasset_system);
        fee_accounting.total_fees_collected = fee_accounting.total_fees_collected + fee_amount;

        // Create cycle
        let id = user_cycles.next_id;
        user_cycles.next_id = id + 1;
        user_cycles.active_count = user_cycles.active_count + 1;

        let cycle = SavingCycle {
            version: CURRENT_VERSION,
            name,
            description,
            start_time,
            end_time,
            asset_address,
            amount: net_deposit,
            goal_amount,
            penalty_percentage,
        };

        table::add(&mut user_cycles.cycles, id, cycle);

        // Emit event
        aptos_framework::event::emit(CycleCreated {
            user: addr,
            cycle_id: id,
            asset_address,
            initial_amount: deposit_amount,
            goal_amount,
            duration_days,
        });

        // Emit fee collection event
        aptos_framework::event::emit(CreationFeeCollected {
            user: addr,
            cycle_id: id,
            fee_amount,
            penalty_tier: penalty_percentage,
        });
    }

    /// Top up deposit into an existing cycle (by id)
    public entry fun top_up(
        user: &signer,
        cycle_id: u64,
        deposit_amount: u64
    ) acquires UserCycles, PauseState, VaultControl {
        // Security checks
        assert_not_paused();
        assert!(deposit_amount > 0, E_ZERO_AMOUNT);

        let addr = signer::address_of(user);
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);

        let user_cycles = borrow_global_mut<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow_mut(&mut user_cycles.cycles, cycle_id);

        // Only allow top up if cycle is not expired
        let now = timestamp::now_seconds();
        assert!(now < cycle.end_time, E_CYCLE_EXPIRED);

        // Overflow protection
        let new_amount = safe_add(cycle.amount, deposit_amount);

        // Transfer FA from user to vault
        let fa_metadata = object::address_to_object<Metadata>(cycle.asset_address);
        let vault_ctrl = borrow_global<VaultControl>(@sendasset_system);
        primary_fungible_store::transfer(user, fa_metadata, vault_ctrl.vault_address, deposit_amount);

        cycle.amount = new_amount;

        // Emit event
        aptos_framework::event::emit(CycleTopUp {
            user: addr,
            cycle_id,
            amount: deposit_amount,
            new_total: new_amount,
        });
    }

    /// Withdraw and delete cycle if conditions met:
    /// - Regular saving (goal_amount = 0): duration must elapse
    /// - Goal-based saving (goal_amount > 0): duration elapsed OR goal reached
    public entry fun close_cycle(
        user: &signer,
        cycle_id: u64
    ) acquires UserCycles, VaultControl {
        // Note: Allow closing even when paused (users can exit during emergency)
        let addr = signer::address_of(user);
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);

        let user_cycles = borrow_global_mut<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::remove(&mut user_cycles.cycles, cycle_id);
        user_cycles.active_count = user_cycles.active_count - 1;

        let now = timestamp::now_seconds();
        let duration_elapsed = now >= cycle.end_time;

        let completed;
        if (cycle.goal_amount == 0) {
            // Regular time-based saving: must wait for duration
            assert!(duration_elapsed, E_CYCLE_NOT_EXPIRED);
            completed = true;
        } else {
            // Goal-based saving: duration elapsed OR goal reached
            let goal_reached = cycle.amount >= cycle.goal_amount;
            assert!(duration_elapsed || goal_reached, E_CYCLE_NOT_EXPIRED);
            completed = duration_elapsed || goal_reached;
        };

        // Transfer FA from vault back to user
        let fa_metadata = object::address_to_object<Metadata>(cycle.asset_address);
        let vault_ctrl = borrow_global<VaultControl>(@sendasset_system);
        let vault_signer = account::create_signer_with_capability(&vault_ctrl.signer_cap);
        primary_fungible_store::transfer(&vault_signer, fa_metadata, addr, cycle.amount);

        // Emit event
        aptos_framework::event::emit(CycleClosed {
            user: addr,
            cycle_id,
            final_amount: cycle.amount,
            completed,
        });
    }

    /// Early withdrawal with penalty (penalty goes to module address)
    public entry fun early_withdraw(
        user: &signer,
        cycle_id: u64
    ) acquires UserCycles, VaultControl, FeeAccounting {
        // Note: Allow early withdrawal even when paused (users can exit during emergency)
        let addr = signer::address_of(user);
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);

        let user_cycles = borrow_global_mut<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::remove(&mut user_cycles.cycles, cycle_id);
        assert!(user_cycles.active_count > 0, E_CYCLE_NOT_FOUND);
        user_cycles.active_count = user_cycles.active_count - 1;

        // Calculate penalty amount
        let penalty_amount = (cycle.amount * cycle.penalty_percentage) / 100;
        let protocol_share = (penalty_amount * PENALTY_PROTOCOL_SHARE_BPS) / BASIS_POINTS;
        let burn_amount = penalty_amount - protocol_share;
        let withdrawal_amount = cycle.amount - penalty_amount;

        // Transfer withdrawal amount from vault to user
        let fa_metadata = object::address_to_object<Metadata>(cycle.asset_address);
        let vault_ctrl = borrow_global<VaultControl>(@sendasset_system);
        let vault_signer = account::create_signer_with_capability(&vault_ctrl.signer_cap);
        
        primary_fungible_store::transfer(&vault_signer, fa_metadata, addr, withdrawal_amount);
        
        // Transfer penalty from vault to deployer automatically
        primary_fungible_store::transfer(&vault_signer, fa_metadata, @sendasset_system, penalty_amount);
        
        // Track fees
        let fee_accounting = borrow_global_mut<FeeAccounting>(@sendasset_system);
        fee_accounting.total_fees_collected = fee_accounting.total_fees_collected + penalty_amount;

        // Emit event
        aptos_framework::event::emit(EarlyWithdrawal {
            user: addr,
            cycle_id,
            amount_withdrawn: withdrawal_amount,
            penalty_amount,
            protocol_share,
            burn_amount,
        });
    }

    /// Emergency pause - stops all new operations
    public entry fun emergency_pause(admin: &signer) acquires PauseState {
        let pause_state = borrow_global_mut<PauseState>(@sendasset_system);
        assert!(signer::address_of(admin) == pause_state.admin, E_NOT_ADMIN);
        pause_state.paused = true;

        aptos_framework::event::emit(ContractPaused {
            admin: signer::address_of(admin),
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Unpause contract after fixing issues
    public entry fun unpause(admin: &signer) acquires PauseState {
        let pause_state = borrow_global_mut<PauseState>(@sendasset_system);
        assert!(signer::address_of(admin) == pause_state.admin, E_NOT_ADMIN);
        pause_state.paused = false;

        aptos_framework::event::emit(ContractUnpaused {
            admin: signer::address_of(admin),
            timestamp: timestamp::now_seconds(),
        });
    }

    // Check if contract is currently paused
    #[view]
    public fun is_paused(): bool acquires PauseState {
        let pause_state = borrow_global<PauseState>(@sendasset_system);
        pause_state.paused
    }

    // Preview creation fee for a deposit amount
    #[view]
    public fun calculate_fee_preview(deposit_amount: u64): u64 {
        calculate_creation_fee(deposit_amount)
    }

    // Get protocol balance (funds at the contract address)
    #[view]
    public fun get_protocol_balance(asset_address: address): u64 {
        let fa_metadata = object::address_to_object<Metadata>(asset_address);
        primary_fungible_store::balance(@sendasset_system, fa_metadata)
    }

    // Get available penalty tiers
    #[view]
    public fun get_penalty_tiers(): vector<u64> {
        vector[PENALTY_LOW, PENALTY_STANDARD, PENALTY_HIGH, PENALTY_MAXIMUM]
    }

    // View function to get cycle details
    #[view]
    public fun get_cycle(addr: address, cycle_id: u64): (u8, String, String, u64, u64, address, u64, u64, u64) acquires UserCycles {
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);
        let user_cycles = borrow_global<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow(&user_cycles.cycles, cycle_id);
        (cycle.version, cycle.name, cycle.description, cycle.start_time, cycle.end_time, cycle.asset_address, cycle.amount, cycle.goal_amount, cycle.penalty_percentage)
    }

    // View function to check if cycle is expired
    #[view]
    public fun is_cycle_expired(addr: address, cycle_id: u64): bool acquires UserCycles {
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);
        let user_cycles = borrow_global<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow(&user_cycles.cycles, cycle_id);
        let now = timestamp::now_seconds();
        now >= cycle.end_time
    }

    // View function to check if goal is reached
    #[view]
    public fun is_goal_reached(addr: address, cycle_id: u64): bool acquires UserCycles {
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);
        let user_cycles = borrow_global<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow(&user_cycles.cycles, cycle_id);
        cycle.amount >= cycle.goal_amount
    }

    // View function to get goal progress percentage
    // Returns 0 for regular time-based savings (goal_amount = 0)
    #[view]
    public fun get_goal_progress(addr: address, cycle_id: u64): u64 acquires UserCycles {
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);
        let user_cycles = borrow_global<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow(&user_cycles.cycles, cycle_id);
        if (cycle.goal_amount == 0) {
            return 0
        };
        (cycle.amount * 100) / cycle.goal_amount
    }

    // View function to check saving mode type
    // Returns true if goal-based (goal_amount > 0), false if regular time-based (goal_amount = 0)
    #[view]
    public fun is_goal_based(addr: address, cycle_id: u64): bool acquires UserCycles {
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);
        let user_cycles = borrow_global<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow(&user_cycles.cycles, cycle_id);
        cycle.goal_amount > 0
    }

    // View function to get cycle version
    // Useful for checking compatibility with new features
    #[view]
    public fun get_cycle_version(addr: address, cycle_id: u64): u8 acquires UserCycles {
        assert!(exists<UserCycles>(addr), E_CYCLE_NOT_FOUND);
        let user_cycles = borrow_global<UserCycles>(addr);
        assert!(table::contains(&user_cycles.cycles, cycle_id), E_CYCLE_NOT_FOUND);

        let cycle = table::borrow(&user_cycles.cycles, cycle_id);
        cycle.version
    }

    // View function to get current contract version
    #[view]
    public fun get_contract_version(): u8 {
        CURRENT_VERSION
    }

    // View function to get all active cycles (not expired)
    #[view]
    public fun get_active_cycle_ids(addr: address): vector<u64> acquires UserCycles {
        if (!exists<UserCycles>(addr)) {
            return vector::empty<u64>()
        };

        let user_cycles = borrow_global<UserCycles>(addr);
        let result = vector::empty<u64>();
        let now = timestamp::now_seconds();

        let id = 0;
        while (id < user_cycles.next_id) {
            if (table::contains(&user_cycles.cycles, id)) {
                let cycle = table::borrow(&user_cycles.cycles, id);
                if (now < cycle.end_time) {
                    vector::push_back(&mut result, id);
                };
            };
            id = id + 1;
        };

        result
    }

    // View function to get all cycle ids (active and expired)
    #[view]
    public fun get_all_cycle_ids(addr: address): vector<u64> acquires UserCycles {
        if (!exists<UserCycles>(addr)) {
            return vector::empty<u64>()
        };

        let user_cycles = borrow_global<UserCycles>(addr);
        let result = vector::empty<u64>();

        let id = 0;
        while (id < user_cycles.next_id) {
            if (table::contains(&user_cycles.cycles, id)) {
                vector::push_back(&mut result, id);
            };
            id = id + 1;
        };

        result
    }

    // View function to get total amount saved for a specific asset
    #[view]
    public fun get_total_saved_by_asset(addr: address, asset_address: address): u64 acquires UserCycles {
        if (!exists<UserCycles>(addr)) {
            return 0
        };

        let user_cycles = borrow_global<UserCycles>(addr);
        let total = 0u64;

        let id = 0;
        while (id < user_cycles.next_id) {
            if (table::contains(&user_cycles.cycles, id)) {
                let cycle = table::borrow(&user_cycles.cycles, id);
                if (cycle.asset_address == asset_address) {
                    total = total + cycle.amount;
                };
            };
            id = id + 1;
        };

        total
    }

    // View function to get total amount saved across all assets
    #[view]
    public fun get_total_saved_all_assets(addr: address): u64 acquires UserCycles {
        if (!exists<UserCycles>(addr)) {
            return 0
        };

        let user_cycles = borrow_global<UserCycles>(addr);
        let total = 0u64;

        let id = 0;
        while (id < user_cycles.next_id) {
            if (table::contains(&user_cycles.cycles, id)) {
                let cycle = table::borrow(&user_cycles.cycles, id);
                total = total + cycle.amount;
            };
            id = id + 1;
        };

        total
    }
}
