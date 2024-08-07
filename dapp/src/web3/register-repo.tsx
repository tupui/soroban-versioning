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
  const [domainAddress, setDomainAddress] = useState<string>("");

  const onClick = async () => {
    await registerRepo(
      sorobanContext,
      contract as WrappedContract,
      repoName,
      repoUrl,
      domainAddress,
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center pt-10">
      <p className="text-2xl font-bold mb-10">Register Repository</p>
      <div className="w-[800px]">
        <div className="grid grid-cols-2 my-2">
          <label className="input input-bordered flex items-center gap-2 mr-1">
            <input
              type="text"
              placeholder="Repo Name"
              className="input w-full border-transparent focus:border-transparent focus:ring-0"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRepoName(e.target.value);
              }}
              value={repoName}
            />
          </label>

          <label className="input input-bordered flex items-center gap-2 ml-1">
            <input
              type="text"
              placeholder="Repo URL"
              className="input w-full border-transparent focus:border-transparent focus:ring-0"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRepoUrl(e.target.value);
              }}
              value={repoUrl}
            />
          </label>
        </div>
        <label className="input input-bordered flex items-center gap-2 my-2">
          <input
            type="text"
            placeholder="Soroban Domain Address"
            className="input w-full border-transparent focus:border-transparent focus:ring-0"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setDomainAddress(e.target.value);
            }}
            value={domainAddress}
          />
        </label>

        <button className="btn" onClick={onClick}>
          Register
        </button>
      </div>
    </div>
  );
}
