import { retryAsync } from "../utils/retry";
import { parseContractError } from "../utils/contractErrors";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "utils/utils";
import { loadedPublicKey } from "./walletService";
import { isLaunchtubeEnabled, sendViaLaunchtube } from "./LaunchtubeService";

/**
 * Process the response from a transaction submission (Launchtube or soroban-rpc)
 * - Handles errors and attempts to decode return values
 * - If PENDING, polls until SUCCESS/FAILED or timeout
 */
export async function processTxResponse(
    response: any,
    server?: any,
): Promise<any> {
    // Handle Launchtube errors
    if (response.error) {
        const errorStr = JSON.stringify(response.error);
        const match = errorStr.match(/Error\(Contract, #(\d+)\)/);
        if (match)
            throw new Error(parseContractError({ message: errorStr } as any));
        throw new Error(`Transaction failed: ${errorStr}`);
    }

    // Handle RPC ERROR
    if (response.status === "ERROR") {
        const errorStr = JSON.stringify(response.errorResult);
        const match = errorStr.match(/Error\(Contract, #(\d+)\)/);
        if (match)
            throw new Error(parseContractError({ message: errorStr } as any));
        throw new Error(`Transaction failed: ${errorStr}`);
    }

    if (response.status === "SUCCESS" || response.returnValue !== undefined) {
        try {
            const { xdr, scValToNative } = StellarSdk;

            if (
                typeof response.returnValue === "number" ||
                typeof response.returnValue === "boolean"
            ) {
                return response.returnValue;
            }

            let decoded: any;
            if (typeof response.returnValue === "string") {
                const scVal = xdr.ScVal.fromXDR(response.returnValue, "base64");
                decoded = scValToNative(scVal);
            } else if (response.returnValue) {
                decoded = scValToNative(response.returnValue);
            }

            if (typeof decoded === "bigint") return Number(decoded);
            if (typeof decoded === "number") return decoded;
            if (typeof decoded === "boolean") return decoded;

            const coerced = Number(decoded);
            return isNaN(coerced) ? decoded : coerced;
        } catch {
            return true;
        }
    }

    if (response.status === "PENDING" && server) {
        let getResponse = await server.getTransaction(response.hash);
        let retries = 0;
        while (getResponse.status === "NOT_FOUND" && retries < 30) {
            await new Promise((r) => setTimeout(r, 1000));
            getResponse = await server.getTransaction(response.hash);
            retries++;
        }
        return processTxResponse(getResponse, server);
    }

    // Handle RPC error FAILED
    if (response.status === "FAILED") {
        const errorStr = JSON.stringify(response);
        const match = errorStr.match(/Error\(Contract, #(\d+)\)/);
        if (match)
            throw new Error(parseContractError({ message: errorStr } as any));
        throw new Error(`Transaction failed with status: FAILED`);
    }

    return response;
}

/** Send a signed transaction (Soroban) via soroban-rpc
 * - Accepts base64 XDR directly (soroban-rpc supports it)
 * - Falls back to classic Transaction envelope when necessary
 * - Waits for PENDING → SUCCESS/FAILED and attempts returnValue decoding
 */
export async function sendViaRpc(signedTxXdr: string): Promise<any> {
    const { Transaction, rpc } = StellarSdk;
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

    return await processTxResponse(sendResponse, server);
}

/**
 * Send a signed transaction (Soroban) and decode typical return values.
 * - Uses Launchtube if enabled and configured
 * - Accepts base64 XDR directly (soroban-rpc supports it)
 * - Falls back to classic Transaction envelope when necessary
 * - Waits for PENDING → SUCCESS/FAILED and attempts returnValue decoding
 */
export async function sendSignedTransaction(signedTxXdr: string): Promise<any> {
    let sendResponse: any;

    // Try Launchtube first if enabled, otherwise fall back to RPC
    if (isLaunchtubeEnabled()) {
        console.log("Using Launchtube for transaction submission");
        try {
            sendResponse = await sendViaLaunchtube(signedTxXdr);
        } catch (error: any) {
            console.warn("Launchtube failed, falling back to RPC:", error.message);
            sendResponse = await sendViaRpc(signedTxXdr);
        }
    } else {
        sendResponse = await sendViaRpc(signedTxXdr);
    }

    return await processTxResponse(sendResponse);
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
        // Fetch the sender's account details from Horizon (sequence number)
        const horizonUrl = import.meta.env.PUBLIC_HORIZON_URL;

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

        // Sign the transaction using the wallet kit
        const { kit } = await import("../components/stellar-wallets-kit");
        const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());

        // For classic Stellar transactions, we need to submit to Horizon directly
        // since sendSignedTransaction is designed for Soroban transactions
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

        // Check if the transaction was successful according to Horizon API
        if (result && result.successful === true) {
            return true;
        } else {
            // If not successful, check for error details
            const errorDetails =
                result?.error || result?.message || "Transaction failed on network";
            throw new Error(errorDetails);
        }
    } catch (error: any) {
        // Show network-specific errors to help users understand what went wrong
        if (isStellarNetworkError(error)) {
            const errorString =
                typeof error === "string" ? error : error.message || error.toString();
            toast.error("Transaction Failed", errorString);
        } else {
            // Surface non-network errors so users get actionable feedback
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

    const { kit } = await import("../components/stellar-wallets-kit");
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
