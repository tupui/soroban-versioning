use soroban_sdk::{contracttype, Address, Bytes, String, Vec};

#[contracttype]
pub enum DataKey {
    Admin, // Contract administrator
}

#[contracttype]
pub enum ProposalStatus {
    Active,
    Accepted,
    Rejected,
    Cancelled,
}

#[contracttype]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub ipfs: String,
    pub voting_ends_at: u64,
    pub votes_for: Vec<Address>,
    pub votes_against: Vec<Address>,
    pub status: ProposalStatus,
}

#[contracttype]
pub struct Dao {
    pub proposals: Option<Vec<Proposal>>,
}

#[contracttype]
pub enum ProjectKey {
    Key(Bytes),      // UUID of the project from keccak256(name)
    LastHash(Bytes), // last hash of the project
    Dao(Bytes, u32), // Decentralized organization, pagination
}

#[contracttype]
pub struct Config {
    pub url: String,  // link to toml file with project metadata
    pub hash: String, // hash of the file found at the URL
}

#[contracttype]
pub struct Project {
    pub name: String,
    pub config: Config,
    pub maintainers: Vec<Address>,
}
