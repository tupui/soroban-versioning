import { useState, useEffect } from "react";
import Button from "./utils/Button";

import { loadedPublicKey } from "../service/walletService";
import { toast } from "../utils/utils";

// Constants for URL handling
const HOME_PATH = "/";

const NavbarSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(
    () => !!loadedPublicKey(),
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);

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
    if (window.location.pathname !== HOME_PATH) {
      setOriginalUrl(window.location.pathname + window.location.search);
      return;
    }

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

  const performClearNavigation = () => {
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
      window.history.pushState({}, "", HOME_PATH);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      performClearNavigation();
      return;
    }

    if (window.location.pathname !== HOME_PATH) {
      setOriginalUrl(window.location.pathname + window.location.search);
    }

    const isStellarAddress =
      searchTerm.startsWith("G") && searchTerm.length >= 56;

    const isOnHomePage = window.location.pathname === HOME_PATH;
    const currentFullUrl = window.location.pathname + window.location.search;

    if (isStellarAddress) {
      if (isOnHomePage) {
        const url = new URL(window.location.href);
        url.searchParams.set("search", searchTerm);
        url.searchParams.set("member", "true");
        window.history.pushState({}, "", url.toString());
        window.dispatchEvent(
          new CustomEvent("search-member", { detail: searchTerm }),
        );
      } else {
        window.location.href = `/?search=${encodeURIComponent(
          searchTerm,
        )}&member=true&from=${encodeURIComponent(currentFullUrl)}`;
      }
    } else {
      if (isOnHomePage) {
        const url = new URL(window.location.href);
        url.searchParams.set("search", searchTerm);
        url.searchParams.delete("member");
        window.history.pushState({}, "", url.toString());
        window.dispatchEvent(
          new CustomEvent("search-projects", { detail: searchTerm }),
        );
      } else {
        window.location.href = `/?search=${encodeURIComponent(
          searchTerm,
        )}&from=${encodeURIComponent(currentFullUrl)}`;
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
    performClearNavigation();
  };

  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  const buttonTitle = isWalletConnected
    ? "Add Project"
    : "Connect wallet to add project";

  return (
    <div className="flex items-center gap-3 md:gap-6 w-full">
      {/* MOBILE VERSION */}
      <div className="md:hidden flex items-center gap-3 w-full">
        {/* Mobile: Search icon toggle button */}
        <button
          onClick={toggleSearchVisibility}
          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle search"
          title="Search"
        >
          <img
            src="/icons/search.svg"
            width={20}
            height={20}
            className="icon-search text-gray-400"
            alt="Search"
          />
        </button>

        {/* Mobile: Search bar */}
        {isSearchVisible && (
          <>
            <div className="search-container relative flex-1">
              <div
                className={`flex items-center border ${
                  isSearchFocused
                    ? "border-primary ring-2 ring-primary"
                    : "border-zinc-800"
                } h-10 bg-white rounded-lg shadow-sm transition-all duration-300 w-full`}
              >
                <input
                  type="text"
                  placeholder="Search projects or community..."
                  className="search-input min-w-[70px] w-full h-full font-firacode text-sm leading-6 px-4 border-none outline-none bg-transparent placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    if (!searchTerm) {
                      setIsSearchFocused(false);
                    }
                  }}
                />
              </div>
            </div>

            {/* Close search */}
            <button
              onClick={() => {
                setSearchTerm("");
                toggleSearchVisibility();
              }}
              className="hidden md:flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close and clear search"
              title="Close and clear search"
            >
              <img
                src="/icons/cancel.svg"
                width={20}
                height={20}
                className="icon-cancel"
                alt="Close and clear"
              />
            </button>
          </>
        )}

        {/* Mobile: Add Project button (ONLY if connected) */}
        {!isSearchVisible && isWalletConnected && (
          <Button
            type="primary"
            order="secondary"
            className="ml-auto h-8 px-3 whitespace-nowrap transition-all duration-200 flex items-center justify-center text-xs font-medium"
            onClick={handleAddProject}
            title={buttonTitle}
            size="sm"
          >
            <span className="text-xs font-medium">+ Add Project</span>
          </Button>
        )}
      </div>

      {/* DESKTOP VERSION */}
      <div className="hidden md:flex items-center gap-6 w-full">
        {/* Desktop: Search bar */}
        <div className="search-container relative flex-1">
          <div className="flex items-center border border-zinc-800 h-12 bg-white rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-300 w-full">
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
              className="search-input w-full h-full font-firacode text-base leading-6 px-3 border-none outline-none bg-transparent placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
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

        {/* Desktop: Add Project button (always visible, toast guards) */}
        <Button
          type="primary"
          order="secondary"
          className="h-10 lg:h-12 px-4 lg:px-6 whitespace-nowrap transition-all duration-200 flex items-center justify-center text-sm lg:text-base font-medium"
          onClick={handleAddProject}
          title={buttonTitle}
          size="sm"
        >
          <span className="text-sm lg:text-base font-medium">
            + Add Project
          </span>
        </Button>
      </div>
    </div>
  );
};

export default NavbarSearch;
