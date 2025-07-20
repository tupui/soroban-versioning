#![cfg(test)]

use super::{Tansu, TansuClient, domain_contract};
use crate::contract_versioning::{domain_node, domain_register};
use crate::errors::ContractErrors;
use crate::types::{
    AnonymousVote, Badge, Dao, Member, ProjectBadges, ProposalStatus, PublicVote, Vote,
    VoteChoice,
};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::testutils::Ledger as _;
use soroban_sdk::{
    Address, Bytes, BytesN, Env, IntoVal, String, Vec, symbol_short, testutils::Events, token, vec,
};

// Test fixtures
struct TestFixture {
    env: Env,
    contract: TansuClient<'static>,
    domain_contract_id: Address,
    col_asset_stellar: token::StellarAssetClient<'static>,
    grogu: Address,
    mando: Address,
}

impl TestFixture {
    fn new() -> Self {
        let env: Env = Env::default();
        env.mock_all_auths();

        // Setup Soroban Domain
        let domain_contract_id: Address = env.register(domain_contract::WASM, ());
        let domain_client: domain_contract::Client<'_> = domain_contract::Client::new(&env, &domain_contract_id);

        let adm: Address = Address::generate(&env);
        let node_rate: u128 = 100;
        let min_duration: u64 = 31536000;
        let allowed_tlds: Vec<Bytes> = vec![
            &env,
            Bytes::from_slice(&env, b"xlm"),
            Bytes::from_slice(&env, b"stellar"),
            Bytes::from_slice(&env, b"wallet"),
            Bytes::from_slice(&env, b"dao"),
        ];
        
        let issuer: Address = Address::generate(&env);
        let sac: soroban_sdk::testutils::StellarAssetContract = env.register_stellar_asset_contract_v2(issuer.clone());
        let col_asset_client: token::TokenClient<'_> = token::TokenClient::new(&env, &sac.address());
        let col_asset_stellar: token::StellarAssetClient<'_> = token::StellarAssetClient::new(&env, &sac.address());

        domain_client.init(
            &adm,
            &node_rate,
            &col_asset_client.address,
            &min_duration,
            &allowed_tlds,
        );

        // Setup Tansu
        let contract_admin: Address = Address::generate(&env);
        let contract_id: Address = env.register(Tansu, (&contract_admin,));
        let contract: TansuClient<'_> = TansuClient::new(&env, &contract_id);

        // Create test accounts
        let grogu: Address = Address::generate(&env);
        let mando: Address = Address::generate(&env);
        
        // Mint tokens to grogu
        const GENESIS_AMOUNT: i128 = 1_000_000_000 * 10_000_000;
        col_asset_stellar.mint(&grogu, &GENESIS_AMOUNT);

        TestFixture {
            env,
            contract,
            domain_contract_id,
            col_asset_stellar,
            grogu,
            mando,
        }
    }

    fn register_project(&self, name: &str) -> Bytes {
        let name: String = String::from_str(&self.env, name);
        let url: String = String::from_str(&self.env, "github.com/file.toml");
        let hash: String = String::from_str(&self.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
        let maintainers: Vec<Address> = vec![&self.env, self.grogu.clone(), self.mando.clone()];

        self.contract.register(
            &self.grogu,
            &name,
            &maintainers,
            &url,
            &hash,
            &self.domain_contract_id,
        )
    }
}

// Project tests
#[test]
fn test_project_registration() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");

    // Verify events
    let mut all_events: Vec<(Address, Vec<soroban_sdk::Val>, soroban_sdk::Val)> = fixture.env.events().all();
    all_events.pop_front(); // transfer event from domain contract
    assert_eq!(
        all_events,
        vec![
            &fixture.env,
            (
                fixture.contract.address.clone(),
                (symbol_short!("register"), id.clone()).into_val(&fixture.env),
                String::from_str(&fixture.env, "tansu").into_val(&fixture.env)
            ),
        ]
    );

    // Verify project ID
    let expected_id: [u8; 32] = [
        55, 174, 131, 192, 111, 222, 16, 67, 114, 71, 67, 51, 90, 194, 243, 145, 147, 7, 137, 46,
        230, 48, 124, 206, 140, 12, 99, 234, 165, 73, 225, 86,
    ];
    let expected_id: Bytes = Bytes::from_array(&fixture.env, &expected_id);
    assert_eq!(id, expected_id);

