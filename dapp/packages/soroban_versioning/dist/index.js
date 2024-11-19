import { Buffer } from "buffer";
import {
  Client as ContractClient,
  Spec as ContractSpec,
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
};
export const Errors = {
  0: { message: "UnexpectedError" },
  1: { message: "InvalidKey" },
  2: { message: "ProjectAlreadyExist" },
  3: { message: "UnregisteredMaintainer" },
  4: { message: "NoHashFound" },
  5: { message: "InvalidDomainError" },
  6: { message: "MaintainerNotDomainOwner" },
};
export class Client extends ContractClient {
  options;
  constructor(options) {
    super(
      new ContractSpec([
        "AAAABAAAAAAAAAAAAAAADkNvbnRyYWN0RXJyb3JzAAAAAAAHAAAAAAAAAA9VbmV4cGVjdGVkRXJyb3IAAAAAAAAAAAAAAAAKSW52YWxpZEtleQAAAAAAAQAAAAAAAAATUHJvamVjdEFscmVhZHlFeGlzdAAAAAACAAAAAAAAABZVbnJlZ2lzdGVyZWRNYWludGFpbmVyAAAAAAADAAAAAAAAAAtOb0hhc2hGb3VuZAAAAAAEAAAAAAAAABJJbnZhbGlkRG9tYWluRXJyb3IAAAAAAAUAAAAAAAAAGE1haW50YWluZXJOb3REb21haW5Pd25lcgAAAAY=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAQAAAAAAAAAAAAAABUFkbWluAAAA",
        "AAAAAgAAAAAAAAAAAAAAClByb2plY3RLZXkAAAAAAAIAAAABAAAAAAAAAANLZXkAAAAAAQAAAA4AAAABAAAAAAAAAAhMYXN0SGFzaAAAAAEAAAAO",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAgAAAAAAAAAEaGFzaAAAABAAAAAAAAAAA3VybAAAAAAQ",
        "AAAAAQAAAAAAAAAAAAAAB1Byb2plY3QAAAAAAwAAAAAAAAAGY29uZmlnAAAAAAfQAAAABkNvbmZpZwAAAAAAAAAAAAttYWludGFpbmVycwAAAAPqAAAAEwAAAAAAAAAEbmFtZQAAABA=",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAADRSZWdpc3RlciBhIG5ldyBHaXQgcHJvamVjdHMgYW5kIGFzc29jaWF0ZWQgbWV0YWRhdGEuAAAACHJlZ2lzdGVyAAAABgAAAAAAAAAKbWFpbnRhaW5lcgAAAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC21haW50YWluZXJzAAAAA+oAAAATAAAAAAAAAAN1cmwAAAAAEAAAAAAAAAAEaGFzaAAAABAAAAAAAAAAEmRvbWFpbl9jb250cmFjdF9pZAAAAAAAEwAAAAEAAAAO",
        "AAAAAAAAAChDaGFuZ2UgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHByb2plY3QuAAAADXVwZGF0ZV9jb25maWcAAAAAAAAFAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAANrZXkAAAAADgAAAAAAAAALbWFpbnRhaW5lcnMAAAAD6gAAABMAAAAAAAAAA3VybAAAAAAQAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhTZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAGY29tbWl0AAAAAAADAAAAAAAAAAptYWludGFpbmVyAAAAAAATAAAAAAAAAAtwcm9qZWN0X2tleQAAAAAOAAAAAAAAAARoYXNoAAAAEAAAAAA=",
        "AAAAAAAAABhHZXQgdGhlIGxhc3QgY29tbWl0IGhhc2gAAAAKZ2V0X2NvbW1pdAAAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAAQ",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2plY3QAAAAAAQAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAEAAAfQAAAAB1Byb2plY3QA",
      ]),
      options,
    );
    this.options = options;
  }
  fromJSON = {
    init: this.txFromJSON,
    version: this.txFromJSON,
    upgrade: this.txFromJSON,
    register: this.txFromJSON,
    update_config: this.txFromJSON,
    commit: this.txFromJSON,
    get_commit: this.txFromJSON,
    get_project: this.txFromJSON,
  };
}
