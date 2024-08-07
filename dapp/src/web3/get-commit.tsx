import {
  useRegisteredContract,
  WrappedContract,
} from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { getCommit } from "../lib/get-commit";

export function GetCommit() {
  const sorobanContext = useSorobanReact();
  const contract = useRegisteredContract("versioning") as WrappedContract;
  const projectId = new Uint8Array([
    154, 252, 222, 74, 217, 43, 29, 68, 231, 69, 123, 243, 128, 203, 176, 248,
    239, 30, 179, 243, 81, 126, 231, 183, 47, 67, 190, 183, 195, 188, 2, 172,
  ]);

  const onClick = async () => {
    await getCommit(sorobanContext, contract, projectId);
  };

  return (
    <div>
      <button className="btn" onClick={onClick}>Get Commit</button>
    </div>
  );
}
