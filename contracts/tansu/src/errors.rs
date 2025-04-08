use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractErrors {
    UnexpectedError = 0,
    // Versioning
    InvalidKey = 1,
    ProjectAlreadyExist = 2,
    UnregisteredMaintainer = 3,
    NoHashFound = 4,
    // Soroban Domains
    InvalidDomainError = 5,
    MaintainerNotDomainOwner = 6,
    // DAO
    ProposalInputValidation = 7,
    NoProposalorPageFound = 8,
    AlreadyVoted = 9,
    ProposalVotingTime = 10,
    ProposalActive = 11,
    // Private voting
    WrongVoteType = 12,
    WrongVoter = 13,
    TallySeedError = 14,
    InvalidProof = 15,
    NoAnonymousVotingConfig = 16,
    BadCommitment = 17,
}
