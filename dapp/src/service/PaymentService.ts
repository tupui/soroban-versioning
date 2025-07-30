import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "utils/utils";
import { kit } from "../components/stellar-wallets-kit";
import { loadedPublicKey } from "./walletService";
import { retryAsync } from "../utils/retry";

/**
 * Checks if an error is expected (user rejected transaction, insufficient balance, etc.)
 */
function isExpectedTransactionError(error: any): boolean {
  if (!error) return false;

  // Common expected errors in Stellar transactions
  const expectedErrorPatterns = [
    "op_underfunded", // Insufficient balance
    "tx_bad_auth", // Signature issues (often from user rejecting)
    "user rejected", // User explicitly rejected
    "declined to sign", // User declined to sign
    "canceled", // User canceled
    "Request was rejected", // Generic rejection
  ];

  const errorString =
    typeof error === "string" ? error : error.message || error.toString();

  return expectedErrorPatterns.some((pattern) =>
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
    const server = new StellarSdk.Horizon.Server(
      "https://horizon-testnet.stellar.org",
    );
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

    // Sign and send the transaction
    const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());

    try {
      const signedTransaction = new StellarSdk.Transaction(
        signedTxXdr,
        StellarSdk.Networks.TESTNET,
      );

      await retryAsync(() => server.submitTransaction(signedTransaction));

      return true;
    } catch (error) {
      // Only show error toast for unexpected errors
      if (!isExpectedTransactionError(error)) {
        toast.error(
          "Transaction Failed",
          "Error submitting transaction to Stellar network",
        );
      }
      return false;
    }
  } catch (error) {
    // Only show error toast for unexpected errors
    if (!isExpectedTransactionError(error)) {
      toast.error("Transaction Failed", "Error preparing transaction");
    }
    return false;
  }
}

export { sendXLM };
