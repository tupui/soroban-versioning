import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  AssembledTransactionOptions,
  Option,
  Typepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

export interface Dao {
  proposals: Array<Proposal>;
}

export type Vote =
  | { tag: "PublicVote"; values: readonly [PublicVote] }
  | { tag: "AnonymousVote"; values: readonly [AnonymousVote] };

export enum Badge {
  Developer = 10000000,
  Triage = 5000000,
  Community = 1000000,
  Verified = 500000,
  Default = 1,
}

export interface Badges {
  community: Array<string>;
  developer: Array<string>;
  triage: Array<string>;
  verified: Array<string>;
}

export interface Config {
  ipfs: string;
  url: string;
}

export interface Member {
  meta: string;
  projects: Array<ProjectBadges>;
}

export type DataKey =
  | { tag: "Member"; values: readonly [string] }
  | { tag: "Paused"; values: void }
  | { tag: "UpgradeProposal"; values: void }
  | { tag: "AdminsConfig"; values: void };

export interface Project {
  config: Config;
  maintainers: Array<string>;
  name: string;
  sub_projects: Option<Array<Buffer>>;
}

export interface Contract {
  address: string;
  wasm_hash: Option<Buffer>;
}

export interface Proposal {
  id: u32;
  ipfs: string;
  outcomes_contract: Option<string>;
  proposer: string;
  status: ProposalStatus;
  title: string;
  vote_data: VoteData;
}

export interface VoteData {
  public_voting: boolean;
  votes: Array<Vote>;
  voting_ends_at: u64;
}

export type ProjectKey =
  | { tag: "Key"; values: readonly [Buffer] }
  | { tag: "Badges"; values: readonly [Buffer] }
  | { tag: "LastHash"; values: readonly [Buffer] }
  | { tag: "Dao"; values: readonly [Buffer, u32] }
  | { tag: "DaoTotalProposals"; values: readonly [Buffer] }
  | { tag: "AnonymousVoteConfig"; values: readonly [Buffer] }
  | { tag: "ProjectKeys"; values: readonly [u32] }
  | { tag: "TotalProjects"; values: void };

export type OrganizationKey =
  | { tag: "Key"; values: readonly [Buffer] }
  | { tag: "OrganizationProjects"; values: readonly [Buffer] }
  | { tag: "OrganizationProjectsPage"; values: readonly [Buffer, u32] }
  | { tag: "TotalOrganizations"; values: void }
  | { tag: "OrganizationKeys"; values: readonly [u32] };

export interface PublicVote {
  address: string;
  vote_choice: VoteChoice;
  weight: u32;
}

export type VoteChoice =
  | { tag: "Approve"; values: void }
  | { tag: "Reject"; values: void }
  | { tag: "Abstain"; values: void };

export type ContractKey =
  | { tag: "DomainContract"; values: void }
  | { tag: "CollateralContract"; values: void };

export interface AdminsConfig {
  admins: Array<string>;
  threshold: u32;
}

export interface AnonymousVote {
  address: string;
  commitments: Array<Buffer>;
  encrypted_seeds: Array<string>;
  encrypted_votes: Array<string>;
  weight: u32;
}

export interface ProjectBadges {
  badges: Array<Badge>;
  project: Buffer;
}

export type ProposalStatus =
  | { tag: "Active"; values: void }
  | { tag: "Approved"; values: void }
  | { tag: "Rejected"; values: void }
  | { tag: "Cancelled"; values: void }
  | { tag: "Malicious"; values: void };

export interface UpgradeProposal {
  admins_config: AdminsConfig;
  approvals: Array<string>;
  executable_at: u64;
  wasm_hash: Buffer;
}

export interface AnonymousVoteConfig {
  public_key: string;
  seed_generator_point: Buffer;
  vote_generator_point: Buffer;
}

export const ContractErrors = {
  0: { message: "UnexpectedError" },
  1: { message: "InvalidKey" },
  2: { message: "ProjectAlreadyExist" },
  3: { message: "UnauthorizedSigner" },
  4: { message: "NoHashFound" },
  5: { message: "InvalidDomainError" },
  6: { message: "MaintainerNotDomainOwner" },
  7: { message: "ProposalInputValidation" },
  8: { message: "NoProposalorPageFound" },
  9: { message: "AlreadyVoted" },
  10: { message: "ProposalVotingTime" },
  11: { message: "ProposalActive" },
  12: { message: "WrongVoteType" },
  13: { message: "WrongVoter" },
  14: { message: "TallySeedError" },
  15: { message: "InvalidProof" },
  16: { message: "NoAnonymousVotingConfig" },
  17: { message: "BadCommitment" },
  18: { message: "UnknownMember" },
  19: { message: "MemberAlreadyExist" },
  20: { message: "VoterWeight" },
  21: { message: "VoteLimitExceeded" },
  22: { message: "ContractPaused" },
  23: { message: "UpgradeError" },
  24: { message: "ContractValidation" },
  25: { message: "CollateralError" },
  26: { message: "NoProjectPageFound" },
};

