import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
} from "@stellar/stellar-sdk/contract";
import type { u32, u64, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const Errors: {
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
};
export type DataKey = {
  tag: "Admin";
  values: void;
};
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
  | {
      tag: "Key";
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
    {
      project_key,
      public_key,
    }: {
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
    }: {
      project_key: Buffer;
      votes: Array<u32>;
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
   * Only return a single proposal
   * # Arguments
   * * `env` - The environment object
   * * `project_key` - Unique identifier for the project
   * * `proposal_id` - ID of the proposal
   * # Returns
   * * `types::Proposal` - The proposal object
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
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: (
    {
      new_wasm_hash,
    }: {
      new_wasm_hash: Buffer;
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
    upgrade: (json: string) => AssembledTransaction<null>;
    version: (json: string) => AssembledTransaction<number>;
    register: (json: string) => AssembledTransaction<Buffer<ArrayBufferLike>>;
    update_config: (json: string) => AssembledTransaction<null>;
    commit: (json: string) => AssembledTransaction<null>;
    get_commit: (json: string) => AssembledTransaction<string>;
    get_project: (json: string) => AssembledTransaction<Project>;
  };
}
