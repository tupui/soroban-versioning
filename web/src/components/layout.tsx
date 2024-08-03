import { Events } from "../web3/events";
import { GetCommit } from "../web3/get-commit";
import { RegisterRepo } from "../web3/register-repo";
import { Navbar } from "./navbar";

export function Layout() {
  return (
    <div className="bg-white h-[100vh] w-[100vw]">
      <Navbar />
      <Events />
      <RegisterRepo />
      <GetCommit />
    </div>
  );
}
