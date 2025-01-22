#![cfg(test)]

use super::{domain_contract, Tansu, TansuClient};
use crate::contract_versioning::{domain_node, domain_register};
use crate::errors::ContractErrors;
use crate::types::{Dao, ProposalStatus, Vote};
use soroban_sdk::crypto::bls12_381::G1Affine;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::testutils::Ledger as _;
use soroban_sdk::{
    bytesn, symbol_short, testutils::Events, token, vec, Address, Bytes, Env, IntoVal, Map, String,
    Vec, U256,
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
    let proposal_id = contract.create_proposal(&grogu, &id, &title, &ipfs, &voting_ends_at);

    assert_eq!(proposal_id, 0);

    let proposal = contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.id, 0);
    assert_eq!(proposal.title, title);
    assert_eq!(proposal.ipfs, ipfs);
    assert_eq!(proposal.voting_ends_at, voting_ends_at);
    assert_eq!(proposal.voters_approve, Vec::new(&env));
    assert_eq!(proposal.voters_reject, Vec::new(&env));
    assert_eq!(proposal.voters_abstain, vec![&env, grogu.clone()]);

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
        .try_vote(&grogu, &id, &proposal_id, &Vote::Approve)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::AlreadyVoted.into());

    contract.vote(&mando, &id, &proposal_id, &Vote::Approve);

    // cannot vote twice
    let error = contract
        .try_vote(&mando, &id, &proposal_id, &Vote::Approve)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::AlreadyVoted.into());

    let proposal = contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Active);
    assert_eq!(proposal.voters_approve, vec![&env, mando.clone()]);
    assert_eq!(proposal.voters_reject, Vec::new(&env));
    assert_eq!(proposal.voters_abstain, vec![&env, grogu.clone()]);

    // cast another vote and approve
    env.ledger().set_timestamp(1234567890);
    let kuiil = Address::generate(&env);
    let voting_ends_at = 1234567890 + 3600 * 24 * 2;
    let proposal_id_2 = contract.create_proposal(&grogu, &id, &title, &ipfs, &voting_ends_at);
    contract.vote(&mando, &id, &proposal_id_2, &Vote::Approve);
    contract.vote(&kuiil, &id, &proposal_id_2, &Vote::Approve);

    // too early to execute
    let error = contract
        .try_execute(&mando, &id, &proposal_id_2)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::ProposalVotingTime.into());

    env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = contract.execute(&mando, &id, &proposal_id_2);
    assert_eq!(vote_result, ProposalStatus::Approved);
    let proposal_2 = contract.get_proposal(&id, &proposal_id_2);
    assert_eq!(
        proposal_2.voters_approve,
        vec![&env, mando.clone(), kuiil.clone()]
    );
    assert_eq!(proposal_2.voters_reject, Vec::new(&env));
    assert_eq!(proposal_2.voters_abstain, vec![&env, grogu.clone()]);
    assert_eq!(proposal_2.status, ProposalStatus::Approved);
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

fn commitment(env: &Env, vote: &i32, seed: &str, pk: &str) -> G1Affine {
    let vote = Bytes::from_slice(&env, &vote.to_be_bytes());
    let seed = Bytes::from_slice(&env, &seed.as_bytes());
    let pk = Bytes::from_slice(&env, &pk.as_bytes());

    let vote_dst = Bytes::from_slice(&env, "VOTE_COMMITMENT".as_bytes());
    let pk_dst = Bytes::from_slice(&env, "VOTE_PK".as_bytes());
    let seed_dst = Bytes::from_slice(&env, "VOTE_SEED".as_bytes());

    let bls12_381 = env.crypto().bls12_381();

    let vote_point = bls12_381.hash_to_g1(&vote, &vote_dst);
    let seed_point = bls12_381.hash_to_g1(&seed, &seed_dst);
    let pk_point = bls12_381.hash_to_g1(&pk, &pk_dst);

    // C1 = g^v * h^r (in additive notation: g*v + h*r)
    let vote_commitment = bls12_381.g1_add(&vote_point, &seed_point);

    bls12_381.g1_add(&vote_commitment, &pk_point)
}

fn neg_value(env: &Env, value: G1Affine) -> G1Affine {
    // Create -1 in Fr field using fr_sub(0, 1)
    let bls12_381 = env.crypto().bls12_381();
    let zero = U256::from_u32(&env, 0);
    let one = U256::from_u32(&env, 1);
    let neg_one = bls12_381.fr_sub(&zero.into(), &one.into());

    // negate the value
    bls12_381.g1_mul(&value, &neg_one)
}

fn add_commitment(
    env: &Env,
    tally: &G1Affine,
    commitment: &G1Affine,
    seed: &str,
    pk: &str,
) -> G1Affine {
    let seed = Bytes::from_slice(&env, &seed.as_bytes());
    let pk = Bytes::from_slice(&env, &pk.as_bytes());

    let pk_dst = Bytes::from_slice(&env, "VOTE_PK".as_bytes());
    let seed_dst = Bytes::from_slice(&env, "VOTE_SEED".as_bytes());

    let bls12_381 = env.crypto().bls12_381();

    let seed_point = bls12_381.hash_to_g1(&seed, &seed_dst);
    let pk_point = bls12_381.hash_to_g1(&pk, &pk_dst);

    let neg_seed = neg_value(&env, seed_point);
    let neg_pk = neg_value(&env, pk_point);

    // Remove randomization
    let mut recovered_vote = bls12_381.g1_add(&commitment, &neg_seed);
    recovered_vote = bls12_381.g1_add(&recovered_vote, &neg_pk);

    // tally
    bls12_381.g1_add(&tally, &recovered_vote)
}

fn mapping_point_to_value(env: &Env) -> Map<G1Affine, i32> {
    let mut mapping = Map::new(env);

    let vote_dst = Bytes::from_slice(&env, "VOTE_COMMITMENT".as_bytes());
    let bls12_381 = env.crypto().bls12_381();

    for value in -1_000_000_i32..=1_000_000_i32 {
        let value_ = Bytes::from_slice(&env, &value.to_be_bytes());
        let value_point = bls12_381.hash_to_g1(&value_, &vote_dst);
        mapping.set(value_point, value);
    }

    mapping
}

#[test]
fn test_anon() {
    let env = Env::default();

    // pk a public key which we store on the proposal
    let pk = "public key";

    // casting some votes in the frontend
    let vote_a = 1_i32;
    let seed_a = "seed value a";
    let vote_commitment_a = commitment(&env, &vote_a, &seed_a, &pk);

    let vote_b = 1_i32;
    let seed_b = "seed value b";
    let vote_commitment_b = commitment(&env, &vote_b, &seed_b, &pk);

    // voting ends, we retrieve the commitments and the
    // seeds are decrypted on the frontend with the secret key
    //let mut tally: G1Affine = U256::from_u32(&env, 0).into();
    let mut tally = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));
    tally = add_commitment(&env, &tally, &vote_commitment_a, &seed_a, &pk);
    tally = add_commitment(&env, &tally, &vote_commitment_b, &seed_b, &pk);

    // check the tally
    let bls12_381 = env.crypto().bls12_381();
    let vote_dst = Bytes::from_slice(&env, "VOTE_COMMITMENT".as_bytes());
    let one_vote = Bytes::from_slice(&env, &1_i32.to_be_bytes());
    let one_vote_point = bls12_381.hash_to_g1(&one_vote, &vote_dst);
    let ref_tally = bls12_381.g1_add(&one_vote_point, &one_vote_point);
    assert_eq!(tally, ref_tally);
}
