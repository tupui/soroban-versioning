import { FolderGit2, GitCommit, List } from "lucide-react";
import { Link } from "react-router-dom";

export function RegisterRepoButton() {
  return (
    <Link
      to="/register"
      type="button"
      className="btn h-44 bg-base-100 w-96 shadow-xl"
    >
      <div className="m-2">
        <FolderGit2 className="h-10 w-10" />
      </div>
      <div className="">
        <h2 className="text-xl my-2">Register Repo</h2>
        <p>Add a new repository to Tansu</p>
      </div>
    </Link>
  );
}

export function GetReposButton() {
  return (
    <Link
      to="/repos"
      type="button"
      className="btn h-44 bg-base-100 w-96 shadow-xl mx-2 btn-disabled"
    >
      <div className="m-2">
        <List className="h-10 w-10" />
      </div>
      <div className="">
        <h2 className="text-xl my-2">Get Repos</h2>
        <p>Load registered repositories</p>
      </div>
    </Link>
  );
}

export function GetCommitButton(){
  return (
    <Link
      to="/get-commit"
      type="button"
      className="btn h-44 bg-base-100 w-96 shadow-xl mx-2"
    >
      <div className="m-2">
        <GitCommit className="h-10 w-10" />
      </div>
      <div className="">
        <h2 className="text-xl my-2">Get Last Commit</h2>
        <p>Last commit's hash of a registered repo</p>
      </div>
    </Link>
  );
}
