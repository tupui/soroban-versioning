import { useSorobanReact } from "@soroban-react/core";
import { Check } from "lucide-react";

export function ChainSelect() {
  const { activeChain, chains: supportedChains } = useSorobanReact();

  return (
    <div className="dropdown">
      <div className="btn m-2" role="button" tabIndex={0}>
        {activeChain ? activeChain.name : "Select Chain"}
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 shadow"
      >
        {supportedChains.map((chain) => {
          return (
            <li key={chain.name}>
              <div>
                {chain.network === activeChain?.network && <Check />}
                <span>{chain.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
