#![cfg(test)]

use super::{domain_contract, Tansu, TansuClient};
use crate::contract_versioning::{domain_node, domain_register};
use crate::errors::ContractErrors;
use crate::types::{AnonymousVote, Dao, ProposalStatus, PublicVote, Vote, VoteChoice};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::testutils::Ledger as _;
use soroban_sdk::{
    symbol_short, testutils::Events, token, vec, Address, Bytes, Env, IntoVal, String, Vec,
};

#[test]
fn test() {
    let env = Env::default();
    env.mock_all_auths();

    // setup for Soroban Domain
    let domain_contract_id = env.register(domain_contract::WASM, ());
    let domain_client = domain_contract::Client::new(&env, &domain_contract_id);

    let adm: Address = Address::generate(&env);
    let node_rate: u128 = 100;
    let min_duration: u64 = 31536000;
    let allowed_tlds: Vec<Bytes> = Vec::from_array(
        &env,
        [
            Bytes::from_slice(&env, "xlm".as_bytes()),
            Bytes::from_slice(&env, "stellar".as_bytes()),
            Bytes::from_slice(&env, "wallet".as_bytes()),
            Bytes::from_slice(&env, "dao".as_bytes()),
        ],
    );
    let issuer: Address = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let col_asset_client = token::TokenClient::new(&env, &sac.address());
    let col_asset_stellar = token::StellarAssetClient::new(&env, &sac.address());

    domain_client.init(
        &adm,
        &node_rate,
        &col_asset_client.address.clone(),
        &min_duration,
        &allowed_tlds,
    );

    // setup for Tansu
    let contract_admin = Address::generate(&env);
    let contract_id = env.register(Tansu, (&contract_admin,));
    let contract = TansuClient::new(&env, &contract_id);

    let name = String::from_str(&env, "tansu");
    let url = String::from_str(&env, "github.com/file.toml");
    let hash = String::from_str(&env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let grogu = Address::generate(&env);
    let mando = Address::generate(&env);
    let maintainers = vec![&env, grogu.clone(), mando.clone()];

    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    col_asset_stellar.mint(&grogu, &genesis_amount);

    let id = contract.register(
        &grogu,
        &name,
        &maintainers,
        &url,
        &hash,
        &domain_contract_id,
    );

    let mut all_events = env.events().all();
    all_events.pop_front(); // transfer event from the domain contract
    assert_eq!(
        all_events,
        vec![
            &env,
            (
                contract_id.clone(),
                (symbol_short!("register"), id.clone()).into_val(&env),
                name.into_val(&env)
            ),
        ]
    );

    let expected_id = [
        55, 174, 131, 192, 111, 222, 16, 67, 114, 71, 67, 51, 90, 194, 243, 145, 147, 7, 137, 46,
        230, 48, 124, 206, 140, 12, 99, 234, 165, 73, 225, 86,
    ];
    let expected_id = Bytes::from_array(&env, &expected_id);
    assert_eq!(id, expected_id);

    let project_def = contract.get_project(&id);
    assert_eq!(project_def.name, name);

    let hash_commit = String::from_str(&env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    contract.commit(&mando, &id, &hash_commit);

    let all_events = env.events().all();
    assert_eq!(
        all_events,
        vec![
            &env,
            (
                contract_id.clone(),
                (symbol_short!("commit"), id.clone()).into_val(&env),
                hash_commit.into_val(&env)
            ),
        ]
    );

    let res_hash_commit = contract.get_commit(&id);
    assert_eq!(res_hash_commit, hash_commit);

    // error handling

    // double registration
    let error = contract
        .try_register(
            &grogu,
            &name,
            &maintainers,
            &url,
            &hash,
            &domain_contract_id,
        )
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::ProjectAlreadyExist.into());

    // name too long
    let name_long = String::from_str(
        &env,
        "soroban-versioningsoroban-versioningsoroban-versioningsoroban-versioning",
    );
    let error = contract
        .try_register(
            &grogu,
            &name_long,
            &maintainers,
            &url,
            &hash,
            &domain_contract_id,
        )
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::InvalidDomainError.into());

    // un-registered maintainer
    let bob = Address::generate(&env);
    let error = contract
        .try_commit(&bob, &id, &hash_commit)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::UnregisteredMaintainer.into());

    // ownership error
    let name_str = "bob";
    let name = String::from_str(&env, name_str);
    let name_b = Bytes::from_slice(&env, name_str.as_bytes());
    col_asset_stellar.mint(&mando, &genesis_amount);
    domain_register(&env, &name_b, &mando, domain_contract_id.clone());

    let error = contract
        .try_register(
            &grogu,
            &name,
            &maintainers,
            &url,
            &hash,
            &domain_contract_id,
        )
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::MaintainerNotDomainOwner.into());

    // DAO
    let dao = contract.get_dao(&id, &0);
    assert_eq!(
        dao,
        Dao {
            proposals: Vec::new(&env)
        }
    );

    let title = String::from_str(&env, "Integrate with xlm.sh");
    let ipfs = String::from_str(
        &env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = env.ledger().timestamp() + 3600 * 24 * 2;
    let proposal_id = contract.create_proposal(&grogu, &id, &title, &ipfs, &voting_ends_at, &true);

    assert_eq!(proposal_id, 0);

    let proposal = contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.id, 0);
    assert_eq!(proposal.title, title);
    assert_eq!(proposal.ipfs, ipfs);
    assert_eq!(proposal.vote_data.voting_ends_at, voting_ends_at);
    assert_eq!(
        proposal.vote_data.votes,
        vec![
            &env,
            Vote::PublicVote(PublicVote {
                address: grogu.clone(),
                vote_choice: VoteChoice::Abstain
            })
        ]
    );

    let dao = contract.get_dao(&id, &0);
    assert_eq!(
        dao,
        Dao {
            proposals: vec![&env, proposal.clone()]
        }
    );

    // id does not exist
    let error = contract.try_get_proposal(&id, &10).unwrap_err().unwrap();
    assert_eq!(error, ContractErrors::NoProposalorPageFound.into());

    // cannot vote for your own proposal
    let error = contract
        .try_vote(
            &grogu,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: grogu.clone(),
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::AlreadyVoted.into());

    contract.vote(
        &mando,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: mando.clone(),
            vote_choice: VoteChoice::Approve,
        }),
    );

    // cannot vote twice
    let error = contract
        .try_vote(
            &mando,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: mando.clone(),
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::AlreadyVoted.into());

    let proposal = contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Active);

    assert_eq!(
        proposal.vote_data.votes,
        vec![
            &env,
            Vote::PublicVote(PublicVote {
                address: grogu.clone(),
                vote_choice: VoteChoice::Abstain,
            }),
            Vote::PublicVote(PublicVote {
                address: mando.clone(),
                vote_choice: VoteChoice::Approve,
            }),
        ]
    );

    // cast another vote and approve
    env.ledger().set_timestamp(1234567890);
    let kuiil = Address::generate(&env);
    let voting_ends_at = 1234567890 + 3600 * 24 * 2;
    let proposal_id_2 =
        contract.create_proposal(&grogu, &id, &title, &ipfs, &voting_ends_at, &true);
    contract.vote(
        &mando,
        &id,
        &proposal_id_2,
        &Vote::PublicVote(PublicVote {
            address: mando.clone(),
            vote_choice: VoteChoice::Approve,
        }),
    );

    // cannot vote with the wrong type for a proposal
    let error = contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id_2,
            &Vote::AnonymousVote(AnonymousVote {
                address: kuiil.clone(),
                encrypted_seeds: vec![&env, String::from_str(&env, "abcd")],
                encrypted_votes: vec![&env, String::from_str(&env, "fsfds")],
                commitments: vec![&env, Bytes::from_array(&env, &[1, 2, 3])],
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::WrongVoteType.into());

    // cannot vote for someone else
    let error = contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id_2,
            &Vote::PublicVote(PublicVote {
                address: mando.clone(),
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::WrongVoter.into());

    contract.vote(
        &kuiil,
        &id,
        &proposal_id_2,
        &Vote::PublicVote(PublicVote {
            address: kuiil.clone(),
            vote_choice: VoteChoice::Approve,
        }),
    );

    // too early to execute
    let error = contract
        .try_execute(&mando, &id, &proposal_id_2, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::ProposalVotingTime.into());

    env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = contract.execute(&mando, &id, &proposal_id_2, &None, &None);
    assert_eq!(vote_result, ProposalStatus::Approved);
    let proposal_2 = contract.get_proposal(&id, &proposal_id_2);

    assert_eq!(
        proposal_2.vote_data.votes,
        vec![
            &env,
            Vote::PublicVote(PublicVote {
                address: grogu.clone(),
                vote_choice: VoteChoice::Abstain,
            }),
            Vote::PublicVote(PublicVote {
                address: mando.clone(),
                vote_choice: VoteChoice::Approve,
            }),
            Vote::PublicVote(PublicVote {
                address: kuiil.clone(),
                vote_choice: VoteChoice::Approve,
            }),
        ]
    );

    assert_eq!(proposal_2.status, ProposalStatus::Approved);

    // already executed
    let error = contract
        .try_execute(&mando, &id, &proposal_id_2, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::ProposalActive.into());

    // anonymous voting
    let voting_ends_at = env.ledger().timestamp() + 3600 * 24 * 2;
    let error = contract
        .try_create_proposal(&grogu, &id, &title, &ipfs, &voting_ends_at, &false)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::NoAnonymousVotingConfig.into());

    let public_key = String::from_str(&env, "public key random");
    contract.anonymous_voting_setup(&public_key);

    let proposal_id_3 =
        contract.create_proposal(&grogu, &id, &title, &ipfs, &voting_ends_at, &false);

    contract.vote(
        &kuiil,
        &id,
        &proposal_id_3,
        &Vote::AnonymousVote(AnonymousVote {
            address: kuiil.clone(),
            encrypted_seeds: vec![&env, String::from_str(&env, "abcd")],
            encrypted_votes: vec![&env, String::from_str(&env, "fsfds")],
            // TODO real commitment
            commitments: vec![&env, Bytes::from_array(&env, &[1, 2, 3])],
        }),
    );

    env.ledger().set_timestamp(voting_ends_at + 1);
}

#[test]
fn test_utils() {
    let env = Env::default();
    let name_b = Bytes::from_slice(&env, "tansu".as_bytes());
    let tld_b = Bytes::from_slice(&env, "xlm".as_bytes());
    let key: Bytes = env.crypto().keccak256(&name_b).into();
    let node = domain_node(&env, &key);

    let domain_contract_id = env.register(domain_contract::WASM, ());
    let domain_client = domain_contract::Client::new(&env, &domain_contract_id);
    let node_official = domain_client.parse_domain(&name_b, &tld_b);

    assert_eq!(node, node_official);
}
