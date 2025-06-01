import { useState, useEffect } from "react";
import Button from "./utils/Button.tsx";
import { getMember } from "../service/ReadContractService.ts";
import { loadedPublicKey } from "../service/walletService.ts";
import { toast } from "../utils/utils.ts";

interface NavbarSearchProps {
  onAddProject: () => void;
}

const NavbarSearch = ({ onAddProject }: NavbarSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");

  // Store the original URL when the component mounts
  useEffect(() => {
    // Save the complete URL (path + query parameters) when starting a search from a different page
    if (window.location.pathname !== "/") {
      // Save full URL including query parameters
      setOriginalUrl(window.location.pathname + window.location.search);
    } else {
      // Check if we have a referrer that's from the same origin
      const referrer = document.referrer;
      if (
        referrer &&
        referrer.includes(window.location.origin) &&
        !referrer.endsWith("/")
      ) {
        try {
          const referrerUrl = new URL(referrer);
          // Store the full path with query parameters
          setOriginalUrl(referrerUrl.pathname + referrerUrl.search);
        } catch (e) {
          console.error("Error parsing referrer URL:", e);
        }
      }

      // Check if we have a 'from' parameter in the URL
      const searchParams = new URLSearchParams(window.location.search);
      const fromUrl = searchParams.get("from");
      if (fromUrl) {
        setOriginalUrl(fromUrl);
      }
    }

    // Initialize search term from URL on component mount
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlSearchTerm = searchParams.get("search");
      if (urlSearchTerm) {
        setSearchTerm(urlSearchTerm);
      }
    } catch (error) {
      console.error("Error parsing search params:", error);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) return;

    // Save current URL before searching if not home
    if (window.location.pathname !== "/") {
      // Include full path and query parameters
      setOriginalUrl(window.location.pathname + window.location.search);
    }

    // Check if the search term looks like a Stellar address (starts with G and has appropriate length)
    const isStellarAddress =
      searchTerm.startsWith("G") && searchTerm.length >= 56;

    if (isStellarAddress) {
      // Use the community search logic
      if (window.location.pathname === "/") {
        // On home page - search directly
        window.dispatchEvent(
          new CustomEvent("search-member", { detail: searchTerm }),
        );
      } else {
        // On other pages - redirect with search parameter
        // Encode the complete URL including path and query parameters
        const currentFullUrl =
          window.location.pathname + window.location.search;
        window.location.href = `/?search=${encodeURIComponent(searchTerm)}&member=true&from=${encodeURIComponent(currentFullUrl)}`;
      }
    } else {
      // Use the project search logic
      if (window.location.pathname === "/") {
        // On home page - dispatch event directly
        window.dispatchEvent(
          new CustomEvent("search-projects", { detail: searchTerm }),
        );
      } else {
        // On other pages - redirect with search parameter and remember the origin page with its full URL
        const currentFullUrl =
          window.location.pathname + window.location.search;
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
    if (!loadedPublicKey()) {
      // User is not connected, show toast error
      toast.error(
        "Connect Wallet",
        "Please connect your wallet first to add a project",
      );
      return;
    }

    // User is connected, show project creation modal
    document.dispatchEvent(new CustomEvent("show-create-project-modal"));
  };

  const handleClearSearch = () => {
    setSearchTerm("");

    // Check if we need to go back to a previous page
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = searchParams.get("from");

    if (fromUrl) {
      // Navigate back to the original URL with all parameters
      window.location.href = fromUrl;
    } else if (originalUrl) {
      // Navigate back to the stored original URL
      window.location.href = originalUrl;
    } else if (window.location.pathname === "/" && window.location.search) {
      // If we're on the home page with search parameters, refresh to clear the search
      window.location.href = "/";
    }
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-[500px]">
      <div
        className={`search-container relative flex-grow transition-all duration-200 ${isExpanded ? "w-full" : "w-0 md:w-full"}`}
      >
        <div
          className={`flex items-center border border-zinc-800 transition-all duration-200 ${isExpanded ? "w-full" : "w-0 md:w-full overflow-hidden"}`}
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
            className="w-full font-firacode text-base leading-5 p-[10px] pl-2 pr-8 border-none outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          {searchTerm && (
            <div
              className="absolute right-[10px] top-1/2 transform -translate-y-1/2 cursor-pointer"
              onClick={handleClearSearch}
              title="Clear search"
            >
              <img
                src="/icons/cancel.svg"
                width={16}
                height={16}
                className="icon-cancel"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile search icon */}
      <div
        className="md:hidden flex-shrink-0 cursor-pointer"
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
        type="quaternary"
        order="secondary"
        icon="/icons/plus-fill.svg"
        className={`px-[15px] py-[8px] whitespace-nowrap transition-all duration-200 ${isExpanded ? "hidden md:block" : "block"}`}
        onClick={handleAddProject}
        title={
          loadedPublicKey() ? "Add Project" : "Connect wallet to add project"
        }
      >
        <p className="text-base leading-5 hidden sm:block">Add Project</p>
      </Button>
    </div>
  );
};

export default NavbarSearch;
