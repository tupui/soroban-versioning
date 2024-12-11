import * as StellarSdk from "@stellar/stellar-sdk";
import crypto from "crypto";

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
        throw new Error("Proposer is not a valid maintainer.");
      }
    } else if (validSigners !== sourceAccount) {
      throw new Error("Proposer is not a valid maintainer.");
    }

    const signatureValid = transaction.signatures.some((signature) => {
      const keypair = StellarSdk.Keypair.fromPublicKey(sourceAccount);
      return keypair.verify(transaction.hash(), signature.signature());
    });

    if (!signatureValid) {
      throw new Error("Invalid signature.");
    }

    return true;
  } catch (error) {
    console.error("Signature verification failed:", error);
    throw error;
  }
};

const verifyDidHash = (signedTransactionXDR: string, did: string) => {
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
    return false;
  }

  console.log("DID hash verified successfully");
  return true;
};

export { verifyChallengeSignature, verifyDidHash };
