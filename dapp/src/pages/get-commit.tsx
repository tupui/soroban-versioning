import {
  useRegisteredContract,
  WrappedContract,
} from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { getCommit } from "../lib/get-commit";
import { useState } from "react";
import { base64ToHex, hexToBytes } from "../lib/util";

export function GetCommit() {
  const [commitHash, setCommitHash] = useState("");
  const [projectId, setProjectId] = useState("");

  const sorobanContext = useSorobanReact();
  const contract = useRegisteredContract("versioning") as WrappedContract;

  const onClick = async () => {
    const projectIdHex = base64ToHex(projectId);
    const projectIdBytes = hexToBytes(projectIdHex);
    const hash = await getCommit(sorobanContext, contract, projectIdBytes);
    setCommitHash(hash);
  };

  return (
    <div className="w-full h-full flex flex-col items-center pt-10">
      <p className="text-2xl font-bold mb-10">Register Repository</p>
      <div className="w-[800px]">
        <label className="input input-bordered flex items-center gap-2 my-2">
          <input
            type="text"
            placeholder="Project ID"
            className="input w-full border-transparent focus:border-transparent focus:ring-0"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setProjectId(e.target.value);
            }}
            value={projectId}
          />
        </label>
        <button className="btn" onClick={onClick}>
          Get Commit
        </button>
        {commitHash ? (
          <div className="my-2">
            <span>Last Hash: </span>
            <span className="font-bold">{commitHash}</span>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
