import type { FC } from "react";
import { useState, useEffect } from "react";
import Modal, { type ModalProps } from "components/utils/Modal";
import Button from "components/utils/Button";
import type { Member, Badge } from "../../../../packages/tansu";
import { getIpfsBasicLink, fetchJSONFromIPFS } from "utils/ipfsFunctions";
import Markdown from "markdown-to-jsx";
import { truncateMiddle } from "../../../utils/utils";
import { connectedPublicKey } from "../../../utils/store";

import { getProjectFromId } from "../../../service/ReadContractService";
import { navigate } from "astro:transitions/client";
import { getStellarExplorerURL } from "../../../utils/urls";
import CopyButton from "components/utils/CopyButton";
import { Buffer } from "buffer";
import OnChainActions from "./OnChainActions";
import { badgeName } from "../../../utils/badges";

interface Props extends ModalProps {
  member: Member | null;
  // The Stellar address of the member
  address?: string;
}

interface ProfileData {
  name: string;
  description: string;
  social: string;
  image?: string; // optional path to profile image inside the IPFS directory
}

interface ProjectWithName {
  name: string;
  badges: Array<Badge>;
  projectId: Buffer;
}

const MemberProfileModal: FC<Props> = ({ onClose, member, address }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidMetadata, setHasValidMetadata] = useState(false);
  const [projectsWithNames, setProjectsWithNames] = useState<ProjectWithName[]>(
    [],
  );

  // Use the address prop directly or extract the address from the search query if needed
  const memberAddress = address || "";

  // Navigate to project page
  const navigateToProject = (projectName: string) => {
    navigate(`/project?name=${encodeURIComponent(projectName)}`);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      // Check if member exists and has valid metadata
      if (
        member &&
        member.meta &&
        typeof member.meta === "string" &&
        member.meta.trim() &&
        member.meta.trim() !== " "
      ) {
        try {
          setIsLoading(true);

          // Validate that meta is a proper IPFS CID before attempting to fetch
          const validCidPattern = /^(bafy|Qm)[a-zA-Z0-9]{44,}$/;
          if (!validCidPattern.test(member.meta)) {
            // Invalid CID format, nothing to fetch
            setIsLoading(false);
            return;
          }

          const ipfsUrl = getIpfsBasicLink(member.meta);
          if (!ipfsUrl) {
            setIsLoading(false);
            return;
          }

          // Fetch profile.json
          try {
            // Standard path format
            const profileUrl = `${ipfsUrl}/profile.json`;
            const profileData = await fetchJSONFromIPFS(profileUrl);

            if (profileData) {
              setProfileData(profileData);
              setHasValidMetadata(true);

              // Determine profile image path
              if (profileData.image && typeof profileData.image === "string") {
                setProfileImageUrl(`${ipfsUrl}/${profileData.image}`);
              }
            }
          } catch {
            // Silent failure - this is an expected case for missing profile data
          }

          // If not already set from profile.json, try the standard file name pattern
          if (!profileImageUrl) {
            const exts = ["png", "jpg", "jpeg"];
            let found = false;
            exts.forEach((ext, idx) => {
              const candidate = `${ipfsUrl}/profile-image.${ext}`;
              // First extension becomes optimistic default so the UI loads quickly
              if (idx === 0) setProfileImageUrl(candidate);

              const img = new Image();
              img.src = candidate;
              img.onload = () => {
                if (!found) {
                  found = true;
                  setProfileImageUrl(candidate);
                }
              };
            });
          }
        } catch {
          // Silent error handling
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
            name: projectData?.name || "Unknown Project",
            badges: proj.badges,
            projectId: proj.project,
          };
        } catch {
          return {
            name: "Unknown Project",
            badges: proj.badges,
            projectId: proj.project,
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

  // Get the initial letter for the avatar
  const getInitialLetter = (name: string | undefined): string => {
    if (!name || name === "Anonymous") return "A";
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
    window.dispatchEvent(
      new CustomEvent("openJoinCommunity", {
        detail: { address: memberAddress },
      }),
    );
  };

  // Address display component with copy functionality
  const AddressDisplay = ({ address }: { address: string }) => {
    const explorerUrl = getStellarExplorerURL(address);

    return (
      <div className="mt-1 bg-zinc-50 p-2 rounded flex items-center gap-2 w-full">
        <div className="flex-grow text-center">
          <p className="text-sm font-mono text-primary overflow-hidden">
            {truncateMiddle(address, 20)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyButton
            textToCopy={address}
            size="sm"
            className="hover:opacity-70 transition-opacity"
          />
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
            title="View on Stellar Explorer"
          >
            <img
              src="/icons/link.svg"
              alt="View on Explorer"
              width={16}
              height={16}
            />
          </a>
        </div>
      </div>
    );
  };

  // If member is null, show registration message
  if (!member) {
    return (
      <Modal onClose={onClose}>
        <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
          <h2 className="text-xl font-bold text-primary text-center">
            Member Not Registered
          </h2>

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
                onError={() => {
                  // If image fails to load, just hide it and show fallback
                  setProfileImageUrl("");
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

              {/* IPFS metadata link */}
              {member?.meta && hasValidMetadata && (
                <a
                  href={getIpfsBasicLink(member.meta)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-sm sm:text-base text-blue-500 hover:underline mt-2"
                >
                  <img
                    src="/icons/ipfs.svg"
                    alt="IPFS"
                    width={16}
                    height={16}
                  />
                  <span>View on IPFS</span>
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
                Community Engagements
              </h4>
              {noBadges ? (
                <p className="text-sm sm:text-base text-secondary">
                  No community engagement with any projects yet
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

            {/* On-chain Actions List */}
            {address && (
              <div className="mt-6">
                <h4 className="text-base sm:text-lg font-semibold text-primary mb-1 sm:mb-2">
                  On-chain Activity
                </h4>
                <OnChainActions
                  address={address}
                  projectCache={Object.fromEntries(
                    projectsWithNames.map((p) => [
                      Buffer.from(p.projectId).toString("hex"),
                      p.name,
                    ]),
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MemberProfileModal;
