use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractErrors {
    UnexpectedError = 0,
    InvalidKey = 1,
    ProjectAlreadyExist = 2,
    UnregisteredMaintainer = 3,
    NoHashFound = 4,
    InvalidDomainError = 5,
    MaintainerNotDomainOwner = 6,
}
