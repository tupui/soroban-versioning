import { Events } from "../web3/events";
import { Navbar } from "./navbar";

export function Layout() {
  return (
    <div className="bg-white h-[100vh] w-[100vw]">
      <Navbar />
      <Events />
    </div>
  );
}
