use crate::{Outcomes, OutcomesArgs, OutcomesClient, OutcomesTrait};
use soroban_sdk::{Address, Env, contractimpl};

#[contractimpl]
impl OutcomesTrait for Outcomes {
    fn approve_outcome(_env: Env, _maintainer: Address) {}

    fn reject_outcome(_env: Env, _maintainer: Address) {}

    fn abstain_outcome(_env: Env, _maintainer: Address) {}
}
