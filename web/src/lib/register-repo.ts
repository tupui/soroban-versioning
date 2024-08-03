import { sendTx, Tx, WrappedContract } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import * as StellarSdk from "@stellar/stellar-sdk";
import { contractInvoke } from "@soroban-react/contracts";

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
      fee: "100",
      networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
    },
  )
    .addOperation(stellarContract.call("register", ...args))
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

  const simResp = await sorobanContext.server?.simulateTransaction(simTxn);

  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResp)) {
    throw simResp;
  } else {
    const signature = await sorobanContext.activeConnector?.signTransaction(
      simTxn.toXDR(),
      {
        networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
        network: sorobanContext.activeChain?.network,
        accountToSign: sorobanContext.address,
      },
    );
    const signedTxn = StellarSdk.TransactionBuilder.fromXDR(
      signature as string,
      sorobanContext.activeChain?.networkPassphrase as string,
    );
    const res = await sendTx({
      tx: signedTxn,
      secondsToWait: 30,
      server: sorobanContext.server,
    });

    console.log(res);
  }
}
