use soroban_sdk::{contracttype, Address, Bytes, String, Vec};

#[contracttype]
pub enum DataKey {
    Admin, // Contract administrator
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
    Approve,
    Reject,
    Abstain,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub ipfs: String,
    pub voting_ends_at: u64,
    pub voters_approve: Vec<Address>,
    pub voters_reject: Vec<Address>,
    pub voters_abstain: Vec<Address>,
    pub nqg: u32,
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
