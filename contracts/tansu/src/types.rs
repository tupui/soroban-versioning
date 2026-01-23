use soroban_sdk::{Address, Bytes, BytesN, String, Vec, contracttype};

// Constants
pub const TIMELOCK_DELAY: u64 = 24 * 3600; // 24 hours in seconds

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Contract {
    pub address: Address,
    pub wasm_hash: Option<BytesN<32>>,
}

#[contracttype]
pub enum ContractKey {
    DomainContract,     // Address and wasm hash of the SorobanDomain contract
    CollateralContract, // Collateral asset contract address
}

#[contracttype]
pub enum DataKey {
    Member(Address), // Member of the DAO, address
    Paused,          // Contract pause state
    UpgradeProposal, // Pending upgrade proposal
    AdminsConfig,    // Admin configuration for upgrades and other admin operations
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Badges {
    pub developer: Vec<Address>,
    pub triage: Vec<Address>,
    pub community: Vec<Address>,
    pub verified: Vec<Address>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Badge {
    Developer = 10_000_000,
    Triage = 5_000_000,
    Community = 1_000_000,
    Verified = 500_000, // have a soroban domain
    Default = 1,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ProjectBadges {
    pub project: Bytes,
    pub badges: Vec<Badge>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Member {
    pub projects: Vec<ProjectBadges>,
    pub meta: String,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Cancelled,
    Malicious,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Vote {
    PublicVote(PublicVote),
    AnonymousVote(AnonymousVote),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum VoteChoice {
    Approve,
    Reject,
    Abstain,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct PublicVote {
    pub address: Address,
    pub weight: u32,
    pub vote_choice: VoteChoice,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct AnonymousVote {
    pub address: Address,
    pub weight: u32,
    pub encrypted_seeds: Vec<String>,
    pub encrypted_votes: Vec<String>,
    pub commitments: Vec<BytesN<96>>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct VoteData {
    pub voting_ends_at: u64,
    pub public_voting: bool,
    pub votes: Vec<Vote>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct AnonymousVoteConfig {
    pub vote_generator_point: BytesN<96>,
    pub seed_generator_point: BytesN<96>,
    pub public_key: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AdminsConfig {
    pub threshold: u32,       // M-of-N threshold (e.g., 2 for 2-of-3)
    pub admins: Vec<Address>, // List of authorized admins
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct UpgradeProposal {
    pub wasm_hash: BytesN<32>,
    pub executable_at: u64,
    pub approvals: Vec<Address>,
    pub admins_config: AdminsConfig,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub proposer: Address,
    pub ipfs: String,
    pub vote_data: VoteData,
    pub status: ProposalStatus,
    pub outcomes_contract: Option<Address>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Dao {
    pub proposals: Vec<Proposal>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ProjectKey {
    Key(Bytes),      // UUID of the project from keccak256(name)
    Badges(Bytes),   // badges of the project
    LastHash(Bytes), // last hash of the project
    Dao(Bytes, u32), // Decentralized organization, pagination
    DaoTotalProposals(Bytes),
    AnonymousVoteConfig(Bytes),
    ProjectKeys(u32), // List of project keys, pagination
    TotalProjects,    // Total number of projects
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Config {
    pub url: String,  // link to VCS
    pub ipfs: String, // CID of the tansu.toml file with metadata
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Project {
    pub name: String,
    pub config: Config,
    pub maintainers: Vec<Address>,
    pub sub_projects: Option<Vec<Bytes>>, // If not empty, this project is an organization
}
