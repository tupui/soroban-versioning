#![no_std]

use soroban_sdk::{Address, Env, contract};

mod contract_outcomes;

#[cfg(test)]
mod tests;

#[contract]
pub struct Outcomes;

pub trait OutcomesTrait {
    fn approve_outcome(env: Env, maintainer: Address);

    fn reject_outcome(env: Env, maintainer: Address);

    fn abstain_outcome(env: Env, maintainer: Address);
}