    // Verify project details
    let project_def: crate::types::Project = fixture.contract.get_project(&id);
    assert_eq!(project_def.name, String::from_str(&fixture.env, "tansu"));
}

#[test]
fn test_commit() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    let hash_commit: String = String::from_str(&fixture.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    fixture.contract.commit(&fixture.mando, &id, &hash_commit);

    // Verify events
    let all_events: Vec<(Address, Vec<soroban_sdk::Val>, soroban_sdk::Val)> = fixture.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &fixture.env,
            (
                fixture.contract.address.clone(),
                (symbol_short!("commit"), id.clone()).into_val(&fixture.env),
                hash_commit.clone().into_val(&fixture.env)
            ),
        ]
    );

    // Verify commit hash
    let res_hash_commit = fixture.contract.get_commit(&id);
    assert_eq!(res_hash_commit, hash_commit);
}

#[test]
fn test_registration_errors() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    // Double registration
    let error = fixture.contract
        .try_register(
            &fixture.grogu,
            &String::from_str(&fixture.env, "tansu"),
            &vec![&fixture.env, fixture.grogu.clone(), fixture.mando.clone()],
            &String::from_str(&fixture.env, "github.com/file.toml"),
            &String::from_str(&fixture.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990"),
            &fixture.domain_contract_id,
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::ProjectAlreadyExist.into());

    // Name too long
    let name_long: String = String::from_str(
        &fixture.env,
        "soroban-versioningsoroban-versioningsoroban-versioningsoroban-versioning",
    );
    let error = fixture.contract
        .try_register(
            &fixture.grogu,
            &name_long,
            &vec![&fixture.env, fixture.grogu.clone(), fixture.mando.clone()],
            &String::from_str(&fixture.env, "github.com/file.toml"),
            &String::from_str(&fixture.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990"),
            &fixture.domain_contract_id,
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::InvalidDomainError.into());

    // Unregistered maintainer commit
    let bob: Address = Address::generate(&fixture.env);
    let hash_commit: String = String::from_str(&fixture.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    let error = fixture.contract
        .try_commit(&bob, &id, &hash_commit)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::UnregisteredMaintainer.into());

    // Ownership error
    let name_str: &'static str = "bob";
    let name: String = String::from_str(&fixture.env, name_str);
    let name_b: Bytes = Bytes::from_slice(&fixture.env, name_str.as_bytes());
    
    // Mint tokens to mando and register domain
    fixture.col_asset_stellar.mint(&fixture.mando, &(1_000_000_000 * 10_000_000));
    domain_register(&fixture.env, &name_b, &fixture.mando, fixture.domain_contract_id.clone());

    let error = fixture.contract
        .try_register(
            &fixture.grogu,
            &name,
            &vec![&fixture.env, fixture.grogu.clone(), fixture.mando.clone()],
            &String::from_str(&fixture.env, "github.com/file.toml"),
            &String::from_str(&fixture.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990"),
            &fixture.domain_contract_id,
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::MaintainerNotDomainOwner.into());
}

// DAO tests
#[test]
fn test_dao_and_proposals() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    // Verify initial DAO state
    let dao: Dao = fixture.contract.get_dao(&id, &0);
    assert_eq!(
        dao,
        Dao {
            proposals: Vec::new(&fixture.env)
        }
    );

    // Create proposal
    let title: String = String::from_str(&fixture.env, "Integrate with xlm.sh");
    let ipfs: String = String::from_str(
        &fixture.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at: u64 = fixture.env.ledger().timestamp() + 3600 * 24 * 2;
    let proposal_id: u32 = fixture.contract.create_proposal(
        &fixture.grogu, 
        &id, 
        &title, 
        &ipfs, 
        &voting_ends_at, 
        &true
    );

    // Verify proposal creation
    assert_eq!(proposal_id, 0);
    let proposal: crate::types::Proposal = fixture.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.id, 0);
    assert_eq!(proposal.title, title);
    assert_eq!(proposal.ipfs, ipfs);
    assert_eq!(proposal.vote_data.voting_ends_at, voting_ends_at);
    assert_eq!(
        proposal.vote_data.votes,
        vec![
            &fixture.env,
            Vote::PublicVote(PublicVote {
                address: fixture.grogu.clone(),
                weight: Badge::Verified as u32,
                vote_choice: VoteChoice::Abstain
            })
        ]
    );

    // Verify DAO state after proposal creation
    let dao: Dao = fixture.contract.get_dao(&id, &0);
    assert_eq!(
        dao,
        Dao {
            proposals: vec![&fixture.env, proposal.clone()]
        }
    );

    // Test invalid proposal access
    let error = fixture.contract.try_get_proposal(&id, &10).unwrap_err().unwrap();
    assert_eq!(error, ContractErrors::NoProposalorPageFound.into());
}

#[test]
fn test_voting() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    // Create proposal
    let title: String = String::from_str(&fixture.env, "Integrate with xlm.sh");
    let ipfs: String = String::from_str(
        &fixture.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at: u64 = fixture.env.ledger().timestamp() + 3600 * 24 * 2;
    let proposal_id: u32 = fixture.contract.create_proposal(
        &fixture.grogu, 
        &id, 
        &title, 
        &ipfs, 
        &voting_ends_at, 
        &true
    );

    // Test voting restrictions
    let error = fixture.contract
        .try_vote(
            &fixture.grogu,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: fixture.grogu.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::AlreadyVoted.into());

    // Valid vote
    fixture.contract.vote(
        &fixture.mando,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: fixture.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // Test double voting
    let error = fixture.contract
        .try_vote(
            &fixture.mando,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: fixture.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::AlreadyVoted.into());

    // Verify votes
    let proposal: crate::types::Proposal = fixture.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Active);
    assert_eq!(
        proposal.vote_data.votes,
        vec![
            &fixture.env,
            Vote::PublicVote(PublicVote {
                address: fixture.grogu.clone(),
                weight: Badge::Verified as u32,
                vote_choice: VoteChoice::Abstain,
            }),
            Vote::PublicVote(PublicVote {
                address: fixture.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        ]
    );

    // cast another vote and approve
    let _ = &fixture.env.ledger().set_timestamp(1234567890);
    let kuiil = Address::generate(&fixture.env);

    let meta = String::from_str(&fixture.env, "abcd");
    fixture.contract.add_member(&kuiil, &meta);
    let badges = vec![&fixture.env, Badge::Community];
    fixture.contract.add_badges(&fixture.mando, &id, &kuiil, &badges);

    let voting_ends_at = 1234567890 + 3600 * 24 * 2;
    let proposal_id_2 =
        fixture.contract.create_proposal(&fixture.grogu, &id, &title, &ipfs, &voting_ends_at, &true);
    fixture.contract.vote(
        &fixture.mando,
        &id,
        &proposal_id_2,
        &Vote::PublicVote(PublicVote {
            address: fixture.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // cannot vote with the wrong type for a proposal
    let error = fixture.contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id_2,
            &Vote::AnonymousVote(AnonymousVote {
                address: kuiil.clone(),
                weight: 1,
                encrypted_seeds: vec![&fixture.env, String::from_str(&fixture.env, "abcd")],
                encrypted_votes: vec![&fixture.env, String::from_str(&fixture.env, "fsfds")],
                commitments: vec![&fixture.env, BytesN::from_array(&fixture.env, &[0; 96])],
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::WrongVoteType.into());

    // cannot vote for someone else
    let error = fixture.contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id_2,
            &Vote::PublicVote(PublicVote {
                address: fixture.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::WrongVoter.into());

    fixture.contract.vote(
        &kuiil,
        &id,
        &proposal_id_2,
        &Vote::PublicVote(PublicVote {
            address: kuiil.clone(),
            weight: Badge::Verified as u32 + 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // too early to execute
    let error = fixture.contract
        .try_execute(&fixture.mando, &id, &proposal_id_2, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::ProposalVotingTime.into());

    fixture.env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result: ProposalStatus = fixture.contract.execute(&fixture.mando, &id, &proposal_id_2, &None, &None);
    assert_eq!(vote_result, ProposalStatus::Approved);
    let proposal_2: crate::types::Proposal = fixture.contract.get_proposal(&id, &proposal_id_2);

    assert_eq!(
        proposal_2.vote_data.votes,
        vec![
            &fixture.env,
            Vote::PublicVote(PublicVote {
                address: fixture.grogu.clone(),
                weight: Badge::Verified as u32,
                vote_choice: VoteChoice::Abstain,
            }),
            Vote::PublicVote(PublicVote {
                address: fixture.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
            Vote::PublicVote(PublicVote {
                address: kuiil.clone(),
                weight: Badge::Verified as u32 + 1,
                vote_choice: VoteChoice::Approve,
            }),
        ]
    );

    assert_eq!(proposal_2.status, ProposalStatus::Approved);

    // already executed
    let error = fixture.contract
        .try_execute(&fixture.mando, &id, &proposal_id_2, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::ProposalActive.into());
}

#[test]
fn test_anonymous_voting() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    // Setup anonymous voting
    let public_key: String = String::from_str(&fixture.env, "public key random");
    fixture.contract.anonymous_voting_setup(&id, &public_key);

    // Create anonymous voting proposal
    let title: String = String::from_str(&fixture.env, "Integrate with xlm.sh");
    let ipfs: String = String::from_str(
        &fixture.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at: u64 = fixture.env.ledger().timestamp() + 3600 * 24 * 2;
    let proposal_id: u32 = fixture.contract.create_proposal(
        &fixture.grogu, 
        &id, 
        &title, 
        &ipfs, 
        &voting_ends_at, 
        &false
    );

    // Verify initial vote (abstain)
    let proposal: crate::types::Proposal = fixture.contract.get_proposal(&id, &proposal_id);
    let abstain_vote: Vote = Vote::AnonymousVote(AnonymousVote {
        address: fixture.grogu.clone(),
        weight: Badge::Verified as u32,
        encrypted_seeds: vec![
            &fixture.env,
            String::from_str(&fixture.env, "0"),
            String::from_str(&fixture.env, "0"),
            String::from_str(&fixture.env, "0"),
        ],
        encrypted_votes: vec![
            &fixture.env,
            String::from_str(&fixture.env, "0"),
            String::from_str(&fixture.env, "0"),
            String::from_str(&fixture.env, "1"),
        ],
        commitments: fixture.contract.build_commitments_from_votes(
            &id,
            &vec![&fixture.env, 0u32, 0u32, 1u32],
            &vec![&fixture.env, 0u32, 0u32, 0u32],
        ),
    });
    assert_eq!(proposal.vote_data.votes, vec![&fixture.env, abstain_vote.clone()]);

     // Test invalid vote
    let kuiil: Address = Address::generate(&fixture.env);
    let error = fixture.contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id,
            &Vote::AnonymousVote(AnonymousVote {
                address: kuiil.clone(),
                weight: Badge::Verified as u32,
                encrypted_seeds: vec![&fixture.env, String::from_str(&fixture.env, "abcd")],
                encrypted_votes: vec![&fixture.env, String::from_str(&fixture.env, "fsfds")],
                commitments: vec![
                    &fixture.env,
                    BytesN::from_array(&fixture.env, &[0; 96]),
                    BytesN::from_array(&fixture.env, &[0; 96]),
                ],
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::BadCommitment.into());

    let vote_: Vote = Vote::AnonymousVote(AnonymousVote {
        address: kuiil.clone(),
        weight: 1,
        encrypted_seeds: vec![
            &fixture.env,
            String::from_str(&fixture.env, "fafdas"),
            String::from_str(&fixture.env, "fafdas"),
            String::from_str(&fixture.env, "fafdas"),
        ],
        encrypted_votes: vec![
            &fixture.env,
            String::from_str(&fixture.env, "fafdas"),
            String::from_str(&fixture.env, "fafdas"),
            String::from_str(&fixture.env, "rewrewr"),
        ],
        commitments: fixture.contract.build_commitments_from_votes(
            &id,
            &vec![&fixture.env, 3u32, 1u32, 1u32],
            &vec![&fixture.env, 5u32, 4u32, 6u32],
        ),
    });
    fixture.contract.vote(&kuiil, &id, &proposal_id, &vote_);

    // Test vote execution
    fixture.env.ledger().set_timestamp(voting_ends_at + 1);
    fixture.env.cost_estimate().budget().reset_default();
    let vote_result: ProposalStatus = fixture.contract.execute(
        &fixture.grogu,
        &id,
        &proposal_id,
        &Some(vec![&fixture.env, 3u32, 1u32, 2u32]),
        &Some(vec![&fixture.env, 5u32, 4u32, 6u32]),
    );
    assert_eq!(vote_result, ProposalStatus::Cancelled);
}

#[test]
fn test_membership_and_badges() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    // Add member
    let meta: String = String::from_str(&fixture.env, "abcd");
    fixture.contract.add_member(&fixture.grogu, &meta);

    let member = fixture.contract.get_member(&fixture.grogu);
    assert_eq!(
        member,
        Member {
            projects: Vec::new(&fixture.env),
            meta,
        }
    );
    
    let weight_grogu_for_id: u32 = fixture.contract.get_max_weight(&id, &fixture.grogu);
    assert_eq!(weight_grogu_for_id, 1u32);

    let weight_mando_for_id: u32 = fixture.contract.get_max_weight(&id, &fixture.mando);
    assert_eq!(weight_mando_for_id, 1u32);

    let badges: Vec<Badge> = vec![&fixture.env, Badge::Community, Badge::Developer];

    // Add more badges to grogu
    fixture.contract.add_badges(&fixture.grogu, &id, &fixture.grogu, &badges);
    // Test double add
    fixture.contract.add_badges(&fixture.grogu, &id, &fixture.grogu, &badges);

    // Verify member projects
    let member: Member = fixture.contract.get_member(&fixture.grogu);
    assert_eq!(
        member.projects,
        vec![
            &fixture.env,
            ProjectBadges {
                project: id.clone(),
                badges: badges.clone()
            }
        ]
    );
    
    // Verify weight calculation
    let weight_grogu: u32 = fixture.contract.get_max_weight(&id, &fixture.grogu);
    assert_eq!(weight_grogu, 11_000_000u32);

    let weight_mando: u32 = fixture.contract.get_max_weight(&id, &fixture.mando);
    assert_eq!(weight_mando, 1u32);

}

#[test]
fn test_vote_weight_restrictions() {
    let fixture: TestFixture = TestFixture::new();
    let id: Bytes = fixture.register_project("tansu");
    
    // Create proposal
    let title: String = String::from_str(&fixture.env, "Integrate with xlm.sh");
    let ipfs: String = String::from_str(
        &fixture.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at: u64 = fixture.env.ledger().timestamp() + 3600 * 24 * 2;

    // Add member with badges
    let kuiil: Address = Address::generate(&fixture.env);
    let meta: String = String::from_str(&fixture.env, "abcd");
    fixture.contract.add_member(&kuiil, &meta);
    let badges: Vec<Badge> = vec![&fixture.env, Badge::Community];
    fixture.contract.add_badges(&fixture.mando, &id, &kuiil, &badges);

    let proposal_id: u32 =
        fixture.contract.create_proposal(&fixture.mando, &id, &title, &ipfs, &voting_ends_at, &true);

    // Test invalid weight
    let error = fixture.contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: kuiil.clone(),
                weight: u32::MAX,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::VoterWeight.into());

    // Valid vote with custom weight
    fixture.contract.vote(
        &fixture.grogu,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: fixture.grogu.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );
    

    // Verify vote weight
    let proposal: crate::types::Proposal = fixture.contract.get_proposal(&id, &proposal_id);
    assert_eq!(
        proposal.vote_data.votes,
        vec![
            &fixture.env,
            Vote::PublicVote(PublicVote {
                address: fixture.mando.clone(),
                weight: Badge::Verified as u32,
                vote_choice: VoteChoice::Abstain
            }),
            Vote::PublicVote(PublicVote {
                address: fixture.grogu.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve
            })
        ]
    );
}

#[test]
fn test_utils() {
    let env: Env = Env::default();
    let name_b: Bytes = Bytes::from_slice(&env, b"tansu");
    let tld_b: Bytes = Bytes::from_slice(&env, b"xlm");
    let key: Bytes = env.crypto().keccak256(&name_b).into();
    let node: BytesN<32> = domain_node(&env, &key);

    let domain_contract_id: Address = env.register(domain_contract::WASM, ());
    let domain_client: domain_contract::Client<'_> = domain_contract::Client::new(&env, &domain_contract_id);
    let node_official: BytesN<32> = domain_client.parse_domain(&name_b, &tld_b);

    assert_eq!(node, node_official);
}