import { useEffect } from "react";
import { CONTRACT_ID } from "../constants";
import * as StellarSdk from "@stellar/stellar-sdk";


export function Events() {
  const server = new StellarSdk.SorobanRpc.Server(
    "https://soroban-testnet.stellar.org:443",
  );
  const eventFilter: StellarSdk.SorobanRpc.Api.EventFilter[] = [
    {
      type: "contract",
      contractIds: [CONTRACT_ID],
    },
  ];

  useEffect(() => {
    server
      .getEvents({ startLedger: 391673, filters: eventFilter })
      .then((resp) => console.log(resp));
  });

  return <div></div>;
}
