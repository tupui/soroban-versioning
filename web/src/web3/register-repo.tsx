import {
  useRegisteredContract,
  WrappedContract,
} from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { useState } from "react";
import { registerRepo } from "../lib/register-repo";

export function RegisterRepo() {
  const sorobanContext = useSorobanReact();
  const contract = useRegisteredContract("versioning");
  const [repoName, setRepoName] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string>("");

  const onClick = async () => {
    await registerRepo(
      sorobanContext,
      contract as WrappedContract,
      repoName,
      repoUrl,
    );
  };

  return (
    <div className="w-1/2">
      <label className="input input-bordered flex items-center gap-2">
        <input
          type="text"
          placeholder="Repo Name"
          className="input w-full max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRepoName(e.target.value);
          }}
          value={repoName}
        />
      </label>

      <label className="input input-bordered flex items-center gap-2">
        <input
          type="text"
          placeholder="Repo URL"
          className="input w-full max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRepoUrl(e.target.value);
          }}
          value={repoUrl}
        />
      </label>

      <button className="btn" onClick={onClick}>
        Register
      </button>
    </div>
  );
}
