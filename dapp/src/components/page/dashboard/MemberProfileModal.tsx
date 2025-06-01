import type { FC } from "react";
import { useState, useEffect } from "react";
import Modal, { type ModalProps } from "components/utils/Modal";
import Button from "components/utils/Button";
import type { Member, Badge, Project } from "../../../../packages/tansu";
import { Buffer } from "buffer";
import { getIpfsBasicLink } from "utils/utils";
import Markdown from "markdown-to-jsx";
import { truncateMiddle } from "../../../utils/utils";
import { connectedPublicKey } from "../../../utils/store";
import { toast } from "../../../utils/utils";
import { getProjectFromId } from "../../../service/ReadContractService";
import { navigate } from "astro:transitions/client";

const network = import.meta.env.SOROBAN_NETWORK || 'testnet';

interface Props extends ModalProps {
  member: Member | null;
  // The Stellar address of the member
  address?: string;
}

interface ProfileData {
  name: string;
  description: string;
  social: string;
}

interface ProjectWithName {
  name: string;
  badges: Array<Badge>;
  projectId: Buffer;
}

const badgeName = (b: Badge) => {
  switch (b) {
    case 10000000:
      return "Developer";
    case 5000000:
      return "Triage";
    case 1000000:
      return "Community";
    case 500000:
      return "Verified";
    case 1:
      return "Default";
    default:
      return b.toString();
  }
};

