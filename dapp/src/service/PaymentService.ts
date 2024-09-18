import { kit, loadedPublicKey } from "../components/stellar-wallets-kit";
import StellarSdk from "@stellar/stellar-sdk";

async function sendXLM(donateAmount: string, projectAddress: string, tipAmount: string): Promise<boolean> {
  const senderPublicKey = loadedPublicKey();

  const rpcUrl = import.meta.env.PUBLIC_SOROBAN_RPC_URL;
  const tansuAddress = import.meta.env.PUBLIC_TANSU_CONTRACT_ID;

  if (!senderPublicKey) {
    alert("Please connect your wallet first");
    return false;
  }

  try {
    // Fetch the sender's account details from the Stellar network
    const server = new StellarSdk.Server(rpcUrl ?? "https://soroban-testnet.stellar.org:443");
    const account = await server.loadAccount(senderPublicKey);

    // Create the transaction
    const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: projectAddress,
        asset: StellarSdk.Asset.native(), // XLM is the native asset
        amount: donateAmount,
      }));

    // Add tip operation only if tipAmount is not "0"
    if (tipAmount !== "0") {
      transactionBuilder.addOperation(StellarSdk.Operation.payment({
        destination: tansuAddress,
        asset: StellarSdk.Asset.native(), // XLM is the native asset
        amount: tipAmount,
      }));
    }

    const transaction = transactionBuilder
      .setTimeout(30)
      .build();

    // Sign and send the transaction
    const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());

    const result = await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.PUBLIC));

    console.log("Transaction successful:", result);
    return true;
  } catch (e) {
    console.error("Error sending XLM:", e);
    return false;
  }
}

export {
  sendXLM,
};
