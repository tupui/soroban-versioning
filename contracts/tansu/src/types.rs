use soroban_sdk::{contracttype, Address, Bytes, BytesN, String, Vec};

#[contracttype]
pub enum DataKey {
    Admin, // Contract administrator
    AnonymousVoteConfig,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Cancelled,
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
    pub vote_choice: VoteChoice,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct AnonymousVote {
    pub address: Address,
    pub encrypted_seeds: Vec<String>,
    pub encrypted_votes: Vec<String>,
    pub commitments: Vec<BytesN<96>>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct VoteData {
    pub voting_ends_at: u64,
    pub public: bool, // Public or anonymous vote
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
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub ipfs: String,
    pub vote_data: VoteData,
    pub status: ProposalStatus,
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
    LastHash(Bytes), // last hash of the project
    Dao(Bytes, u32), // Decentralized organization, pagination
    DaoTotalProposals(Bytes),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Config {
    pub url: String,  // link to toml file with project metadata
    pub hash: String, // hash of the file found at the URL
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Project {
    pub name: String,
    pub config: Config,
    pub maintainers: Vec<Address>,
}
