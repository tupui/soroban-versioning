import { kit } from "../components/stellar-wallets-kit";
import { loadedPublicKey } from "./walletService";
import * as StellarSdk from "@stellar/stellar-sdk";
import CryptoJS from "crypto-js";

const generateChallengeTransaction = async (memo: string) => {
  const proposerAddress = loadedPublicKey();

  if (!proposerAddress) {
    alert("Please connect your wallet first");
    return;
  }
  const server = new StellarSdk.Horizon.Server(
    "https://horizon-testnet.stellar.org",
  );

  const memoHash = CryptoJS.SHA256(memo)
    .toString(CryptoJS.enc.Hex)
    .slice(0, 28);

  const account = await server.loadAccount(proposerAddress);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  })
    .addMemo(StellarSdk.Memo.text(memoHash))
    .setTimeout(300)
    .build();

  const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());
  return signedTxXdr;
};

export { generateChallengeTransaction };
