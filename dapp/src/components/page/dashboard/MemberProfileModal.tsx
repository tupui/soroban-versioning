import type { FC } from "react";
import { useState, useEffect } from "react";
import Modal, { type ModalProps } from "components/utils/Modal";
import Button from "components/utils/Button";
import type { Member, Badge } from "../../../../packages/tansu";
import { Buffer } from "buffer";
import { getIpfsBasicLink } from "utils/utils";
import Markdown from "markdown-to-jsx";
import { truncateMiddle } from "../../../utils/utils";
import { connectedPublicKey } from "../../../utils/store";

interface Props extends ModalProps {
  member: Member;
}

interface ProfileData {
  name: string;
  description: string;
  social: string;
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

const MemberProfileModal: FC<Props> = ({ onClose, member }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidMetadata, setHasValidMetadata] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      // Check if member has valid metadata (not empty, not just a space)
      if (member.meta && member.meta.trim() && member.meta.trim() !== " ") {
        try {
          setIsLoading(true);
          const ipfsUrl = getIpfsBasicLink(member.meta);

          // Fetch profile.json
          const profileResponse = await fetch(`${ipfsUrl}/profile.json`);
          if (profileResponse.ok) {
            const data = await profileResponse.json();
            setProfileData(data);
            setHasValidMetadata(true);
          }

          // Set profile image URL - try both extensions
          const imageExtensions = ["jpg", "jpeg", "png"];
          for (const ext of imageExtensions) {
            const imageUrl = `${ipfsUrl}/profile-image.${ext}`;
            try {
              const response = await fetch(imageUrl, { method: "HEAD" });
              if (response.ok) {
                setProfileImageUrl(imageUrl);
                break;
              }
            } catch (e) {
              // Continue to next extension
            }
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          // Check if it's legacy metadata (not an IPFS CID)
          if (!member.meta.match(/^bafy/)) {
            setHasValidMetadata(true);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [member.meta]);

  const noBadges = member.projects.every((p) => p.badges.length === 0);

  // Get the connected public key
  const publicKey = connectedPublicKey.get();
  
  // Handle disconnect button click
  const handleDisconnect = () => {
    window.dispatchEvent(new CustomEvent("walletDisconnected"));
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-primary text-center">Profile</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-5">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Profile Image */}
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={profileData?.name || "Profile"}
                className="w-28 h-28 rounded-full object-cover border-4 border-primary"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-zinc-200 flex items-center justify-center">
                <span className="text-4xl text-zinc-500">👤</span>
              </div>
            )}

            {/* Name and Address */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-primary">
                {profileData?.name || "Anonymous"}
              </h3>
              <p className="text-sm text-secondary mt-1">
                {truncateMiddle(publicKey || "", 13)}
              </p>
              {profileData?.social && (
                <a
                  href={profileData.social}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-1 block"
                >
                  {profileData.social.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>

            {/* Description - Only show if exists */}
            {profileData?.description && (
              <div className="w-full mt-2">
                <h4 className="text-lg font-semibold text-primary mb-2 text-center">
                  About
                </h4>
                <div className="prose prose-sm max-w-none text-secondary bg-zinc-50 p-3 rounded-lg">
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

            {/* Badges Section */}
            <div className="w-full border-t pt-4 mt-2">
              <h4 className="text-lg font-semibold text-primary mb-3 text-center">
                Badges
              </h4>
              {noBadges ? (
                <p className="text-base text-secondary text-center">
                  No badges earned yet
                </p>
              ) : (
                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                  {member.projects?.map((proj, idx) => (
                    <div key={idx} className="border p-3 rounded-lg bg-zinc-50">
                      <p className="font-medium text-primary mb-2 text-sm break-words text-center">
                        Project:{" "}
                        {Buffer.from(proj.project).toString("hex").slice(0, 16)}...
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {proj.badges.map((b, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-primary text-white text-xs rounded-full"
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

            {/* Action Buttons */}
            <div className="flex w-full justify-between gap-3 mt-4 pt-4 border-t">
              <Button 
                type="tertiary" 
                onClick={handleDisconnect} 
                className="bg-red-500 text-white hover:bg-red-600 w-full"
              >
                Disconnect
              </Button>
              <Button type="secondary" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MemberProfileModal;
