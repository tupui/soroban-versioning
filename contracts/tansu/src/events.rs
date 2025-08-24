//! Event definitions for the Tansu contract.

use soroban_sdk::{Address, Bytes, String, contractevent};

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProjectRegistered {
    #[topic]
    pub project_key: Bytes,
    pub name: String,
    pub maintainer: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProjectConfigUpdated {
    #[topic]
    pub project_key: Bytes,
    pub maintainer: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Commit {
    #[topic]
    pub project_key: Bytes,
    pub hash: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberAdded {
    pub member_address: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BadgesUpdated {
    pub project_key: Bytes,
    pub maintainer: Address,
    pub member: Address,
    pub badges_count: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalCreated {
    #[topic]
    pub project_key: Bytes,
    pub title: String,
    pub proposer: Address,
    pub voting_ends_at: u64,
    pub public_voting: bool,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteCast {
    #[topic]
    pub project_key: Bytes,
    pub voter: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalExecuted {
    #[topic]
    pub project_key: Bytes,
    pub status: String,
    pub maintainer: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractPaused {
    pub paused: bool,
    pub admin: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DomainContractIdUpdated {
    pub admin: Address,
    pub domain_contract_id: Address,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UpgradeProposed {
    pub admin: Address,
    pub wasm_hash: Bytes,
    pub executable_at: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UpgradeApproved {
    pub admin: Address,
    pub approvals_count: u32,
    pub threshold_reached: bool,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UpgradeExecuted {
    pub admin: Address,
    pub new_wasm_hash: Bytes,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UpgradeCancelled {
    pub admin: Address,
    pub wasm_hash: Bytes,
}
