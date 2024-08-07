import { useSorobanReact } from "@soroban-react/core";

export function WalletInfo() {
  const { address } = useSorobanReact();

  return <div>{address}</div>;
}
