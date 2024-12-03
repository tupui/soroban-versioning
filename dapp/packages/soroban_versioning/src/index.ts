import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
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

export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCHZAAUJJZOCFZVTQWGZU4PXR7SFB5PL3XBSHUBNQPXJ3KWE4VFHOBE5",
  },
} as const;

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
};
export type DataKey = { tag: "Admin"; values: void };

export type ProposalStatus =
  | { tag: "Active"; values: void }
  | { tag: "Approved"; values: void }
  | { tag: "Rejected"; values: void }
  | { tag: "Cancelled"; values: void };

export type Vote =
  | { tag: "Approve"; values: void }
  | { tag: "Reject"; values: void }
  | { tag: "Abstain"; values: void };

export interface Proposal {
  id: u32;
  ipfs: string;
  nqg: u32;
  status: ProposalStatus;
  title: string;
  voters_abstain: Array<string>;
  voters_approve: Array<string>;
  voters_reject: Array<string>;
  voting_ends_at: u64;
}

export interface Dao {
  proposals: Array<Proposal>;
}

export type ProjectKey =
  | { tag: "Key"; values: readonly [Buffer] }
  | { tag: "LastHash"; values: readonly [Buffer] }
  | { tag: "Dao"; values: readonly [Buffer, u32] }
  | { tag: "DaoTotalProposals"; values: readonly [Buffer] };

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
    }: {
      proposer: string;
      project_key: Buffer;
      title: string;
      ipfs: string;
      voting_ends_at: u64;
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
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init: (
    { admin }: { admin: string },
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
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAAAAAcFDcmVhdGUgYSBwcm9wb3NhbCBvbiB0aGUgREFPIG9mIHRoZSBwcm9qZWN0LgpQcm9wb3NhbCBpbml0aWF0b3JzIGFyZSBhdXRvbWF0aWNhbGx5IHB1dCBpbiB0aGUgYWJzdGFpbiBncm91cC4KIyBBcmd1bWVudHMKKiBgZW52YCAtIFRoZSBlbnZpcm9ubWVudCBvYmplY3QKKiBgcHJvcG9zZXJgIC0gQWRkcmVzcyBvZiB0aGUgcHJvcG9zYWwgY3JlYXRvcgoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgdGl0bGVgIC0gVGl0bGUgb2YgdGhlIHByb3Bvc2FsCiogYGlwZnNgIC0gSVBGUyBjb250ZW50IGlkZW50aWZpZXIgZGVzY3JpYmluZyB0aGUgcHJvcG9zYWwKKiBgdm90aW5nX2VuZHNfYXRgIC0gVU5JWCB0aW1lc3RhbXAgd2hlbiB2b3RpbmcgZW5kcwojIFJldHVybnMKKiBgdTMyYCAtIFRoZSBJRCBvZiB0aGUgY3JlYXRlZCBwcm9wb3NhbAAAAAAAAA9jcmVhdGVfcHJvcG9zYWwAAAAABQAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAABGlwZnMAAAAQAAAAAAAAAA52b3RpbmdfZW5kc19hdAAAAAAABgAAAAEAAAAE",
        "AAAAAAAAAQ5DYXN0IGEgdm90ZSBvbiBhIHByb3Bvc2FsLgpEb3VibGUgdm90ZXMgYXJlIG5vdCBhbGxvd2VkLgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGB2b3RlcmAgLSBBZGRyZXNzIG9mIHRoZSB2b3RlcgoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHJvcG9zYWxfaWRgIC0gSUQgb2YgdGhlIHByb3Bvc2FsCiogYHZvdGVgIC0gQXBwcm92ZSwgcmVqZWN0IG9yIGFic3RhaW4gZGVjaXNpb24AAAAAAAR2b3RlAAAABAAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAAAAAAR2b3RlAAAH0AAAAARWb3RlAAAAAA==",
        "AAAAAAAAARRHZXQgb25lIHBhZ2Ugb2YgcHJvcG9zYWwgb2YgdGhlIERBTy4KQSBwYWdlIGhhcyAwIHRvIE1BWF9QUk9QT1NBTFNfUEVSX1BBR0UgcHJvcG9zYWxzLgojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcGFnZWAgLSBQYWdlIG9mIHByb3Bvc2FscwojIFJldHVybnMKKiBgdHlwZXM6OkRhb2AgLSBUaGUgRGFvIG9iamVjdCAodmVjdG9yIG9mIHByb3Bvc2FscykAAAAHZ2V0X2RhbwAAAAACAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARwYWdlAAAABAAAAAEAAAfQAAAAA0RhbwA=",
        "AAAAAAAAANdPbmx5IHJldHVybiBhIHNpbmdsZSBwcm9wb3NhbAojIEFyZ3VtZW50cwoqIGBlbnZgIC0gVGhlIGVudmlyb25tZW50IG9iamVjdAoqIGBwcm9qZWN0X2tleWAgLSBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHByb2plY3QKKiBgcHJvcG9zYWxfaWRgIC0gSUQgb2YgdGhlIHByb3Bvc2FsCiMgUmV0dXJucwoqIGB0eXBlczo6UHJvcG9zYWxgIC0gVGhlIHByb3Bvc2FsIG9iamVjdAAAAAAMZ2V0X3Byb3Bvc2FsAAAAAgAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAEAAAfQAAAACFByb3Bvc2Fs",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAADRSZWdpc3RlciBhIG5ldyBHaXQgcHJvamVjdHMgYW5kIGFzc29jaWF0ZWQgbWV0YWRhdGEuAAAACHJlZ2lzdGVyAAAABgAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC21haW50YWluZXJzAAAAA+oAAAATAAAAAAAAAAN1cmwAAAAAEAAAAAAAAAAEaGFzaAAAABAAAAAAAAAAEmRvbWFpbl9jb250cmFjdF9pZAAAAAAAEwAAAAEAAAAO",
        "AAAAAAAAAChDaGFuZ2UgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHByb2plY3QuAAAADXVwZGF0ZV9jb25maWcAAAAAAAAFAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAANrZXkAAAAADgAAAAAAAAALbWFpbnRhaW5lcnMAAAAD6gAAABMAAAAAAAAAA3VybAAAAAAQAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhTZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAGY29tbWl0AAAAAAADAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhHZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAKZ2V0X2NvbW1pdAAAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAAQ",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2plY3QAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAfQAAAAB1Byb2plY3QA",
        "AAAABAAAAAAAAAAAAAAADkNvbnRyYWN0RXJyb3JzAAAAAAALAAAAAAAAAA9VbmV4cGVjdGVkRXJyb3IAAAAAAAAAAAAAAAAKSW52YWxpZEtleQAAAAAAAQAAAAAAAAATUHJvamVjdEFscmVhZHlFeGlzdAAAAAACAAAAAAAAABZVbnJlZ2lzdGVyZWRNYWludGFpbmVyAAAAAAADAAAAAAAAAAtOb0hhc2hGb3VuZAAAAAAEAAAAAAAAABJJbnZhbGlkRG9tYWluRXJyb3IAAAAAAAUAAAAAAAAAGE1haW50YWluZXJOb3REb21haW5Pd25lcgAAAAYAAAAAAAAAF1Byb3Bvc2FsSW5wdXRWYWxpZGF0aW9uAAAAAAcAAAAAAAAAFU5vUHJvcG9zYWxvclBhZ2VGb3VuZAAAAAAAAAgAAAAAAAAADEFscmVhZHlWb3RlZAAAAAkAAAAAAAAAElByb3Bvc2FsVm90aW5nVGltZQAAAAAACg==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAQAAAAAAAAAAAAAABUFkbWluAAAA",
        "AAAAAgAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAEAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAhBcHByb3ZlZAAAAAAAAAAAAAAACFJlamVjdGVkAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAA",
        "AAAAAgAAAAAAAAAAAAAABFZvdGUAAAADAAAAAAAAAAAAAAAHQXBwcm92ZQAAAAAAAAAAAAAAAAZSZWplY3QAAAAAAAAAAAAAAAAAB0Fic3RhaW4A",
        "AAAAAQAAAAAAAAAAAAAACFByb3Bvc2FsAAAACQAAAAAAAAACaWQAAAAAAAQAAAAAAAAABGlwZnMAAAAQAAAAAAAAAANucWcAAAAABAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAAOdm90ZXJzX2Fic3RhaW4AAAAAA+oAAAATAAAAAAAAAA52b3RlcnNfYXBwcm92ZQAAAAAD6gAAABMAAAAAAAAADXZvdGVyc19yZWplY3QAAAAAAAPqAAAAEwAAAAAAAAAOdm90aW5nX2VuZHNfYXQAAAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAAA0RhbwAAAAABAAAAAAAAAAlwcm9wb3NhbHMAAAAAAAPqAAAH0AAAAAhQcm9wb3NhbA==",
        "AAAAAgAAAAAAAAAAAAAAClByb2plY3RLZXkAAAAAAAQAAAABAAAAAAAAAANLZXkAAAAAAQAAAA4AAAABAAAAAAAAAAhMYXN0SGFzaAAAAAEAAAAOAAAAAQAAAAAAAAADRGFvAAAAAAIAAAAOAAAABAAAAAEAAAAAAAAAEURhb1RvdGFsUHJvcG9zYWxzAAAAAAAAAQAAAA4=",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAgAAAAAAAAAEaGFzaAAAABAAAAAAAAAAA3VybAAAAAAQ",
        "AAAAAQAAAAAAAAAAAAAAB1Byb2plY3QAAAAAAwAAAAAAAAAGY29uZmlnAAAAAAfQAAAABkNvbmZpZwAAAAAAAAAAAAttYWludGFpbmVycwAAAAPqAAAAEwAAAAAAAAAEbmFtZQAAABA=",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    create_proposal: this.txFromJSON<u32>,
    vote: this.txFromJSON<null>,
    get_dao: this.txFromJSON<Dao>,
    get_proposal: this.txFromJSON<Proposal>,
    init: this.txFromJSON<null>,
    upgrade: this.txFromJSON<null>,
    version: this.txFromJSON<u32>,
    register: this.txFromJSON<Buffer>,
    update_config: this.txFromJSON<null>,
    commit: this.txFromJSON<null>,
    get_commit: this.txFromJSON<string>,
    get_project: this.txFromJSON<Project>,
  };
}
