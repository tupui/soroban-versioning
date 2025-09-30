import { useState, useEffect, useRef } from "react";
import { getCurrentNetwork, setCurrentNetwork, networks, type NetworkName } from "../../../utils/networks";

export default function NetworkPicker() {
  const [selected, setSelected] = useState<NetworkName>("testnet");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(getCurrentNetwork());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchNetwork(network: NetworkName) {
    setSelected(network);
    setCurrentNetwork(network);
    setIsOpen(false);
    window.location.reload();
  }

  const isMainnet = selected === "mainnet";
  const statusColor = isMainnet ? "bg-green-500" : "bg-yellow-500";
  const statusBg = isMainnet ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
  const statusText = isMainnet ? "Live" : "Test";

  return (
    <div className="relative ml-[1em]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-300 rounded-lg shadow-sm hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 min-w-[120px]"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium text-primary">
            {networks[selected].name}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${statusBg}`}>
            {statusText}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {Object.entries(networks).map(([key, config]) => {
              const networkKey = key as NetworkName;
              const active = networkKey === selected;
              const isLive = networkKey === "mainnet";
              
              return (
                <button
                  key={key}
                  onClick={() => switchNetwork(networkKey)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 ${
                    active ? "bg-purple-50 border-r-2 border-primary" : ""
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500" : "bg-yellow-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${active ? "text-primary" : "text-zinc-700"}`}>
                        {config.name}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${
                        isLive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {isLive ? "Live" : "Test"}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {isLive ? "Production network" : "Development network"}
                    </div>
                  </div>
                  {active && (
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}