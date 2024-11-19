use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
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
    NoProposalorPageFound = 7,
}
