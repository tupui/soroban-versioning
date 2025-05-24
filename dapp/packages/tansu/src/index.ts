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

export const Errors = {
  0: { message: "UnexpectedError" },

  1: { message: "InvalidKey" },

  2: { message: "ProjectAlreadyExist" },

  3: { message: "UnregisteredMaintainer" },

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
};
export type DataKey =
  | { tag: "Admin"; values: void }
  | { tag: "Member"; values: readonly [string] };

export interface Badges {
  community: Array<string>;
  default: Array<string>;
  developer: Array<string>;
  triage: Array<string>;
  verified: Array<string>;
}

export enum Badge {
  Developer = 10000000,
  Triage = 5000000,
  Community = 1000000,
  Verified = 500000,
  Default = 1,
}

export interface ProjectBadges {
  badges: Array<Badge>;
  project: Buffer;
}

export interface Member {
  meta: string;
  projects: Array<ProjectBadges>;
}

export type ProposalStatus =
  | { tag: "Active"; values: void }
  | { tag: "Approved"; values: void }
  | { tag: "Rejected"; values: void }
  | { tag: "Cancelled"; values: void };

export type Vote =
  | { tag: "PublicVote"; values: readonly [PublicVote] }
  | { tag: "AnonymousVote"; values: readonly [AnonymousVote] };

export type VoteChoice =
  | { tag: "Approve"; values: void }
  | { tag: "Reject"; values: void }
  | { tag: "Abstain"; values: void };

export interface PublicVote {
  address: string;
  vote_choice: VoteChoice;
}

export interface AnonymousVote {
  address: string;
  commitments: Array<Buffer>;
  encrypted_seeds: Array<string>;
  encrypted_votes: Array<string>;
}

export interface VoteData {
  public_voting: boolean;
  votes: Array<Vote>;
  voting_ends_at: u64;
}

export interface AnonymousVoteConfig {
  public_key: string;
  seed_generator_point: Buffer;
  vote_generator_point: Buffer;
}

export interface Proposal {
  id: u32;
  ipfs: string;
  status: ProposalStatus;
  title: string;
  vote_data: VoteData;
}

export interface Dao {
  proposals: Array<Proposal>;
}

export type ProjectKey =
  | { tag: "Key"; values: readonly [Buffer] }
  | { tag: "Badges"; values: readonly [Buffer] }
  | { tag: "LastHash"; values: readonly [Buffer] }
  | { tag: "Dao"; values: readonly [Buffer, u32] }
  | { tag: "DaoTotalProposals"; values: readonly [Buffer] }
  | { tag: "AnonymousVoteConfig"; values: readonly [Buffer] };

export interface Config {
  hash: string;
  url: string;
}

export interface Project {
  config: Config;
  maintainers: Array<string>;
  name: string;
}

