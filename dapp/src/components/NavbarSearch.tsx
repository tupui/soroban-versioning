import { useState, useEffect } from "react";
import Button from "./utils/Button.tsx";
import { getMember } from "../service/ReadContractService.ts";
import { loadedPublicKey } from "../service/walletService.ts";
import { toast } from "../utils/utils.ts";

interface NavbarSearchProps {
  onAddProject: () => void;
}

// Constants for URL handling
const HOME_PATH = "/";

const NavbarSearch = ({ onAddProject }: NavbarSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    saveOriginalUrl();
    initializeSearchTerm();

    // Check wallet connection status on client-side only
    setIsWalletConnected(!!loadedPublicKey());

    // Listen for wallet connection/disconnection events
    const handleWalletConnection = () =>
      setIsWalletConnected(!!loadedPublicKey());
    window.addEventListener("walletConnected", handleWalletConnection);
    window.addEventListener("walletDisconnected", handleWalletConnection);

    return () => {
      window.removeEventListener("walletConnected", handleWalletConnection);
      window.removeEventListener("walletDisconnected", handleWalletConnection);
    };
  }, []);

  // Save the original URL when the component mounts
  const saveOriginalUrl = () => {
    // If not on homepage, save current path with query params
    if (window.location.pathname !== HOME_PATH) {
      setOriginalUrl(window.location.pathname + window.location.search);
      return;
    }

    // Check if we have a referrer from the same origin
    const referrer = document.referrer;
    if (
      referrer &&
      referrer.includes(window.location.origin) &&
      !referrer.endsWith("/")
    ) {
      try {
        const referrerUrl = new URL(referrer);
        setOriginalUrl(referrerUrl.pathname + referrerUrl.search);
      } catch (e) {
        // Silent error handling
      }
    }

    // Check for 'from' parameter in URL
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = searchParams.get("from");
    if (fromUrl) {
      setOriginalUrl(fromUrl);
    }
  };

  // Initialize search term from URL
  const initializeSearchTerm = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlSearchTerm = searchParams.get("search");
      if (urlSearchTerm) {
        setSearchTerm(urlSearchTerm);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    // Save current URL if not on home page
    if (window.location.pathname !== HOME_PATH) {
      setOriginalUrl(window.location.pathname + window.location.search);
    }

    const isStellarAddress =
      searchTerm.startsWith("G") && searchTerm.length >= 56;

    const isOnHomePage = window.location.pathname === HOME_PATH;
    const currentFullUrl = window.location.pathname + window.location.search;

    if (isStellarAddress) {
      // Member search
      if (isOnHomePage) {
        window.dispatchEvent(
          new CustomEvent("search-member", { detail: searchTerm }),
        );
      } else {
        window.location.href = `/?search=${encodeURIComponent(searchTerm)}&member=true&from=${encodeURIComponent(currentFullUrl)}`;
      }
    } else {
      // Project search
      if (isOnHomePage) {
        window.dispatchEvent(
          new CustomEvent("search-projects", { detail: searchTerm }),
        );
      } else {
        window.location.href = `/?search=${encodeURIComponent(searchTerm)}&from=${encodeURIComponent(currentFullUrl)}`;
      }
    }

    // Reset the input after search on mobile
    if (isExpanded) {
      setTimeout(() => setIsExpanded(false), 500);
    }
  };

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddProject = () => {
    if (!isWalletConnected) {
      toast.error(
        "Connect Wallet",
        "Please connect your wallet first to add a project",
      );
      return;
    }

    document.dispatchEvent(new CustomEvent("show-create-project-modal"));
  };

  const handleClearSearch = () => {
    setSearchTerm("");

    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = searchParams.get("from");

    if (fromUrl) {
      window.location.href = fromUrl;
    } else if (originalUrl) {
      window.location.href = originalUrl;
    } else if (
      window.location.pathname === HOME_PATH &&
      window.location.search
    ) {
      window.location.href = HOME_PATH;
    }
  };

  // Use client-side state for button title to ensure consistency between renders
  const buttonTitle = isWalletConnected
    ? "Add Project"
    : "Connect wallet to add project";

  return (
    <div className="flex items-center gap-2 w-full max-w-[500px]">
      <div
        className={`search-container relative flex-grow transition-all duration-200 ${isExpanded ? "w-full" : "w-0 md:w-full"}`}
      >
        <div
          className={`flex items-center border border-zinc-800 h-10 md:h-12 transition-all duration-200 ${isExpanded ? "w-full" : "w-0 md:w-full overflow-hidden"}`}
        >
          <div className="flex-shrink-0 pl-2">
            <img
              src="/icons/search.svg"
              width={16}
              height={16}
              className="icon-search"
            />
          </div>
          <input
            type="text"
            placeholder="Search projects or community..."
            className="w-full h-full font-firacode text-base leading-5 px-2 border-none outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          {searchTerm && (
            <button
              className="absolute right-[10px] top-1/2 transform -translate-y-1/2 cursor-pointer p-1"
              onClick={handleClearSearch}
              type="button"
              title="Clear search"
              aria-label="Clear search"
            >
              <img
                src="/icons/cancel.svg"
                width={16}
                height={16}
                className="icon-cancel"
                alt="Clear"
              />
            </button>
          )}
        </div>
      </div>

      {/* Mobile search icon */}
      <div
        className={`md:hidden flex-shrink-0 cursor-pointer ${isExpanded ? "hidden" : "block"}`}
        onClick={toggleSearch}
      >
        <img
          src="/icons/search.svg"
          width={20}
          height={20}
          className="icon-search"
        />
      </div>

      <Button
        type="primary"
        order="secondary"
        icon="/icons/plus-fill.svg"
        className={`h-10 md:h-12 px-2 sm:px-[15px] whitespace-nowrap transition-all duration-200 flex items-center justify-center ${isExpanded ? "hidden md:flex" : "flex"}`}
        onClick={handleAddProject}
        title={buttonTitle}
        size="xs"
      >
        <span className="hidden sm:inline-block">Add Project</span>
      </Button>
    </div>
  );
};

export default NavbarSearch;
