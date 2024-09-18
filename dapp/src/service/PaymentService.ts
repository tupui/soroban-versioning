import { kit, loadedPublicKey } from "../components/stellar-wallets-kit";
import * as StellarSdk from "@stellar/stellar-sdk";

async function sendXLM(donateAmount: string, projectAddress: string, tipAmount: string): Promise<boolean> {
  const senderPublicKey = loadedPublicKey();

  const tansuAddress = import.meta.env.PUBLIC_TANSU_CONTRACT_ID;

  if (!senderPublicKey) {
    alert("Please connect your wallet first");
    return false;
  }

  try {
    // Fetch the sender's account details from the Stellar network
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
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
      
    try {
      const result = await server.submitTransaction(
        StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET)
      );
      console.log("Transaction successful:", result);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error response from Stellar:", error.message);
      } else {
        console.error("Unknown error occurred:", error);
      }
      return false;
    }
    
  } catch (e: unknown) {
    console.error("Error sending XLM:", JSON.stringify(e, null, 2));
    return false;
  }
}

export {
  sendXLM,
};