export interface Client {
  /**
   * Construct and simulate a anonymous_voting_setup transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anonymous voting primitives.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `public_key` - Asymmetric public key to be used to encode seeds
   */
  anonymous_voting_setup: (
    { project_key, public_key }: { project_key: Buffer; public_key: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_anonymous_voting_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_anonymous_voting_config: (
    { project_key }: { project_key: Buffer },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<AnonymousVoteConfig>>;

  /**
   * Construct and simulate a build_commitments_from_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Build all three commitments from the votes and seeds.
   *
   * Calling that on the smart contract itself would reveal the votes and seeds.
   * This can be run in simulation in your RPC or used as a basis for
   * implementation client-side.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `votes` - Vector of votes.
   * * `seeds` - Vector of seeds.
   * # Returns
   * * `Vec<BytesN<96>>` - The three voting commitments.
   */
  build_commitments_from_votes: (
    {
      project_key,
      votes,
      seeds,
    }: { project_key: Buffer; votes: Array<u32>; seeds: Array<u32> },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Array<Buffer>>>;

  /**
   * Construct and simulate a create_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a proposal on the DAO of the project.
   * Proposal initiators are automatically put in the abstain group.
   * # Arguments
   * * `env` - The environment object
   * * `proposer` - Address of the proposal creator
   * * `project_key` - Unique identifier for the project
   * * `title` - Title of the proposal
   * * `ipfs` - IPFS content identifier describing the proposal
   * * `voting_ends_at` - UNIX timestamp when voting ends
   * # Returns
   * * `u32` - The ID of the created proposal
   */
  create_proposal: (
    {
      proposer,
      project_key,
      title,
      ipfs,
      voting_ends_at,
      public_voting,
    }: {
      proposer: string;
      project_key: Buffer;
      title: string;
      ipfs: string;
      voting_ends_at: u64;
      public_voting: boolean;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cast a vote on a proposal.
   * Double votes are not allowed.
   * # Arguments
   * * `env` - The environment object
   * * `voter` - Address of the voter
   * * `project_key` - Unique identifier for the project
   * * `proposal_id` - ID of the proposal
   * * `vote` - Approve, reject or abstain decision
   */
  vote: (
    {
      voter,
      project_key,
      proposal_id,
      vote,
    }: { voter: string; project_key: Buffer; proposal_id: u32; vote: Vote },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a execute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Execute a vote after the voting period ends.
   *
   * When proposals are anonymous, `tally` is validated against the sum of
   * all vote commitments. The `seed` is essential for the validation.
   *
   * # Panics
   *
   * Double votes are not allowed. Tally and seed must be present for
   * anonymous votes and forbidden otherwise. For anonymous votes, it will
   * panic if the commitment proof validation fails.
   *
   * # Arguments
   * * `env` - The environment object
   * * `maintainer` - Address of the maintainer
   * * `project_key` - Unique identifier for the project
   * * `proposal_id` - ID of the proposal
   * * [`Option<tallies>`] - decoded tally values, respectively Approve, reject and abstain
   * * [`Option<seeds>`] - decoded seed values, respectively Approve, reject and abstain
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
      tallies: Option<Array<u32>>;
      seeds: Option<Array<u32>>;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<ProposalStatus>>;

  /**
   * Construct and simulate a proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Voting choice commitment.
   *
   * Recover the commitment by removing the randomization introduced by the
   * seed.
   *
   * Vote commitment is:
   *
   * C = g^v * h^r (in additive notation: g*v + h*r),
   *
   * where g, h point generator and v is the vote choice, r is the seed.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `commitment` - Vote commitment
   * * `tally` - decoded tally value
   * * `seed` - decoded seed value
   * # Returns
   * * `bool` - True if the commitment match
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
      tallies: Array<u32>;
      seeds: Array<u32>;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a get_dao transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get one page of proposal of the DAO.
   * A page has 0 to MAX_PROPOSALS_PER_PAGE proposals.
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `page` - Page of proposals
   * # Returns
   * * `types::Dao` - The Dao object (vector of proposals)
   */
  get_dao: (
    { project_key, page }: { project_key: Buffer; page: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Dao>>;

  /**
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Only return a single proposal
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `proposal_id` - ID of the proposal
   * # Returns
   * * `types::Proposal` - The proposal object
   */
  get_proposal: (
    { project_key, proposal_id }: { project_key: Buffer; proposal_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Proposal>>;

  /**
   * Construct and simulate a add_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_member: (
    { member_address, meta }: { member_address: string; meta: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_member: (
    { member_address }: { member_address: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Member>>;

  /**
   * Construct and simulate a add_badges transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_badges: (
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
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_badges transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_badges: (
    { key }: { key: Buffer },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Badges>>;

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: (
    { new_wasm_hash }: { new_wasm_hash: Buffer },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  version: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Register a new Git projects and associated metadata.
   */
  register: (
    {
      maintainer,
      name,
      maintainers,
      url,
      hash,
      domain_contract_id,
    }: {
      maintainer: string;
      name: string;
      maintainers: Array<string>;
      url: string;
      hash: string;
      domain_contract_id: string;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Buffer>>;

  /**
   * Construct and simulate a update_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Change the configuration of the project.
   */
  update_config: (
    {
      maintainer,
      key,
      maintainers,
      url,
      hash,
    }: {
      maintainer: string;
      key: Buffer;
      maintainers: Array<string>;
      url: string;
      hash: string;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a commit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the last commit hash
   */
  commit: (
    {
      maintainer,
      project_key,
      hash,
    }: { maintainer: string; project_key: Buffer; hash: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_commit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the last commit hash
   */
  get_commit: (
    { project_key }: { project_key: Buffer },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_project transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_project: (
    { project_key }: { project_key: Buffer },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Project>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin }: { admin: string },
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
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
        "AAAAAAAAAMBBbm9ueW1vdXMgdm90aW5nIHByaW1pdGl2ZXMuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHVibGljX2tleWAgLSBBc3ltbWV0cmljIHB1YmxpYyBrZXkgdG8gYmUgdXNlZCB0byBlbmNvZGUgc2VlZHMAAAAWYW5vbnltb3VzX3ZvdGluZ19zZXR1cAAAAAAAAgAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAKcHVibGljX2tleQAAAAAAEAAAAAA=",
        "AAAAAAAAAAAAAAAbZ2V0X2Fub255bW91c192b3RpbmdfY29uZmlnAAAAAAEAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAABAAAH0AAAABNBbm9ueW1vdXNWb3RlQ29uZmlnAA==",
        "AAAAAAAAAblCdWlsZCBhbGwgdGhyZWUgY29tbWl0bWVudHMgZnJvbSB0aGUgdm90ZXMgYW5kIHNlZWRzLgoKQ2FsbGluZyB0aGF0IG9uIHRoZSBzbWFydCBjb250cmFjdCBpdHNlbGYgd291bGQgcmV2ZWFsIHRoZSB2b3RlcyBhbmQgc2VlZHMuClRoaXMgY2FuIGJlIHJ1biBpbiBzaW11bGF0aW9uIGluIHlvdXIgUlBDIG9yIHVzZWQgYXMgYSBiYXNpcyBmb3IKaW1wbGVtZW50YXRpb24gY2xpZW50LXNpZGUuCgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgdm90ZXNgIC0gVmVjdG9yIG9mIHZvdGVzLgoqIGBzZWVkc2AgLSBWZWN0b3Igb2Ygc2VlZHMuCiMgUmV0dXJucwoqIGBWZWM8Qnl0ZXNOPDk2Pj5gIC0gVGhlIHRocmVlIHZvdGluZyBjb21taXRtZW50cy4AAAAAAAAcYnVpbGRfY29tbWl0bWVudHNfZnJvbV92b3RlcwAAAAMAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAAAAAAABXZvdGVzAAAAAAAD6gAAAAQAAAAAAAAABXNlZWRzAAAAAAAD6gAAAAQAAAABAAAD6gAAA+4AAABg",
        "AAAAAAAAAcFDcmVhdGUgYSBwcm9wb3NhbCBvbiB0aGUgREFPIG9mIHRoZSBwcm9qZWN0LgpQcm9wb3NhbCBpbml0aWF0b3JzIGFyZSBhdXRvbWF0aWNhbGx5IHB1dCBpbiB0aGUgYWJzdGFpbiBncm91cC4KIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcHJvcG9zZXJgIC0gQWRkcmVzcyBvZiB0aGUgcHJvcG9zYWwgY3JlYXRvcgoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgdGl0bGVgIC0gVGl0bGUgb2YgdGhlIHByb3Bvc2FsCiogYGlwZnNgIC0gSVBGUyBjb250ZW50IGlkZW50aWZpZXIgZGVzY3JpYmluZyB0aGUgcHJvcG9zYWwKKiBgdm90aW5nX2VuZHNfYXRgIC0gVU5JWCB0aW1lc3RhbXAgd2hlbiB2b3RpbmcgZW5kcwojIFJldHVybnMKKiBgdTMyYCAtIFRoZSBJRCBvZiB0aGUgY3JlYXRlZCBwcm9wb3NhbAAAAAAAAA9jcmVhdGVfcHJvcG9zYWwAAAAABgAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAABGlwZnMAAAAQAAAAAAAAAA52b3RpbmdfZW5kc19hdAAAAAAABgAAAAAAAAANcHVibGljX3ZvdGluZwAAAAAAAAEAAAABAAAABA==",
        "AAAAAAAAAQ5DYXN0IGEgdm90ZSBvbiBhIHByb3Bvc2FsLgpEb3VibGUgdm90ZXMgYXJlIG5vdCBhbGxvd2VkLgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGB2b3RlcmAgLSBBZGRyZXNzIG9mIHRoZSB2b3RlcgoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHJvcG9zYWxfaWRgIC0gSUQgb2YgdGhlIHByb3Bvc2FsCiogYHZvdGVgIC0gQXBwcm92ZSwgcmVqZWN0IG9yIGFic3RhaW4gZGVjaXNpb24AAAAAAAR2b3RlAAAABAAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAAAAAAR2b3RlAAAH0AAAAARWb3RlAAAAAA==",
        "AAAAAAAAAtRFeGVjdXRlIGEgdm90ZSBhZnRlciB0aGUgdm90aW5nIHBlcmlvZCBlbmRzLgoKV2hlbiBwcm9wb3NhbHMgYXJlIGFub255bW91cywgYHRhbGx5YCBpcyB2YWxpZGF0ZWQgYWdhaW5zdCB0aGUgc3VtIG9mCmFsbCB2b3RlIGNvbW1pdG1lbnRzLiBUaGUgYHNlZWRgIGlzIGVzc2VudGlhbCBmb3IgdGhlIHZhbGlkYXRpb24uCgojIFBhbmljcwoKRG91YmxlIHZvdGVzIGFyZSBub3QgYWxsb3dlZC4gVGFsbHkgYW5kIHNlZWQgbXVzdCBiZSBwcmVzZW50IGZvcgphbm9ueW1vdXMgdm90ZXMgYW5kIGZvcmJpZGRlbiBvdGhlcndpc2UuIEZvciBhbm9ueW1vdXMgdm90ZXMsIGl0IHdpbGwKcGFuaWMgaWYgdGhlIGNvbW1pdG1lbnQgcHJvb2YgdmFsaWRhdGlvbiBmYWlscy4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYG1haW50YWluZXJgIC0gQWRkcmVzcyBvZiB0aGUgbWFpbnRhaW5lcgoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHJvcG9zYWxfaWRgIC0gSUQgb2YgdGhlIHByb3Bvc2FsCiogW2BPcHRpb248dGFsbGllcz5gXSAtIGRlY29kZWQgdGFsbHkgdmFsdWVzLCByZXNwZWN0aXZlbHkgQXBwcm92ZSwgcmVqZWN0IGFuZCBhYnN0YWluCiogW2BPcHRpb248c2VlZHM+YF0gLSBkZWNvZGVkIHNlZWQgdmFsdWVzLCByZXNwZWN0aXZlbHkgQXBwcm92ZSwgcmVqZWN0IGFuZCBhYnN0YWluAAAAB2V4ZWN1dGUAAAAABQAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAAAAAAHdGFsbGllcwAAAAPoAAAD6gAAAAQAAAAAAAAABXNlZWRzAAAAAAAD6AAAA+oAAAAEAAAAAQAAB9AAAAAOUHJvcG9zYWxTdGF0dXMAAA==",
        "AAAAAAAAAeZWb3RpbmcgY2hvaWNlIGNvbW1pdG1lbnQuCgpSZWNvdmVyIHRoZSBjb21taXRtZW50IGJ5IHJlbW92aW5nIHRoZSByYW5kb21pemF0aW9uIGludHJvZHVjZWQgYnkgdGhlCnNlZWQuCgpWb3RlIGNvbW1pdG1lbnQgaXM6CgpDID0gZ152ICogaF5yIChpbiBhZGRpdGl2ZSBub3RhdGlvbjogZyp2ICsgaCpyKSwKCndoZXJlIGcsIGggcG9pbnQgZ2VuZXJhdG9yIGFuZCB2IGlzIHRoZSB2b3RlIGNob2ljZSwgciBpcyB0aGUgc2VlZC4KCiMgQXJndW1lbnRzCiogYGVudmAgLSBUaGUgZW52aXJvbm1lbnQgb2JqZWN0CiogYHByb2plY3Rfa2V5YCAtIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgcHJvamVjdAoqIGBjb21taXRtZW50YCAtIFZvdGUgY29tbWl0bWVudAoqIGB0YWxseWAgLSBkZWNvZGVkIHRhbGx5IHZhbHVlCiogYHNlZWRgIC0gZGVjb2RlZCBzZWVkIHZhbHVlCiMgUmV0dXJucwoqIGBib29sYCAtIFRydWUgaWYgdGhlIGNvbW1pdG1lbnQgbWF0Y2gAAAAAAAVwcm9vZgAAAAAAAAQAAAAAAAAAC3Byb2plY3Rfa2V5AAAAAA4AAAAAAAAACHByb3Bvc2FsAAAH0AAAAAhQcm9wb3NhbAAAAAAAAAAHdGFsbGllcwAAAAPqAAAABAAAAAAAAAAFc2VlZHMAAAAAAAPqAAAABAAAAAEAAAAB",
        "AAAAAAAAARRHZXQgb25lIHBhZ2Ugb2YgcHJvcG9zYWwgb2YgdGhlIERBTy4KQSBwYWdlIGhhcyAwIHRvIE1BWF9QUk9QT1NBTFNfUEVSX1BBR0UgcHJvcG9zYWxzLgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcGFnZWAgLSBQYWdlIG9mIHByb3Bvc2FscwojIFJldHVybnMKKiBgdHlwZXM6OkRhb2AgLSBUaGUgRGFvIG9iamVjdCAodmVjdG9yIG9mIHByb3Bvc2FscykAAAAHZ2V0X2RhbwAAAAACAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARwYWdlAAAABAAAAAEAAAfQAAAAA0RhbwA=",
        "AAAAAAAAANdPbmx5IHJldHVybiBhIHNpbmdsZSBwcm9wb3NhbAojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHJvcG9zYWxfaWRgIC0gSUQgb2YgdGhlIHByb3Bvc2FsCiMgUmV0dXJucwoqIGB0eXBlczo6UHJvcG9zYWxgIC0gVGhlIHByb3Bvc2FsIG9iamVjdAAAAAAMZ2V0X3Byb3Bvc2FsAAAAAgAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAEAAAfQAAAACFByb3Bvc2Fs",
        "AAAAAAAAAAAAAAAKYWRkX21lbWJlcgAAAAAAAgAAAAAAAAAObWVtYmVyX2FkZHJlc3MAAAAAABMAAAAAAAAABG1ldGEAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAAKZ2V0X21lbWJlcgAAAAAAAQAAAAAAAAAObWVtYmVyX2FkZHJlc3MAAAAAABMAAAABAAAH0AAAAAZNZW1iZXIAAA==",
        "AAAAAAAAAAAAAAAKYWRkX2JhZGdlcwAAAAAABAAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAADa2V5AAAAAA4AAAAAAAAABm1lbWJlcgAAAAAAEwAAAAAAAAAGYmFkZ2VzAAAAAAPqAAAH0AAAAAVCYWRnZQAAAAAAAAA=",
        "AAAAAAAAAAAAAAAKZ2V0X2JhZGdlcwAAAAAAAQAAAAAAAAADa2V5AAAAAA4AAAABAAAH0AAAAAZCYWRnZXMAAA==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAADRSZWdpc3RlciBhIG5ldyBHaXQgcHJvamVjdHMgYW5kIGFzc29jaWF0ZWQgbWV0YWRhdGEuAAAACHJlZ2lzdGVyAAAABgAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC21haW50YWluZXJzAAAAA+oAAAATAAAAAAAAAAN1cmwAAAAAEAAAAAAAAAAEaGFzaAAAABAAAAAAAAAAEmRvbWFpbl9jb250cmFjdF9pZAAAAAAAEwAAAAEAAAAO",
        "AAAAAAAAAChDaGFuZ2UgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHByb2plY3QuAAAADXVwZGF0ZV9jb25maWcAAAAAAAAFAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAANrZXkAAAAADgAAAAAAAAALbWFpbnRhaW5lcnMAAAAD6gAAABMAAAAAAAAAA3VybAAAAAAQAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhTZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAGY29tbWl0AAAAAAADAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhHZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAKZ2V0X2NvbW1pdAAAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAAQ",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2plY3QAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAfQAAAAB1Byb2plY3QA",
        "AAAABAAAAAAAAAAAAAAADkNvbnRyYWN0RXJyb3JzAAAAAAAUAAAAAAAAAA9VbmV4cGVjdGVkRXJyb3IAAAAAAAAAAAAAAAAKSW52YWxpZEtleQAAAAAAAQAAAAAAAAATUHJvamVjdEFscmVhZHlFeGlzdAAAAAACAAAAAAAAABZVbnJlZ2lzdGVyZWRNYWludGFpbmVyAAAAAAADAAAAAAAAAAtOb0hhc2hGb3VuZAAAAAAEAAAAAAAAABJJbnZhbGlkRG9tYWluRXJyb3IAAAAAAAUAAAAAAAAAGE1haW50YWluZXJOb3REb21haW5Pd25lcgAAAAYAAAAAAAAAF1Byb3Bvc2FsSW5wdXRWYWxpZGF0aW9uAAAAAAcAAAAAAAAAFU5vUHJvcG9zYWxvclBhZ2VGb3VuZAAAAAAAAAgAAAAAAAAADEFscmVhZHlWb3RlZAAAAAkAAAAAAAAAElByb3Bvc2FsVm90aW5nVGltZQAAAAAACgAAAAAAAAAOUHJvcG9zYWxBY3RpdmUAAAAAAAsAAAAAAAAADVdyb25nVm90ZVR5cGUAAAAAAAAMAAAAAAAAAApXcm9uZ1ZvdGVyAAAAAAANAAAAAAAAAA5UYWxseVNlZWRFcnJvcgAAAAAADgAAAAAAAAAMSW52YWxpZFByb29mAAAADwAAAAAAAAAXTm9Bbm9ueW1vdXNWb3RpbmdDb25maWcAAAAAEAAAAAAAAAANQmFkQ29tbWl0bWVudAAAAAAAABEAAAAAAAAADVVua25vd25NZW1iZXIAAAAAAAASAAAAAAAAABJNZW1iZXJBbHJlYWR5RXhpc3QAAAAAABM=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAGTWVtYmVyAAAAAAABAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAABkJhZGdlcwAAAAAABQAAAAAAAAAJY29tbXVuaXR5AAAAAAAD6gAAABMAAAAAAAAAB2RlZmF1bHQAAAAD6gAAABMAAAAAAAAACWRldmVsb3BlcgAAAAAAA+oAAAATAAAAAAAAAAZ0cmlhZ2UAAAAAA+oAAAATAAAAAAAAAAh2ZXJpZmllZAAAA+oAAAAT",
        "AAAAAwAAAAAAAAAAAAAABUJhZGdlAAAAAAAABQAAAAAAAAAJRGV2ZWxvcGVyAAAAAJiWgAAAAAAAAAAGVHJpYWdlAAAATEtAAAAAAAAAAAlDb21tdW5pdHkAAAAAD0JAAAAAAAAAAAhWZXJpZmllZAAHoSAAAAAAAAAAB0RlZmF1bHQAAAAAAQ==",
        "AAAAAQAAAAAAAAAAAAAADVByb2plY3RCYWRnZXMAAAAAAAACAAAAAAAAAAZiYWRnZXMAAAAAA+oAAAfQAAAABUJhZGdlAAAAAAAAAAAAAAdwcm9qZWN0AAAAAA4=",
        "AAAAAQAAAAAAAAAAAAAABk1lbWJlcgAAAAAAAgAAAAAAAAAEbWV0YQAAABAAAAAAAAAACHByb2plY3RzAAAD6gAAB9AAAAANUHJvamVjdEJhZGdlcwAAAA==",
        "AAAAAgAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAEAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAhBcHByb3ZlZAAAAAAAAAAAAAAACFJlamVjdGVkAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAA",
        "AAAAAgAAAAAAAAAAAAAABFZvdGUAAAACAAAAAQAAAAAAAAAKUHVibGljVm90ZQAAAAAAAQAAB9AAAAAKUHVibGljVm90ZQAAAAAAAQAAAAAAAAANQW5vbnltb3VzVm90ZQAAAAAAAAEAAAfQAAAADUFub255bW91c1ZvdGUAAAA=",
        "AAAAAgAAAAAAAAAAAAAAClZvdGVDaG9pY2UAAAAAAAMAAAAAAAAAAAAAAAdBcHByb3ZlAAAAAAAAAAAAAAAABlJlamVjdAAAAAAAAAAAAAAAAAAHQWJzdGFpbgA=",
        "AAAAAQAAAAAAAAAAAAAAClB1YmxpY1ZvdGUAAAAAAAIAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAALdm90ZV9jaG9pY2UAAAAH0AAAAApWb3RlQ2hvaWNlAAA=",
        "AAAAAQAAAAAAAAAAAAAADUFub255bW91c1ZvdGUAAAAAAAAEAAAAAAAAAAdhZGRyZXNzAAAAABMAAAAAAAAAC2NvbW1pdG1lbnRzAAAAA+oAAAPuAAAAYAAAAAAAAAAPZW5jcnlwdGVkX3NlZWRzAAAAA+oAAAAQAAAAAAAAAA9lbmNyeXB0ZWRfdm90ZXMAAAAD6gAAABA=",
        "AAAAAQAAAAAAAAAAAAAACFZvdGVEYXRhAAAAAwAAAAAAAAANcHVibGljX3ZvdGluZwAAAAAAAAEAAAAAAAAABXZvdGVzAAAAAAAD6gAAB9AAAAAEVm90ZQAAAAAAAAAOdm90aW5nX2VuZHNfYXQAAAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAAE0Fub255bW91c1ZvdGVDb25maWcAAAAAAwAAAAAAAAAKcHVibGljX2tleQAAAAAAEAAAAAAAAAAUc2VlZF9nZW5lcmF0b3JfcG9pbnQAAAPuAAAAYAAAAAAAAAAUdm90ZV9nZW5lcmF0b3JfcG9pbnQAAAPuAAAAYA==",
        "AAAAAQAAAAAAAAAAAAAACFByb3Bvc2FsAAAABQAAAAAAAAACaWQAAAAAAAQAAAAAAAAABGlwZnMAAAAQAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAOUHJvcG9zYWxTdGF0dXMAAAAAAAAAAAAFdGl0bGUAAAAAAAAQAAAAAAAAAAl2b3RlX2RhdGEAAAAAAAfQAAAACFZvdGVEYXRh",
        "AAAAAQAAAAAAAAAAAAAAA0RhbwAAAAABAAAAAAAAAAlwcm9wb3NhbHMAAAAAAAPqAAAH0AAAAAhQcm9wb3NhbA==",
        "AAAAAgAAAAAAAAAAAAAAClByb2plY3RLZXkAAAAAAAYAAAABAAAAAAAAAANLZXkAAAAAAQAAAA4AAAABAAAAAAAAAAZCYWRnZXMAAAAAAAEAAAAOAAAAAQAAAAAAAAAITGFzdEhhc2gAAAABAAAADgAAAAEAAAAAAAAAA0RhbwAAAAACAAAADgAAAAQAAAABAAAAAAAAABFEYW9Ub3RhbFByb3Bvc2FscwAAAAAAAAEAAAAOAAAAAQAAAAAAAAATQW5vbnltb3VzVm90ZUNvbmZpZwAAAAABAAAADg==",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAgAAAAAAAAAEaGFzaAAAABAAAAAAAAAAA3VybAAAAAAQ",
        "AAAAAQAAAAAAAAAAAAAAB1Byb2plY3QAAAAAAwAAAAAAAAAGY29uZmlnAAAAAAfQAAAABkNvbmZpZwAAAAAAAAAAAAttYWludGFpbmVycwAAAAPqAAAAEwAAAAAAAAAEbmFtZQAAABA=",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    anonymous_voting_setup: this.txFromJSON<null>,
    get_anonymous_voting_config: this.txFromJSON<AnonymousVoteConfig>,
    build_commitments_from_votes: this.txFromJSON<Array<Buffer>>,
    create_proposal: this.txFromJSON<u32>,
    vote: this.txFromJSON<null>,
    execute: this.txFromJSON<ProposalStatus>,
    proof: this.txFromJSON<boolean>,
    get_dao: this.txFromJSON<Dao>,
    get_proposal: this.txFromJSON<Proposal>,
    add_member: this.txFromJSON<null>,
    get_member: this.txFromJSON<Member>,
    add_badges: this.txFromJSON<null>,
    get_badges: this.txFromJSON<Badges>,
    upgrade: this.txFromJSON<null>,
    version: this.txFromJSON<u32>,
    register: this.txFromJSON<Buffer>,
    update_config: this.txFromJSON<null>,
    commit: this.txFromJSON<null>,
    get_commit: this.txFromJSON<string>,
    get_project: this.txFromJSON<Project>,
  };
}
