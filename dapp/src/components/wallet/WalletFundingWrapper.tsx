"use client";

import { useState, useEffect } from "react";
import WalletFundingModal from "../utils/WalletFundingModal";
export default function WalletFundingWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [exists, setExists] = useState(false);
  const [balance, setBalance] = useState(0);
  const [network, setNetwork] = useState<"mainnet" | "testnet">("mainnet");

  // Listen for the openFundingModal event
  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const { exists, balance, network } = e.detail;
      setExists(exists);
      setBalance(balance);
      setNetwork(network);
      setIsOpen(true);
    };
    window.addEventListener("openFundingModal", handleOpen as EventListener);
    return () =>
      window.removeEventListener(
        "openFundingModal",
        handleOpen as EventListener,
      );
  }, []);

  return (
    <WalletFundingModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      exists={exists}
      balance={balance}
      minRequired={1}
      network={network}
    />
  );
}
