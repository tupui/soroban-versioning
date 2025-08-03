import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "utils/utils";
import { kit } from "../components/stellar-wallets-kit";
import { loadedPublicKey } from "./walletService";
import { retryAsync } from "../utils/retry";

/**
 * Checks if an error is a Stellar network/transaction error (not a wallet error)
 */
function isStellarNetworkError(error: any): boolean {
  if (!error) return false;

  // These are Stellar network/transaction specific errors that should be shown to users
  const stellarErrorPatterns = [
    "op_underfunded", // Insufficient balance
    "tx_insufficient_fee", // Fee too low
    "tx_bad_seq", // Sequence number issues
  ];

  const errorString =
    typeof error === "string" ? error : error.message || error.toString();

  return stellarErrorPatterns.some((pattern) =>
    errorString.toLowerCase().includes(pattern.toLowerCase()),
  );
}

async function sendXLM(
  donateAmount: string,
  projectAddress: string,
  tipAmount: string,
  donateMessage: string,
): Promise<boolean> {
  const senderPublicKey = loadedPublicKey();

  const tansuAddress = import.meta.env.PUBLIC_TANSU_OWNER_ID;

  if (!senderPublicKey) {
    // This is a user action request, not an unexpected error
    toast.error("Connect Wallet", "Please connect your wallet first");
    return false;
  }

  try {
    // Fetch the sender's account details from the Stellar network
    const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(senderPublicKey);

    // Create the transaction
    const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: projectAddress,
          asset: StellarSdk.Asset.native(),
          amount: donateAmount,
        }),
      )
      .addMemo(StellarSdk.Memo.text(donateMessage));

    // Add tip operation only if tipAmount is not "0"
    if (Number(tipAmount) > 0) {
      transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: tansuAddress,
          asset: StellarSdk.Asset.native(),
          amount: tipAmount,
        }),
      );
    }

    const transaction = transactionBuilder
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    // Sign and send the transaction - trust the Stellar Wallets Kit for signing errors
    const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());

    const signedTransaction = new StellarSdk.Transaction(
      signedTxXdr,
      StellarSdk.Networks.TESTNET,
    );

    await retryAsync(() => server.submitTransaction(signedTransaction));
    return true;
  } catch {
    // Show network-specific errors to help users understand what went wrong
    if (isStellarNetworkError(error)) {
      const errorString =
        typeof error === "string" ? error : error.message || error.toString();
      toast.error("Transaction Failed", errorString);
    }
    // Wallet errors (rejections, etc.) are handled by the Stellar Wallets Kit
    // and don't need additional toast notifications
    return false;
  }
}

export { sendXLM };
