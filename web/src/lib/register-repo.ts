import { WrappedContract } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import * as StellarSdk from "@stellar/stellar-sdk";

export async function registerRepo(
  sorobanContext: SorobanContextType,
  contract: WrappedContract,
) {
  const contractAddress = contract?.deploymentInfo.contractAddress;
  const stellarContract = new StellarSdk.Contract(contractAddress as string);
  const encoder = new TextEncoder();
  const bundlerKeyAccount = await sorobanContext.server
    ?.getAccount(sorobanContext.address as string)
    .then(
      (res) => new StellarSdk.Account(res.accountId(), res.sequenceNumber()),
    );

  const maintainerAddress = StellarSdk.Address.fromString(
    sorobanContext.address as string,
  ).toScVal();

  const args = [
    maintainerAddress,
    StellarSdk.nativeToScVal(encoder.encode("testrepo")),
    StellarSdk.xdr.ScVal.scvVec([maintainerAddress]),
    StellarSdk.nativeToScVal(encoder.encode("http://example.com")),
    StellarSdk.nativeToScVal(encoder.encode("deadbeef")),
  ];
  const simTxn = new StellarSdk.TransactionBuilder(
    bundlerKeyAccount as StellarSdk.Account,
    {
      fee: "0",
      networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
    },
  )
    .addOperation(stellarContract.call("register", ...args))
    .setTimeout(0)
    .build();

  const simResp = await sorobanContext.server?.simulateTransaction(simTxn);

  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResp)) {
    throw simResp;
  } else {
    console.log(simResp.result?.auth)
    const authTxn = StellarSdk.SorobanRpc.assembleTransaction(
      simTxn,
      simResp,
    ).build();
    const authSim = await sorobanContext.server?.simulateTransaction(authTxn);

    if (
      StellarSdk.SorobanRpc.Api.isSimulationError(authSim) ||
      StellarSdk.SorobanRpc.Api.isSimulationRestore(authSim)
    ) {
      throw authSim;
    }
    const txn = StellarSdk.SorobanRpc.assembleTransaction(authTxn, authSim)
      .setTimeout(30)
      .build();

    const signature = await sorobanContext.activeConnector?.signTransaction(
      txn.toXDR(),
      {
        networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
        network: sorobanContext.activeChain?.network,
        accountToSign: sorobanContext.address,
      },
    );
    txn.addSignature(sorobanContext.address as string, signature as string);
  }
}
