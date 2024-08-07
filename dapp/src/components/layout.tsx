import { useSorobanReact } from "@soroban-react/core";
import { GetCommit } from "../web3/get-commit";
import { Navbar } from "./navbar";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function Layout() {
  const { address } = useSorobanReact();
  const navigate = useNavigate();

  useEffect(() => {
    if (!address) {
      navigate("/");
    }
  }, [address, navigate]);

  return (
    <div className="bg-neutral h-[100vh] w-[100vw]">
      <Navbar />
      <Outlet />
    </div>
  );
}
