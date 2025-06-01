import * as StellarSdk from "@stellar/stellar-sdk";
import crypto from "crypto";
import { toast } from "utils/utils";

/**
 * Verifies a challenge signature for security purposes
 * Note: This function SHOULD show toast errors as these are security-critical failures
 */
const verifyChallengeSignature = (
  signedTransactionXDR: string,
  validSigners: string[] | string,
) => {
  try {
    const transaction = new StellarSdk.Transaction(
      signedTransactionXDR,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );

    const sourceAccount = transaction.source;

    if (Array.isArray(validSigners)) {
      if (!validSigners.includes(sourceAccount)) {
        const error = "Proposer is not a valid maintainer.";
        toast.error("Verification Failed", error);
        throw new Error(error);
      }
    } else if (validSigners !== sourceAccount) {
      const error = "Proposer is not a valid maintainer.";
      toast.error("Verification Failed", error);
      throw new Error(error);
    }

    const signatureValid = transaction.signatures.some((signature) => {
      const keypair = StellarSdk.Keypair.fromPublicKey(sourceAccount);
      return keypair.verify(transaction.hash(), signature.signature());
    });

    if (!signatureValid) {
      const error = "Invalid signature.";
      toast.error("Verification Failed", error);
      throw new Error(error);
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Only show toast for errors we didn't already handle
      if (
        !error.message.includes("Proposer is not a valid maintainer") &&
        !error.message.includes("Invalid signature")
      ) {
        toast.error("Verification Failed", error.message);
      }
    } else {
      toast.error("Verification Failed", "Signature verification failed");
    }
    throw error;
  }
};

/**
 * Verifies a DID hash - returns false instead of throwing for expected failures
 */
const verifyDidHash = (signedTransactionXDR: string, did: string): boolean => {
  try {
    const transaction = new StellarSdk.Transaction(
      signedTransactionXDR,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );

    const memoHashBuffer = transaction.memo.value;
    const memoHash = memoHashBuffer?.toString("utf8");

    const didHash = crypto
      .createHash("sha256")
      .update(did)
      .digest("hex")
      .slice(0, 28);

    if (memoHash !== didHash) {
      // Expected condition (hash doesn't match)
      return false;
    }

    return true;
  } catch (error) {
    // Don't show toast for DID verification as failure is an expected condition
    return false;
  }
};

export { verifyChallengeSignature, verifyDidHash };
