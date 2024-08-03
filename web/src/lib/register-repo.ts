import { signAndSendTransaction, Simulation, WrappedContract } from "@soroban-react/contracts";
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

export async function registerRepo(
  sorobanContext: SorobanContextType,
  contract: WrappedContract,
) {
  const contractAddress = contract?.deploymentInfo.contractAddress;
  const stellarContract = new Contract(contractAddress as string);
  const bundlerKeyAccount = await sorobanContext.server
    ?.getAccount(sorobanContext.address as string)
    .then((res) => new Account(res.accountId(), res.sequenceNumber()));

  const maintainerAddress = Address.fromString(
    sorobanContext.address as string,
  );

  const domainAddress = Address.fromString(
    "CDODLZIO3OY5ZBCNYQALDZWLW2NN533WIDZUDNW2NRWJGLTWSABGSMH7",
  ).toScVal();

  const args = [
    maintainerAddress.toScVal(),
    nativeToScVal("testrepo"),
    xdr.ScVal.scvVec([maintainerAddress.toScVal()]),
    nativeToScVal("http://example.com"),
    nativeToScVal("deadbeef"),
    domainAddress,
  ];

  const simTxn = new TransactionBuilder(bundlerKeyAccount as Account, {
    fee: BASE_FEE,
    networkPassphrase: sorobanContext.activeChain?.networkPassphrase,
  })
    .addOperation(stellarContract.call("register", ...args))
    .setTimeout(0)
    .build();

  const simResp = await sorobanContext.server?.simulateTransaction(simTxn) as Simulation;

  if (!Api.isSimulationSuccess(simResp)) {
    throw simResp;
  } else {
    const authTx = SorobanRpc.assembleTransaction(simTxn, simResp).build();
    const resp = await signAndSendTransaction({txn: authTx, sorobanContext})
    console.log(resp);
  }
}
