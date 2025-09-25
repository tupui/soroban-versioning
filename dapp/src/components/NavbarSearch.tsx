import { useState, useEffect } from "react";
import Button from "./utils/Button";

import { loadedPublicKey } from "../service/walletService";
import { toast } from "../utils/utils";

interface NavbarSearchProps {
  _onAddProject: () => void;
}

// Constants for URL handling
const HOME_PATH = "/";

const NavbarSearch = ({ _onAddProject }: NavbarSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
      } catch {
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
    } catch {
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
    setIsSearchFocused(false);

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
    <div className="flex items-center gap-6 w-full">
      {/* Mobile: Expandable search that takes full width when focused */}
      <div
        className={`search-container relative transition-all duration-300 ease-in-out ${
          isSearchFocused || searchTerm ? "w-full" : "flex-1"
        }`}
      >
        <div className="flex items-center border border-zinc-800 h-10 md:h-12 bg-white rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-300 w-full">
          <div className="flex-shrink-0 pl-4">
            <img
              src="/icons/search.svg"
              width={16}
              height={16}
              className="icon-search text-gray-400"
              alt="Search"
            />
          </div>
          <input
            type="text"
            placeholder="Search projects or community..."
            className="w-full h-full font-firacode text-sm md:text-base leading-6 px-3 border-none outline-none bg-transparent placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // Keep focused state if there's text, otherwise unfocus
              if (!searchTerm) {
                setIsSearchFocused(false);
              }
            }}
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer p-2 hover:bg-gray-100 rounded transition-colors"
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

      {/* Add Project button - always visible on desktop, conditionally hidden on mobile when searching */}
      <div
        className={`ml-6 transition-all duration-300 ease-in-out ${
          isSearchFocused || searchTerm ? "hidden md:block" : "block"
        }`}
      >
        <Button
          type="primary"
          order="secondary"
          className="h-8 md:h-10 lg:h-12 px-3 md:px-4 lg:px-6 whitespace-nowrap transition-all duration-200 flex items-center justify-center text-xs md:text-sm lg:text-base font-medium"
          onClick={handleAddProject}
          title={buttonTitle}
          size="sm"
        >
          <span className="text-xs md:text-sm lg:text-base font-medium">
            + Add Project
          </span>
        </Button>
      </div>
    </div>
  );
};

export default NavbarSearch;
