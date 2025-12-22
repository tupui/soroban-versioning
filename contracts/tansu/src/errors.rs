use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractErrors {
    // Generic (0-99)
    UnexpectedError = 0,

    // Authorization/Permission (100-199)
    UnauthorizedSigner = 100,
    WrongVoter = 101,
    MaintainerNotDomainOwner = 102,

    // Validation (200-299)
    InvalidKey = 200,
    ProjectAlreadyExist = 201,
    ProposalInputValidation = 202,
    UnknownMember = 203,
    MemberAlreadyExist = 204,
    InvalidDomainError = 205,
    WrongVoteType = 206,
    BadCommitment = 207,
    VoterWeight = 208,
    VoteLimitExceeded = 209,

    // State (300-399)
    NoHashFound = 300,
    NoProposalorPageFound = 301,
    NoProjectPageFound = 302,
    NoAnonymousVotingConfig = 303,

    // Execution/Timing (400-499)
    AlreadyVoted = 400,
    ProposalVotingTime = 401,
    ProposalActive = 402,
    OutcomeError = 403,

    // Voting/Cryptographic (500-599)
    TallySeedError = 500,
    InvalidProof = 501,

    // Contract/System (600-699)
    ContractPaused = 600,
    UpgradeError = 601,
    ContractValidation = 602,
    CollateralError = 603,
}
