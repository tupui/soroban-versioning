import { useEffect } from "react";
import { CONTRACT_ID } from "../constants";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toHexString } from "../lib/util";
import { useSorobanReact } from "@soroban-react/core";

export function Events() {
  const sorobanContext = useSorobanReact();
  const server = sorobanContext.server;
  const eventFilter: StellarSdk.SorobanRpc.Api.EventFilter[] = [
    {
      type: "contract",
      contractIds: [CONTRACT_ID],
    },
  ];

  useEffect(() => {
    server
      .getEvents({ startLedger: 391673, filters: eventFilter })
      .then((resp) => {
        resp.events.forEach((event) => {
          const topicName = StellarSdk.scValToNative(event.topic[0]);
          const projectId = toHexString(
            StellarSdk.scValToNative(event.topic[1]),
          );
          event.topic = [topicName, projectId];
          event.value = toHexString(StellarSdk.scValToNative(event.value)); // either commit hash or project id depending on the topic
        });
        console.log(resp.events);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  return <div></div>;
}
