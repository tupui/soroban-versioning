use soroban_sdk::{Address, BytesN, Env, String, contractimpl, panic_with_error, vec};

use crate::{Tansu, TansuArgs, TansuClient, TansuTrait, events, types, validate_contract};

#[contractimpl]
impl TansuTrait for Tansu {
    /// Initialize the Tansu contract with admin configuration.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - The admin address
    fn __constructor(env: Env, admin: Address) {
        env.storage()
            .instance()
            .set(&types::DataKey::Paused, &false);

        // admin as sole admin (threshold = 1)
        let admins_config = types::AdminsConfig {
            threshold: 1,
            admins: vec![&env, admin.clone()],
        };
        env.storage()
            .instance()
            .set(&types::DataKey::AdminsConfig, &admins_config);

        Self::pause(env, admin, true);
    }

    /// Pause or unpause the contract (emergency stop.)
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - The admin address
    /// * `paused` - Pause or unpause the contract operations which change
    /// ledger states.
    fn pause(env: Env, admin: Address, paused: bool) {
        auth_admin(&env, &admin);

        let paused_state = env
            .storage()
            .instance()
            .get(&types::DataKey::Paused)
            .unwrap_or(false);

        if paused == paused_state {
            // Already in the desired state, idempotent call
            return;
        }

        env.storage()
            .instance()
            .set(&types::DataKey::Paused, &paused);

        events::ContractPaused { paused, admin }.publish(&env);
    }

    /// Require that the contract is not paused, panic if it is
    ///
    /// # Panics
    /// * If the contract is paused.
    fn require_not_paused(env: Env) {
        let paused = env
            .storage()
            .instance()
            .get(&types::DataKey::Paused)
            .unwrap_or(false);

        if paused {
            panic_with_error!(&env, &crate::errors::ContractErrors::ContractPaused);
        }
    }

    /// Get current administrators configuration.
    ///
    /// # Arguments
    /// * `env` - The environment object
    ///
    /// # Returns
    /// * `types::AdminsConfig` - The administrators configuration
    fn get_admins_config(env: Env) -> types::AdminsConfig {
        env.storage()
            .instance()
            .get(&types::DataKey::AdminsConfig)
            .unwrap()
    }

    /// Set the Soroban Domain contract.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - The admin address
    /// * `domain_contract` - The new domain contract
    fn set_domain_contract(env: Env, admin: Address, domain_contract: types::Contract) {
        auth_admin(&env, &admin);

        validate_contract(&env, &domain_contract);

        env.storage()
            .instance()
            .set(&types::ContractKey::DomainContract, &domain_contract);

        events::ContractUpdated {
            admin,
            contract_key: String::from_str(&env, "domain"),
            address: domain_contract.address,
            wasm_hash: domain_contract.wasm_hash,
        }
        .publish(&env);
    }

    /// Set the Collateral contract.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - The admin address
    /// * `collateral_contract` - The new collateral contract
    fn set_collateral_contract(env: Env, admin: Address, collateral_contract: types::Contract) {
        auth_admin(&env, &admin);

        validate_contract(&env, &collateral_contract);

        env.storage().instance().set(
            &types::ContractKey::CollateralContract,
            &collateral_contract,
        );

        events::ContractUpdated {
            admin,
            contract_key: String::from_str(&env, "collateral"),
            address: collateral_contract.address,
            wasm_hash: collateral_contract.wasm_hash,
        }
        .publish(&env);
    }

    /// Propose a contract upgrade.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - An admin address
    /// * `new_wasm_hash` - The new WASM hash
    /// * `new_admins_config` - Optional new admin configuration (None to keep current)
    ///
    /// # Panics
    /// * If the admin is not authorized
    /// * If there is already an existing proposal (cancel the previous first)
    fn propose_upgrade(
        env: Env,
        admin: Address,
        new_wasm_hash: BytesN<32>,
        new_admins_config: Option<types::AdminsConfig>,
    ) {
        auth_admin(&env, &admin);

        if env
            .storage()
            .instance()
            .has(&types::DataKey::UpgradeProposal)
        {
            panic_with_error!(&env, &crate::errors::ContractErrors::UpgradeError);
        }

        let executable_at = env.ledger().timestamp() + types::TIMELOCK_DELAY;
        let approvals = vec![&env, admin.clone()];
        let admins_config =
            new_admins_config.unwrap_or_else(|| Self::get_admins_config(env.clone()));

        let upgrade_proposal = types::UpgradeProposal {
            wasm_hash: new_wasm_hash.clone(),
            executable_at,
            approvals,
            admins_config,
        };

        env.storage()
            .instance()
            .set(&types::DataKey::UpgradeProposal, &upgrade_proposal);

        events::UpgradeProposed {
            admin,
            wasm_hash: new_wasm_hash.into(),
            executable_at,
        }
        .publish(&env);
    }

