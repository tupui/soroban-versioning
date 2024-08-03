import {
  useRegisteredContract,
  signAndSendTransaction,
  contractInvoke,
  WrappedContract,
} from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { registerRepo } from "../lib/register-repo";

export function RegisterRepo() {
  const sorobanContext = useSorobanReact();
  const contract = useRegisteredContract("versioning");
  const [contractAddressStored, setContractAddressStored] = useState<string>();
  const [repoName, setRepoName] = useState<string>("");

  const _registerRepo = async () => {
    if (!sorobanContext.server) return;
    if (!sorobanContext.address) return;
    const currentChain = sorobanContext.activeChain?.name?.toLocaleLowerCase();
    if (!currentChain) {
      console.log("No active chain");
      return;
    }

    const contractAddress = contract?.deploymentInfo.contractAddress;
    setContractAddressStored(contractAddress);
    const encoder = new TextEncoder();
    const args = [
      StellarSdk.Address.fromString(sorobanContext.address).toScVal(),
      StellarSdk.nativeToScVal(encoder.encode("testrepo")),
      StellarSdk.xdr.ScVal.scvVec([]),
      StellarSdk.nativeToScVal(encoder.encode("http://example.com")),
      StellarSdk.nativeToScVal(encoder.encode("deadbeef")),
    ];
    const projectId = new Uint8Array([
      154, 252, 222, 74, 217, 43, 29, 68, 231, 69, 123, 243, 128, 203, 176, 248,
      239, 30, 179, 243, 81, 126, 231, 183, 47, 67, 190, 183, 195, 188, 2, 172,
    ]);

    const getCommitArgs = [StellarSdk.nativeToScVal(projectId)];

    const account = await sorobanContext.server.getAccount(
      sorobanContext.address,
    );

    // const resp = await contractInvoke({
    //   contractAddress: contractAddress as string,
    //   method: "get_commit",
    //   args: getCommitArgs,
    //   sorobanContext,
    //   signAndSend: true,
    // });

    const stellarContract = new StellarSdk.Contract(contractAddress as string);

    const txn = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(sorobanContext.address as string, "0"),
      {
        fee: "0",
        networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
      },
    )
      // .addOperation(stellarContract.call("register", ...args))
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
      console.log(resp);
    }

    // const envelope = txn.toEnvelope()
    // const tx = new StellarSdk.Transaction(envelope, sorobanContext.activeChain?.networkPassphrase as string);

    // const raw = await signAndSendTransaction({ txn: tx as StellarSdk.Transaction, sorobanContext });
    // console.log(raw);

    // const signature = await sorobanContext.activeConnector?.signTransaction(
    //   tx.toXDR(),
    //   {
    //     networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
    //     network: sorobanContext.activeChain?.network,
    //     accountToSign: sorobanContext.address,
    //   },
    // );
    // tx.addSignature(sorobanContext.address, signature as string);
  };

  const onClick = async () => {
    await registerRepo(sorobanContext, contract as WrappedContract);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Repo Name"
        className="input w-full max-w-xs"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setRepoName(e.target.value);
        }}
        value={repoName}
      />
      <button className="btn" onClick={onClick}>
        Button
      </button>
    </div>
  );
}
