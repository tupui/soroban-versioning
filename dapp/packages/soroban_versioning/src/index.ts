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

  7: { message: "NoProposalorPageFound" },

  8: { message: "AlreadyVoted" },
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
   * A page has 10 proposals.
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
        "AAAAAAAAAGxDcmVhdGUgYSBwcm9wb3NhbCBvbiB0aGUgREFPIG9mIHRoZSBwcm9qZWN0LgpQcm9wb3NhbCBpbml0aWF0b3JzIGFyZSBhdXRvbWF0aWNhbGx5IHB1dCBpbiB0aGUgYWJzdGFpbiBncm91cC4AAAAPY3JlYXRlX3Byb3Bvc2FsAAAAAAUAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAFdGl0bGUAAAAAAAAQAAAAAAAAAARpcGZzAAAAEAAAAAAAAAAOdm90aW5nX2VuZHNfYXQAAAAAAAYAAAABAAAABA==",
        "AAAAAAAAADhDYXN0IGEgdm90ZSBvbiBhIHByb3Bvc2FsLgpEb3VibGUgdm90ZXMgYXJlIG5vdCBhbGxvd2VkLgAAAAR2b3RlAAAABAAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAAAAAAR2b3RlAAAH0AAAAARWb3RlAAAAAA==",
        "AAAAAAAAAD1HZXQgb25lIHBhZ2Ugb2YgcHJvcG9zYWwgb2YgdGhlIERBTy4KQSBwYWdlIGhhcyAxMCBwcm9wb3NhbHMuAAAAAAAAB2dldF9kYW8AAAAAAgAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAEcGFnZQAAAAQAAAABAAAH0AAAAANEYW8A",
        "AAAAAAAAAB1Pbmx5IHJldHVybiBhIHNpbmdsZSBwcm9wb3NhbAAAAAAAAAxnZXRfcHJvcG9zYWwAAAACAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAQAAB9AAAAAIUHJvcG9zYWw=",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAADRSZWdpc3RlciBhIG5ldyBHaXQgcHJvamVjdHMgYW5kIGFzc29jaWF0ZWQgbWV0YWRhdGEuAAAACHJlZ2lzdGVyAAAABgAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC21haW50YWluZXJzAAAAA+oAAAATAAAAAAAAAAN1cmwAAAAAEAAAAAAAAAAEaGFzaAAAABAAAAAAAAAAEmRvbWFpbl9jb250cmFjdF9pZAAAAAAAEwAAAAEAAAAO",
        "AAAAAAAAAChDaGFuZ2UgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHByb2plY3QuAAAADXVwZGF0ZV9jb25maWcAAAAAAAAFAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAANrZXkAAAAADgAAAAAAAAALbWFpbnRhaW5lcnMAAAAD6gAAABMAAAAAAAAAA3VybAAAAAAQAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhTZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAGY29tbWl0AAAAAAADAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhHZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAKZ2V0X2NvbW1pdAAAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAAQ",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2plY3QAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAfQAAAAB1Byb2plY3QA",
        "AAAABAAAAAAAAAAAAAAADkNvbnRyYWN0RXJyb3JzAAAAAAAJAAAAAAAAAA9VbmV4cGVjdGVkRXJyb3IAAAAAAAAAAAAAAAAKSW52YWxpZEtleQAAAAAAAQAAAAAAAAATUHJvamVjdEFscmVhZHlFeGlzdAAAAAACAAAAAAAAABZVbnJlZ2lzdGVyZWRNYWludGFpbmVyAAAAAAADAAAAAAAAAAtOb0hhc2hGb3VuZAAAAAAEAAAAAAAAABJJbnZhbGlkRG9tYWluRXJyb3IAAAAAAAUAAAAAAAAAGE1haW50YWluZXJOb3REb21haW5Pd25lcgAAAAYAAAAAAAAAFU5vUHJvcG9zYWxvclBhZ2VGb3VuZAAAAAAAAAcAAAAAAAAADEFscmVhZHlWb3RlZAAAAAg=",
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
