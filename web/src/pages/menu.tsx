import { useSorobanReact } from "@soroban-react/core";
import {
  GetReposButton,
  RegisterRepoButton,
} from "../components/action-button";

export function Menu() {
  const sorobanContext = useSorobanReact();

  return (
    <div className="h-full w-full flex items-center justify-center">
      {sorobanContext.address ? (
        <>
          <RegisterRepoButton />
          <GetReposButton />
        </>
      ) : (
        <p className="">Connect your Wallet</p>
      )}
    </div>
  );
}
