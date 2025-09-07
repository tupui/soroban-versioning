import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
} from "@stellar/stellar-sdk/contract";
import type { u32, u64, u128, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const ContractErrors: {
  0: {
    message: string;
  };
  1: {
    message: string;
  };
  2: {
    message: string;
  };
  3: {
    message: string;
  };
  4: {
    message: string;
  };
  5: {
    message: string;
  };
  6: {
    message: string;
  };
  7: {
    message: string;
  };
  8: {
    message: string;
  };
  9: {
    message: string;
  };
  10: {
    message: string;
  };
  11: {
    message: string;
  };
  12: {
    message: string;
  };
  13: {
    message: string;
  };
  14: {
    message: string;
  };
  15: {
    message: string;
  };
  16: {
    message: string;
  };
  17: {
    message: string;
  };
  18: {
    message: string;
  };
  19: {
    message: string;
  };
  20: {
    message: string;
  };
  21: {
    message: string;
  };
  22: {
    message: string;
  };
  23: {
    message: string;
  };
};
export interface DomainContract {
  address: string;
  wasm_hash: Buffer;
}
export type DataKey =
  | {
      tag: "DomainContract";
      values: void;
    }
  | {
      tag: "Member";
      values: readonly [string];
    }
  | {
      tag: "Paused";
      values: void;
    }
  | {
      tag: "UpgradeProposal";
      values: void;
    }
  | {
      tag: "AdminsConfig";
      values: void;
    };
export interface Badges {
  community: Array<string>;
  developer: Array<string>;
  triage: Array<string>;
  verified: Array<string>;
}
export declare enum Badge {
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
  | {
      tag: "Active";
      values: void;
    }
  | {
      tag: "Approved";
      values: void;
    }
  | {
      tag: "Rejected";
      values: void;
    }
  | {
      tag: "Cancelled";
      values: void;
    };
export type Vote =
  | {
      tag: "PublicVote";
      values: readonly [PublicVote];
    }
  | {
      tag: "AnonymousVote";
      values: readonly [AnonymousVote];
    };
export type VoteChoice =
  | {
      tag: "Approve";
      values: void;
    }
  | {
      tag: "Reject";
      values: void;
    }
  | {
      tag: "Abstain";
      values: void;
    };
export interface PublicVote {
  address: string;
  vote_choice: VoteChoice;
  weight: u32;
}
export interface AnonymousVote {
  address: string;
  commitments: Array<Buffer>;
  encrypted_seeds: Array<string>;
  encrypted_votes: Array<string>;
  weight: u32;
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
export interface AdminsConfig {
  admins: Array<string>;
  threshold: u32;
}
export interface UpgradeProposal {
  admins_config: AdminsConfig;
  approvals: Array<string>;
  executable_at: u64;
  wasm_hash: Buffer;
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
  | {
      tag: "Key";
      values: readonly [Buffer];
    }
  | {
      tag: "Badges";
      values: readonly [Buffer];
    }
  | {
      tag: "LastHash";
      values: readonly [Buffer];
    }
  | {
      tag: "Dao";
      values: readonly [Buffer, u32];
    }
  | {
      tag: "DaoTotalProposals";
      values: readonly [Buffer];
    }
  | {
      tag: "AnonymousVoteConfig";
      values: readonly [Buffer];
    };
export interface Config {
  ipfs: string;
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
    }: {
      maintainer: string;
      project_key: Buffer;
      public_key: string;
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
    {
      project_key,
    }: {
      project_key: Buffer;
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
  ) => Promise<AssembledTransaction<AnonymousVoteConfig>>;
  /**
   * Construct and simulate a build_commitments_from_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Build vote commitments from votes and seeds for anonymous voting.
   *
   * Creates BLS12-381 commitments for each vote using the formula:
   * C = g^vote * h^seed where g and h are generator points.
   *
   * Note: This function does not consider voting weights, which are applied
   * during the tallying phase. Calling this on the smart contract would reveal
   * the votes and seeds, so it must be run either in simulation or client-side.
   *
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `votes` - Vector of vote choices (0=abstain, 1=approve, 2=reject)
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
    }: {
      project_key: Buffer;
      votes: Array<u128>;
      seeds: Array<u128>;
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
  ) => Promise<AssembledTransaction<Array<Buffer>>>;
  /**
   * Construct and simulate a create_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new proposal for a project.
   *
   * # Arguments
   * * `env` - The environment object
   * * `proposer` - Address of the proposal creator
   * * `project_key` - Unique identifier for the project
   * * `title` - Title of the proposal
   * * `ipfs` - IPFS content identifier describing the proposal
   * * `voting_ends_at` - UNIX timestamp when voting ends
   * * `public_voting` - Whether voting is public or anonymous
   * # Returns
   * * `u32` - The ID of the created proposal.
   *
   * The proposer is automatically added to the abstain group.
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
    }: {
      voter: string;
      project_key: Buffer;
      proposal_id: u32;
      vote: Vote;
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
   * * If tallies/seeds are missing for anonymous votes
   * * If commitment validation fails for anonymous votes
   * *
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
    {
      project_key,
      page,
    }: {
      project_key: Buffer;
      page: u32;
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
    {
      project_key,
      proposal_id,
    }: {
      project_key: Buffer;
      proposal_id: u32;
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
  ) => Promise<AssembledTransaction<Proposal>>;
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
    {
      member_address,
      meta,
    }: {
      member_address: string;
      meta: string;
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
    {
      member_address,
    }: {
      member_address: string;
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
   * Get all badges for a specific project, organized by badge type.
   *
   * Returns a structure containing vectors of member addresses for each badge type
   * (Developer, Triage, Community, Verified, Default).
   *
   * # Arguments
   * * `env` - The environment object
   * * `key` - The project key identifier
   *
   * # Returns
   * * `types::Badges` - Structure containing member addresses for each badge type
   */
  get_badges: (
    {
      key,
    }: {
      key: Buffer;
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
  ) => Promise<AssembledTransaction<Badges>>;
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
    }: {
      project_key: Buffer;
      member_address: string;
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
    {
      admin,
      paused,
    }: {
      admin: string;
      paused: boolean;
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
   * Construct and simulate a require_not_paused transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Require that the contract is not paused, panic if it is
   *
   * # Panics
   * * If the contract is paused.
   */
  require_not_paused: (options?: {
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
  }) => Promise<AssembledTransaction<null>>;
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
  get_admins_config: (options?: {
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
  }) => Promise<AssembledTransaction<AdminsConfig>>;
  /**
   * Construct and simulate a get_domain_contract_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current Soroban Domain contract ID.
   *
   * # Arguments
   * * `env` - The environment object
   *
   * # Returns
   * * `Address` - The Soroban Domain contract ID
   */
  get_domain_contract_id: (options?: {
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
  }) => Promise<AssembledTransaction<DomainContract>>;
  /**
   * Construct and simulate a set_domain_contract_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the Soroban Domain contract ID.
   *
   * # Arguments
   * * `env` - The environment object
   * * `admin` - The admin address
   * * `domain_contract` - The new domain contract
   */
  set_domain_contract_id: (
    {
      admin,
      domain_contract,
    }: {
      admin: string;
      domain_contract: DomainContract;
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
    {
      admin,
    }: {
      admin: string;
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
    {
      admin,
      accept,
    }: {
      admin: string;
      accept: boolean;
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
   * Construct and simulate a get_upgrade_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get upgrade proposal details
   */
  get_upgrade_proposal: (options?: {
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
  }) => Promise<AssembledTransaction<UpgradeProposal>>;
  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current version of the contract.
   *
   * # Returns
   * * `u32` - The contract version number
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
    }: {
      maintainer: string;
      project_key: Buffer;
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
    {
      project_key,
    }: {
      project_key: Buffer;
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
    {
      project_key,
    }: {
      project_key: Buffer;
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
  ) => Promise<AssembledTransaction<Project>>;
}
export declare class Client extends ContractClient {
  readonly options: ContractClientOptions;
  static deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    {
      admin,
    }: {
      admin: string;
    },
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
  ): Promise<AssembledTransaction<T>>;
  constructor(options: ContractClientOptions);
  readonly fromJSON: {
    anonymous_voting_setup: (json: string) => AssembledTransaction<null>;
    get_anonymous_voting_config: (
      json: string,
    ) => AssembledTransaction<AnonymousVoteConfig>;
    build_commitments_from_votes: (
      json: string,
    ) => AssembledTransaction<Buffer<ArrayBufferLike>[]>;
    create_proposal: (json: string) => AssembledTransaction<number>;
    vote: (json: string) => AssembledTransaction<null>;
    execute: (json: string) => AssembledTransaction<ProposalStatus>;
    proof: (json: string) => AssembledTransaction<boolean>;
    get_dao: (json: string) => AssembledTransaction<Dao>;
    get_proposal: (json: string) => AssembledTransaction<Proposal>;
    add_member: (json: string) => AssembledTransaction<null>;
    get_member: (json: string) => AssembledTransaction<Member>;
    set_badges: (json: string) => AssembledTransaction<null>;
    get_badges: (json: string) => AssembledTransaction<Badges>;
    get_max_weight: (json: string) => AssembledTransaction<number>;
    pause: (json: string) => AssembledTransaction<null>;
    require_not_paused: (json: string) => AssembledTransaction<null>;
    get_admins_config: (json: string) => AssembledTransaction<AdminsConfig>;
    get_domain_contract_id: (
      json: string,
    ) => AssembledTransaction<DomainContract>;
    set_domain_contract_id: (json: string) => AssembledTransaction<null>;
    propose_upgrade: (json: string) => AssembledTransaction<null>;
    approve_upgrade: (json: string) => AssembledTransaction<null>;
    finalize_upgrade: (json: string) => AssembledTransaction<null>;
    get_upgrade_proposal: (
      json: string,
    ) => AssembledTransaction<UpgradeProposal>;
    version: (json: string) => AssembledTransaction<number>;
    register: (json: string) => AssembledTransaction<Buffer<ArrayBufferLike>>;
    update_config: (json: string) => AssembledTransaction<null>;
    commit: (json: string) => AssembledTransaction<null>;
    get_commit: (json: string) => AssembledTransaction<string>;
    get_project: (json: string) => AssembledTransaction<Project>;
  };
}
