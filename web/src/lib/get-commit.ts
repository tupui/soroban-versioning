import { WrappedContract } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toHexString } from "./util";

export async function getCommit(
  sorobanContext: SorobanContextType,
  contract: WrappedContract,
  projectId: Uint8Array,
) {
  const contractAddress = contract?.deploymentInfo.contractAddress;
  const getCommitArgs = [StellarSdk.nativeToScVal(projectId)];

  const stellarContract = new StellarSdk.Contract(contractAddress as string);

  const txn = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account(sorobanContext.address as string, "0"),
    {
      fee: "0",
      networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
    },
  )
    .addOperation(stellarContract.call("get_commit", ...getCommitArgs))
    .setTimeout(0)
    .build();

  const simResp = await sorobanContext.server?.simulateTransaction(txn);

  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResp)) {
    throw simResp;
  } else {
    const resp = StellarSdk.scValToNative(
      simResp.result?.retval as StellarSdk.xdr.ScVal,
    );
    console.log(toHexString(resp));
  }
}
