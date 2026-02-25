import { getKit } from "../components/stellar-wallets-kit";

export async function signAssembledTransaction(assembledTx: any): Promise<string> {
  const sim = await assembledTx.simulate();

  if (assembledTx.prepare) {
    await assembledTx.prepare(sim);
  }

  const preparedXdr = assembledTx.toXDR();

  // Get the actual StellarWalletsKit instance
  const walletKitInstance = await getKit();

  // Now sign the transaction using the instance method
  const { signedTxXdr } = await walletKitInstance.StellarWalletsKit.signTransaction(preparedXdr);

  return signedTxXdr;
}