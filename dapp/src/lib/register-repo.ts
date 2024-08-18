import {
  signAndSendTransaction,
  Simulation,
  WrappedContract,
} from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  SorobanRpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
import { keccak256 } from "@ethersproject/keccak256";
import { Buffer as _Buffer } from "buffer";

export async function registerRepo(
  sorobanContext: SorobanContextType,
  contract: WrappedContract,
  repoName: string,
  repoUrl: string,
  additionalMaintainers?: string[] | undefined,
) {
  const contractAddress = contract?.deploymentInfo.contractAddress;
  const stellarContract = new Contract(contractAddress as string);
  const bundlerKeyAccount = await sorobanContext.server
    ?.getAccount(sorobanContext.address as string)
    .then((res) => new Account(res.accountId(), res.sequenceNumber()));

  const domainContractAddress = "CDODLZIO3OY5ZBCNYQALDZWLW2NN533WIDZUDNW2NRWJGLTWSABGSMH7";

  const maintainerAddress = Address.fromString(
    sorobanContext.address as string,
  );

  const domainAddress = Address.fromString(domainContractAddress.toUpperCase()).toScVal();
  const maintainers = [maintainerAddress.toScVal()];

  if (additionalMaintainers) {
    additionalMaintainers?.forEach((addr) => {
      const address = Address.fromString(addr.toUpperCase()).toScVal();
      maintainers.push(address);
    });
  }

  const args = [
    maintainerAddress.toScVal(),
    nativeToScVal(repoName),
    xdr.ScVal.scvVec(maintainers),
    nativeToScVal(repoUrl),
    nativeToScVal(keccak256(_Buffer.from(repoName)).slice(2)),
    domainAddress,
  ];

  const simTxn = new TransactionBuilder(bundlerKeyAccount as Account, {
    fee: BASE_FEE,
    networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
  })
    .addOperation(stellarContract.call("register", ...args))
    .setTimeout(0)
    .build();

  const simResp = (await sorobanContext.server?.simulateTransaction(
    simTxn,
  )) as Simulation;

  if (!Api.isSimulationSuccess(simResp)) {
    throw simResp;
  } else {
    const authTx = SorobanRpc.assembleTransaction(simTxn, simResp).build();
    const resp = await signAndSendTransaction({ txn: authTx, sorobanContext });
    console.log(resp);
  }
}