export interface Client {
  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cast a vote on a proposal.
   *
   * Allows a member to vote on a proposal.
   * The vote can be either public or anonymous depending on the proposal configuration.
   * For public votes, the choice and weight are visible. For anonymous votes, only
   * the weight is visible, and the choice is encrypted.
   *
   * # Arguments
   * * `env` - The environment object
   * * `voter` - The address of the voter
   * * `project_key` - The project key identifier
   * * `proposal_id` - The ID of the proposal to vote on
   * * `vote` - The vote data (public or anonymous)
   *
   * # Panics
   * * If the voter has already voted
   * * If the voting period has ended
   * * If the proposal is not active anymore
   * * If the proposal doesn't exist
   * * If the voter's weight exceeds their maximum allowed weight
   * * If the voter is not a member of the project
   */
  vote: (
    {
      voter,
      project_key,
      proposal_id,
      vote,
    }: { voter: string; project_key: Buffer; proposal_id: u32; vote: Vote },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify vote commitment proof for anonymous voting.
   *
   * Validates that the provided tallies and seeds match the vote commitments
   * without revealing individual votes. This ensures the integrity of anonymous
   * voting results.
   *
   * The commitment is:
   *
   * C = g^v * h^r (in additive notation: g*v + h*r),
   *
   * where g, h are BLS12-381 generator points and v is the vote choice,
   * r is the seed. Voting weight is introduced during the tallying phase.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   * * `proposal` - The proposal containing vote commitments
   * * `tallies` - Decoded tally values [approve, reject, abstain] (scaled by weights)
   * * `seeds` - Decoded seed values [approve, reject, abstain] (scaled by weights)
   *
   * # Returns
   * * `bool` - True if all commitments match the provided tallies and seeds
   *
   * # Panics
   * * If no anonymous voting configuration exists for the project
   */
  proof: (
    {
      project_key,
      proposal,
      tallies,
      seeds,
    }: {
      project_key: Buffer;
      proposal: Proposal;
      tallies: Array<u128>;
      seeds: Array<u128>;
    },
    options?: AssembledTransactionOptions<boolean>,
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a execute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute a vote after the voting period ends.
   *
   * Processes the voting results and determines the final status of the proposal.
   * For public votes, the results are calculated directly from vote counts.
   * For anonymous votes, tallies and seeds are validated against vote commitments
   * to ensure the results are correct.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - The address of the maintainer executing the proposal
   * * `project_key` - The project key identifier
   * * `proposal_id` - The ID of the proposal to execute
   * * [`Option<tallies>`] - decoded tally values (scaled by weights), respectively Approve, reject and abstain
   * * [`Option<seeds>`] - decoded seed values (scaled by weights), respectively Approve, reject and abstain
   *
   * # Returns
   * * `types::ProposalStatus` - The final status of the proposal (Approved, Rejected, or Cancelled)
   *
   * # Panics
   * * If the voting period hasn't ended
   * * If the proposal doesn't exist
   * * If the proposal is not active anymore
   * * If tallies/seeds are missing for anonymous votes
   * * If commitment
   */
  execute: (
    {
      maintainer,
      project_key,
      proposal_id,
      tallies,
      seeds,
    }: {
      maintainer: string;
      project_key: Buffer;
      proposal_id: u32;
      tallies: Option<Array<u128>>;
      seeds: Option<Array<u128>>;
    },
    options?: AssembledTransactionOptions<ProposalStatus>,
  ) => Promise<AssembledTransaction<ProposalStatus>>;

  /**
   * Construct and simulate a get_dao transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns a page of proposals (0 to MAX_PROPOSALS_PER_PAGE proposals per page).
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   * * `page` - The page number (0-based)
   *
   * # Returns
   * * `types::Dao` - The DAO object containing a page of proposals
   *
   * # Panics
   * * If the page number is out of bounds
   */
  get_dao: (
    { project_key, page }: { project_key: Buffer; page: u32 },
    options?: AssembledTransactionOptions<Dao>,
  ) => Promise<AssembledTransaction<Dao>>;

  /**
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a single proposal by ID.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   * * `proposal_id` - The ID of the proposal to retrieve
   *
   * # Returns
   * * `types::Proposal` - The proposal object
   *
   * # Panics
   * * If the proposal doesn't exist
   */
  get_proposal: (
    { project_key, proposal_id }: { project_key: Buffer; proposal_id: u32 },
    options?: AssembledTransactionOptions<Proposal>,
  ) => Promise<AssembledTransaction<Proposal>>;

  /**
   * Construct and simulate a create_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new proposal for a project.
   *
   * The proposer is automatically added to the abstain group.
   * By creating a proposal, the proposer incur a collateral which is
   * repaid upon execution of the proposal unless the proposal is revoked.
   * This is a deterrent mechanism.
   *
   * # Arguments
   * * `env` - The environment object
   * * `proposer` - Address of the proposal creator
   * * `project_key` - Unique identifier for the project
   * * `title` - Title of the proposal
   * * `ipfs` - IPFS content identifier describing the proposal
   * * `voting_ends_at` - UNIX timestamp when voting ends
   * * `public_voting` - Whether voting is public or anonymous
   * * [`Option<outcomes_contract>`] - Outcome contract address
   *
   * # Returns
   * * `u32` - The ID of the created proposal.
   *
   * # Panics
   * * If the title is too long
   * * If the voting period is invalid
   * * If the project doesn't exist
   */
  create_proposal: (
    {
      proposer,
      project_key,
      title,
      ipfs,
      voting_ends_at,
      public_voting,
      outcomes_contract,
    }: {
      proposer: string;
      project_key: Buffer;
      title: string;
      ipfs: string;
      voting_ends_at: u64;
      public_voting: boolean;
      outcomes_contract: Option<string>;
    },
    options?: AssembledTransactionOptions<u32>,
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a revoke_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke a proposal.
   *
   * Useful if there was some spam or bad intent. That will prevent the
   * collateral to be claimed back.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - Address of the proposal creator
   * * `project_key` - The project key identifier
   * * `proposal_id` - The ID of the proposal to vote on
   *
   * # Panics
   * * If the proposal is not active anymore
   * * If the maintainer is not authorized
   */
  revoke_proposal: (
    {
      maintainer,
      project_key,
      proposal_id,
    }: { maintainer: string; project_key: Buffer; proposal_id: u32 },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a anonymous_voting_setup transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Setup anonymous voting for a project.
   *
   * Configures BLS12-381 cryptographic primitives for anonymous voting.
   * Only the contract admin can call this function.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `public_key` - Asymmetric public key to be used for vote encryption
   *
   * # Panics
   * * If the caller is not the contract admin
   */
  anonymous_voting_setup: (
    {
      maintainer,
      project_key,
      public_key,
    }: { maintainer: string; project_key: Buffer; public_key: string },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_anonymous_voting_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the anonymous voting configuration for a project.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   *
   * # Returns
   * * `types::AnonymousVoteConfig` - The anonymous voting configuration
   *
   * # Panics
   * * If no anonymous voting configuration exists for the project
   */
  get_anonymous_voting_config: (
    { project_key }: { project_key: Buffer },
    options?: AssembledTransactionOptions<AnonymousVoteConfig>,
  ) => Promise<AssembledTransaction<AnonymousVoteConfig>>;

  /**
   * Construct and simulate a build_commitments_from_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Build vote commitments from votes and seeds for anonymous voting.
   *
   * Creates BLS12-381 commitments for each vote using the formula:
   * C = g·vote + h·seed where g and h are generator points on BLS12-381.
   *
   * Note: This function does not consider voting weights, which are applied
   * during the tallying phase. Calling this on the smart contract would reveal
   * the votes and seeds, so it must be run either in simulation or client-side.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `votes` - Vector of vote choices (0=approve, 1=reject, 2=abstain)
   * * `seeds` - Vector of random seeds for each vote
   *
   * # Returns
   * * `Vec<BytesN<96>>` - Vector of vote commitments (one per vote)
   *
   * # Panics
   * * If no anonymous voting configuration exists for the project
   */
  build_commitments_from_votes: (
    {
      project_key,
      votes,
      seeds,
    }: { project_key: Buffer; votes: Array<u128>; seeds: Array<u128> },
    options?: AssembledTransactionOptions<Array<Buffer>>,
  ) => Promise<AssembledTransaction<Array<Buffer>>>;

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pause or unpause the contract (emergency stop.)
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - The admin address
   * * `paused` - Pause or unpause the contract operations which change
   * ledger states.
   */
  pause: (
    { admin, paused }: { admin: string; paused: boolean },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current version of the contract.
   *
   * # Returns
   * * `u32` - The contract version number
   */
  version: (
    options?: AssembledTransactionOptions<u32>,
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a approve_upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Approve an upgrade proposal
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - An admin address
   *
   * # Panics
   * * If the admin is not authorized
   * * If the admin already approved
   * * If there is no upgrade to approve
   */
  approve_upgrade: (
    { admin }: { admin: string },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a propose_upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Propose a contract upgrade.
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - An admin address
   * * `new_wasm_hash` - The new WASM hash
   * * `new_admins_config` - Optional new admin configuration (None to keep current)
   *
   * # Panics
   * * If the admin is not authorized
   * * If there is already an existing proposal (cancel the previous first)
   */
  propose_upgrade: (
    {
      admin,
      new_wasm_hash,
      new_admins_config,
    }: {
      admin: string;
      new_wasm_hash: Buffer;
      new_admins_config: Option<AdminsConfig>;
    },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a finalize_upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute or cancel upgrade proposal
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - An admin address
   * * `accept` - true to accept and false to reject.
   *
   * Upgrades can always be cancelled but only executed if there are enough
   * approvals and the timelock period is over.
   *
   * # Panics
   * * If the admin is not authorized
   * * If it is too early to execute
   * * If there are not enough approvals
   * * If there is no upgrade to execute
   */
  finalize_upgrade: (
    { admin, accept }: { admin: string; accept: boolean },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_admins_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current administrators configuration.
   *
   * # Arguments
   * * `env` - The environment object
   *
   * # Returns
   * * `types::AdminsConfig` - The administrators configuration
   */
  get_admins_config: (
    options?: AssembledTransactionOptions<AdminsConfig>,
  ) => Promise<AssembledTransaction<AdminsConfig>>;

  /**
   * Construct and simulate a require_not_paused transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Require that the contract is not paused, panic if it is
   *
   * # Panics
   * * If the contract is paused.
   */
  require_not_paused: (
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a set_domain_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the Soroban Domain contract.
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - The admin address
   * * `domain_contract` - The new domain contract
   */
  set_domain_contract: (
    { admin, domain_contract }: { admin: string; domain_contract: Contract },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_upgrade_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get upgrade proposal details
   */
  get_upgrade_proposal: (
    options?: AssembledTransactionOptions<UpgradeProposal>,
  ) => Promise<AssembledTransaction<UpgradeProposal>>;

  /**
   * Construct and simulate a set_collateral_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the Collateral contract.
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - The admin address
   * * `collateral_contract` - The new collateral contract
   */
  set_collateral_contract: (
    {
      admin,
      collateral_contract,
    }: { admin: string; collateral_contract: Contract },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a add_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a new member to the system with metadata.
   *
   * # Arguments
   * * `env` - The environment object
   * * `member_address` - The address of the member to add
   * * `meta` - Metadata string associated with the member (e.g., IPFS hash)
   *
   * # Panics
   * * If the member already exists
   */
  add_member: (
    { member_address, meta }: { member_address: string; meta: string },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_badges transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all badges for a specific project, organized by badge type.
   *
   * Returns a structure containing vectors of member addresses for each badge type
   * (Developer, Triage, Community, Verified).
   *
   * # Arguments
   * * `env` - The environment object
   * * `key` - The project key identifier
   *
   * # Returns
   * * `types::Badges` - Structure containing member addresses for each badge type
   */
  get_badges: (
    { key }: { key: Buffer },
    options?: AssembledTransactionOptions<Badges>,
  ) => Promise<AssembledTransaction<Badges>>;

  /**
   * Construct and simulate a get_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get member information including all project badges.
   *
   * # Arguments
   * * `env` - The environment object
   * * `member_address` - The address of the member to retrieve
   *
   * # Returns
   * * `types::Member` - Member information including metadata and project badges
   *
   * # Panics
   * * If the member doesn't exist
   */
  get_member: (
    { member_address }: { member_address: string },
    options?: AssembledTransactionOptions<Member>,
  ) => Promise<AssembledTransaction<Member>>;

  /**
   * Construct and simulate a set_badges transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set badges for a member in a specific project.
   *
   * This function replaces all existing badges for the member in the specified project
   * with the new badge list. The member's maximum voting
   * weight is calculated as the sum of all assigned badge weights.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - The address of the maintainer (must be authorized)
   * * `key` - The project key identifier
   * * `member` - The address of the member to set badges for
   * * `badges` - Vector of badges to assign
   *
   * # Panics
   * * If the maintainer is not authorized
   * * If the member doesn't exist
   * * If the project doesn't exist
   */
  set_badges: (
    {
      maintainer,
      key,
      member,
      badges,
    }: {
      maintainer: string;
      key: Buffer;
      member: string;
      badges: Array<Badge>;
    },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_max_weight transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the maximum voting weight for a member in a specific project.
   *
   * Calculates the sum of all badge weights for the member in the project.
   * If no badges are assigned, returns the Default badge weight (1).
   * This weight determines the maximum number of votes the member can cast
   * in a single voting transaction.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   * * `member_address` - The address of the member
   *
   * # Returns
   * * `u32` - The maximum voting weight for the member
   *
   * # Panics
   * * If the member doesn't exist
   */
  get_max_weight: (
    {
      project_key,
      member_address,
    }: { project_key: Buffer; member_address: string },
    options?: AssembledTransactionOptions<u32>,
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a commit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the latest commit hash for a project.
   *
   * Updates the current commit hash for the specified project.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - The address of the maintainer calling this function
   * * `project_key` - The project key identifier
   * * `hash` - The new commit hash
   *
   * # Panics
   * * If the project doesn't exist
   * * If the maintainer is not authorized
   */
  commit: (
    {
      maintainer,
      project_key,
      hash,
    }: { maintainer: string; project_key: Buffer; hash: string },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Register a new project.
   *
   * Creates a new project entry with maintainers, URL, and commit hash.
   * Also registers the project name in the domain contract if not already registered.
   * The project key is generated using keccak256 hash of the project name.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - The address of the maintainer calling this function
   * * `name` - The project name (max 15 characters)
   * * `maintainers` - List of maintainer addresses for the project
   * * `url` - The project's Git repository URL
   * * `ipfs` - CID of the tansu.toml file with associated metadata
   *
   * # Returns
   * * `Bytes` - The project key (keccak256 hash of the name)
   *
   * # Panics
   * * If the project name is longer than 15 characters
   * * If the project already exists
   * * If the maintainer is not authorized
   * * If the domain registration fails
   * * If the maintainer doesn't own an existing domain
   */
  register: (
    {
      maintainer,
      name,
      maintainers,
      url,
      ipfs,
    }: {
      maintainer: string;
      name: string;
      maintainers: Array<string>;
      url: string;
      ipfs: string;
    },
    options?: AssembledTransactionOptions<Buffer>,
  ) => Promise<AssembledTransaction<Buffer>>;

  /**
   * Construct and simulate a get_commit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the last commit hash
   * Get the latest commit hash for a project.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   *
   * # Returns
   * * `String` - The current commit hash
   *
   * # Panics
   * * If the project doesn't exist
   */
  get_commit: (
    { project_key }: { project_key: Buffer },
    options?: AssembledTransactionOptions<string>,
  ) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_project transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get project information including configuration and maintainers.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   *
   * # Returns
   * * `types::Project` - Project information including name, config, and maintainers
   *
   * # Panics
   * * If the project doesn't exist
   */
  get_project: (
    { project_key }: { project_key: Buffer },
    options?: AssembledTransactionOptions<Project>,
  ) => Promise<AssembledTransaction<Project>>;

  /**
   * Construct and simulate a get_projects transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a page of projects.
   *
   * # Arguments
   * * `env` - The environment object
   * * `page` - The page number (0-based)
   *
   * # Returns
   * * `Vec<types::Project>` - List of projects on the requested page
   */
  get_projects: (
    { page }: { page: u32 },
    options?: AssembledTransactionOptions<Array<Project>>,
  ) => Promise<AssembledTransaction<Array<Project>>>;

  /**
   * Construct and simulate a update_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update the configuration of an existing project.
   *
   * Allows maintainers to change the project's URL, commit hash, and maintainer list.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - The address of the maintainer calling this function
   * * `key` - The project key identifier
   * * `maintainers` - New list of maintainer addresses
   * * `url` - New Git repository URL
   * * `hash` - New commit hash
   *
   * # Panics
   * * If the project doesn't exist
   * * If the maintainer is not authorized
   */
  update_config: (
    {
      maintainer,
      key,
      maintainers,
      url,
      ipfs,
    }: {
      maintainer: string;
      key: Buffer;
      maintainers: Array<string>;
      url: string;
      ipfs: string;
    },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_sub_projects transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get sub-projects for a project (if it's an organization).
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - The project key identifier
   *
   * # Returns
   * * `Vec<Bytes>` - List of sub-project keys, empty if not an organization
   */
  get_sub_projects: (
    { project_key }: { project_key: Buffer },
    options?: AssembledTransactionOptions<Array<Buffer>>,
  ) => Promise<AssembledTransaction<Array<Buffer>>>;

  /**
   * Construct and simulate a set_sub_projects transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set sub-projects for a project (making it an organization).
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - The maintainer address calling this function
   * * `project_key` - The project key identifier
   * * `sub_projects` - List of sub-project keys to associate
   *
   * # Panics
   * * If the project doesn't exist
   * * If the maintainer is not authorized
   */
  set_sub_projects: (
    {
      maintainer,
      project_key,
      sub_projects,
    }: {
      maintainer: string;
      project_key: Buffer;
      sub_projects: Array<Buffer>;
    },
    options?: AssembledTransactionOptions<null>,
  ) => Promise<AssembledTransaction<null>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin }: { admin: string },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({ admin }, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAAAAAvtDYXN0IGEgdm90ZSBvbiBhIHByb3Bvc2FsLgoKQWxsb3dzIGEgbWVtYmVyIHRvIHZvdGUgb24gYSBwcm9wb3NhbC4KVGhlIHZvdGUgY2FuIGJlIGVpdGhlciBwdWJsaWMgb3IgYW5vbnltb3VzIGRlcGVuZGluZyBvbiB0aGUgcHJvcG9zYWwgY29uZmlndXJhdGlvbi4KRm9yIHB1YmxpYyB2b3RlcywgdGhlIGNob2ljZSBhbmQgd2VpZ2h0IGFyZSB2aXNpYmxlLiBGb3IgYW5vbnltb3VzIHZvdGVzLCBvbmx5CnRoZSB3ZWlnaHQgaXMgdmlzaWJsZSwgYW5kIHRoZSBjaG9pY2UgaXMgZW5jcnlwdGVkLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgdm90ZXJgIC0gVGhlIGFkZHJlc3Mgb2YgdGhlIHZvdGVyCiogYHByb2plY3Rfa2V5YCAtIFRoZSBwcm9qZWN0IGtleSBpZGVudGlmaWVyCiogYHByb3Bvc2FsX2lkYCAtIFRoZSBJRCBvZiB0aGUgcHJvcG9zYWwgdG8gdm90ZSBvbgoqIGB2b3RlYCAtIFRoZSB2b3RlIGRhdGEgKHB1YmxpYyBvciBhbm9ueW1vdXMpCgojIFBhbmljcwoqIElmIHRoZSB2b3RlciBoYXMgYWxyZWFkeSB2b3RlZAoqIElmIHRoZSB2b3RpbmcgcGVyaW9kIGhhcyBlbmRlZAoqIElmIHRoZSBwcm9wb3NhbCBpcyBub3QgYWN0aXZlIGFueW1vcmUKKiBJZiB0aGUgcHJvcG9zYWwgZG9lc24ndCBleGlzdAoqIElmIHRoZSB2b3RlcidzIHdlaWdodCBleGNlZWRzIHRoZWlyIG1heGltdW0gYWxsb3dlZCB3ZWlnaHQKKiBJZiB0aGUgdm90ZXIgaXMgbm90IGEgbWVtYmVyIG9mIHRoZSBwcm9qZWN0AAAAAAR2b3RlAAAABAAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAAAAAAR2b3RlAAAH0AAAAARWb3RlAAAAAA==",
        "AAAAAAAAA3hWZXJpZnkgdm90ZSBjb21taXRtZW50IHByb29mIGZvciBhbm9ueW1vdXMgdm90aW5nLgoKVmFsaWRhdGVzIHRoYXQgdGhlIHByb3ZpZGVkIHRhbGxpZXMgYW5kIHNlZWRzIG1hdGNoIHRoZSB2b3RlIGNvbW1pdG1lbnRzCndpdGhvdXQgcmV2ZWFsaW5nIGluZGl2aWR1YWwgdm90ZXMuIFRoaXMgZW5zdXJlcyB0aGUgaW50ZWdyaXR5IG9mIGFub255bW91cwp2b3RpbmcgcmVzdWx0cy4KClRoZSBjb21taXRtZW50IGlzOgoKQyA9IGdediAqIGheciAoaW4gYWRkaXRpdmUgbm90YXRpb246IGcqdiArIGgqciksCgp3aGVyZSBnLCBoIGFyZSBCTFMxMi0zODEgZ2VuZXJhdG9yIHBvaW50cyBhbmQgdiBpcyB0aGUgdm90ZSBjaG9pY2UsCnIgaXMgdGhlIHNlZWQuIFZvdGluZyB3ZWlnaHQgaXMgaW50cm9kdWNlZCBkdXJpbmcgdGhlIHRhbGx5aW5nIHBoYXNlLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcHJvamVjdF9rZXlgIC0gVGhlIHByb2plY3Qga2V5IGlkZW50aWZpZXIKKiBgcHJvcG9zYWxgIC0gVGhlIHByb3Bvc2FsIGNvbnRhaW5pbmcgdm90ZSBjb21taXRtZW50cwoqIGB0YWxsaWVzYCAtIERlY29kZWQgdGFsbHkgdmFsdWVzIFthcHByb3ZlLCByZWplY3QsIGFic3RhaW5dIChzY2FsZWQgYnkgd2VpZ2h0cykKKiBgc2VlZHNgIC0gRGVjb2RlZCBzZWVkIHZhbHVlcyBbYXBwcm92ZSwgcmVqZWN0LCBhYnN0YWluXSAoc2NhbGVkIGJ5IHdlaWdodHMpCgojIFJldHVybnMKKiBgYm9vbGAgLSBUcnVlIGlmIGFsbCBjb21taXRtZW50cyBtYXRjaCB0aGUgcHJvdmlkZWQgdGFsbGllcyBhbmQgc2VlZHMKCiMgUGFuaWNzCiogSWYgbm8gYW5vbnltb3VzIHZvdGluZyBjb25maWd1cmF0aW9uIGV4aXN0cyBmb3IgdGhlIHByb2plY3QAAAAFcHJvb2YAAAAAAAAEAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAhwcm9wb3NhbAAAB9AAAAAIUHJvcG9zYWwAAAAAAAAAB3RhbGxpZXMAAAAD6gAAAAoAAAAAAAAABXNlZWRzAAAAAAAD6gAAAAoAAAABAAAAAQ==",
        "AAAAAAAABABFeGVjdXRlIGEgdm90ZSBhZnRlciB0aGUgdm90aW5nIHBlcmlvZCBlbmRzLgoKUHJvY2Vzc2VzIHRoZSB2b3RpbmcgcmVzdWx0cyBhbmQgZGV0ZXJtaW5lcyB0aGUgZmluYWwgc3RhdHVzIG9mIHRoZSBwcm9wb3NhbC4KRm9yIHB1YmxpYyB2b3RlcywgdGhlIHJlc3VsdHMgYXJlIGNhbGN1bGF0ZWQgZGlyZWN0bHkgZnJvbSB2b3RlIGNvdW50cy4KRm9yIGFub255bW91cyB2b3RlcywgdGFsbGllcyBhbmQgc2VlZHMgYXJlIHZhbGlkYXRlZCBhZ2FpbnN0IHZvdGUgY29tbWl0bWVudHMKdG8gZW5zdXJlIHRoZSByZXN1bHRzIGFyZSBjb3JyZWN0LgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgbWFpbnRhaW5lcmAgLSBUaGUgYWRkcmVzcyBvZiB0aGUgbWFpbnRhaW5lciBleGVjdXRpbmcgdGhlIHByb3Bvc2FsCiogYHByb2plY3Rfa2V5YCAtIFRoZSBwcm9qZWN0IGtleSBpZGVudGlmaWVyCiogYHByb3Bvc2FsX2lkYCAtIFRoZSBJRCBvZiB0aGUgcHJvcG9zYWwgdG8gZXhlY3V0ZQoqIFtgT3B0aW9uPHRhbGxpZXM+YF0gLSBkZWNvZGVkIHRhbGx5IHZhbHVlcyAoc2NhbGVkIGJ5IHdlaWdodHMpLCByZXNwZWN0aXZlbHkgQXBwcm92ZSwgcmVqZWN0IGFuZCBhYnN0YWluCiogW2BPcHRpb248c2VlZHM+YF0gLSBkZWNvZGVkIHNlZWQgdmFsdWVzIChzY2FsZWQgYnkgd2VpZ2h0cyksIHJlc3BlY3RpdmVseSBBcHByb3ZlLCByZWplY3QgYW5kIGFic3RhaW4KCiMgUmV0dXJucwoqIGB0eXBlczo6UHJvcG9zYWxTdGF0dXNgIC0gVGhlIGZpbmFsIHN0YXR1cyBvZiB0aGUgcHJvcG9zYWwgKEFwcHJvdmVkLCBSZWplY3RlZCwgb3IgQ2FuY2VsbGVkKQoKIyBQYW5pY3MKKiBJZiB0aGUgdm90aW5nIHBlcmlvZCBoYXNuJ3QgZW5kZWQKKiBJZiB0aGUgcHJvcG9zYWwgZG9lc24ndCBleGlzdAoqIElmIHRoZSBwcm9wb3NhbCBpcyBub3QgYWN0aXZlIGFueW1vcmUKKiBJZiB0YWxsaWVzL3NlZWRzIGFyZSBtaXNzaW5nIGZvciBhbm9ueW1vdXMgdm90ZXMKKiBJZiBjb21taXRtZW50AAAAB2V4ZWN1dGUAAAAABQAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAAAAAAHdGFsbGllcwAAAAPoAAAD6gAAAAoAAAAAAAAABXNlZWRzAAAAAAAD6AAAA+oAAAAKAAAAAQAAB9AAAAAOUHJvcG9zYWxTdGF0dXMAAA==",
        "AAAAAAAAAUdSZXR1cm5zIGEgcGFnZSBvZiBwcm9wb3NhbHMgKDAgdG8gTUFYX1BST1BPU0FMU19QRVJfUEFHRSBwcm9wb3NhbHMgcGVyIHBhZ2UpLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcHJvamVjdF9rZXlgIC0gVGhlIHByb2plY3Qga2V5IGlkZW50aWZpZXIKKiBgcGFnZWAgLSBUaGUgcGFnZSBudW1iZXIgKDAtYmFzZWQpCgojIFJldHVybnMKKiBgdHlwZXM6OkRhb2AgLSBUaGUgREFPIG9iamVjdCBjb250YWluaW5nIGEgcGFnZSBvZiBwcm9wb3NhbHMKCiMgUGFuaWNzCiogSWYgdGhlIHBhZ2UgbnVtYmVyIGlzIG91dCBvZiBib3VuZHMAAAAAB2dldF9kYW8AAAAAAgAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAEcGFnZQAAAAQAAAABAAAH0AAAAANEYW8A",
        "AAAAAAAAAQtHZXQgYSBzaW5nbGUgcHJvcG9zYWwgYnkgSUQuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBUaGUgcHJvamVjdCBrZXkgaWRlbnRpZmllcgoqIGBwcm9wb3NhbF9pZGAgLSBUaGUgSUQgb2YgdGhlIHByb3Bvc2FsIHRvIHJldHJpZXZlCgojIFJldHVybnMKKiBgdHlwZXM6OlByb3Bvc2FsYCAtIFRoZSBwcm9wb3NhbCBvYmplY3QKCiMgUGFuaWNzCiogSWYgdGhlIHByb3Bvc2FsIGRvZXNuJ3QgZXhpc3QAAAAADGdldF9wcm9wb3NhbAAAAAIAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAQAAAABAAAH0AAAAAhQcm9wb3NhbA==",
        "AAAAAAAAAzhDcmVhdGUgYSBuZXcgcHJvcG9zYWwgZm9yIGEgcHJvamVjdC4KClRoZSBwcm9wb3NlciBpcyBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIHRoZSBhYnN0YWluIGdyb3VwLgpCeSBjcmVhdGluZyBhIHByb3Bvc2FsLCB0aGUgcHJvcG9zZXIgaW5jdXIgYSBjb2xsYXRlcmFsIHdoaWNoIGlzCnJlcGFpZCB1cG9uIGV4ZWN1dGlvbiBvZiB0aGUgcHJvcG9zYWwgdW5sZXNzIHRoZSBwcm9wb3NhbCBpcyByZXZva2VkLgpUaGlzIGlzIGEgZGV0ZXJyZW50IG1lY2hhbmlzbS4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYHByb3Bvc2VyYCAtIEFkZHJlc3Mgb2YgdGhlIHByb3Bvc2FsIGNyZWF0b3IKKiBgcHJvamVjdF9rZXlgIC0gVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBwcm9qZWN0CiogYHRpdGxlYCAtIFRpdGxlIG9mIHRoZSBwcm9wb3NhbAoqIGBpcGZzYCAtIElQRlMgY29udGVudCBpZGVudGlmaWVyIGRlc2NyaWJpbmcgdGhlIHByb3Bvc2FsCiogYHZvdGluZ19lbmRzX2F0YCAtIFVOSVggdGltZXN0YW1wIHdoZW4gdm90aW5nIGVuZHMKKiBgcHVibGljX3ZvdGluZ2AgLSBXaGV0aGVyIHZvdGluZyBpcyBwdWJsaWMgb3IgYW5vbnltb3VzCiogW2BPcHRpb248b3V0Y29tZXNfY29udHJhY3Q+YF0gLSBPdXRjb21lIGNvbnRyYWN0IGFkZHJlc3MKCiMgUmV0dXJucwoqIGB1MzJgIC0gVGhlIElEIG9mIHRoZSBjcmVhdGVkIHByb3Bvc2FsLgoKIyBQYW5pY3MKKiBJZiB0aGUgdGl0bGUgaXMgdG9vIGxvbmcKKiBJZiB0aGUgdm90aW5nIHBlcmlvZCBpcyBpbnZhbGlkCiogSWYgdGhlIHByb2plY3QgZG9lc24ndCBleGlzdAAAAA9jcmVhdGVfcHJvcG9zYWwAAAAABwAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAABGlwZnMAAAAQAAAAAAAAAA52b3RpbmdfZW5kc19hdAAAAAAABgAAAAAAAAANcHVibGljX3ZvdGluZwAAAAAAAAEAAAAAAAAAEW91dGNvbWVzX2NvbnRyYWN0AAAAAAAD6AAAABMAAAABAAAABA==",
        "AAAAAAAAAY1SZXZva2UgYSBwcm9wb3NhbC4KClVzZWZ1bCBpZiB0aGVyZSB3YXMgc29tZSBzcGFtIG9yIGJhZCBpbnRlbnQuIFRoYXQgd2lsbCBwcmV2ZW50IHRoZQpjb2xsYXRlcmFsIHRvIGJlIGNsYWltZWQgYmFjay4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYG1haW50YWluZXJgIC0gQWRkcmVzcyBvZiB0aGUgcHJvcG9zYWwgY3JlYXRvcgoqIGBwcm9qZWN0X2tleWAgLSBUaGUgcHJvamVjdCBrZXkgaWRlbnRpZmllcgoqIGBwcm9wb3NhbF9pZGAgLSBUaGUgSUQgb2YgdGhlIHByb3Bvc2FsIHRvIHZvdGUgb24KCiMgUGFuaWNzCiogSWYgdGhlIHByb3Bvc2FsIGlzIG5vdCBhY3RpdmUgYW55bW9yZQoqIElmIHRoZSBtYWludGFpbmVyIGlzIG5vdCBhdXRob3JpemVkAAAAAAAAD3Jldm9rZV9wcm9wb3NhbAAAAAADAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAA==",
        "AAAAAAAAAXZTZXR1cCBhbm9ueW1vdXMgdm90aW5nIGZvciBhIHByb2plY3QuCgpDb25maWd1cmVzIEJMUzEyLTM4MSBjcnlwdG9ncmFwaGljIHByaW1pdGl2ZXMgZm9yIGFub255bW91cyB2b3RpbmcuCk9ubHkgdGhlIGNvbnRyYWN0IGFkbWluIGNhbiBjYWxsIHRoaXMgZnVuY3Rpb24uCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHVibGljX2tleWAgLSBBc3ltbWV0cmljIHB1YmxpYyBrZXkgdG8gYmUgdXNlZCBmb3Igdm90ZSBlbmNyeXB0aW9uCgojIFBhbmljcwoqIElmIHRoZSBjYWxsZXIgaXMgbm90IHRoZSBjb250cmFjdCBhZG1pbgAAAAAAFmFub255bW91c192b3Rpbmdfc2V0dXAAAAAAAAMAAAAAAAAACm1haW50YWluZXIAAAAAABMAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAAAAAAACnB1YmxpY19rZXkAAAAAABAAAAAA",
        "AAAAAAAAASdHZXQgdGhlIGFub255bW91cyB2b3RpbmcgY29uZmlndXJhdGlvbiBmb3IgYSBwcm9qZWN0LgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcHJvamVjdF9rZXlgIC0gVGhlIHByb2plY3Qga2V5IGlkZW50aWZpZXIKCiMgUmV0dXJucwoqIGB0eXBlczo6QW5vbnltb3VzVm90ZUNvbmZpZ2AgLSBUaGUgYW5vbnltb3VzIHZvdGluZyBjb25maWd1cmF0aW9uCgojIFBhbmljcwoqIElmIG5vIGFub255bW91cyB2b3RpbmcgY29uZmlndXJhdGlvbiBleGlzdHMgZm9yIHRoZSBwcm9qZWN0AAAAABtnZXRfYW5vbnltb3VzX3ZvdGluZ19jb25maWcAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAfQAAAAE0Fub255bW91c1ZvdGVDb25maWcA",
        "AAAAAAAAAxJCdWlsZCB2b3RlIGNvbW1pdG1lbnRzIGZyb20gdm90ZXMgYW5kIHNlZWRzIGZvciBhbm9ueW1vdXMgdm90aW5nLgoKQ3JlYXRlcyBCTFMxMi0zODEgY29tbWl0bWVudHMgZm9yIGVhY2ggdm90ZSB1c2luZyB0aGUgZm9ybXVsYToKQyA9IGfCt3ZvdGUgKyBowrdzZWVkIHdoZXJlIGcgYW5kIGggYXJlIGdlbmVyYXRvciBwb2ludHMgb24gQkxTMTItMzgxLgoKTm90ZTogVGhpcyBmdW5jdGlvbiBkb2VzIG5vdCBjb25zaWRlciB2b3Rpbmcgd2VpZ2h0cywgd2hpY2ggYXJlIGFwcGxpZWQKZHVyaW5nIHRoZSB0YWxseWluZyBwaGFzZS4gQ2FsbGluZyB0aGlzIG9uIHRoZSBzbWFydCBjb250cmFjdCB3b3VsZCByZXZlYWwKdGhlIHZvdGVzIGFuZCBzZWVkcywgc28gaXQgbXVzdCBiZSBydW4gZWl0aGVyIGluIHNpbXVsYXRpb24gb3IgY2xpZW50LXNpZGUuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgdm90ZXNgIC0gVmVjdG9yIG9mIHZvdGUgY2hvaWNlcyAoMD1hcHByb3ZlLCAxPXJlamVjdCwgMj1hYnN0YWluKQoqIGBzZWVkc2AgLSBWZWN0b3Igb2YgcmFuZG9tIHNlZWRzIGZvciBlYWNoIHZvdGUKCiMgUmV0dXJucwoqIGBWZWM8Qnl0ZXNOPDk2Pj5gIC0gVmVjdG9yIG9mIHZvdGUgY29tbWl0bWVudHMgKG9uZSBwZXIgdm90ZSkKCiMgUGFuaWNzCiogSWYgbm8gYW5vbnltb3VzIHZvdGluZyBjb25maWd1cmF0aW9uIGV4aXN0cyBmb3IgdGhlIHByb2plY3QAAAAAABxidWlsZF9jb21taXRtZW50c19mcm9tX3ZvdGVzAAAAAwAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAFdm90ZXMAAAAAAAPqAAAACgAAAAAAAAAFc2VlZHMAAAAAAAPqAAAACgAAAAEAAAPqAAAD7gAAAGA=",
        "AAAAAAAAAM1QYXVzZSBvciB1bnBhdXNlIHRoZSBjb250cmFjdCAoZW1lcmdlbmN5IHN0b3AuKQoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgYWRtaW5gIC0gVGhlIGFkbWluIGFkZHJlc3MKKiBgcGF1c2VkYCAtIFBhdXNlIG9yIHVucGF1c2UgdGhlIGNvbnRyYWN0IG9wZXJhdGlvbnMgd2hpY2ggY2hhbmdlCmxlZGdlciBzdGF0ZXMuAAAAAAAABXBhdXNlAAAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAAA",
        "AAAAAAAAAFlHZXQgdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgY29udHJhY3QuCgojIFJldHVybnMKKiBgdTMyYCAtIFRoZSBjb250cmFjdCB2ZXJzaW9uIG51bWJlcgAAAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAINJbml0aWFsaXplIHRoZSBUYW5zdSBjb250cmFjdCB3aXRoIGFkbWluIGNvbmZpZ3VyYXRpb24uCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBhZG1pbmAgLSBUaGUgYWRtaW4gYWRkcmVzcwAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAANVBcHByb3ZlIGFuIHVwZ3JhZGUgcHJvcG9zYWwKCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYGFkbWluYCAtIEFuIGFkbWluIGFkZHJlc3MKCiMgUGFuaWNzCiogSWYgdGhlIGFkbWluIGlzIG5vdCBhdXRob3JpemVkCiogSWYgdGhlIGFkbWluIGFscmVhZHkgYXBwcm92ZWQKKiBJZiB0aGVyZSBpcyBubyB1cGdyYWRlIHRvIGFwcHJvdmUAAAAAAAAPYXBwcm92ZV91cGdyYWRlAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAU5Qcm9wb3NlIGEgY29udHJhY3QgdXBncmFkZS4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYGFkbWluYCAtIEFuIGFkbWluIGFkZHJlc3MKKiBgbmV3X3dhc21faGFzaGAgLSBUaGUgbmV3IFdBU00gaGFzaAoqIGBuZXdfYWRtaW5zX2NvbmZpZ2AgLSBPcHRpb25hbCBuZXcgYWRtaW4gY29uZmlndXJhdGlvbiAoTm9uZSB0byBrZWVwIGN1cnJlbnQpCgojIFBhbmljcwoqIElmIHRoZSBhZG1pbiBpcyBub3QgYXV0aG9yaXplZAoqIElmIHRoZXJlIGlzIGFscmVhZHkgYW4gZXhpc3RpbmcgcHJvcG9zYWwgKGNhbmNlbCB0aGUgcHJldmlvdXMgZmlyc3QpAAAAAAAPcHJvcG9zZV91cGdyYWRlAAAAAAMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAANbmV3X3dhc21faGFzaAAAAAAAA+4AAAAgAAAAAAAAABFuZXdfYWRtaW5zX2NvbmZpZwAAAAAAA+gAAAfQAAAADEFkbWluc0NvbmZpZwAAAAA=",
        "AAAAAAAAAaRFeGVjdXRlIG9yIGNhbmNlbCB1cGdyYWRlIHByb3Bvc2FsCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBhZG1pbmAgLSBBbiBhZG1pbiBhZGRyZXNzCiogYGFjY2VwdGAgLSB0cnVlIHRvIGFjY2VwdCBhbmQgZmFsc2UgdG8gcmVqZWN0LgoKVXBncmFkZXMgY2FuIGFsd2F5cyBiZSBjYW5jZWxsZWQgYnV0IG9ubHkgZXhlY3V0ZWQgaWYgdGhlcmUgYXJlIGVub3VnaAphcHByb3ZhbHMgYW5kIHRoZSB0aW1lbG9jayBwZXJpb2QgaXMgb3Zlci4KCiMgUGFuaWNzCiogSWYgdGhlIGFkbWluIGlzIG5vdCBhdXRob3JpemVkCiogSWYgaXQgaXMgdG9vIGVhcmx5IHRvIGV4ZWN1dGUKKiBJZiB0aGVyZSBhcmUgbm90IGVub3VnaCBhcHByb3ZhbHMKKiBJZiB0aGVyZSBpcyBubyB1cGdyYWRlIHRvIGV4ZWN1dGUAAAAQZmluYWxpemVfdXBncmFkZQAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAGYWNjZXB0AAAAAAABAAAAAA==",
        "AAAAAAAAAJ1HZXQgY3VycmVudCBhZG1pbmlzdHJhdG9ycyBjb25maWd1cmF0aW9uLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKCiMgUmV0dXJucwoqIGB0eXBlczo6QWRtaW5zQ29uZmlnYCAtIFRoZSBhZG1pbmlzdHJhdG9ycyBjb25maWd1cmF0aW9uAAAAAAAAEWdldF9hZG1pbnNfY29uZmlnAAAAAAAAAAAAAAEAAAfQAAAADEFkbWluc0NvbmZpZw==",
        "AAAAAAAAAF5SZXF1aXJlIHRoYXQgdGhlIGNvbnRyYWN0IGlzIG5vdCBwYXVzZWQsIHBhbmljIGlmIGl0IGlzCgojIFBhbmljcwoqIElmIHRoZSBjb250cmFjdCBpcyBwYXVzZWQuAAAAAAAScmVxdWlyZV9ub3RfcGF1c2VkAAAAAAAAAAAAAA==",
        "AAAAAAAAAJpTZXQgdGhlIFNvcm9iYW4gRG9tYWluIGNvbnRyYWN0LgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgYWRtaW5gIC0gVGhlIGFkbWluIGFkZHJlc3MKKiBgZG9tYWluX2NvbnRyYWN0YCAtIFRoZSBuZXcgZG9tYWluIGNvbnRyYWN0AAAAAAATc2V0X2RvbWFpbl9jb250cmFjdAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAD2RvbWFpbl9jb250cmFjdAAAAAfQAAAACENvbnRyYWN0AAAAAA==",
        "AAAAAAAAABxHZXQgdXBncmFkZSBwcm9wb3NhbCBkZXRhaWxzAAAAFGdldF91cGdyYWRlX3Byb3Bvc2FsAAAAAAAAAAEAAAfQAAAAD1VwZ3JhZGVQcm9wb3NhbAA=",
        "AAAAAAAAAJ5TZXQgdGhlIENvbGxhdGVyYWwgY29udHJhY3QuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBhZG1pbmAgLSBUaGUgYWRtaW4gYWRkcmVzcwoqIGBjb2xsYXRlcmFsX2NvbnRyYWN0YCAtIFRoZSBuZXcgY29sbGF0ZXJhbCBjb250cmFjdAAAAAAAF3NldF9jb2xsYXRlcmFsX2NvbnRyYWN0AAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAATY29sbGF0ZXJhbF9jb250cmFjdAAAAAfQAAAACENvbnRyYWN0AAAAAA==",
        "AAAAAAAAAQJBZGQgYSBuZXcgbWVtYmVyIHRvIHRoZSBzeXN0ZW0gd2l0aCBtZXRhZGF0YS4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYG1lbWJlcl9hZGRyZXNzYCAtIFRoZSBhZGRyZXNzIG9mIHRoZSBtZW1iZXIgdG8gYWRkCiogYG1ldGFgIC0gTWV0YWRhdGEgc3RyaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgbWVtYmVyIChlLmcuLCBJUEZTIGhhc2gpCgojIFBhbmljcwoqIElmIHRoZSBtZW1iZXIgYWxyZWFkeSBleGlzdHMAAAAAAAphZGRfbWVtYmVyAAAAAAACAAAAAAAAAA5tZW1iZXJfYWRkcmVzcwAAAAAAEwAAAAAAAAAEbWV0YQAAABAAAAAA",
        "AAAAAAAAAWVHZXQgYWxsIGJhZGdlcyBmb3IgYSBzcGVjaWZpYyBwcm9qZWN0LCBvcmdhbml6ZWQgYnkgYmFkZ2UgdHlwZS4KClJldHVybnMgYSBzdHJ1Y3R1cmUgY29udGFpbmluZyB2ZWN0b3JzIG9mIG1lbWJlciBhZGRyZXNzZXMgZm9yIGVhY2ggYmFkZ2UgdHlwZQooRGV2ZWxvcGVyLCBUcmlhZ2UsIENvbW11bml0eSwgVmVyaWZpZWQpLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBga2V5YCAtIFRoZSBwcm9qZWN0IGtleSBpZGVudGlmaWVyCgojIFJldHVybnMKKiBgdHlwZXM6OkJhZGdlc2AgLSBTdHJ1Y3R1cmUgY29udGFpbmluZyBtZW1iZXIgYWRkcmVzc2VzIGZvciBlYWNoIGJhZGdlIHR5cGUAAAAAAAAKZ2V0X2JhZGdlcwAAAAAAAQAAAAAAAAADa2V5AAAAAA4AAAABAAAH0AAAAAZCYWRnZXMAAA==",
        "AAAAAAAAAR1HZXQgbWVtYmVyIGluZm9ybWF0aW9uIGluY2x1ZGluZyBhbGwgcHJvamVjdCBiYWRnZXMuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBtZW1iZXJfYWRkcmVzc2AgLSBUaGUgYWRkcmVzcyBvZiB0aGUgbWVtYmVyIHRvIHJldHJpZXZlCgojIFJldHVybnMKKiBgdHlwZXM6Ok1lbWJlcmAgLSBNZW1iZXIgaW5mb3JtYXRpb24gaW5jbHVkaW5nIG1ldGFkYXRhIGFuZCBwcm9qZWN0IGJhZGdlcwoKIyBQYW5pY3MKKiBJZiB0aGUgbWVtYmVyIGRvZXNuJ3QgZXhpc3QAAAAAAAAKZ2V0X21lbWJlcgAAAAAAAQAAAAAAAAAObWVtYmVyX2FkZHJlc3MAAAAAABMAAAABAAAH0AAAAAZNZW1iZXIAAA==",
        "AAAAAAAAAltTZXQgYmFkZ2VzIGZvciBhIG1lbWJlciBpbiBhIHNwZWNpZmljIHByb2plY3QuCgpUaGlzIGZ1bmN0aW9uIHJlcGxhY2VzIGFsbCBleGlzdGluZyBiYWRnZXMgZm9yIHRoZSBtZW1iZXIgaW4gdGhlIHNwZWNpZmllZCBwcm9qZWN0CndpdGggdGhlIG5ldyBiYWRnZSBsaXN0LiBUaGUgbWVtYmVyJ3MgbWF4aW11bSB2b3RpbmcKd2VpZ2h0IGlzIGNhbGN1bGF0ZWQgYXMgdGhlIHN1bSBvZiBhbGwgYXNzaWduZWQgYmFkZ2Ugd2VpZ2h0cy4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYG1haW50YWluZXJgIC0gVGhlIGFkZHJlc3Mgb2YgdGhlIG1haW50YWluZXIgKG11c3QgYmUgYXV0aG9yaXplZCkKKiBga2V5YCAtIFRoZSBwcm9qZWN0IGtleSBpZGVudGlmaWVyCiogYG1lbWJlcmAgLSBUaGUgYWRkcmVzcyBvZiB0aGUgbWVtYmVyIHRvIHNldCBiYWRnZXMgZm9yCiogYGJhZGdlc2AgLSBWZWN0b3Igb2YgYmFkZ2VzIHRvIGFzc2lnbgoKIyBQYW5pY3MKKiBJZiB0aGUgbWFpbnRhaW5lciBpcyBub3QgYXV0aG9yaXplZAoqIElmIHRoZSBtZW1iZXIgZG9lc24ndCBleGlzdAoqIElmIHRoZSBwcm9qZWN0IGRvZXNuJ3QgZXhpc3QAAAAACnNldF9iYWRnZXMAAAAAAAQAAAAAAAAACm1haW50YWluZXIAAAAAABMAAAAAAAAAA2tleQAAAAAOAAAAAAAAAAZtZW1iZXIAAAAAABMAAAAAAAAABmJhZGdlcwAAAAAD6gAAB9AAAAAFQmFkZ2UAAAAAAAAA",
        "AAAAAAAAAiFHZXQgdGhlIG1heGltdW0gdm90aW5nIHdlaWdodCBmb3IgYSBtZW1iZXIgaW4gYSBzcGVjaWZpYyBwcm9qZWN0LgoKQ2FsY3VsYXRlcyB0aGUgc3VtIG9mIGFsbCBiYWRnZSB3ZWlnaHRzIGZvciB0aGUgbWVtYmVyIGluIHRoZSBwcm9qZWN0LgpJZiBubyBiYWRnZXMgYXJlIGFzc2lnbmVkLCByZXR1cm5zIHRoZSBEZWZhdWx0IGJhZGdlIHdlaWdodCAoMSkuClRoaXMgd2VpZ2h0IGRldGVybWluZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIHZvdGVzIHRoZSBtZW1iZXIgY2FuIGNhc3QKaW4gYSBzaW5nbGUgdm90aW5nIHRyYW5zYWN0aW9uLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcHJvamVjdF9rZXlgIC0gVGhlIHByb2plY3Qga2V5IGlkZW50aWZpZXIKKiBgbWVtYmVyX2FkZHJlc3NgIC0gVGhlIGFkZHJlc3Mgb2YgdGhlIG1lbWJlcgoKIyBSZXR1cm5zCiogYHUzMmAgLSBUaGUgbWF4aW11bSB2b3Rpbmcgd2VpZ2h0IGZvciB0aGUgbWVtYmVyCgojIFBhbmljcwoqIElmIHRoZSBtZW1iZXIgZG9lc24ndCBleGlzdAAAAAAAAA5nZXRfbWF4X3dlaWdodAAAAAAAAgAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAObWVtYmVyX2FkZHJlc3MAAAAAABMAAAABAAAABA==",
        "AAAAAAAAAXNTZXQgdGhlIGxhdGVzdCBjb21taXQgaGFzaCBmb3IgYSBwcm9qZWN0LgoKVXBkYXRlcyB0aGUgY3VycmVudCBjb21taXQgaGFzaCBmb3IgdGhlIHNwZWNpZmllZCBwcm9qZWN0LgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgbWFpbnRhaW5lcmAgLSBUaGUgYWRkcmVzcyBvZiB0aGUgbWFpbnRhaW5lciBjYWxsaW5nIHRoaXMgZnVuY3Rpb24KKiBgcHJvamVjdF9rZXlgIC0gVGhlIHByb2plY3Qga2V5IGlkZW50aWZpZXIKKiBgaGFzaGAgLSBUaGUgbmV3IGNvbW1pdCBoYXNoCgojIFBhbmljcwoqIElmIHRoZSBwcm9qZWN0IGRvZXNuJ3QgZXhpc3QKKiBJZiB0aGUgbWFpbnRhaW5lciBpcyBub3QgYXV0aG9yaXplZAAAAAAGY29tbWl0AAAAAAADAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAA15SZWdpc3RlciBhIG5ldyBwcm9qZWN0LgoKQ3JlYXRlcyBhIG5ldyBwcm9qZWN0IGVudHJ5IHdpdGggbWFpbnRhaW5lcnMsIFVSTCwgYW5kIGNvbW1pdCBoYXNoLgpBbHNvIHJlZ2lzdGVycyB0aGUgcHJvamVjdCBuYW1lIGluIHRoZSBkb21haW4gY29udHJhY3QgaWYgbm90IGFscmVhZHkgcmVnaXN0ZXJlZC4KVGhlIHByb2plY3Qga2V5IGlzIGdlbmVyYXRlZCB1c2luZyBrZWNjYWsyNTYgaGFzaCBvZiB0aGUgcHJvamVjdCBuYW1lLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgbWFpbnRhaW5lcmAgLSBUaGUgYWRkcmVzcyBvZiB0aGUgbWFpbnRhaW5lciBjYWxsaW5nIHRoaXMgZnVuY3Rpb24KKiBgbmFtZWAgLSBUaGUgcHJvamVjdCBuYW1lIChtYXggMTUgY2hhcmFjdGVycykKKiBgbWFpbnRhaW5lcnNgIC0gTGlzdCBvZiBtYWludGFpbmVyIGFkZHJlc3NlcyBmb3IgdGhlIHByb2plY3QKKiBgdXJsYCAtIFRoZSBwcm9qZWN0J3MgR2l0IHJlcG9zaXRvcnkgVVJMCiogYGlwZnNgIC0gQ0lEIG9mIHRoZSB0YW5zdS50b21sIGZpbGUgd2l0aCBhc3NvY2lhdGVkIG1ldGFkYXRhCgojIFJldHVybnMKKiBgQnl0ZXNgIC0gVGhlIHByb2plY3Qga2V5IChrZWNjYWsyNTYgaGFzaCBvZiB0aGUgbmFtZSkKCiMgUGFuaWNzCiogSWYgdGhlIHByb2plY3QgbmFtZSBpcyBsb25nZXIgdGhhbiAxNSBjaGFyYWN0ZXJzCiogSWYgdGhlIHByb2plY3QgYWxyZWFkeSBleGlzdHMKKiBJZiB0aGUgbWFpbnRhaW5lciBpcyBub3QgYXV0aG9yaXplZAoqIElmIHRoZSBkb21haW4gcmVnaXN0cmF0aW9uIGZhaWxzCiogSWYgdGhlIG1haW50YWluZXIgZG9lc24ndCBvd24gYW4gZXhpc3RpbmcgZG9tYWluAAAAAAAIcmVnaXN0ZXIAAAAFAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAALbWFpbnRhaW5lcnMAAAAD6gAAABMAAAAAAAAAA3VybAAAAAAQAAAAAAAAAARpcGZzAAAAEAAAAAEAAAAO",
        "AAAAAAAAAPZHZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gKR2V0IHRoZSBsYXRlc3QgY29tbWl0IGhhc2ggZm9yIGEgcHJvamVjdC4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYHByb2plY3Rfa2V5YCAtIFRoZSBwcm9qZWN0IGtleSBpZGVudGlmaWVyCgojIFJldHVybnMKKiBgU3RyaW5nYCAtIFRoZSBjdXJyZW50IGNvbW1pdCBoYXNoCgojIFBhbmljcwoqIElmIHRoZSBwcm9qZWN0IGRvZXNuJ3QgZXhpc3QAAAAAAApnZXRfY29tbWl0AAAAAAABAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAQAAABA=",
        "AAAAAAAAASBHZXQgcHJvamVjdCBpbmZvcm1hdGlvbiBpbmNsdWRpbmcgY29uZmlndXJhdGlvbiBhbmQgbWFpbnRhaW5lcnMuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBUaGUgcHJvamVjdCBrZXkgaWRlbnRpZmllcgoKIyBSZXR1cm5zCiogYHR5cGVzOjpQcm9qZWN0YCAtIFByb2plY3QgaW5mb3JtYXRpb24gaW5jbHVkaW5nIG5hbWUsIGNvbmZpZywgYW5kIG1haW50YWluZXJzCgojIFBhbmljcwoqIElmIHRoZSBwcm9qZWN0IGRvZXNuJ3QgZXhpc3QAAAALZ2V0X3Byb2plY3QAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAfQAAAAB1Byb2plY3QA",
        "AAAAAAAAALZHZXQgYSBwYWdlIG9mIHByb2plY3RzLgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcGFnZWAgLSBUaGUgcGFnZSBudW1iZXIgKDAtYmFzZWQpCgojIFJldHVybnMKKiBgVmVjPHR5cGVzOjpQcm9qZWN0PmAgLSBMaXN0IG9mIHByb2plY3RzIG9uIHRoZSByZXF1ZXN0ZWQgcGFnZQAAAAAADGdldF9wcm9qZWN0cwAAAAEAAAAAAAAABHBhZ2UAAAAEAAAAAQAAA+oAAAfQAAAAB1Byb2plY3QA",
        "AAAAAAAAAdlVcGRhdGUgdGhlIGNvbmZpZ3VyYXRpb24gb2YgYW4gZXhpc3RpbmcgcHJvamVjdC4KCkFsbG93cyBtYWludGFpbmVycyB0byBjaGFuZ2UgdGhlIHByb2plY3QncyBVUkwsIGNvbW1pdCBoYXNoLCBhbmQgbWFpbnRhaW5lciBsaXN0LgoKIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgbWFpbnRhaW5lcmAgLSBUaGUgYWRkcmVzcyBvZiB0aGUgbWFpbnRhaW5lciBjYWxsaW5nIHRoaXMgZnVuY3Rpb24KKiBga2V5YCAtIFRoZSBwcm9qZWN0IGtleSBpZGVudGlmaWVyCiogYG1haW50YWluZXJzYCAtIE5ldyBsaXN0IG9mIG1haW50YWluZXIgYWRkcmVzc2VzCiogYHVybGAgLSBOZXcgR2l0IHJlcG9zaXRvcnkgVVJMCiogYGhhc2hgIC0gTmV3IGNvbW1pdCBoYXNoCgojIFBhbmljcwoqIElmIHRoZSBwcm9qZWN0IGRvZXNuJ3QgZXhpc3QKKiBJZiB0aGUgbWFpbnRhaW5lciBpcyBub3QgYXV0aG9yaXplZAAAAAAAAA11cGRhdGVfY29uZmlnAAAAAAAABQAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAADa2V5AAAAAA4AAAAAAAAAC21haW50YWluZXJzAAAAA+oAAAATAAAAAAAAAAN1cmwAAAAAEAAAAAAAAAAEaXBmcwAAABAAAAAA",
        "AAAAAQAAAAAAAAAAAAAAA0RhbwAAAAABAAAAAAAAAAlwcm9wb3NhbHMAAAAAAAPqAAAH0AAAAAhQcm9wb3NhbA==",
        "AAAAAgAAAAAAAAAAAAAABFZvdGUAAAACAAAAAQAAAAAAAAAKUHVibGljVm90ZQAAAAAAAQAAB9AAAAAKUHVibGljVm90ZQAAAAAAAQAAAAAAAAANQW5vbnltb3VzVm90ZQAAAAAAAAEAAAfQAAAADUFub255bW91c1ZvdGUAAAA=",
        "AAAAAwAAAAAAAAAAAAAABUJhZGdlAAAAAAAABQAAAAAAAAAJRGV2ZWxvcGVyAAAAAJiWgAAAAAAAAAAGVHJpYWdlAAAATEtAAAAAAAAAAAlDb21tdW5pdHkAAAAAD0JAAAAAAAAAAAhWZXJpZmllZAAHoSAAAAAAAAAAB0RlZmF1bHQAAAAAAQ==",
        "AAAAAQAAAAAAAAAAAAAABkJhZGdlcwAAAAAABAAAAAAAAAAJY29tbXVuaXR5AAAAAAAD6gAAABMAAAAAAAAACWRldmVsb3BlcgAAAAAAA+oAAAATAAAAAAAAAAZ0cmlhZ2UAAAAAA+oAAAATAAAAAAAAAAh2ZXJpZmllZAAAA+oAAAAT",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAgAAAAAAAAAEaXBmcwAAABAAAAAAAAAAA3VybAAAAAAQ",
        "AAAAAQAAAAAAAAAAAAAABk1lbWJlcgAAAAAAAgAAAAAAAAAEbWV0YQAAABAAAAAAAAAACHByb2plY3RzAAAD6gAAB9AAAAANUHJvamVjdEJhZGdlcwAAAA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAABk1lbWJlcgAAAAAAAQAAABMAAAAAAAAAAAAAAAZQYXVzZWQAAAAAAAAAAAAAAAAAD1VwZ3JhZGVQcm9wb3NhbAAAAAAAAAAAAAAAAAxBZG1pbnNDb25maWc=",
        "AAAAAQAAAAAAAAAAAAAAB1Byb2plY3QAAAAAAwAAAAAAAAAGY29uZmlnAAAAAAfQAAAABkNvbmZpZwAAAAAAAAAAAAttYWludGFpbmVycwAAAAPqAAAAEwAAAAAAAAAEbmFtZQAAABA=",
        "AAAAAQAAAAAAAAAAAAAACENvbnRyYWN0AAAAAgAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAAl3YXNtX2hhc2gAAAAAAAPoAAAD7gAAACA=",
        "AAAAAQAAAAAAAAAAAAAACFByb3Bvc2FsAAAABwAAAAAAAAACaWQAAAAAAAQAAAAAAAAABGlwZnMAAAAQAAAAAAAAABFvdXRjb21lc19jb250cmFjdAAAAAAAA+gAAAATAAAAAAAAAAhwcm9wb3NlcgAAABMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAA5Qcm9wb3NhbFN0YXR1cwAAAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAACXZvdGVfZGF0YQAAAAAAB9AAAAAIVm90ZURhdGE=",
        "AAAAAQAAAAAAAAAAAAAACFZvdGVEYXRhAAAAAwAAAAAAAAANcHVibGljX3ZvdGluZwAAAAAAAAEAAAAAAAAABXZvdGVzAAAAAAAD6gAAB9AAAAAEVm90ZQAAAAAAAAAOdm90aW5nX2VuZHNfYXQAAAAAAAY=",
        "AAAAAgAAAAAAAAAAAAAAClByb2plY3RLZXkAAAAAAAgAAAABAAAAAAAAAANLZXkAAAAAAQAAAA4AAAABAAAAAAAAAAZCYWRnZXMAAAAAAAEAAAAOAAAAAQAAAAAAAAAITGFzdEhhc2gAAAABAAAADgAAAAEAAAAAAAAAA0RhbwAAAAACAAAADgAAAAQAAAABAAAAAAAAABFEYW9Ub3RhbFByb3Bvc2FscwAAAAAAAAEAAAAOAAAAAQAAAAAAAAATQW5vbnltb3VzVm90ZUNvbmZpZwAAAAABAAAADgAAAAEAAAAAAAAAC1Byb2plY3RLZXlzAAAAAAEAAAAEAAAAAAAAAAAAAAANVG90YWxQcm9qZWN0cwAAAA==",
        "AAAAAQAAAAAAAAAAAAAAClB1YmxpY1ZvdGUAAAAAAAMAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAALdm90ZV9jaG9pY2UAAAAH0AAAAApWb3RlQ2hvaWNlAAAAAAAAAAAABndlaWdodAAAAAAABA==",
        "AAAAAgAAAAAAAAAAAAAAClZvdGVDaG9pY2UAAAAAAAMAAAAAAAAAAAAAAAdBcHByb3ZlAAAAAAAAAAAAAAAABlJlamVjdAAAAAAAAAAAAAAAAAAHQWJzdGFpbgA=",
        "AAAAAgAAAAAAAAAAAAAAC0NvbnRyYWN0S2V5AAAAAAIAAAAAAAAAAAAAAA5Eb21haW5Db250cmFjdAAAAAAAAAAAAAAAAAASQ29sbGF0ZXJhbENvbnRyYWN0AAA=",
        "AAAAAQAAAAAAAAAAAAAADEFkbWluc0NvbmZpZwAAAAIAAAAAAAAABmFkbWlucwAAAAAD6gAAABMAAAAAAAAACXRocmVzaG9sZAAAAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADUFub255bW91c1ZvdGUAAAAAAAAFAAAAAAAAAAdhZGRyZXNzAAAAABMAAAAAAAAAC2NvbW1pdG1lbnRzAAAAA+oAAAPuAAAAYAAAAAAAAAAPZW5jcnlwdGVkX3NlZWRzAAAAA+oAAAAQAAAAAAAAAA9lbmNyeXB0ZWRfdm90ZXMAAAAD6gAAABAAAAAAAAAABndlaWdodAAAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAADVByb2plY3RCYWRnZXMAAAAAAAACAAAAAAAAAAZiYWRnZXMAAAAAA+oAAAfQAAAABUJhZGdlAAAAAAAAAAAAAAdwcm9qZWN0AAAAAA4=",
        "AAAAAgAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAFAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAhBcHByb3ZlZAAAAAAAAAAAAAAACFJlamVjdGVkAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAAAAAAAAAAAAAAAAAJTWFsaWNpb3VzAAAA",
        "AAAAAQAAAAAAAAAAAAAAD1VwZ3JhZGVQcm9wb3NhbAAAAAAEAAAAAAAAAA1hZG1pbnNfY29uZmlnAAAAAAAH0AAAAAxBZG1pbnNDb25maWcAAAAAAAAACWFwcHJvdmFscwAAAAAAA+oAAAATAAAAAAAAAA1leGVjdXRhYmxlX2F0AAAAAAAABgAAAAAAAAAJd2FzbV9oYXNoAAAAAAAD7gAAACA=",
        "AAAAAQAAAAAAAAAAAAAAE0Fub255bW91c1ZvdGVDb25maWcAAAAAAwAAAAAAAAAKcHVibGljX2tleQAAAAAAEAAAAAAAAAAUc2VlZF9nZW5lcmF0b3JfcG9pbnQAAAPuAAAAYAAAAAAAAAAUdm90ZV9nZW5lcmF0b3JfcG9pbnQAAAPuAAAAYA==",
        "AAAABAAAAAAAAAAAAAAADkNvbnRyYWN0RXJyb3JzAAAAAAAbAAAAAAAAAA9VbmV4cGVjdGVkRXJyb3IAAAAAAAAAAAAAAAAKSW52YWxpZEtleQAAAAAAAQAAAAAAAAATUHJvamVjdEFscmVhZHlFeGlzdAAAAAACAAAAAAAAABJVbmF1dGhvcml6ZWRTaWduZXIAAAAAAAMAAAAAAAAAC05vSGFzaEZvdW5kAAAAAAQAAAAAAAAAEkludmFsaWREb21haW5FcnJvcgAAAAAABQAAAAAAAAAYTWFpbnRhaW5lck5vdERvbWFpbk93bmVyAAAABgAAAAAAAAAXUHJvcG9zYWxJbnB1dFZhbGlkYXRpb24AAAAABwAAAAAAAAAVTm9Qcm9wb3NhbG9yUGFnZUZvdW5kAAAAAAAACAAAAAAAAAAMQWxyZWFkeVZvdGVkAAAACQAAAAAAAAASUHJvcG9zYWxWb3RpbmdUaW1lAAAAAAAKAAAAAAAAAA5Qcm9wb3NhbEFjdGl2ZQAAAAAACwAAAAAAAAANV3JvbmdWb3RlVHlwZQAAAAAAAAwAAAAAAAAACldyb25nVm90ZXIAAAAAAA0AAAAAAAAADlRhbGx5U2VlZEVycm9yAAAAAAAOAAAAAAAAAAxJbnZhbGlkUHJvb2YAAAAPAAAAAAAAABdOb0Fub255bW91c1ZvdGluZ0NvbmZpZwAAAAAQAAAAAAAAAA1CYWRDb21taXRtZW50AAAAAAAAEQAAAAAAAAANVW5rbm93bk1lbWJlcgAAAAAAABIAAAAAAAAAEk1lbWJlckFscmVhZHlFeGlzdAAAAAAAEwAAAAAAAAALVm90ZXJXZWlnaHQAAAAAFAAAAAAAAAARVm90ZUxpbWl0RXhjZWVkZWQAAAAAAAAVAAAAAAAAAA5Db250cmFjdFBhdXNlZAAAAAAAFgAAAAAAAAAMVXBncmFkZUVycm9yAAAAFwAAAAAAAAASQ29udHJhY3RWYWxpZGF0aW9uAAAAAAAYAAAAAAAAAA9Db2xsYXRlcmFsRXJyb3IAAAAAGQAAAAAAAAASTm9Qcm9qZWN0UGFnZUZvdW5kAAAAAAAa",
        "AAAABQAAAAAAAAAAAAAABkNvbW1pdAAAAAAAAQAAAAZjb21taXQAAAAAAAIAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAABAAAAAAAAAARoYXNoAAAAEAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAACFZvdGVDYXN0AAAAAQAAAAl2b3RlX2Nhc3QAAAAAAAADAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAAAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAC01lbWJlckFkZGVkAAAAAAEAAAAMbWVtYmVyX2FkZGVkAAAAAQAAAAAAAAAObWVtYmVyX2FkZHJlc3MAAAAAABMAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADUJhZGdlc1VwZGF0ZWQAAAAAAAABAAAADmJhZGdlc191cGRhdGVkAAAAAAAEAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAAAAAAAAAAADGJhZGdlc19jb3VudAAAAAQAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADVVwZ3JhZGVTdGF0dXMAAAAAAAABAAAADnVwZ3JhZGVfc3RhdHVzAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAAAAAAAl3YXNtX2hhc2gAAAAAAAAOAAAAAAAAAAAAAAAGc3RhdHVzAAAAAAAQAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAADkNvbnRyYWN0UGF1c2VkAAAAAAABAAAAD2NvbnRyYWN0X3BhdXNlZAAAAAACAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAAAAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAD0NvbnRyYWN0VXBkYXRlZAAAAAABAAAAEGNvbnRyYWN0X3VwZGF0ZWQAAAAEAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAAAAAAAxjb250cmFjdF9rZXkAAAAQAAAAAAAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAAAAAAAJd2FzbV9oYXNoAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAD1Byb3Bvc2FsQ3JlYXRlZAAAAAABAAAAEHByb3Bvc2FsX2NyZWF0ZWQAAAAGAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAAAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAAAAAAADnZvdGluZ19lbmRzX2F0AAAAAAAGAAAAAAAAAAAAAAANcHVibGljX3ZvdGluZwAAAAAAAAEAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAD1VwZ3JhZGVBcHByb3ZlZAAAAAABAAAAEHVwZ3JhZGVfYXBwcm92ZWQAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAAAAAAA9hcHByb3ZhbHNfY291bnQAAAAABAAAAAAAAAAAAAAAEXRocmVzaG9sZF9yZWFjaGVkAAAAAAAAAQAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAD1VwZ3JhZGVQcm9wb3NlZAAAAAABAAAAEHVwZ3JhZGVfcHJvcG9zZWQAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAAAAAAAl3YXNtX2hhc2gAAAAAAAAOAAAAAAAAAAAAAAANZXhlY3V0YWJsZV9hdAAAAAAAAAYAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAEFByb3Bvc2FsRXhlY3V0ZWQAAAABAAAAEXByb3Bvc2FsX2V4ZWN1dGVkAAAAAAAABAAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAQAAAAAAAAAAAAAAAZzdGF0dXMAAAAAABAAAAAAAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAEVByb2plY3RSZWdpc3RlcmVkAAAAAAAAAQAAABJwcm9qZWN0X3JlZ2lzdGVyZWQAAAAAAAMAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAABAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAAAAAACm1haW50YWluZXIAAAAAABMAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAFEFub255bW91c1ZvdGluZ1NldHVwAAAAAQAAABZhbm9ueW1vdXNfdm90aW5nX3NldHVwAAAAAAADAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAQAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAAAAAACnB1YmxpY19rZXkAAAAAABAAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAFFByb2plY3RDb25maWdVcGRhdGVkAAAAAQAAABZwcm9qZWN0X2NvbmZpZ191cGRhdGVkAAAAAAACAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAQAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAC",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    vote: this.txFromJSON<null>,
    proof: this.txFromJSON<boolean>,
    execute: this.txFromJSON<ProposalStatus>,
    get_dao: this.txFromJSON<Dao>,
    get_proposal: this.txFromJSON<Proposal>,
    create_proposal: this.txFromJSON<u32>,
    revoke_proposal: this.txFromJSON<null>,
    anonymous_voting_setup: this.txFromJSON<null>,
    get_anonymous_voting_config: this.txFromJSON<AnonymousVoteConfig>,
    build_commitments_from_votes: this.txFromJSON<Array<Buffer>>,
    pause: this.txFromJSON<null>,
    version: this.txFromJSON<u32>,
    approve_upgrade: this.txFromJSON<null>,
    propose_upgrade: this.txFromJSON<null>,
    finalize_upgrade: this.txFromJSON<null>,
    get_admins_config: this.txFromJSON<AdminsConfig>,
    require_not_paused: this.txFromJSON<null>,
    set_domain_contract: this.txFromJSON<null>,
    get_upgrade_proposal: this.txFromJSON<UpgradeProposal>,
    set_collateral_contract: this.txFromJSON<null>,
    add_member: this.txFromJSON<null>,
    get_badges: this.txFromJSON<Badges>,
    get_member: this.txFromJSON<Member>,
    set_badges: this.txFromJSON<null>,
    get_max_weight: this.txFromJSON<u32>,
    commit: this.txFromJSON<null>,
    register: this.txFromJSON<Buffer>,
    get_commit: this.txFromJSON<string>,
    get_project: this.txFromJSON<Project>,
    get_projects: this.txFromJSON<Array<Project>>,
    update_config: this.txFromJSON<null>,
    get_sub_projects: this.txFromJSON<Array<Buffer>>,
    set_sub_projects: this.txFromJSON<null>,
  };
}