const MemberProfileModal: FC<Props> = ({ onClose, member, address }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidMetadata, setHasValidMetadata] = useState(false);
  const [projectsWithNames, setProjectsWithNames] = useState<ProjectWithName[]>([]);

  // Use the address prop directly or extract the address from the search query if needed
  const memberAddress = address || "";

  const handleCopyAddress = () => {
    if (memberAddress) {
      navigator.clipboard.writeText(memberAddress);
      toast.success("Copied", "Address copied to clipboard");
    }
  };

  // Navigate to project page
  const navigateToProject = (projectName: string) => {
    navigate(`/project?name=${encodeURIComponent(projectName)}`);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      // Check if member exists and has valid metadata
      if (member && member.meta && member.meta.trim() && member.meta.trim() !== " ") {
        try {
          setIsLoading(true);
          const ipfsUrl = getIpfsBasicLink(member.meta);
          
          // Add a small delay to avoid too many concurrent requests
          const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal
              });
              clearTimeout(id);
              return response;
            } catch (error) {
              clearTimeout(id);
              throw error;
            }
          };

          // Fetch profile.json
          try {
            // Try first path format (with trailing slash from the base URL)
            const profileResponse = await fetchWithTimeout(`${ipfsUrl}/profile.json`);
            
            if (profileResponse.ok) {
              const data = await profileResponse.json();
              setProfileData(data);
              setHasValidMetadata(true);
            } else if (ipfsUrl.endsWith('/')) {
              // If URL already has trailing slash, try without additional slash
              const altProfileResponse = await fetchWithTimeout(`${ipfsUrl}profile.json`);
              if (altProfileResponse.ok) {
                const data = await altProfileResponse.json();
                setProfileData(data);
                setHasValidMetadata(true);
              }
            }
          } catch (error) {
            console.log("Failed to fetch profile data:", error);
          }

          // Instead of checking with HEAD requests which cause 404 errors in console,
          // we'll set a default image URL and handle errors in the img tag's onError handler
          if (ipfsUrl) {
            // Check if URL already has trailing slash
            if (ipfsUrl.endsWith('/')) {
              setProfileImageUrl(`${ipfsUrl}profile-image.png`);
            } else {
              setProfileImageUrl(`${ipfsUrl}/profile-image.png`);
            }
          }
        } catch (error) {
          console.log("Error fetching profile data:", error);
          
          // Check if it's legacy metadata (not an IPFS CID)
          if (member.meta && !member.meta.match(/^(bafy|Qm)/)) {
            setHasValidMetadata(true);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    const fetchProjectNames = async () => {
      if (!member || !member.projects || member.projects.length === 0) {
        return;
      }

      const projectsWithNamesPromises = member.projects.map(async (proj) => {
        try {
          const projectData = await getProjectFromId(proj.project);
          return {
            name: projectData?.name || 'Unknown Project',
            badges: proj.badges,
            projectId: proj.project
          };
        } catch (error) {
          return {
            name: 'Unknown Project',
            badges: proj.badges,
            projectId: proj.project
          };
        }
      });

      const projects = await Promise.all(projectsWithNamesPromises);
      setProjectsWithNames(projects);
    };

    if (member) {
      fetchProfileData();
      fetchProjectNames();
    } else {
      setIsLoading(false);
    }
  }, [member]);

  // Remove the complex avatar generation and use a simpler approach
  const getInitialLetter = (name: string | undefined): string => {
    if (!name || name === 'Anonymous') return 'A';
    return name.charAt(0).toUpperCase();
  };

  // Get the connected public key
  const publicKey = connectedPublicKey.get();

  // Handle disconnect button click
  const handleDisconnect = () => {
    window.dispatchEvent(new CustomEvent("walletDisconnected"));
    onClose();
    // Force reload and navigate to main page
    window.location.href = "/";
  };

  // Handle registration button click
  const handleRegister = () => {
    // Show registration modal or redirect to registration page
    onClose();
    // Dispatch event to show join community modal with the address
    window.dispatchEvent(new CustomEvent("openJoinCommunity", { 
      detail: { address: memberAddress } 
    }));
  };

  // Address display component with copy functionality
  const AddressDisplay = ({ address }: { address: string }) => {
    if (!address) return null;
    
    // Create link to Stellar Expert explorer for the address using the correct network
    const explorerUrl = `https://stellar.expert/explorer/${network}/account/${address}`;
    
    return (
      <div className="mt-2 w-full">
        <div className="p-[8px_12px] flex items-center justify-between bg-[#FFEFA8] rounded-md">
          <div className="flex-grow text-center">
            <p className="text-sm font-mono text-primary overflow-hidden">
              {truncateMiddle(address, 20)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={handleCopyAddress}
              className="hover:opacity-70 transition-opacity"
              title="Copy address to clipboard"
            >
              <img src="/icons/clipboard.svg" alt="Copy" width={16} height={16} />
            </button>
            <a 
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              title="View on Stellar Explorer"
            >
              <img src="/icons/link.svg" alt="View on Explorer" width={16} height={16} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  // If member is null, show registration message
  if (!member) {
    return (
      <Modal onClose={onClose}>
        <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
          <h2 className="text-xl font-bold text-primary text-center">Member Not Registered</h2>
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-200 flex items-center justify-center">
              <span className="text-3xl text-zinc-500">❓</span>
            </div>
            
            {memberAddress && <AddressDisplay address={memberAddress} />}
            
            <div className="text-center mt-1">
              <p className="text-sm sm:text-base text-secondary mb-1">
                This member hasn't registered on the platform yet.
              </p>
              <p className="text-sm sm:text-base text-secondary">
                To participate in the community, please register first.
              </p>
            </div>
            
            <div className="flex w-full justify-between gap-2 sm:gap-3 mt-3">
              <Button
                type="primary"
                onClick={handleRegister}
                className="w-full"
              >
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // If member exists, proceed with normal rendering
  const noBadges = member.projects.every((p) => p.badges.length === 0);

  return (
    <Modal onClose={onClose} fullWidth>
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full">
          <div className="flex flex-col items-center gap-3 sm:gap-4 md:w-1/3">
            {/* Profile Image */}
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={profileData?.name || "Profile"}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-3 border-primary"
                onError={(e) => {
                  const imgElement = e.currentTarget;
                  const currentSrc = imgElement.src;
                  
                  // Parse the URL to check path structure
                  let baseUrl = currentSrc.substring(0, currentSrc.lastIndexOf('/'));
                  const hasTrailingSlash = baseUrl.endsWith('/');
                  
                  // If path already has double slash (url/ + /profile-image.png), fix it
                  if (baseUrl.endsWith('/') && currentSrc.includes('//profile-image')) {
                    baseUrl = baseUrl.slice(0, -1);
                  }
                  
                  // Try different formats if the current one fails
                  if (currentSrc.endsWith('profile-image.png')) {
                    // Try jpg next
                    imgElement.src = hasTrailingSlash 
                      ? `${baseUrl}profile-image.jpg` 
                      : `${baseUrl}/profile-image.jpg`;
                  } else if (currentSrc.includes('profile-image.jpg')) {
                    // Try jpeg next
                    imgElement.src = hasTrailingSlash 
                      ? `${baseUrl}profile-image.jpeg` 
                      : `${baseUrl}/profile-image.jpeg`;
                  } else if (currentSrc.includes('profile-image.jpeg')) {
                    // If all formats fail, hide the image and show fallback
                    imgElement.style.display = 'none';
                    setProfileImageUrl('');
                  }
                }}
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-3xl md:text-4xl font-semibold text-indigo-700">
                  {getInitialLetter(profileData?.name)}
                </span>
              </div>
            )}

            {/* Name and Address */}
            <div className="text-center w-full">
              <h3 className="text-xl sm:text-2xl font-semibold text-primary">
                {profileData?.name || "Anonymous"}
              </h3>
              
              {memberAddress && <AddressDisplay address={memberAddress} />}
              
              {profileData?.social && (
                <a
                  href={profileData.social}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base text-blue-500 hover:underline mt-2 block"
                >
                  {profileData.social.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex w-full justify-between gap-2 sm:gap-3 mt-2 sm:mt-4">
              {publicKey === memberAddress && (
                <Button
                  type="primary"
                  onClick={handleDisconnect}
                  className="bg-red-500 text-white hover:bg-red-600 w-full border-0"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3 flex flex-col gap-4">
            {/* Description - Only show if exists */}
            {profileData?.description && (
              <div className="w-full">
                <h4 className="text-base sm:text-lg font-semibold text-primary mb-1 sm:mb-2">
                  About
                </h4>
                <div className="prose prose-sm sm:prose-base max-w-none text-secondary bg-zinc-50 p-3 sm:p-4 rounded">
                  <Markdown
                    options={{
                      overrides: {
                        p: {
                          props: {
                            className: "text-secondary mb-2",
                          },
                        },
                        a: {
                          props: {
                            className: "text-blue-500 hover:underline",
                          },
                        },
                        h1: {
                          props: {
                            className: "text-xl font-bold text-primary mb-2",
                          },
                        },
                        h2: {
                          props: {
                            className: "text-lg font-bold text-primary mb-2",
                          },
                        },
                        h3: {
                          props: {
                            className: "text-base font-bold text-primary mb-2",
                          },
                        },
                        ul: {
                          props: { className: "list-disc ml-5 text-secondary" },
                        },
                        ol: {
                          props: {
                            className: "list-decimal ml-5 text-secondary",
                          },
                        },
                      },
                    }}
                  >
                    {profileData.description}
                  </Markdown>
                </div>
              </div>
            )}

            {/* Engagement Section (previously Badges) */}
            <div className="w-full">
              <h4 className="text-base sm:text-lg font-semibold text-primary mb-1 sm:mb-2">
                Engagement
              </h4>
              {noBadges ? (
                <p className="text-sm sm:text-base text-secondary">
                  No engagement with any projects yet
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {projectsWithNames.map((proj, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors rounded"
                      onClick={() => navigateToProject(proj.name)}
                    >
                      <p className="font-medium text-primary mb-2 text-sm sm:text-base text-center">
                        {proj.name}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {proj.badges.map((b, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 sm:px-3 sm:py-1 bg-primary text-white text-xs sm:text-sm rounded"
                          >
                            {badgeName(b)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MemberProfileModal;
