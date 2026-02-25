use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractErrors {
    UnexpectedError = 0,
    // Versioning
    InvalidKey = 1,
    ProjectAlreadyExist = 2,
    UnauthorizedSigner = 3,
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
    // Membership
    UnknownMember = 18,
    MemberAlreadyExist = 19,
    VoterWeight = 20,
    VoteLimitExceeded = 21,
    // utils
    ContractPaused = 22,
    UpgradeError = 23,
    ContractValidation = 24,
    CollateralError = 25,
    // Versioning
    NoProjectPageFound = 26,
    TooManySubProjects = 27,
    // Git identity binding
    GitIdentityVerificationFailed = 28,
    GitIdentityInvalidMessage = 29,
    GitIdentityMessageParsing = 30,
}