    /// Approve an upgrade proposal
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - An admin address
    ///
    /// # Panics
    /// * If the admin is not authorized
    /// * If the admin already approved
    /// * If there is no upgrade to approve
    fn approve_upgrade(env: Env, admin: Address) {
        let admins_config = auth_admin(&env, &admin);

        // Get upgrade proposal
        let mut upgrade_proposal: types::UpgradeProposal = env
            .storage()
            .instance()
            .get(&types::DataKey::UpgradeProposal)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &crate::errors::ContractErrors::UpgradeError)
            });

        // Prevent double approvals
        if upgrade_proposal.approvals.contains(admin.clone()) {
            panic_with_error!(&env, &crate::errors::ContractErrors::AlreadyVoted);
        } else {
            upgrade_proposal.approvals.push_back(admin.clone());
        }

        // Check if threshold reached
        let threshold_reached = upgrade_proposal.approvals.len() >= admins_config.threshold;

        // Save updated proposal
        env.storage()
            .instance()
            .set(&types::DataKey::UpgradeProposal, &upgrade_proposal);

        events::UpgradeApproved {
            admin,
            approvals_count: upgrade_proposal.approvals.len(),
            threshold_reached,
        }
        .publish(&env);
    }

    /// Execute or cancel upgrade proposal
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - An admin address
    /// * `accept` - true to accept and false to reject.
    ///
    /// Upgrades can always be cancelled but only executed if there are enough
    /// approvals and the timelock period is over.
    ///
    /// # Panics
    /// * If the admin is not authorized
    /// * If it is too early to execute
    /// * If there are not enough approvals
    /// * If there is no upgrade to execute
    fn finalize_upgrade(env: Env, admin: Address, accept: bool) {
        let admins_config = auth_admin(&env, &admin);

        let upgrade_proposal: types::UpgradeProposal = env
            .storage()
            .instance()
            .get(&types::DataKey::UpgradeProposal)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &crate::errors::ContractErrors::UpgradeError)
            });

        if accept {
            if (upgrade_proposal.approvals.len()) < admins_config.threshold {
                panic_with_error!(&env, &crate::errors::ContractErrors::UpgradeError);
            }

            if env.ledger().timestamp() < upgrade_proposal.executable_at {
                panic_with_error!(&env, &crate::errors::ContractErrors::ProposalVotingTime);
            }

            env.storage().instance().set(
                &types::DataKey::AdminsConfig,
                &upgrade_proposal.admins_config,
            );

            // Delete the proposal entirely
            env.storage()
                .instance()
                .remove(&types::DataKey::UpgradeProposal);

            // Update WASM and send a SYSTEM event
            env.deployer()
                .update_current_contract_wasm(upgrade_proposal.wasm_hash.clone());
        } else {
            // Delete the proposal entirely
            env.storage()
                .instance()
                .remove(&types::DataKey::UpgradeProposal);

            events::UpgradeCancelled {
                admin,
                wasm_hash: upgrade_proposal.wasm_hash.into(),
            }
            .publish(&env);
        }
    }

    /// Get upgrade proposal details
    fn get_upgrade_proposal(env: Env) -> types::UpgradeProposal {
        env.storage()
            .instance()
            .get(&types::DataKey::UpgradeProposal)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &crate::errors::ContractErrors::UpgradeError)
            })
    }

    /// Get the current version of the contract.
    ///
    /// # Returns
    /// * `u32` - The contract version number
    fn version() -> u32 {
        1
    }
}

/// Authenticate that the caller is an admin, panic if not
fn auth_admin(env: &Env, admin: &Address) -> types::AdminsConfig {
    admin.require_auth();
    let admins_config = Tansu::get_admins_config(env.clone());
    if !admins_config.admins.contains(admin) {
        panic_with_error!(&env, &crate::errors::ContractErrors::UnauthorizedSigner);
    }
    admins_config
}
