import { retryAsync } from "../utils/retry";
import { parseContractError } from "../utils/contractErrors";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "utils/utils";
import {
  loadedPublicKey,
  loadedProvider,
  setConnection,
} from "./walletService";

/**
 * Send a signed transaction (Soroban) and decode typical return values.
 * - Accepts base64 XDR directly (soroban-rpc supports it)
 * - Falls back to classic Transaction envelope when necessary
 * - Waits for PENDING → SUCCESS/FAILED and attempts returnValue decoding
 */
export async function sendSignedTransaction(signedTxXdr: string): Promise<any> {
  const { Transaction, rpc } = await import("@stellar/stellar-sdk");
  const server = new rpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);

  let sendResponse: any;
  try {
    sendResponse = await retryAsync(() =>
      (server as any).sendTransaction(signedTxXdr),
    );
  } catch (_error) {
    const transaction = new Transaction(
      signedTxXdr,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );
    sendResponse = await retryAsync(() => server.sendTransaction(transaction));
  }

  if (sendResponse.status === "ERROR") {
    const errorResultStr = JSON.stringify(sendResponse.errorResult);
    const contractErrorMatch = errorResultStr.match(
      /Error\(Contract, #(\d+)\)/,
    );
    if (contractErrorMatch) {
      throw new Error(parseContractError({ message: errorResultStr } as any));
    }
    throw new Error(`Transaction failed: ${errorResultStr}`);
  }

  if (sendResponse.status === "SUCCESS") {
    if (sendResponse.returnValue !== undefined) {
      if (
        typeof sendResponse.returnValue === "number" ||
        typeof sendResponse.returnValue === "boolean"
      ) {
        return sendResponse.returnValue;
      }
      try {
        const { xdr, scValToNative } = await import("@stellar/stellar-sdk");
        let decoded: any;
        if (typeof sendResponse.returnValue === "string") {
          const scVal = xdr.ScVal.fromXDR(sendResponse.returnValue, "base64");
          decoded = scValToNative(scVal);
        } else {
          decoded = scValToNative(sendResponse.returnValue);
        }
        if (typeof decoded === "bigint") return Number(decoded);
        if (typeof decoded === "number") return decoded;
        if (typeof decoded === "boolean") return decoded;
        const coerced = Number(decoded);
        return isNaN(coerced) ? decoded : coerced;
      } catch (_) {
        return true;
      }
    }
    return true;
  }

  if (sendResponse.status === "PENDING") {
    let getResponse = await server.getTransaction(sendResponse.hash);
    let retries = 0;
    const maxRetries = 30;

    while (getResponse.status === "NOT_FOUND" && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(sendResponse.hash);
      retries++;
    }

    if (getResponse.status === "SUCCESS") {
      if (getResponse.returnValue !== undefined) {
        if (
          typeof getResponse.returnValue === "number" ||
          typeof getResponse.returnValue === "boolean"
        ) {
          return getResponse.returnValue;
        }
        try {
          const { xdr, scValToNative } = await import("@stellar/stellar-sdk");
          let decoded: any;
          if (typeof getResponse.returnValue === "string") {
            const scVal = xdr.ScVal.fromXDR(getResponse.returnValue, "base64");
            decoded = scValToNative(scVal);
          } else {
            decoded = scValToNative(getResponse.returnValue);
          }
          if (typeof decoded === "bigint") return Number(decoded);
          if (typeof decoded === "number") return decoded;
          if (typeof decoded === "boolean") return decoded;
          const coerced = Number(decoded);
          return isNaN(coerced) ? decoded : coerced;
        } catch (_) {
          return true;
        }
      }
      return true;
    } else if (getResponse.status === "FAILED") {
      const resultStr = JSON.stringify(getResponse);
      const contractErrorMatch = resultStr.match(/Error\(Contract, #(\d+)\)/);
      if (contractErrorMatch) {
        throw new Error(parseContractError({ message: resultStr } as any));
      }
      throw new Error(`Transaction failed with status: ${getResponse.status}`);
    } else {
      throw new Error(`Transaction failed with status: ${getResponse.status}`);
    }
  }

  return sendResponse;
}

/**
 * Send XLM payment transaction (Stellar classic, not Soroban)
 * Used for donations and tips
 */
export async function sendXLM(
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
    const horizonUrl = import.meta.env.PUBLIC_HORIZON_URL;

    // Fetch the sender's account details from Horizon (sequence number)
    const accountResp = await fetch(
      `${horizonUrl}/accounts/${senderPublicKey}`,
      { headers: { Accept: "application/json" } },
    );
    if (!accountResp.ok) {
      throw new Error(`Failed to load account: ${accountResp.status}`);
    }
    const accountJson = await accountResp.json();
    const account = new StellarSdk.Account(
      senderPublicKey,
      accountJson.sequence,
    );

    // Create the transaction
    const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: projectAddress,
          asset: StellarSdk.Asset.native(),
          amount: donateAmount,
        }),
      )
      .addMemo(StellarSdk.Memo.text(donateMessage));

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

    // --- Ensure kit is set to the persisted provider and refresh address if available ---
    const provider = loadedProvider();
    const { kit } = await import("../components/stellar-wallets-kit");
    if (provider) {
      kit.setWallet(provider);

      try {
        if (typeof kit.getAddress === "function") {
          const { address } = await kit.getAddress();
          const stored = loadedPublicKey();
          if (address && address !== stored) {
            setConnection(address, provider);
          }
        }
      } catch {
        // ignore - failing to refresh shouldn't block signing attempt
      }
    }

    // Sign the transaction
    const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());

    const signedTransaction = new StellarSdk.Transaction(
      signedTxXdr,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );

    // Submit to Horizon
    const response = await fetch(`${horizonUrl}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `tx=${encodeURIComponent(signedTransaction.toXDR())}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Horizon submission failed: ${errorText}`);
    }

    const result = await response.json();

    if (result && result.successful === true) {
      return true;
    } else {
      const errorDetails =
        result?.error || result?.message || "Transaction failed on network";
      throw new Error(errorDetails);
    }
  } catch (error: any) {
    if (isStellarNetworkError(error)) {
      const errorString =
        typeof error === "string" ? error : error.message || error.toString();
      toast.error("Transaction Failed", errorString);
    } else {
      const msg =
        typeof error === "string" ? error : error?.message || "Unknown error";
      toast.error("Support", msg);
    }
    return false;
  }
}

/**
 * Checks if an error is a Stellar network/transaction error (not a wallet error)
 */
function isStellarNetworkError(error: any): boolean {
  if (!error) return false;

  const stellarErrorPatterns = [
    "op_underfunded",
    "tx_insufficient_fee",
    "tx_bad_seq",
  ];

  const errorString =
    typeof error === "string" ? error : error.message || error.toString();

  return stellarErrorPatterns.some((pattern) =>
    errorString.toLowerCase().includes(pattern.toLowerCase()),
  );
}

/**
 * Sign an already-assembled Soroban transaction by simulating, preparing (if supported),
 * converting to XDR and invoking the wallet kit signer.
 */
export async function signAssembledTransaction(
  assembledTx: any,
): Promise<string> {
  const sim = await assembledTx.simulate();

  if ((assembledTx as any).prepare) {
    await (assembledTx as any).prepare(sim);
  }

  const preparedXdr = assembledTx.toXDR();

  // --- Ensure kit is set to the persisted provider and refresh address if available ---
  const provider = loadedProvider();
  const { kit } = await import("../components/stellar-wallets-kit");
  if (provider) {
    kit.setWallet(provider);

    try {
      if (typeof kit.getAddress === "function") {
        const { address } = await kit.getAddress();
        const stored = loadedPublicKey();
        if (address && address !== stored) {
          setConnection(address, provider);
        }
      }
    } catch {
      // ignore - signing can still be attempted
    }
  }

  const { signedTxXdr } = await kit.signTransaction(preparedXdr);

  return signedTxXdr;
}

/**
 * Convenience helper that signs an assembled transaction and sends it to the network.
 */
export async function signAndSend(assembledTx: any): Promise<any> {
  const signed = await signAssembledTransaction(assembledTx);
  return await sendSignedTransaction(signed);
}
